import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { api } from "../api/client";
import { useRealtime } from "../hooks/useRealtime";
import { Task, User, Project, Status } from "../types";
import { userOptionLabel } from "../lib/userOptionLabel";
import { formatDateTime, toDateTimeLocalValue, fromDateTimeLocalValue, nowDateTimeLocalValue } from "../lib/formatDate";
import { TaskCalendar } from "./TaskCalendar";
import { ContactPicker } from "./ContactPicker";
import { Avatar } from "./Avatar";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
const priorityLabels: Record<string, string> = {
  low: "Низкий",
  medium: "Средний",
  high: "Высокий",
  urgent: "Срочный",
};
type ViewMode = "grid" | "list" | "kanban" | "calendar";
const assignableUsers = (users: User[]) =>
  users.filter((u) => {
    const r = typeof u.role === "string" ? null : u.role;
    return r?.isAssignable !== false;
  });
export function TaskList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  // Гостевой доступ: создание задач недоступно
  const isGuest = (user as any)?.isGuest === true;
  const canEditTask = (task: Task) => isAdmin || task.creatorId === user?.id || (task.curators || []).some(c => c.id === user?.id);
  const [searchParams] = useSearchParams();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [statuses, setStatuses] = useState<Status[]>([]);
  // Права роли на смену статуса: опция "Разрешить смену статуса у задач" + список доступных статусов
  const canChangeTaskStatus = isAdmin || (user as any)?.canChangeTaskStatus !== false;
  const canHandleSpam = isAdmin || (user as any)?.canHandleSpam === true;
  const allowedTaskStatusNames: string[] = (user as any)?.allowedTaskStatuses || [];
  const visibleStatuses = statuses.filter(
    (s) => allowedTaskStatusNames.length === 0 || allowedTaskStatusNames.includes(s.name)
  );
  const [hideCompleted, setHideCompleted] = useState(() => {
    const fromUrl = searchParams.get("hideCompleted");
    return fromUrl !== null ? fromUrl === "true" : true;
  });
  // Фильтр «Избранное» (приходит из дашборда: /tasks?favorite=true)
  const [favoriteOnly, setFavoriteOnly] = useState(
    () => searchParams.get("favorite") === "true",
  );
  const [filter, setFilter] = useState(() => searchParams.get("filter") || "all");
  const [assigneeFilter, setAssigneeFilter] = useState<string>(() => {
    const fromUrl = searchParams.get("assigneeId");
    return fromUrl || "all";
  });
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [contactFilter, setContactFilter] = useState<string>(() => {
    const fromUrl = searchParams.get("contactId");
    return fromUrl || "";
  });
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const saved = localStorage.getItem("taskViewMode") as ViewMode;
    return ["grid", "list", "kanban", "calendar"].includes(saved) ? saved : "grid";
  });
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [preselectedParentId, setPreselectedParentId] = useState<string | null>(
    null,
  );
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  // Свернутые группы проектов на канбан-доске: ключ "<статус>|<проект>"
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>(() => {
    try {
      return JSON.parse(localStorage.getItem("kanbanCollapsedGroups") || "{}");
    } catch {
      return {};
    }
  });
  const toggleGroup = (key: string) => {
    setCollapsedGroups((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      localStorage.setItem("kanbanCollapsedGroups", JSON.stringify(next));
      return next;
    });
  };
  // Mobile kanban states
  const [isMobile, setIsMobile] = useState(false);
  const [mobileColumnIndex, setMobileColumnIndex] = useState(0);
  const defaultStatus = (statuses.find((s) => s.isDefault)?.name ||
    statuses[0]?.name ||
    "open") as string;
  const [form, setForm] = useState({
    title: "",
    description: "",
    status: defaultStatus,
    priority: "medium",
    dueDate: "",
    startDate: "",
    assigneeIds: [] as string[],
    curatorIds: [] as string[],
    projectId: "",
    parentId: "",
    contactId: "",
  });
  const [contactText, setContactText] = useState("");
  useEffect(() => {
    api.profile
      .get()
      .then((u) => {
        // Only apply profile default if URL didn't specify hideCompleted
        const fromUrl = searchParams.get("hideCompleted");
        if (fromUrl === null) {
          setHideCompleted(u.hideCompletedTasks ?? true);
        }
      })
      .catch(() => {});
    loadTasks();
    api.users.list().then(setUsers);
    api.projects.list("flat=true").then(setProjects);
    api.statuses.list("task").then(setStatuses);
  }, [filter, assigneeFilter, projectFilter, contactFilter, search, sortBy, hideCompleted, favoriteOnly]);
  const loadTasks = () => {
    let params = new URLSearchParams();
    if (filter !== "all") params.set("filter", filter);
    if (assigneeFilter !== "all") params.set("assigneeId", assigneeFilter);
    if (projectFilter !== "all") params.set("project", projectFilter);
    if (contactFilter) params.set("contactId", contactFilter);
    if (search) params.set("search", search);
    if (sortBy) params.set("sort", sortBy);
    if (hideCompleted) params.set("hideCompleted", "true");
    if (favoriteOnly) params.set("favorite", "true");
    api.tasks.list(params.toString()).then(setTasks);
  };

  // Real-time updates for tasks
  useRealtime(["tasks"], (data) => {
    if (data.entity === "task") loadTasks();
  });

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Reload tasks when window gets focus (e.g. returning from detail page)
  useEffect(() => {
    const handleFocus = () => loadTasks();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  // Force kanban view on mobile
  useEffect(() => {
    if (isMobile && viewMode !== "kanban" && viewMode !== "calendar") {
      setViewMode("kanban");
    }
  }, [isMobile]);

  const getStatusLabel = (name: string) =>
    statuses.find((s) => s.name === name)?.label || name;
  const getStatusStyle = (name: string) => {
    const s = statuses.find((st) => st.name === name);
    return s
      ? { bg: s.color, text: s.textColor }
      : { bg: "#f0f0f0", text: "#666" };
  };
  const getTaskBackground = (statusColor: string) => {
    const hex = statusColor.replace("#", "");
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, 0.08)`;
  };
  const getTaskBorderLeft = (statusColor: string) => {
    return `3px solid ${statusColor}`;
  };
  // Переключение отметки «Избранное» на карточке задачи
  const handleToggleFavorite = (task: Task) => {
    api.tasks
      .update(task.id, { isFavorite: !task.isFavorite })
      .then(() => loadTasks())
      .catch(() => {});
  };

  const changeView = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem("taskViewMode", mode);
  };
  // Автоподстановка отмеченных пользователей при создании новой задачи
  const defaultAssigneeIds = () =>
    users.filter((u) => u.defaultTaskAssignee).map((u) => u.id);
  const defaultCuratorIds = () =>
    users
      .filter((u) => u.defaultTaskCurator && u.canBeCurator)
      .map((u) => u.id);


  const openCreate = (parentId?: string) => {
    setEditingId(null);
    setPreselectedParentId(parentId || null);
    setForm({
      title: "",
      description: "",
      status: defaultStatus,
      priority: "medium",
      dueDate: "",
      startDate: nowDateTimeLocalValue(),
      assigneeIds: defaultAssigneeIds(),
      curatorIds: defaultCuratorIds(),
      projectId: "",
      parentId: parentId || "",
      contactId: "",
    });
    setContactText("");
    setShowModal(true);
  };
  const openEdit = (task: Task) => {
    setEditingId(task.id);
    setPreselectedParentId(null);
    setForm({
      title: task.title,
      description: task.description || "",
      status: task.status,
      priority: task.priority,
      dueDate: toDateTimeLocalValue(task.dueDate, user?.timezone),
      startDate: toDateTimeLocalValue(task.startDate, user?.timezone),
      assigneeIds: task.assignees?.map((a) => a.user.id) || [],
      curatorIds: task.curators?.map((c) => c.id) || [],
      projectId: task.projectId || "",
      parentId: task.parentId || "",
      contactId: task.contact?.id || "",
    });
    setContactText(task.contact?.name || "");
    setShowModal(true);
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      ...form,
      dueDate: form.dueDate ? fromDateTimeLocalValue(form.dueDate, user?.timezone) : form.dueDate,
      startDate: form.startDate ? fromDateTimeLocalValue(form.startDate, user?.timezone) : form.startDate,
      assigneeIds: form.assigneeIds.length ? form.assigneeIds : undefined,
      curatorIds: form.curatorIds.length ? form.curatorIds : undefined,
      contactId: form.contactId || undefined,
    };
    if (editingId) {
      await api.tasks.update(editingId, data);
    } else {
      await api.tasks.create(data);
    }
    setShowModal(false);
    loadTasks();
  };
  const handleMarkSpam = async (task: Task) => {
    if (!window.confirm(`Отметить как СПАМ?\nАдрес ${task.sourceEmail} попадёт в спам-фильтры, письма будут уходить в Junk без создания задач.`)) return;
    try {
      const res = await api.tasks.markSpam(task.id);
      if (res.message) window.alert(res.message);
    } catch (e: any) {
      window.alert(e.message || 'Ошибка обработки СПАМА');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Удалить задачу?")) return;
    await api.tasks.delete(id);
    loadTasks();
  };
  const toggleExpand = (id: string) => {
    setExpandedTasks((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const filteredTasks = tasks.filter((t) => {
    if (hideCompleted) {
      const taskStatus = statuses.find((s) => s.name === t.status);
      if (taskStatus && !taskStatus.isActive) return false;
    }
    if (contactFilter && t.contactId !== contactFilter) return false;
    return true;
  });
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    switch (sortBy) {
      case "dueDate":
        return (
          (a.dueDate ? new Date(a.dueDate).getTime() : Infinity) -
          (b.dueDate ? new Date(b.dueDate).getTime() : Infinity)
        );
      case "priority":
        const p = { urgent: 4, high: 3, medium: 2, low: 1 };
        return (p[b.priority] || 0) - (p[a.priority] || 0);
      case "createdAt":
      default:
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    }
  });
  const getSubtasks = (parentId: string) =>
    sortedTasks.filter((t) => t.parentId === parentId);
  const rootTasks = sortedTasks.filter((t) => !t.parentId);

  // Group root tasks by project
  const groupByProject = (tasks: Task[]) => {
    const groups = new Map<string, { name: string; tasks: Task[] }>();
    const noProjectKey = "__no_project__";
    groups.set(noProjectKey, { name: "Без проекта", tasks: [] });
    for (const t of tasks) {
      if (t.projectId) {
        const p = projects.find((pr) => pr.id === t.projectId);
        const key = t.projectId;
        if (!groups.has(key)) {
          groups.set(key, { name: p?.name || "Проект", tasks: [] });
        }
        groups.get(key)!.tasks.push(t);
      } else {
        groups.get(noProjectKey)!.tasks.push(t);
      }
    }
    // Remove empty "no project" group
    if (groups.get(noProjectKey)?.tasks.length === 0) {
      groups.delete(noProjectKey);
    }
    return Array.from(groups.entries()).map(([id, g]) => ({ id, ...g }));
  };

  const taskGroups = groupByProject(rootTasks);
  const viewBtn = (mode: ViewMode, label: string, icon: string) => (
    <button
      key={mode}
      onClick={() => changeView(mode)}
      title={label}
      style={{
        padding: "6px 12px",
        borderRadius: 8,
        border: "none",
        background: viewMode === mode ? "#1a1a1a" : "transparent",
        color: viewMode === mode ? "#fff" : "#666",
        fontSize: 13,
        fontWeight: 500,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 4,
      }}
    >
      {icon} {label}
    </button>
  );
  const renderGrid = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {taskGroups.map((group) => (
        <div key={group.id}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "var(--text-secondary)",
              marginBottom: 10,
              padding: "6px 12px",
              background: "var(--bg-input)",
              borderRadius: 10,
              display: "inline-block",
            }}
          >
            {group.name} ({group.tasks.length})
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: 12,
            }}
          >
            {group.tasks.map((task) => {
        const subtasks = getSubtasks(task.id);
        const isExpanded = expandedTasks.has(task.id);
        const st = getStatusStyle(task.status);
        const taskBg = getTaskBackground(st.bg);
        const taskBorder = getTaskBorderLeft(st.bg);
        return (
          <div
            key={task.id}
            style={{
              padding: 16,
              borderRadius: 16,
              border: "1px solid var(--border-color)",
              background: taskBg,
              borderLeft: taskBorder,
              boxShadow: "var(--shadow)",
            }}
          >
            {" "}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: 8,
                gap: 8,
              }}
            >
              {" "}
              <div
                onClick={() => navigate(`/tasks/${task.id}`)}
                style={{ flex: 1, cursor: "pointer", minWidth: 0 }}
              >
                {" "}
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 500,
                    marginBottom: 4,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  #{task.ticketNumber} {task.title}
                </div>{" "}
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--text-muted)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {task.description?.slice(0, 60) || "—"}
                </div>{" "}
              </div>{" "}
              <div style={{ display: "flex", gap: 4, flexShrink: 0, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
                {" "}
                <span
                  style={{
                    padding: "2px 8px",
                    borderRadius: 10,
                    fontSize: 11,
                    background: st.bg,
                    color: st.text,
                    whiteSpace: "nowrap",
                  }}
                >
                  {getStatusLabel(task.status)}
                </span>{" "}
                <span
                  style={{
                    padding: "2px 8px",
                    borderRadius: 10,
                    fontSize: 11,
                    background:
                      task.priority === "urgent"
                        ? "#fee2e2"
                        : task.priority === "high"
                          ? "#fef3c7"
                          : "#f0f0f0",
                    color:
                      task.priority === "urgent"
                        ? "#dc2626"
                        : task.priority === "high"
                          ? "#92400e"
                          : "#666",
                    whiteSpace: "nowrap",
                  }}
                >
                  {priorityLabels[task.priority]}
                </span>{" "}
                {canEditTask(task) && (
                  <button
                    onClick={() => openEdit(task)}
                    title="Изменить"
                    style={{
                      width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center",
                      borderRadius: 8, border: "1px solid var(--border-color)", background: "var(--bg-card)",
                      color: "var(--text-color)", cursor: "pointer",
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                    </svg>
                  </button>
                )}{" "}
                {isAdmin && (
                  <button
                    onClick={() => handleDelete(task.id)}
                    title="Удалить"
                    style={{
                      width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center",
                      borderRadius: 8, border: "1px solid var(--border-color)", background: "var(--bg-card)",
                      color: "#dc2626", cursor: "pointer",
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 6h18" />
                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                      <line x1="10" y1="11" x2="10" y2="17" />
                      <line x1="14" y1="11" x2="14" y2="17" />
                    </svg>
                  </button>
                )}{" "}
              </div>{" "}
            </div>{" "}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontSize: 12,
                color: "var(--text-muted)",
                marginBottom: 8,
                flexWrap: "wrap",
                gap: 4,
              }}
            >
              {" "}
              <span>
                {task.startDate ? `Начало: ${formatDateTime(task.startDate, user?.timezone)} · ` : ""}
                {task.dueDate ? (
                  <b>{formatDateTime(task.dueDate, user?.timezone)}</b>
                ) : (
                  "Без срока"
                )}
              </span>{" "}
            </div>{" "}
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
              Исполнители:{" "}
              {task.assignees?.map((a) => a.user.name).join(", ") ||
                "Не назначено"}
            </div>{" "}
            {task.curators && task.curators.length > 0 && (
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                Кураторы: {task.curators.map((c) => c.name).join(", ")}
              </div>
            )}{" "}
            {task.contact && (
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                Контакт:{" "}
                <span
                  style={{ color: "#1565c0", cursor: "pointer" }}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/contacts/${task.contact!.id}`);
                  }}
                >
                  {task.contact.name}
                </span>
              </div>
            )}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              {" "}
              <div style={{ display: "flex", gap: 8 }}>
                {" "}
                <button
                  onClick={() => openCreate(task.id)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--text-muted)",
                    cursor: "pointer",
                    fontSize: 12,
                  }}
                >
                  ➕ Подзадача
                </button>{" "}
              </div>{" "}
              {subtasks.length > 0 && (
                <button
                  onClick={() => toggleExpand(task.id)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--text-secondary)",
                    cursor: "pointer",
                    fontSize: 12,
                  }}
                >
                  {" "}
                  {isExpanded ? "▲" : "▼"} {subtasks.length} подзадач{" "}
                </button>
              )}{" "}
            </div>{" "}
            {isExpanded && subtasks.length > 0 && (
              <div
                style={{
                  marginTop: 12,
                  paddingTop: 12,
                  borderTop: "1px solid #f0f0f0",
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                {" "}
                {subtasks.map((sub) => {
                  const sst = getStatusStyle(sub.status);
                  const subBg = getTaskBackground(sst.bg);
                  const subBorder = getTaskBorderLeft(sst.bg);
                  return (
                    <div
                      key={sub.id}
                      onClick={() => navigate(`/tasks/${sub.id}`)}
                      style={{
                        padding: 10,
                        borderRadius: 10,
                        background: subBg,
                        borderLeft: subBorder,
                        cursor: "pointer",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      {" "}
                      <span style={{ fontSize: 13 }}>{sub.title}</span>{" "}
                      <span
                        style={{
                          padding: "2px 6px",
                          borderRadius: 8,
                          fontSize: 10,
                          background: sst.bg,
                          color: sst.text,
                        }}
                      >
                        {getStatusLabel(sub.status)}
                      </span>{" "}
                    </div>
                  );
                })}{" "}
              </div>
            )}{" "}
          </div>
        );
      })}{" "}
          </div>
        </div>
      ))}{" "}
      {rootTasks.length === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: 40,
            color: "var(--text-muted)",
            fontSize: 14,
          }}
        >
          {!isAdmin && projects.length === 0 ? "Вы не привязаны ни к одному проекту. Обратитесь к своему менеджеру" : "Задачи не найдены"}
        </div>
      )}{" "}
    </div>
  );
  const renderList = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {taskGroups.map((group) => (
        <div
          key={group.id}
          style={{
            borderRadius: 12,
            border: "1px solid var(--border-color)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "10px 16px",
              background: "var(--bg-input)",
              fontSize: 13,
              fontWeight: 600,
              color: "var(--text-secondary)",
              borderBottom: "1px solid var(--border-color)",
            }}
          >
            {group.name} ({group.tasks.length})
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 100px 90px 110px 120px 1fr 100px",
              gap: 8,
              padding: "10px 16px",
              background: "var(--bg-input)",
              fontSize: 12,
              fontWeight: 600,
              color: "var(--text-secondary)",
              borderBottom: "1px solid var(--border-color)",
            }}
          >
            {" "}
            <span>Название</span> <span>Статус</span> <span>Приоритет</span>{" "}
            <span>Срок</span> <span>Контакт</span> <span>Исполнители</span>{" "}
            <span style={{ textAlign: "center" }}>Действия</span>{" "}
          </div>{" "}
          {group.tasks.map((task) => {
        const st = getStatusStyle(task.status);
        const taskBg = getTaskBackground(st.bg);
        const taskBorder = getTaskBorderLeft(st.bg);
        return (
          <div
            key={task.id}
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 100px 90px 110px 120px 1fr 100px",
              gap: 8,
              padding: "10px 16px",
              alignItems: "center",
              borderBottom: "1px solid #f5f5f5",
              fontSize: 13,
              cursor: "pointer",
              transition: "background 0.15s",
              background: taskBg,
              borderLeft: taskBorder,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#fafafa")}
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = taskBg)
            }
            onClick={() => navigate(`/tasks/${task.id}`)}
          >
            {" "}
            <div
              style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                fontWeight: 500,
              }}
            >
              #{task.ticketNumber} {task.title}
            </div>{" "}
            <span
              style={{
                padding: "2px 8px",
                borderRadius: 10,
                fontSize: 11,
                background: st.bg,
                color: st.text,
                whiteSpace: "nowrap",
                justifySelf: "start",
              }}
            >
              {getStatusLabel(task.status)}
            </span>{" "}
            <span
              style={{
                padding: "2px 8px",
                borderRadius: 10,
                fontSize: 11,
                background:
                  task.priority === "urgent"
                    ? "#fee2e2"
                    : task.priority === "high"
                      ? "#fef3c7"
                      : "#f0f0f0",
                color:
                  task.priority === "urgent"
                    ? "#dc2626"
                    : task.priority === "high"
                      ? "#92400e"
                      : "#666",
                whiteSpace: "nowrap",
                justifySelf: "start",
              }}
            >
              {priorityLabels[task.priority]}
            </span>{" "}
            <span style={{ color: "var(--text-muted)", fontSize: 12 }}>
              {task.startDate ? `${formatDateTime(task.startDate, user?.timezone)} → ` : ""}
              {task.dueDate ? (
                <b>{formatDateTime(task.dueDate, user?.timezone)}</b>
              ) : (
                "—"
              )}
            </span>{" "}
            <span style={{ color: "var(--text-secondary)", fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {task.contact?.name || "—"}
            </span>{" "}
            <span
              style={{
                color: "var(--text-secondary)",
                fontSize: 12,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {task.assignees?.map((a) => a.user.name).join(", ") ||
                "Не назначено"}
            </span>{" "}
            {task.curators && task.curators.length > 0 && (
              <span style={{ color: "var(--text-muted)", fontSize: 11 }}>
                Кураторы: {task.curators.map((c) => c.name).join(", ")}
              </span>
            )}{" "}

            <div
              style={{ display: "flex", gap: 6, justifyContent: "center" }}
              onClick={(e) => e.stopPropagation()}
            >
              {" "}
              {canEditTask(task) && (
                <button
                  onClick={() => openEdit(task)}
                  title="Изменить"
                  style={{
                    width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center",
                    borderRadius: 8, border: "1px solid var(--border-color)", background: "var(--bg-card)",
                    color: "var(--text-color)", cursor: "pointer",
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                  </svg>
                </button>
              )}{" "}
              {isAdmin && (
                <button
                  onClick={() => handleDelete(task.id)}
                  title="Удалить"
                  style={{
                    width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center",
                    borderRadius: 8, border: "1px solid var(--border-color)", background: "var(--bg-card)",
                    color: "#dc2626", cursor: "pointer",
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18" />
                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                    <line x1="10" y1="11" x2="10" y2="17" />
                    <line x1="14" y1="11" x2="14" y2="17" />
                  </svg>
                </button>
              )}{" "}
            </div>{" "}
          </div>
        );
      })}{" "}
        </div>
      ))}{" "}
      {rootTasks.length === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: 40,
            color: "var(--text-muted)",
            fontSize: 14,
          }}
        >
          {!isAdmin && projects.length === 0 ? "Вы не привязаны ни к одному проекту. Обратитесь к своему менеджеру" : "Задачи не найдены"}
        </div>
      )}{" "}
    </div>
  );
  const renderKanban = () => {
    // Пользователь без привязанных проектов не видит задачи ни в одном режиме
    // Карточка канбана — переиспользуется в колонках статусов и в колонке «Избранные»
    const renderKanbanCard = (task: Task) => (
    <div
      key={task.id}
      style={{
        padding: 14,
        borderRadius: 14,
        border: "1px solid var(--border-color)",
        background: getTaskBackground(getStatusStyle(task.status).bg),
        borderLeft: getTaskBorderLeft(getStatusStyle(task.status).bg),
        cursor: "pointer",
        boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
        position: "relative",
      }}
      onClick={() => navigate(`/tasks/${task.id}`)}
    >
      {" "}
      <div
        style={{
          position: "absolute",
          top: 8,
          right: 8,
          display: "flex",
          gap: 4,
        }}
      >
        {" "}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleToggleFavorite(task);
          }}
          title={task.isFavorite ? "Убрать из избранного" : "В избранное"}
          style={{
            width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center",
            borderRadius: 8, border: "1px solid var(--border-color)", background: "var(--bg-card)",
            color: task.isFavorite ? "#f59e0b" : "var(--text-muted)", cursor: "pointer",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill={task.isFavorite ? "#f59e0b" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        </button>
        {" "}
        {canHandleSpam && task.sourceEmail && task.status !== "spam" && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleMarkSpam(task);
            }}
            title="СПАМ: добавить адрес в спам-фильтры (Junk), задача → «Спам»"
            style={{
              width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center",
              borderRadius: 8, border: "1px solid var(--border-color)", background: "var(--bg-card)",
              fontSize: 15, cursor: "pointer", lineHeight: 1,
            }}
          >
            ☠️
          </button>
        )}
        {" "}
        {canEditTask(task) && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              openEdit(task);
            }}
            title="Изменить"
            style={{
              width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center",
              borderRadius: 8, border: "1px solid var(--border-color)", background: "var(--bg-card)",
              color: "var(--text-color)", cursor: "pointer",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
            </svg>
          </button>
        )}{" "}
        {isAdmin && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(task.id);
            }}
            title="Удалить"
            style={{
              width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center",
              borderRadius: 8, border: "1px solid var(--border-color)", background: "var(--bg-card)",
              color: "#dc2626", cursor: "pointer",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18" />
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
              <line x1="10" y1="11" x2="10" y2="17" />
              <line x1="14" y1="11" x2="14" y2="17" />
            </svg>
          </button>
        )}{" "}
      </div>{" "}
      <div
        style={{
          display: "flex",
          gap: 6,
          alignItems: "baseline",
          marginBottom: 6,
          paddingRight: 132,
        }}
      >
        {task.ticketNumber != null && (
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "var(--text-muted)",
              flexShrink: 0,
            }}
          >
            #{task.ticketNumber}
          </span>
        )}
        <span
          style={{
            fontSize: 13,
            fontWeight: 500,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: isMobile ? "normal" : "nowrap",
            display: "-webkit-box",
            WebkitBoxOrient: "vertical",
            WebkitLineClamp: isMobile ? 2 : 1,
          }}
        >
          {task.title}
        </span>
      </div>{" "}
      <div
        style={{
          display: "flex",
          gap: 6,
          flexWrap: "wrap",
          marginBottom: 6,
        }}
      >
        {" "}
        <span
          style={{
            padding: "2px 6px",
            borderRadius: 8,
            fontSize: 10,
            background:
              task.priority === "urgent"
                ? "#fee2e2"
                : task.priority === "high"
                  ? "#fef3c7"
                  : "#f0f0f0",
            color:
              task.priority === "urgent"
                ? "#dc2626"
                : task.priority === "high"
                  ? "#92400e"
                  : "#666",
          }}
        >
          {priorityLabels[task.priority]}
        </span>{" "}
      </div>{" "}
      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
        {task.startDate ? `Начало: ${formatDateTime(task.startDate, user?.timezone)} · ` : ""}
        {task.dueDate ? (
          <b>{formatDateTime(task.dueDate, user?.timezone)}</b>
        ) : (
          "Без срока"
        )}
      </div>{" "}
      <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
        Исполнители:{" "}
        {task.assignees?.map((a) => a.user.name).join(", ") ||
          "Не назначено"}
      </div>{" "}
      {task.curators && task.curators.length > 0 && (
        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
          Кураторы: {task.curators.map((c) => c.name).join(", ")}
        </div>
      )}{" "}
      {task.contact && (
        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2, paddingRight: 32 }}>
          Контакт:{" "}
          <span
            style={{ color: "#1565c0", cursor: "pointer" }}
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/contacts/${task.contact!.id}`);
            }}
          >
            {task.contact.name}
          </span>
        </div>
      )}
      {/* Аватарка создателя задачи — правый нижний угол карточки */}
      {task.creator && (
        <div
          title={`Создал: ${task.creator.name}`}
          style={{ position: "absolute", bottom: 10, right: 12 }}
          onClick={(e) => e.stopPropagation()}
        >
          <Avatar name={task.creator.name} avatar={task.creator.avatar} size={24} />
        </div>
      )}
    </div>
    );

    if (!isAdmin && projects.length === 0) {
      return (
        <div style={{ textAlign: "center", padding: 40, color: "var(--text-muted)", fontSize: 14 }}>
          Вы не привязаны ни к одному проекту. Обратитесь к своему менеджеру
        </div>
      );
    }
    const taskStatuses = statuses
      .filter((s) => s.entityType === "task")
      .sort((a, b) => a.sortOrder - b.sortOrder);

    // Mobile: all statuses as compact tabs in one row (no swipe, no dots).
    // Если в профиле включено «Скрывать выполненные задачи» — не показываем
    // вкладки неактивных (завершённых) статусов, как и сами задачи.
    const visibleTaskStatuses = hideCompleted
      ? taskStatuses.filter((s) => s.isActive !== false)
      : taskStatuses;
    const clampedMobileIndex = Math.min(mobileColumnIndex, visibleTaskStatuses.length - 1);
    const currentMobileStatus = visibleTaskStatuses[clampedMobileIndex];

    // Mobile status tabs — все статусы в одну строку
    const renderMobileTabs = () => (
      <div
        style={{
          display: "flex",
          gap: 4,
          width: "100%",
          marginBottom: 12,
          flexWrap: "nowrap",
        }}
      >
        {visibleTaskStatuses.map((status, idx) => {
          const count = rootTasks.filter((t) => t.status === status.name).length;
          const active = idx === clampedMobileIndex;
          return (
            <button
              key={status.name}
              onClick={() => setMobileColumnIndex(idx)}
              title={status.label}
              style={{
                flex: "1 1 0",
                minWidth: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 3,
                padding: "7px 2px",
                borderRadius: 10,
                border: active ? "none" : "1px solid var(--border-color)",
                background: active ? status.color : "var(--bg-card)",
                color: active ? status.textColor : "var(--text-secondary)",
                cursor: "pointer",
                fontSize: 11,
                fontWeight: active ? 600 : 500,
                overflow: "hidden",
                whiteSpace: "nowrap",
                transition: "all 0.15s ease",
              }}
            >
              <span
                style={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {status.label}
              </span>
              <span
                style={{
                  flexShrink: 0,
                  fontSize: 10,
                  fontWeight: 600,
                  padding: "1px 5px",
                  borderRadius: 8,
                  background: active
                    ? "rgba(255,255,255,0.25)"
                    : status.color,
                  color: active ? status.textColor : status.textColor,
                }}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
    );

    return (
      <div
        style={{
          display: "flex",
          gap: 12,
          overflowX: isMobile ? "hidden" : "auto",
          paddingBottom: 8,
          WebkitOverflowScrolling: "touch",
          minHeight: 400,
          alignItems: "flex-start",
          flexDirection: isMobile ? "column" : "row",
        }}
      >
        {isMobile && renderMobileTabs()}
        {/* Колонка «Избранные» — карточки задач, отмеченных текущим пользователем (десктоп, только при выключенном фильтре «Избранное») */}
        {!isMobile &&
          !favoriteOnly &&
          (() => {
            const favTasks = rootTasks.filter((t) => t.isFavorite);
            const favEmpty = favTasks.length === 0;
            return (
              <div
                style={{
                  minWidth: favEmpty ? 48 : 280,
                  flex: favEmpty ? "0 0 auto" : 1,
                  flexShrink: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  transition: "all 0.2s ease",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: favEmpty ? "center" : "space-between",
                    alignItems: "center",
                    padding: favEmpty ? "12px 4px" : "8px 0",
                    background: favEmpty ? "#fef3c7" : "transparent",
                    borderRadius: favEmpty ? 12 : 0,
                    writingMode: favEmpty ? "vertical-rl" : "horizontal-tb",
                    textOrientation: favEmpty ? "mixed" : "initial",
                    minHeight: favEmpty ? 120 : "auto",
                  }}
                >
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 500,
                      color: favEmpty ? "#92400e" : "inherit",
                      letterSpacing: favEmpty ? "0.05em" : "normal",
                    }}
                  >
                    ⭐ Избранные
                  </span>
                  {!favEmpty && (
                    <span
                      style={{
                        fontSize: 12,
                        padding: "2px 8px",
                        borderRadius: 10,
                        background: "#f59e0b",
                        color: "#fff",
                      }}
                    >
                      {favTasks.length}
                    </span>
                  )}
                </div>
                {!favEmpty && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {favTasks.map((task) => renderKanbanCard(task))}
                  </div>
                )}
              </div>
            );
          })()}
        {taskStatuses.map((status) => {
          const statusTasks = rootTasks.filter((t) => t.status === status.name);
          const projectGroups = groupByProject(statusTasks);
          const isEmpty = statusTasks.length === 0;

          // On mobile: show only selected column
          if (isMobile && status.name !== currentMobileStatus?.name)
            return null;

          return (
            <div
              key={status.name}
              style={{
                minWidth: isMobile ? "100%" : isEmpty ? 48 : 280,
                flex: isMobile ? "none" : isEmpty ? "0 0 auto" : 1,
                flexShrink: 0,
                display: "flex",
                flexDirection: "column",
                gap: 8,
                transition: "all 0.2s ease",
              }}
            >
              {" "}
              {!isMobile && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: isEmpty ? "center" : "space-between",
                    alignItems: "center",
                    padding: isEmpty ? "12px 4px" : "8px 0",
                    background: isEmpty ? status.color : "transparent",
                    borderRadius: isEmpty ? 12 : 0,
                    writingMode: isEmpty ? "vertical-rl" : "horizontal-tb",
                    textOrientation: isEmpty ? "mixed" : "initial",
                    minHeight: isEmpty ? 120 : "auto",
                  }}
                >
                  {" "}
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 500,
                      color: isEmpty ? status.textColor : "inherit",
                      letterSpacing: isEmpty ? "0.05em" : "normal",
                    }}
                  >
                    {status.label}
                  </span>{" "}
                  {!isEmpty && (
                    <span
                      style={{
                        fontSize: 12,
                        padding: "2px 8px",
                        borderRadius: 10,
                        background: status.color,
                        color: status.textColor,
                      }}
                    >
                      {statusTasks.length}
                    </span>
                  )}{" "}
                </div>
              )}
              {isMobile && isEmpty && (
                <div
                  style={{
                    padding: "32px 16px",
                    borderRadius: 14,
                    border: "1px dashed var(--border-color)",
                    color: "var(--text-muted)",
                    fontSize: 13,
                    textAlign: "center",
                  }}
                >
                  Задач со статусом «{status.label}» нет
                </div>
              )}
              {!isEmpty && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {projectGroups.map((group) => {
                    const gKey = status.name + "|" + group.id;
                    const collapsed = !!collapsedGroups[gKey];
                    return (
                    <div key={group.id} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <div
                        onClick={() => toggleGroup(gKey)}
                        style={{ fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", padding: "4px 8px", background: "var(--bg-input)", borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", userSelect: "none" }}
                      >
                        <span>{group.name} ({group.tasks.length})</span>
                        <span style={{ fontSize: 11, color: "var(--text-muted)", width: 12 }}>{collapsed ? "▸" : "▾"}</span>
                      </div>
                      {!collapsed && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {group.tasks.map((task) => renderKanbanCard(task))}
                      </div>
                      )}
                    </div>
                    );
                  })}
                  {projectGroups.length === 0 && (
                    <div style={{ textAlign: "center", padding: 20, color: "var(--text-muted)", fontSize: 12 }}>
                      Нет задач
                    </div>
                  )}
                </div>
              )}{" "}
            </div>
          );
        })}{" "}
      </div>
    );
  };
  const au = assignableUsers(users);

  return (
    <div>
      {" "}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        {" "}
        <h2 style={{ margin: 0, fontSize: 18 }}>Задачи</h2>{" "}
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {" "}
          {/* Переключатель вида: на телефоне — мобильно-адаптированные «Канбан» и «Календарь», на десктопе — все четыре */}
          <div
            style={{
              display: "flex",
              gap: 2,
              background: "var(--bg-hover)",
              padding: 4,
              borderRadius: 10,
            }}
          >
            {" "}
            {!isMobile && viewBtn("grid", "Блоки", "▦")} {!isMobile && viewBtn("list", "Список", "☰")}{" "}
            {viewBtn("kanban", "Канбан", "▦")}{" "}
            {viewBtn("calendar", "Календарь", "📅")}{" "}
          </div>{" "}
          {!isGuest && (
            <button
              className="btn-action"
              onClick={() => openCreate()}
              title="Создать задачу"
            >
              +
            </button>
          )}{" "}
        </div>{" "}
      </div>{" "}
      <div
        style={{
          display: "none",
          gap: 8,
          alignItems: "center",
          flexWrap: "wrap",
          marginBottom: 16,
        }}
      >
        {" "}
        <input
          placeholder="Поиск..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            padding: "6px 12px",
            borderRadius: 12,
            border: "1px solid var(--border-color)",
            fontSize: 14,
            flex: 1,
            minWidth: 120,
            maxWidth: 200,
          }}
        />{" "}
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{
            padding: "6px 12px",
            borderRadius: 12,
            border: "1px solid var(--border-color)",
            fontSize: 14,
          }}
        >
          {" "}
          <option value="all">Все</option>
          <option value="my">Мои</option>
          <option value="overdue">Просроченные</option>
          <option value="no_assignee">Без исполнителя</option>{" "}
        </select>{" "}
        <select
          value={assigneeFilter}
          onChange={(e) => setAssigneeFilter(e.target.value)}
          style={{
            padding: "6px 12px",
            borderRadius: 12,
            border: "1px solid var(--border-color)",
            fontSize: 14,
          }}
        >
          {" "}
          <option value="all">Все исполнители</option>{" "}
          {au.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}{" "}
        </select>{" "}
        <select
          value={projectFilter}
          onChange={(e) => setProjectFilter(e.target.value)}
          style={{
            padding: "6px 12px",
            borderRadius: 12,
            border: "1px solid var(--border-color)",
            fontSize: 14,
          }}
        >
          {" "}
          <option value="all">Все проекты</option>{" "}
          {projects.filter((p) => p.isLocked !== true).map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}{" "}
        </select>{" "}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          style={{
            padding: "6px 12px",
            borderRadius: 12,
            border: "1px solid var(--border-color)",
            fontSize: 14,
          }}
        >
          {" "}
          <option value="createdAt">По дате создания</option>
          <option value="dueDate">По сроку</option>
          <option value="priority">По приоритету</option>{" "}
        </select>{" "}
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 13,
            color: "var(--text-secondary)",
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          {" "}
          <input
            type="checkbox"
            checked={hideCompleted}
            onChange={(e) => setHideCompleted(e.target.checked)}
            style={{ width: 16, height: 16 }}
          />{" "}
          Только активные{" "}
        </label>{" "}
      </div>{" "}
      {viewMode === "grid" && renderGrid()}{" "}
      {viewMode === "list" && renderList()}{" "}
      {viewMode === "kanban" && renderKanban()}{" "}
      {viewMode === "calendar" && <TaskCalendar onOpenTask={(id) => navigate(`/tasks/${id}`)} />}{" "}
      {showModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            zIndex: 200,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          {" "}
          <form
            onSubmit={handleSubmit}
            style={{
              background: "var(--bg-card)",
              borderRadius: 16,
              padding: 24,
              width: "100%",
              maxWidth: 480,
              maxHeight: "90vh",
              overflow: "auto",
            }}
          >
            {" "}
            <h3 style={{ margin: "0 0 16px" }}>
              {editingId ? "Редактировать задачу" : "Новая задача"}
            </h3>{" "}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {" "}
              <input
                placeholder="Название"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
                style={{
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: "1px solid var(--border-color)",
                }}
              />{" "}
              <ReactQuill
                theme="snow"
                value={form.description}
                onChange={(value) => setForm({ ...form, description: value })}
                placeholder="Описание"
                modules={{
                  toolbar: [
                    [{ header: [1, 2, 3, false] }],
                    ["bold", "italic", "underline", "strike"],
                    [{ list: "ordered" }, { list: "bullet" }],
                    [{ color: [] }, { background: [] }],
                    ["link"],
                    ["clean"],
                  ],
                }}
                formats={["header", "bold", "italic", "underline", "strike", "list", "bullet", "color", "background", "link"]}
              />{" "}
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                style={{
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: "1px solid var(--border-color)",
                }}
              >
                {" "}
                {visibleStatuses.map((s) => (
                  <option key={s.name} value={s.name}>
                    {s.label}
                  </option>
                ))}{" "}
              </select>{" "}
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                style={{
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: "1px solid var(--border-color)",
                }}
              >
                {" "}
                <option value="low">Низкий</option>
                <option value="medium">Средний</option>
                <option value="high">Высокий</option>
                <option value="urgent">Срочный</option>{" "}
              </select>{" "}
              <input
                type="datetime-local"
                title="Начало срока"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                style={{
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: "1px solid var(--border-color)",
                }}
              />{" "}
              <input
                type="datetime-local"
                title="Срок"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                style={{
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: "1px solid var(--border-color)",
                }}
              />{" "}
              <select
                value={form.projectId}
                onChange={(e) =>
                  setForm({ ...form, projectId: e.target.value })
                }
                style={{
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: "1px solid var(--border-color)",
                }}
              >
                {" "}
                <option value="">— Проект —</option>{" "}
                {projects.filter((p) => p.isLocked !== true).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}{" "}
              </select>{" "}
              <ContactPicker
                text={contactText}
                onTextChange={(t) => {
                  setContactText(t);
                  if (form.contactId)
                    setForm({ ...form, contactId: "" });
                }}
                selected={
                  form.contactId
                    ? { id: form.contactId, name: contactText }
                    : null
                }
                onSelect={(c) => {
                  if (c) setContactText(c.name);
                  setForm({ ...form, contactId: c ? c.id : "" });
                }}
                placeholder="Поиск контакта..."
              />{" "}
              <select
                multiple
                value={form.assigneeIds}
                onChange={(e) => {
                  const opts = Array.from(e.target.selectedOptions).map(
                    (o) => o.value,
                  );
                  setForm({ ...form, assigneeIds: opts });
                }}
                style={{
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: "1px solid var(--border-color)",
                  minHeight: 80,
                }}
              >
                {" "}
                {au.map((u) => (
                  <option key={u.id} value={u.id}>
                    {userOptionLabel(u)}
                  </option>
                ))}{" "}
              </select>{" "}
              <select
                multiple
                value={form.curatorIds}
                onChange={(e) =>
                  setForm({ ...form, curatorIds: Array.from(e.target.selectedOptions).map((o) => o.value) })
                }
                style={{
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: "1px solid var(--border-color)",
                  fontSize: 14,
                  minHeight: 80,
                  background: "var(--bg-input)",
                  color: "var(--text-primary)",
                }}
              >
                {users
                  .filter((u) => u.canBeCurator)
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
              </select>{" "}
              {preselectedParentId && (
                <input type="hidden" value={preselectedParentId} />
              )}{" "}
            </div>{" "}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 8,
                marginTop: 20,
              }}
            >
              {" "}
              <button
                type="button"
                onClick={() => setShowModal(false)}
                style={{
                  padding: "8px 16px",
                  borderRadius: 8,
                  border: "1px solid var(--border-color)",
                  background: "var(--bg-card)",
                  cursor: "pointer",
                }}
              >
                Отмена
              </button>{" "}
              <button
                type="submit"
                style={{
                  padding: "8px 16px",
                  borderRadius: 8,
                  border: "none",
                  background: "#1a1a1a",
                  color: "#fff",
                  cursor: "pointer",
                }}
              >
                {editingId ? "Сохранить" : "Создать"}
              </button>{" "}
            </div>{" "}
          </form>{" "}
        </div>
      )}{" "}
    </div>
  );
}
