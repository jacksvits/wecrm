import { Response } from 'express';
import { currentTenant } from './tenant.js';

/** SSE Event Manager (изолирован по tenant'ам) */
type Client = { id: string; res: Response; channels: Set<string>; userId: string; tenantKey: string };

const clients = new Map<string, Client>();

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Ключ tenant'а для изоляции broadcast'ов между организациями */
function tenantKey(): string {
  const t = currentTenant();
  return t ? (t.isMain ? 'main' : t.dbName) : 'main';
}

export function subscribeClient(res: Response, channels: string[], userId: string): string {
  const id = generateId();
  const key = tenantKey();
  const client: Client = { id, res, channels: new Set(channels), userId, tenantKey: key };
  clients.set(id, client);
  console.log(`[SSE] Client ${id} (user ${userId}, tenant ${key}) subscribed to channels: [${channels.join(', ')}]`);
  res.on('close', () => {
    clients.delete(id);
    console.log(`[SSE] Client ${id} disconnected`);
  });
  res.on('error', () => {
    clients.delete(id);
    console.log(`[SSE] Client ${id} error, removed`);
  });
  return id;
}

export function broadcast(channel: string, payload: Record<string, any>) {
  const key = tenantKey();
  const data = JSON.stringify({ channel, ...payload, timestamp: new Date().toISOString() });
  let sent = 0;
  for (const client of clients.values()) {
    // События не пересекаются между организациями (tenant'ами)
    if (client.tenantKey !== key) continue;
    if (client.channels.has(channel) || client.channels.has('*')) {
      try {
        client.res.write(`data: ${data}\n\n`);
        // Сброс буфера compression, чтобы событие ушло клиенту немедленно
        (client.res as any).flush?.();
        sent++;
      } catch (err) {
        console.error(`[SSE] Failed to send to client ${client.id}:`, err);
        clients.delete(client.id);
      }
    }
  }
  if (sent > 0) {
    console.log(`[SSE] Broadcast to ${sent} clients on channel '${channel}' (tenant ${key}): ${payload.action} ${payload.entity || ''}`);
  }
}

/** Broadcast only to specific users (by userId), в рамках текущего tenant'а */
export function broadcastToUsers(channel: string, userIds: string[], payload: Record<string, any>) {
  const key = tenantKey();
  const data = JSON.stringify({ channel, ...payload, timestamp: new Date().toISOString() });
  let sent = 0;
  for (const client of clients.values()) {
    if (client.tenantKey !== key) continue;
    if ((client.channels.has(channel) || client.channels.has('*')) && userIds.includes(client.userId)) {
      try {
        client.res.write(`data: ${data}\n\n`);
        // Сброс буфера compression, чтобы событие ушло клиенту немедленно
        (client.res as any).flush?.();
        sent++;
      } catch (err) {
        console.error(`[SSE] Failed to send to client ${client.id}:`, err);
        clients.delete(client.id);
      }
    }
  }
  if (sent > 0) {
    console.log(`[SSE] Broadcast to ${sent} targeted clients on channel '${channel}' (tenant ${key}): ${payload.action}`);
  }
}

export function getActiveConnections(): number {
  return clients.size;
}

export const CHANNELS = {
  TASKS: 'tasks',
  CONTACTS: 'contacts',
  DEALS: 'deals',
  PROJECTS: 'projects',
  NEWS: 'news',
  USERS: 'users',
  DASHBOARD: 'dashboard',
  COMMENTS: 'comments',
  STATUSES: 'statuses',
  ROLES: 'roles',
  CHAT: 'chat',
} as const;
