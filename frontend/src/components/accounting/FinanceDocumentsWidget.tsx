import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { FinanceDocument } from '../../types';
import {
  DOC_TYPE_LABELS,
  DIRECTION_LABELS,
  MATCH_STATUS_LABELS,
  DocTypeBadge,
  MatchStatusBadge,
  fmtMoney,
  fmtDate,
  inputStyle,
  btnSmall,
} from './shared';
import { FinanceDocumentModal } from './FinanceDocumentModal';

const PAGE_SIZE = 20;

// Виджет «Финансовые документы» для страницы Директора
export function FinanceDocumentsWidget() {
  const [items, setItems] = useState<FinanceDocument[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState('');
  const [direction, setDirection] = useState('');
  const [matchStatus, setMatchStatus] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [openDocId, setOpenDocId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.accounting.documents({
        type: type || undefined,
        direction: direction || undefined,
        matchStatus: matchStatus || undefined,
        search: search || undefined,
        page,
        limit: PAGE_SIZE,
      });
      setItems(res.items || []);
      setTotal(res.total || 0);
    } catch (err: any) {
      console.error('Ошибка загрузки документов:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [type, direction, matchStatus, search, page]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ fontSize: 15, fontWeight: 500 }}>Финансовые документы ({total})</div>
        <button onClick={() => setShowCreate(true)} style={btnSmall}>
          + Документ
        </button>
      </div>

      {/* Фильтры */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <select value={type} onChange={(e) => { setType(e.target.value); setPage(1); }} style={{ ...inputStyle, width: 'auto', padding: '6px 10px' }}>
          <option value="">Все типы</option>
          {Object.entries(DOC_TYPE_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        <select value={direction} onChange={(e) => { setDirection(e.target.value); setPage(1); }} style={{ ...inputStyle, width: 'auto', padding: '6px 10px' }}>
          <option value="">Входящие и исходящие</option>
          {Object.entries(DIRECTION_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        <select value={matchStatus} onChange={(e) => { setMatchStatus(e.target.value); setPage(1); }} style={{ ...inputStyle, width: 'auto', padding: '6px 10px' }}>
          <option value="">Любая сверка</option>
          {Object.entries(MATCH_STATUS_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { setSearch(searchInput); setPage(1); } }}
          placeholder="Номер, контрагент, тема..."
          style={{ ...inputStyle, flex: 1, minWidth: 140, padding: '6px 10px' }}
        />
        <button onClick={() => { setSearch(searchInput); setPage(1); }} style={btnSmall}>
          Найти
        </button>
      </div>

      {/* Список */}
      {loading ? (
        <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Загрузка...</div>
      ) : items.length === 0 ? (
        <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Документы не найдены</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 420, overflow: 'auto' }}>
          {items.map((d) => (
            <div
              key={d.id}
              onClick={() => setOpenDocId(d.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 12px',
                borderRadius: 10,
                background: 'var(--bg-input)',
                cursor: 'pointer',
                flexWrap: 'wrap',
              }}
            >
              <DocTypeBadge type={d.type} />
              <div style={{ flex: 1, minWidth: 140 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>
                  {d.number ? `№ ${d.number}` : 'Без номера'} · {fmtDate(d.date)}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {d.counterpartyName || d.contact?.name || '—'}
                  {d.task ? ` · Задача #${d.task.ticketNumber || d.task.id.slice(0, 6)}` : ''}
                </div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: d.direction === 'incoming' ? '#166534' : '#991b1b', whiteSpace: 'nowrap' }}>
                {d.direction === 'incoming' ? '+' : '−'}{fmtMoney(d.amount)}
              </div>
              <MatchStatusBadge status={d.matchStatus} />
            </div>
          ))}
        </div>
      )}

      {/* Пагинация */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, justifyContent: 'center' }}>
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} style={btnSmall}>
            ←
          </button>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {page} / {totalPages}
          </span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} style={btnSmall}>
            →
          </button>
        </div>
      )}

      {(openDocId || showCreate) && (
        <FinanceDocumentModal
          documentId={openDocId}
          onClose={() => { setOpenDocId(null); setShowCreate(false); }}
          onSaved={() => load()}
          onDeleted={() => load()}
        />
      )}
    </>
  );
}
