import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { authMiddleware, AuthRequest } from "../middleware/auth.js";
import * as novofon from "../lib/novofon.js";
import {
  notifyRoleUsers,
  createNotification,
  notifyTaskAssignees,
  notifyTaskCurators,
  notifyTaskCreator,
} from "../lib/notifications.js";
import { sendPushToRoleUsers } from "../lib/push.js";
import { broadcast, CHANNELS } from "../lib/events.js";
import { resolveContactAuto } from "../lib/contact-dedup.js";
import {
  getDefaultTaskAssigneeIds,
  getDefaultTaskCuratorIds,
} from "../lib/task-defaults.js";
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
const router = Router();
const RECORDS_DIR = "/app/uploads/records";
if (!fs.existsSync(RECORDS_DIR)) {
  fs.mkdirSync(RECORDS_DIR, { recursive: true });
}
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
async function downloadRecordWithRetry(
  url: string,
  attempts = 3,
): Promise<Buffer> {
  let lastErr: any = null;
  for (let i = 0; i < attempts; i++) {
    try {
      const fileRes = await fetch(url);
      if (fileRes.ok) return Buffer.from(await fileRes.arrayBuffer());
      lastErr = new Error(`HTTP ${fileRes.status}`);
    } catch (err) {
      lastErr = err;
    }
    if (i < attempts - 1) await sleep(10000 * (i + 1));
  }
  throw lastErr;
}
const adminOnly = (req: AuthRequest, res: any, next: any) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ error: "Требуются права администратора" });
  }
  next();
};
const WebhookBodySchema = z.object({
  event: z.string().optional(),
  pbx_call_id: z.string().optional(),
  call_start: z.string().optional(),
  caller_id: z.string().optional(),
  called_did: z.string().optional(),
  destination: z.string().optional(),
  internal: z.string().optional(),
  duration: z.string().or(z.number()).optional(),
  disposition: z.string().optional(),
  status_code: z.string().optional(),
  is_recorded: z.string().or(z.number()).optional(),
  call_id_with_rec: z.string().optional(),
  "record.url": z.string().optional(),
  transfer_from: z.string().optional(),
  transfer_type: z.string().optional(),
  last_internal: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  text: z.string().optional(),
  timestamp: z.string().optional(),
});
router.post("/webhook", async (req, res) => {
  try {
    console.log("[Novofon Raw Webhook]", JSON.stringify(req.body));
    const body = WebhookBodySchema.parse(req.body);
    const event = body.event;
    const defaultAssignees = await getDefaultTaskAssigneeIds();
    const defaultCurators = await getDefaultTaskCuratorIds();
    console.log(
      "[Novofon Webhook]",
      event,
      body.pbx_call_id || body.from,
      new Date().toISOString(),
    );
    if (!event) {
      return res.status(200).json({ success: true });
    }
    if (event === "SMS_INCOMING" || event === "incoming_sms") {
      const fromNum = normalizePhone(body.from || "");
      const toNum = normalizePhone(body.to || "");
      const text = body.text || "";
      let contactId: string | null = null;
      if (fromNum) {
        const resolved = await resolveContactAuto(
          { phone: fromNum, name: `SMS от ${fromNum}` },
          {
            name: `SMS от ${fromNum}`,
            phone: fromNum,
            type: "lead",
            tags: ["novofon", "sms", "auto"],
          },
        );
        contactId = resolved.contactId;
      }
      const sms = await prisma.smsMessage.create({
        data: {
          from: fromNum,
          to: toNum,
          text,
          contactId,
          receivedAt: body.timestamp ? new Date(body.timestamp) : new Date(),
        },
      });
      const settings = await prisma.telephonySettings.findFirst();
      let smsTaskId: string | null = null;
      if (settings?.autoCreateTaskOnSms && settings?.defaultUserId) {
        const smsTextEsc = text
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;");
        const task = await prisma.task.create({
          data: {
            title: `SMS от ${fromNum}`,
            description: `<p><strong>SMS от:</strong> ${fromNum}</p><p><strong>На номер:</strong> ${toNum}</p><p><strong>Текст:</strong></p><p>${smsTextEsc}</p><p><strong>Время:</strong> ${new Date().toLocaleString("ru-RU")}</p>`,
            status: "open",
            priority: "medium",
            contactId,
            creatorId: settings.defaultUserId,
            assignees: {
              create: Array.from(
                new Set([settings.defaultUserId, ...defaultAssignees]),
              ).map((uid) => ({ userId: uid })),
            },
            curators: defaultCurators.length
              ? { create: defaultCurators.map((uid) => ({ userId: uid })) }
              : undefined,
          },
        });
        smsTaskId = task.id;
        await prisma.smsMessage.update({
          where: { id: sms.id },
          data: { taskId: task.id },
        });
        const { sendPushToTaskAssignees, sendPushToTaskCurators } =
          await import("../lib/push.js");
        sendPushToTaskAssignees(
          task.id,
          {
            title: `Новая SMS — задача`,
            body: `SMS от ${fromNum}: ${text.length > 80 ? text.slice(0, 77) + "..." : text}`,
            url: `/tasks/${task.id}`,
          },
          settings.defaultUserId,
        ).catch(() => {});
        sendPushToTaskCurators(
          task.id,
          {
            title: `Новая SMS — задача`,
            body: `SMS от ${fromNum}: ${text.length > 80 ? text.slice(0, 77) + "..." : text}`,
            url: `/tasks/${task.id}`,
          },
          settings.defaultUserId,
        ).catch(() => {});
      }
      if (settings?.notifyAdminsOnSms) {
        const payload = {
          title: `SMS от ${fromNum}`,
          body: text.length > 100 ? text.slice(0, 97) + "..." : text,
          url: smsTaskId
            ? `/tasks/${smsTaskId}`
            : "/settings?tab=integrations&sub=telephony",
        };
        sendPushToRoleUsers(["admin"], payload, "call").catch(() => {});
        await notifyRoleUsers(["admin"], payload);
      }
      return res.status(200).json({ success: true });
    }
    const callerId = normalizePhone(body.caller_id || "");
    const calledDid = normalizePhone(body.called_did || body.destination || "");
    if (
      !body.pbx_call_id &&
      event !== "SMS_INCOMING" &&
      event !== "incoming_sms"
    ) {
      console.warn("[Novofon] Missing pbx_call_id for event:", event);
      return res
        .status(200)
        .json({ success: true, warning: "missing pbx_call_id" });
    }
    if (
      event === "NOTIFY_START" ||
      event === "NOTIFY_INTERNAL" ||
      event === "NOTIFY_OUT_START"
    ) {
      const isOutgoing = event !== "NOTIFY_START";
      const existing = await prisma.call.findUnique({
        where: { pbxCallId: body.pbx_call_id },
      });
      if (!existing) {
        const settings = await prisma.telephonySettings.findFirst();
        // Для исходящих звонков caller_id — внутренний номер сотрудника,
        // а номер клиента приходит в поле destination
        const clientPhone = isOutgoing
          ? normalizePhone(body.destination || "") || calledDid
          : callerId;
        const employeePhone = isOutgoing ? callerId : "";
        let contactId: string | null = null;
        if (clientPhone) {
          if (settings?.autoCreateContact) {
            const resolved = await resolveContactAuto(
              { phone: clientPhone, name: clientPhone },
              {
                name: clientPhone,
                phone: clientPhone,
                type: "lead",
                tags: ["novofon", "auto"],
              },
            );
            contactId = resolved.contactId;
          } else {
            const contact = await prisma.contact.findFirst({
              where: { phone: { contains: clientPhone.replace("+", "") } },
            });
            if (contact) {
              contactId = contact.id;
            }
          }
        }
        const call = await prisma.call.create({
          data: {
            pbxCallId: body.pbx_call_id || "",
            direction: isOutgoing ? "outgoing" : "incoming",
            callerId: clientPhone || callerId || "unknown",
            calledDid: calledDid || "unknown",
            internal: body.internal || employeePhone || null,
            callStart: body.call_start ? new Date(body.call_start) : new Date(),
            contactId,
            disposition: "in_progress",
          },
        });
        const shouldCreateTask = isOutgoing
          ? settings?.autoCreateTaskOnOutgoing
          : settings?.autoCreateTaskOnIncoming;
        if (shouldCreateTask && settings?.defaultUserId) {
          const directionLabel = isOutgoing ? "Исходящий" : "Входящий";
          // Повторный звонок (входящий или исходящий): если у контакта уже есть
          // незакрытая задача — новая задача не создаётся, звонок привязывается
          // к существующей задаче и на NOTIFY_END в её обсуждение добавляется
          // запись с информацией о звонке
          const existingTask = contactId
            ? await findActiveContactTask(contactId)
            : null;
          if (existingTask) {
            await prisma.call.update({
              where: { id: call.id },
              data: { taskId: existingTask.id, notes: REPEAT_CALL_MARKER },
            });
            console.log(
              `[Novofon] Повторный звонок ${isOutgoing ? "на" : "от"} ${clientPhone} — привязан к задаче ${existingTask.id}, новая задача не создана`,
            );
          } else {
            const task = await prisma.task.create({
              data: {
                title: `${directionLabel} звонок ${isOutgoing ? "на" : "от"} ${clientPhone || callerId || calledDid}`,
                description: `<p><strong>Направление:</strong> ${directionLabel}</p><p><strong>${isOutgoing ? "Кому:" : "От кого:"}</strong> ${clientPhone || callerId}</p><p><strong>На номер:</strong> ${calledDid}</p>${employeePhone ? `<p><strong>Сотрудник (внутр.):</strong> ${employeePhone}</p>` : ""}<p><strong>Время (МСК):</strong> ${mskDateTime(new Date())}</p>`,
                status: "open",
                priority: "medium",
                contactId,
                creatorId: settings.defaultUserId,
                assignees: {
                  create: Array.from(
                    new Set([settings.defaultUserId, ...defaultAssignees]),
                  ).map((uid) => ({ userId: uid })),
                },
                curators: defaultCurators.length
                  ? { create: defaultCurators.map((uid) => ({ userId: uid })) }
                  : undefined,
              },
            });
            await prisma.call.update({
              where: { id: call.id },
              data: { taskId: task.id },
            });
            const { sendPushToTaskAssignees, sendPushToTaskCurators } =
              await import("../lib/push.js");
            sendPushToTaskAssignees(
              task.id,
              {
                title: `Новый звонок — задача`,
                body: `${directionLabel} звонок ${isOutgoing ? "на" : "от"} ${clientPhone || callerId || calledDid}`,
                url: `/tasks/${task.id}`,
              },
              settings.defaultUserId,
            ).catch(() => {});
            sendPushToTaskCurators(
              task.id,
              {
                title: `Новый звонок — задача`,
                body: `${directionLabel} звонок ${isOutgoing ? "на" : "от"} ${clientPhone || callerId || calledDid}`,
                url: `/tasks/${task.id}`,
              },
              settings.defaultUserId,
            ).catch(() => {});
          }
        }
      }
    } else if (event === "NOTIFY_END") {
      const duration =
        typeof body.duration === "string"
          ? parseInt(body.duration, 10)
          : body.duration || 0;
      const isRecorded = body.is_recorded === "1" || body.is_recorded === 1;
      let call: any = null;
      try {
        call = await prisma.call.update({
          where: { pbxCallId: body.pbx_call_id },
          data: {
            duration,
            disposition: mapDisposition(body.disposition || ""),
            statusCode: body.status_code || null,
            isRecorded: !!isRecorded,
            callIdWithRec: body.call_id_with_rec || null,
            callEnd: new Date(),
            internal: body.last_internal || body.internal || undefined,
          },
          include: { task: true, contact: true },
        });
      } catch (err: any) {
        // Стартовое событие не обработалось (например, звонок начался до деплоя) —
        // фиксируем факт конца звонка без задачи, чтобы не падать на каждом повторе
        console.warn(
          "[Novofon] NOTIFY_END для неизвестного звонка:",
          body.pbx_call_id,
        );
        return res.status(200).json({ success: true });
      }
      const isOutgoingCall = call.direction === "outgoing";
      // Повторный звонок, привязанный на NOTIFY_START к существующей незакрытой задаче контакта
      const isRepeatCall = call.notes === REPEAT_CALL_MARKER;
      if (call.disposition === "missed") {
        const settings = await prisma.telephonySettings.findFirst();
        if (settings?.autoCreateTask && settings.defaultUserId) {
          const missedTitle = isOutgoingCall
            ? `Исходящий звонок на ${call.callerId} — не ответил`
            : `Пропущенный звонок от ${call.callerId}`;
          if (call.taskId && !isRepeatCall) {
            await prisma.task.update({
              where: { id: call.taskId },
              data: {
                title: missedTitle,
                priority: "high",
              },
            });
          } else if (!call.taskId) {
            // Пропущенный звонок без задачи: если у контакта есть незакрытая задача —
            // привязываем к ней и добавляем запись в обсуждение, новая задача не создаётся
            let linkedTaskId: string | null = null;
            if (call.contactId) {
              const activeTask = await findActiveContactTask(call.contactId);
              if (activeTask) {
                await prisma.call.update({
                  where: { id: call.id },
                  data: { taskId: activeTask.id },
                });
                await addCallDiscussionEntry(
                  activeTask.id,
                  settings.defaultUserId,
                  {
                    callerId: call.callerId,
                    calledDid: call.calledDid,
                    callStart: call.callStart,
                    durationSec: call.duration,
                    missed: true,
                    direction: isOutgoingCall ? "outgoing" : "incoming",
                  },
                );
                linkedTaskId = activeTask.id;
              }
            }
            if (!linkedTaskId) {
              const task = await prisma.task.create({
                data: {
                  title: missedTitle,
                  description: `<p><strong>${isOutgoingCall ? "Исходящий звонок не состоялся" : "Пропущенный звонок"}</strong></p><p><strong>${isOutgoingCall ? "Кому:" : "От:"}</strong> ${call.callerId}</p><p><strong>На номер:</strong> ${call.calledDid}</p><p><strong>Длительность ожидания:</strong> ${call.duration} сек</p><p><strong>Время (МСК):</strong> ${mskDateTime(new Date())}</p>`,
                  status: "open",
                  priority: "high",
                  contactId: call.contactId,
                  creatorId: settings.defaultUserId,
                  assignees: {
                    create: Array.from(
                      new Set([settings.defaultUserId, ...defaultAssignees]),
                    ).map((uid) => ({ userId: uid })),
                  },
                  curators: defaultCurators.length
                    ? {
                        create: defaultCurators.map((uid) => ({ userId: uid })),
                      }
                    : undefined,
                },
              });
              await prisma.call.update({
                where: { id: call.id },
                data: { taskId: task.id },
              });
              const { sendPushToTaskAssignees, sendPushToTaskCurators } =
                await import("../lib/push.js");
              sendPushToTaskAssignees(
                task.id,
                {
                  title: `${isOutgoingCall ? "Исходящий звонок" : "Пропущенный звонок"} — задача`,
                  body: missedTitle,
                  url: `/tasks/${task.id}`,
                },
                settings.defaultUserId,
              ).catch(() => {});
              sendPushToTaskCurators(
                task.id,
                {
                  title: `${isOutgoingCall ? "Исходящий звонок" : "Пропущенный звонок"} — задача`,
                  body: missedTitle,
                  url: `/tasks/${task.id}`,
                },
                settings.defaultUserId,
              ).catch(() => {});
            }
          }
        }
      }
      // Для повторного звонка запись разговора включается в общую запись обсуждения
      let repeatCallRecordUrl: string | null = null;
      if (
        call.isRecorded &&
        call.callIdWithRec &&
        call.taskId &&
        !call.recordLocalPath
      ) {
        const settings = await prisma.telephonySettings.findFirst();
        if (settings?.autoAttachRecord) {
          try {
            const attached = await attachCallRecord(call, settings);
            if (attached) {
              if (isRepeatCall) {
                repeatCallRecordUrl = attached.url;
              } else {
                await postRecordComment(
                  call.taskId,
                  attached.url,
                  attached.duration || call.duration,
                  settings.defaultUserId!,
                );
              }
            }
          } catch (err: any) {
            console.error("[Novofon] Failed to attach record:", err.message);
          }
        }
      }
      // Повторный звонок: добавляем запись с информацией о звонке в обсуждение задачи
      if (isRepeatCall && call.taskId) {
        const settings = await prisma.telephonySettings.findFirst();
        if (settings?.defaultUserId) {
          await addCallDiscussionEntry(call.taskId, settings.defaultUserId, {
            callerId: call.callerId,
            calledDid: call.calledDid,
            callStart: call.callStart,
            durationSec: call.duration,
            recordUrl: repeatCallRecordUrl,
            missed: call.disposition === "missed",
            direction: isOutgoingCall ? "outgoing" : "incoming",
          });
          await prisma.call.update({
            where: { id: call.id },
            data: { notes: null },
          });
        }
      }
    } else if (event === "NOTIFY_RECORD") {
      try {
        const call = await prisma.call.update({
          where: { pbxCallId: body.pbx_call_id },
          data: {
            callIdWithRec: body.call_id_with_rec || null,
            recordUrl: body["record.url"] || null,
            isRecorded: true,
          },
          include: { task: true },
        });
        if (call.taskId && call.callIdWithRec && !call.recordLocalPath) {
          const settings = await prisma.telephonySettings.findFirst();
          if (
            settings?.autoAttachRecord &&
            settings.apiKey &&
            settings.apiSecret
          ) {
            try {
              const attached = await attachCallRecord(call, settings);
              if (attached) {
                await postRecordComment(
                  call.taskId,
                  attached.url,
                  attached.duration || call.duration,
                  settings.defaultUserId!,
                );
              }
            } catch (err: any) {
              console.error(
                "[Novofon NOTIFY_RECORD] Failed to attach record:",
                err.message,
              );
            }
          }
        }
      } catch (err: any) {
        console.error("[Novofon NOTIFY_RECORD] Error:", err.message);
      }
    }
    res.status(200).json({ success: true });
  } catch (err: any) {
    console.error("[Novofon Webhook Error]", err);
    res.status(200).json({ success: false, error: err.message });
  }
});
router.post("/iov", async (req, res) => {
  try {
    const { numa, numb, pbx_call_id } = req.body;
    const callerId = normalizePhone(numa || "");
    const settings = await prisma.telephonySettings.findFirst();
    if (callerId) {
      const contact = await prisma.contact.findFirst({
        where: { phone: { contains: callerId.replace("+", "") } },
        include: {
          tasks: {
            orderBy: { createdAt: "desc" },
            take: 1,
            include: { assignees: true },
          },
        },
      });
      if (contact?.tasks?.[0]?.assignees?.[0]?.userId) {
        const user = await prisma.user.findUnique({
          where: { id: contact.tasks[0].assignees[0].userId },
          select: { novofonExtension: true, name: true },
        });
        if (user?.novofonExtension) {
          return res.json({
            employee_id: parseInt(user.novofonExtension, 10),
            text: `Перевод на ${user.name}`,
          });
        }
      }
    }
    if (settings?.defaultIovEmployeeId) {
      return res.json({
        employee_id: settings.defaultIovEmployeeId,
        text: settings.defaultIovEmployeeName || "Перевод на оператора",
      });
    }
    res.json({});
  } catch (err: any) {
    console.error("[Novofon IOV Error]", err);
    res.json({});
  }
});
router.use(authMiddleware, adminOnly);
router.get("/settings", async (_req, res) => {
  const settings = await prisma.telephonySettings.findFirst();
  if (!settings) return res.json(null);
  const { apiSecret, ...rest } = settings;
  res.json({ ...rest, hasSecret: !!apiSecret });
});
const settingsSchema = z.object({
  isActive: z.boolean(),
  apiKey: z.string().min(1),
  apiSecret: z.string().optional(),
  virtualNumber: z.string().optional(),
  webhookSecret: z.string().optional().nullable(),
  autoCreateContact: z.boolean().default(true),
  autoCreateTask: z.boolean().default(false),
  autoCreateTaskOnIncoming: z.boolean().default(false),
  autoCreateTaskOnOutgoing: z.boolean().default(false),
  autoCreateTaskOnSms: z.boolean().default(false),
  autoAttachRecord: z.boolean().default(false),
  notifyAdminsOnSms: z.boolean().default(false),
  defaultUserId: z.string().optional().nullable(),
  defaultIovEmployeeId: z.number().optional().nullable(),
  defaultIovEmployeeName: z.string().optional().nullable(),
});
router.post("/settings", async (req: AuthRequest, res) => {
  const data = settingsSchema.parse(req.body);
  const existing = await prisma.telephonySettings.findFirst();
  if (existing) {
    const updated = await prisma.telephonySettings.update({
      where: { id: existing.id },
      data,
    });
    res.json(updated);
  } else {
    if (!data.apiSecret) {
      return res
        .status(400)
        .json({ error: "API Secret обязателен при первой настройке" });
    }
    const created = await prisma.telephonySettings.create({
      data: data as any,
    });
    res.status(201).json(created);
  }
});
router.get("/calls", async (req, res) => {
  const {
    search,
    direction,
    disposition,
    contactId,
    limit = "50",
    offset = "0",
  } = req.query;
  const where: any = {};
  if (direction) where.direction = direction;
  if (disposition) where.disposition = disposition;
  if (contactId) where.contactId = contactId as string;
  if (search) {
    where.OR = [
      { callerId: { contains: search as string, mode: "insensitive" } },
      { calledDid: { contains: search as string, mode: "insensitive" } },
      { notes: { contains: search as string, mode: "insensitive" } },
    ];
  }
  const [calls, total] = await Promise.all([
    prisma.call.findMany({
      where,
      include: {
        contact: { select: { id: true, name: true, company: true } },
        task: { select: { id: true, title: true } },
      },
      orderBy: { callStart: "desc" },
      take: parseInt(limit as string, 10),
      skip: parseInt(offset as string, 10),
    }),
    prisma.call.count({ where }),
  ]);
  res.json({ calls, total });
});
router.patch("/calls/:id", async (req, res) => {
  const call = await prisma.call.update({
    where: { id: req.params.id },
    data: req.body,
  });
  res.json(call);
});
const callbackSchema = z.object({
  phone: z.string().min(7),
  employeeId: z.number().optional(),
});
router.post("/callback", async (req: AuthRequest, res) => {
  const { phone, employeeId } = callbackSchema.parse(req.body);
  const settings = await prisma.telephonySettings.findFirst();
  if (!settings?.isActive) {
    return res.status(400).json({ error: "Телефония не настроена" });
  }
  const employees = await novofon.getEmployees({
    apiKey: settings.apiKey,
    apiSecret: settings.apiSecret,
  });
  const targetEmployee = employeeId
    ? employees.find((e) => e.id === employeeId)
    : employees[0];
  if (!targetEmployee) {
    return res.status(400).json({ error: "Сотрудник не найден" });
  }
  const result = await novofon.startEmployeeCall(
    { apiKey: settings.apiKey, apiSecret: settings.apiSecret },
    {
      virtualPhoneNumber: settings.virtualNumber || "",
      employeeId: targetEmployee.id,
      contactPhone: normalizePhone(phone),
    },
  );
  res.json({ success: true, callSessionId: result.call_session_id });
});
router.get("/employees", async (_req, res) => {
  const settings = await prisma.telephonySettings.findFirst();
  if (!settings?.isActive) return res.json([]);
  const employees = await novofon.getEmployees({
    apiKey: settings.apiKey,
    apiSecret: settings.apiSecret,
  });
  res.json(employees);
});
router.get("/records/:callId/download", async (req, res) => {
  const call = await prisma.call.findUnique({
    where: { id: req.params.callId },
  });
  if (!call?.callIdWithRec) {
    return res.status(404).json({ error: "Запись не найдена" });
  }
  const settings = await prisma.telephonySettings.findFirst();
  if (!settings) return res.status(400).json({ error: "Нет настроек" });
  try {
    const record = await novofon.getCallRecord(
      { apiKey: settings.apiKey, apiSecret: settings.apiSecret },
      call.callIdWithRec,
    );
    const fileRes = await fetch(record.url);
    if (!fileRes.ok) throw new Error("Failed to fetch record");
    const buffer = await fileRes.arrayBuffer();
    const filename = record.data?.file_name || `record_${call.pbxCallId}.mp3`;
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Content-Disposition", `attachment; filename='${filename}'`);
    res.send(Buffer.from(buffer));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
router.get("/sms", async (req, res) => {
  const { search, limit = "50", offset = "0" } = req.query;
  const where: any = {};
  if (search) {
    where.OR = [
      { from: { contains: search as string, mode: "insensitive" } },
      { to: { contains: search as string, mode: "insensitive" } },
      { text: { contains: search as string, mode: "insensitive" } },
    ];
  }
  const [items, total] = await Promise.all([
    prisma.smsMessage.findMany({
      where,
      include: { contact: { select: { id: true, name: true } } },
      orderBy: { receivedAt: "desc" },
      take: parseInt(limit as string, 10),
      skip: parseInt(offset as string, 10),
    }),
    prisma.smsMessage.count({ where }),
  ]);
  res.json({ items, total });
});
function normalizePhone(phone: string): string {
  if (!phone) return "";
  const cleaned = phone.replace(/[^+\d]/g, "");
  if (cleaned.startsWith("8") && cleaned.length === 11) {
    return "+7" + cleaned.slice(1);
  }
  if (cleaned.startsWith("7") && cleaned.length === 11) {
    return "+" + cleaned;
  }
  return cleaned;
}
function mapDisposition(raw: string): string {
  const map: Record<string, string> = {
    ANSWERED: "answered",
    BUSY: "busy",
    NOANSWER: "missed",
    CANCELLED: "missed",
    FAILED: "failed",
    CONGESTION: "failed",
  };
  return map[raw.toUpperCase()] || raw.toLowerCase() || "unknown";
}
function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
// Маркер в call.notes: звонок привязан к уже существующей незакрытой задаче контакта
// (повторный звонок) — на NOTIFY_END в обсуждение добавляется запись о звонке,
// новая задача не создаётся
const REPEAT_CALL_MARKER = "repeat_call_existing_task";
// Активные (незакрытые) статусы задач: win/cancelled считаются закрытыми/выполненными
const ACTIVE_TASK_STATUSES = ["open", "in_progress", "load"];
// Дата и время по часовому поясу сервера (Москва)
function mskDateTime(date: Date): string {
  return new Date(date).toLocaleString("ru-RU", { timeZone: "Europe/Moscow" });
}
// Первая (самая ранняя) незакрытая задача контакта
async function findActiveContactTask(contactId: string) {
  return prisma.task.findFirst({
    where: { contactId, status: { in: ACTIVE_TASK_STATUSES } },
    orderBy: { createdAt: "asc" },
  });
}
// HTML записи о звонке для обсуждения задачи
function buildCallInfoHtml(opts: {
  callerId: string;
  calledDid: string;
  callStart: Date;
  durationSec: number;
  recordUrl?: string | null;
  missed?: boolean;
  direction?: "incoming" | "outgoing";
}): string {
  const isOutgoing = opts.direction === "outgoing";
  const durationLabel = opts.missed
    ? "Длительность ожидания"
    : "Длительность разговора";
  const callLabel = opts.missed
    ? isOutgoing
      ? "Исходящий звонок не состоялся"
      : "Пропущенный звонок"
    : isOutgoing
      ? "Повторный исходящий звонок"
      : "Повторный входящий звонок";
  const parts = [
    `<p><strong>${callLabel}</strong></p>`,
    `<p><strong>${isOutgoing ? "Кому:" : "От:"}</strong> ${opts.callerId}</p>`,
    `<p><strong>На номер:</strong> ${opts.calledDid}</p>`,
    `<p><strong>${durationLabel}:</strong> ${formatDuration(opts.durationSec)}</p>`,
    `<p><strong>Время (МСК):</strong> ${mskDateTime(opts.callStart)}</p>`,
  ];
  if (opts.recordUrl) {
    parts.push(
      `<p><audio controls src='${opts.recordUrl}' style='width:100%'></audio></p>`,
      `<p><a href='${opts.recordUrl}' download target='_blank'>Скачать запись</a></p>`,
    );
  }
  return parts.join("");
}
// Добавление записи о звонке в обсуждение задачи + уведомление исполнителям
async function addCallDiscussionEntry(
  taskId: string,
  authorId: string,
  opts: {
    callerId: string;
    calledDid: string;
    callStart: Date;
    durationSec: number;
    recordUrl?: string | null;
    missed?: boolean;
    direction?: "incoming" | "outgoing";
  },
): Promise<void> {
  await prisma.comment.create({
    data: {
      content: buildCallInfoHtml(opts),
      taskId,
      authorId,
      isInternal: false,
    },
  });
  broadcast(CHANNELS.TASKS, {
    action: "new_comment",
    entity: "task",
    id: taskId,
  });
  try {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        assignees: { include: { user: true } },
        curators: { include: { user: true } },
        creator: true,
      },
    });
    if (task) {
      const label = opts.missed ? "Пропущенный звонок" : "Повторный звонок";
      const payload = {
        title: label,
        body: `${label} от ${opts.callerId} — информация добавлена в обсуждение задачи "${task.title}"`,
        url: "/tasks/" + task.id,
      };
      await notifyTaskAssignees(task.id, payload, authorId);
      await notifyTaskCurators(task.id, payload, authorId);
      await notifyTaskCreator(task.id, payload);
      await notifyRoleUsers(["admin"], payload, authorId);
    }
  } catch (notifyErr) {
    console.error(
      "[Novofon] Failed to send discussion notifications:",
      notifyErr,
    );
  }
}
// Атомарная привязка записи разговора к звонку.
// NOTIFY_END и NOTIFY_RECORD приходят одновременно — резервируем звонок через
// updateMany, чтобы второй обработчик не создал дублирующий комментарий.
// Возвращает URL локального файла и длительность записи либо null, если запись
// уже привязана другим обработчиком или ещё не готова на стороне АТС.
async function attachCallRecord(
  call: any,
  settings: any,
): Promise<{ url: string; duration: number } | null> {
  const claim = await prisma.call.updateMany({
    where: { id: call.id, recordLocalPath: null },
    data: { recordLocalPath: "downloading" },
  });
  if (claim.count === 0) return null;
  const release = async () => {
    await prisma.call
      .update({
        where: { id: call.id },
        data: { recordLocalPath: null },
      })
      .catch(() => {});
  };
  try {
    const record = await novofon.getCallRecord(
      { apiKey: settings.apiKey, apiSecret: settings.apiSecret },
      call.callIdWithRec,
    );
    const buffer = await downloadRecordWithRetry(record.url);
    const duration = record.data?.duration || 0;
    // Запись ещё не обработана АТС (пустой файл или нулевая длительность при
    // состоявшемся разговоре) — сбрасываем резервирование, придёт повторное событие
    if (buffer.length === 0 || (duration === 0 && call.duration > 0)) {
      await release();
      console.log(
        `[Novofon] Запись звонка ${call.pbxCallId} ещё не готова (duration=${duration}), ожидаем повторное событие`,
      );
      return null;
    }
    const filename = record.data?.file_name || `record_${call.pbxCallId}.mp3`;
    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    const localPath = path.join(RECORDS_DIR, `${randomUUID()}_${safeName}`);
    fs.writeFileSync(localPath, Buffer.from(buffer));
    await prisma.call.update({
      where: { id: call.id },
      data: {
        recordLocalPath: localPath,
        recordDownloadedAt: new Date(),
      },
    });
    return { url: `/uploads/records/${path.basename(localPath)}`, duration };
  } catch (err) {
    await release();
    throw err;
  }
}
// Публикация комментария «Запись разговора» в обсуждении задачи + уведомления
// (общий код обработчиков NOTIFY_END и NOTIFY_RECORD)
async function postRecordComment(
  taskId: string,
  recordUrl: string,
  durationSec: number,
  authorId: string,
): Promise<void> {
  await prisma.comment.create({
    data: {
      content: `<p><strong>Запись разговора</strong> (${formatDuration(durationSec)})</p><p><audio controls src='${recordUrl}' style='width:100%'></audio></p><p><a href='${recordUrl}' download target='_blank'>Скачать запись</a></p>`,
      taskId,
      authorId,
      isInternal: false,
    },
  });
  broadcast(CHANNELS.TASKS, {
    action: "new_comment",
    entity: "task",
    id: taskId,
  });
  try {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        assignees: { include: { user: true } },
        curators: { include: { user: true } },
        creator: true,
      },
    });
    if (task) {
      const payload = {
        title: "Новая запись разговора",
        body: `Добавлена запись разговора к задаче "${task.title}"`,
        url: "/tasks/" + task.id,
      };
      await notifyTaskAssignees(task.id, payload, authorId);
      await notifyTaskCurators(task.id, payload, authorId);
      await notifyTaskCreator(task.id, payload);
      await notifyRoleUsers(["admin"], payload, authorId);
    }
  } catch (notifyErr) {
    console.error("[Novofon] Failed to send notifications:", notifyErr);
  }
}
export default router;
