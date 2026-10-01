import { useEffect, useState, useRef } from 'react';
import { formatPhoneInput, displayPhone } from '../lib/phone';
import { stripHtml } from '../lib/stripHtml';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { api } from '../api/client';
import { useRealtime } from '../hooks/useRealtime';
import { Contact, Project } from '../types';

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
  const [projects, setProjects] = useState<Project[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState('createdAtDesc');
  const [search, setSearch] = useState('');
  // Список разделён на контакты и организации; вкладка «Скрытые» показывает
  // только скрытые типы (спам, рассылка, чёрный список)
  const [kindFilter, setKindFilter] = useState<'contact' | 'organization' | 'all'>(() => {
    const saved = localStorage.getItem('contactsKindFilter');
    return saved === 'organization' || saved === 'all' ? saved : 'contact';
  });
  const [viewMode, setViewMode] = useState<'cards' | 'list'>(() => {
    const saved = localStorage.getItem('contactsViewMode');
    if (saved === 'cards' || saved === 'list') return saved;
    return window.innerWidth <= 768 ? 'cards' : 'list';
  });

  // Колонки списка (десктоп): видимость и ширины сохраняются в localStorage
  const LIST_COLUMNS = [
    { key: 'kind', label: 'Вид', defaultVisible: true, defaultWidth: 110 },
    { key: 'type', label: 'Тип', defaultVisible: true, defaultWidth: 130 },
    { key: 'position', label: 'Должность', defaultVisible: false, defaultWidth: 170 },
    { key: 'organization', label: 'Компания', defaultVisible: false, defaultWidth: 190 },
    { key: 'phones', label: 'Телефоны', defaultVisible: true, defaultWidth: 180 },
    { key: 'emails', label: 'Email', defaultVisible: true, defaultWidth: 220 },
    { key: 'telegram', label: 'Telegram', defaultVisible: false, defaultWidth: 150 },
    { key: 'vk', label: 'ВКонтакте', defaultVisible: false, defaultWidth: 180 },
    { key: 'tags', label: 'Теги', defaultVisible: true, defaultWidth: 180 },
    { key: 'address', label: 'Адрес', defaultVisible: false, defaultWidth: 220 },
    { key: 'birthDate', label: 'Дата рождения', defaultVisible: false, defaultWidth: 140 },
    { key: 'notes', label: 'Заметки', defaultVisible: false, defaultWidth: 220 },
    { key: 'tasks', label: 'Задачи', defaultVisible: true, defaultWidth: 80 },
    { key: 'deals', label: 'Сделки', defaultVisible: true, defaultWidth: 80 },
  ];
  const NAME_COLUMN_KEY = '__name';
  const NAME_COLUMN_WIDTH = 260;
  const [hiddenColumns, setHiddenColumns] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('contactsHiddenColumns');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed.filter((k: string) => LIST_COLUMNS.some(c => c.key === k));
      }
    } catch { }
    return LIST_COLUMNS.filter(c => !c.defaultVisible).map(c => c.key);
  });
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    try {
      const stored = localStorage.getItem('contactsColumnWidths');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === 'object') return parsed;
      }
    } catch { }
    return {};
  });
  const [columnsMenuOpen, setColumnsMenuOpen] = useState(false);
  const resizeRef = useRef<{ key: string; startX: number; startWidth: number } | null>(null);
  const visibleColumns = LIST_COLUMNS.filter(c => !hiddenColumns.includes(c.key));
  const colWidth = (key: string, def: number) => columnWidths[key] || def;
  const nameColWidth = colWidth(NAME_COLUMN_KEY, NAME_COLUMN_WIDTH);
  const gridColsTemplate = ['40px', `${nameColWidth}px`, ...visibleColumns.map(c => `${colWidth(c.key, c.defaultWidth)}px`), '80px'].join(' ');
  const listMinWidth = 40 + nameColWidth + visibleColumns.reduce((sum, c) => sum + colWidth(c.key, c.defaultWidth), 0) + 80 + (visibleColumns.length + 2) * 12;

  const toggleColumn = (key: string) => {
    setHiddenColumns(prev => {
      const next = prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key];
      localStorage.setItem('contactsHiddenColumns', JSON.stringify(next));
      return next;
    });
  };

  const startColumnResize = (e: React.PointerEvent, key: string, defWidth: number) => {
    e.preventDefault();
    e.stopPropagation();
    resizeRef.current = { key, startX: e.clientX, startWidth: colWidth(key, defWidth) };
    const handleMove = (ev: PointerEvent) => {
      const st = resizeRef.current;
      if (!st) return;
      const w = Math.max(60, st.startWidth + ev.clientX - st.startX);
      setColumnWidths(prev => ({ ...prev, [st.key]: w }));
    };
    const handleUp = () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      setColumnWidths(prev => {
        localStorage.setItem('contactsColumnWidths', JSON.stringify(prev));
        return prev;
      });
      resizeRef.current = null;
    };
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
  };

  const ResizeHandle = ({ colKey, defWidth }: { colKey: string; defWidth: number }) => (
    <span
      onPointerDown={(e) => startColumnResize(e, colKey, defWidth)}
      style={{ position: 'absolute', top: 0, right: -6, width: 10, height: '100%', cursor: 'col-resize', zIndex: 2 }}
    />
  );

  const renderListColumn = (contact: Contact, key: string) => {
    const tc = getTypeColor(contact.type);
    const ellipsis: React.CSSProperties = { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' };
    switch (key) {
      case 'kind': {
        const kc = kindColors[contact.kind] || { bg: '#f5f5f5', text: '#999' };
        return <span style={{ padding: '3px 10px', borderRadius: 10, fontSize: 11, fontWeight: 500, background: kc.bg, color: kc.text, justifySelf: 'start' }}>{kindLabels[contact.kind] || contact.kind}</span>;
      }
      case 'type':
        return <span style={{ padding: '3px 10px', borderRadius: 10, fontSize: 11, fontWeight: 500, background: tc.bg, color: tc.text, justifySelf: 'start' }}>{getTypeLabel(contact.type)}</span>;
      case 'position':
        return <span style={{ fontSize: 13, color: 'var(--text-secondary)', ...ellipsis }}>{contact.position || '—'}</span>;
      case 'organization':
        return <span style={{ fontSize: 13, color: 'var(--text-secondary)', ...ellipsis }}>{contact.organization?.name || '—'}</span>;
      case 'phones':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {(contact.phones || []).filter(Boolean).slice(0, 2).map((p, i) => <span key={i} style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{displayPhone(p)}</span>)}
            {!(contact.phones || []).filter(Boolean).length && contact.phone && <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{displayPhone(contact.phone)}</span>}
            {(contact.phones || []).filter(Boolean).length > 2 && <span style={{ fontSize: 11, color: '#bbb' }}>+{(contact.phones || []).filter(Boolean).length - 2}</span>}
          </div>
        );
      case 'emails':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {(contact.emails || []).slice(0, 2).map((em, i) => <span key={i} style={{ fontSize: 13, color: 'var(--text-secondary)', ...ellipsis }}>{em}</span>)}
            {!contact.emails?.length && contact.email && <span style={{ fontSize: 13, color: 'var(--text-secondary)', ...ellipsis }}>{contact.email}</span>}
            {(contact.emails || []).length > 2 && <span style={{ fontSize: 11, color: '#bbb' }}>+{contact.emails.length - 2}</span>}
          </div>
        );
      case 'telegram':
        return contact.telegramUsername
          ? <a href={`https://t.me/${contact.telegramUsername}`} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: '#1565c0', textDecoration: 'none', ...ellipsis, display: 'block' }}>@{contact.telegramUsername}</a>
          : <span style={{ fontSize: 13, color: '#bbb' }}>—</span>;
      case 'vk': {
        const vkUrl = contact.vkProfileUrl;
        const vkLabel = vkUrl ? vkUrl.replace(/^https?:\/\/(www\.)?vk\.com\//, '') : '';
        return vkUrl
          ? <a href={vkUrl} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: '#1565c0', textDecoration: 'none', ...ellipsis, display: 'block' }}>{vkLabel || vkUrl}</a>
          : <span style={{ fontSize: 13, color: '#bbb' }}>—</span>;
      }
      case 'tags':
        return (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {(contact.tags || []).slice(0, 2).map(tag => (
              <span key={tag} style={{ padding: '2px 8px', borderRadius: 10, fontSize: 11, background: '#f0f0f0', color: 'var(--text-secondary)' }}>{tag}</span>
            ))}
            {(contact.tags || []).length > 2 && <span style={{ fontSize: 11, color: '#bbb' }}>+{contact.tags.length - 2}</span>}
          </div>
        );
      case 'address':
        return <span style={{ fontSize: 13, color: 'var(--text-secondary)', ...ellipsis }}>{contact.address || '—'}</span>;
      case 'birthDate':
        return <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{contact.birthDate ? new Date(contact.birthDate).toLocaleDateString('ru-RU', { timeZone: 'UTC', day: 'numeric', month: 'long', year: 'numeric' }) : '—'}</span>;
      case 'notes':
        return <span style={{ fontSize: 13, color: 'var(--text-secondary)', ...ellipsis }} title={contact.notes ? stripHtml(contact.notes) : ''}>{contact.notes ? stripHtml(contact.notes).slice(0, 80) : '—'}</span>;
      case 'tasks':
        return <span onClick={() => navigate(`/tasks?contactId=${contact.id}`)} style={{ textAlign: 'center', fontSize: 13, fontWeight: 500, color: '#1565c0', cursor: 'pointer' }}>{contact._count?.tasks || 0}</span>;
      case 'deals':
        return <span onClick={() => navigate(`/deals?contactId=${contact.id}`)} style={{ textAlign: 'center', fontSize: 13, fontWeight: 500, color: '#2e7d32', cursor: 'pointer' }}>{contact._count?.deals || 0}</span>;
      default:
        return null;
    }
  };

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const PAGE_SIZE = 50;
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [mergeTargetId, setMergeTargetId] = useState<string>('');
  const [showKindModal, setShowKindModal] = useState(false);
  const [bulkKind, setBulkKind] = useState<'contact' | 'organization'>('contact');
  const [changingKind, setChangingKind] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateContacts, setDuplicateContacts] = useState<any[]>([]);
  const [duplicateTargetId, setDuplicateTargetId] = useState<string>('');
  const [pendingCreateData, setPendingCreateData] = useState<any>(null);
  const [duplicateSaving, setDuplicateSaving] = useState(false);
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
  const [allTags, setAllTags] = useState<string[]>([]);
  const [selectedTag, setSelectedTag] = useState<string>('');

  useEffect(() => {
    loadContactTypes();
    loadAllTags();
  }, []);

  const loadAllTags = async () => {
    try {
      const data = await api.contacts.list('limit=9999');
      const contactsArray = Array.isArray(data) ? data : ((data as any).contacts || []);
      const tags = new Set<string>();
      contactsArray.forEach((c: Contact) => c.tags?.forEach((t: string) => tags.add(t)));
      setAllTags(Array.from(tags).sort());
    } catch (err) {
      console.error('Failed to load tags:', err);
    }
  };

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
    type: 'client' as const,
    kind: 'contact' as 'contact' | 'organization',
    tags: '',
    notes: '',
    inn: '',
    ogrn: '',
    legalAddress: '',
    position: '',
    birthDate: '',
    address: '',
    telegramUsername: '',
    organizationId: '',
    projectIds: [] as string[],
  });

  useEffect(() => {
    loadContacts(true);
    loadOrganizations();
    api.projects.list('flat=true').then(setProjects);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadContacts(true);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const loadContacts = async (reset = false) => {
    const params = new URLSearchParams();
    if (kindFilter === 'all') {
      // Вкладка «Скрытые»: только скрытые типы (спам, рассылка, чёрный список)
      params.set('onlyHidden', '1');
    } else {
      params.set('kind', kindFilter);
    }
    if (selectedTag) params.set('tag', selectedTag);
    const searching = search.trim().length > 0;
    if (searching) {
      // При поиске загружаем все совпадения целиком (клиентский фильтр ищет по тегам, сервер — нет)
      params.set('search', search.trim());
      setLoading(true);
      try {
        const data: any = await api.contacts.list(params.toString());
        setContacts(Array.isArray(data) ? data : data.contacts);
        setTotalCount(0);
        setPage(1);
        setHasMore(false);
      } finally {
        setLoading(false);
      }
      return;
    }
    const nextPage = reset ? 1 : page + 1;
    params.set('page', String(nextPage));
    params.set('limit', String(PAGE_SIZE));
    setLoading(true);
    try {
      const data: any = await api.contacts.list(params.toString());
      const list: Contact[] = Array.isArray(data) ? data : data.contacts;
      const total: number = Array.isArray(data) ? list.length : data.totalCount;
      setContacts(prev => reset ? list : [...prev, ...list.filter(c => !prev.some(p => p.id === c.id))]);
      setTotalCount(total);
      setPage(nextPage);
      setHasMore(nextPage * PAGE_SIZE < total);
    } finally {
      setLoading(false);
    }
  };

  const loadOrganizations = () => {
    api.contacts.list('kind=organization').then(setOrganizations);
  };

  useEffect(() => {
    loadContacts(true);
  }, [kindFilter, selectedTag]);

  useEffect(() => {
    const editingId = location.state?.editingId;
    if (!editingId) return;
    const contact = contacts.find(c => c.id === editingId);
    if (contact) {
      openEdit(contact);
    } else {
      // контакт может быть не загружен (пагинация/фильтры) — подгружаем напрямую
      api.contacts.get(editingId).then(openEdit).catch(() => {});
    }
    navigate(location.pathname, { replace: true });
  }, [contacts, location.state]);

  useRealtime(["contacts"], (data) => {
    if (data.entity === "contact") {
      loadContacts(true);
      loadOrganizations();
    }
  });

  const openCreate = () => {
    setEditingId(null);
    setForm({
      name: '', emails: [''], phones: [''], type: 'client', kind: kindFilter === 'organization' ? 'organization' : 'contact',
      tags: '', notes: '', inn: '', ogrn: '', legalAddress: '', position: '', birthDate: '', address: '', telegramUsername: '', organizationId: '',
      projectIds: [],
    });
    setShowModal(true);
  };

  const openEdit = (contact: Contact) => {
    setEditingId(contact.id);
    setForm({
      name: contact.name,
      emails: contact.emails?.length ? contact.emails : contact.email ? [contact.email] : [''],
      phones: contact.phones?.length ? contact.phones : contact.phone ? [contact.phone] : [''],
      type: contact.type as any,
      kind: contact.kind as 'contact' | 'organization',
      tags: contact.tags.join(', '),
      notes: contact.notes || '',
      inn: contact.inn || '',
      ogrn: contact.ogrn || '',
      legalAddress: contact.legalAddress || '',
      position: contact.position || '',
      birthDate: contact.birthDate ? contact.birthDate.slice(0, 10) : '',
      address: contact.address || '',
      telegramUsername: contact.telegramUsername || '',
      organizationId: contact.organizationId || '',
      projectIds: contact.projects?.map(p => p.project.id) || [],
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
      projectIds: form.projectIds,
    };
    if (form.kind === 'organization') {
      data.position = null;
      data.birthDate = null;
      data.address = null;
      data.telegramUsername = null;
      data.organizationId = null;
    } else {
      data.inn = null;
      data.ogrn = null;
      data.legalAddress = null;
      data.birthDate = form.birthDate || null;
      data.address = form.address || null;
      data.telegramUsername = form.telegramUsername || null;
    }
    if (editingId) {
      await api.contacts.update(editingId, data);
    } else {
      const check = await api.contacts.checkDuplicates(data);
      if (check.duplicates?.length) {
        setPendingCreateData(data);
        setDuplicateContacts(check.duplicates);
        setDuplicateTargetId(check.duplicates[0].id);
        setShowDuplicateModal(true);
        return;
      }
      await api.contacts.create(data);
    }
    setShowModal(false);
    loadContacts(true);
  };

  const confirmMergeDuplicate = async () => {
    if (!pendingCreateData || !duplicateTargetId) return;
    setDuplicateSaving(true);
    try {
      await api.contacts.mergeNew(duplicateTargetId, pendingCreateData);
      setShowDuplicateModal(false);
      setShowModal(false);
      setPendingCreateData(null);
      loadContacts(true);
    } catch (err: any) {
      alert('Ошибка: ' + (err.message || 'Не удалось объединить контакты'));
    } finally {
      setDuplicateSaving(false);
    }
  };

  const createDespiteDuplicates = async () => {
    if (!pendingCreateData) return;
    setDuplicateSaving(true);
    try {
      await api.contacts.create(pendingCreateData);
      setShowDuplicateModal(false);
      setShowModal(false);
      setPendingCreateData(null);
      loadContacts(true);
    } catch (err: any) {
      alert('Ошибка: ' + (err.message || 'Не удалось создать контакт'));
    } finally {
      setDuplicateSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить контакт?')) return;
    await api.contacts.delete(id);
    loadContacts(true);
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

  // Массовая смена типа выбранных карточек: контакт <-> организация
  const handleBulkChangeKind = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    setChangingKind(true);
    try {
      const res = await api.contacts.changeKind(ids, bulkKind);
      alert(`Тип изменён для ${res.updated} карточек`);
      setShowKindModal(false);
      setSelectedIds(new Set());
      loadContacts(true);
    } catch (err: any) {
      alert('Ошибка: ' + err.message);
    } finally {
      setChangingKind(false);
    }
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
      loadContacts(true);
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
      loadContacts(true);
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

  // Переключатель «Контакты / Организации» в стиле переключателя вида (карточки/список)
  const KindToggle = () => {
    const btnStyle = (active: boolean) => ({
      padding: '6px 10px',
      borderRadius: 8,
      border: 'none',
      background: active ? '#fff' : 'transparent',
      color: active ? '#1a1a1a' : '#999',
      fontSize: 13,
      cursor: 'pointer',
      fontWeight: 500,
      boxShadow: active ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
    });
    const select = (kind: 'contact' | 'organization' | 'all') => {
      setKindFilter(kind);
      localStorage.setItem('contactsKindFilter', kind);
    };
    return (
      <div style={{ display: 'flex', gap: 2, padding: 2, borderRadius: 10, background: 'var(--bg-body)', border: '1px solid var(--border-color)' }}>
        <button onClick={() => select('contact')} style={btnStyle(kindFilter === 'contact')}>👤 Контакты</button>
        <button onClick={() => select('organization')} style={btnStyle(kindFilter === 'organization')}>🏢 Организации</button>
        <button onClick={() => select('all')} style={btnStyle(kindFilter === 'all')}>🙈 Скрытые</button>
      </div>
    );
  };

  const ViewToggle = () => (
    <div style={{ display: 'flex', gap: 2, padding: 2, borderRadius: 10, background: 'var(--bg-body)', border: '1px solid var(--border-color)' }}>
      <button onClick={() => { setViewMode('cards'); localStorage.setItem('contactsViewMode', 'cards'); }} style={{ padding: '6px 10px', borderRadius: 8, border: 'none', background: viewMode === 'cards' ? '#fff' : 'transparent', color: viewMode === 'cards' ? '#1a1a1a' : '#999', fontSize: 13, cursor: 'pointer', fontWeight: 500, boxShadow: viewMode === 'cards' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>⊞ Карточки</button>
      <button onClick={() => { setViewMode('list'); localStorage.setItem('contactsViewMode', 'list'); }} style={{ padding: '6px 10px', borderRadius: 8, border: 'none', background: viewMode === 'list' ? '#fff' : 'transparent', color: viewMode === 'list' ? '#1a1a1a' : '#999', fontSize: 13, cursor: 'pointer', fontWeight: 500, boxShadow: viewMode === 'list' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>☰ Список</button>
    </div>
  );

  // Подзаголовок карточки: привязанная организация (или текстовое поле «Компания») + должность
  const contactSubtitle = (contact: Contact) => {
    const parts = [contact.organization?.name || '', contact.position || ''].filter(Boolean);
    return parts.join(' · ') || '—';
  };

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
                <div style={{ fontSize: 12, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{contactSubtitle(contact)}</div>
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
              {contact.telegramUsername && <span>✈️ @{contact.telegramUsername}</span>}
              {contact.inn && <span>🆔 ИНН: {contact.inn}</span>}
              {contact.description && <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>📝 {contact.description}</span>}
              {contact.lastActivityTime && <span style={{ color: '#999', fontSize: 11 }}>⏱️ {new Date(contact.lastActivityTime).toLocaleString('ru-RU')}</span>}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: 8, borderTop: '1px solid #f0f0f0' }}>
              <span style={{ fontSize: 11, color: '#bbb' }}>{new Date(contact.createdAt).toLocaleDateString('ru')}</span>
              <div style={{ display: 'flex', gap: 8 }}>
                {canEdit && (
                  <button
                    onClick={e => { e.stopPropagation(); openEdit(contact); }}
                    title="Изменить"
                    style={{width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-card)', cursor: 'pointer', color: 'var(--text-color)'}}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /></svg>
                  </button>
                )}
                {canDelete && (
                  <button
                    onClick={e => { e.stopPropagation(); handleDelete(contact.id); }}
                    title="Удалить"
                    style={{width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-card)', cursor: 'pointer', color: '#dc2626'}}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                  </button>
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
      <div style={{ overflowX: 'auto' }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: gridColsTemplate,
        gap: 12,
        padding: '12px 16px',
        background: 'var(--bg-input)',
        fontSize: 12,
        fontWeight: 600,
        color: 'var(--text-muted)',
        borderBottom: '1px solid var(--border-color)',
        alignItems: 'center',
        minWidth: listMinWidth,
      }}>
        <input type="checkbox" checked={selectedIds.size === sortedContacts.length && sortedContacts.length > 0} onChange={selectAll} style={{ width: 18, height: 18 }} />
        <span style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          Имя / Компания
          <ResizeHandle colKey={NAME_COLUMN_KEY} defWidth={NAME_COLUMN_WIDTH} />
        </span>
        {visibleColumns.map(c => (
          <span
            key={c.key}
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              ...(c.key === 'tasks' || c.key === 'deals' ? { justifyContent: 'center' } : {}),
            }}
          >
            {c.label}
            <ResizeHandle colKey={c.key} defWidth={c.defaultWidth} />
          </span>
        ))}
        <span></span>
      </div>
      {sortedContacts.map((contact, idx) => {
        const tc = getTypeColor(contact.type);
        const isSelected = selectedIds.has(contact.id);
        return (
          <div key={contact.id} style={{
            display: 'grid',
            gridTemplateColumns: gridColsTemplate,
            gap: 12,
            padding: '12px 16px',
            alignItems: 'center',
            borderBottom: idx < sortedContacts.length - 1 ? '1px solid #f0f0f0' : 'none',
            transition: 'background 0.15s',
            background: isSelected ? '#f0f7ff' : 'transparent',
            minWidth: listMinWidth,
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
                <div style={{ fontSize: 12, color: '#bbb', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{contactSubtitle(contact)}</div>
              </div>
            </div>
            {visibleColumns.map(c => (
              <div key={c.key} style={{ minWidth: 0 }}>{renderListColumn(contact, c.key)}</div>
            ))}
            <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
              {canEdit && (
                <button
                  onClick={() => openEdit(contact)}
                  title="Изменить"
                  style={{width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-card)', cursor: 'pointer', color: 'var(--text-color)'}}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /></svg>
                </button>
              )}
              {canDelete && (
                <button
                  onClick={() => handleDelete(contact.id)}
                  title="Удалить"
                  style={{width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-card)', cursor: 'pointer', color: '#dc2626'}}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                </button>
              )}
            </div>
          </div>
        );
      })}
      </div>
    </div>
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
        <h2 style={{ margin: 0, fontSize: 18 }}>Контакты</h2>
        <button className="btn-action" onClick={openCreate} title="Создать контакт">+</button>
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
          <input placeholder="Поиск..." value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1, minWidth: 220, padding: '8px 14px', borderRadius: 12, border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-color)', fontSize: 14, outline: 'none' }} />
          <KindToggle />
          <select value={selectedTag} onChange={e => setSelectedTag(e.target.value)} style={{ padding: '6px 12px', borderRadius: 12, border: '1px solid var(--border-color)', fontSize: 14 }}>
            <option value="">Все теги</option>
            {allTags.map(tag => <option key={tag} value={tag}>{tag}</option>)}
          </select>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ padding: '6px 12px', borderRadius: 12, border: '1px solid var(--border-color)', fontSize: 14 }}>
            <option value="createdAtDesc">По дате ↓</option>
            <option value="createdAtAsc">По дате ↑</option>
            <option value="nameAsc">По имени А-Я</option>
            <option value="nameDesc">По имени Я-А</option>
            <option value="type">По типу</option>
          </select>
          {!isMobile && <ViewToggle />}
          {!isMobile && viewMode === 'list' && (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setColumnsMenuOpen(o => !o)}
                title="Настройки колонок"
                style={{ background: columnsMenuOpen ? 'var(--bg-input)' : 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 12, padding: '7px 9px', cursor: 'pointer', color: columnsMenuOpen ? 'var(--text-primary)' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                </svg>
              </button>
              {columnsMenuOpen && (
                <>
                  <div style={{ position: 'fixed', inset: 0, zIndex: 5 }} onClick={() => setColumnsMenuOpen(false)} />
                  <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 6px)', zIndex: 6, background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 12, boxShadow: 'var(--shadow)', minWidth: 190, padding: 6 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', padding: '6px 8px 4px' }}>Колонки списка</div>
                    {LIST_COLUMNS.map(c => (
                      <label key={c.key} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 400, color: 'var(--text-primary)' }}>
                        <input type="checkbox" checked={!hiddenColumns.includes(c.key)} onChange={() => toggleColumn(c.key)} />
                        {c.label}
                      </label>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

      {selectedIds.size > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', marginBottom: 12, borderRadius: 12, background: '#f0f7ff', border: '1px solid #cce5ff' }}>
          <span style={{ fontSize: 14, fontWeight: 500 }}>Выбрано: {selectedIds.size}</span>
          <button onClick={handleMerge} style={{ padding: '6px 14px', borderRadius: 10, border: 'none', background: '#007AFF', color: '#fff', fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>🔗 Объединить</button>
          {canEdit && (
            <button onClick={() => setShowKindModal(true)} style={{ padding: '6px 14px', borderRadius: 10, border: 'none', background: '#007AFF', color: '#fff', fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>🔄 Сменить тип</button>
          )}
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

      {sortedContacts.length === 0 && (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)', fontSize: 14 }}>Контакты не найдены</div>
      )}

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 'max(16px, env(safe-area-inset-top, 0)) max(16px, env(safe-area-inset-right, 0)) max(16px, env(safe-area-inset-bottom, 0)) max(16px, env(safe-area-inset-left, 0))' }}>
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
                  <div>
                    <label style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>Дата рождения</label>
                    <input type="date" value={form.birthDate} onChange={e => setForm({ ...form, birthDate: e.target.value })} style={{ padding: 10, borderRadius: 12, border: '1px solid var(--border-color)', fontSize: 14, width: '100%', boxSizing: 'border-box' }} />
                  </div>
                  <input placeholder="Адрес" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} style={{ padding: 10, borderRadius: 12, border: '1px solid var(--border-color)', fontSize: 14 }} />
                  <input placeholder="Telegram (без @)" value={form.telegramUsername} onChange={e => setForm({ ...form, telegramUsername: e.target.value })} style={{ padding: 10, borderRadius: 12, border: '1px solid var(--border-color)', fontSize: 14 }} />
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

              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as any })} style={{ padding: 10, borderRadius: 12, border: '1px solid var(--border-color)', fontSize: 14 }}>
                {contactTypes.filter(t => t.isActive).sort((a, b) => a.sortOrder - b.sortOrder).map(t => (
                  <option key={t.name} value={t.name}>{t.label}</option>
                ))}
              </select>
              <input placeholder="Теги (через запятую)" value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} style={{ padding: 10, borderRadius: 12, border: '1px solid var(--border-color)', fontSize: 14 }} />
              <div>
                <label style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>Проекты</label>
                <select
                  multiple
                  value={form.projectIds}
                  onChange={e => {
                    const options = Array.from(e.target.selectedOptions).map(o => o.value);
                    setForm({ ...form, projectIds: options });
                  }}
                  style={{ padding: 10, borderRadius: 12, border: '1px solid var(--border-color)', fontSize: 14, width: '100%', minHeight: 80 }}
                >
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
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
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1001, padding: 'max(16px, env(safe-area-inset-top, 0)) max(16px, env(safe-area-inset-right, 0)) max(16px, env(safe-area-inset-bottom, 0)) max(16px, env(safe-area-inset-left, 0))' }}>
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
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{contactSubtitle(contact)} · {getTypeLabel(contact.type)}</div>
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

      {showKindModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1001, padding: 'max(16px, env(safe-area-inset-top, 0)) max(16px, env(safe-area-inset-right, 0)) max(16px, env(safe-area-inset-bottom, 0)) max(16px, env(safe-area-inset-left, 0))' }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: 24, width: '100%', maxWidth: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 18 }}>Сменить тип карточек</h3>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16 }}>
              Выбрано {selectedIds.size} карточек. Выберите новый тип.
            </p>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <button onClick={() => setBulkKind('contact')} style={{ flex: 1, padding: '12px', borderRadius: 10, border: bulkKind === 'contact' ? '2px solid #007AFF' : '1px solid #e5e5e5', background: bulkKind === 'contact' ? '#f0f7ff' : '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 500 }}>👤 Контакт</button>
              <button onClick={() => setBulkKind('organization')} style={{ flex: 1, padding: '12px', borderRadius: 10, border: bulkKind === 'organization' ? '2px solid #007AFF' : '1px solid #e5e5e5', background: bulkKind === 'organization' ? '#f0f7ff' : '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 500 }}>🏢 Организация</button>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 20 }}>
              {bulkKind === 'organization'
                ? 'У карточек будет очищена должность и отвязана родительская организация.'
                : 'У карточек будут очищены ИНН, ОГРН и юридический адрес.'}
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowKindModal(false)} disabled={changingKind} style={{ padding: '8px 16px', borderRadius: 12, border: '1px solid var(--border-color)', background: 'var(--bg-card)', cursor: 'pointer' }}>Отмена</button>
              <button onClick={handleBulkChangeKind} disabled={changingKind} style={{ padding: '8px 16px', borderRadius: 12, border: 'none', background: '#1a1a1a', color: '#fff', cursor: changingKind ? 'not-allowed' : 'pointer', opacity: changingKind ? 0.7 : 1 }}>
                {changingKind ? 'Сохранение...' : 'Применить'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDuplicateModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1003, padding: 'max(16px, env(safe-area-inset-top, 0)) max(16px, env(safe-area-inset-right, 0)) max(16px, env(safe-area-inset-bottom, 0)) max(16px, env(safe-area-inset-left, 0))' }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: 24, width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 18 }}>Контакт уже существует</h3>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16 }}>
              Найдены совпадения по имени, телефону или email. Выберите основной контакт для объединения или создайте новый.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20, maxHeight: 300, overflow: 'auto' }}>
              {duplicateContacts.map(contact => (
                <label key={contact.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: 10, borderRadius: 10,
                  border: duplicateTargetId === contact.id ? '2px solid #007AFF' : '1px solid #e5e5e5',
                  cursor: 'pointer', background: duplicateTargetId === contact.id ? '#f0f7ff' : '#fff',
                }}>
                  <input
                    type="radio"
                    name="duplicateTarget"
                    checked={duplicateTargetId === contact.id}
                    onChange={() => setDuplicateTargetId(contact.id)}
                    style={{ width: 18, height: 18 }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{contact.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {contact.phone || '—'} · {contact.email || '—'} · задач: {contact.tasks}, сделок: {contact.deals}
                    </div>
                  </div>
                </label>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowDuplicateModal(false)} disabled={duplicateSaving} style={{ padding: '8px 16px', borderRadius: 12, border: '1px solid var(--border-color)', background: 'var(--bg-card)', cursor: 'pointer' }}>Отмена</button>
              <button onClick={createDespiteDuplicates} disabled={duplicateSaving} style={{ padding: '8px 16px', borderRadius: 12, border: '1px solid var(--border-color)', background: 'var(--bg-card)', cursor: 'pointer' }}>Создать новый</button>
              <button onClick={confirmMergeDuplicate} disabled={duplicateSaving} style={{ padding: '8px 16px', borderRadius: 12, border: 'none', background: '#1a1a1a', color: '#fff', cursor: 'pointer' }}>{duplicateSaving ? 'Сохранение...' : 'Объединить'}</button>
            </div>
          </div>
        </div>
      )}

      {showImportModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1002, padding: 'max(16px, env(safe-area-inset-top, 0)) max(16px, env(safe-area-inset-right, 0)) max(16px, env(safe-area-inset-bottom, 0)) max(16px, env(safe-area-inset-left, 0))' }}>
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
