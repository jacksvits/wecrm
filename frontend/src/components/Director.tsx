import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { api } from "../api/client";
import { Task, Deal, User, Activity, DashboardStats } from "../types";
import { useAuth } from "../hooks/useAuth";

type WidgetSize = "small" | "medium" | "large";
type WidgetId = string;
type WidgetTab = "Основное" | "Камеры" | "Бухгалтерия";

interface WidgetDef {
  id: WidgetId;
  size: WidgetSize;
  label: string;
  tab: WidgetTab;
}

const ALL_WIDGETS: WidgetDef[] = [
  // === Вкладка: Основное ===
  { id: "stat-active-tasks", size: "small", label: "Активные задачи", tab: "Основное" },
  { id: "stat-overdue", size: "small", label: "Просрочено", tab: "Основное" },
  { id: "stat-deals-active", size: "small", label: "Сделки в работе", tab: "Бухгалтерия" },
  { id: "stat-deals-sum", size: "small", label: "Сумма сделок", tab: "Бухгалтерия" },
  { id: "stat-users-total", size: "small", label: "Пользователей", tab: "Основное" },
  { id: "stat-users-online", size: "small", label: "Онлайн", tab: "Основное" },
  { id: "widget-online", size: "medium", label: "Онлайн пользователи", tab: "Основное" },
  { id: "widget-overdue", size: "medium", label: "Просроченные задачи", tab: "Основное" },
  { id: "widget-deals", size: "medium", label: "Активные сделки", tab: "Основное" },
  { id: "widget-history", size: "medium", label: "История", tab: "Основное" },
  { id: "widget-push-status", size: "medium", label: "Push-уведомления пользователей", tab: "Основное" },
  // === Вкладка: Камеры ===
  { id: "widget-camera-1", size: "medium", label: "Видеокамера 1", tab: "Камеры" },
  { id: "widget-camera-2", size: "medium", label: "Видеокамера 2", tab: "Камеры" },
  { id: "widget-camera-3", size: "medium", label: "Видеокамера 3", tab: "Камеры" },
  { id: "widget-camera-4", size: "medium", label: "Видеокамера 4", tab: "Камеры" },
  // === Вкладка: Бухгалтерия ===
  { id: "stat-tochka", size: "small", label: "Точка Банк", tab: "Бухгалтерия" },
  { id: "widget-tochka", size: "medium", label: "Точка Банк детали", tab: "Бухгалтерия" },
  { id: "stat-pskovline", size: "small", label: "Интернет - Чехова 6", tab: "Бухгалтерия" },
  { id: "stat-pskovline-2", size: "small", label: "Телефон - 211323", tab: "Бухгалтерия" },
  { id: "widget-beget-partner", size: "medium", label: "Бегет-Партнёр", tab: "Бухгалтерия" },
  { id: "widget-beget", size: "medium", label: "Beget детали", tab: "Бухгалтерия" },
  { id: "stat-task-profit", size: "small", label: "Прибыль по задачам", tab: "Бухгалтерия" },
  { id: "widget-task-finances", size: "large", label: "Помесячный отчёт по задачам", tab: "Бухгалтерия" },
];

const TABS: WidgetTab[] = ["Основное", "Камеры", "Бухгалтерия"];

const DEFAULT_VISIBLE = ALL_WIDGETS.map((w) => w.id);

const STORAGE_ORDER = "director_widgets_order_v2";
const STORAGE_HIDDEN = "director_widgets_hidden_v2";

function loadOrder(): string[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_ORDER);
    if (raw) {
      const saved: string[] = JSON.parse(raw);
      // Добавляем новые виджеты, которых нет в сохранённом порядке
      const allIds = new Set(ALL_WIDGETS.map((w) => w.id));
      const savedIds = new Set(saved);
      const missing = ALL_WIDGETS.filter((w) => !savedIds.has(w.id)).map((w) => w.id);
      // Удаляем виджеты, которых больше нет в ALL_WIDGETS
      const valid = saved.filter((id) => allIds.has(id));
      return [...valid, ...missing];
    }
  } catch {}
  return null;
}

function saveOrder(order: string[]) {
  try { localStorage.setItem(STORAGE_ORDER, JSON.stringify(order)); } catch {}
}

function loadHidden(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_HIDDEN);
    if (raw) return new Set(JSON.parse(raw));
  } catch {}
  return new Set();
}

function saveHidden(hidden: Set<string>) {
  try { localStorage.setItem(STORAGE_HIDDEN, JSON.stringify([...hidden])); } catch {}
}

function span(size: WidgetSize): number {
  return size === "small" ? 1 : size === "medium" ? 2 : 4;
}

function SortableWidget({
  widget,
  onHide,
  children,
}: {
  widget: WidgetDef;
  onHide: (id: string) => void;
  children: React.ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: widget.id });

  const dndStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        padding: 20,
        borderRadius: 16,
        background: "var(--bg-card)",
        border: "1px solid var(--border-color)",
        boxShadow: "var(--shadow)",
        cursor: "grab",
        position: "relative",
        gridColumn: `span ${span(widget.size)}`,
        minHeight: widget.size === "small" ? 100 : widget.size === "medium" ? 220 : 280,
        ...dndStyle,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.12)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "none";
        e.currentTarget.style.boxShadow = "var(--shadow)";
      }}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        style={{
          position: "absolute",
          top: 8,
          right: 28,
          width: 16,
          height: 16,
          opacity: 0.25,
          cursor: "grab",
        }}
        title="Перетащите"
      >
        <svg viewBox="0 0 16 16" fill="currentColor" style={{ color: "var(--text-muted)" }}>
          <circle cx="4" cy="4" r="1.5" /><circle cx="8" cy="4" r="1.5" /><circle cx="12" cy="4" r="1.5" />
          <circle cx="4" cy="8" r="1.5" /><circle cx="8" cy="8" r="1.5" /><circle cx="12" cy="8" r="1.5" />
          <circle cx="4" cy="12" r="1.5" /><circle cx="8" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" />
        </svg>
      </div>
      {/* Hide button */}
      <button
        onClick={(e) => { e.stopPropagation(); onHide(widget.id); }}
        style={{
          position: "absolute",
          top: 6,
          right: 6,
          width: 20,
          height: 20,
          borderRadius: "50%",
          border: "none",
          background: "transparent",
          color: "var(--text-muted)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 16,
          lineHeight: 1,
          padding: 0,
          opacity: 0.4,
          transition: "opacity 0.15s, background 0.15s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = "1";
          e.currentTarget.style.background = "var(--bg-hover)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = "0.4";
          e.currentTarget.style.background = "transparent";
        }}
        title="Скрыть метрику"
      >
        ×
      </button>
      {children}
    </div>
  );
}

