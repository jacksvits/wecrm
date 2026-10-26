import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../api/client';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

/**
 * Почтовый клиент (страница /mail, доступ только у админов).
 * Аккаунты почты настраиваются по шестерёнке: у каждого пользователя свои
 * аккаунты, аккаунтов может быть несколько. Тело письма — WYSIWYG (ReactQuill).
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
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} КБ`;
  return `${(bytes / 1024 / 1024).toFixed(1)} МБ`;
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
  width: 36, height: 36, borderRadius: 10, border: 'none', cursor: 'pointer',
  background: 'var(--bg-hover)', color: 'var(--text-primary)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 10px', borderRadius: 10, fontSize: 14,
  border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)',
  boxSizing: 'border-box', outline: 'none',
};

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

  const [showSettings, setShowSettings] = useState(false);
  const [showCompose, setShowCompose] = useState(false);

  const account: MailAccount | undefined = accounts.find(a => a.id === selectedAccountId);

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
      // Выбираем сохранённый, иначе аккаунт по умолчанию, иначе первый
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

  const loadMessages = async (p: number) => {
    if (!selectedAccountId) return;
    setLoading(true);
    setError('');
    try {
      const data = await withTimeout(signal => api.mail.messages(selectedAccountId, selectedFolder, p, signal));
      setMessages(data.messages || []);
      setTotalMessages(data.total || 0);
      setPage(p);
    } catch (e: any) {
      setError(e.name === 'AbortError' ? 'Сервер не отвечает (превышено время ожидания)' : (e.message || 'Не удалось загрузить письма'));
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setOpenMessage(null);
    loadFolders();
    loadMessages(1);
  }, [selectedAccountId, selectedFolder]);

  const refresh = () => {
    loadFolders();
    loadMessages(page);
    if (openMessage) openUid(openMessage.uid);
  };

  const openUid = async (uid: number) => {
    if (!selectedAccountId) return;
    setLoadingMessage(true);
    setError('');
    try {
      const full = await withTimeout(signal => api.mail.message(selectedAccountId, selectedFolder, uid, signal));
      setOpenMessage(full);
      // Обновляем флаг \Seen в списке и счётчик папки
      setMessages(prev => prev.map(m => (m.uid === uid ? { ...m, seen: true } : m)));
      setFolders(prev => prev.map(f => (f.path === selectedFolder ? { ...f, unseen: Math.max(0, f.unseen - 1) } : f)));
    } catch (e: any) {
      setError(e.name === 'AbortError' ? 'Сервер не отвечает (превышено время ожидания)' : (e.message || 'Не удалось открыть письмо'));
    } finally {
      setLoadingMessage(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(totalMessages / 25));

  const deleteMessage = async () => {
    if (!openMessage || !selectedAccountId) return;
    if (!confirm('Удалить письмо?')) return;
    try {
      await api.mail.deleteMessage(selectedAccountId, selectedFolder, openMessage.uid);
      setOpenMessage(null);
      loadMessages(page);
      loadFolders();
    } catch (e: any) {
      setError(e.message || 'Не удалось удалить письмо');
    }
  };

  const toggleUnread = async () => {
    if (!openMessage || !selectedAccountId) return;
    try {
      if (openMessage.uid && messages.find(m => m.uid === openMessage.uid)?.seen === false) {
        await api.mail.markRead(selectedAccountId, selectedFolder, openMessage.uid);
        setMessages(prev => prev.map(m => (m.uid === openMessage.uid ? { ...m, seen: true } : m)));
      } else {
        await api.mail.markUnread(selectedAccountId, selectedFolder, openMessage.uid);
        setMessages(prev => prev.map(m => (m.uid === openMessage.uid ? { ...m, seen: false } : m)));
        setFolders(prev => prev.map(f => (f.path === selectedFolder ? { ...f, unseen: f.unseen + 1 } : f)));
      }
    } catch (e: any) {
      setError(e.message || 'Не удалось изменить статус');
    }
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

  const startReply = () => {
    if (!openMessage) return;
    const replyTo = openMessage.from.match(/<([^>]+)>/)?.[1] || openMessage.from;
    const quoted = openMessage.html || (openMessage.text ? `<pre style="font-family:inherit;white-space:pre-wrap">${escapeHtml(openMessage.text)}</pre>` : '');
    setCompose({
      to: replyTo,
      subject: openMessage.subject.startsWith('Re:') ? openMessage.subject : `Re: ${openMessage.subject}`,
      body: `<p></p><blockquote style="margin:0 0 0 0.8em;padding-left:0.8em;border-left:2px solid var(--border-color)"><p><b>От:</b> ${escapeHtml(openMessage.from)}<br><b>Дата:</b> ${escapeHtml(formatMailDate(openMessage.date))}<br><b>Тема:</b> ${escapeHtml(openMessage.subject)}</p>${quoted}</blockquote>`,
      files: [],
      inReplyTo: openMessage.messageId || '',
      references: openMessage.messageId || '',
    });
    setShowCompose(true);
  };

  const startForward = () => {
    if (!openMessage) return;
    const quoted = openMessage.html || (openMessage.text ? `<pre style="font-family:inherit;white-space:pre-wrap">${escapeHtml(openMessage.text)}</pre>` : '');
    setCompose({
      to: '',
      subject: openMessage.subject.startsWith('Fwd:') ? openMessage.subject : `Fwd: ${openMessage.subject}`,
      body: `<p></p><blockquote style="margin:0 0 0 0.8em;padding-left:0.8em;border-left:2px solid var(--border-color)"><p><b>От:</b> ${escapeHtml(openMessage.from)}<br><b>Дата:</b> ${escapeHtml(formatMailDate(openMessage.date))}<br><b>Тема:</b> ${escapeHtml(openMessage.subject)}</p>${quoted}</blockquote>`,
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


  function renderMessageList() {
    return (
      <div style={{
        width: isMobile ? '100%' : 340, flexShrink: 0, overflowY: 'auto',
        borderRight: isMobile ? 'none' : `1px solid ${borderColor}`,
        borderTop: isMobile ? 'none' : undefined,
        display: 'flex', flexDirection: 'column',
      }}>
        {loading && <div style={{ padding: 16, fontSize: 13, color: 'var(--text-muted)' }}>Загрузка…</div>}
        {!loading && messages.length === 0 && (
          <div style={{ padding: 16, fontSize: 13, color: 'var(--text-muted)' }}>Папка пуста</div>
        )}
        {!loading && messages.map(m => (
          <div
            key={m.uid}
            onClick={() => openUid(m.uid)}
            style={{
              padding: '10px 14px', cursor: 'pointer',
              borderBottom: `1px solid ${borderColor}`,
              background: openMessage?.uid === m.uid ? 'var(--bg-hover)' : 'transparent',
              display: 'flex', flexDirection: 'column', gap: 3,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {!m.seen && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#007AFF', flexShrink: 0 }} />}
              <span style={{ flex: 1, fontSize: 14, fontWeight: m.seen ? 400 : 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {m.fromName || m.from || '(без отправителя)'}
              </span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', flexShrink: 0 }}>{formatMailDate(m.date)}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ flex: 1, fontSize: 13, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.subject}</span>
              {m.hasAttachments && <span title='Вложения' style={{ fontSize: 12, flexShrink: 0 }}>📎</span>}
            </div>
          </div>
        ))}
        {totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '10px 0' }}>
            <button disabled={page <= 1} onClick={() => loadMessages(page - 1)} style={{ ...iconBtnStyle, width: 'auto', padding: '4px 12px', fontSize: 13, opacity: page <= 1 ? 0.4 : 1 }}>← Новее</button>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{page} / {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => loadMessages(page + 1)} style={{ ...iconBtnStyle, width: 'auto', padding: '4px 12px', fontSize: 13, opacity: page >= totalPages ? 0.4 : 1 }}>Старее →</button>
          </div>
        )}
      </div>
    );
  }

  function renderReadingPane() {
    if (!openMessage) {
      return (
        <div className='desktop-only' style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
          Выберите письмо
        </div>
      );
    }
    const isUnread = messages.find(m => m.uid === openMessage!.uid)?.seen === false;
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderBottom: `1px solid ${borderColor}`, flexWrap: 'wrap' }}>
          {isMobile && (
            <button onClick={() => setOpenMessage(null)} style={iconBtnStyle} title='Назад'>
              <svg width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'><path d='M15 18l-6-6 6-6' /></svg>
            </button>
          )}
          <button onClick={startReply} title='Ответить' style={{ ...iconBtnStyle, width: 'auto', padding: '0 12px', fontSize: 13 }}>↩ Ответить</button>
          <button onClick={startForward} title='Переслать' style={{ ...iconBtnStyle, width: 'auto', padding: '0 12px', fontSize: 13 }}>→ Переслать</button>
          <button onClick={toggleUnread} title='Прочитано/непрочитано' style={{ ...iconBtnStyle, width: 'auto', padding: '0 12px', fontSize: 13 }}>{isUnread ? '✉ Прочитано' : '✉ Непрочитанное'}</button>
          <div style={{ flex: 1 }} />
          <button onClick={deleteMessage} title='Удалить' style={{ ...iconBtnStyle, color: '#d93025' }}>
            <svg width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'><path d='M3 6h18M8 6V4a1 1 0 011-1h6a1 1 0 011 1v2m2 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M10 11v6M14 11v6' /></svg>
          </button>
        </div>
        <div style={{ padding: '14px 16px', borderBottom: `1px solid ${borderColor}` }}>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>{openMessage.subject}</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span><b style={{ color: 'var(--text-primary)' }}>От:</b> {openMessage.from}</span>
            {openMessage.to && <span><b style={{ color: 'var(--text-primary)' }}>Кому:</b> {openMessage.to}</span>}
            {openMessage.cc && <span><b style={{ color: 'var(--text-primary)' }}>Копия:</b> {openMessage.cc}</span>}
            <span>{formatMailDate(openMessage.date)}</span>
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
                  style={{ width: '100%', height: '100%', minHeight: 300, border: 'none', display: 'block' }}
                />
              ) : (
                <pre style={{ fontFamily: 'inherit', fontSize: 14, whiteSpace: 'pre-wrap', margin: '12px 0' }}>{openMessage.text || '(пустое письмо)'}</pre>
              )}
            </div>
            {openMessage.attachments.length > 0 && (
              <div style={{ padding: '10px 16px', borderTop: `1px solid ${borderColor}`, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>Вложения ({openMessage.attachments.length})</div>
                {openMessage.attachments.map(att => (
                  <button
                    key={att.index}
                    onClick={() => downloadAttachment(att)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 10,
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

  const folderLabel = (f: MailFolder) =>
    f.specialUse === '\\Sent' ? 'Отправленные' :
    f.specialUse === '\\Trash' ? 'Корзина' :
    f.specialUse === '\\Drafts' ? 'Черновики' :
    f.specialUse === '\\Junk' ? 'Спам' :
    /^INBOX$/i.test(f.path) ? 'Входящие' : f.name;

  const settingsBtn = (
    <button onClick={() => setShowSettings(true)} title='Настройки почтовых аккаунтов' style={iconBtnStyle}>
      <svg width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
        <path d='M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' />
      </svg>
    </button>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Шапка */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderBottom: `1px solid ${borderColor}`, flexWrap: 'wrap' }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Почтовый клиент</h2>
        {accounts.length > 0 && (
          <select
            value={selectedAccountId}
            onChange={e => setSelectedAccountId(e.target.value)}
            style={{ ...inputStyle, width: 'auto', minWidth: 180, marginLeft: 8 }}
          >
            {accounts.map(a => (
              <option key={a.id} value={a.id}>{a.label ? `${a.label} (${a.email})` : a.email}</option>
            ))}
          </select>
        )}
        <div style={{ flex: 1 }} />
        <button onClick={refresh} title='Обновить' style={iconBtnStyle}>
          <svg width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'><path d='M4 4v5h5M20 20v-5h-5M5.5 9A7.5 7.5 0 0119 7.5M18.5 15A7.5 7.5 0 015 16.5' /></svg>
        </button>
        <button onClick={startCompose} title='Написать письмо' style={{ ...iconBtnStyle, width: 'auto', padding: '0 14px', fontSize: 14, fontWeight: 500 }}>
          ✉ Написать
        </button>
        {settingsBtn}
      </div>

      {error && (
        <div style={{ padding: '8px 16px', fontSize: 13, color: '#d93025', borderBottom: `1px solid ${borderColor}` }}>{error}</div>
      )}

      {/* Нет аккаунтов — предлагаем настроить */}
      {accounts.length === 0 && !showSettings && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 }}>
          <div style={{ fontSize: 15, color: 'var(--text-muted)', textAlign: 'center' }}>
            Почтовые аккаунты не настроены.<br />Добавьте хотя бы один аккаунт, чтобы работать с почтой.
          </div>
          <button onClick={() => setShowSettings(true)} style={{ ...iconBtnStyle, width: 'auto', padding: '10px 18px', fontSize: 14, fontWeight: 500 }}>
            Настроить аккаунты
          </button>
        </div>
      )}

      {accounts.length > 0 && (
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', flexDirection: 'row' }}>
          {/* Папки */}
          {(!isMobile || (!openMessage && isMobile)) && (
            <div className={isMobile ? '' : 'desktop-only'} style={{
              width: isMobile ? '100%' : 190, flexShrink: 0, overflowY: 'auto',
              borderRight: isMobile ? 'none' : `1px solid ${borderColor}`,
              display: isMobile ? 'contents' : 'flex', flexDirection: 'column', padding: 8, gap: 2,
            }}>
              {isMobile && (
                <div style={{ display: 'flex', gap: 6, overflowX: 'auto', padding: '8px 12px', borderBottom: `1px solid ${borderColor}` }}>
                  {folders.map(f => (
                    <button
                      key={f.path}
                      onClick={() => { setSelectedFolder(f.path); setOpenMessage(null); }}
                      style={{
                        flexShrink: 0, padding: '6px 12px', borderRadius: 16, fontSize: 13, cursor: 'pointer',
                        border: `1px solid ${borderColor}`,
                        background: selectedFolder === f.path ? 'var(--bg-hover)' : 'transparent',
                        color: 'var(--text-primary)',
                        fontWeight: f.unseen > 0 ? 600 : 400,
                      }}
                    >
                      {folderLabel(f)}{f.unseen > 0 ? ` (${f.unseen})` : ''}
                    </button>
                  ))}
                </div>
              )}
              {!isMobile && folders.map(f => (
                <button
                  key={f.path}
                  onClick={() => { setSelectedFolder(f.path); setOpenMessage(null); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 10,
                    border: 'none', cursor: 'pointer', fontSize: 14, textAlign: 'left',
                    background: selectedFolder === f.path ? 'var(--bg-hover)' : 'transparent',
                    color: 'var(--text-primary)', fontWeight: f.unseen > 0 ? 600 : 400,
                  }}
                >
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{folderLabel(f)}</span>
                  {f.unseen > 0 && (
                    <span style={{ fontSize: 12, background: '#007AFF', color: '#fff', borderRadius: 10, padding: '1px 7px', flexShrink: 0 }}>{f.unseen}</span>
                  )}
                </button>
              ))}
              {/* Список писем (мобайл: под чипами папок) */}
              {isMobile && renderMessageList()}
            </div>
          )}

          {/* Список писем */}
          {!isMobile && renderMessageList()}

          {/* Просмотр письма */}
          {(!isMobile || openMessage) && renderReadingPane()}
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
            <button onClick={() => setShowCompose(false)} style={{ ...iconBtnStyle, background: 'transparent' }} title='Закрыть'>
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
              <button onClick={() => fileInputRef.current?.click()} style={{ ...iconBtnStyle, width: 'auto', padding: '6px 12px', fontSize: 13 }}>
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
            <button onClick={() => setShowCompose(false)} style={{ ...iconBtnStyle, width: 'auto', padding: '8px 14px', fontSize: 14 }}>Отмена</button>
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
            <button onClick={() => setShowSettings(false)} style={{ ...iconBtnStyle, background: 'transparent' }} title='Закрыть'>
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
                    <button onClick={() => openEditAccount(a)} style={{ ...iconBtnStyle, width: 32, height: 32 }} title='Изменить'>
                      <svg width='15' height='15' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'><path d='M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4 9.5-9.5z' /></svg>
                    </button>
                    <button onClick={() => testConnection(a)} disabled={testingAccount} style={{ ...iconBtnStyle, width: 32, height: 32 }} title='Проверить подключение'>
                      <svg width='15' height='15' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'><path d='M22 11.08V12a10 10 0 11-5.93-9.14M22 4L12 14.01l-3-3' /></svg>
                    </button>
                    {testingAccount && <span style={{ fontSize: 12, color: 'var(--text-muted)', flexShrink: 0 }}>Проверка…</span>}
                    <button onClick={() => removeAccount(a)} style={{ ...iconBtnStyle, width: 32, height: 32, color: '#d93025' }} title='Удалить'>
                      <svg width='15' height='15' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'><path d='M3 6h18M8 6V4a1 1 0 011-1h6a1 1 0 011 1v2m2 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6' /></svg>
                    </button>
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
                  <button onClick={openNewAccount} style={{ ...iconBtnStyle, width: 'auto', padding: '8px 14px', fontSize: 14 }}>Отмена редактирования</button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
