import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useAuth } from '../hooks/useAuth';
import { api } from '../api/client';
import { useRealtime } from '../hooks/useRealtime';
import { DashboardStats, DashboardMetricSetting, Task, Status } from '../types';
import { Avatar } from './Avatar';
import { NewsSlider } from './NewsSlider';
import { NewsPromoBlocks } from './NewsPromoBlocks';
import { DashboardCalendar } from './DashboardCalendar';

interface Metric {
  key: string;
  label: string;
  value: string;
  delta: string;
  path?: string;
  avatars?: Array<{ id: string; name: string; avatar?: string | null }>;
}

// Псевдо-метрика для персональной настройки видимости календаря на главной
const CALENDAR_METRIC_KEY = 'calendar';

const priorityLabels: Record<string, string> = {
  low: 'Низкий',
  medium: 'Средний',
  high: 'Высокий',
  urgent: 'Срочный',
};

// Карточка метрики с ручкой перетаскивания и кнопкой скрытия (стилистика Director.tsx)
function SortableMetricCard({ metric, onHide, children }: { metric: Metric; onHide: (key: string) => void; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: metric.key });
  return (
    <div
      ref={setNodeRef}
      style={{
        padding: 20,
        borderRadius: 16,
        border: '1px solid var(--border-color)',
        background: 'var(--bg-card)',
        boxShadow: 'var(--shadow)',
        position: 'relative',
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 10 : 1,
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    >
      {/* Ручка перетаскивания */}
      <div
        {...attributes}
        {...listeners}
        title="Перетащите для изменения порядка"
        style={{ position: 'absolute', top: 8, right: 28, width: 16, height: 16, opacity: 0.25, cursor: 'grab' }}
      >
        <svg viewBox="0 0 16 16" fill="currentColor" style={{ color: 'var(--text-muted)' }}>
          <circle cx="4" cy="4" r="1.5" /><circle cx="8" cy="4" r="1.5" /><circle cx="12" cy="4" r="1.5" />
          <circle cx="4" cy="8" r="1.5" /><circle cx="8" cy="8" r="1.5" /><circle cx="12" cy="8" r="1.5" />
          <circle cx="4" cy="12" r="1.5" /><circle cx="8" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" />
        </svg>
      </div>
      {/* Скрыть метрику */}
      <button
        onClick={(e) => { e.stopPropagation(); onHide(metric.key); }}
        title="Скрыть метрику"
        style={{ position: 'absolute', top: 6, right: 6, width: 20, height: 20, borderRadius: '50%', border: 'none', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, lineHeight: 1, padding: 0, opacity: 0.4, transition: 'opacity 0.15s, background 0.15s' }}
        onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.background = 'var(--bg-hover)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.4'; e.currentTarget.style.background = 'transparent'; }}
      >×</button>
      {children}
    </div>
  );
}