function getWidgetLabel(widget: WidgetDef, pskovlineSettings: any): string {
  if (widget.id === "stat-pskovline" && pskovlineSettings?.label) {
    return pskovlineSettings.label;
  }
  if (widget.id === "stat-pskovline-2" && pskovlineSettings?.label2) {
    return pskovlineSettings.label2;
  }
  return widget.label;
}

export function Director() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [pushStatusUsers, setPushStatusUsers] = useState<any[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);
  const [overdueTasks, setOverdueTasks] = useState<Task[]>([]);
  const [activeDeals, setActiveDeals] = useState<Deal[]>([]);
  const [begetAccount, setBegetAccount] = useState<any>(null);
  const [begetDomains, setBegetDomains] = useState<any[]>([]);
  const [tochkaConnected, setTochkaConnected] = useState(false);
  const [tochkaAccounts, setTochkaAccounts] = useState<any>(null);
  const [pskovlineData, setPskovlineData] = useState<any>(null);
  const [pskovlineData2, setPskovlineData2] = useState<any>(null);
  const [pskovlineSettings, setPskovlineSettings] = useState<any>(null);
  const [showPskovlineSettings, setShowPskovlineSettings] = useState(false);
  const [cameraSettingsList, setCameraSettingsList] = useState<any[]>([]);
  const [editingCameraIndex, setEditingCameraIndex] = useState<number | null>(null);
  const [fullscreenCamera, setFullscreenCamera] = useState<{ id: string; label: string } | null>(null);
  const [cameraRefreshKey, setCameraRefreshKey] = useState(0);
  const [taskFinanceStats, setTaskFinanceStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Refresh camera streams every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => setCameraRefreshKey(Date.now()), 600000);
    return () => clearInterval(interval);
  }, []);
  const [activeTab, setActiveTab] = useState<WidgetTab>("Основное");
  const [showWidgetSettings, setShowWidgetSettings] = useState(false);

  const savedOrder = loadOrder();
  const initialOrder = savedOrder || ALL_WIDGETS.map((w) => w.id);
  const [widgetOrder, setWidgetOrder] = useState<string[]>(initialOrder);
  const [hidden, setHidden] = useState<Set<string>>(loadHidden);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      api.users.online().then(setOnlineUsers).catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [s, a, t, d, psu] = await Promise.all([
        api.dashboard.stats(),
        api.dashboard.activities(),
        api.tasks.list("status=open&status=in_progress&sort=dueDate:asc"),
        api.deals.list("stage=lead&stage=negotiation&stage=proposal"),
        api.get("/api/users/push-status").catch(() => null),
      ]);
      setStats(s);
      setActivities(a.slice(0, 10));
      setOnlineUsers((s.onlineUsersList || []) as any);
      setOverdueTasks(
        t.filter((task: Task) => task.dueDate && new Date(task.dueDate) < new Date()).slice(0, 5)
      );
      setActiveDeals(d.slice(0, 5));
      setPushStatusUsers(psu || []);
      api.beget.account().then(setBegetAccount).catch(() => {});
      api.beget.domains().then(setBegetDomains).catch(() => {});
      api.tochka.status().then((s: any) => {
        setTochkaConnected(s?.connected || false);
        if (s?.connected) {
          api.tochka.accounts().then(setTochkaAccounts).catch(() => {});
        }
      }).catch(() => {});
      fetch("/api/pskovline").then(r => r.ok ? r.json() : null).then((data) => {
        if (data?.accounts) {
          setPskovlineData(data.accounts[0] || null);
          setPskovlineData2(data.accounts[1] || null);
        }
      }).catch(() => {});
      const token = localStorage.getItem('token');
      fetch("/api/pskovline/settings", {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      }).then(r => r.ok ? r.json() : null).then(setPskovlineSettings).catch(() => {});
      api.camera.getSettings().then((list: any[]) => setCameraSettingsList(list)).catch(() => {});
      fetch("/api/dashboard/task-finances", { headers: token ? { Authorization: `Bearer ${token}` } : {} })
        .then(r => r.ok ? r.json() : null)
        .then(setTaskFinanceStats)
        .catch(() => {});
    } catch {}
    setLoading(false);
  };

  const handleDragStart = (event: any) => setActiveId(event.active.id);
  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    setActiveId(null);
    if (over && active.id !== over.id) {
      setWidgetOrder((items) => {
        const oldIndex = items.indexOf(active.id);
        const newIndex = items.indexOf(over.id);
        const newOrder = arrayMove(items, oldIndex, newIndex);
        saveOrder(newOrder);
        return newOrder;
      });
    }
  };

  const handleHide = (id: string) => {
    setHidden((prev) => {
      const next = new Set(prev);
      next.add(id);
      saveHidden(next);
      return next;
    });
  };

  const handleShow = (id: string) => {
    setHidden((prev) => {
      const next = new Set(prev);
      next.delete(id);
      saveHidden(next);
      return next;
    });
  };

  const handleShowAll = () => {
    setHidden(new Set());
    saveHidden(new Set());
  };

  const tabWidgets = ALL_WIDGETS.filter((w) => w.tab === activeTab);

  const visibleWidgets = widgetOrder
    .map((id) => ALL_WIDGETS.find((w) => w.id === id))
    .filter((w): w is WidgetDef => !!w && !hidden.has(w.id) && w.tab === activeTab);

  const hiddenWidgets = ALL_WIDGETS.filter((w) => hidden.has(w.id) && w.tab === activeTab);

  const renderWidgetContent = (widget: WidgetDef) => {
    switch (widget.id) {
      case "stat-active-tasks":
        return (
          <>
            <div style={{ fontSize: 28, fontWeight: 700, color: "#007AFF", marginBottom: 4 }}>{stats?.metrics?.activeTasks || 0}</div>
            <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Активные задачи</div>
          </>
        );
      case "stat-overdue":
        return (
          <>
            <div style={{ fontSize: 28, fontWeight: 700, color: "#dc2626", marginBottom: 4 }}>{stats?.metrics?.overdueTasks || 0}</div>
            <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Просрочено</div>
          </>
        );
      case "stat-deals-active":
        return (
          <>
            <div style={{ fontSize: 28, fontWeight: 700, color: "#f59e0b", marginBottom: 4 }}>{(stats?.dealsByStage?.lead || 0) + (stats?.dealsByStage?.negotiation || 0) + (stats?.dealsByStage?.proposal || 0)}</div>
            <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Сделки в работе</div>
          </>
        );
      case "stat-deals-sum":
        return (
          <>
            <div style={{ fontSize: 28, fontWeight: 700, color: "#10b981", marginBottom: 4 }}>{(stats?.metrics?.totalDealValue || 0).toLocaleString("ru")} ₽</div>
            <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Сумма сделок</div>
          </>
        );
      case "stat-users-total":
        return (
          <>
            <div style={{ fontSize: 28, fontWeight: 700, color: "#6b7280", marginBottom: 4 }}>{stats?.metrics?.users || 0}</div>
            <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Пользователей</div>
          </>
        );
      case "stat-users-online":
        return (
          <>
            <div style={{ fontSize: 28, fontWeight: 700, color: "#10b981", marginBottom: 4 }}>{stats?.metrics?.onlineUsers || 0}</div>
            <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Онлайн</div>
          </>
        );
      case "stat-beget":
        return (
          <>
            <div style={{ fontSize: 28, fontWeight: 700, color: "#2563eb", marginBottom: 4 }}>{begetDomains.length}</div>
            <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Beget — {begetAccount?.login || "—"}</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2, opacity: 0.7 }}>{begetAccount?.plan_name || ""} · {begetAccount?.user_balance || 0} ₽</div>
          </>
        );
      case "stat-tochka":
        return tochkaConnected ? (
          <>
            <div style={{ fontSize: 28, fontWeight: 700, color: "#e11d48", marginBottom: 4 }}>
              {(tochkaAccounts?.totalBalance || 0).toLocaleString("ru")} ₽
            </div>
            <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Точка Банк</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2, opacity: 0.7 }}>
              {tochkaAccounts?.accounts?.length || 0} счетов
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 8 }}>Точка Банк</div>
            <button
              onClick={async (e) => {
                e.stopPropagation();
                try {
                  const token = localStorage.getItem('token');
                  const res = await fetch('/api/tochka/auth-url', {
                    headers: token ? { Authorization: `Bearer ${token}` } : {}
                  });
                  const data = await res.json();
                  if (data.authUrl) window.open(data.authUrl, '_blank');
                } catch {}
              }}
              style={{
                padding: "6px 12px", borderRadius: 8, border: "none",
                background: "#e11d48", color: "#fff", fontSize: 12, cursor: "pointer", fontWeight: 500,
              }}
            >
              Подключить
            </button>
          </>
        );
      case "stat-pskovline":
        return (
          <>
            <div style={{ fontSize: 28, fontWeight: 700, color: "#10b981", marginBottom: 4 }}>
              {pskovlineData?.balance !== null && pskovlineData?.balance !== undefined ? `${pskovlineData.balance.toFixed(2)} ₽` : "—"}
            </div>
            <div style={{ fontSize: 13, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 6 }}>
              {pskovlineSettings?.label || "Псковлайн"}
              <button
                onClick={(e) => { e.stopPropagation(); setShowPskovlineSettings(true); }}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  padding: 2, opacity: 0.5, transition: "opacity 0.15s",
                  color: "var(--text-muted)", fontSize: 12,
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = "1"}
                onMouseLeave={(e) => e.currentTarget.style.opacity = "0.5"}
                title="Настройки"
              >
                ⚙️
              </button>
            </div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2, opacity: 0.7 }}>
              {pskovlineData?.period || "—"}
            </div>
          </>
        );
      case "stat-pskovline-2":
        return (
          <>
            <div style={{ fontSize: 28, fontWeight: 700, color: "#2563eb", marginBottom: 4 }}>
              {pskovlineData2?.balance !== null && pskovlineData2?.balance !== undefined ? `${pskovlineData2.balance.toFixed(2)} ₽` : "—"}
            </div>
            <div style={{ fontSize: 13, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 6 }}>
              {pskovlineSettings?.label2 || "Псковлайн телефон"}
              <button
                onClick={(e) => { e.stopPropagation(); setShowPskovlineSettings(true); }}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  padding: 2, opacity: 0.5, transition: "opacity 0.15s",
                  color: "var(--text-muted)", fontSize: 12,
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = "1"}
                onMouseLeave={(e) => e.currentTarget.style.opacity = "0.5"}
                title="Настройки"
              >
                ⚙️
              </button>
            </div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2, opacity: 0.7 }}>
              {pskovlineData2?.period || "—"}
            </div>
          </>
        );
      case "widget-online":
        return (
          <>
            <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 12 }}>Онлайн ({onlineUsers.length})</div>
            {onlineUsers.length === 0 ? (
              <div style={{ color: "var(--text-muted)", fontSize: 13 }}>Никого нет онлайн</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {onlineUsers.map((u) => (
                  <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 10, background: "var(--bg-input)" }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: u.avatar ? "transparent" : "var(--bg-hover)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", overflow: "hidden" }}>
                      {u.avatar ? <img src={u.avatar} alt={u.name} style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover" }} /> : u.name.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{u.name}</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{u.lastActiveAt ? new Date(u.lastActiveAt).toLocaleTimeString("ru") : ""}</div>
                    </div>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981" }} />
                  </div>
                ))}
              </div>
            )}
          </>
        );
      case "widget-overdue":
        return (
          <>
            <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 12 }}>Просроченные задачи</div>
            {overdueTasks.length === 0 ? (
              <div style={{ color: "var(--text-muted)", fontSize: 13 }}>Нет просроченных задач</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {overdueTasks.map((task) => (
                  <div key={task.id} onClick={() => navigate(`/tasks/${task.id}`)} style={{ padding: "10px 12px", borderRadius: 10, background: "var(--bg-input)", cursor: "pointer" }}>
                    <div style={{ fontSize: 13, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{task.title}</div>
                    <div style={{ fontSize: 11, color: "#dc2626", marginTop: 2 }}>Срок: {task.dueDate ? new Date(task.dueDate).toLocaleDateString("ru") : "не указан"}</div>
                  </div>
                ))}
              </div>
            )}
          </>
        );
      case "widget-deals":
        return (
          <>
            <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 12 }}>Активные сделки</div>
            {activeDeals.length === 0 ? (
              <div style={{ color: "var(--text-muted)", fontSize: 13 }}>Нет активных сделок</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {activeDeals.map((deal) => (
                  <div key={deal.id} onClick={() => navigate(`/deals`)} style={{ padding: "10px 12px", borderRadius: 10, background: "var(--bg-input)", cursor: "pointer" }}>
                    <div style={{ fontSize: 13, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{deal.title}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{(deal.value || 0).toLocaleString("ru")} ₽ · {deal.stage}</div>
                  </div>
                ))}
              </div>
            )}
          </>
        );
      case "widget-history":
        return (
          <>
            <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 12 }}>История</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {activities.map((a) => (
                <div key={a.id} style={{ display: "flex", gap: 10, padding: "8px 0", borderBottom: "1px solid #f0f0f0" }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--bg-hover)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 500, color: "var(--text-secondary)", flexShrink: 0 }}>
                    {a.user?.name?.charAt(0) || "?"}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.4 }}>
                      <strong style={{ color: "var(--text-primary)", fontWeight: 500 }}>{a.user?.name}</strong>{" "}
                      {a.action === "created" ? "создал" : a.action === "updated" ? "обновил" : "прокомментировал"}{" "}
                      {a.entity}{" "}
                      {a.entityName ? (
                        <button onClick={() => navigate(`/${a.entity === "comment" ? "tasks" : a.entity + "s"}/${a.entityId}`)} style={{ background: "none", border: "none", padding: 0, color: "#007AFF", fontWeight: 600, fontSize: 12, cursor: "pointer" }}>«{a.entityName}»</button>
                      ) : (
                        <span style={{ color: "var(--text-muted)", fontSize: 12 }}>«{a.entityId.slice(0, 8)}...»</span>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{new Date(a.createdAt).toLocaleString("ru")}</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        );
      case "widget-push-status":
        return (
          <>
            <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 12 }}>Push-уведомления ({pushStatusUsers.length})</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 320, overflow: "auto" }}>
              {pushStatusUsers.length === 0 ? (
                <div style={{ color: "var(--text-muted)", fontSize: 13 }}>Нет данных</div>
              ) : (
                pushStatusUsers.map((u) => (
                  <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 10, background: "var(--bg-input)" }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: u.avatar ? "transparent" : "var(--bg-hover)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600, overflow: "hidden" }}>
                      {u.avatar ? <img src={u.avatar} alt={u.name} style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover" }} /> : u.name?.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{u.name}</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{u.role?.label || u.role?.name}</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: u.hasSubscription ? "#10b981" : "#ef4444" }} />
                      <span style={{ fontSize: 12, color: u.hasSubscription ? "#10b981" : "#ef4444" }}>
                        {u.hasSubscription ? "Вкл" : "Выкл"}
                      </span>
                      {u.subscriptionCount > 1 && (
                        <span style={{ fontSize: 11, color: "var(--text-muted)" }}>({u.subscriptionCount})</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        );
      case "widget-beget":
        return begetAccount ? (
          <>
            <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 12 }}>Beget — {begetAccount?.login || "—"}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div><div style={{ fontSize: 11, color: "var(--text-muted)" }}>Тариф</div><div style={{ fontSize: 14, fontWeight: 500 }}>{begetAccount.plan_name || "—"}</div></div>
              <div><div style={{ fontSize: 11, color: "var(--text-muted)" }}>Баланс</div><div style={{ fontSize: 14, fontWeight: 500 }}>{begetAccount.user_balance || 0} ₽</div></div>
              <div><div style={{ fontSize: 11, color: "var(--text-muted)" }}>Дней до блокировки</div><div style={{ fontSize: 14, fontWeight: 500, color: (begetAccount.user_days_to_block || 0) < 7 ? "#dc2626" : "inherit" }}>{begetAccount.user_days_to_block || 0}</div></div>
              <div><div style={{ fontSize: 11, color: "var(--text-muted)" }}>Диск</div><div style={{ fontSize: 14, fontWeight: 500 }}>{Math.round((begetAccount.user_quota || 0) / 1024)} / {Math.round((begetAccount.plan_quota || 0) / 1024)} МБ</div></div>
              <div><div style={{ fontSize: 11, color: "var(--text-muted)" }}>Сайтов</div><div style={{ fontSize: 14, fontWeight: 500 }}>{begetAccount.user_sites || 0} / {begetAccount.plan_site || 0}</div></div>
              <div><div style={{ fontSize: 11, color: "var(--text-muted)" }}>Сервер</div><div style={{ fontSize: 14, fontWeight: 500 }}>{begetAccount.server_name || "—"}</div></div>
            </div>
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--border-color)", fontSize: 13, color: "var(--text-muted)" }}>Доменов: {begetDomains.length}</div>
          </>
        ) : (
          <div style={{ color: "var(--text-muted)", fontSize: 13 }}>Загрузка данных Beget...</div>
        );
      case "widget-beget-partner":
        return begetAccount ? (
          <>
            <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 12 }}>Бегет-Партнёр</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Баланс</div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{(begetAccount.user_balance || 0).toLocaleString("ru")} ₽</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Активные рефералы</div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{begetAccount.active_referrals || 0}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Последняя транзакция</div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{begetAccount.last_transaction || "—"}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Сумма транзакции</div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{(begetAccount.last_transaction_amount || 0).toLocaleString("ru")} ₽</div>
              </div>
            </div>
          </>
        ) : (
          <div style={{ color: "var(--text-muted)", fontSize: 13 }}>Загрузка данных Бегет-Партнёр...</div>
        );
      case "widget-tochka":
        return tochkaConnected ? (
          <>
            <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 12 }}>Точка Банк</div>
            {tochkaAccounts?.accounts?.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {tochkaAccounts.accounts.map((acc: any) => (
                  <div key={acc.id} style={{ padding: "10px 12px", borderRadius: 10, background: "var(--bg-input)" }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{acc.name}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                      {acc.number} · {(acc.balance || 0).toLocaleString("ru")} {acc.currency}
                    </div>
                  </div>
                ))}
                <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid var(--border-color)", fontSize: 13, fontWeight: 500, color: "#e11d48" }}>
                  Итого: {(tochkaAccounts.totalBalance || 0).toLocaleString("ru")} ₽
                </div>
              </div>
            ) : (
              <div style={{ color: "var(--text-muted)", fontSize: 13 }}>Нет счетов</div>
            )}
          </>
        ) : (
          <>
            <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 12 }}>Точка Банк</div>
            <div style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 12 }}>Банк не подключен</div>
            <button
              onClick={async () => {
                try {
                  const token = localStorage.getItem('token');
                  const res = await fetch('/api/tochka/auth-url', {
                    headers: token ? { Authorization: `Bearer ${token}` } : {}
                  });
                  const data = await res.json();
                  if (data.authUrl) window.open(data.authUrl, '_blank');
                } catch {}
              }}
              style={{
                padding: "8px 16px", borderRadius: 10, border: "none",
                background: "#e11d48", color: "#fff", fontSize: 13, cursor: "pointer", fontWeight: 500,
              }}
            >
              Подключить Точку Банк
            </button>
          </>
        );
      case "widget-camera-1": {
        const cam = cameraSettingsList[0];
        const fallbackId = "camera-fallback-1";
        return (
          <>
            <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span>{cam?.label || "Видеокамера 1"}</span>
              <button
                onClick={(e) => { e.stopPropagation(); setEditingCameraIndex(0); }}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  padding: 2, opacity: 0.5, transition: "opacity 0.15s",
                  color: "var(--text-muted)", fontSize: 14,
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = "1"}
                onMouseLeave={(e) => e.currentTarget.style.opacity = "0.5"}
                title="Настройки камеры"
              >
                ⚙️
              </button>
            </div>
            <div style={{ borderRadius: 10, overflow: "hidden", background: "#000", height: "calc(100% - 40px)", minHeight: 140, position: "relative" }}>
              {cam ? (
                <img
                  key={`${cam.id}-${cameraRefreshKey}`}
                  src={`/api/camera/stream/${cam.id}?t=${cameraRefreshKey}`}
                  alt="IP-камера"
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", cursor: "pointer" }}
                  onDoubleClick={() => setFullscreenCamera({ id: cam.id, label: cam.label })}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                    const el = document.getElementById(fallbackId);
                    if (el) el.style.display = "flex";
                  }}
                />
              ) : null}
              <div
                id={fallbackId}
                style={{
                  position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                  display: cam ? "none" : "flex", alignItems: "center", justifyContent: "center",
                  color: "var(--text-muted)", fontSize: 13, textAlign: "center", padding: 16,
                }}
              >
                <div>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>📷</div>
                  Камера недоступна<br />
                  <span style={{ fontSize: 11, opacity: 0.7 }}>{cam?.ip || "—"}</span>
                </div>
              </div>
            </div>
          </>
        );
      }
      case "widget-camera-2": {
        const cam = cameraSettingsList[1];
        const fallbackId = "camera-fallback-2";
        return (
          <>
            <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span>{cam?.label || "Видеокамера 2"}</span>
              <button
                onClick={(e) => { e.stopPropagation(); setEditingCameraIndex(1); }}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  padding: 2, opacity: 0.5, transition: "opacity 0.15s",
                  color: "var(--text-muted)", fontSize: 14,
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = "1"}
                onMouseLeave={(e) => e.currentTarget.style.opacity = "0.5"}
                title="Настройки камеры"
              >
                ⚙️
              </button>
            </div>
            <div style={{ borderRadius: 10, overflow: "hidden", background: "#000", height: "calc(100% - 40px)", minHeight: 140, position: "relative" }}>
              {cam ? (
                <img
                  key={`${cam.id}-${cameraRefreshKey}`}
                  src={`/api/camera/stream/${cam.id}?t=${cameraRefreshKey}`}
                  alt="IP-камера"
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", cursor: "pointer" }}
                  onDoubleClick={() => setFullscreenCamera({ id: cam.id, label: cam.label })}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                    const el = document.getElementById(fallbackId);
                    if (el) el.style.display = "flex";
                  }}
                />
              ) : null}
              <div
                id={fallbackId}
                style={{
                  position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                  display: cam ? "none" : "flex", alignItems: "center", justifyContent: "center",
                  color: "var(--text-muted)", fontSize: 13, textAlign: "center", padding: 16,
                }}
              >
                <div>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>📷</div>
                  Камера недоступна<br />
                  <span style={{ fontSize: 11, opacity: 0.7 }}>{cam?.ip || "—"}</span>
                </div>
              </div>
            </div>
          </>
        );
      }
      case "widget-camera-3": {
        const cam = cameraSettingsList[2];
        const fallbackId = "camera-fallback-3";
        return (
          <>
            <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span>{cam?.label || "Видеокамера 3"}</span>
              <button
                onClick={(e) => { e.stopPropagation(); setEditingCameraIndex(2); }}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  padding: 2, opacity: 0.5, transition: "opacity 0.15s",
                  color: "var(--text-muted)", fontSize: 14,
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = "1"}
                onMouseLeave={(e) => e.currentTarget.style.opacity = "0.5"}
                title="Настройки камеры"
              >
                ⚙️
              </button>
            </div>
            <div style={{ borderRadius: 10, overflow: "hidden", background: "#000", height: "calc(100% - 40px)", minHeight: 140, position: "relative" }}>
              {cam ? (
                <img
                  key={`${cam.id}-${cameraRefreshKey}`}
                  src={`/api/camera/stream/${cam.id}?t=${cameraRefreshKey}`}
                  alt="IP-камера"
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", cursor: "pointer" }}
                  onDoubleClick={() => setFullscreenCamera({ id: cam.id, label: cam.label })}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                    const el = document.getElementById(fallbackId);
                    if (el) el.style.display = "flex";
                  }}
                />
              ) : null}
              <div
                id={fallbackId}
                style={{
                  position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                  display: cam ? "none" : "flex", alignItems: "center", justifyContent: "center",
                  color: "var(--text-muted)", fontSize: 13, textAlign: "center", padding: 16,
                }}
              >
                <div>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>📷</div>
                  Камера недоступна<br />
                  <span style={{ fontSize: 11, opacity: 0.7 }}>{cam?.ip || "—"}</span>
                </div>
              </div>
            </div>
          </>
        );
      }
      case "widget-camera-4": {
        const cam = cameraSettingsList[3];
        const fallbackId = "camera-fallback-4";
        return (
          <>
            <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span>{cam?.label || "Видеокамера 4"}</span>
              <button
                onClick={(e) => { e.stopPropagation(); setEditingCameraIndex(3); }}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  padding: 2, opacity: 0.5, transition: "opacity 0.15s",
                  color: "var(--text-muted)", fontSize: 14,
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = "1"}
                onMouseLeave={(e) => e.currentTarget.style.opacity = "0.5"}
                title="Настройки камеры"
              >
                ⚙️
              </button>
            </div>
            <div style={{ borderRadius: 10, overflow: "hidden", background: "#000", height: "calc(100% - 40px)", minHeight: 140, position: "relative" }}>
              {cam ? (
                <img
                  key={`${cam.id}-${cameraRefreshKey}`}
                  src={`/api/camera/stream/${cam.id}?t=${cameraRefreshKey}`}
                  alt="IP-камера"
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", cursor: "pointer" }}
                  onDoubleClick={() => setFullscreenCamera({ id: cam.id, label: cam.label })}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                    const el = document.getElementById(fallbackId);
                    if (el) el.style.display = "flex";
                  }}
                />
              ) : null}
              <div
                id={fallbackId}
                style={{
                  position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                  display: cam ? "none" : "flex", alignItems: "center", justifyContent: "center",
                  color: "var(--text-muted)", fontSize: 13, textAlign: "center", padding: 16,
                }}
              >
                <div>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>📷</div>
                  Камера недоступна<br />
                  <span style={{ fontSize: 11, opacity: 0.7 }}>{cam?.ip || "—"}</span>
                </div>
              </div>
            </div>
          </>
        );
      }
      case "stat-task-profit":
        return (
          <>
            <div style={{ fontSize: 28, fontWeight: 700, color: "#10b981", marginBottom: 4 }}>
              {(taskFinanceStats?.totalProfit || 0).toLocaleString("ru")} ₽
            </div>
            <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Прибыль по задачам</div>
          </>
        );
      case "widget-task-finances":
        return (
          <>
            <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 12 }}>Помесячный отчёт по задачам</div>
            {!taskFinanceStats || taskFinanceStats.monthly?.length === 0 ? (
              <div style={{ color: "var(--text-muted)", fontSize: 13 }}>Нет данных</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {taskFinanceStats.monthly.map((m: any) => (
                  <div key={m.month} style={{ display: "grid", gridTemplateColumns: "1fr auto auto auto", gap: 12, padding: "10px 12px", borderRadius: 10, background: "var(--bg-input)", alignItems: "center" }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{m.month}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Бюджет: {(m.budget || 0).toLocaleString("ru")} ₽</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Расходы: {(m.expense || 0).toLocaleString("ru")} ₽</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: (m.profit || 0) >= 0 ? "#10b981" : "#dc2626" }}>Прибыль: {(m.profit || 0).toLocaleString("ru")} ₽</div>
                  </div>
                ))}
                <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid var(--border-color)", display: "grid", gridTemplateColumns: "1fr auto auto auto", gap: 12, fontWeight: 600, fontSize: 13 }}>
                  <div>Итого</div>
                  <div style={{ color: "var(--text-muted)" }}>{(taskFinanceStats?.totalBudget || 0).toLocaleString("ru")} ₽</div>
                  <div style={{ color: "var(--text-muted)" }}>{(taskFinanceStats?.totalExpense || 0).toLocaleString("ru")} ₽</div>
                  <div style={{ color: (taskFinanceStats?.totalProfit || 0) >= 0 ? "#10b981" : "#dc2626" }}>{(taskFinanceStats?.totalProfit || 0).toLocaleString("ru")} ₽</div>
                </div>
              </div>
            )}
          </>
        );
      default:
        return null;
    }
  };

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>Загрузка...</div>;

  const activeWidget = activeId ? ALL_WIDGETS.find((w) => w.id === activeId) : null;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>Директор</h2>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ display: "flex", gap: 4, background: "var(--bg-input)", borderRadius: 10, padding: 4 }}>
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: "6px 16px",
                  borderRadius: 8,
                  border: "none",
                  background: activeTab === tab ? "var(--bg-card)" : "transparent",
                  color: activeTab === tab ? "var(--text-primary)" : "var(--text-muted)",
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: "pointer",
                  boxShadow: activeTab === tab ? "var(--shadow)" : "none",
                  transition: "all 0.15s",
                }}
              >
                {tab}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowWidgetSettings(true)}
            style={{
              padding: "6px 12px",
              borderRadius: 8,
              border: "1px solid var(--border-color)",
              background: "var(--bg-input)",
              color: "var(--text-muted)",
              fontSize: 13,
              cursor: "pointer",
              transition: "all 0.15s",
            }}
            title="Настройки виджетов"
          >
            ⚙️
          </button>
        </div>
      </div>

      {!showWidgetSettings ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={visibleWidgets.map((w) => w.id)} strategy={rectSortingStrategy}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: 12,
                marginBottom: 24,
              }}
            >
              {visibleWidgets.map((widget) => (
                <SortableWidget key={widget.id} widget={widget} onHide={handleHide}>
                  {renderWidgetContent(widget)}
                </SortableWidget>
              ))}
            </div>
          </SortableContext>
          <DragOverlay>
            {activeWidget ? (
              <div
                style={{
                  padding: 20,
                  borderRadius: 16,
                  background: "var(--bg-card)",
                  border: "2px solid #007AFF",
                  boxShadow: "0 12px 32px rgba(0,0,0,0.2)",
                  cursor: "grabbing",
                  opacity: 0.95,
                  gridColumn: `span ${span(activeWidget.size)}`,
                  minHeight: activeWidget.size === "small" ? 100 : activeWidget.size === "medium" ? 220 : 280,
                }}
              >
                {renderWidgetContent(activeWidget)}
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      ) : showWidgetSettings ? (
        <div
          style={{
            padding: 24,
            borderRadius: 16,
            background: "var(--bg-card)",
            border: "1px solid var(--border-color)",
            boxShadow: "var(--shadow)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Видимость метрик — {activeTab}</h3>
            {hiddenWidgets.length > 0 && (
              <button
                onClick={handleShowAll}
                style={{
                  padding: "6px 14px",
                  borderRadius: 8,
                  border: "1px solid var(--border-color)",
                  background: "var(--bg-input)",
                  color: "var(--text-primary)",
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                Показать все
              </button>
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 10 }}>
            {tabWidgets.map((widget) => {
              const isVisible = !hidden.has(widget.id);
              return (
                <label
                  key={widget.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 14px",
                    borderRadius: 10,
                    background: isVisible ? "var(--bg-input)" : "transparent",
                    border: "1px solid var(--border-color)",
                    cursor: "pointer",
                    opacity: isVisible ? 1 : 0.6,
                    transition: "opacity 0.15s",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isVisible}
                    onChange={() => isVisible ? handleHide(widget.id) : handleShow(widget.id)}
                    style={{ width: 18, height: 18, cursor: "pointer", accentColor: "#007AFF" }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{getWidgetLabel(widget, pskovlineSettings)}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                      {widget.size === "small" ? "Маленькая" : widget.size === "medium" ? "Средняя" : "Большая"}
                    </div>
                  </div>
                </label>
              );
            })}
          </div>

          {hiddenWidgets.length > 0 && (
            <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--border-color)" }}>
              <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 10 }}>
                Скрытые метрики ({hiddenWidgets.length}):
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {hiddenWidgets.map((w) => (
                  <button
                    key={w.id}
                    onClick={() => handleShow(w.id)}
                    style={{
                      padding: "4px 10px",
                      borderRadius: 6,
                      border: "1px solid var(--border-color)",
                      background: "var(--bg-hover)",
                      color: "var(--text-primary)",
                      fontSize: 12,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    {w.label}
                    <span style={{ color: "#10b981", fontWeight: 700 }}>+</span>
                  </button>
                ))}
              </div>
            </div>
          )}


        </div>
      ) : null}

      {/* Модальное окно настроек Псковлайн */}
      {showPskovlineSettings && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.4)", zIndex: 100,
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "max(16px, env(safe-area-inset-top, 0)) max(16px, env(safe-area-inset-right, 0)) max(16px, env(safe-area-inset-bottom, 0)) max(16px, env(safe-area-inset-left, 0))",
        }} onClick={() => setShowPskovlineSettings(false)}>
          <div style={{
            background: "var(--bg-card)", borderRadius: 16, padding: 24,
            width: "100%", maxWidth: 420, boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
            border: "1px solid var(--border-color)",
          }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 600 }}>Настройки Псковлайн</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4, display: "block" }}>Название виджета</label>
                <input
                  type="text"
                  value={pskovlineSettings?.label || ""}
                  onChange={(e) => setPskovlineSettings((s: any) => ({ ...s, label: e.target.value }))}
                  style={{
                    width: "100%", padding: "10px 12px", borderRadius: 10,
                    border: "1px solid var(--border-color)", background: "var(--bg-input)",
                    color: "var(--text-primary)", fontSize: 14,
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4, display: "block" }}>Логин</label>
                <input
                  type="text"
                  value={pskovlineSettings?.login || ""}
                  onChange={(e) => setPskovlineSettings((s: any) => ({ ...s, login: e.target.value }))}
                  style={{
                    width: "100%", padding: "10px 12px", borderRadius: 10,
                    border: "1px solid var(--border-color)", background: "var(--bg-input)",
                    color: "var(--text-primary)", fontSize: 14,
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4, display: "block" }}>Пароль</label>
                <input
                  type="password"
                  value={pskovlineSettings?.password || ""}
                  onChange={(e) => setPskovlineSettings((s: any) => ({ ...s, password: e.target.value }))}
                  style={{
                    width: "100%", padding: "10px 12px", borderRadius: 10,
                    border: "1px solid var(--border-color)", background: "var(--bg-input)",
                    color: "var(--text-primary)", fontSize: 14,
                  }}
                />
              </div>
            </div>
            <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--border-color)" }}>
              <h4 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 600 }}>Второй аккаунт</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4, display: "block" }}>Название</label>
                  <input
                    type="text"
                    value={pskovlineSettings?.label2 || ""}
                    onChange={(e) => setPskovlineSettings((s: any) => ({ ...s, label2: e.target.value }))}
                    style={{
                      width: "100%", padding: "10px 12px", borderRadius: 10,
                      border: "1px solid var(--border-color)", background: "var(--bg-input)",
                      color: "var(--text-primary)", fontSize: 14,
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4, display: "block" }}>Логин</label>
                  <input
                    type="text"
                    value={pskovlineSettings?.login2 || ""}
                    onChange={(e) => setPskovlineSettings((s: any) => ({ ...s, login2: e.target.value }))}
                    style={{
                      width: "100%", padding: "10px 12px", borderRadius: 10,
                      border: "1px solid var(--border-color)", background: "var(--bg-input)",
                      color: "var(--text-primary)", fontSize: 14,
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4, display: "block" }}>Пароль</label>
                  <input
                    type="password"
                    value={pskovlineSettings?.password2 || ""}
                    onChange={(e) => setPskovlineSettings((s: any) => ({ ...s, password2: e.target.value }))}
                    style={{
                      width: "100%", padding: "10px 12px", borderRadius: 10,
                      border: "1px solid var(--border-color)", background: "var(--bg-input)",
                      color: "var(--text-primary)", fontSize: 14,
                    }}
                  />
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 20, justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowPskovlineSettings(false)}
                style={{
                  padding: "8px 16px", borderRadius: 10, border: "1px solid var(--border-color)",
                  background: "var(--bg-input)", color: "var(--text-primary)", fontSize: 13, cursor: "pointer",
                }}
              >Отмена</button>
              <button
                onClick={async () => {
                  try {
                    const token = localStorage.getItem('token');
                    const res = await fetch('/api/pskovline/settings', {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                      body: JSON.stringify(pskovlineSettings),
                    });
                    if (res.ok) {
                      const saved = await res.json();
                      setPskovlineSettings(saved);
                      setShowPskovlineSettings(false);
                      // Перезагружаем данные
                      fetch("/api/pskovline").then(r => r.ok ? r.json() : null).then((data) => {
        if (data?.accounts) {
          setPskovlineData(data.accounts[0] || null);
          setPskovlineData2(data.accounts[1] || null);
        }
      }).catch(() => {});
                    }
                  } catch {}
                }}
                style={{
                  padding: "8px 16px", borderRadius: 10, border: "none",
                  background: "#007AFF", color: "#fff", fontSize: 13, cursor: "pointer", fontWeight: 500,
                }}
              >Сохранить</button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно настроек камеры */}
      {editingCameraIndex !== null && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.4)", zIndex: 100,
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "max(16px, env(safe-area-inset-top, 0)) max(16px, env(safe-area-inset-right, 0)) max(16px, env(safe-area-inset-bottom, 0)) max(16px, env(safe-area-inset-left, 0))",
        }} onClick={() => setEditingCameraIndex(null)}>
          <div style={{
            background: "var(--bg-card)", borderRadius: 16, padding: 24,
            width: "100%", maxWidth: 420, boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
            border: "1px solid var(--border-color)",
          }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 600 }}>Настройки камеры</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4, display: "block" }}>Название виджета</label>
                <input
                  type="text"
                  value={cameraSettingsList[editingCameraIndex]?.label || ""}
                  onChange={(e) => setCameraSettingsList((list: any[]) => {
                    const next = [...list];
                    next[editingCameraIndex] = { ...next[editingCameraIndex], label: e.target.value };
                    return next;
                  })}
                  style={{
                    width: "100%", padding: "10px 12px", borderRadius: 10,
                    border: "1px solid var(--border-color)", background: "var(--bg-input)",
                    color: "var(--text-primary)", fontSize: 14,
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4, display: "block" }}>IP-адрес</label>
                <input
                  type="text"
                  value={cameraSettingsList[editingCameraIndex]?.ip || ""}
                  onChange={(e) => setCameraSettingsList((list: any[]) => {
                    const next = [...list];
                    next[editingCameraIndex] = { ...next[editingCameraIndex], ip: e.target.value };
                    return next;
                  })}
                  style={{
                    width: "100%", padding: "10px 12px", borderRadius: 10,
                    border: "1px solid var(--border-color)", background: "var(--bg-input)",
                    color: "var(--text-primary)", fontSize: 14,
                  }}
                />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4, display: "block" }}>Порт RTSP</label>
                  <input
                    type="number"
                    value={cameraSettingsList[editingCameraIndex]?.port || 554}
                    onChange={(e) => setCameraSettingsList((list: any[]) => {
                      const next = [...list];
                      next[editingCameraIndex] = { ...next[editingCameraIndex], port: parseInt(e.target.value) || 554 };
                      return next;
                    })}
                    style={{
                      width: "100%", padding: "10px 12px", borderRadius: 10,
                      border: "1px solid var(--border-color)", background: "var(--bg-input)",
                      color: "var(--text-primary)", fontSize: 14,
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4, display: "block" }}>Канал</label>
                  <input
                    type="text"
                    value={cameraSettingsList[editingCameraIndex]?.channel || ""}
                    onChange={(e) => setCameraSettingsList((list: any[]) => {
                      const next = [...list];
                      next[editingCameraIndex] = { ...next[editingCameraIndex], channel: e.target.value };
                      return next;
                    })}
                    style={{
                      width: "100%", padding: "10px 12px", borderRadius: 10,
                      border: "1px solid var(--border-color)", background: "var(--bg-input)",
                      color: "var(--text-primary)", fontSize: 14,
                    }}
                  />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4, display: "block" }}>Логин</label>
                <input
                  type="text"
                  value={cameraSettingsList[editingCameraIndex]?.username || ""}
                  onChange={(e) => setCameraSettingsList((list: any[]) => {
                    const next = [...list];
                    next[editingCameraIndex] = { ...next[editingCameraIndex], username: e.target.value };
                    return next;
                  })}
                  style={{
                    width: "100%", padding: "10px 12px", borderRadius: 10,
                    border: "1px solid var(--border-color)", background: "var(--bg-input)",
                    color: "var(--text-primary)", fontSize: 14,
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4, display: "block" }}>Пароль</label>
                <input
                  type="password"
                  value={cameraSettingsList[editingCameraIndex]?.password || ""}
                  onChange={(e) => setCameraSettingsList((list: any[]) => {
                    const next = [...list];
                    next[editingCameraIndex] = { ...next[editingCameraIndex], password: e.target.value };
                    return next;
                  })}
                  style={{
                    width: "100%", padding: "10px 12px", borderRadius: 10,
                    border: "1px solid var(--border-color)", background: "var(--bg-input)",
                    color: "var(--text-primary)", fontSize: 14,
                  }}
                />
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={cameraSettingsList[editingCameraIndex]?.isActive !== false}
                  onChange={(e) => setCameraSettingsList((list: any[]) => {
                    const next = [...list];
                    next[editingCameraIndex] = { ...next[editingCameraIndex], isActive: e.target.checked };
                    return next;
                  })}
                  style={{ width: 16, height: 16, accentColor: "#007AFF" }}
                />
                Камера активна
              </label>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 20, justifyContent: "flex-end" }}>
              <button
                onClick={() => setEditingCameraIndex(null)}
                style={{
                  padding: "8px 16px", borderRadius: 10, border: "1px solid var(--border-color)",
                  background: "var(--bg-input)", color: "var(--text-primary)", fontSize: 13, cursor: "pointer",
                }}
              >Отмена</button>
              <button
                onClick={async () => {
                  try {
                    const cam = cameraSettingsList[editingCameraIndex];
                    if (!cam?.id) return;
                    const saved = await api.camera.saveCamera(cam.id, cam);
                    setCameraSettingsList((list: any[]) => {
                      const next = [...list];
                      next[editingCameraIndex] = saved;
                      return next;
                    });
                    setEditingCameraIndex(null);
                  } catch {}
                }}
                style={{
                  padding: "8px 16px", borderRadius: 10, border: "none",
                  background: "#007AFF", color: "#fff", fontSize: 13, cursor: "pointer", fontWeight: 500,
                }}
              >Сохранить</button>
            </div>
          </div>
        </div>
      )}

      {/* Полноэкранный просмотр камеры */}
      {fullscreenCamera && (
        <div
          style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
            background: "#000", zIndex: 200,
            display: "flex", flexDirection: "column",
          }}
          onClick={() => setFullscreenCamera(null)}
        >
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "calc(12px + env(safe-area-inset-top, 0)) 20px 12px", background: "rgba(0,0,0,0.8)",
          }}>
            <span style={{ color: "#fff", fontSize: 15, fontWeight: 500 }}>{fullscreenCamera.label}</span>
            <button
              onClick={() => setFullscreenCamera(null)}
              style={{
                background: "none", border: "none", color: "#fff",
                fontSize: 20, cursor: "pointer", padding: "4px 8px",
              }}
            >
              ✕
            </button>
          </div>
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
            <img
              src={`/api/camera/stream/${fullscreenCamera.id}?t=${cameraRefreshKey}`}
              alt={fullscreenCamera.label}
              style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}
