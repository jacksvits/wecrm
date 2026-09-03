import { useEffect, useState } from "react";
import { api } from "../api/client";
import { useRealtime } from "../hooks/useRealtime";
import { User, Role } from "../types";
import { useAuth } from "../hooks/useAuth";
function isRoleObject(role: Role | string | undefined): role is Role {
  return typeof role === "object" && role !== null && "id" in role;
}
export function UserList() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    roleId: "" as string,
    canBeCurator: false,
    novofonExtension: "" as string,
  });
  useEffect(() => {
    loadUsers();
    api.roles
      .list()
      .then(setRoles)
      .catch(() => {});
  }, []);
  const loadUsers = () => {
    api.users
      .list()
      .then(setUsers)
      .catch(() => {});
  };
  const openCreate = () => {
    setEditingId(null);
    setForm({ name: "", email: "", password: "", roleId: roles[0]?.id || "", canBeCurator: false, novofonExtension: "" });
    setError("");
    setShowModal(true);
  };
  const openEdit = (u: User) => {
    setEditingId(u.id);
    setForm({
      name: u.name,
      email: u.email,
      password: "",
      roleId: u.roleId || "",
      canBeCurator: u.canBeCurator ?? false,
      novofonExtension: u.novofonExtension || "",
    });
    setError("");
    setShowModal(true);
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      if (editingId) {
        const data: any = { name: form.name, roleId: form.roleId || null, canBeCurator: form.canBeCurator, novofonExtension: form.novofonExtension || null };
        if (form.email !== users.find((u) => u.id === editingId)?.email)
          data.email = form.email;
        await api.users.update(editingId, data);
      } else {
        await api.users.create({ ...form, roleId: form.roleId || undefined });
      }
      setShowModal(false);
      loadUsers();
    } catch (err: any) {
      setError(err.message || "Ошибка");
    }
  };
  const handleDelete = async (id: string) => {
    if (!confirm("Удалить пользователя?")) return;
    try {
      await api.users.delete(id);
      loadUsers();
    } catch (err: any) {
      alert(err.message || "Ошибка удаления");
    }
  };
  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()),
  );
  const grouped = filteredUsers.reduce<
    Record<string, { role?: Role; users: User[] }>
  >((acc, u) => {
    const rid = u.roleId || "none";
    if (!acc[rid])
      acc[rid] = { role: isRoleObject(u.role) ? u.role : undefined, users: [] };
    acc[rid].users.push(u);
    return acc;
  }, {});
  const sortedGroupKeys = Object.keys(grouped).sort((a, b) => {
    const ra = grouped[a].role?.sortOrder || 999;
    const rb = grouped[b].role?.sortOrder || 999;
    return ra - rb;
  });
  const isAdmin =
    typeof currentUser?.role === "string"
      ? currentUser.role === "admin"
      : currentUser?.role?.name === "admin";
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
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>
          Пользователи
        </h2>{" "}
        <div
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            flexWrap: "wrap",
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
              width: 200,
            }}
          />{" "}
          {isAdmin && (
            <button
              onClick={openCreate}
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
              + Добавить
            </button>
          )}{" "}
        </div>{" "}
      </div>{" "}
      {sortedGroupKeys.map((roleId) => {
        const group = grouped[roleId];
        const r = group.role;
        return (
          <div key={roleId} style={{ marginBottom: 20 }}>
            {" "}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 8,
              }}
            >
              {" "}
              <span
                style={{
                  padding: "3px 10px",
                  borderRadius: 10,
                  fontSize: 12,
                  fontWeight: 500,
                  background: r?.color || "#f0f0f0",
                  color: r?.textColor || "#666",
                }}
              >
                {r?.label || "Без роли"}
              </span>{" "}
              <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
                {group.users.length} чел.
              </span>{" "}
            </div>{" "}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: 12,
              }}
            >
              {" "}
              {group.users.map((u) => (
                <div
                  key={u.id}
                  style={{
                    background: "var(--bg-card)",
                    borderRadius: 16,
                    border: "1px solid var(--border-color)",
                    padding: 16,
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    boxShadow: "var(--shadow)",
                  }}
                >
                  {" "}
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      background: u.avatar ? "transparent" : "var(--bg-hover)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 14,
                      fontWeight: 600,
                      color: "var(--text-secondary)",
                      flexShrink: 0,
                      overflow: "hidden",
                    }}
                  >
                    {u.avatar ? (
                      <img
                        src={u.avatar}
                        alt={u.name}
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: "50%",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      u.name.charAt(0).toUpperCase()
                    )}
                  </div>{" "}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {" "}
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 500,
                        color: "var(--text-primary)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {u.name}
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
                      {u.email}
                    </div>{" "}
                    {u.canBeCurator && (
                      <span
                        style={{
                          display: "inline-block",
                          marginTop: 4,
                          padding: "2px 8px",
                          borderRadius: 8,
                          fontSize: 11,
                          fontWeight: 500,
                          background: "#dbeafe",
                          color: "#1e40af",
                        }}
                      >
                        Куратор
                      </span>
                    )}
                    {u.lastActiveAt && (
                      <div
                        style={{
                          fontSize: 11,
                          color: "var(--text-muted)",
                          marginTop: 2,
                        }}
                      >
                        Активность: {" "}
                        {new Date(u.lastActiveAt).toLocaleString("ru")}
                      </div>
                    )}{" "}
                  </div>{" "}
                  {isAdmin && u.id !== currentUser?.id && (
                    <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                      {" "}
                      <button
                        onClick={() => openEdit(u)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "var(--text-muted)",
                          cursor: "pointer",
                          fontSize: 12,
                          padding: 4,
                        }}
                        title="Редактировать"
                      >
                        ✏️
                      </button>{" "}
                      <button
                        onClick={() => handleDelete(u.id)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "var(--text-muted)",
                          cursor: "pointer",
                          fontSize: 12,
                          padding: 4,
                        }}
                        title="Удалить"
                      >
                        🗑
                      </button>{" "}
                    </div>
                  )}{" "}
                </div>
              ))}{" "}
            </div>{" "}
          </div>
        );
      })}{" "}
      {filteredUsers.length === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: 40,
            color: "var(--text-muted)",
            fontSize: 14,
          }}
        >
          Пользователи не найдены
        </div>
      )}{" "}
      {showModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: 16,
          }}
        >
          {" "}
          <div
            style={{
              background: "var(--bg-card)",
              borderRadius: 12,
              padding: 24,
              width: "100%",
              maxWidth: 420,
              maxHeight: "90vh",
              overflow: "auto",
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
            }}
          >
            {" "}
            <h3 style={{ margin: "0 0 16px", fontSize: 18 }}>
              {editingId ? "Редактировать пользователя" : "Новый пользователь"}
            </h3>{" "}
            {error && (
              <div
                style={{
                  color: "#dc2626",
                  fontSize: 13,
                  marginBottom: 12,
                  padding: "8px 12px",
                  background: "#fef2f2",
                  borderRadius: 10,
                }}
              >
                {error}
              </div>
            )}{" "}
            <form
              onSubmit={handleSubmit}
              style={{ display: "flex", flexDirection: "column", gap: 12 }}
            >
              {" "}
              <input
                placeholder="Имя"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                style={{
                  padding: 10,
                  borderRadius: 12,
                  border: "1px solid var(--border-color)",
                  fontSize: 14,
                }}
              />{" "}
              <input
                placeholder="Email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                style={{
                  padding: 10,
                  borderRadius: 12,
                  border: "1px solid var(--border-color)",
                  fontSize: 14,
                }}
              />{" "}
              {!editingId && (
                <input
                  placeholder="Пароль (мин. 6 символов)"
                  type="password"
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  required
                  style={{
                    padding: 10,
                    borderRadius: 12,
                    border: "1px solid var(--border-color)",
                    fontSize: 14,
                  }}
                />
              )}{" "}
              <select
                value={form.roleId}
                onChange={(e) => setForm({ ...form, roleId: e.target.value })}
                style={{
                  padding: 10,
                  borderRadius: 12,
                  border: "1px solid var(--border-color)",
                  fontSize: 14,
                }}
              >
                {" "}
                <option value="">— Без роли —</option>{" "}
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}{" "}
              </select>{" "}
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 14,
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={form.canBeCurator}
                  onChange={(e) =>
                    setForm({ ...form, canBeCurator: e.target.checked })
                  }
                />
                Может быть куратором
              </label>
              <label style={{ display: 'block', marginTop: 12, fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>
                Короткий номер Novofon
                <input
                  type="text"
                  value={form.novofonExtension}
                  onChange={(e) => setForm({ ...form, novofonExtension: e.target.value })}
                  placeholder="101"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 14, marginTop: 4 }}
                />
              </label>
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  justifyContent: "flex-end",
                  marginTop: 8,
                }}
              >
                {" "}
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 12,
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
                    borderRadius: 12,
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
          </div>{" "}
        </div>
      )}{" "}
    </div>
  );
}
