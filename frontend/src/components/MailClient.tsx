import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../api/client';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

/**
 * Почтовый клиент (страница /mail, доступ только у админов).
 * Классический трёхпанельный интерфейс: дерево папок / список писем с тулбаром /
 * область чтения + статусная строка. Аккаунты почты настраиваются по шестерёнке:
 * у каждого пользователя свои аккаунты, аккаунтов может быть несколько.
 */

interface MailAccount {
  id: string;
  label: string;
  email: string;
  imapHost: string;
  imapPort: number;
  imapUser: string;
  hasImapPassword: boolean;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  hasSmtpPassword: boolean;
  secure: boolean;
  rejectUnauthorized: boolean;
  isDefault: boolean;
}

interface MailFolder {
  path: string;
  name: string;
  specialUse: string | null;
  unseen: number;
  total: number;
  children: MailFolder[];
}

interface MailMessageItem {
  uid: number;
  subject: string;
  from: string;
  fromName: string;
  date: string | null;
  seen: boolean;
  hasAttachments: boolean;
  size: number;
}

interface MailAttachmentMeta {
  index: number;
  filename: string;
  contentType: string;
  size: number;
}

interface MailMessageFull {
  uid: number;
  subject: string;
  from: string;
  to: string;
  cc: string;
  date: string | null;
  html: string | null;
  text: string | null;
  messageId: string | null;
  attachments: MailAttachmentMeta[];
}

const EMPTY_ACCOUNT_FORM = {
  label: '',
  email: '',
  imapHost: '',
  imapPort: 993,
  imapUser: '',
  imapPass: '',
  smtpHost: '',
  smtpPort: 465,
  smtpUser: '',
  smtpPass: '',
  secure: true,
  rejectUnauthorized: false,
  isDefault: false,
};

const quillModules = {
  toolbar: [
    ['bold', 'italic', 'underline', 'strike'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    [{ color: [] }, { background: [] }],
    ['link'],
    ['clean'],
  ],
};
const quillFormats = ['bold', 'italic', 'underline', 'strike', 'list', 'bullet', 'color', 'background', 'link'];

function formatMailDate(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  const time = d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  if (sameDay) return time;
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined }) + ' ' + time;
}

function formatSize(bytes: number): string {
  if (!bytes) return '0 KB';
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Запрос с таймаутом: интерфейс не висит в «Загрузка…», если сервер недоступен
function withTimeout<T>(make: (signal: AbortSignal) => Promise<T>, ms = 45000): Promise<T> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  return make(ctrl.signal).finally(() => clearTimeout(t));
}

const iconBtnStyle: React.CSSProperties = {
  width: 34, height: 34, borderRadius: 9, border: 'none', cursor: 'pointer',
  background: 'transparent', color: 'var(--text-primary)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 10px', borderRadius: 9, fontSize: 13,
  border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)',
  boxSizing: 'border-box', outline: 'none',
};

// SVG-иконки (stroke, 24x24)
const ICONS: Record<string, string> = {
  inbox: 'M22 12h-6l-2 3h-4l-2-3H2 M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z',
  send: 'M22 2L11 13 M22 2l-7 20-4-9-9-4 20-7z',
  file: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6',
  archive: 'M21 8v13H3V8 M1 3h22v5H1z M10 12h4',
  spam: 'M12 9v3 M12 16h.01 M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z',
  trash: 'M3 6h18 M8 6V4a1 1 0 011-1h6a1 1 0 011 1v2m2 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6 M10 11v6 M14 11v6',
  folder: 'M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z',
  mail: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  search: 'M11 19a8 8 0 100-16 8 8 0 000 16z M21 21l-4.35-4.35',
  print: 'M6 9V2h12v7 M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2 M6 14h12v8H6z',
  reply: 'M9 14L4 9l5-5 M4 9h10.5a5.5 5.5 0 015.5 5.5v3',
  forward: 'M15 14l5-5-5-5 M20 9H9.5A5.5 5.5 0 004 14.5V17',
  prev: 'M15 18l-6-6 6-6',
  next: 'M9 18l6-6-6-6',
  refresh: 'M4 4v5h5 M20 20v-5h-5 M5.5 9A7.5 7.5 0 0119 7.5M18.5 15A7.5 7.5 0 015 16.5',
  check: 'M20 6L9 17l-5-5',
  spamShield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z M4.5 9.5L12 13l7.5-3.5',
};

function Icon({ name, size = 16, color }: { name: string; size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox='0 0 24 24' fill='none' stroke={color || 'currentColor'} strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
      <path d={ICONS[name] || ICONS.folder} />
    </svg>
  );
}

