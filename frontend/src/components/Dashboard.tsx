import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { api } from '../api/client';
import { useRealtime } from '../hooks/useRealtime';
import { DashboardStats, Task, Status } from '../types';
import { GlobalChat } from './GlobalChat';
import { Avatar } from './Avatar';

export function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [myTasks, setMyTasks] = useState<Task[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [statuses, setStatuses] = useState<Status[]>([]);

  const loadStats = () => api.dashboard.stats().then(setStats);
  const loadMyTasks = () => {
    if (user?.id) {
      api.tasks.list('assigneeId=' + user.id).then(setMyTasks);
    }
  };
  const loadAllTasks = () => {
    api.tasks.list('').then(setAllTasks);
  };

  useRealtime(['tasks','deals','contacts','projects'], () => { loadStats(); });
  useRealtime(['tasks'], () => { loadMyTasks(); loadAllTasks(); });

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    loadMyTasks();
    loadAllTasks();
  }, [user?.id]);

  useEffect(() => {
    api.statuses.list("task").then(setStatuses);
  }, []);

  const isBlocked = !user?.roleId && user?.role === 'user';
  if (isBlocked) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', padding: 16 }}>
        <div style={{ textAlign: 'center', padding: 48, background: 'var(--bg-card)', borderRadius: 16, border: '1px solid var(--border-color)', maxWidth: 520, width: '100%' }}>
          <div style={{ fontSize: 56, marginBottom: 20 }}>⏳</div>
          <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 12, color: 'var(--text-primary)' }}>Ваша регистрация у администратора на модерации</h2>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 24 }}>Администратор должен назначить вам роль для полного доступа к системе. Сейчас вам доступен только просмотр этой страницы.</p>
          <div style={{ padding: '12px 20px', background: 'var(--bg-body)', borderRadius: 12, fontSize: 13, color: '#888' }}>Email: {user?.email}</div>
        </div>
      </div>
    );
  }

  if (!stats) return <div>Загрузка...</div>;

  // Filter: only tasks where current user is assignee AND status is active
  const activeMyTasks = myTasks.filter((t) => {
    const taskStatus = statuses.find((s) => s.name === t.status);
    return taskStatus?.isActive !== false;
  });

  // Filter: all tasks with active status
  const activeTasksCount = allTasks.filter((t) => {
    const taskStatus = statuses.find((s) => s.name === t.status);
    return taskStatus?.isActive !== false;
  }).length;

  const metrics = [
    { 
      label: 'Мои задачи', 
      value: String(activeMyTasks.length), 
      delta: 'назначено', 
      path: '/tasks?assigneeId=' + user?.id + '&hideCompleted=true' 
    },
    { 
      label: 'Активные задачи', 
      value: String(activeTasksCount), 
      delta: 'в работе', 
      path: '/tasks?hideCompleted=true' 
    },
    { label: 'Просрочено', value: String(stats.metrics?.overdueTasks ?? 0), delta: 'задач', path: '/tasks' },
    { label: 'Онлайн', value: String(stats.metrics?.onlineUsers ?? 0), delta: 'сейчас', avatars: stats.onlineUsersList || [], path: '/users' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 16, flexShrink: 0 }}>
        {metrics.map((m, i) => (
          <div key={i} style={{ padding: 20, borderRadius: 16, border: '1px solid var(--border-color)', background: 'var(--bg-card)', boxShadow: 'var(--shadow)' }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>{m.label}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <div
                onClick={() => m.path && navigate(m.path)}
                style={{
                  fontSize: 24,
                  fontWeight: 500,
                  color: 'var(--text-primary)',
                  lineHeight: 1.1,
                  cursor: m.path ? 'pointer' : 'default',
                  textDecoration: m.path ? 'underline' : 'none',
                  textDecorationColor: 'transparent',
                  transition: 'text-decoration-color 0.15s',
                }}
                onMouseEnter={e => { if (m.path) (e.currentTarget as HTMLElement).style.textDecorationColor = 'var(--text-primary)'; }}
                onMouseLeave={e => { if (m.path) (e.currentTarget as HTMLElement).style.textDecorationColor = 'transparent'; }}
              >{m.value}</div>
              {m.avatars && m.avatars.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  {m.avatars.map((u, idx) => (
                    <div key={u.id} style={{ marginLeft: idx > 0 ? 4 : 0 }}>
                      <Avatar name={u.name} avatar={u.avatar} size={24} />
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div style={{ fontSize: 12, marginTop: 4, color: m.delta.startsWith('+') ? '#16a34a' : '#666' }}>{m.delta}</div>
          </div>
        ))}
      </div>

      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <GlobalChat />
      </div>
    </div>
  );
}
