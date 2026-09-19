import { useEffect, useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { api } from '../../api/client';
import { Contact, FinanceDocument } from '../../types';
import {
  DOC_TYPE_LABELS,
  DIRECTION_LABELS,
  DocTypeBadge,
  MatchStatusBadge,
  fmtMoney,
  fmtDate,
  inputStyle,
  btnPrimary,
  btnSecondary,
  btnSmall,
} from './shared';
import { FinanceDocumentModal } from './FinanceDocumentModal';

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

// Секция «Документы» во вкладке «Финансы» карточки задачи
export function TaskFinanceDocuments({ taskId }: { taskId: string }) {
  const [docs, setDocs] = useState<FinanceDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addTab, setAddTab] = useState<'create' | 'attach'>('create');
  const [openDocId, setOpenDocId] = useState<string | null>(null);

  // Форма создания
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    type: 'other',
    direction: 'incoming',
    number: '',
    date: new Date().toISOString().slice(0, 10),
    amount: '',
    vat: '',
    counterpartyName: '',
    contactId: '',
    notes: '',
  });

  // Поиск существующих документов для привязки
  const [attachSearch, setAttachSearch] = useState('');
  const [attachResults, setAttachResults] = useState<FinanceDocument[]>([]);
  const [attachLoading, setAttachLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.accounting.documents({ taskId, limit: 100 });
      setDocs(res.items || []);
    } catch (err: any) {
      console.error('Ошибка загрузки документов задачи:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    api.contacts.list().then(setContacts).catch(() => {});
  }, [taskId]);

  const handleCreate = async () => {
    setSaving(true);
    try {
      const created = await api.accounting.createDocument({
        type: form.type,
        direction: form.direction,
        number: form.number || null,
        date: form.date || undefined,
        amount: parseFloat(form.amount) || 0,
        vat: form.vat ? parseFloat(form.vat) : null,
        counterpartyName: form.counterpartyName || null,
        contactId: form.contactId || null,
        notes: form.notes || null,
      } as any);
      // Привязываем созданный документ к задаче
      await api.accounting.updateDocument(created.id, { taskId } as any);
      setShowAddModal(false);
      setForm({
        type: 'other',
        direction: 'incoming',
        number: '',
        date: new Date().toISOString().slice(0, 10),
        amount: '',
        vat: '',
        counterpartyName: '',
        contactId: '',
        notes: '',
      });
      await load();
    } catch (err: any) {
      alert(err.message || 'Ошибка создания документа');
    } finally {
      setSaving(false);
    }
  };

  const searchAttach = async (q: string) => {
    setAttachLoading(true);
    try {
      const res = await api.accounting.documents({ search: q || undefined, limit: 50 });
      // Среди результатов — только не привязанные к задачам
      setAttachResults((res.items || []).filter((d) => !d.taskId));
    } catch (err: any) {
      console.error('Ошибка поиска документов:', err);
    } finally {
      setAttachLoading(false);
    }
  };

  const handleAttach = async (docId: string) => {
    try {
      await api.accounting.updateDocument(docId, { taskId } as any);
      setShowAddModal(false);
      await load();
    } catch (err: any) {
      alert(err.message || 'Ошибка привязки');
    }
  };

  const handleDetach = async (docId: string) => {
    if (!confirm('Отвязать документ от задачи?')) return;
    try {
      await api.accounting.updateDocument(docId, { taskId: null } as any);
      await load();
    } catch (err: any) {
      alert(err.message || 'Ошибка отвязки');
    }
  };

  return (
    <div
      style={{
        padding: 24,
        borderRadius: 16,
        border: '1px solid var(--border-color)',
        background: 'var(--bg-card)',
        boxShadow: 'var(--shadow)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h3 style={{ margin: 0, fontSize: 16, color: 'var(--text-primary)' }}>Документы</h3>
        <button
          onClick={() => {
            setShowAddModal(true);
            setAddTab('create');
          }}
          style={{
            padding: '6px 12px',
            borderRadius: 10,
            border: 'none',
            background: 'var(--text-primary)',
            color: 'var(--bg-card)',
            cursor: 'pointer',
            fontSize: 13,
          }}
        >
          + Документ
        </button>
      </div>

      {loading ? (
        <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Загрузка...</div>
      ) : docs.length === 0 ? (
        <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Нет документов</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {docs.map((d) => (
            <div
              key={d.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 10,
                padding: '10px 12px',
                borderRadius: 10,
                background: 'var(--bg-input)',
                flexWrap: 'wrap',
              }}
            >
              <div
                style={{ flex: 1, minWidth: 160, cursor: 'pointer' }}
                onClick={() => setOpenDocId(d.id)}
                title="Открыть карточку документа"
              >
                <div style={{ fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <DocTypeBadge type={d.type} />
                  <span style={{ color: 'var(--text-primary)' }}>
                    {d.number ? `№ ${d.number}` : 'Без номера'}
                  </span>
                  <span style={{ color: d.direction === 'incoming' ? '#166534' : '#991b1b', fontWeight: 600 }}>
                    {d.direction === 'incoming' ? '+' : '−'}{fmtMoney(d.amount)}
                  </span>
                  <MatchStatusBadge status={d.matchStatus} />
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                  {fmtDate(d.date)}
                  {d.counterpartyName ? ` · ${d.counterpartyName}` : ''}
                  {(d.attachments?.length || 0) > 0 ? ` · 📎 ${d.attachments!.length}` : ''}
                </div>
              </div>
              <button
                onClick={() => handleDetach(d.id)}
                title="Отвязать от задачи"
                style={{ ...btnSmall, color: '#dc2626', flexShrink: 0 }}
              >
                Отвязать
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Модалка «+ Документ»: создание или привязка существующего */}
      {showAddModal && (
        <div
          onClick={() => setShowAddModal(false)}
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
              maxWidth: 640,
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '16px 20px', borderBottom: '1px solid var(--border-color)' }}>
              <div style={{ flex: 1, fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>Документ к задаче</div>
              <button
                onClick={() => setShowAddModal(false)}
                style={{ width: 36, height: 36, borderRadius: 10, border: 'none', background: 'transparent', color: 'var(--text-muted)', fontSize: 20, cursor: 'pointer' }}
              >
                ×
              </button>
            </div>
            <div style={{ display: 'flex', gap: 8, padding: '12px 20px 0' }}>
              {(['create', 'attach'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    setAddTab(t);
                    if (t === 'attach') searchAttach(attachSearch);
                  }}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 10,
                    border: 'none',
                    background: addTab === t ? 'var(--text-primary)' : 'var(--bg-input)',
                    color: addTab === t ? 'var(--bg-card)' : 'var(--text-secondary)',
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
                >
                  {t === 'create' ? 'Создать' : 'Привязать существующий'}
                </button>
              ))}
            </div>

            <div style={{ padding: 20, overflowY: 'auto' }}>
              {addTab === 'create' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
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
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
                    <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      Контрагент
                      <input value={form.counterpartyName} onChange={(e) => setForm({ ...form, counterpartyName: e.target.value })} style={{ ...inputStyle, marginTop: 4 }} />
                    </label>
                    <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      Контакт
                      <select value={form.contactId} onChange={(e) => setForm({ ...form, contactId: e.target.value })} style={{ ...inputStyle, marginTop: 4 }}>
                        <option value="">— не выбран —</option>
                        {contacts.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}{c.company ? ` (${c.company})` : ''}</option>
                        ))}
                      </select>
                    </label>
                  </div>
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
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button onClick={() => setShowAddModal(false)} style={btnSecondary}>
                      Отмена
                    </button>
                    <button onClick={handleCreate} disabled={saving} style={btnPrimary}>
                      {saving ? 'Создание...' : 'Создать и привязать'}
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      value={attachSearch}
                      onChange={(e) => setAttachSearch(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') searchAttach(attachSearch); }}
                      placeholder="Поиск по номеру, контрагенту, теме письма..."
                      style={{ ...inputStyle, flex: 1 }}
                    />
                    <button onClick={() => searchAttach(attachSearch)} style={btnSecondary}>
                      Найти
                    </button>
                  </div>
                  {attachLoading ? (
                    <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Поиск...</div>
                  ) : attachResults.length === 0 ? (
                    <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Свободных документов не найдено</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 320, overflow: 'auto' }}>
                      {attachResults.map((d) => (
                        <div
                          key={d.id}
                          onClick={() => handleAttach(d.id)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '8px 12px',
                            borderRadius: 10,
                            background: 'var(--bg-input)',
                            cursor: 'pointer',
                            flexWrap: 'wrap',
                          }}
                          title="Привязать к задаче"
                        >
                          <DocTypeBadge type={d.type} />
                          <span style={{ fontSize: 13, color: 'var(--text-primary)', flex: 1, minWidth: 120 }}>
                            {d.number ? `№ ${d.number}` : 'Без номера'} · {fmtDate(d.date)} · {d.counterpartyName || '—'}
                          </span>
                          <span style={{ fontSize: 13, fontWeight: 600, color: d.direction === 'incoming' ? '#166534' : '#991b1b' }}>
                            {fmtMoney(d.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Карточка документа (просмотр/редактирование) */}
      {openDocId && (
        <FinanceDocumentModal
          documentId={openDocId}
          onClose={() => setOpenDocId(null)}
          onSaved={() => load()}
          onDeleted={() => load()}
        />
      )}
    </div>
  );
}