export function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  // Доступ к разделу «Задачи»: у админа есть всё, у остальных — по allowedPages (см. RequireRole в App.tsx)
  const canViewTasks = user?.role === 'admin' || ((user as any)?.allowedPages || []).includes('/tasks');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [myTasks, setMyTasks] = useState<Task[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [statuses, setStatuses] = useState<Status[]>([]);
  // Персональные настройки метрик (порядок + видимость), null — пока не загрузились
  const [layout, setLayout] = useState<DashboardMetricSetting[] | null>(null);
  const [showMetricSettings, setShowMetricSettings] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const loadStats = () => api.dashboard.stats().then(setStats);
  const loadMyTasks = () => {
    if (!canViewTasks) return;
    if (user?.id) {
      api.tasks.list('assigneeId=' + user.id).then(setMyTasks);
    }
  };
  const loadAllTasks = () => {
    if (!canViewTasks) return;
    api.tasks.list('').then(setAllTasks);
  };

  useRealtime(['tasks','deals','contacts','projects'], () => { loadStats(); });
  useRealtime(['tasks'], () => { if (!canViewTasks) return; loadMyTasks(); loadAllTasks(); });

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!canViewTasks) return;
    loadMyTasks();
    loadAllTasks();
  }, [user?.id, canViewTasks]);

  useEffect(() => {
    if (!canViewTasks) return;
    api.statuses.list("task").then(setStatuses);
  }, [canViewTasks]);

  // Загрузка персональных настроек метрик текущего пользователя
  useEffect(() => {
    if (user?.id) {
      api.dashboard.layout().then(setLayout).catch(() => setLayout(null));
    }
  }, [user?.id]);

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

  // Избранные задачи (личная отметка «Избранное») — отображаются в дашборде карточками
  const favoriteTasks = allTasks.filter((t) => t.isFavorite);

  // У каждой метрики стабильный ключ: скрытие/порядок хранятся персонально для пользователя
  // Без доступа к задачам задачные метрики не показываем (как и сам раздел «Задачи»)
  const taskMetrics: Metric[] = !canViewTasks || !stats ? [] : [
    {
      key: 'my_tasks',
      label: 'Мои задачи',
      value: String(activeMyTasks.length),
      delta: 'назначено',
      path: '/tasks?assigneeId=' + user?.id + '&hideCompleted=true'
    },
    {
      key: 'active_tasks',
      label: 'Активные задачи',
      value: String(activeTasksCount),
      delta: 'в работе',
      path: '/tasks?hideCompleted=true'
    },
    { key: 'overdue', label: 'Просрочено', value: String(stats.metrics?.overdueTasks ?? 0), delta: 'задач', path: `/tasks?filter=overdue&assigneeId=${user?.id ?? ''}&hideCompleted=true` },
    { key: 'favorite_tasks', label: 'Избранные задачи', value: String(favoriteTasks.length), delta: 'в избранном', path: '/tasks?favorite=true' },
  ];
  const metrics: Metric[] = !stats ? [] : [
    ...taskMetrics,
    { key: 'online', label: 'Онлайн', value: String(stats.metrics?.onlineUsers ?? 0), delta: 'сейчас', avatars: stats.onlineUsersList || [], path: '/users' },
    // Балансы счетов Точка Банк, привязанных к текущему пользователю (Настройки → Точка Банк)
    ...(stats.tochkaBalances || []).map((b) => ({
      key: 'tochka:' + b.id,
      label: b.name,
      value: b.balance.toLocaleString('ru-RU', { maximumFractionDigits: 0 }) + ' ₽',
      delta: 'баланс счёта',
      path: undefined as string | undefined,
    })),
  ];

  // Полный порядок ключей: сохранённый порядок + метрики, которых в нём нет (новые), — в конец
  const orderedKeys = useMemo(() => {
    const keys = (layout || []).map((s) => s.metricKey).filter((k) => metrics.some((m) => m.key === k));
    for (const m of metrics) if (!keys.includes(m.key)) keys.push(m.key);
    return keys;
  }, [layout, metrics]);

  // Видимые метрики в порядке пользователя
  const visibleMetrics = useMemo(
    () =>
      orderedKeys
        .filter((k) => !layout || layout.find((s) => s.metricKey === k)?.visible !== false)
        .map((k) => metrics.find((m) => m.key === k)!)
        .filter(Boolean),
    [orderedKeys, layout, metrics]
  );

  // Календарь управляется отдельной опцией в «⚙ Метрики»; по умолчанию — как в роли
  const calendarSetting = layout?.find((s) => s.metricKey === CALENDAR_METRIC_KEY);
  const isCalendarVisible = calendarSetting ? calendarSetting.visible !== false : user?.showCalendarMetric !== false;

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

  // Сохранение полного порядка + видимости на сервере (персонально для пользователя)
  const saveLayout = (keys: string[], visibleMap: Record<string, boolean>) => {
    const metricItems = keys.map((metricKey) => ({ metricKey, visible: visibleMap[metricKey] ?? true }));
    // Служебные настройки (например, видимость календаря) не участвуют в сетке метрик, но должны сохраняться
    const extraItems = (layout || [])
      .filter((s) => !metrics.some((m) => m.key === s.metricKey))
      .map((s) => ({ metricKey: s.metricKey, visible: s.visible !== false }));
    const items = [...metricItems, ...extraItems].map((item, i) => ({ metricKey: item.metricKey, sortOrder: i, visible: item.visible }));
    setLayout(items);
    api.dashboard.saveLayout(items.map(({ metricKey, visible }) => ({ metricKey, visible }))).catch((e) => console.error('[dashboard] save layout error:', e));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = visibleMetrics.findIndex((m) => m.key === active.id);
    const newIndex = visibleMetrics.findIndex((m) => m.key === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const newVisible = arrayMove(visibleMetrics, oldIndex, newIndex).map((m) => m.key);
    // Новый порядок видимых метрик вставляем на места видимых; скрытые остаются на своих позициях
    const visibleSet = new Set(newVisible);
    const merged: string[] = [];
    let vi = 0;
    for (const k of orderedKeys) {
      merged.push(visibleSet.has(k) ? newVisible[vi++] : k);
    }
    const visibleMap = Object.fromEntries((layout || []).map((s) => [s.metricKey, s.visible]));
    saveLayout(merged, visibleMap);
  };

  const toggleMetric = (key: string, visible: boolean) => {
    const visibleMap = Object.fromEntries((layout || []).map((s) => [s.metricKey, s.visible]));
    visibleMap[key] = visible;
    saveLayout(orderedKeys, visibleMap);
  };

  const toggleCalendarVisibility = (visible: boolean) => {
    const current = layout || [];
    const items = current.some((s) => s.metricKey === CALENDAR_METRIC_KEY)
      ? current.map((s) => s.metricKey === CALENDAR_METRIC_KEY ? { ...s, visible } : s)
      : [...current, { metricKey: CALENDAR_METRIC_KEY, sortOrder: current.length, visible }];
    const normalized = items.map((s, i) => ({ metricKey: s.metricKey, sortOrder: i, visible: s.visible !== false }));
    setLayout(normalized);
    api.dashboard.saveLayout(normalized.map(({ metricKey, visible }) => ({ metricKey, visible })))
      .catch((e) => console.error('[dashboard] save calendar visibility error:', e));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Слайдер закреплённых на главной новостей */}
      <NewsSlider />

      {/* Последние 3 новости в стиле промо-блока */}
      <NewsPromoBlocks />

      {/* Кнопки под новостями: «Все новости» слева, настройка метрик справа — на одном уровне */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 8, flexShrink: 0 }}>
        <button
          onClick={() => navigate('/news')}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 10, border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer' }}
        >
          Все новости →
        </button>
        <button
          onClick={() => setShowMetricSettings((v) => !v)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 10, border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer' }}
        >
          ⚙ Метрики
        </button>
      </div>

      {/* Панель видимости метрик */}
      {showMetricSettings && (
        <div style={{ padding: 16, borderRadius: 16, border: '1px solid var(--border-color)', background: 'var(--bg-card)', boxShadow: 'var(--shadow)', marginBottom: 12, flexShrink: 0 }}>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>
            Порядок и видимость метрик сохраняются персонально для вас. Перетаскивайте карточки за ручку ⋮⋮, скрывайте крестиком.
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0 10px', marginBottom: 6, cursor: 'pointer', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)' }}>
            <input
              type='checkbox'
              checked={isCalendarVisible}
              onChange={(e) => toggleCalendarVisibility(e.target.checked)}
            />
            <span>Отображать календарь</span>
          </label>
          {metrics.map((m) => (
            <label key={m.key} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', cursor: 'pointer', fontSize: 14, color: 'var(--text-primary)' }}>
              <input
                type="checkbox"
                checked={!layout || layout.find((s) => s.metricKey === m.key)?.visible !== false}
                onChange={(e) => toggleMetric(m.key, e.target.checked)}
              />
              <span>{m.label}</span>
            </label>
          ))}
        </div>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={visibleMetrics.map((m) => m.key)} strategy={rectSortingStrategy}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 16, flexShrink: 0 }}>
            {visibleMetrics.map((m) => (
              <SortableMetricCard key={m.key} metric={m} onHide={(key) => toggleMetric(key, false)}>
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
              </SortableMetricCard>
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Избранные задачи — карточки по стилистике канбана */}
      {canViewTasks && favoriteTasks.length > 0 && (
        <div style={{ marginBottom: 16, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            Избранные задачи
            <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>({favoriteTasks.length})</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
            {favoriteTasks.slice(0, 12).map((task) => {
              const taskStatus = statuses.find((s) => s.name === task.status);
              const statusColor = taskStatus?.color || '#f0f0f0';
              const hex = statusColor.replace('#', '');
              const r = parseInt(hex.substring(0, 2), 16);
              const g = parseInt(hex.substring(2, 4), 16);
              const b = parseInt(hex.substring(4, 6), 16);
              const statusBg = `rgba(${r}, ${g}, ${b}, 0.08)`;
              return (
                <div
                  key={task.id}
                  onClick={() => navigate(`/tasks/${task.id}`)}
                  style={{
                    padding: 12,
                    borderRadius: 14,
                    border: '1px solid var(--border-color)',
                    background: statusBg,
                    borderLeft: `3px solid ${statusColor}`,
                    cursor: 'pointer',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                  }}
                >
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6 }}>
                    {task.ticketNumber != null && (
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', flexShrink: 0 }}>#{task.ticketNumber}</span>
                    )}
                    <span style={{ fontSize: 13, fontWeight: 500, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</span>
                    <button
                      type="button"
                      title="Убрать из избранного"
                      onClick={(e) => {
                        e.stopPropagation();
                        api.tasks
                          .update(task.id, { isFavorite: false })
                          .then(() => loadAllTasks())
                          .catch(() => {});
                      }}
                      style={{
                        flexShrink: 0,
                        border: 'none',
                        background: 'transparent',
                        padding: 2,
                        marginRight: -2,
                        cursor: 'pointer',
                        color: '#f59e0b',
                        lineHeight: 0,
                        borderRadius: 6,
                        transition: 'transform 0.15s ease, opacity 0.15s ease',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.7'; e.currentTarget.style.transform = 'scale(1.1)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'scale(1)'; }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    </button>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ padding: '2px 6px', borderRadius: 8, fontSize: 10, background: statusColor, color: taskStatus?.textColor || '#666' }}>
                      {taskStatus?.label || task.status}
                    </span>
                    <span
                      style={{
                        padding: '2px 6px',
                        borderRadius: 8,
                        fontSize: 10,
                        background: task.priority === 'urgent' ? '#fee2e2' : task.priority === 'high' ? '#fef3c7' : '#f0f0f0',
                        color: task.priority === 'urgent' ? '#dc2626' : task.priority === 'high' ? '#92400e' : '#666',
                      }}
                    >
                      {priorityLabels[task.priority] || task.priority}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {task.dueDate
                        ? new Date(task.dueDate).toLocaleString('ru-RU', { timeZone: 'UTC', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                        : 'Без срока'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          {favoriteTasks.length > 12 && (
            <button
              onClick={() => navigate('/tasks?favorite=true')}
              style={{ marginTop: 8, padding: '6px 12px', borderRadius: 10, border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer' }}
            >
              Показать все избранные ({favoriteTasks.length}) →
            </button>
          )}
        </div>
      )}

      {/* Виджет календаря: задачи + напоминания + расписание, шкала дня внутри (персональная опция в «⚙ Метрики») */}
      {isCalendarVisible && <DashboardCalendar />}

    </div>
  );
}
