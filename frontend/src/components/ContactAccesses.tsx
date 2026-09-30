import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { ContactAccess, ContactAccessDirection } from '../types';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const quillModules = {
  toolbar: [
    ['bold', 'italic', 'underline', 'strike'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['link'],
    ['clean'],
  ],
};

const quillFormats = ['bold', 'italic', 'underline', 'strike', 'list', 'bullet', 'link'];

const DIRECTIONS: { value: ContactAccessDirection; label: string; bg: string; text: string }[] = [
  { value: 'videoregistrator', label: 'Видеорегистратор', bg: '#e3f2fd', text: '#1565c0' },
  { value: 'cloud', label: 'Облачное хранилище', bg: '#e8f5e9', text: '#2e7d32' },
  { value: 'remote', label: 'Удалённое управление', bg: '#f3e5f5', text: '#7b1fa2' },
  { value: 'site_admin', label: 'Админка сайта', bg: '#fff3e0', text: '#e65100' },
  { value: 'server', label: 'Сервер', bg: '#eceff1', text: '#455a64' },
  { value: 'account', label: 'Учётная запись', bg: '#e0f7fa', text: '#00838f' },
  { value: 'router', label: 'Роутер', bg: '#fffde7', text: '#f9a825' },
];

const getDirection = (value: string) => DIRECTIONS.find(d => d.value === value) || { value: value as ContactAccessDirection, label: value, bg: '#f5f5f5', text: '#999' };

interface Props {
  contactId: string;
  canEdit: boolean;
}

export function ContactAccesses({ contactId, canEdit }: Props) {
  const [accesses, setAccesses] = useState<ContactAccess[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null); // null | 'new' | id
  const [direction, setDirection] = useState<ContactAccessDirection>('videoregistrator');
  const [description, setDescription] = useState('');
  const [comment, setComment] = useState('');
  const [url, setUrl] = useState('');
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.contactAccesses.list(contactId);
      setAccesses(data);
    } catch (e: any) {
      setError(e.message || 'Не удалось загрузить доступы');
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [contactId]);

  const resetForm = () => {
    setEditingId(null);
    setDirection('videoregistrator');
    setDescription('');
    setComment('');
    setUrl('');
    setLogin('');
    setPassword('');
    setError('');
  };

  const startEdit = (access: ContactAccess) => {
    setEditingId(access.id);
    setDirection(access.direction);
    setDescription(access.description || '');
    setComment(access.comment || '');
    setUrl(access.url || '');
    setLogin(access.login || '');
    setPassword(access.password || '');
    setError('');
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const payload = {
        direction,
        description: description.trim() || null,
        comment: comment.trim() || null,
        url: url.trim() || null,
        login: login.trim() || null,
        password: password || null,
      };
      if (editingId === 'new') {
        await api.contactAccesses.create({ contactId, ...payload });
      } else if (editingId) {
        await api.contactAccesses.update(editingId, payload);
      }
      resetForm();
      await load();
    } catch (e: any) {
      setError(e.message || 'Ошибка сохранения');
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Удалить доступ?')) return;
    try {
      await api.contactAccesses.delete(id);
      await load();
    } catch (e: any) {
      setError(e.message || 'Ошибка удаления');
    }
  };

  const togglePassword = (id: string) => {
    setVisiblePasswords(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const copyToClipboard = (value: string, key: string) => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(''), 1500);
    }).catch(() => {});
  };

  const inputStyle: React.CSSProperties = { padding: '8px 12px', borderRadius: 10, border: '1px solid var(--border-color)', fontSize: 14, width: '100%', boxSizing: 'border-box', background: 'var(--bg-card)', color: 'var(--text-color)' };
  const labelStyle: React.CSSProperties = { fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, display: 'block' };

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Загрузка...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {canEdit && editingId === null && (
        <button onClick={() => setEditingId('new')} style={{ padding: '10px 16px', borderRadius: 12, border: '1px dashed var(--border-color)', background: 'transparent', cursor: 'pointer', fontSize: 14, color: '#1565c0', alignSelf: 'flex-start' }}>+ Добавить доступ</button>
      )}

      {editingId !== null && (
        <div style={{ padding: 16, borderRadius: 12, border: '1px solid var(--border-color)', background: 'var(--bg-card)', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontWeight: 600, fontSize: 14 }}>{editingId === 'new' ? 'Новый доступ' : 'Редактирование доступа'}</div>
          <div>
            <label style={labelStyle}>Направление</label>
            <select value={direction} onChange={(e) => setDirection(e.target.value as ContactAccessDirection)} style={{ ...inputStyle, cursor: 'pointer' }}>
              {DIRECTIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Описание</label>
            <ReactQuill theme="snow" value={description} onChange={setDescription} modules={quillModules} formats={quillFormats} style={{ background: 'var(--bg-card)' }} />
          </div>
          <div>
            <label style={labelStyle}>Комментарий</label>
            <ReactQuill theme="snow" value={comment} onChange={setComment} modules={quillModules} formats={quillFormats} style={{ background: 'var(--bg-card)' }} />
          </div>
          <div>
            <label style={labelStyle}>Ссылка</label>
            <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." style={inputStyle} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Логин</label>
              <input value={login} onChange={(e) => setLogin(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Пароль</label>
              <input value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} />
            </div>
          </div>
          {error && <div style={{ color: '#c62828', fontSize: 13 }}>{error}</div>}
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleSave} disabled={saving} style={{ padding: '8px 16px', borderRadius: 12, border: 'none', background: '#1565c0', color: '#fff', cursor: 'pointer', fontSize: 14, opacity: saving ? 0.6 : 1 }}>{saving ? 'Сохранение...' : 'Сохранить'}</button>
            <button onClick={resetForm} style={{ padding: '8px 16px', borderRadius: 12, border: '1px solid var(--border-color)', background: 'var(--bg-card)', cursor: 'pointer', fontSize: 14 }}>Отмена</button>
          </div>
        </div>
      )}

      {accesses.length > 0 ? accesses.map((access) => {
        const dir = getDirection(access.direction);
        const isVisible = visiblePasswords.has(access.id);
        return (
          <div key={access.id} style={{ padding: 14, borderRadius: 12, border: '1px solid var(--border-color)', background: 'var(--bg-card)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
              <span style={{ padding: '3px 10px', borderRadius: 10, fontSize: 12, fontWeight: 500, background: dir.bg, color: dir.text }}>{dir.label}</span>
              {canEdit && (
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => startEdit(access)} style={{ padding: '4px 10px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'transparent', cursor: 'pointer', fontSize: 12 }}>✏️</button>
                  <button onClick={() => handleDelete(access.id)} style={{ padding: '4px 10px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'transparent', cursor: 'pointer', fontSize: 12 }}>🗑</button>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {access.description && (
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 2 }}>Описание</div>
                  <div className="rich-text" dangerouslySetInnerHTML={{ __html: access.description }} />
                </div>
              )}
              {access.comment && (
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 2 }}>Комментарий</div>
                  <div className="rich-text" dangerouslySetInnerHTML={{ __html: access.comment }} />
                </div>
              )}
              {access.url && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', minWidth: 70 }}>Ссылка</span>
                  <a href={access.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: '#1565c0', fontWeight: 500, textDecoration: 'none', wordBreak: 'break-all' }}>{access.url}</a>
                  <button onClick={() => copyToClipboard(access.url!, `url-${access.id}`)} title="Копировать ссылку" style={{ padding: '2px 8px', borderRadius: 6, border: '1px solid var(--border-color)', background: 'transparent', cursor: 'pointer', fontSize: 11 }}>{copied === `url-${access.id}` ? '✓' : '📋'}</button>
                </div>
              )}
              {access.login && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', minWidth: 70 }}>Логин</span>
                  <span style={{ fontSize: 13, fontFamily: 'monospace' }}>{access.login}</span>
                  <button onClick={() => copyToClipboard(access.login!, `login-${access.id}`)} title="Копировать логин" style={{ padding: '2px 8px', borderRadius: 6, border: '1px solid var(--border-color)', background: 'transparent', cursor: 'pointer', fontSize: 11 }}>{copied === `login-${access.id}` ? '✓' : '📋'}</button>
                </div>
              )}
              {access.password && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', minWidth: 70 }}>Пароль</span>
                  <span style={{ fontSize: 13, fontFamily: 'monospace' }}>{isVisible ? access.password : '••••••••'}</span>
                  <button onClick={() => togglePassword(access.id)} title={isVisible ? 'Скрыть пароль' : 'Показать пароль'} style={{ padding: '2px 8px', borderRadius: 6, border: '1px solid var(--border-color)', background: 'transparent', cursor: 'pointer', fontSize: 11 }}>{isVisible ? '🙈' : '👁'}</button>
                  <button onClick={() => copyToClipboard(access.password!, `pass-${access.id}`)} title="Копировать пароль" style={{ padding: '2px 8px', borderRadius: 6, border: '1px solid var(--border-color)', background: 'transparent', cursor: 'pointer', fontSize: 11 }}>{copied === `pass-${access.id}` ? '✓' : '📋'}</button>
                </div>
              )}
            </div>
          </div>
        );
      }) : (
        editingId === null && <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Нет сохранённых доступов</div>
      )}
      {error && editingId === null && <div style={{ color: '#c62828', fontSize: 13 }}>{error}</div>}
    </div>
  );
}
