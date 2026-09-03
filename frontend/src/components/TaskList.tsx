import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { api } from "../api/client";
import { useRealtime } from "../hooks/useRealtime";
import { Task, User, Project, Status } from "../types";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
const priorityLabels: Record<string, string> = {
  low: "Низкий",
  medium: "Средний",
  high: "Высокий",
  urgent: "Срочный",
};
type ViewMode = "grid" | "list" | "kanban";
const assignableUsers = (users: User[]) =>
  users.filter((u) => {
    const r = typeof u.role === "string" ? null : u.role;
    return r?.isAssignable !== false;
  });
export function TaskList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const canEditTask = (task: Task) => isAdmin || task.creatorId === user?.id || (task.curators || []).some(c => c.id === user?.id);
  const [searchParams] = useSearchParams();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [hideCompleted, setHideCompleted] = useState(() => {
    const fromUrl = searchParams.get("hideCompleted");
    return fromUrl !== null ? fromUrl === "true" : true;
  });
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
    return ["grid", "list", "kanban"].includes(saved) ? saved : "grid";
  });
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [preselectedParentId, setPreselectedParentId] = useState<string | null>(
    null,
  );
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  // Mobile kanban states
  const [isMobile, setIsMobile] = useState(false);
  const [mobileColumnIndex, setMobileColumnIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const defaultStatus = (statuses.find((s) => s.isDefault)?.name ||
    statuses[0]?.name ||
    "open") as string;
  const [form, setForm] = useState({
    title: "",
    description: "",
    status: defaultStatus,
    priority: "medium",
    dueDate: "",
    assigneeIds: [] as string[],
    curatorIds: [] as string[],
    projectId: "",
    parentId: "",
  });
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
  }, [filter, assigneeFilter, projectFilter, contactFilter, search, sortBy]);
  const loadTasks = () => {
    let params = new URLSearchParams();
    if (filter !== "all") params.set("filter", filter);
    if (assigneeFilter !== "all") params.set("assigneeId", assigneeFilter);
    if (projectFilter !== "all") params.set("project", projectFilter);
    if (contactFilter) params.set("contactId", contactFilter);
    if (search) params.set("search", search);
    if (sortBy) params.set("sort", sortBy);
    if (hideCompleted) params.set("hideCompleted", "true");
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

  // Force kanban view on mobile
  useEffect(() => {
    if (isMobile && viewMode !== "kanban") {
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
  const changeView = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem("taskViewMode", mode);
  };
  const openCreate = (parentId?: string) => {
    setEditingId(null);
    setPreselectedParentId(parentId || null);
    setForm({
      title: "",
      description: "",
      status: defaultStatus,
      priority: "medium",
      dueDate: "",
      assigneeIds: [],
      curatorIds: [],
      projectId: "",
      parentId: parentId || "",
    });
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
      dueDate: task.dueDate ? task.dueDate.slice(0, 16) : "",
      assigneeIds: task.assignees?.map((a) => a.user.id) || [],
      curatorIds: task.curators?.map((c) => c.id) || [],
      projectId: task.projectId || "",
      parentId: task.parentId || "",
    });
    setShowModal(true);
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      ...form,
      assigneeIds: form.assigneeIds.length ? form.assigneeIds : undefined,
      curatorIds: form.curatorIds.length ? form.curatorIds : undefined,
    };
    if (editingId) {
      await api.tasks.update(editingId, data);
    } else {
      await api.tasks.create(data);
    }
    setShowModal(false);
    loadTasks();
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
              <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
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
                {task.dueDate
                  ? new Date(task.dueDate).toLocaleString("ru-RU", { timeZone: "UTC", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
                  : "Без срока"}
              </span>{" "}
              <span>
                {task.assignees?.map((a) => a.user.name).join(", ") ||
                  "Не назначено"}
              </span>{" "}
            </div>{" "}
            {task.curators && task.curators.length > 0 && (
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                Кураторы: {task.curators.map((c) => c.name).join(", ")}
              </div>
            )}{" "}
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
              Создал: {task.creator?.name || "—"}
            </div>{" "}
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
                {canEditTask(task) && (
                  <button
                    onClick={() => openEdit(task)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--text-muted)",
                      cursor: "pointer",
                      fontSize: 12,
                    }}
                  >
                    ✏️
                  </button>
                )}{" "}
                {isAdmin && (
                  <button
                    onClick={() => handleDelete(task.id)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--text-muted)",
                      cursor: "pointer",
                      fontSize: 12,
                    }}
                  >
                    🗑
                  </button>
                )}{" "}
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
          Задачи не найдены
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
              {task.dueDate
                ? new Date(task.dueDate).toLocaleString("ru-RU", { timeZone: "UTC", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
                : "—"}
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
            <span style={{ color: "var(--text-muted)", fontSize: 11 }}>
              Создал: {task.creator?.name || "—"}
            </span>{" "}
            <div
              style={{ display: "flex", gap: 6, justifyContent: "center" }}
              onClick={(e) => e.stopPropagation()}
            >
              {" "}
              {canEditTask(task) && (
                <button
                  onClick={() => openEdit(task)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--text-muted)",
                    cursor: "pointer",
                    fontSize: 12,
                  }}
                >
                  ✏️
                </button>
              )}{" "}
              {isAdmin && (
                <button
                  onClick={() => handleDelete(task.id)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--text-muted)",
                    cursor: "pointer",
                    fontSize: 12,
                  }}
                >
                  🗑
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
          Задачи не найдены
        </div>
      )}{" "}
    </div>
  );
  const renderKanban = () => {
    const taskStatuses = statuses
      .filter((s) => s.entityType === "task")
      .sort((a, b) => a.sortOrder - b.sortOrder);

    // Mobile: filter out empty columns and show one at a time with swipe
    const nonEmptyStatuses = isMobile
      ? taskStatuses.filter((s) => rootTasks.some((t) => t.status === s.name))
      : taskStatuses;

    const handleTouchStart = (e: React.TouchEvent) => {
      setTouchStartX(e.touches[0].clientX);
    };

    const handleTouchMove = (_e: React.TouchEvent) => {
      // Swipe detection handled in handleTouchEnd
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
      if (touchStartX === null) return;
      const diff = touchStartX - e.changedTouches[0].clientX;
      const threshold = 50;
      if (diff > threshold && mobileColumnIndex < nonEmptyStatuses.length - 1) {
        setMobileColumnIndex((prev) => prev + 1);
      } else if (diff < -threshold && mobileColumnIndex > 0) {
        setMobileColumnIndex((prev) => prev - 1);
      }
      setTouchStartX(null);
    };

    // Mobile column indicator dots
    const renderMobileIndicator = () => (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 8,
          marginBottom: 12,
          padding: "8px 0",
          width: "100%",
          alignSelf: "center",
        }}
      >
        {nonEmptyStatuses.map((status, idx) => (
          <button
            key={status.name}
            onClick={() => setMobileColumnIndex(idx)}
            style={{
              width: idx === mobileColumnIndex ? 24 : 8,
              height: 8,
              borderRadius: 4,
              border: "none",
              background:
                idx === mobileColumnIndex ? status.color : "#d1d5db",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            title={status.label}
          />
        ))}
      </div>
    );

    // Mobile current status header
    const renderMobileHeader = () => {
      const status = nonEmptyStatuses[mobileColumnIndex];
      if (!status) return null;
      const count = rootTasks.filter((t) => t.status === status.name).length;
      return (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "10px 12px",
            background: status.color,
            borderRadius: 12,
            marginBottom: 12,
          }}
        >
          <span style={{ fontSize: 14, fontWeight: 600, color: status.textColor }}>
            {status.label}
          </span>
          <span
            style={{
              fontSize: 12,
              padding: "2px 8px",
              borderRadius: 10,
              background: "rgba(255,255,255,0.25)",
              color: status.textColor,
            }}
          >
            {count}
          </span>
        </div>
      );
    };

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
        onTouchStart={isMobile ? handleTouchStart : undefined}
        onTouchMove={isMobile ? handleTouchMove : undefined}
        onTouchEnd={isMobile ? handleTouchEnd : undefined}
      >
        {isMobile && renderMobileIndicator()}
        {isMobile && renderMobileHeader()}
        {taskStatuses.map((status) => {
          const statusTasks = rootTasks.filter((t) => t.status === status.name);
          const projectGroups = groupByProject(statusTasks);
          const isEmpty = statusTasks.length === 0;

          // On mobile: skip empty columns entirely
          if (isMobile && isEmpty) return null;

          // On mobile: show only current column
          if (isMobile && status.name !== nonEmptyStatuses[mobileColumnIndex]?.name)
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
              {!isEmpty && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {projectGroups.map((group) => (
                    <div key={group.id} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", padding: "4px 8px", background: "var(--bg-input)", borderRadius: 8 }}>
                        {group.name} ({group.tasks.length})
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {group.tasks.map((task) => (
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
                              {canEditTask(task) && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openEdit(task);
                                  }}
                                  style={{
                                    background: "none",
                                    border: "none",
                                    color: "var(--text-muted)",
                                    cursor: "pointer",
                                    fontSize: 12,
                                  }}
                                >
                                  ✏️
                                </button>
                              )}{" "}
                              {isAdmin && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(task.id);
                                  }}
                                  style={{
                                    background: "none",
                                    border: "none",
                                    color: "var(--text-muted)",
                                    cursor: "pointer",
                                    fontSize: 12,
                                  }}
                                >
                                  🗑
                                </button>
                              )}{" "}
                            </div>{" "}
                            <div
                              style={{
                                fontSize: 13,
                                fontWeight: 500,
                                marginBottom: 6,
                                paddingRight: 40,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {task.title}
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
                              {task.dueDate
                                ? new Date(task.dueDate).toLocaleString("ru-RU", { timeZone: "UTC", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
                                : "Без срока"}{" "}
                              ·{" "}
                              {task.assignees?.map((a) => a.user.name).join(", ") ||
                                "Не назначено"}
                            </div>{" "}
                            {task.curators && task.curators.length > 0 && (
                              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                                Кураторы: {task.curators.map((c) => c.name).join(", ")}
                              </div>
                            )}{" "}
                            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                              Создал: {task.creator?.name || "—"}
                            </div>{" "}
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
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
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
          {!isMobile && (
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
              {viewBtn("grid", "Блоки", "▦")} {viewBtn("list", "Список", "☰")}{" "}
              {viewBtn("kanban", "Канбан", "▦")}{" "}
            </div>
          )}{" "}
          <button
            onClick={() => openCreate()}
            style={{
              padding: "8px 16px",
              borderRadius: 12,
              border: "none",
              background: "#1a1a1a",
              color: "#fff",
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            + Создать задачу
          </button>{" "}
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
                {statuses.map((s) => (
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
                    {u.name}
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
