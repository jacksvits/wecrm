import { Response } from 'express';

/** SSE Event Manager */
type Client = { id: string; res: Response; channels: Set<string>; userId: string };

const clients = new Map<string, Client>();

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function subscribeClient(res: Response, channels: string[], userId: string): string {
  const id = generateId();
  const client: Client = { id, res, channels: new Set(channels), userId };
  clients.set(id, client);
  console.log(`[SSE] Client ${id} (user ${userId}) subscribed to channels: [${channels.join(', ')}]`);
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
  const data = JSON.stringify({ channel, ...payload, timestamp: new Date().toISOString() });
  let sent = 0;
  for (const client of clients.values()) {
    if (client.channels.has(channel) || client.channels.has('*')) {
      try {
        client.res.write(`data: ${data}\n\n`);
        sent++;
      } catch (err) {
        console.error(`[SSE] Failed to send to client ${client.id}:`, err);
        clients.delete(client.id);
      }
    }
  }
  if (sent > 0) {
    console.log(`[SSE] Broadcast to ${sent} clients on channel '${channel}': ${payload.action} ${payload.entity || ''}`);
  }
}

/** Broadcast only to specific users (by userId) */
export function broadcastToUsers(channel: string, userIds: string[], payload: Record<string, any>) {
  const data = JSON.stringify({ channel, ...payload, timestamp: new Date().toISOString() });
  let sent = 0;
  for (const client of clients.values()) {
    if ((client.channels.has(channel) || client.channels.has('*')) && userIds.includes(client.userId)) {
      try {
        client.res.write(`data: ${data}\n\n`);
        sent++;
      } catch (err) {
        console.error(`[SSE] Failed to send to client ${client.id}:`, err);
        clients.delete(client.id);
      }
    }
  }
  if (sent > 0) {
    console.log(`[SSE] Broadcast to ${sent} targeted clients on channel '${channel}': ${payload.action}`);
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
