import { useEffect, useState } from 'react';
import { formatPhoneInput, displayPhone } from '../lib/phone';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { api } from '../api/client';
import { useRealtime } from '../hooks/useRealtime';
import { Contact } from '../types';

interface ContactType {
  id: string;
  name: string;
  label: string;
  color: string;
  textColor: string;
  sortOrder: number;
  isActive: boolean;
}

const kindLabels: Record<string, string> = {
  contact: 'Контакт',
  organization: 'Организация',
};

const kindColors: Record<string, { bg: string; text: string }> = {
  contact: { bg: '#e3f2fd', text: '#1565c0' },
  organization: { bg: '#e8f5e9', text: '#2e7d32' },
};

export function ContactList() {
  const navigate = useNavigate();
  const location = useLocation();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [organizations, setOrganizations] = useState<Contact[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState('createdAtDesc');
  const [search, setSearch] = useState('');
  const [kindFilter, setKindFilter] = useState<'all' | 'contact' | 'organization'>('all');
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const PAGE_SIZE = 50;
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [mergeTargetId, setMergeTargetId] = useState<string>('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFormat, setImportFormat] = useState<'vcf' | 'csv' | 'xlsx'>('vcf');
  const [importData, setImportData] = useState('');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<string>('');
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isManager = user?.role === 'manager';
  const canEdit = isAdmin || isManager;
  const canDelete = isAdmin;
  const canImport = isAdmin;

  const [isMobile, setIsMobile] = useState(false);
  const [contactTypes, setContactTypes] = useState<ContactType[]>([]);

  useEffect(() => {
    loadContactTypes();
  }, []);

  const loadContactTypes = async () => {
    try {
      const data = await api.contactTypes.list();
      setContactTypes(data);
    } catch (err) {
      console.error('Failed to load contact types:', err);
    }
  };

  const getTypeLabel = (name: string) => contactTypes.find(t => t.name === name)?.label || name;
  const getTypeColor = (name: string) => {
    const t = contactTypes.find(t => t.name === name);
    return t ? { bg: t.color, text: t.textColor } : { bg: '#f5f5f5', text: '#999' };
  };

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const [form, setForm] = useState({
    name: '',
    emails: [''],
    phones: [''],
    company: '',
    type: 'client' as const,
    kind: 'contact' as 'contact' | 'organization',
    tags: '',
    notes: '',
    inn: '',
    ogrn: '',
    legalAddress: '',
    position: '',
    organizationId: '',
  });

  useEffect(() => {
    loadContacts(true);
    loadOrganizations();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadContacts(true);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const loadContacts = async (reset = false) => {
    const params = kindFilter !== 'all' ? `kind=${kindFilter}` : '';
    api.contacts.list(params).then(setContacts);
  };

  const loadOrganizations = () => {
    api.contacts.list('kind=organization').then(setOrganizations);
  };

  useEffect(() => {
    loadContacts(true);
  }, [kindFilter]);

  useEffect(() => {
    if (location.state?.editingId && contacts.length > 0) {
      const contact = contacts.find(c => c.id === location.state.editingId);
      if (contact) {
        openEdit(contact);
        window.history.replaceState({}, document.title);
      }
    }
  }, [contacts, location.state]);

  useRealtime(["contacts"], (data) => {
    if (data.entity === "contact") {
      loadContacts();
      loadOrganizations();
    }
  });

  const openCreate = () => {
    setEditingId(null);
    setForm({
      name: '', emails: [''], phones: [''], company: '', type: 'client', kind: 'contact',
      tags: '', notes: '', inn: '', ogrn: '', legalAddress: '', position: '', organizationId: '',
    });
    setShowModal(true);
  };

  const openEdit = (contact: Contact) => {
    setEditingId(contact.id);
    setForm({
      name: contact.name,
      emails: contact.emails?.length ? contact.emails : contact.email ? [contact.email] : [''],
      phones: contact.phones?.length ? contact.phones : contact.phone ? [contact.phone] : [''],
      company: contact.company || '',
      type: contact.type as any,
      kind: contact.kind as 'contact' | 'organization',
      tags: contact.tags.join(', '),
      notes: contact.notes || '',
      inn: contact.inn || '',
      ogrn: contact.ogrn || '',
      legalAddress: contact.legalAddress || '',
      position: contact.position || '',
      organizationId: contact.organizationId || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data: any = {
      ...form,
      emails: form.emails.filter(Boolean),
      phones: form.phones.filter(Boolean),
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
    };
    if (form.kind === 'organization') {
      data.position = null;
      data.organizationId = null;
    } else {
      data.inn = null;
      data.ogrn = null;
      data.legalAddress = null;
    }
    if (editingId) {
      await api.contacts.update(editingId, data);
    } else {
      await api.contacts.create(data);
    }
    setShowModal(false);
    loadContacts();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить контакт?')) return;
    await api.contacts.delete(id);
    loadContacts();
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === sortedContacts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sortedContacts.map(c => c.id)));
    }
  };

  const handleMerge = async () => {
    if (selectedIds.size < 2) {
      alert('Выберите минимум 2 контакта для объединения');
      return;
    }
    const ids = Array.from(selectedIds);
    setMergeTargetId(ids[0]);
    setShowMergeModal(true);
  };

  const handleImport = async () => {
    if (!importData.trim()) {
      alert('Вставьте данные для импорта');
      return;
    }
    setImporting(true);
    setImportResult('');
    try {
      const res = await api.contacts.import(importFormat, importData);
      setImportResult(`Импортировано: ${res.imported} контактов`);
      setImportData('');
      loadContacts();
      setTimeout(() => { setShowImportModal(false); setImportResult(''); }, 2000);
    } catch (err: any) {
      setImportResult('Ошибка: ' + (err.message || 'Неизвестная ошибка'));
    } finally {
      setImporting(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split('.').pop()?.toLowerCase();
    const format = ext === 'csv' ? 'csv' : ext === 'xlsx' ? 'xlsx' : 'vcf';
    setImportFormat(format);
    if (format === 'xlsx') {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        setImportData(base64);
      };
      reader.readAsDataURL(file);
    } else {
      const text = await file.text();
      setImportData(text);
    }
  };

  const confirmMerge = async () => {
    const sourceIds = Array.from(selectedIds).filter(id => id !== mergeTargetId);
    if (sourceIds.length === 0) {
      alert('Выберите контакты для объединения (кроме целевого)');
      return;
    }
    try {
      await api.contacts.merge(mergeTargetId, sourceIds);
      alert('Контакты объединены');
      setShowMergeModal(false);
      setSelectedIds(new Set());
      loadContacts();
    } catch (err: any) {
      alert('Ошибка: ' + err.message);
    }
  };

  const sortedContacts = [...contacts]
    .sort((a, b) => {
      switch (sortBy) {
        case 'nameAsc': return a.name.localeCompare(b.name);
        case 'nameDesc': return b.name.localeCompare(a.name);
        case 'createdAtAsc': return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'createdAtDesc': return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'type': return a.type.localeCompare(b.type);
        default: return 0;
      }
    })
    .filter(c =>
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.company || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.email || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.phone || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.inn || '').toLowerCase().includes(search.toLowerCase()) ||
      c.emails.some(e => e.toLowerCase().includes(search.toLowerCase())) ||
      c.phones.some(p => p.toLowerCase().includes(search.toLowerCase())) ||
      c.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))
    );

  const addEmail = () => setForm(prev => ({ ...prev, emails: [...prev.emails, ''] }));
  const removeEmail = (idx: number) => setForm(prev => ({ ...prev, emails: prev.emails.filter((_, i) => i !== idx) }));
  const updateEmail = (idx: number, val: string) => setForm(prev => ({ ...prev, emails: prev.emails.map((e, i) => i === idx ? val : e) }));

  const addPhone = () => setForm(prev => ({ ...prev, phones: [...prev.phones, ''] }));
  const removePhone = (idx: number) => setForm(prev => ({ ...prev, phones: prev.phones.filter((_, i) => i !== idx) }));
  const updatePhone = (idx: number, val: string) => setForm(prev => ({ ...prev, phones: prev.phones.map((p, i) => i === idx ? val : p) }));

  const ViewToggle = () => (
    <div style={{ display: 'flex', gap: 2, padding: 2, borderRadius: 10, background: 'var(--bg-body)', border: '1px solid var(--border-color)' }}>
      <button onClick={() => setViewMode('cards')} style={{ padding: '6px 10px', borderRadius: 8, border: 'none', background: viewMode === 'cards' ? '#fff' : 'transparent', color: viewMode === 'cards' ? '#1a1a1a' : '#999', fontSize: 13, cursor: 'pointer', fontWeight: 500, boxShadow: viewMode === 'cards' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>⊞ Карточки</button>
      <button onClick={() => setViewMode('list')} style={{ padding: '6px 10px', borderRadius: 8, border: 'none', background: viewMode === 'list' ? '#fff' : 'transparent', color: viewMode === 'list' ? '#1a1a1a' : '#999', fontSize: 13, cursor: 'pointer', fontWeight: 500, boxShadow: viewMode === 'list' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>☰ Список</button>
    </div>
  );

  const CardView = () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
      {sortedContacts.map(contact => {
        const tc = getTypeColor(contact.type);
        const kc = kindColors[contact.kind] || { bg: '#f5f5f5', text: '#999' };
        const isSelected = selectedIds.has(contact.id);
        return (
          <div key={contact.id} style={{
            padding: 16,
            borderRadius: 16,
            border: isSelected ? '2px solid #007AFF' : '1px solid #e5e5e5',
            background: 'var(--bg-card)',
            boxShadow: 'var(--shadow)',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            transition: 'all 0.15s',
            cursor: 'pointer',
          }}
            onClick={() => toggleSelect(contact.id)}
            onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.borderColor = '#ccc'; }}
            onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.borderColor = '#e5e5e5'; }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => {}}
                onClick={e => { e.stopPropagation(); toggleSelect(contact.id); }}
                style={{ width: 18, height: 18, cursor: 'pointer' }}
              />
              <div style={{
                width: 44, height: 44, borderRadius: '50%', background: tc.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, fontWeight: 600, color: tc.text, flexShrink: 0,
                overflow: 'hidden',
              }}>
                {contact.avatarUrl ? (
                  <img src={contact.avatarUrl} alt={contact.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                ) : (
                  contact.name.charAt(0)
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  onClick={() => navigate(`/contacts/${contact.id}`)}
                  style={{ fontSize: 15, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'pointer', color: '#1565c0' }}
                >{contact.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{contact.company || '—'}</div>
              </div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
              <span style={{ padding: '3px 10px', borderRadius: 10, fontSize: 11, fontWeight: 500, background: kc.bg, color: kc.text }}>{kindLabels[contact.kind] || contact.kind}</span>
              <span style={{ padding: '3px 10px', borderRadius: 10, fontSize: 11, fontWeight: 500, background: tc.bg, color: tc.text }}>{getTypeLabel(contact.type)}</span>
              {contact.tags.map(tag => <span key={tag} style={{ padding: '3px 10px', borderRadius: 10, fontSize: 11, background: 'var(--bg-body)', color: 'var(--text-muted)' }}>{tag}</span>)}
              {(contact._count?.tasks ?? 0) > 0 && (
                <span
                  onClick={(e) => { e.stopPropagation(); navigate(`/tasks?contactId=${contact.id}`); }}
                  style={{ padding: '3px 10px', borderRadius: 10, fontSize: 11, fontWeight: 500, background: '#e3f2fd', color: '#1565c0', cursor: 'pointer' }}
                >
                  📋 {contact._count?.tasks}
                </span>
              )}
              {(contact._count?.deals ?? 0) > 0 && (
                <span
                  onClick={(e) => { e.stopPropagation(); navigate(`/deals?contactId=${contact.id}`); }}
                  style={{ padding: '3px 10px', borderRadius: 10, fontSize: 11, fontWeight: 500, background: '#e8f5e9', color: '#2e7d32', cursor: 'pointer' }}
                >
                  💼 {contact._count?.deals}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13, color: 'var(--text-secondary)' }}>
              {contact.phones?.filter(Boolean).map((p, i) => <span key={i}>📞 {displayPhone(p)}</span>)}
              {!contact.phones?.filter(Boolean).length && contact.phone && <span>📞 {displayPhone(contact.phone)}</span>}
              {contact.emails?.filter(Boolean).map((e, i) => <span key={i}>✉️ {e}</span>)}
              {!contact.emails?.filter(Boolean).length && contact.email && <span>✉️ {contact.email}</span>}
              {contact.inn && <span>🆔 ИНН: {contact.inn}</span>}
              {contact.description && <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>📝 {contact.description}</span>}
              {contact.lastActivityTime && <span style={{ color: '#999', fontSize: 11 }}>⏱️ {new Date(contact.lastActivityTime).toLocaleString('ru-RU')}</span>}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: 8, borderTop: '1px solid #f0f0f0' }}>
              <span style={{ fontSize: 11, color: '#bbb' }}>{new Date(contact.createdAt).toLocaleDateString('ru')}</span>
              <div style={{ display: 'flex', gap: 8 }}>
                {canEdit && (
                  <button onClick={e => { e.stopPropagation(); openEdit(contact); }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 14, padding: 4 }}>✏️</button>
                )}
                {canDelete && (
                  <button onClick={e => { e.stopPropagation(); handleDelete(contact.id); }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 14, padding: 4 }}>🗑</button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  const ListView = () => (
    <div style={{ borderRadius: 16, border: '1px solid var(--border-color)', background: 'var(--bg-card)', overflow: 'hidden', boxShadow: 'var(--shadow)' }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '40px 2fr 1fr 1fr 1.5fr 1.5fr 1fr 80px 80px 80px',
        gap: 12,
        padding: '12px 16px',
        background: 'var(--bg-input)',
        fontSize: 12,
        fontWeight: 600,
        color: 'var(--text-muted)',
        borderBottom: '1px solid var(--border-color)',
        alignItems: 'center',
      }}>
        <input type="checkbox" checked={selectedIds.size === sortedContacts.length && sortedContacts.length > 0} onChange={selectAll} style={{ width: 18, height: 18 }} />
        <span>Имя / Компания</span>
        <span>Вид</span>
        <span>Тип</span>
        <span>Телефоны</span>
        <span>Email</span>
        <span>Теги</span>
        <span style={{ textAlign: 'center' }}>Задачи</span>
        <span style={{ textAlign: 'center' }}>Сделки</span>
        <span></span>
      </div>
      {sortedContacts.map((contact, idx) => {
        const tc = getTypeColor(contact.type);
        const kc = kindColors[contact.kind] || { bg: '#f5f5f5', text: '#999' };
        const isSelected = selectedIds.has(contact.id);
        return (
          <div key={contact.id} style={{
            display: 'grid',
            gridTemplateColumns: '40px 2fr 1fr 1fr 1.5fr 1.5fr 1fr 80px 80px 80px',
            gap: 12,
            padding: '12px 16px',
            alignItems: 'center',
            borderBottom: idx < sortedContacts.length - 1 ? '1px solid #f0f0f0' : 'none',
            transition: 'background 0.15s',
            background: isSelected ? '#f0f7ff' : 'transparent',
          }}>
            <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(contact.id)} style={{ width: 18, height: 18, cursor: 'pointer' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%', background: tc.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 600, color: tc.text, flexShrink: 0,
                overflow: 'hidden',
              }}>
                {contact.avatarUrl ? (
                  <img src={contact.avatarUrl} alt={contact.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                ) : (
                  contact.name.charAt(0)
                )}
              </div>
              <div style={{ minWidth: 0 }}>
                <div
                  onClick={() => navigate(`/contacts/${contact.id}`)}
                  style={{ fontSize: 14, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'pointer', color: '#1565c0' }}
                >{contact.name}</div>
                <div style={{ fontSize: 12, color: '#bbb', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{contact.company || '—'}</div>
              </div>
            </div>
            <span style={{ padding: '3px 10px', borderRadius: 10, fontSize: 11, fontWeight: 500, background: kc.bg, color: kc.text, justifySelf: 'start' }}>{kindLabels[contact.kind] || contact.kind}</span>
            <span style={{ padding: '3px 10px', borderRadius: 10, fontSize: 11, fontWeight: 500, background: tc.bg, color: tc.text, justifySelf: 'start' }}>{getTypeLabel(contact.type)}</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {contact.phones?.filter(Boolean).slice(0, 2).map((p, i) => <span key={i} style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{displayPhone(p)}</span>)}
              {!contact.phones?.filter(Boolean).length && contact.phone && <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{displayPhone(contact.phone)}</span>}
              {contact.phones?.filter(Boolean).length > 2 && <span style={{ fontSize: 11, color: '#bbb' }}>+{contact.phones.filter(Boolean).length - 2}</span>}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {contact.emails?.filter(Boolean).slice(0, 2).map((e, i) => <span key={i} style={{ fontSize: 13, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e}</span>)}
              {!contact.emails?.filter(Boolean).length && contact.email && <span style={{ fontSize: 13, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{contact.email}</span>}
              {contact.emails?.filter(Boolean).length > 2 && <span style={{ fontSize: 11, color: '#bbb' }}>+{contact.emails.filter(Boolean).length - 2}</span>}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {contact.tags.slice(0, 2).map(tag => (
                <span key={tag} style={{ padding: '2px 6px', borderRadius: 6, fontSize: 10, background: 'var(--bg-body)', color: 'var(--text-muted)' }}>{tag}</span>
              ))}
              {contact.tags.length > 2 && <span style={{ fontSize: 10, color: '#bbb' }}>+{contact.tags.length - 2}</span>}
            </div>
            <span
              onClick={() => navigate(`/tasks?contactId=${contact.id}`)}
              style={{ textAlign: 'center', fontSize: 13, fontWeight: 500, color: '#1565c0', cursor: 'pointer' }}
            >{contact._count?.tasks || 0}</span>
            <span
              onClick={() => navigate(`/deals?contactId=${contact.id}`)}
              style={{ textAlign: 'center', fontSize: 13, fontWeight: 500, color: '#2e7d32', cursor: 'pointer' }}
            >{contact._count?.deals || 0}</span>
            <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
              {canEdit && (
                <button onClick={() => openEdit(contact)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 14, padding: 2 }}>✏️</button>
              )}
              {canDelete && (
                <button onClick={() => handleDelete(contact.id)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 14, padding: 2 }}>🗑</button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
        <h2 style={{ margin: 0, fontSize: 18 }}>Контакты</h2>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <input placeholder="Поиск..." value={search} onChange={e => setSearch(e.target.value)} style={{ padding: '6px 12px', borderRadius: 12, border: '1px solid var(--border-color)', fontSize: 14, width: 180 }} />
          <select value={kindFilter} onChange={e => setKindFilter(e.target.value as any)} style={{ padding: '6px 12px', borderRadius: 12, border: '1px solid var(--border-color)', fontSize: 14 }}>
            <option value="all">Все</option>
            <option value="contact">Контакты</option>
            <option value="organization">Организации</option>
          </select>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ padding: '6px 12px', borderRadius: 12, border: '1px solid var(--border-color)', fontSize: 14 }}>
            <option value="createdAtDesc">По дате ↓</option>
            <option value="createdAtAsc">По дате ↑</option>
            <option value="nameAsc">По имени А-Я</option>
            <option value="nameDesc">По имени Я-А</option>
            <option value="type">По типу</option>
          </select>
          {!isMobile && <ViewToggle />}
          {canImport && (
            <button onClick={() => setShowImportModal(true)} style={{ padding: '8px 16px', borderRadius: 12, border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>📥 Импорт</button>
          )}
          <button onClick={openCreate} style={{ padding: '8px 16px', borderRadius: 12, border: 'none', background: '#1a1a1a', color: '#fff', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>+ Создать</button>
        </div>
      </div>

      {selectedIds.size > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', marginBottom: 12, borderRadius: 12, background: '#f0f7ff', border: '1px solid #cce5ff' }}>
          <span style={{ fontSize: 14, fontWeight: 500 }}>Выбрано: {selectedIds.size}</span>
          <button onClick={handleMerge} style={{ padding: '6px 14px', borderRadius: 10, border: 'none', background: '#007AFF', color: '#fff', fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>🔗 Объединить</button>
          <button onClick={() => setSelectedIds(new Set())} style={{ padding: '6px 14px', borderRadius: 10, border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer' }}>Снять выделение</button>
        </div>
      )}

      {isMobile || viewMode === 'cards' ? <CardView /> : <ListView />}

      {hasMore && (
        <div style={{ textAlign: "center", marginTop: 16 }}>
          <button
            onClick={() => loadContacts(false)}
            disabled={loading}
            style={{ padding: "8px 24px", borderRadius: 12, border: "1px solid var(--border-color)", background: "var(--bg-card)", cursor: "pointer", fontSize: 14 }}
          >
            {loading ? "Загрузка..." : `Загрузить еще (${contacts.length} из ${totalCount})`}
          </button>
        </div>
      )}

      {hasMore && (
        <div style={{ textAlign: "center", marginTop: 16 }}>
          <button
            onClick={() => loadContacts(false)}
            disabled={loading}
            style={{ padding: "8px 24px", borderRadius: 12, border: "1px solid var(--border-color)", background: "var(--bg-card)", cursor: "pointer", fontSize: 14 }}
          >
            {loading ? "Загрузка..." : `Загрузить еще (${contacts.length} из ${totalCount})`}
          </button>
        </div>
      )}

      {sortedContacts.length === 0 && (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)', fontSize: 14 }}>Контакты не найдены</div>
      )}

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: 24, width: '100%', maxWidth: 520, maxHeight: '90vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 18 }}>{editingId ? 'Редактировать контакт' : 'Новый контакт'}</h3>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <select value={form.kind} onChange={e => setForm({ ...form, kind: e.target.value as 'contact' | 'organization' })} style={{ padding: 10, borderRadius: 12, border: '1px solid var(--border-color)', fontSize: 14 }}>
                <option value="contact">Контакт (физ. лицо)</option>
                <option value="organization">Организация (юр. лицо)</option>
              </select>

              <input placeholder={form.kind === 'organization' ? 'Название организации' : 'ФИО'} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required style={{ padding: 10, borderRadius: 12, border: '1px solid var(--border-color)', fontSize: 14 }} />

              {form.kind === 'contact' && (
                <>
                  <input placeholder="Должность" value={form.position} onChange={e => setForm({ ...form, position: e.target.value })} style={{ padding: 10, borderRadius: 12, border: '1px solid var(--border-color)', fontSize: 14 }} />
                  <select value={form.organizationId} onChange={e => setForm({ ...form, organizationId: e.target.value })} style={{ padding: 10, borderRadius: 12, border: '1px solid var(--border-color)', fontSize: 14 }}>
                    <option value="">— Без организации —</option>
                    {organizations.map(org => (
                      <option key={org.id} value={org.id}>{org.name}</option>
                    ))}
                  </select>
                </>
              )}

              {form.kind === 'organization' && (
                <>
                  <input placeholder="ИНН" value={form.inn} onChange={e => setForm({ ...form, inn: e.target.value })} style={{ padding: 10, borderRadius: 12, border: '1px solid var(--border-color)', fontSize: 14 }} />
                  <input placeholder="ОГРН" value={form.ogrn} onChange={e => setForm({ ...form, ogrn: e.target.value })} style={{ padding: 10, borderRadius: 12, border: '1px solid var(--border-color)', fontSize: 14 }} />
                  <input placeholder="Юридический адрес" value={form.legalAddress} onChange={e => setForm({ ...form, legalAddress: e.target.value })} style={{ padding: 10, borderRadius: 12, border: '1px solid var(--border-color)', fontSize: 14 }} />
                </>
              )}

              <div>
                <label style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>Телефоны</label>
                {form.phones.map((phone, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <input placeholder="+7 (___) ___-__-__" value={phone} onChange={e => updatePhone(idx, formatPhoneInput(e.target.value))} style={{ flex: 1, padding: 10, borderRadius: 12, border: '1px solid var(--border-color)', fontSize: 14 }} />
                    {form.phones.length > 1 && (
                      <button type="button" onClick={() => removePhone(idx)} style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: '#dc2626', cursor: 'pointer', fontSize: 13 }}>✕</button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={addPhone} style={{ padding: '6px 12px', borderRadius: 10, border: '1px dashed #ccc', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 13 }}>+ Добавить телефон</button>
              </div>

              <div>
                <label style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>Email</label>
                {form.emails.map((email, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <input placeholder="email@example.com" type="email" value={email} onChange={e => updateEmail(idx, e.target.value)} style={{ flex: 1, padding: 10, borderRadius: 12, border: '1px solid var(--border-color)', fontSize: 14 }} />
                    {form.emails.length > 1 && (
                      <button type="button" onClick={() => removeEmail(idx)} style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: '#dc2626', cursor: 'pointer', fontSize: 13 }}>✕</button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={addEmail} style={{ padding: '6px 12px', borderRadius: 10, border: '1px dashed #ccc', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 13 }}>+ Добавить email</button>
              </div>

              <input placeholder="Компания" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} style={{ padding: 10, borderRadius: 12, border: '1px solid var(--border-color)', fontSize: 14 }} />
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as any })} style={{ padding: 10, borderRadius: 12, border: '1px solid var(--border-color)', fontSize: 14 }}>
                {contactTypes.filter(t => t.isActive).sort((a, b) => a.sortOrder - b.sortOrder).map(t => (
                  <option key={t.name} value={t.name}>{t.label}</option>
                ))}
              </select>
              <input placeholder="Теги (через запятую)" value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} style={{ padding: 10, borderRadius: 12, border: '1px solid var(--border-color)', fontSize: 14 }} />
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>Заметки</label>
                <ReactQuill
                  theme="snow"
                  value={form.notes}
                  onChange={(value) => setForm({ ...form, notes: value })}
                  placeholder="Заметки"
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
                />
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '8px 16px', borderRadius: 12, border: '1px solid var(--border-color)', background: 'var(--bg-card)', cursor: 'pointer' }}>Отмена</button>
                <button type="submit" style={{ padding: '8px 16px', borderRadius: 12, border: 'none', background: '#1a1a1a', color: '#fff', cursor: 'pointer' }}>{editingId ? 'Сохранить' : 'Создать'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showMergeModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1001, padding: 16 }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: 24, width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 18 }}>Объединить контакты</h3>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16 }}>
              Выбрано {selectedIds.size} контактов. Выберите основной контакт, в который объединить остальные.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20, maxHeight: 300, overflow: 'auto' }}>
              {sortedContacts.filter(c => selectedIds.has(c.id)).map(contact => (
                <label key={contact.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: 10,
                  borderRadius: 10,
                  border: mergeTargetId === contact.id ? '2px solid #007AFF' : '1px solid #e5e5e5',
                  cursor: 'pointer',
                  background: mergeTargetId === contact.id ? '#f0f7ff' : '#fff',
                }}>
                  <input
                    type="radio"
                    name="mergeTarget"
                    checked={mergeTargetId === contact.id}
                    onChange={() => setMergeTargetId(contact.id)}
                    style={{ width: 18, height: 18 }}
                  />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{contact.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{contact.company || '—'} · {getTypeLabel(contact.type)}</div>
                  </div>
                </label>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowMergeModal(false)} style={{ padding: '8px 16px', borderRadius: 12, border: '1px solid var(--border-color)', background: 'var(--bg-card)', cursor: 'pointer' }}>Отмена</button>
              <button onClick={confirmMerge} style={{ padding: '8px 16px', borderRadius: 12, border: 'none', background: '#1a1a1a', color: '#fff', cursor: 'pointer' }}>Объединить</button>
            </div>
          </div>
        </div>
      )}

      {showImportModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1002, padding: 16 }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: 24, width: '100%', maxWidth: 560, maxHeight: '90vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 18 }}>Импорт контактов</h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
              Поддерживаются файлы vCard (.vcf) из iOS/Android, CSV из Google Contacts и Excel (.xlsx).
            </p>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <button onClick={() => setImportFormat('vcf')} style={{ flex: 1, padding: '8px 12px', borderRadius: 10, border: importFormat === 'vcf' ? '2px solid #007AFF' : '1px solid #e5e5e5', background: importFormat === 'vcf' ? '#f0f7ff' : '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>vCard (.vcf)</button>
              <button onClick={() => setImportFormat('csv')} style={{ flex: 1, padding: '8px 12px', borderRadius: 10, border: importFormat === 'csv' ? '2px solid #007AFF' : '1px solid #e5e5e5', background: importFormat === 'csv' ? '#f0f7ff' : '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>CSV (Google)</button>
              <button onClick={() => setImportFormat('xlsx')} style={{ flex: 1, padding: '8px 12px', borderRadius: 10, border: importFormat === 'xlsx' ? '2px solid #007AFF' : '1px solid #e5e5e5', background: importFormat === 'xlsx' ? '#f0f7ff' : '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>Excel (.xlsx)</button>
            </div>
            <div style={{ marginBottom: 12 }}>
              <input type="file" accept={importFormat === 'vcf' ? '.vcf' : importFormat === 'csv' ? '.csv' : '.xlsx'} onChange={handleFileUpload} style={{ display: 'none' }} id="import-file" />
              <label htmlFor="import-file" style={{ display: 'block', padding: '20px', borderRadius: 12, border: '2px dashed #ccc', textAlign: 'center', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 14 }}>
                📎 Нажмите или перетащите файл {importFormat === 'vcf' ? '.vcf' : importFormat === 'csv' ? '.csv' : '.xlsx'}
              </label>
            </div>
            <textarea
              placeholder={importFormat === 'vcf' ? 'Или вставьте содержимое vCard здесь...' : importFormat === 'csv' ? 'Или вставьте содержимое CSV здесь...' : 'Или вставьте base64 содержимое Excel здесь...'}
              value={importData}
              onChange={e => setImportData(e.target.value)}
              rows={8}
              style={{ width: '100%', padding: 12, borderRadius: 12, border: '1px solid var(--border-color)', fontSize: 13, fontFamily: 'monospace', resize: 'vertical', marginBottom: 12 }}
            />
            {importResult && (
              <div style={{ padding: 10, borderRadius: 10, background: importResult.includes('Ошибка') ? '#fef2f2' : '#f0fdf4', color: importResult.includes('Ошибка') ? '#dc2626' : '#16a34a', fontSize: 13, marginBottom: 12 }}>
                {importResult}
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => { setShowImportModal(false); setImportData(''); setImportResult(''); }} style={{ padding: '8px 16px', borderRadius: 12, border: '1px solid var(--border-color)', background: 'var(--bg-card)', cursor: 'pointer' }}>Отмена</button>
              <button onClick={handleImport} disabled={importing} style={{ padding: '8px 16px', borderRadius: 12, border: 'none', background: '#1a1a1a', color: '#fff', cursor: importing ? 'not-allowed' : 'pointer', opacity: importing ? 0.7 : 1 }}>
                {importing ? 'Импорт...' : 'Импортировать'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
