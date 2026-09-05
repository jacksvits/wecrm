import express from 'express';
import cors from 'cors';
import compression from 'compression';
import dotenv from 'dotenv';
import http from 'http';
import { Router } from 'express';
import { subscribeClient, getActiveConnections } from './lib/events.js';
import { authMiddleware } from './middleware/auth.js';
import authRoutes from './routes/auth.js';
import taskRoutes from './routes/tasks.js';
import contactRoutes from './routes/contacts.js';
import dealRoutes from './routes/deals.js';
import projectRoutes from './routes/projects.js';
import dashboardRoutes from './routes/dashboard.js';
import userRoutes from './routes/users.js';
import profileRoutes from './routes/profile.js';
import roleRoutes from './routes/roles.js';
import statusRoutes from './routes/statuses.js';
import emailSettingsRoutes from './routes/email-settings.js';
import commentRoutes from './routes/comments.js';
import pushRoutes from './routes/push.js';
import notificationRoutes from './routes/notifications.js';
import chatRoutes from './routes/chat.js';
import uploadRoutes from './routes/uploads.js';
import newsRoutes from './routes/news.js';
import telephonyRoutes from './routes/telephony.js';
import vkRoutes from './routes/vk.js';
import vkGroupSettingsRoutes from './routes/vk-group-settings.js';
import maxRoutes from './routes/max.js';
import telegramRoutes from './routes/telegram.js';
import begetRoutes from './routes/beget.js';
import tochkaRoutes from './routes/tochka.js';
import pskovlineRoutes from './routes/pskovline.js';
import cameraRoutes from './routes/camera.js';
import taskFinanceRoutes from './routes/task-finances.js';
import contactTypeRoutes from './routes/contact-types.js';
import notesRouter from './routes/notes.js';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(compression());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static('/app/uploads'));
app.use('/uploads/avatars', express.static('/app/uploads/avatars'));

app.get('/api/events', authMiddleware, (req, res) => {
  const user = (req as any).user;
  const channelsParam = req.query.channels as string | undefined;
  const channels = channelsParam ? channelsParam.split(',') : ['*'];
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();
  res.write('data: ' + JSON.stringify({ type: 'connected', userId: user?.id, channels, timestamp: new Date().toISOString() }) + '\n\n');
  const clientId = subscribeClient(res, channels, user?.id || 'anonymous');
  const pingInterval = setInterval(() => {
    try { res.write(':ping\n\n'); } catch { clearInterval(pingInterval); }
  }, 30000);
  req.on('close', () => { clearInterval(pingInterval); });
});

app.use('/api/auth', authRoutes);
app.use('/api/contact-types', contactTypeRoutes);
app.use('/api/tasks', taskFinanceRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/deals', dealRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/users', userRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/statuses', statusRoutes);
app.use('/api/email-settings', emailSettingsRoutes);
app.use('/api/tasks', commentRoutes);
app.use('/api/push', pushRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/telephony', telephonyRoutes);
app.use('/api/vk', vkRoutes);
app.use('/api/vk-group-settings', vkGroupSettingsRoutes);
app.use('/api/max', maxRoutes);
app.use('/api/telegram', telegramRoutes);
app.use('/api/beget', begetRoutes);
app.use('/api/tochka', tochkaRoutes);
app.use('/api/pskovline', pskovlineRoutes);
app.use('/api/camera', cameraRoutes);
app.use('/api/notes', notesRouter);

app.get('/api/health', (_req, res) => res.json({ status: 'ok', connections: getActiveConnections(), time: new Date().toISOString() }));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Uploads route mounted at /api/uploads`);
  console.log(`Camera proxy mounted at /api/camera/stream`);
});


