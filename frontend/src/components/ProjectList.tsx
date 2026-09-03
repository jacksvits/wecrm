import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useRealtime } from '../hooks/useRealtime';
import { Project, Status } from '../types';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

export function ProjectList() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [flatProjects, setFlatProjects] = useState<Project[]>([]);
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [preselectedParentId, setPreselectedParentId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const defaultStatus = statuses.find(s => s.isDefault)?.name || statuses[0]?.name || 'active';
  const [form, setForm] = useState({ name: '', description: '', status: defaultStatus, startDate: '', endDate: '', parentId: '', isLocked: false });

  useEffect(() => {
    loadProjects();
    api.projects.list('flat=true').then(setFlatProjects);
    api.statuses.list('project').then(setStatuses);
  }, []);

  const loadProjects = () => api.projects.list().then(setProjects);

  useRealtime(['projects'], (data) => {
    if (data.entity === 'project') loadProjects();
  });

  const getStatusLabel = (name: string) => statuses.find(s => s.name === name)?.label || name;
  const getStatusStyle = (name: string) => {
    const s = statuses.find(st => st.name === name);
    return s ? { bg: s.color, text: s.textColor } : { bg: '#f0f0f0', text: '#666' };
  };

  const openCreate = (parentId?: string) => {
    setEditingId(null);
    setPreselectedParentId(parentId || null);
    setForm({ name: '', description: '', status: defaultStatus, startDate: '', endDate: '', parentId: parentId || '', isLocked: false });
    setShowModal(true);
  };

  const openEdit = (project: Project) => {
    setEditingId(project.id);
    setPreselectedParentId(null);
    setForm({
      name: project.name,
      description: project.description || '',
      status: project.status,
      startDate: project.startDate ? project.startDate.slice(0, 10) : '',
      endDate: project.endDate ? project.endDate.slice(0, 10) : '',
      parentId: project.parentId || '',
      isLocked: project.isLocked || false,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      ...form,
      startDate: form.startDate ? new Date(form.startDate).toISOString() : undefined,
      endDate: form.endDate ? new Date(form.endDate).toISOString() : undefined,
    };
    if (editingId) {
      await api.projects.update(editingId, data);
    } else {
      await api.projects.create(data);
    }
    setShowModal(false);
    loadProjects();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить проект?')) return;
    await api.projects.delete(id);
    loadProjects();
  };

  const toggleExpand = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const getChildren = (parentId: string) => projects.filter(p => p.parentId === parentId);
  const rootProjects = projects.filter(p => !p.parentId);

  function ProjectTreeItem({ project, depth = 0 }: { project: Project; depth?: number }) {
    const children = getChildren(project.id);
    const isExpanded = expanded.has(project.id);
    const hasChildren = children.length > 0;
    const indent = depth * 24;
    const st = getStatusStyle(project.status);
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', padding: '10px 12px', borderRadius: 12, border: '1px solid var(--border-color)', background: 'var(--bg-card)', marginBottom: 6, marginLeft: indent, transition: 'all 0.2s', boxShadow: depth === 0 ? '0 2px 8px rgba(0,0,0,0.06)' : 'none' }}>
          <div style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 4, flexShrink: 0 }}>
            {hasChildren ? (
              <button onClick={() => toggleExpand(project.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: 'var(--text-secondary)', padding: 0, width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{isExpanded ? '▲' : '▼'}</button>
            ) : (
              <div style={{ width: 24 }} />
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6 }}>
              {project.name}
              {project.isLocked && <span title="Не доступен для выбора" style={{ fontSize: 12, opacity: 0.7 }}>🔒</span>}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{project.description?.slice(0, 60) || '—'}</div>
          </div>
          <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 11, background: st.bg, color: st.text, whiteSpace: 'nowrap', marginLeft: 8 }}>{getStatusLabel(project.status)}</span>
          <div style={{ display: 'flex', gap: 4, marginLeft: 8, flexShrink: 0 }}>
            <button onClick={() => openEdit(project)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 12 }}>✏️</button>
            <button onClick={() => handleDelete(project.id)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 12 }}>🗑</button>
            <button onClick={() => openCreate(project.id)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 12 }}>➕</button>
          </div>
        </div>
        {isExpanded && children.map(child => <ProjectTreeItem key={child.id} project={child} depth={depth + 1} />)}
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <h2 style={{ margin: 0, fontSize: 18 }}>Проекты</h2>
        <button onClick={() => openCreate()} style={{ padding: '8px 16px', borderRadius: 12, border: 'none', background: '#1a1a1a', color: '#fff', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>+ Создать проект</button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {rootProjects.map(p => <ProjectTreeItem key={p.id} project={p} />)}
        {rootProjects.length === 0 && <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Проекты не найдены</div>}
      </div>
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <form onSubmit={handleSubmit} style={{ background: 'var(--bg-card)', borderRadius: 16, padding: 24, width: '100%', maxWidth: 480, maxHeight: '90vh', overflow: 'auto' }}>
            <h3 style={{ margin: '0 0 16px' }}>{editingId ? 'Редактировать проект' : 'Новый проект'}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input placeholder='Название' value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-color)' }} />
              <ReactQuill theme='snow' value={form.description} onChange={(value) => setForm({ ...form, description: value })} placeholder='Описание' modules={{ toolbar: [['bold', 'italic', 'underline'], [{ list: 'ordered' }, { list: 'bullet' }], ['link']] }} style={{ borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-card)' }} />
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-color)' }}>
                {statuses.map(s => <option key={s.name} value={s.name}>{s.label}</option>)}
              </select>
              <input type='date' placeholder='Дата начала' value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-color)' }} />
              <input type='date' placeholder='Дата окончания' value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-color)' }} />
              <select value={form.parentId} onChange={e => setForm({ ...form, parentId: e.target.value })} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-color)' }}>
                <option value=''>— Родительский проект —</option>
                {flatProjects.filter(p => p.id !== editingId).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14, padding: '4px 0' }}>
                <input
                  type='checkbox'
                  checked={form.isLocked}
                  onChange={e => setForm({ ...form, isLocked: e.target.checked })}
                  style={{ width: 16, height: 16, cursor: 'pointer' }}
                />
                <span>🔒 Не доступен для выбора</span>
              </label>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
              <button type='button' onClick={() => setShowModal(false)} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-card)', cursor: 'pointer' }}>Отмена</button>
              <button type='submit' style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#1a1a1a', color: '#fff', cursor: 'pointer' }}>{editingId ? 'Сохранить' : 'Создать'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
