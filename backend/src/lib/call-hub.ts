import { WebSocket } from 'ws';

// === In-memory хаб аудио/видеозвонков (WebRTC) ===
// Media-трафик идёт peer-to-peer между браузерами, здесь только управляющие
// события (incoming_call, call_accepted, ...) и ретрансляция SDP/ICE-данных
// между участниками звонка. Состояние в памяти: звонок живёт, пока жив
// процесс бэкенда; факты звонков (кто, кому, статус, длительность) — в БД
// (модель WebCall), восстановление после перезагрузки страницы — через
// GET /api/calls/active.

interface CallRoom {
  callerId: string;
  calleeId: string;
}

const userSockets = new Map<string, Set<WebSocket>>();
const callRooms = new Map<string, CallRoom>();

export function addCallSocket(userId: string, ws: WebSocket) {
  if (!userSockets.has(userId)) userSockets.set(userId, new Set());
  userSockets.get(userId)!.add(ws);
}

export function removeCallSocket(userId: string, ws: WebSocket) {
  const set = userSockets.get(userId);
  if (!set) return;
  set.delete(ws);
  if (set.size === 0) userSockets.delete(userId);
}

export function openCallRoom(callId: string, callerId: string, calleeId: string) {
  callRooms.set(callId, { callerId, calleeId });
}

export function closeCallRoom(callId: string) {
  callRooms.delete(callId);
}

export function getCallPeer(callId: string, userId: string): string | null {
  const room = callRooms.get(callId);
  if (!room) return null;
  if (room.callerId === userId) return room.calleeId;
  if (room.calleeId === userId) return room.callerId;
  return null;
}

// Отправить управляющее событие пользователю по всем его соединениям
// (вкладок/устройств может быть несколько, закрывать звонок нужно везде)
export function sendCallEvent(userId: string, payload: Record<string, unknown>) {
  const set = userSockets.get(userId);
  if (!set || set.size === 0) return false;
  const data = JSON.stringify(payload);
  for (const ws of set) {
    if (ws.readyState === WebSocket.OPEN) ws.send(data);
  }
  return true;
}
