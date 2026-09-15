import http from 'http';
import jwt from 'jsonwebtoken';
import { WebSocketServer, WebSocket } from 'ws';
import { pushRelay } from '../lib/push.js';

// WebSocket-канал push-уведомлений для нативного Android-клиента (Capacitor APK
// без Google-сервисов): приложение держит постоянное соединение, сервер дублирует
// сюда те же payload, что уходят в Web Push (VAPID), а нативный foreground-сервис
// показывает системные уведомления. Аутентификация — JWT из ?token= (тот же ключ,
// что и в auth middleware; payload { id }).
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

export function setupPushWs(server: http.Server) {
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (req, socket, head) => {
    let pathname: string;
    try {
      pathname = new URL(req.url || '', 'http://localhost').pathname;
    } catch {
      socket.destroy();
      return;
    }
    if (pathname !== '/api/push/ws') return; // не наш путь — пропускаем (др. WS)

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
    console.log(`[PushWS] Client connected: ${userId}`);

    const onPush = (event: { userId: string; data: string }) => {
      if (event.userId !== userId) return;
      if (ws.readyState === WebSocket.OPEN) ws.send(event.data);
    };
    pushRelay.on('push', onPush);

    // Heartbeat: держим соединение через NAT/прокси и ловим мёртвых клиентов
    const pingTimer = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) ws.ping();
    }, 30000);

    ws.on('pong', () => { /* соединение живо */ });
    ws.on('close', () => {
      pushRelay.off('push', onPush);
      clearInterval(pingTimer);
      console.log(`[PushWS] Client disconnected: ${userId}`);
    });
    ws.on('error', () => {});

    ws.send(JSON.stringify({ type: 'connected' }));
  });
}
