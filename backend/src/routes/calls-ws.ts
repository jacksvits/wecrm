import http from 'http';
import jwt from 'jsonwebtoken';
import { WebSocketServer, WebSocket } from 'ws';
import { addCallSocket, removeCallSocket, getCallPeer, sendCallEvent } from '../lib/call-hub.js';

// Сигнальный WebSocket-канал для WebRTC-звонков: /api/calls/ws?token=<JWT>.
// Аутентификация — тот же JWT, что и в auth middleware (payload { id }).
// Клиенты шлют { type: 'signal', callId, data } — сервер ретранслирует data
// второму участнику звонка (проверка участия через in-memory room).
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

export function setupCallsWs(server: http.Server) {
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (req, socket, head) => {
    let pathname: string;
    try {
      pathname = new URL(req.url || '', 'http://localhost').pathname;
    } catch {
      socket.destroy();
      return;
    }
    if (pathname !== '/api/calls/ws') return; // не наш путь — пропускаем (др. WS)

    const token = new URL(req.url || '', 'http://localhost').searchParams.get('token') || '';
    let userId: string;
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      userId = decoded.id;
    } catch {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }

    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit('connection', ws, req, userId);
    });
  });

  wss.on('connection', (ws: WebSocket, _req: http.IncomingMessage, userId: string) => {
    console.log(`[CallsWS] Client connected: ${userId}`);
    addCallSocket(userId, ws);

    // Heartbeat: держим соединение через NAT/прокси и ловим мёртвых клиентов
    const pingTimer = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) ws.ping();
    }, 30000);

    ws.on('message', (raw) => {
      let msg: any;
      try {
        msg = JSON.parse(raw.toString());
      } catch {
        return;
      }
      if (msg?.type === 'signal' && typeof msg.callId === 'string' && msg.data) {
        const peerId = getCallPeer(msg.callId, userId);
        if (!peerId) return;
        sendCallEvent(peerId, { type: 'signal', callId: msg.callId, data: msg.data });
      }
    });

    ws.on('pong', () => { /* соединение живо */ });
    ws.on('close', () => {
      removeCallSocket(userId, ws);
      clearInterval(pingTimer);
      console.log(`[CallsWS] Client disconnected: ${userId}`);
    });
    ws.on('error', () => {});

    ws.send(JSON.stringify({ type: 'connected' }));
  });
}