export function MailClient() {
  const [accounts, setAccounts] = useState<MailAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>(() => localStorage.getItem('mailAccountId') || '');
  const [folders, setFolders] = useState<MailFolder[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string>('INBOX');
  const [messages, setMessages] = useState<MailMessageItem[]>([]);
  const [totalMessages, setTotalMessages] = useState(0);
  const [page, setPage] = useState(1);
  const [openMessage, setOpenMessage] = useState<MailMessageFull | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(false);
  const [error, setError] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  // Поиск (searchInput — поле, searchQ — применённый запрос с дебаунсом)
  const [searchInput, setSearchInput] = useState('');
  const [searchQ, setSearchQ] = useState('');
  // Сортировка списка (клиентская, в пределах загруженной страницы)
  const [sortField, setSortField] = useState<'date' | 'sender' | 'subject' | 'size'>('date');
  const [sortAsc, setSortAsc] = useState(false);

  const [showSettings, setShowSettings] = useState(false);
  const [showCompose, setShowCompose] = useState(false);
  // Свёрнутые ветви дерева папок (path → скрыть детей)
  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(new Set());
  // Множественный выбор писем (uid → выбрано)
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const account: MailAccount | undefined = accounts.find(a => a.id === selectedAccountId);

  // Локализованное название системных папок (используется в дереве, списках и выборе назначения)
  const folderLabel = (f: MailFolder) =>
    f.specialUse === '\\Sent' ? 'Отправленные' :
    f.specialUse === '\\Trash' ? 'Корзина' :
    f.specialUse === '\\Drafts' ? 'Черновики' :
    f.specialUse === '\\Junk' ? 'Спам' :
    /^INBOX$/i.test(f.path) ? 'Входящие' : f.name;

  const folderIconName = (f: MailFolder) =>
    f.specialUse === '\\Sent' ? 'send' :
    f.specialUse === '\\Trash' ? 'trash' :
    f.specialUse === '\\Drafts' ? 'file' :
    f.specialUse === '\\Junk' ? 'spamShield' :
    /^INBOX$/i.test(f.path) ? 'inbox' : 'folder';

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const loadAccounts = async () => {
    try {
      const data = await api.mail.accounts();
      setAccounts(data || []);
      setSelectedAccountId(prev => {
        const list = data || [];
        if (prev && list.some((a: MailAccount) => a.id === prev)) return prev;
        const def = list.find((a: MailAccount) => a.isDefault) || list[0];
        return def ? def.id : '';
      });
    } catch (e: any) {
      setError(e.message || 'Не удалось загрузить аккаунты');
    }
  };

  useEffect(() => { loadAccounts(); }, []);

  useEffect(() => {
    if (selectedAccountId) localStorage.setItem('mailAccountId', selectedAccountId);
  }, [selectedAccountId]);

  const loadFolders = async () => {
    if (!selectedAccountId) return;
    try {
      const data = await withTimeout(signal => api.mail.folders(selectedAccountId, signal));
      setFolders(data || []);
    } catch (e: any) {
      setError(e.name === 'AbortError' ? 'Сервер не отвечает (превышено время ожидания)' : (e.message || 'Не удалось загрузить папки'));
    }
  };

  const loadSeq = useRef(0);
  const loadMessages = async (p: number) => {
    if (!selectedAccountId) return;
    const seq = ++loadSeq.current;
    setLoading(true);
    setError('');
    try {
      const data = await withTimeout(signal => api.mail.messages(selectedAccountId, selectedFolder, p, signal, searchQ || undefined));
      if (seq !== loadSeq.current) return; // ответ устарел — пользователь уже переключил папку
      setMessages(data.messages || []);
      setTotalMessages(data.total || 0);
      setPage(p);
    } catch (e: any) {
      if (seq !== loadSeq.current) return;
      setError(e.name === 'AbortError' ? 'Сервер не отвечает (превышено время ожидания)' : (e.message || 'Не удалось загрузить письма'));
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setOpenMessage(null);
    setMessages([]);
    setTotalMessages(0);
    setPage(1);
    setSelected(new Set());
    loadFolders();
    loadMessages(1);
  }, [selectedAccountId, selectedFolder]);

  // Дебаунс поиска
  useEffect(() => {
    const t = setTimeout(() => {
      if (searchQ !== searchInput.trim()) {
        setSearchQ(searchInput.trim());
      }
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setSelected(new Set());
    loadMessages(1);
  }, [searchQ]);

  const openUid = async (uid: number) => {
    if (!selectedAccountId) return;
    setLoadingMessage(true);
    setError('');
    try {
      const full = await withTimeout(signal => api.mail.message(selectedAccountId, selectedFolder, uid, signal));
      setOpenMessage(full);
      setMessages(prev => prev.map(m => (m.uid === uid ? { ...m, seen: true } : m)));
      setFolders(prev => updateFolderUnseen(prev, selectedFolder, -1));
    } catch (e: any) {
      setError(e.name === 'AbortError' ? 'Сервер не отвечает (превышено время ожидания)' : (e.message || 'Не удалось открыть письмо'));
    } finally {
      setLoadingMessage(false);
    }
  };

  const refresh = () => {
    loadFolders();
    loadMessages(page);
    if (openMessage) openUid(openMessage.uid);
  };

  const totalPages = Math.max(1, Math.ceil(totalMessages / 25));

  // ---- Множественный выбор ----
  const toggleSelect = (uid: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(uid)) next.delete(uid); else next.add(uid);
      return next;
    });
  };
  const toggleSelectAll = () => {
    setSelected(prev => (prev.size === messages.length && messages.length > 0 ? new Set() : new Set(messages.map(m => m.uid))));
  };
  // Выбор из выпадающего списка: all / none / unread / read
  const applySelectMode = (mode: string) => {
    if (mode === 'all') setSelected(new Set(messages.map(m => m.uid)));
    else if (mode === 'none') setSelected(new Set());
    else if (mode === 'unread') setSelected(new Set(messages.filter(m => !m.seen).map(m => m.uid)));
    else if (mode === 'read') setSelected(new Set(messages.filter(m => m.seen).map(m => m.uid)));
  };
  const clearSelection = () => setSelected(new Set());

  // Обновление счётчика непрочитанных в дереве папок (в т.ч. вложенных)
  const updateFolderUnseen = (nodes: MailFolder[], path: string, delta: number): MailFolder[] =>
    nodes.map(n => (n.path === path
      ? { ...n, unseen: Math.max(0, n.unseen + delta) }
      : { ...n, children: updateFolderUnseen(n.children || [], path, delta) }));

  // Прочитано/непрочитано для одного письма из списка
  const toggleReadOne = async (m: MailMessageItem) => {
    if (!selectedAccountId) return;
    try {
      if (m.seen) await api.mail.markUnread(selectedAccountId, selectedFolder, m.uid);
      else await api.mail.markRead(selectedAccountId, selectedFolder, m.uid);
      setMessages(prev => prev.map(x => (x.uid === m.uid ? { ...x, seen: !m.seen } : x)));
      setFolders(prev => updateFolderUnseen(prev, selectedFolder, m.seen ? 1 : -1));
    } catch (e: any) {
      setError(e.message || 'Не удалось изменить статус');
    }
  };

  // Плоский список всех папок (с учётом вложенности) — для выбора назначения перемещения
  const flatFolders = useMemo(() => {
    const out: { path: string; label: string }[] = [];
    const walk = (nodes: MailFolder[], depth: number) =>
      nodes.forEach(n => {
        out.push({ path: n.path, label: `${'— '.repeat(depth)}${folderLabel(n)}` });
        walk(n.children || [], depth + 1);
      });
    walk(folders, 0);
    return out;
  }, [folders]);

  const findBySpecialUse = (special: string): string | null => {
    const find = (nodes: MailFolder[]): string | null => {
      for (const n of nodes) {
        if (n.specialUse === special) return n.path;
        const nested = find(n.children || []);
        if (nested) return nested;
      }
      return null;
    };
    return find(folders);
  };

  const trashPath = findBySpecialUse('\\Trash');
  const junkPath = findBySpecialUse('\\Junk');
  const currentFolderIsTrash = trashPath !== null && selectedFolder === trashPath;
  const currentFolderIsJunk = junkPath !== null && selectedFolder === junkPath;

  // Счётчики текущей папки — для статусной строки
  const currentFolderMeta = useMemo(() => {
    const find = (nodes: MailFolder[]): { total: number; unseen: number } | null => {
      for (const n of nodes) {
        if (n.path === selectedFolder) return { total: n.total, unseen: n.unseen };
        const nested = find(n.children || []);
        if (nested) return nested;
      }
      return null;
    };
    return find(folders) || { total: totalMessages, unseen: 0 };
  }, [folders, selectedFolder, totalMessages]);

  const afterListAction = () => {
    clearSelection();
    loadMessages(page);
    loadFolders();
  };

  // Перемещение выбранных писем (или открытого) в папку
  const moveSelected = async (destination: string) => {
    if (!selectedAccountId || !destination) return;
    const targets = selected.size ? Array.from(selected) : (openMessage ? [openMessage.uid] : []);
    if (!targets.length) return;
    try {
      await api.mail.moveMessages(selectedAccountId, selectedFolder, targets, destination);
      if (openMessage && targets.includes(openMessage.uid)) setOpenMessage(null);
      afterListAction();
    } catch (e: any) {
      setError(e.message || 'Не удалось переместить письма');
    }
  };

  // Удаление выбранных писем (или открытого)
  const deleteSelected = async () => {
    if (!selectedAccountId) return;
    const targets = selected.size ? Array.from(selected) : (openMessage ? [openMessage.uid] : []);
    if (!targets.length) return;
    if (!confirm(currentFolderIsTrash ? `Удалить безвозвратно ${targets.length} писем?` : `Переместить ${targets.length} писем в Корзину?`)) return;
    try {
      if (currentFolderIsTrash) await api.mail.deleteMessages(selectedAccountId, selectedFolder, targets);
      else await api.mail.moveMessages(selectedAccountId, selectedFolder, targets, trashPath || 'Trash');
      if (openMessage && targets.includes(openMessage.uid)) setOpenMessage(null);
      afterListAction();
    } catch (e: any) {
      setError(e.message || 'Не удалось удалить письма');
    }
  };

  // Спам: в обычных папках — в «Спам», из «Спама» — обратно во «Входящие»
  const spamAction = async () => {
    if (!selectedAccountId) return;
    const targets = selected.size ? Array.from(selected) : (openMessage ? [openMessage.uid] : []);
    if (!targets.length) return;
    const destination = currentFolderIsJunk ? 'INBOX' : (junkPath || 'Junk');
    try {
      await api.mail.moveMessages(selectedAccountId, selectedFolder, targets, destination);
      if (openMessage && targets.includes(openMessage.uid)) setOpenMessage(null);
      afterListAction();
    } catch (e: any) {
      setError(e.message || 'Не удалось выполнить действие');
    }
  };

  // Удаление одного письма из списка (в Корзину / безвозвратно из Корзины)
  const deleteOne = async (uid: number) => {
    if (!selectedAccountId) return;
    if (!confirm(currentFolderIsTrash ? 'Удалить письмо безвозвратно?' : 'Удалить письмо?')) return;
    try {
      if (currentFolderIsTrash) await api.mail.deleteMessages(selectedAccountId, selectedFolder, [uid]);
      else await api.mail.moveMessages(selectedAccountId, selectedFolder, [uid], trashPath || 'Trash');
      setSelected(prev => { const next = new Set(prev); next.delete(uid); return next; });
      if (openMessage?.uid === uid) setOpenMessage(null);
      loadMessages(page);
      loadFolders();
    } catch (e: any) {
      setError(e.message || 'Не удалось удалить письмо');
    }
  };

  // Навигация по списку: ‹ новее, › старее
  const openRelative = (dir: 1 | -1) => {
    if (!openMessage) return;
    const idx = messages.findIndex(m => m.uid === openMessage.uid);
    const next = messages[idx + dir];
    if (next) openUid(next.uid);
  };

  const canPrev = openMessage !== null && messages.findIndex(m => m.uid === openMessage!.uid) > 0;
  const canNext = openMessage !== null && messages.findIndex(m => m.uid === openMessage!.uid) >= 0 && messages.findIndex(m => m.uid === openMessage!.uid) < messages.length - 1;

  // Сортировка загруженной страницы
  const sortedMessages = useMemo(() => {
    const arr = [...messages];
    const mult = sortAsc ? 1 : -1;
    arr.sort((a, b) => {
      if (sortField === 'sender') return mult * (a.fromName || a.from).localeCompare(b.fromName || b.from, 'ru');
      if (sortField === 'subject') return mult * a.subject.localeCompare(b.subject, 'ru');
      if (sortField === 'size') return mult * (a.size - b.size);
      return mult * String(a.date || '').localeCompare(String(b.date || ''));
    });
    return arr;
  }, [messages, sortField, sortAsc]);

  // Печать письма
  const printMessage = () => {
    if (!openMessage) return;
    const w = window.open('', '_blank');
    if (!w) return;
    const body = openMessage.html || `<pre style="font-family:inherit;white-space:pre-wrap">${escapeHtml(openMessage.text || '(пустое письмо)')}</pre>`;
    w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${escapeHtml(openMessage.subject)}</title></head><body style="font-family:sans-serif;padding:16px"><h3>${escapeHtml(openMessage.subject)}</h3><div style="color:#666;font-size:13px;margin-bottom:12px">От: ${escapeHtml(openMessage.from)} · ${escapeHtml(formatMailDate(openMessage.date))}</div>${body}</body></html>`);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 400);
  };

  const downloadAttachment = async (att: MailAttachmentMeta) => {
    if (!openMessage || !selectedAccountId) return;
    try {
      const res = await fetch(
        `/api/mail/attachment?accountId=${selectedAccountId}&folder=${encodeURIComponent(selectedFolder)}&uid=${openMessage.uid}&index=${att.index}`,
        { headers: { 'X-Auth-Token': localStorage.getItem('token') || '' } }
      );
      if (!res.ok) throw new Error('Не удалось скачать вложение');
      const blob = await res.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = att.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } catch (e: any) {
      setError(e.message || 'Не удалось скачать вложение');
    }
  };

  // ---- Отправка письма ----
  const [compose, setCompose] = useState<{
    to: string; subject: string; body: string; files: File[];
    inReplyTo: string; references: string;
  }>({ to: '', subject: '', body: '', files: [], inReplyTo: '', references: '' });
  const [sending, setSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startCompose = () => {
    setCompose({ to: '', subject: '', body: '', files: [], inReplyTo: '', references: '' });
    setShowCompose(true);
  };

  const quoteOriginal = (m: MailMessageFull) =>
    `<blockquote style="margin:0 0 0 0.8em;padding-left:0.8em;border-left:2px solid var(--border-color)"><p><b>От:</b> ${escapeHtml(m.from)}<br><b>Дата:</b> ${escapeHtml(formatMailDate(m.date))}<br><b>Тема:</b> ${escapeHtml(m.subject)}</p>${m.html || (m.text ? `<pre style="font-family:inherit;white-space:pre-wrap">${escapeHtml(m.text)}</pre>` : '')}</blockquote>`;

  const startReply = () => {
    if (!openMessage) return;
    const replyTo = openMessage.from.match(/<([^>]+)>/)?.[1] || openMessage.from;
    setCompose({
      to: replyTo,
      subject: openMessage.subject.startsWith('Re:') ? openMessage.subject : `Re: ${openMessage.subject}`,
      body: `<p></p>${quoteOriginal(openMessage)}`,
      files: [],
      inReplyTo: openMessage.messageId || '',
      references: openMessage.messageId || '',
    });
    setShowCompose(true);
  };

  const startForward = () => {
    if (!openMessage) return;
    setCompose({
      to: '',
      subject: openMessage.subject.startsWith('Fwd:') ? openMessage.subject : `Fwd: ${openMessage.subject}`,
      body: `<p></p>${quoteOriginal(openMessage)}`,
      files: [],
      inReplyTo: '',
      references: '',
    });
    setShowCompose(true);
  };

  const sendMessage = async () => {
    if (!account) return;
    setSending(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('accountId', account.id);
      formData.append('to', compose.to);
      formData.append('subject', compose.subject);
      formData.append('html', compose.body);
      formData.append('text', compose.body.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim());
      if (compose.inReplyTo) formData.append('inReplyTo', compose.inReplyTo);
      if (compose.references) formData.append('references', compose.references);
      compose.files.forEach(f => formData.append('files', f));
      await api.mail.send(formData);
      setShowCompose(false);
    } catch (e: any) {
      setError(e.message || 'Не удалось отправить письмо');
    } finally {
      setSending(false);
    }
  };

  // ---- Настройки аккаунтов ----
  const [editingAccount, setEditingAccount] = useState<MailAccount | null>(null);
  const [accountForm, setAccountForm] = useState({ ...EMPTY_ACCOUNT_FORM });
  const [savingAccount, setSavingAccount] = useState(false);
  const [testingAccount, setTestingAccount] = useState(false);
  const [testResult, setTestResult] = useState<{ imap: string; smtp: string } | null>(null);

  const openNewAccount = () => {
    setEditingAccount(null);
    setAccountForm({ ...EMPTY_ACCOUNT_FORM });
    setTestResult(null);
  };

  const openEditAccount = (a: MailAccount) => {
    setEditingAccount(a);
    setAccountForm({
      label: a.label, email: a.email,
      imapHost: a.imapHost, imapPort: a.imapPort, imapUser: a.imapUser, imapPass: '',
      smtpHost: a.smtpHost, smtpPort: a.smtpPort, smtpUser: a.smtpUser, smtpPass: '',
      secure: a.secure, rejectUnauthorized: a.rejectUnauthorized, isDefault: a.isDefault,
    });
    setTestResult(null);
  };

  const saveAccount = async () => {
    setSavingAccount(true);
    setError('');
    try {
      // Пустой пароль при редактировании = «не менять»
      const payload: any = { ...accountForm };
      if (editingAccount) {
        if (!payload.imapPass) delete payload.imapPass;
        if (!payload.smtpPass) delete payload.smtpPass;
        await api.mail.updateAccount(editingAccount.id, payload);
      } else {
        await api.mail.createAccount(payload);
      }
      await loadAccounts();
      openNewAccount();
    } catch (e: any) {
      setError(e.message || 'Не удалось сохранить аккаунт');
    } finally {
      setSavingAccount(false);
    }
  };

  const removeAccount = async (a: MailAccount) => {
    if (!confirm(`Удалить аккаунт «${a.label || a.email}»?`)) return;
    try {
      await api.mail.deleteAccount(a.id);
      if (selectedAccountId === a.id) setSelectedAccountId('');
      await loadAccounts();
    } catch (e: any) {
      setError(e.message || 'Не удалось удалить аккаунт');
    }
  };

  const testConnection = async (a: MailAccount) => {
    setTestingAccount(true);
    setTestResult(null);
    try {
      const result = await withTimeout(signal => api.mail.testAccount(a.id, signal), 60000);
      setTestResult(result);
    } catch (e: any) {
      setTestResult({ imap: e.name === 'AbortError' ? 'Превышено время ожидания (сервер не отвечает)' : (e.message || 'Ошибка'), smtp: '' });
    } finally {
      setTestingAccount(false);
    }
  };

  // ---- Рендер дерева папок ----
  function renderFolderTree(nodes: MailFolder[], depth: number): React.ReactNode {
    return nodes.map(f => {
      const hasKids = f.children && f.children.length > 0;
      const isCollapsed = collapsedFolders.has(f.path);
      const isActive = selectedFolder === f.path;
      return (
        <div key={f.path}>
          <button
            onClick={() => { setSelectedFolder(f.path); setOpenMessage(null); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: `7px 10px 7px ${8 + depth * 20}`,
              width: '100%', borderRadius: 9, boxSizing: 'border-box',
              border: 'none', cursor: 'pointer', fontSize: 13.5, textAlign: 'left',
              background: isActive ? 'var(--bg-hover)' : 'transparent',
              color: 'var(--text-primary)', fontWeight: f.unseen > 0 ? 600 : 400,
            }}
          >
            {hasKids ? (
              <span
                onClick={e => {
                  e.stopPropagation();
                  setCollapsedFolders(prev => {
                    const next = new Set(prev);
                    if (next.has(f.path)) next.delete(f.path); else next.add(f.path);
                    return next;
                  });
                }}
                style={{ width: 15, flexShrink: 0, fontSize: 10, color: 'var(--text-muted)', cursor: 'pointer', textAlign: 'center' }}
              >
                {isCollapsed ? '▸' : '▾'}
              </span>
            ) : (
              <span style={{ width: 15, flexShrink: 0 }} />
            )}
            <span style={{ width: 16, flexShrink: 0, display: 'flex', alignItems: 'center', color: isActive ? '#007AFF' : 'var(--text-muted)' }}>
              <Icon name={folderIconName(f)} size={14} />
            </span>
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{folderLabel(f)}</span>
            {f.unseen > 0 && (
              <span style={{ fontSize: 11, background: '#007AFF', color: '#fff', borderRadius: 9, padding: '1px 6px', flexShrink: 0, fontWeight: 600 }}>{f.unseen}</span>
            )}
          </button>
          {hasKids && !isCollapsed && renderFolderTree(f.children, depth + 1)}
        </div>
      );
    });
  }

  // ---- Рендер списка писем ----
  function renderMessageList() {
    return (
      <div style={{
        width: isMobile ? '100%' : 380, flexShrink: 0, overflowY: 'auto',
        borderRight: isMobile ? 'none' : `1px solid ${borderColor}`,
        display: 'flex', flexDirection: 'column', background: 'var(--bg-card)',
      }}>
        {loading && <div style={{ padding: 16, fontSize: 13, color: 'var(--text-muted)' }}>Загрузка…</div>}
        {!loading && sortedMessages.length === 0 && (
          <div style={{ padding: 16, fontSize: 13, color: 'var(--text-muted)' }}>
            {searchQ ? 'Ничего не найдено' : 'Папка пуста'}
          </div>
        )}
        {!loading && sortedMessages.map(m => (
          <div
            key={m.uid}
            onClick={() => openUid(m.uid)}
            style={{
              padding: '9px 12px 9px 10px', cursor: 'pointer',
              borderBottom: `1px solid ${borderColor}`,
              background: openMessage?.uid === m.uid ? 'var(--bg-hover)' : 'transparent',
              display: 'flex', flexDirection: 'column', gap: 2,
            }}
          >
            {/* Строка 1: чекбокс + отправитель + действия выбранного + дата */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <input
                type='checkbox'
                checked={selected.has(m.uid)}
                onClick={e => e.stopPropagation()}
                onChange={() => toggleSelect(m.uid)}
                style={{ flexShrink: 0, margin: 0 }}
              />
              {!m.seen && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#007AFF', flexShrink: 0 }} />}
              <span style={{ flex: 1, fontSize: 13.5, fontWeight: m.seen ? 400 : 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {m.fromName || m.from || '(без отправителя)'}
              </span>
              {selected.has(m.uid) && (
                <>
                  <button
                    onClick={e => { e.stopPropagation(); toggleReadOne(m); }}
                    title={m.seen ? 'Отметить непрочитанным' : 'Отметить прочитанным'}
                    style={{ ...iconBtnStyle, width: 26, height: 26 }}
                  >
                    <Icon name='mail' size={14} />
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); deleteOne(m.uid); }}
                    title={currentFolderIsTrash ? 'Удалить безвозвратно' : 'В Корзину'}
                    style={{ ...iconBtnStyle, width: 26, height: 26, color: '#d93025' }}
                  >
                    <Icon name='trash' size={14} />
                  </button>
                </>
              )}
              <span style={{ fontSize: 12, color: 'var(--text-muted)', flexShrink: 0 }}>{formatMailDate(m.date)}</span>
            </div>
            {/* Строка 2: тема + размер + вложение */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingLeft: 23 }}>
              <span style={{ flex: 1, fontSize: 12.5, color: m.seen ? 'var(--text-muted)' : 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.subject}</span>
              {m.hasAttachments && <span title='Вложения' style={{ fontSize: 11, flexShrink: 0, color: 'var(--text-muted)' }}>📎</span>}
              <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>{formatSize(m.size)}</span>
            </div>
          </div>
        ))}
        {totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '10px 0', borderTop: `1px solid ${borderColor}` }}>
            <button disabled={page <= 1} onClick={() => loadMessages(page - 1)} style={{ ...iconBtnStyle, width: 'auto', padding: '4px 12px', fontSize: 12, background: 'var(--bg-hover)', opacity: page <= 1 ? 0.4 : 1 }}>← Новее</button>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{page} / {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => loadMessages(page + 1)} style={{ ...iconBtnStyle, width: 'auto', padding: '4px 12px', fontSize: 12, background: 'var(--bg-hover)', opacity: page >= totalPages ? 0.4 : 1 }}>Старее →</button>
          </div>
        )}
      </div>
    );
  }

  // ---- Область чтения ----
  function renderReadingPane() {
    if (!openMessage) {
      return (
        <div className='desktop-only' style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, color: 'var(--text-muted)' }}>
          <Icon name='mail' size={44} color='var(--border-color)' />
          <div style={{ fontSize: 14 }}>Выберите письмо</div>
        </div>
      );
    }
    const isUnread = messages.find(m => m.uid === openMessage!.uid)?.seen === false;
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg-card)' }}>
        {/* Шапка письма */}
        <div style={{ padding: '12px 16px', borderBottom: `1px solid ${borderColor}`, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {isMobile && (
              <button onClick={() => setOpenMessage(null)} style={iconBtnStyle} title='Назад'>
                <Icon name='prev' size={17} />
              </button>
            )}
            <div style={{ fontSize: 15.5, fontWeight: 700, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{openMessage.subject}</div>
            <button onClick={startReply} title='Ответить' style={iconBtnStyle}><Icon name='reply' size={16} /></button>
            <button onClick={startForward} title='Переслать' style={iconBtnStyle}><Icon name='forward' size={16} /></button>
            <button
              onClick={async () => {
                if (!selectedAccountId || !openMessage) return;
                try {
                  if (isUnread) await api.mail.markRead(selectedAccountId, selectedFolder, openMessage.uid);
                  else await api.mail.markUnread(selectedAccountId, selectedFolder, openMessage.uid);
                  setMessages(prev => prev.map(m => (m.uid === openMessage!.uid ? { ...m, seen: !isUnread } : m)));
                  setFolders(prev => updateFolderUnseen(prev, selectedFolder, isUnread ? -1 : 1));
                } catch (e: any) { setError(e.message || 'Не удалось изменить статус'); }
              }}
              title={isUnread ? 'Отметить прочитанным' : 'Отметить непрочитанным'}
              style={iconBtnStyle}
            >
              <span style={{ position: 'relative', display: 'inline-flex' }}>
                <Icon name='mail' size={16} />
                {isUnread && <span style={{ position: 'absolute', top: -2, right: -3, width: 7, height: 7, borderRadius: '50%', background: '#007AFF' }} />}
              </span>
            </button>
            <button onClick={deleteSelected} title={currentFolderIsTrash ? 'Удалить безвозвратно' : 'В Корзину'} style={{ ...iconBtnStyle, color: '#d93025' }}>
              <Icon name='trash' size={16} />
            </button>
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span><b style={{ color: 'var(--text-primary)', fontWeight: 600 }}>От:</b> {openMessage.from}</span>
            <span><b style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Кому:</b> {openMessage.to || '—'}</span>
            {openMessage.cc && <span><b style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Копия:</b> {openMessage.cc}</span>}
            <span><b style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Дата:</b> {formatMailDate(openMessage.date)}</span>
          </div>
        </div>
        {loadingMessage ? (
          <div style={{ padding: 16, fontSize: 13, color: 'var(--text-muted)' }}>Загрузка письма…</div>
        ) : (
          <>
            <div style={{ flex: 1, overflow: 'auto', padding: '0 16px' }}>
              {openMessage.html ? (
                // Письма чужие — изолируем HTML в sandbox-iframe без скриптов
                <iframe
                  sandbox=''
                  srcDoc={openMessage.html}
                  title='Тело письма'
                  style={{ width: '100%', height: '100%', minHeight: 260, border: 'none', display: 'block' }}
                />
              ) : (
                <pre style={{ fontFamily: 'inherit', fontSize: 14, whiteSpace: 'pre-wrap', margin: '12px 0' }}>{openMessage.text || '(пустое письмо)'}</pre>
              )}
            </div>
            {openMessage.attachments.length > 0 && (
              <div style={{ padding: '10px 16px', borderTop: `1px solid ${borderColor}`, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ fontSize: 12.5, fontWeight: 600 }}>Вложения ({openMessage.attachments.length})</div>
                {openMessage.attachments.map(att => (
                  <button
                    key={att.index}
                    onClick={() => downloadAttachment(att)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 9,
                      border: `1px solid ${borderColor}`, background: 'var(--bg-hover)', color: 'var(--text-primary)',
                      cursor: 'pointer', fontSize: 13, textAlign: 'left',
                    }}
                  >
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>📎 {att.filename}</span>
                    <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>{formatSize(att.size)}</span>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  // ---- Разметка ----
  const borderColor = 'var(--border-color)';

  const headerBtnStyle: React.CSSProperties = {
    ...iconBtnStyle,
    background: 'var(--bg-hover)',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: 'var(--bg-body)' }}>
      {/* Верхняя панель: аккаунт и общие действия */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderBottom: `1px solid ${borderColor}`, flexWrap: 'wrap', background: 'var(--bg-card)' }}>
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Почтовый клиент</h2>
        {accounts.length > 0 && (
          <select
            value={selectedAccountId}
            onChange={e => setSelectedAccountId(e.target.value)}
            style={{ ...inputStyle, width: 'auto', minWidth: 170, marginLeft: 4 }}
          >
            {accounts.map(a => (
              <option key={a.id} value={a.id}>{a.label ? `${a.label} (${a.email})` : a.email}</option>
            ))}
          </select>
        )}
        <div style={{ flex: 1 }} />
        <button onClick={refresh} title='Обновить' style={headerBtnStyle}><Icon name='refresh' size={16} /></button>
        <button onClick={startCompose} title='Написать письмо' style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px', borderRadius: 9,
          border: 'none', cursor: 'pointer', background: '#007AFF', color: '#fff', fontSize: 13.5, fontWeight: 600,
        }}>
          <Icon name='mail' size={15} color='#fff' /> Написать
        </button>
        <button onClick={() => setShowSettings(true)} title='Настройки почтовых аккаунтов' style={headerBtnStyle}>
          <svg width='17' height='17' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
            <path d='M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' />
          </svg>
        </button>
      </div>

      {error && (
        <div style={{ padding: '7px 14px', fontSize: 13, color: '#d93025', borderBottom: `1px solid ${borderColor}`, background: 'var(--bg-card)' }}>{error}</div>
      )}

      {/* Нет аккаунтов — предлагаем настроить */}
      {accounts.length === 0 && !showSettings && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 }}>
          <div style={{ fontSize: 15, color: 'var(--text-muted)', textAlign: 'center' }}>
            Почтовые аккаунты не настроены.<br />Добавьте хотя бы один аккаунт, чтобы работать с почтой.
          </div>
          <button onClick={() => setShowSettings(true)} style={{
            padding: '10px 18px', borderRadius: 10, border: 'none', cursor: 'pointer',
            background: 'var(--bg-hover)', color: 'var(--text-primary)', fontSize: 14, fontWeight: 500,
          }}>
            Настроить аккаунты
          </button>
        </div>
      )}

      {accounts.length > 0 && (
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', flexDirection: 'row' }}>
          {/* Панель папок */}
          {(!isMobile || (!openMessage && isMobile)) && (
            <div className={isMobile ? '' : 'desktop-only'} style={{
              width: isMobile ? '100%' : 210, flexShrink: 0, overflowY: 'auto',
              borderRight: isMobile ? 'none' : `1px solid ${borderColor}`,
              display: isMobile ? 'contents' : 'flex', flexDirection: 'column',
              padding: 8, gap: 2, background: 'var(--bg-card)',
            }}>
              {isMobile ? (
                <div style={{
                  display: 'flex', flexDirection: 'column', gap: 2,
                  padding: '4px 6px 8px', borderBottom: `1px solid ${borderColor}`,
                  maxHeight: '38vh', overflowY: 'auto',
                }}>
                  {renderFolderTree(folders, 0)}
                </div>
              ) : (
                renderFolderTree(folders, 0)
              )}
              {/* На мобильном под деревом — список писем */}
              {isMobile && renderMessageList()}
            </div>
          )}

          {/* Центральная часть: тулбар + список/чтение + статусная строка */}
          {(!isMobile || openMessage) && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
              {/* Тулбар списка */}
              {!isMobile && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderBottom: `1px solid ${borderColor}`, flexWrap: 'wrap', background: 'var(--bg-card)' }}>
                  <select
                    value=''
                    onChange={e => { const v = e.target.value; e.target.value = ''; if (v) applySelectMode(v); }}
                    title='Выбрать'
                    style={{ ...inputStyle, width: 'auto', fontSize: 12.5, padding: '5px 6px' }}
                  >
                    <option value=''>✓ Выбрать…</option>
                    <option value='all'>Все</option>
                    <option value='none'>Ни одного</option>
                    <option value='unread'>Непрочитанные</option>
                    <option value='read'>Прочитанные</option>
                  </select>
                  <div style={{ position: 'relative', flex: '1 1 160px', minWidth: 140, maxWidth: 320 }}>
                    <span style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex' }}>
                      <Icon name='search' size={13} />
                    </span>
                    <input
                      style={{ ...inputStyle, paddingLeft: 28, fontSize: 12.5 }}
                      placeholder='Поиск по теме, отправителю…'
                      value={searchInput}
                      onChange={e => setSearchInput(e.target.value)}
                    />
                  </div>
                  <select
                    value={`${sortField}:${sortAsc ? 'asc' : 'desc'}`}
                    onChange={e => { const [f, d] = e.target.value.split(':'); setSortField(f as any); setSortAsc(d === 'asc'); }}
                    title='Сортировка'
                    style={{ ...inputStyle, width: 'auto', fontSize: 12.5, padding: '5px 6px' }}
                  >
                    <option value='date:desc'>Сначала новые</option>
                    <option value='date:asc'>Сначала старые</option>
                    <option value='sender:asc'>Отправитель А–Я</option>
                    <option value='sender:desc'>Отправитель Я–А</option>
                    <option value='subject:asc'>Тема А–Я</option>
                    <option value='size:desc'>Большие сначала</option>
                    <option value='size:asc'>Маленькие сначала</option>
                  </select>
                  {selected.size > 0 && (
                    <>
                      <span style={{ fontSize: 12.5, color: 'var(--text-primary)' }}>Выбрано: {selected.size}</span>
                      <select
                        value=''
                        onChange={e => { const v = e.target.value; e.target.value = ''; if (v) moveSelected(v); }}
                        style={{ ...inputStyle, width: 'auto', fontSize: 12.5, padding: '5px 6px' }}
                      >
                        <option value=''>Переместить…</option>
                        {flatFolders.filter(f => f.path !== selectedFolder).map(f => (
                          <option key={f.path} value={f.path}>{f.label}</option>
                        ))}
                      </select>
                    </>
                  )}
                  <div style={{ flex: 1 }} />
                  <button onClick={() => openRelative(-1)} disabled={!canPrev} title='Предыдущее (новее)' style={{ ...headerBtnStyle, opacity: canPrev ? 1 : 0.35 }}><Icon name='prev' size={16} /></button>
                  <button onClick={() => openRelative(1)} disabled={!canNext} title='Следующее (старее)' style={{ ...headerBtnStyle, opacity: canNext ? 1 : 0.35 }}><Icon name='next' size={16} /></button>
                  <button onClick={deleteSelected} title={currentFolderIsTrash ? 'Удалить безвозвратно' : 'В Корзину'} style={{ ...headerBtnStyle, color: '#d93025' }}><Icon name='trash' size={16} /></button>
                  <button onClick={spamAction} title={currentFolderIsJunk ? 'Не спам (во Входящие)' : 'Спам'} style={{ ...headerBtnStyle, color: currentFolderIsJunk ? '#188038' : '#e37400' }}>
                    <Icon name='spamShield' size={16} />
                  </button>
                  <button onClick={printMessage} disabled={!openMessage} title='Печать' style={{ ...headerBtnStyle, opacity: openMessage ? 1 : 0.35 }}><Icon name='print' size={16} /></button>
                </div>
              )}
              {/* Список + область чтения */}
              <div style={{ flex: 1, display: 'flex', overflow: 'hidden', flexDirection: 'row' }}>
                {!isMobile && renderMessageList()}
                {(!isMobile || openMessage) && renderReadingPane()}
              </div>
              {/* Статусная строка */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '4px 12px', borderTop: `1px solid ${borderColor}`, fontSize: 12, color: 'var(--text-muted)', background: 'var(--bg-card)' }}>
                <span>Писем в папке: {searchQ ? totalMessages : currentFolderMeta.total}</span>
                <span>Непрочитанных: {currentFolderMeta.unseen}</span>
                {selected.size > 0 && <span>Выбрано: {selected.size}</span>}
                {searchQ && <span>По запросу «{searchQ}»: {totalMessages}</span>}
                <div style={{ flex: 1 }} />
                <span>Страница {page} из {totalPages}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {showCompose && renderComposeModal()}
      {showSettings && renderSettingsModal()}
    </div>
  );

  function renderComposeModal() {
    return (
      <div
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12 }}
        onClick={e => { if (e.target === e.currentTarget) setShowCompose(false); }}
      >
        <div style={{
          width: '100%', maxWidth: 720, maxHeight: '92vh', display: 'flex', flexDirection: 'column',
          background: 'var(--bg-card)', borderRadius: 14, overflow: 'hidden',
          border: `1px solid ${borderColor}`, boxShadow: '0 12px 40px rgba(0,0,0,0.25)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', borderBottom: `1px solid ${borderColor}` }}>
            <div style={{ fontSize: 15, fontWeight: 600, flex: 1 }}>Новое письмо</div>
            <button onClick={() => setShowCompose(false)} style={{ ...iconBtnStyle }} title='Закрыть'>
              <svg width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'><path d='M6 6l12 12M18 6L6 18' /></svg>
            </button>
          </div>
          <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto' }}>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              От: <b style={{ color: 'var(--text-primary)' }}>{account ? (account.label ? `${account.label} (${account.email})` : account.email) : ''}</b>
            </div>
            <input
              style={inputStyle}
              placeholder='Кому (email)'
              value={compose.to}
              onChange={e => setCompose(prev => ({ ...prev, to: e.target.value }))}
            />
            <input
              style={inputStyle}
              placeholder='Тема'
              value={compose.subject}
              onChange={e => setCompose(prev => ({ ...prev, subject: e.target.value }))}
            />
            <div>
              <ReactQuill
                theme='snow'
                value={compose.body}
                onChange={value => setCompose(prev => ({ ...prev, body: value }))}
                placeholder='Текст письма'
                modules={quillModules}
                formats={quillFormats}
                style={{ borderRadius: 10, border: `1px solid ${borderColor}`, background: 'var(--bg-input)' }}
              />
            </div>
            <div>
              <input
                ref={fileInputRef}
                type='file'
                multiple
                style={{ display: 'none' }}
                onChange={e => {
                  const files = Array.from(e.target.files || []);
                  setCompose(prev => ({ ...prev, files: [...prev.files, ...files].slice(0, 10) }));
                  e.target.value = '';
                }}
              />
              <button onClick={() => fileInputRef.current?.click()} style={{ ...iconBtnStyle, width: 'auto', padding: '6px 12px', fontSize: 13, background: 'var(--bg-hover)' }}>
                📎 Прикрепить файлы
              </button>
              {compose.files.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 }}>
                  {compose.files.map((f, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
                      <span style={{ color: 'var(--text-muted)' }}>{formatSize(f.size)}</span>
                      <button
                        onClick={() => setCompose(prev => ({ ...prev, files: prev.files.filter((_, j) => j !== i) }))}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#d93025', fontSize: 14, padding: 4 }}
                        title='Убрать вложение'
                      >✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, padding: '12px 16px', borderTop: `1px solid ${borderColor}` }}>
            <button
              onClick={sendMessage}
              disabled={sending || !compose.to.trim()}
              style={{
                padding: '8px 18px', borderRadius: 10, border: 'none', cursor: sending ? 'default' : 'pointer',
                background: '#007AFF', color: '#fff', fontSize: 14, fontWeight: 500,
                opacity: sending || !compose.to.trim() ? 0.6 : 1,
              }}
            >
              {sending ? 'Отправка…' : 'Отправить'}
            </button>
            <button onClick={() => setShowCompose(false)} style={{ ...iconBtnStyle, width: 'auto', padding: '8px 14px', fontSize: 14, background: 'var(--bg-hover)' }}>Отмена</button>
          </div>
        </div>
      </div>
    );
  }

  function renderSettingsModal() {
    const setForm = (patch: Partial<typeof accountForm>) => setAccountForm(prev => ({ ...prev, ...patch }));
    return (
      <div
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12 }}
        onClick={e => { if (e.target === e.currentTarget) setShowSettings(false); }}
      >
        <div style={{
          width: '100%', maxWidth: 560, maxHeight: '92vh', display: 'flex', flexDirection: 'column',
          background: 'var(--bg-card)', borderRadius: 14, overflow: 'hidden',
          border: `1px solid ${borderColor}`, boxShadow: '0 12px 40px rgba(0,0,0,0.25)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', borderBottom: `1px solid ${borderColor}` }}>
            <div style={{ fontSize: 15, fontWeight: 600, flex: 1 }}>Почтовые аккаунты</div>
            <button onClick={() => setShowSettings(false)} style={{ ...iconBtnStyle }} title='Закрыть'>
              <svg width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'><path d='M6 6l12 12M18 6L6 18' /></svg>
            </button>
          </div>
          <div style={{ padding: '12px 16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Список аккаунтов */}
            {accounts.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {accounts.map(a => (
                  <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 10, border: `1px solid ${borderColor}` }}>
                    <button
                      onClick={async () => { await api.mail.updateAccount(a.id, { isDefault: !a.isDefault }); loadAccounts(); }}
                      title={a.isDefault ? 'Аккаунт по умолчанию' : 'Сделать аккаунтом по умолчанию'}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: a.isDefault ? '#f5a623' : 'var(--text-muted)', padding: 2 }}
                    >{a.isDefault ? '★' : '☆'}</button>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {a.label || a.email}
                        {a.label && <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}> — {a.email}</span>}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>IMAP {a.imapHost}:{a.imapPort} · SMTP {a.smtpHost}:{a.smtpPort}</div>
                    </div>
                    <button onClick={() => openEditAccount(a)} style={{ ...iconBtnStyle, width: 32, height: 32, background: 'var(--bg-hover)' }} title='Изменить'>
                      <svg width='15' height='15' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'><path d='M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4 9.5-9.5z' /></svg>
                    </button>
                    <button onClick={() => testConnection(a)} disabled={testingAccount} style={{ ...iconBtnStyle, width: 32, height: 32, background: 'var(--bg-hover)' }} title='Проверить подключение'>
                      <svg width='15' height='15' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'><path d='M22 11.08V12a10 10 0 11-5.93-9.14M22 4L12 14.01l-3-3' /></svg>
                    </button>
                    <button onClick={() => removeAccount(a)} style={{ ...iconBtnStyle, width: 32, height: 32, background: 'var(--bg-hover)', color: '#d93025' }} title='Удалить'>
                      <Icon name='trash' size={15} />
                    </button>
                    {testingAccount && <span style={{ fontSize: 12, color: 'var(--text-muted)', flexShrink: 0 }}>Проверка…</span>}
                  </div>
                ))}
                {testResult && (
                  <div style={{ fontSize: 13, padding: '8px 12px', borderRadius: 10, background: 'var(--bg-hover)' }}>
                    <div>IMAP: {testResult.imap === 'ok' ? <b style={{ color: '#188038' }}>подключено</b> : <b style={{ color: '#d93025' }}>{testResult.imap}</b>}</div>
                    {testResult.smtp && <div>SMTP: {testResult.smtp === 'ok' ? <b style={{ color: '#188038' }}>подключено</b> : <b style={{ color: '#d93025' }}>{testResult.smtp}</b>}</div>}
                  </div>
                )}
              </div>
            )}

            {/* Форма добавления/редактирования */}
            <div style={{ borderTop: `1px solid ${borderColor}`, paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{editingAccount ? 'Изменить аккаунт' : 'Добавить аккаунт'}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <input style={inputStyle} placeholder='Метка (например, Рабочая)' value={accountForm.label} onChange={e => setForm({ label: e.target.value })} />
                <input style={inputStyle} placeholder='Email *' value={accountForm.email} onChange={e => setForm({ email: e.target.value })} />
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>Входящая почта (IMAP)</div>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 8 }}>
                <input style={inputStyle} placeholder='IMAP-сервер *' value={accountForm.imapHost} onChange={e => setForm({ imapHost: e.target.value })} />
                <input style={inputStyle} type='number' placeholder='Порт' value={accountForm.imapPort} onChange={e => setForm({ imapPort: parseInt(e.target.value) || 993 })} />
                <input style={inputStyle} placeholder='Логин IMAP *' value={accountForm.imapUser} onChange={e => setForm({ imapUser: e.target.value })} />
                <input style={inputStyle} type='password' placeholder={editingAccount?.hasImapPassword ? 'Пароль IMAP (указан)' : 'Пароль IMAP *'} value={accountForm.imapPass} onChange={e => setForm({ imapPass: e.target.value })} />
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>Исходящая почта (SMTP)</div>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 8 }}>
                <input style={inputStyle} placeholder='SMTP-сервер *' value={accountForm.smtpHost} onChange={e => setForm({ smtpHost: e.target.value })} />
                <input style={inputStyle} type='number' placeholder='Порт' value={accountForm.smtpPort} onChange={e => setForm({ smtpPort: parseInt(e.target.value) || 465 })} />
                <input style={inputStyle} placeholder='Логин SMTP *' value={accountForm.smtpUser} onChange={e => setForm({ smtpUser: e.target.value })} />
                <input style={inputStyle} type='password' placeholder={editingAccount?.hasSmtpPassword ? 'Пароль SMTP (указан)' : 'Пароль SMTP *'} value={accountForm.smtpPass} onChange={e => setForm({ smtpPass: e.target.value })} />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                <input type='checkbox' checked={accountForm.secure} onChange={e => setForm({ secure: e.target.checked })} />
                SSL/TLS (рекомендуется)
              </label>
              {accountForm.secure && accountForm.imapPort !== 993 && (
                <div style={{ fontSize: 12, color: '#d93025' }}>
                  SSL/TLS несовместим с IMAP-портом {accountForm.imapPort} — укажите порт 993 или снимите флажок (будет использоваться STARTTLS)
                </div>
              )}
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                <input type='checkbox' checked={accountForm.isDefault} onChange={e => setForm({ isDefault: e.target.checked })} />
                Аккаунт по умолчанию
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                <input type='checkbox' checked={accountForm.rejectUnauthorized} onChange={e => setForm({ rejectUnauthorized: e.target.checked })} />
                Не проверять TLS-сертификат сервера
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={saveAccount}
                  disabled={savingAccount || !accountForm.email || !accountForm.imapHost || !accountForm.imapUser || !accountForm.smtpHost || !accountForm.smtpUser || (!editingAccount && (!accountForm.imapPass || !accountForm.smtpPass))}
                  style={{
                    padding: '8px 18px', borderRadius: 10, border: 'none', cursor: 'pointer',
                    background: '#007AFF', color: '#fff', fontSize: 14, fontWeight: 500,
                    opacity: savingAccount ? 0.6 : 1,
                  }}
                >
                  {savingAccount ? 'Сохранение…' : editingAccount ? 'Сохранить изменения' : 'Добавить аккаунт'}
                </button>
                {editingAccount && (
                  <button onClick={openNewAccount} style={{ ...iconBtnStyle, width: 'auto', padding: '8px 14px', fontSize: 14, background: 'var(--bg-hover)' }}>Отмена редактирования</button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
