import { useEffect, useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { api } from '../../api/client';
import { Contact, Deal, FileAttachment, FinanceDocument, Task } from '../../types';
import {
  DOC_TYPE_LABELS,
  DIRECTION_LABELS,
  DOC_STATUS_LABELS,
  DocTypeBadge,
  MatchStatusBadge,
  fmtMoney,
  fmtDate,
  inputStyle,
  btnPrimary,
  btnSecondary,
  btnSmall,
} from './shared';

// Модули Quill — как в NoteEditor.tsx
const quillModules = {
  toolbar: [
    ['bold', 'italic', 'underline', 'strike'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['link'],
    ['clean'],
  ],
};
const quillFormats = ['bold', 'italic', 'underline', 'strike', 'list', 'bullet', 'link'];

interface Props {
  documentId?: string | null; // null/undefined — режим создания
  initialTaskId?: string; // предустановленная задача (при создании из карточки задачи)
  onClose: () => void;
  onSaved?: (doc: FinanceDocument) => void;
  onDeleted?: (id: string) => void;
}

// Карточка финансового документа: просмотр/редактирование/создание + вложения
export function FinanceDocumentModal({ documentId, initialTaskId, onClose, onSaved, onDeleted }: Props) {
  const isEdit = !!documentId;
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [doc, setDoc] = useState<FinanceDocument | null>(null);
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [form, setForm] = useState({
    type: 'other',
    direction: 'incoming',
    number: '',
    date: new Date().toISOString().slice(0, 10),
    amount: '',
    vat: '',
    currency: 'RUB',
    counterpartyName: '',
    counterpartyInn: '',
    contactId: '',
    taskId: initialTaskId || '',
    dealId: '',
    status: 'new',
    notes: '',
    ignored: false,
  });

  useEffect(() => {
    api.contacts.list().then(setContacts).catch(() => {});
    api.deals.list().then(setDeals).catch(() => {});
    api.tasks.list().then(setTasks).catch(() => {});
  }, []);

  useEffect(() => {
    if (!documentId) return;
    setLoading(true);
    api.accounting
      .getDocument(documentId)
      .then((d) => {
        setDoc(d);
        setAttachments(d.attachments || []);
        setForm({
          type: d.type || 'other',
          direction: d.direction || 'incoming',
          number: d.number || '',
          date: d.date ? d.date.slice(0, 10) : '',
          amount: d.amount ? String(d.amount) : '',
          vat: d.vat != null ? String(d.vat) : '',
          currency: d.currency || 'RUB',
          counterpartyName: d.counterpartyName || '',
          counterpartyInn: d.counterpartyInn || '',
          contactId: d.contactId || '',
          taskId: d.taskId || '',
          dealId: d.dealId || '',
          status: d.status || 'new',
          notes: d.notes || '',
          ignored: d.matchStatus === 'ignored',
        });
      })
      .catch((err) => alert(err.message || 'Ошибка загрузки документа'))
      .finally(() => setLoading(false));
  }, [documentId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: any = {
        type: form.type,
        direction: form.direction,
        number: form.number || null,
        date: form.date || undefined,
        amount: parseFloat(form.amount) || 0,
        vat: form.vat ? parseFloat(form.vat) : null,
        currency: form.currency || 'RUB',
        counterpartyName: form.counterpartyName || null,
        counterpartyInn: form.counterpartyInn || null,
        contactId: form.contactId || null,
        taskId: form.taskId || null,
        dealId: form.dealId || null,
        status: form.status,
        notes: form.notes || null,
      };
      // Ручной сброс сверки: только ignored/unmatched
      if (isEdit && (doc?.matchStatus === 'ignored' || doc?.matchStatus === 'unmatched')) {
        payload.matchStatus = form.ignored ? 'ignored' : 'unmatched';
      }
      const saved = isEdit
        ? await api.accounting.updateDocument(documentId!, payload)
        : await api.accounting.createDocument(payload);
      setDoc(saved);
      onSaved?.(saved);
      if (!isEdit) onClose();
    } catch (err: any) {
      alert(err.message || 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!documentId) return;
    if (!confirm('Удалить документ? Вложения также будут удалены.')) return;
    try {
      await api.accounting.deleteDocument(documentId);
      onDeleted?.(documentId);
      onClose();
    } catch (err: any) {
      alert(err.message || 'Ошибка удаления');
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length || !doc?.id) return;
    setUploading(true);
    try {
      for (const file of files) {
        const att = await api.uploads.upload(file, 'finance_document', doc.id);
        setAttachments((prev) => [...prev, att]);
      }
    } catch (err: any) {
      alert(err.message || 'Ошибка загрузки файла');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDeleteAttachment = async (id: string) => {
    if (!confirm('Удалить вложение?')) return;
    try {
      await api.uploads.delete(id);
      setAttachments((prev) => prev.filter((a) => a.id !== id));
    } catch (err: any) {
      alert(err.message || 'Ошибка удаления');
    }
  };

  const handleUnmatch = async () => {
    if (!doc?.id) return;
    if (!confirm('Разорвать связь с банковской операцией?')) return;
    try {
      await api.accounting.reconciliationUnmatch(doc.id);
      const fresh = await api.accounting.getDocument(doc.id);
      setDoc(fresh);
      onSaved?.(fresh);
    } catch (err: any) {
      alert(err.message || 'Ошибка');
    }
  };

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const canResetMatch = doc?.matchStatus === 'ignored' || doc?.matchStatus === 'unmatched';

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1100,
        background: 'rgba(0, 0, 0, 0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 720,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 16,
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
        }}
      >
        {/* Шапка */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-color)',
            flexShrink: 0,
          }}
        >
          <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>
              {isEdit ? `Документ ${form.number ? `№ ${form.number}` : ''}` : 'Новый документ'}
            </span>
            {isEdit && <DocTypeBadge type={form.type} />}
            {isEdit && doc && <MatchStatusBadge status={doc.matchStatus} />}
          </div>
          <button
            onClick={onClose}
            title="Закрыть"
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              border: 'none',
              background: 'transparent',
              color: 'var(--text-muted)',
              fontSize: 20,
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            ×
          </button>
        </div>

        {/* Тело */}
        <div style={{ padding: 20, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {loading ? (
            <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Загрузка...</div>
          ) : (
            <>
              {/* Сведения об источнике (письмо) */}
              {doc?.source === 'email' && (doc.emailFrom || doc.emailSubject) && (
                <div style={{ padding: 12, borderRadius: 10, background: 'var(--bg-input)', fontSize: 12, color: 'var(--text-secondary)' }}>
                  Получено по почте{doc.emailFrom ? ` от ${doc.emailFrom}` : ''}
                  {doc.emailSubject ? ` · «${doc.emailSubject}»` : ''}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 }}>
                <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Тип
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} style={{ ...inputStyle, marginTop: 4 }}>
                  {Object.entries(DOC_TYPE_LABELS).map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </label>
                <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Направление
                  <select value={form.direction} onChange={(e) => setForm({ ...form, direction: e.target.value })} style={{ ...inputStyle, marginTop: 4 }}>
                    {Object.entries(DIRECTION_LABELS).map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </label>
                <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Статус
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} style={{ ...inputStyle, marginTop: 4 }}>
                    {Object.entries(DOC_STATUS_LABELS).map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 }}>
                <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Номер
                  <input value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} style={{ ...inputStyle, marginTop: 4 }} />
                </label>
                <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Дата
                  <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} style={{ ...inputStyle, marginTop: 4 }} />
                </label>
                <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Сумма
                  <input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} style={{ ...inputStyle, marginTop: 4 }} />
                </label>
                <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  НДС
                  <input type="number" step="0.01" value={form.vat} onChange={(e) => setForm({ ...form, vat: e.target.value })} style={{ ...inputStyle, marginTop: 4 }} />
                </label>
                <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Валюта
                  <input value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} style={{ ...inputStyle, marginTop: 4 }} />
                </label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
                <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Контрагент
                  <input value={form.counterpartyName} onChange={(e) => setForm({ ...form, counterpartyName: e.target.value })} style={{ ...inputStyle, marginTop: 4 }} />
                </label>
                <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  ИНН контрагента
                  <input value={form.counterpartyInn} onChange={(e) => setForm({ ...form, counterpartyInn: e.target.value })} style={{ ...inputStyle, marginTop: 4 }} />
                </label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
                <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Контакт
                  <select value={form.contactId} onChange={(e) => setForm({ ...form, contactId: e.target.value })} style={{ ...inputStyle, marginTop: 4 }}>
                    <option value="">— не выбран —</option>
                    {contacts.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}{c.company ? ` (${c.company})` : ''}</option>
                    ))}
                  </select>
                </label>
                <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Задача
                  <select value={form.taskId} onChange={(e) => setForm({ ...form, taskId: e.target.value })} style={{ ...inputStyle, marginTop: 4 }}>
                    <option value="">— не привязан —</option>
                    {tasks.map((t) => (
                      <option key={t.id} value={t.id}>{t.ticketNumber ? `#${t.ticketNumber} ` : ''}{t.title}</option>
                    ))}
                  </select>
                </label>
                <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Сделка
                  <select value={form.dealId} onChange={(e) => setForm({ ...form, dealId: e.target.value })} style={{ ...inputStyle, marginTop: 4 }}>
                    <option value="">— не привязан —</option>
                    {deals.map((d) => (
                      <option key={d.id} value={d.id}>{d.title}</option>
                    ))}
                  </select>
                </label>
              </div>

              {/* Фискальные данные чека */}
              {doc && (doc.fiscalFn || doc.fiscalFd || doc.fiscalFp) && (
                <div style={{ padding: 12, borderRadius: 10, background: 'var(--bg-input)', fontSize: 12, color: 'var(--text-secondary)' }}>
                  Фискальные данные: ФН {doc.fiscalFn || '—'} · ФД {doc.fiscalFd || '—'} · ФП {doc.fiscalFp || '—'}
                </div>
              )}

              {/* Связанная банковская операция */}
              {doc?.matchedPayment && (
                <div style={{ padding: 12, borderRadius: 10, background: 'var(--bg-input)', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 200, fontSize: 12, color: 'var(--text-secondary)' }}>
                    Связан с операцией: {fmtDate(doc.matchedPayment.date)} · {fmtMoney(doc.matchedPayment.amount)}
                    {doc.matchedPayment.counterpartyName ? ` · ${doc.matchedPayment.counterpartyName}` : ''}
                    {doc.matchedPayment.purpose ? ` · ${doc.matchedPayment.purpose}` : ''}
                  </div>
                  <button onClick={handleUnmatch} style={{ ...btnSmall, color: '#dc2626' }}>
                    Разорвать связь
                  </button>
                </div>
              )}

              {isEdit && canResetMatch && (
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.ignored} onChange={(e) => setForm({ ...form, ignored: e.target.checked })} />
                  Игнорировать при сверке с банком
                </label>
              )}

              <div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Заметки</div>
                <ReactQuill
                  theme="snow"
                  value={form.notes}
                  onChange={(value) => setForm({ ...form, notes: value })}
                  placeholder="Заметки по документу"
                  modules={quillModules}
                  formats={quillFormats}
                />
              </div>

              {/* Вложения */}
              {isEdit && doc && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Вложения ({attachments.length})</div>
                    <label style={{ ...btnSmall, display: 'inline-block' }}>
                      {uploading ? 'Загрузка...' : '+ Файл'}
                      <input type="file" multiple onChange={handleUpload} style={{ display: 'none' }} disabled={uploading} />
                    </label>
                  </div>
                  {attachments.length === 0 ? (
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Нет вложений</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {attachments.map((a) => (
                        <div
                          key={a.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '6px 10px',
                            borderRadius: 8,
                            background: 'var(--bg-input)',
                          }}
                        >
                          <span style={{ fontSize: 14 }}>{a.mimeType?.startsWith('image/') ? '🖼' : '📎'}</span>
                          <a
                            href={`${origin}/api/uploads/${a.id}/download`}
                            download={a.originalName}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              flex: 1,
                              minWidth: 0,
                              fontSize: 13,
                              color: 'var(--text-primary)',
                              textDecoration: 'none',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {a.originalName}
                          </a>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                            {(a.size / 1024).toFixed(1)} KB
                          </span>
                          <button onClick={() => handleDeleteAttachment(a.id)} title="Удалить" style={{ ...btnSmall, color: '#dc2626', padding: '2px 8px' }}>
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Подвал */}
        <div
          style={{
            display: 'flex',
            gap: 8,
            justifyContent: 'space-between',
            padding: '14px 20px',
            borderTop: '1px solid var(--border-color)',
            flexShrink: 0,
          }}
        >
          <div>
            {isEdit && (
              <button onClick={handleDelete} style={{ ...btnSecondary, color: '#dc2626' }}>
                Удалить
              </button>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onClose} style={btnSecondary}>
              Отмена
            </button>
            <button onClick={handleSave} disabled={saving || loading} style={btnPrimary}>
              {saving ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
