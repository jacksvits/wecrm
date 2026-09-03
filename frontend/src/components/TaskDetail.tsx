import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { api } from "../api/client";
import { useRealtime } from "../hooks/useRealtime";
import {
  Task,
  Comment,
  FileAttachment,
  Status,
  User,
  TaskHistory,
  TaskFinances,
  TaskTransaction,
} from "../types";
import { AttachmentList, FileUpload } from "./FileUpload";
import { LinkifyText } from "./LinkifyText";
import { Avatar } from "./Avatar";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
const priorityLabels: Record<string, string> = {
  low: "Низкий",
  medium: "Средний",
  high: "Высокий",
  urgent: "Срочный",
};
const fieldLabels: Record<string, string> = {
  title: "Название",
  description: "Описание",
  status: "Статус",
  priority: "Приоритет",
  dueDate: "Срок",
  projectId: "Проект",
  contactId: "Контакт",
  dealId: "Сделка",
  parentId: "Родительская задача",
  assignees: "Исполнители",
  task: "Задача",
};
const priorityColors: Record<string, { bg: string; text: string }> = {
  low: { bg: "#e0f2fe", text: "#0369a1" },
  medium: { bg: "#fef3c7", text: "#92400e" },
  high: { bg: "#fee2e2", text: "#dc2626" },
  urgent: { bg: "#fee2e2", text: "#dc2626" },
};
export function TaskDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [task, setTask] = useState<Task | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [taskAttachments, setTaskAttachments] = useState<FileAttachment[]>([]);
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [newComment, setNewComment] = useState("");
  const [pendingAttachments, setPendingAttachments] = useState<FileAttachment[]>([]);
  const [isInternalComment, setIsInternalComment] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showSubtaskForm, setShowSubtaskForm] = useState(false);
  const [subtaskTitle, setSubtaskTitle] = useState("");
  const [subtaskPriority, setSubtaskPriority] = useState("medium");
  const [subtaskDueDate, setSubtaskDueDate] = useState("");
  const [subtaskAssigneeIds, setSubtaskAssigneeIds] = useState<string[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    priority: "medium",
    dueDate: "",
    assigneeIds: [] as string[],
    curatorIds: [] as string[],
  });
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "details" | "comments" | "subtasks" | "history" | "finances" | "files"
  >("comments");
  const [isDark, setIsDark] = useState(false);
  const [modalImage, setModalImage] = useState<string | null>(null);
  const [taskHistory, setTaskHistory] = useState<TaskHistory[]>([]);
  const [finances, setFinances] = useState<TaskFinances | null>(null);
  const [showTxForm, setShowTxForm] = useState(false);
  const [editingTx, setEditingTx] = useState<TaskTransaction | null>(null);
  const [txForm, setTxForm] = useState({
    type: "expense" as "income" | "expense",
    amount: "",
    description: "",
    date: "",
  });
  const [financeLoading, setFinanceLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [taskFiles, setTaskFiles] = useState<{name: string; size: number; createdAt: string}[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const statusDropdownRef = useRef<HTMLDivElement>(null);
  const commentsRef = useRef<HTMLDivElement>(null);
  // Свайп-переключение вкладок в мобильной версии
  const tabContentRef = useRef<HTMLDivElement>(null);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);
  const tabsOrder: Array<"comments" | "details" | "subtasks" | "history" | "finances" | "files"> = ["comments", "details", "subtasks", "history", "finances", "files"];
  const minSwipeDistance = 50;
  useEffect(() => {
    setIsDark(localStorage.getItem("darkTheme") === "true");
  }, []);
  useEffect(() => {
    if (id) {
      loadTask();
      api.users.list().then(setUsers);
      api.statuses.list("task").then(setStatuses);
    }
  }, [id]);
  useEffect(() => {
    const el = commentsRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [comments]);
  useEffect(() => {
    if (activeTab === "history" && id) {
      loadHistory();
    }
    if (activeTab === "finances" && id) {
      loadFinances();
    }
  }, [activeTab, id]);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        statusDropdownRef.current &&
        !statusDropdownRef.current.contains(event.target as Node)
      ) {
        setShowStatusDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  // Обработчики свайпа для переключения вкладок в мобильной версии
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEndX(null);
    setTouchStartX(e.targetTouches[0].clientX);
  };
  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEndX(e.targetTouches[0].clientX);
  };
  const onTouchEnd = () => {
    if (touchStartX === null || touchEndX === null) return;
    const distance = touchStartX - touchEndX;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    const currentIndex = tabsOrder.indexOf(activeTab);
    if (isLeftSwipe && currentIndex < tabsOrder.length - 1) {
      setActiveTab(tabsOrder[currentIndex + 1]);
    }
    if (isRightSwipe && currentIndex > 0) {
      setActiveTab(tabsOrder[currentIndex - 1]);
    }
    setTouchStartX(null);
    setTouchEndX(null);
  };
  const loadTaskFiles = async () => {
    if (!id) return;
    try {
      const files = await api.tasks.files.list(id);
      setTaskFiles(files);
    } catch (err: any) {
      console.error("Failed to load task files:", err);
    }
  };
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragOver(true); };
  const handleDragLeave = () => setDragOver(false);
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (!files.length || !id) return;
    for (const file of files) {
      const formData = new FormData();
      formData.append('files', file);
      await api.tasks.files.upload(id, formData);
    }
    loadTaskFiles();
  };
  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length || !id) return;
    for (const file of files) {
      const formData = new FormData();
      formData.append('files', file);
      await api.tasks.files.upload(id, formData);
    }
    loadTaskFiles();
    e.target.value = '';
  };
  const handleDeleteFile = async (filename: string) => {
    if (!confirm('Удалить файл?')) return;
    await api.tasks.files.delete(id!, filename);
    loadTaskFiles();
  };
  const handleDownloadFile = async (filename: string) => {
    try {
      const response = await api.tasks.files.download(id!, filename);
      if (!response.ok) {
        alert('Ошибка скачивания файла');
        return;
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert('Ошибка скачивания: ' + err.message);
    }
  };
  const loadTask = async () => {
    setLoading(true);
    try {
      const data = await api.tasks.get(id!);
      setTask(data);
      setComments(data.comments || []);
      setTaskAttachments(data.attachments || []);
      loadTaskFiles();
      setEditForm({
        title: data.title,
        description: data.description || "",
        priority: data.priority,
        dueDate: data.dueDate ? data.dueDate.slice(0, 16) : "",
        assigneeIds: data.assignees?.map((a) => a.user.id) || [],
        curatorIds: data.curators?.map((c) => c.id) || [],
      });
    } catch (err: any) {
      if (err.message?.includes('403') || err.message?.includes('Доступ запрещен')) {
        setError('Доступ запрещен: вы не являетесь создателем, исполнителем или куратором этой задачи');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };
  useRealtime(['tasks','comments'], (data) => { if (data.entity === 'task' && data.id === id) loadTask(); });
  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const data = await api.tasks.history(id!);
      setTaskHistory(data);
    } catch (err: any) {
      console.error("Failed to load history:", err);
    } finally {
      setHistoryLoading(false);
    }
  };
  const loadFinances = async () => {
    if (!id) return;
    setFinanceLoading(true);
    try {
      const data = await api.taskFinances.get(id);
      setFinances(data);
    } catch (err: any) {
      console.error("Failed to load finances:", err);
    } finally {
      setFinanceLoading(false);
    }
  };
  const getStatusLabel = (name: string) =>
    statuses.find((s) => s.name === name)?.label || name;
  const getStatusStyle = (name: string) => {
    const s = statuses.find((st) => st.name === name);
    return s
      ? { bg: s.color, text: s.textColor }
      : { bg: "var(--bg-hover)", text: "var(--text-secondary)" };
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
  const handleStatusChange = async (status: string) => {
    if (!task) return;
    try {
      await api.tasks.update(task.id, { status });
      loadTask();
    } catch (err: any) {
      alert(err.message);
    }
  };
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task) return;
    setSaving(true);
    try {
      await api.tasks.update(task.id, {
        title: editForm.title,
        description: editForm.description,
        priority: editForm.priority,
        dueDate: editForm.dueDate || undefined,
        assigneeIds: editForm.assigneeIds.length
          ? editForm.assigneeIds
          : undefined,
        curatorIds: editForm.curatorIds.length
          ? editForm.curatorIds
          : undefined,
      });
      setIsEditing(false);
      loadTask();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };
  const handleFileUpload = (attachment: FileAttachment) => {
    setPendingAttachments((prev) => [...prev, attachment]);
  };
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedComment = newComment.trim();
    if (!trimmedComment && !pendingAttachments.length) return;
    try {
      const content = trimmedComment || (pendingAttachments.length ? `📎 ${pendingAttachments.length} файл(ов)` : "");
      const attachmentIds = pendingAttachments.length
        ? pendingAttachments.map((a) => a.id)
        : undefined;
      const comment = await api.comments.create(id!, content, attachmentIds, isInternalComment);
      setComments((prev) => [...prev, comment]);
      setNewComment("");
      setPendingAttachments([]);
      setIsInternalComment(false);
    } catch (err: any) {
      alert(err.message);
    }
  };
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAddComment(e as any);
    }
  };
  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("Удалить комментарий?")) return;
    try {
      await api.comments.delete(id!, commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (err: any) {
      alert(err.message);
    }
  };
  const handleCreateSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subtaskTitle.trim()) return;
    try {
      await api.tasks.create({
        title: subtaskTitle,
        priority: subtaskPriority as any,
        dueDate: subtaskDueDate || undefined,
        assigneeIds: subtaskAssigneeIds.length ? subtaskAssigneeIds : undefined,
        parentId: id!,
      });
      setShowSubtaskForm(false);
      setSubtaskTitle("");
      setSubtaskPriority("medium");
      setSubtaskDueDate("");
      setSubtaskAssigneeIds([]);
      loadTask();
    } catch (err: any) {
      alert(err.message);
    }
  };
  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!confirm("Удалить вложение?")) return;
    try {
      await api.uploads.delete(attachmentId);
      setTaskAttachments((prev) => prev.filter((a) => a.id !== attachmentId));
    } catch (err: any) {
      alert(err.message);
    }
  };
  const formatTime = (date: string) =>
    new Date(date).toLocaleTimeString("ru", {
      hour: "2-digit",
      minute: "2-digit",
    });
  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("ru", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  const formatDateOnly = (date: string) =>
    new Date(date).toLocaleDateString("ru", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  if (loading)
    return <div style={{ padding: 40, textAlign: "center" }}>Загрузка...</div>;
  if (error)
    return (
      <div style={{ padding: 40, textAlign: "center", color: "#dc2626" }}>
        {error}
      </div>
    );
  if (!task)
    return (
      <div style={{ padding: 40, textAlign: "center" }}>Задача не найдена</div>
    );
  const st = getStatusStyle(task.status);
  const tabStyle = (isActive: boolean): React.CSSProperties => ({
    padding: "10px 20px",
    borderRadius: 12,
    border: "none",
    background: isActive ? "var(--text-primary)" : "transparent",
    color: isActive ? "var(--bg-card)" : "var(--text-secondary)",
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
    transition: "all 0.2s",
  });
  const renderHistoryValue = (
    field: string,
    value: string | null | undefined,
  ) => {
    if (!value)
      return (
        <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>
          пусто
        </span>
      );
    if (field === "status") return <span>{getStatusLabel(value)}</span>;
    if (field === "priority")
      return <span>{priorityLabels[value] || value}</span>;
    return <span>{value}</span>;
  };
  return (
    <div>
      {" "}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        {" "}
        <button
          onClick={() => navigate("/tasks")}
          style={{
            background: "none",
            border: "none",
            color: "var(--text-secondary)",
            cursor: "pointer",
            fontSize: 14,
          }}
        >
          ← Назад к задачам
        </button>{" "}
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {" "}
          {task && (isAdmin || task.creatorId === user?.id || (task.curators || []).some(c => c.id === user?.id)) && !isEditing && activeTab === "details" && (
            <button
              onClick={() => setIsEditing(true)}
              style={{
                padding: "6px 12px",
                borderRadius: 12,
                border: "1px solid var(--border-color)",
                background: "var(--bg-card)",
                cursor: "pointer",
                fontSize: 13,
                color: "var(--text-primary)",
              }}
            >
              ✏️ Редактировать
            </button>
          )}{" "}
          {/* Выпадающий список статусов — виден при всех вкладках */}
          <div ref={statusDropdownRef} style={{ position: "relative" }}>
            <button
              onClick={() => setShowStatusDropdown(!showStatusDropdown)}
              style={{
                padding: "6px 12px",
                borderRadius: 12,
                border: "1px solid var(--border-color)",
                background: st.bg,
                color: st.text,
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 500,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              {getStatusLabel(task.status)} ▼
            </button>
            {showStatusDropdown && (
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 4px)",
                  right: 0,
                  background: "var(--bg-card)",
                  border: "1px solid var(--border-color)",
                  borderRadius: 12,
                  boxShadow: "var(--shadow)",
                  zIndex: 100,
                  minWidth: 180,
                  overflow: "hidden",
                }}
              >
                {statuses.map((s) => {
                  const active = task.status === s.name;
                  const style = getStatusStyle(s.name);
                  return (
                    <button
                      key={s.name}
                      onClick={() => {
                        handleStatusChange(s.name);
                        setShowStatusDropdown(false);
                      }}
                      disabled={active}
                      style={{
                        display: "block",
                        width: "100%",
                        padding: "8px 12px",
                        border: "none",
                        borderBottom: "1px solid var(--border-color)",
                        background: active ? style.bg : "transparent",
                        color: active ? style.text : "var(--text-primary)",
                        cursor: active ? "default" : "pointer",
                        fontSize: 13,
                        fontWeight: 500,
                        textAlign: "left",
                      }}
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>{" "}
          {isAdmin && (
            <button
              onClick={() => {
                if (confirm("Удалить задачу?")) {
                  api.tasks.delete(task.id).then(() => navigate("/tasks"));
                }
              }}
              style={{
                padding: "6px 12px",
                borderRadius: 12,
                border: "1px solid var(--border-color)",
                background: "var(--bg-card)",
                color: "#dc2626",
                cursor: "pointer",
                fontSize: 13,
              }}
            >
              🗑 Удалить
            </button>
          )}{" "}
        </div>{" "}
      </div>{" "}
      {isEditing ? (
        <form
          onSubmit={handleSaveEdit}
          style={{
            padding: 24,
            borderRadius: 16,
            border: "1px solid var(--border-color)",
            background: "var(--bg-card)",
            boxShadow: "var(--shadow)",
            marginBottom: 16,
          }}
        >
          {" "}
          <h3
            style={{
              margin: "0 0 16px",
              fontSize: 18,
              color: "var(--text-primary)",
            }}
          >
            Редактировать задачу
          </h3>{" "}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {" "}
            <input
              placeholder="Название"
              value={editForm.title}
              onChange={(e) =>
                setEditForm({ ...editForm, title: e.target.value })
              }
              required
              style={{
                padding: 10,
                borderRadius: 12,
                border: "1px solid var(--border-color)",
                fontSize: 14,
                background: "var(--bg-input)",
                color: "var(--text-primary)",
              }}
            />{" "}
            <ReactQuill
              theme="snow"
              value={editForm.description}
              onChange={(value) =>
                setEditForm({ ...editForm, description: value })
              }
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
              formats={[
                "header",
                "bold",
                "italic",
                "underline",
                "strike",
                "list",
                "bullet",
                "color",
                "background",
                "link",
              ]}
            />{" "}
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {" "}
              <select
                value={editForm.priority}
                onChange={(e) =>
                  setEditForm({ ...editForm, priority: e.target.value })
                }
                style={{
                  padding: 10,
                  borderRadius: 12,
                  border: "1px solid var(--border-color)",
                  fontSize: 14,
                  flex: 1,
                  background: "var(--bg-input)",
                  color: "var(--text-primary)",
                }}
              >
                {" "}
                <option value="low">Низкий</option>{" "}
                <option value="medium">Средний</option>{" "}
                <option value="high">Высокий</option>{" "}
                <option value="urgent">Срочный</option>{" "}
              </select>{" "}
              <input
                type="datetime-local"
                value={editForm.dueDate}
                onChange={(e) =>
                  setEditForm({ ...editForm, dueDate: e.target.value })
                }
                style={{
                  padding: 10,
                  borderRadius: 12,
                  border: "1px solid var(--border-color)",
                  fontSize: 14,
                  flex: 1,
                  background: "var(--bg-input)",
                  color: "var(--text-primary)",
                }}
              />{" "}
            </div>{" "}
            <select
              multiple
              value={editForm.assigneeIds}
              onChange={(e) =>
                setEditForm({
                  ...editForm,
                  assigneeIds: Array.from(
                    e.target.selectedOptions,
                    (o) => o.value,
                  ),
                })
              }
              style={{
                padding: 10,
                borderRadius: 12,
                border: "1px solid var(--border-color)",
                fontSize: 14,
                minHeight: 80,
                background: "var(--bg-input)",
                color: "var(--text-primary)",
              }}
            >
              {" "}
              {users
                .filter((u) => {
                  const r = typeof u.role === "string" ? null : u.role;
                  return r?.isAssignable !== false;
                })
                .map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}{" "}
            </select>{" "}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 500 }}>Кураторы</label>
              <select
                multiple
                value={editForm.curatorIds}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    curatorIds: Array.from(
                      e.target.selectedOptions,
                      (o) => o.value,
                    ),
                  })
                }
                style={{
                  padding: 10,
                  borderRadius: 12,
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
              </select>
            </div>{" "}
            <div
              style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}
            >
              {" "}
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                style={{
                  padding: "8px 16px",
                  borderRadius: 12,
                  border: "1px solid var(--border-color)",
                  background: "var(--bg-card)",
                  cursor: "pointer",
                  color: "var(--text-primary)",
                }}
              >
                Отмена
              </button>{" "}
              <button
                type="submit"
                disabled={saving}
                style={{
                  padding: "8px 16px",
                  borderRadius: 12,
                  border: "none",
                  background: "var(--text-primary)",
                  color: "var(--bg-card)",
                  cursor: saving ? "not-allowed" : "pointer",
                  opacity: saving ? 0.7 : 1,
                }}
              >
                {saving ? "Сохранение..." : "Сохранить"}
              </button>{" "}
            </div>{" "}
          </div>{" "}
        </form>
      ) : (
        <div>
          {" "}
          <div
            style={{
              display: "flex",
              gap: 8,
              marginBottom: 16,
              flexWrap: "wrap",
            }}
          >
            {" "}
            <button
              style={tabStyle(activeTab === "comments")}
              onClick={() => setActiveTab("comments")}
            >
              Обсуждение ({comments.length})
            </button>{" "}
            <button
              style={tabStyle(activeTab === "details")}
              onClick={() => setActiveTab("details")}
            >
              Задача
            </button>{" "}
            <button
              style={tabStyle(activeTab === "subtasks")}
              onClick={() => setActiveTab("subtasks")}
            >
              Подзадачи ({task.children?.length || 0})
            </button>{" "}
            <button
              style={tabStyle(activeTab === "history")}
              onClick={() => setActiveTab("history")}
            >
              История ({taskHistory.length})
            </button>
            <button
              style={tabStyle(activeTab === "finances")}
              onClick={() => setActiveTab("finances")}
            >
              Финансы
            </button>{" "}
            <button
              style={tabStyle(activeTab === "files")}
              onClick={() => setActiveTab("files")}
            >
              Файлы ({taskFiles.length})
            </button>{" "}
          </div>{" "}
          {/* Индикаторы свайпа — видны только в мобильной версии */}
          <div className="tab-swipe-indicator">
            {tabsOrder.map((tab) => (
              <div
                key={tab}
                className={`tab-swipe-dot ${activeTab === tab ? "active" : ""}`}
              />
            ))}
          </div>
          <div
            ref={tabContentRef}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            className="tab-content-swipeable"
          >
            {activeTab === "details" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {" "}
              <div
                style={{
                  padding: 24,
                  borderRadius: 16,
                  border: "1px solid var(--border-color)",
                  background: getTaskBackground(st.bg),
                  borderLeft: getTaskBorderLeft(st.bg),
                  boxShadow: "var(--shadow)",
                }}
              >
                {" "}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: 12,
                    flexWrap: "wrap",
                    gap: 8,
                  }}
                >
                  {" "}
                  <h1
                    style={{
                      fontSize: 20,
                      fontWeight: 600,
                      margin: 0,
                      flex: 1,
                      color: "var(--text-primary)",
                    }}
                  >
                    #{task.ticketNumber} {task.title}
                  </h1>{" "}
                  <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                    {" "}
                    <span
                      style={{
                        padding: "4px 10px",
                        borderRadius: 10,
                        fontSize: 12,
                        background: st.bg,
                        color: st.text,
                        fontWeight: 500,
                      }}
                    >
                      {getStatusLabel(task.status)}
                    </span>{" "}
                    <span
                      style={{
                        padding: "4px 10px",
                        borderRadius: 10,
                        fontSize: 12,
                        background:
                          task.priority === "urgent"
                            ? "#fee2e2"
                            : task.priority === "high"
                              ? "#fef3c7"
                              : "var(--bg-hover)",
                        color:
                          task.priority === "urgent"
                            ? "#dc2626"
                            : task.priority === "high"
                              ? "#92400e"
                              : "var(--text-secondary)",
                        fontWeight: 500,
                      }}
                    >
                      {priorityLabels[task.priority]}
                    </span>{" "}
                  </div>{" "}
                </div>{" "}
                <div
                  style={{
                    fontSize: 14,
                    color: "var(--text-secondary)",
                    lineHeight: 1.6,
                    marginBottom: 16,
                  }}
                  dangerouslySetInnerHTML={{
                    __html:
                      task.description ||
                      "<em style=&#34;color: var(--text-muted)&#34;>Нет описания</em>",
                  }}
                />{" "}
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 12,
                    fontSize: 13,
                    color: "var(--text-secondary)",
                  }}
                >
                  {" "}
                  <div>
                    <strong style={{ color: "var(--text-muted)" }}>
                      Срок:
                    </strong>{" "}
                    {task.dueDate
                      ? new Date(task.dueDate).toLocaleString("ru-RU", { timeZone: "UTC", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
                      : "Не указан"}
                  </div>{" "}
                  <div>
                    <strong style={{ color: "var(--text-muted)" }}>
                      Создано:
                    </strong>{" "}
                    {new Date(task.createdAt).toLocaleDateString("ru")}
                  </div>{" "}
                  <div>
                    <strong style={{ color: "var(--text-muted)" }}>
                      Проект:
                    </strong>{" "}
                    {task.project?.name || "—"}
                  </div>{" "}
                  <div>
                    <strong style={{ color: "var(--text-muted)" }}>
                      Контакт:
                    </strong>{" "}
                    {task.contact ? (
                      <span
                        style={{ color: "#1565c0", cursor: "pointer" }}
                        onClick={() => navigate(`/contacts/${task.contact!.id}`)}
                      >
                        {task.contact.name}
                      </span>
                    ) : (
                      "—"
                    )}
                  </div>{" "}
                </div>{" "}
                <div style={{ marginTop: 12 }}>
                  {" "}
                  <strong style={{ color: "var(--text-muted)", fontSize: 13 }}>
                    Исполнители:
                  </strong>{" "}
                  {task.assignees?.length ? (
                    task.assignees.map((a) => a.user.name).join(", ")
                  ) : (
                    <span style={{ color: "var(--text-muted)" }}>
                      Не назначены
                    </span>
                  )}{" "}
                </div>{" "}
                {task.curators && task.curators.length > 0 && (
                  <div style={{ marginTop: 8 }}>
                    <strong style={{ color: "var(--text-muted)", fontSize: 13 }}>
                      Кураторы:
                    </strong>{" "}
                    {task.curators.map((c) => c.name).join(", ")}
                  </div>
                )}{" "}
                <AttachmentList
                  attachments={taskAttachments}
                  onDelete={handleDeleteAttachment}
                />{" "}
              </div>{" "}
            </div>
          )}{" "}
          {activeTab === "subtasks" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {" "}
              <div
                style={{
                  padding: 24,
                  borderRadius: 16,
                  border: "1px solid var(--border-color)",
                  background: getTaskBackground(st.bg),
                  borderLeft: getTaskBorderLeft(st.bg),
                  boxShadow: "var(--shadow)",
                }}
              >
                {" "}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 12,
                  }}
                >
                  {" "}
                  <h3
                    style={{
                      margin: 0,
                      fontSize: 16,
                      color: "var(--text-primary)",
                    }}
                  >
                    Подзадачи
                  </h3>{" "}
                  <button
                    onClick={() => setShowSubtaskForm(!showSubtaskForm)}
                    style={{
                      padding: "6px 12px",
                      borderRadius: 10,
                      border: "none",
                      background: "var(--text-primary)",
                      color: "var(--bg-card)",
                      cursor: "pointer",
                      fontSize: 13,
                    }}
                  >
                    {showSubtaskForm ? "Отмена" : "+ Добавить"}
                  </button>{" "}
                </div>{" "}
                {showSubtaskForm && (
                  <form
                    onSubmit={handleCreateSubtask}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                      marginBottom: 16,
                      padding: 16,
                      background: "var(--bg-input)",
                      borderRadius: 12,
                    }}
                  >
                    {" "}
                    <ReactQuill
                      theme="snow"
                      value={subtaskTitle}
                      onChange={(value) =>
                        setSubtaskTitle(value.replace(/<[^>]*>/g, "").trim())
                      }
                      placeholder="Название подзадачи"
                      modules={{ toolbar: false }}
                    />{" "}
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      {" "}
                      <select
                        value={subtaskPriority}
                        onChange={(e) => setSubtaskPriority(e.target.value)}
                        style={{
                          padding: 10,
                          borderRadius: 12,
                          border: "1px solid var(--border-color)",
                          fontSize: 14,
                          flex: 1,
                          background: "var(--bg-input)",
                          color: "var(--text-primary)",
                        }}
                      >
                        {" "}
                        <option value="low">Низкий</option>{" "}
                        <option value="medium">Средний</option>{" "}
                        <option value="high">Высокий</option>{" "}
                        <option value="urgent">Срочный</option>{" "}
                      </select>{" "}
                      <input
                        type="datetime-local"
                        value={subtaskDueDate}
                        onChange={(e) => setSubtaskDueDate(e.target.value)}
                        style={{
                          padding: 10,
                          borderRadius: 12,
                          border: "1px solid var(--border-color)",
                          fontSize: 14,
                          flex: 1,
                          background: "var(--bg-input)",
                          color: "var(--text-primary)",
                        }}
                      />{" "}
                    </div>{" "}
                    <select
                      multiple
                      value={subtaskAssigneeIds}
                      onChange={(e) =>
                        setSubtaskAssigneeIds(
                          Array.from(e.target.selectedOptions, (o) => o.value),
                        )
                      }
                      style={{
                        padding: 10,
                        borderRadius: 12,
                        border: "1px solid var(--border-color)",
                        fontSize: 14,
                        minHeight: 80,
                        background: "var(--bg-input)",
                        color: "var(--text-primary)",
                      }}
                    >
                      {" "}
                      {users
                        .filter((u) => {
                          const r = typeof u.role === "string" ? null : u.role;
                          return r?.isAssignable !== false;
                        })
                        .map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name}
                          </option>
                        ))}{" "}
                    </select>{" "}
                    <button
                      type="submit"
                      style={{
                        padding: "8px 16px",
                        borderRadius: 12,
                        border: "none",
                        background: "var(--text-primary)",
                        color: "var(--bg-card)",
                        cursor: "pointer",
                        fontSize: 14,
                      }}
                    >
                      Создать подзадачу
                    </button>{" "}
                  </form>
                )}{" "}
                {task.children?.length ? (
                  <div
                    style={{ display: "flex", flexDirection: "column", gap: 8 }}
                  >
                    {" "}
                    {task.children.map((sub) => {
                      const sst = getStatusStyle(sub.status);
                      const subBg = getTaskBackground(sst.bg);
                      const subBorder = getTaskBorderLeft(sst.bg);
                      return (
                        <div
                          key={sub.id}
                          onClick={() => navigate(`/tasks/${sub.id}`)}
                          style={{
                            padding: 12,
                            borderRadius: 12,
                            background: subBg,
                            borderLeft: subBorder,
                            cursor: "pointer",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          {" "}
                          <span
                            style={{
                              fontSize: 14,
                              color: "var(--text-primary)",
                            }}
                          >
                            {sub.title}
                          </span>{" "}
                          <span
                            style={{
                              padding: "3px 8px",
                              borderRadius: 8,
                              fontSize: 11,
                              background: sst.bg,
                              color: sst.text,
                              fontWeight: 500,
                            }}
                          >
                            {getStatusLabel(sub.status)}
                          </span>{" "}
                        </div>
                      );
                    })}{" "}
                  </div>
                ) : (
                  <div style={{ color: "var(--text-muted)", fontSize: 13 }}>
                    Нет подзадач
                  </div>
                )}{" "}
              </div>{" "}
            </div>
          )}{" "}
          {activeTab === "comments" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {" "}
              <div
                style={{
                  padding: 24,
                  borderRadius: 16,
                  border: "1px solid var(--border-color)",
                  background: "var(--bg-card)",
                  boxShadow: "var(--shadow)",
                  display: "flex",
                  flexDirection: "column",
                  height: "calc(100vh - 280px)",
                  minHeight: 400,
                }}
              >
                {" "}
                <div
                  ref={commentsRef}
                  style={{
                    flex: 1,
                    overflowY: "auto",
                    overflowX: "hidden",
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                    padding: "8px 4px",
                  }}
                  className="no-scrollbar"
                >
                  {" "}
                  {comments.length === 0 && (
                    <div
                      style={{
                        textAlign: "center",
                        color: "var(--text-muted)",
                        fontSize: 14,
                        marginTop: 80,
                      }}
                    >
                      Нет сообщений. Напишите первое!
                    </div>
                  )}{" "}
                  {comments.map((c, idx) => {
                    const isMe = c.authorId === user?.id;
                    const showName =
                      !isMe &&
                      (idx === 0 || comments[idx - 1].authorId !== c.authorId);
                    return (
                      <div
                        key={c.id}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: isMe ? "flex-end" : "flex-start",
                          maxWidth: "100%",
                          padding: "2px 8px",
                        }}
                      >
                        {" "}
                        {showName && (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                              marginBottom: 4,
                              marginLeft: 8,
                            }}
                          >
                            {" "}
                            <Avatar
                              name={c.author?.name || "—"}
                              avatar={c.author?.avatar}
                              size={18}
                            />{" "}
                            <span
                              style={{
                                fontSize: 12,
                                fontWeight: 600,
                                color: "var(--text-muted)",
                              }}
                            >
                              {c.author?.name || "Неизвестный"}
                            </span>{" "}
                          </div>
                        )}{" "}
                        <div
                          style={{
                            maxWidth: "78%",
                            minWidth: 48,
                            padding: "12px 16px",
                            borderRadius: isMe
                              ? "22px 22px 6px 22px"
                              : "22px 22px 22px 6px",
                            fontSize: 15,
                            lineHeight: 1.45,
                            wordBreak: "break-word",
                            position: "relative",
                            overflow: "hidden",
                            background: c.isInternal
                              ? "linear-gradient(135deg, rgba(255,193,7,0.15) 0%, rgba(255,193,7,0.05) 100%)"
                              : isMe
                                ? "linear-gradient(135deg, #007aff 0%, #5856d6 50%, #af52de 100%)"
                                : "linear-gradient(135deg, var(--bg-hover) 0%, var(--bg-input) 100%)",
                            color: c.isInternal ? "var(--text-primary)" : isMe ? "#fff" : "var(--text-primary)",
                            boxShadow: c.isInternal
                              ? "0 4px 20px rgba(255,193,7,0.20), inset 0 1px 0 rgba(255,255,255,0.50)"
                              : isMe
                                ? "0 4px 20px rgba(0,122,255,0.35), inset 0 1px 0 rgba(255,255,255,0.25)"
                                : "0 4px 20px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.50)",
                            border: c.isInternal
                              ? "1px solid rgba(255,193,7,0.50)"
                              : isMe
                                ? "1px solid rgba(120,180,255,0.40)"
                                : "1px solid var(--border-color)",
                          }}
                        >
                          {" "}
                          <div
                            style={{
                              position: "absolute",
                              top: 0,
                              left: 0,
                              right: 0,
                              height: "50%",
                              borderRadius: "22px 22px 0 0",
                              background:
                                "linear-gradient(180deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0) 100%)",
                              pointerEvents: "none",
                            }}
                          />{" "}
                          <div style={{ position: "relative", zIndex: 1 }}>
                            {" "}
                            {c.isInternal && (
                              <div style={{ fontSize: 11, color: "#ffc107", marginBottom: 4, fontWeight: 600 }}>
                                🔒 Внутреннее сообщение
                              </div>
                            )}
                            <div style={{ marginBottom: 4 }}>
                              <LinkifyText text={c.content} />
                            </div>{" "}
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "flex-end",
                                gap: 6,
                              }}
                            >
                              {" "}
                              <span
                                style={{
                                  fontSize: 11,
                                  opacity: isMe ? 0.85 : 0.6,
                                  fontWeight: 500,
                                }}
                              >
                                {formatTime(c.createdAt)}
                              </span>{" "}
                              {isMe && (
                                <button
                                  onClick={() => handleDeleteComment(c.id)}
                                  style={{
                                    background: "none",
                                    border: "none",
                                    color: "rgba(255,255,255,0.70)",
                                    cursor: "pointer",
                                    fontSize: 11,
                                    padding: 0,
                                  }}
                                >
                                  ✕
                                </button>
                              )}{" "}
                            </div>{" "}
                          </div>{" "}
                          {c.attachments && c.attachments.length > 0 && (
                            <div
                              style={{
                                marginTop: 10,
                                position: "relative",
                                zIndex: 1,
                                display: "flex",
                                flexDirection: "column",
                                gap: 8,
                              }}
                            >
                              {" "}
                              {c.attachments.map((a) => {
                                const origin =
                                  typeof window !== "undefined"
                                    ? window.location.origin
                                    : "";
                                const fileUrl = a.path.startsWith("http")
                                  ? a.path
                                  : `${origin}${a.path}`;
                                const downloadUrl = `${origin}/api/uploads/${a.id}/download`;
                                const isImage =
                                  a.mimeType?.startsWith("image/");
                                if (isImage) {
                                  return (
                                    <div
                                      key={a.id}
                                      onClick={() => setModalImage(fileUrl)}
                                      style={{
                                        cursor: "pointer",
                                        display: "block",
                                      }}
                                    >
                                      {" "}
                                      <img
                                        src={fileUrl}
                                        alt={a.originalName}
                                        style={{
                                          maxWidth: 220,
                                          maxHeight: 180,
                                          borderRadius: 14,
                                          objectFit: "cover",
                                          display: "block",
                                          boxShadow:
                                            "0 4px 16px rgba(0,0,0,0.20)",
                                          border:
                                            "1px solid rgba(255,255,255,0.15)",
                                          cursor: "pointer",
                                          transition: "transform 0.2s ease",
                                        }}
                                        onMouseEnter={(e) => {
                                          (
                                            e.target as HTMLElement
                                          ).style.transform = "scale(1.02)";
                                        }}
                                        onMouseLeave={(e) => {
                                          (
                                            e.target as HTMLElement
                                          ).style.transform = "scale(1)";
                                        }}
                                      />{" "}
                                    </div>
                                  );
                                }
                                return (
                                  <a
                                    key={a.id}
                                    href={downloadUrl}
                                    download={a.originalName}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: 6,
                                      padding: "6px 12px",
                                      borderRadius: 12,
                                      background: isMe
                                        ? "rgba(255,255,255,0.15)"
                                        : "var(--bg-hover)",
                                      color: isMe
                                        ? "#fff"
                                        : "var(--text-primary)",
                                      fontSize: 13,
                                      textDecoration: "none",
                                      border: isMe
                                        ? "1px solid rgba(255,255,255,0.20)"
                                        : "1px solid var(--border-color)",
                                      backdropFilter: "blur(10px)",
                                      transition: "all 0.2s ease",
                                      cursor: "pointer",
                                      maxWidth: "100%",
                                    }}
                                    onMouseEnter={(e) => {
                                      (
                                        e.currentTarget as HTMLElement
                                      ).style.background = isMe
                                        ? "rgba(255,255,255,0.25)"
                                        : "var(--bg-body)";
                                    }}
                                    onMouseLeave={(e) => {
                                      (
                                        e.currentTarget as HTMLElement
                                      ).style.background = isMe
                                        ? "rgba(255,255,255,0.15)"
                                        : "var(--bg-hover)";
                                    }}
                                  >
                                    {" "}
                                    <span style={{ fontSize: 16 }}>
                                      📎
                                    </span>{" "}
                                    <span
                                      style={{
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                        maxWidth: 140,
                                      }}
                                    >
                                      {a.originalName}
                                    </span>{" "}
                                    <span
                                      style={{
                                        fontSize: 11,
                                        opacity: 0.6,
                                        whiteSpace: "nowrap",
                                      }}
                                    >
                                      ({(a.size / 1024).toFixed(1)} KB)
                                    </span>{" "}
                                  </a>
                                );
                              })}{" "}
                            </div>
                          )}{" "}
                        </div>{" "}
                      </div>
                    );
                  })}{" "}
                </div>{" "}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                    marginTop: 14,
                    padding: "12px 0",
                    borderTop: "1px solid var(--border-color)",
                  }}
                >
                  {/* Toolbar */}
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <FileUpload
                      entityType="comment"
                      entityId={id!}
                      onUpload={handleFileUpload}
                      isDark={isDark}
                      variant="button"
                      multiple={true}
                    />
                    <button
                      type="button"
                      onClick={() => setIsInternalComment(!isInternalComment)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                        padding: "5px 12px",
                        borderRadius: 8,
                        border: isInternalComment
                          ? "1px solid rgba(255,193,7,0.60)"
                          : "1px solid var(--border-color)",
                        background: isInternalComment
                          ? "rgba(255,193,7,0.12)"
                          : "var(--bg-input)",
                        color: isInternalComment ? "#b8860b" : "var(--text-secondary)",
                        fontSize: 13,
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                        transition: "all 0.2s ease",
                      }}
                    >
                      🥷 Инкогнито
                    </button>
                  </div>

                  {/* Pending attachments */}
                  {pendingAttachments.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {pendingAttachments.map((att) => (
                        <div
                          key={att.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '6px 12px',
                            borderRadius: 10,
                            background: 'var(--bg-input)',
                            fontSize: 13,
                            color: 'var(--text-secondary)',
                          }}
                        >
                          <span>📎 {att.originalName}</span>
                          <button
                            onClick={() => setPendingAttachments((prev) => prev.filter((a) => a.id !== att.id))}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--text-muted)',
                              cursor: 'pointer',
                              fontSize: 14,
                              padding: 0,
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Input row */}
                  <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Написать сообщение..."
                      rows={1}
                      style={{
                        flex: 1,
                        padding: "10px 14px",
                        borderRadius: 20,
                        border: "1px solid var(--border-color)",
                        background: "var(--bg-input)",
                        color: "var(--text-primary)",
                        fontSize: 15,
                        fontFamily: "inherit",
                        lineHeight: 1.4,
                        resize: "none",
                        outline: "none",
                        minHeight: 40,
                        maxHeight: 120,
                      }}
                    />
                    <button
                      onClick={handleAddComment}
                      disabled={!newComment.trim() && !pendingAttachments.length}
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: "50%",
                        border: "none",
                        background:
                          newComment.trim() || pendingAttachments.length
                            ? "linear-gradient(135deg, #007aff 0%, #5856d6 100%)"
                            : "rgba(142,142,147,0.30)",
                        color: "#fff",
                        fontSize: 20,
                        cursor:
                          newComment.trim() || pendingAttachments.length
                            ? "pointer"
                            : "not-allowed",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        boxShadow:
                          newComment.trim() || pendingAttachments.length
                            ? "0 4px 16px rgba(0,122,255,0.40)"
                            : "none",
                        transition: "all 0.2s ease",
                      }}
                    >
                      ↑
                    </button>
                  </div>
                </div>{" "}
              </div>{" "}
            </div>
          )}{" "}
          {activeTab === "history" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {" "}
              <div
                style={{
                  padding: 24,
                  borderRadius: 16,
                  border: "1px solid var(--border-color)",
                  background: "var(--bg-card)",
                  boxShadow: "var(--shadow)",
                }}
              >
                {" "}
                <h3
                  style={{
                    margin: "0 0 16px",
                    fontSize: 16,
                    color: "var(--text-primary)",
                  }}
                >
                  История изменений
                </h3>{" "}
                {historyLoading ? (
                  <div
                    style={{
                      textAlign: "center",
                      color: "var(--text-muted)",
                      padding: 40,
                    }}
                  >
                    Загрузка...
                  </div>
                ) : taskHistory.length === 0 ? (
                  <div
                    style={{
                      textAlign: "center",
                      color: "var(--text-muted)",
                      fontSize: 14,
                      padding: 40,
                    }}
                  >
                    История изменений пуста
                  </div>
                ) : (
                  <div
                    style={{ display: "flex", flexDirection: "column", gap: 8 }}
                  >
                    {" "}
                    {taskHistory.map((h, idx) => {
                      const prev = taskHistory[idx + 1];
                      const showDate =
                        !prev ||
                        new Date(h.createdAt).toDateString() !==
                          new Date(prev.createdAt).toDateString();
                      return (
                        <div key={h.id}>
                          {" "}
                          {showDate && (
                            <div
                              style={{
                                textAlign: "center",
                                margin: "16px 0 8px",
                              }}
                            >
                              {" "}
                              <span
                                style={{
                                  fontSize: 12,
                                  color: "var(--text-muted)",
                                  background: "var(--bg-body)",
                                  padding: "4px 12px",
                                  borderRadius: 10,
                                }}
                              >
                                {formatDateOnly(h.createdAt)}
                              </span>{" "}
                            </div>
                          )}{" "}
                          <div
                            style={{
                              display: "flex",
                              alignItems: "flex-start",
                              gap: 12,
                              padding: "10px 12px",
                              borderRadius: 12,
                              background: "var(--bg-input)",
                            }}
                          >
                            {" "}
                            <Avatar
                              name={h.user?.name || "Система"}
                              avatar={h.user?.avatar}
                              size={32}
                            />{" "}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              {" "}
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 8,
                                  flexWrap: "wrap",
                                  marginBottom: 4,
                                }}
                              >
                                {" "}
                                <span
                                  style={{
                                    fontSize: 13,
                                    fontWeight: 600,
                                    color: "var(--text-primary)",
                                  }}
                                >
                                  {h.user?.name || "Система"}
                                </span>{" "}
                                <span
                                  style={{
                                    fontSize: 12,
                                    color: "var(--text-muted)",
                                  }}
                                >
                                  {formatTime(h.createdAt)}
                                </span>{" "}
                              </div>{" "}
                              {h.field === "task" ? (
                                <div
                                  style={{
                                    fontSize: 14,
                                    color: "var(--text-secondary)",
                                  }}
                                >
                                  {" "}
                                  <span
                                    style={{
                                      color: "var(--text-primary)",
                                      fontWeight: 500,
                                    }}
                                  >
                                    {h.newValue}
                                  </span>{" "}
                                </div>
                              ) : (
                                <div
                                  style={{
                                    fontSize: 14,
                                    color: "var(--text-secondary)",
                                  }}
                                >
                                  {" "}
                                  Изменил{" "}
                                  <strong
                                    style={{ color: "var(--text-primary)" }}
                                  >
                                    {fieldLabels[h.field] || h.field}
                                  </strong>
                                  :{" "}
                                  <span
                                    style={{
                                      textDecoration: "line-through",
                                      color: "var(--text-muted)",
                                    }}
                                  >
                                    {renderHistoryValue(h.field, h.oldValue)}
                                  </span>{" "}
                                  →{" "}
                                  <span
                                    style={{
                                      color: "var(--text-primary)",
                                      fontWeight: 500,
                                    }}
                                  >
                                    {renderHistoryValue(h.field, h.newValue)}
                                  </span>{" "}
                                </div>
                              )}{" "}
                            </div>{" "}
                          </div>{" "}
                        </div>
                      );
                    })}{" "}
                  </div>
                )}{" "}
              </div>{" "}
            </div>
          )}{" "}
          {activeTab === "finances" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div
                style={{
                  padding: 24,
                  borderRadius: 16,
                  border: "1px solid var(--border-color)",
                  background: "var(--bg-card)",
                  boxShadow: "var(--shadow)",
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                    gap: 16,
                    marginBottom: 20,
                  }}
                >
                  <div
                    style={{
                      padding: 16,
                      borderRadius: 12,
                      background: "var(--bg-input)",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--text-muted)",
                        marginBottom: 4,
                      }}
                    >
                      Бюджет
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 700 }}>
                      {(finances?.budget || 0).toLocaleString("ru")} ₽
                    </div>
                  </div>
                  <div
                    style={{
                      padding: 16,
                      borderRadius: 12,
                      background: "var(--bg-input)",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--text-muted)",
                        marginBottom: 4,
                      }}
                    >
                      Стоимость
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 700 }}>
                      {(finances?.price || 0).toLocaleString("ru")} ₽
                    </div>
                  </div>
                  <div
                    style={{
                      padding: 16,
                      borderRadius: 12,
                      background: "var(--bg-input)",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--text-muted)",
                        marginBottom: 4,
                      }}
                    >
                      Расходы
                    </div>
                    <div
                      style={{
                        fontSize: 20,
                        fontWeight: 700,
                        color: "#dc2626",
                      }}
                    >
                      {(finances?.totalExpense || 0).toLocaleString("ru")} ₽
                    </div>
                  </div>
                  <div
                    style={{
                      padding: 16,
                      borderRadius: 12,
                      background: "var(--bg-input)",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--text-muted)",
                        marginBottom: 4,
                      }}
                    >
                      Прибыль
                    </div>
                    <div
                      style={{
                        fontSize: 20,
                        fontWeight: 700,
                        color: "#10b981",
                      }}
                    >
                      {(finances?.profit || 0).toLocaleString("ru")} ₽
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 12,
                  }}
                >
                  <h3
                    style={{
                      margin: 0,
                      fontSize: 16,
                      color: "var(--text-primary)",
                    }}
                  >
                    Транзакции
                  </h3>
                  <button
                    onClick={() => {
                      setShowTxForm(!showTxForm);
                      setEditingTx(null);
                    }}
                    style={{
                      padding: "6px 12px",
                      borderRadius: 10,
                      border: "none",
                      background: "var(--text-primary)",
                      color: "var(--bg-card)",
                      cursor: "pointer",
                      fontSize: 13,
                    }}
                  >
                    {showTxForm ? "Отмена" : "+ Добавить"}
                  </button>
                </div>

                {showTxForm && (
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (!txForm.amount) return;
                      const payload = {
                        type: txForm.type,
                        amount: parseFloat(txForm.amount),
                        description: txForm.description,
                        date: txForm.date || undefined,
                      };
                      if (editingTx) {
                        await api.taskFinances.updateTransaction(
                          id!,
                          editingTx.id,
                          payload,
                        );
                      } else {
                        await api.taskFinances.createTransaction(
                          id!,
                          payload,
                        );
                      }
                      setShowTxForm(false);
                      setTxForm({
                        type: "expense",
                        amount: "",
                        description: "",
                        date: "",
                      });
                      setEditingTx(null);
                      loadFinances();
                    }}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                      marginBottom: 16,
                      padding: 16,
                      background: "var(--bg-input)",
                      borderRadius: 12,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        gap: 10,
                        flexWrap: "wrap",
                      }}
                    >
                      <select
                        value={txForm.type}
                        onChange={(e) =>
                          setTxForm({
                            ...txForm,
                            type: e.target.value as "income" | "expense",
                          })
                        }
                        style={{
                          padding: 10,
                          borderRadius: 12,
                          border: "1px solid var(--border-color)",
                          background: "var(--bg-card)",
                          color: "var(--text-primary)",
                        }}
                      >
                        <option value="expense">Расход</option>
                        <option value="income">Доход</option>
                      </select>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Сумма"
                        value={txForm.amount}
                        onChange={(e) =>
                          setTxForm({ ...txForm, amount: e.target.value })
                        }
                        required
                        style={{
                          padding: 10,
                          borderRadius: 12,
                          border: "1px solid var(--border-color)",
                          background: "var(--bg-card)",
                          color: "var(--text-primary)",
                          flex: 1,
                        }}
                      />
                      <input
                        type="date"
                        value={txForm.date}
                        onChange={(e) =>
                          setTxForm({ ...txForm, date: e.target.value })
                        }
                        style={{
                          padding: 10,
                          borderRadius: 12,
                          border: "1px solid var(--border-color)",
                          background: "var(--bg-card)",
                          color: "var(--text-primary)",
                        }}
                      />
                    </div>
                    <ReactQuill
                      theme="snow"
                      value={txForm.description}
                      onChange={(value) =>
                        setTxForm({ ...txForm, description: value })
                      }
                      placeholder="Описание транзакции"
                      modules={{
                        toolbar: [
                          ["bold", "italic", "underline"],
                          [{ list: "ordered" }, { list: "bullet" }],
                          ["link"],
                          ["clean"],
                        ],
                      }}
                    />
                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                        justifyContent: "flex-end",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setShowTxForm(false);
                          setEditingTx(null);
                        }}
                        style={{
                          padding: "8px 16px",
                          borderRadius: 12,
                          border: "1px solid var(--border-color)",
                          background: "var(--bg-card)",
                          cursor: "pointer",
                          color: "var(--text-primary)",
                        }}
                      >
                        Отмена
                      </button>
                      <button
                        type="submit"
                        style={{
                          padding: "8px 16px",
                          borderRadius: 12,
                          border: "none",
                          background: "var(--text-primary)",
                          color: "var(--bg-card)",
                          cursor: "pointer",
                        }}
                      >
                        {editingTx ? "Сохранить" : "Добавить"}
                      </button>
                    </div>
                  </form>
                )}

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                  }}
                >
                  {financeLoading && (
                    <div
                      style={{
                        color: "var(--text-muted)",
                        fontSize: 13,
                      }}
                    >
                      Загрузка...
                    </div>
                  )}
                  {!financeLoading &&
                    finances?.transactions?.length === 0 && (
                      <div
                        style={{
                          color: "var(--text-muted)",
                          fontSize: 13,
                        }}
                      >
                        Нет транзакций
                      </div>
                    )}
                  {finances?.transactions?.map((tx) => (
                    <div
                      key={tx.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        padding: "10px 12px",
                        borderRadius: 10,
                        background: "var(--bg-input)",
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 500,
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          <span
                            style={{
                              padding: "2px 8px",
                              borderRadius: 6,
                              fontSize: 11,
                              background:
                                tx.type === "income"
                                  ? "#dcfce7"
                                  : "#fee2e2",
                              color:
                                tx.type === "income"
                                  ? "#166534"
                                  : "#991b1b",
                            }}
                          >
                            {tx.type === "income" ? "Доход" : "Расход"}
                          </span>
                          <span>
                            {tx.amount.toLocaleString("ru")} ₽
                          </span>
                        </div>
                        {tx.description && (
                          <div
                            style={{
                              fontSize: 12,
                              color: "var(--text-secondary)",
                              marginTop: 4,
                            }}
                            dangerouslySetInnerHTML={{
                              __html: tx.description,
                            }}
                          />
                        )}
                        <div
                          style={{
                            fontSize: 11,
                            color: "var(--text-muted)",
                            marginTop: 2,
                          }}
                        >
                          {new Date(tx.date).toLocaleDateString("ru")}
                        </div>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          gap: 6,
                          flexShrink: 0,
                        }}
                      >
                        <button
                          onClick={() => {
                            setEditingTx(tx);
                            setTxForm({
                              type: tx.type,
                              amount: String(tx.amount),
                              description: tx.description || "",
                              date: tx.date
                                ? tx.date.slice(0, 10)
                                : "",
                            });
                            setShowTxForm(true);
                          }}
                          style={{
                            padding: "4px 8px",
                            borderRadius: 8,
                            border: "1px solid var(--border-color)",
                            background: "var(--bg-card)",
                            cursor: "pointer",
                            fontSize: 12,
                            color: "var(--text-primary)",
                          }}
                        >
                          ✏️
                        </button>
                        <button
                          onClick={async () => {
                            if (
                              confirm("Удалить транзакцию?")
                            ) {
                              await api.taskFinances.deleteTransaction(
                                id!,
                                tx.id,
                              );
                              loadFinances();
                            }
                          }}
                          style={{
                            padding: "4px 8px",
                            borderRadius: 8,
                            border: "1px solid var(--border-color)",
                            background: "var(--bg-card)",
                            cursor: "pointer",
                            fontSize: 12,
                            color: "#dc2626",
                          }}
                        >
                          🗑
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}{" "}
          {activeTab === "files" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ padding: 24, borderRadius: 16, border: "1px solid var(--border-color)", background: "var(--bg-card)", boxShadow: "var(--shadow)" }}>
                <div style={{ border: `2px dashed ${dragOver ? '#1565c0' : 'var(--border-color)'}`, borderRadius: 12, padding: 40, textAlign: 'center', background: dragOver ? 'rgba(21,101,192,0.05)' : 'var(--bg-input)', transition: 'all 0.2s', cursor: 'pointer', marginBottom: 16 }} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} onClick={() => fileInputRef.current?.click()}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>📁</div>
                  <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Перетащите файлы сюда или нажмите для выбора</div>
                  <input ref={fileInputRef} type="file" multiple style={{ display: 'none' }} onChange={handleFileInput} />
                </div>
                {taskFiles.length === 0 ? (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 20 }}>Нет файлов</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {taskFiles.map(file => (
                      <div key={file.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 10, background: 'var(--bg-input)', border: '1px solid var(--border-color)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                          <span>📎</span>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>({(file.size / 1024).toFixed(1)} KB)</span>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={() => handleDownloadFile(file.name)} style={{ fontSize: 12, color: '#1565c0', background: 'none', border: 'none', cursor: 'pointer' }}>Скачать</button>
                          <button onClick={() => handleDeleteFile(file.name)} style={{ fontSize: 12, color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer' }}>Удалить</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}{" "}
          </div>{" "}
        </div>
      )}{" "}
      {modalImage && (
        <div
          onClick={() => setModalImage(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.90)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "zoom-out",
          }}
        >
          {" "}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setModalImage(null);
            }}
            style={{
              position: "absolute",
              top: 20,
              right: 20,
              background: "none",
              border: "none",
              color: "#fff",
              fontSize: 28,
              cursor: "pointer",
              zIndex: 1001,
            }}
          >
            ✕
          </button>{" "}
          <img
            src={modalImage}
            alt="Preview"
            style={{
              maxWidth: "90vw",
              maxHeight: "90vh",
              borderRadius: 12,
              boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
            }}
            onClick={(e) => e.stopPropagation()}
          />{" "}
        </div>
      )}{" "}
    </div>
  );
}
