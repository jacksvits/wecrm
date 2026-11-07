/**
 * Папки файлов задач.
 *
 * Структура: <uploadsRoot>/tasks/<год>/<месяц>/<номер тикета>/<файлы>
 * Год и месяц берутся из даты создания задачи (createdAt).
 * Год — 4 цифры, месяц — с ведущим нулём (01..12), чтобы сортировка по имени
 * совпадала с хронологией.
 */
import path from 'path';
import { uploadsRoot, tenantUploadPrefix } from './tenant.js';

/** Год/месяц из даты создания задачи; для задач без даты — текущие */
export const taskYearMonth = (createdAt?: Date | string | null): { year: string; month: string } => {
  const d = createdAt ? new Date(createdAt) : new Date();
  const valid = !Number.isNaN(d.getTime()) ? d : new Date();
  return { year: String(valid.getFullYear()), month: String(valid.getMonth() + 1).padStart(2, '0') };
};

/** Абсолютный путь к папке задачи на диске (с учётом tenant-префикса) */
export const taskDirFor = (ticketNum: string | number, createdAt?: Date | string | null): string => {
  const { year, month } = taskYearMonth(createdAt);
  return path.join(uploadsRoot(), 'tasks', year, month, String(ticketNum));
};

/** URL-префикс файлов задачи (как хранится в FileAttachment.path и отдаётся наружу) */
export const taskUploadUrlPrefix = (ticketNum: string | number, createdAt?: Date | string | null): string => {
  const { year, month } = taskYearMonth(createdAt);
  return `${tenantUploadPrefix() || '/uploads'}/tasks/${year}/${month}/${ticketNum}`;
};
