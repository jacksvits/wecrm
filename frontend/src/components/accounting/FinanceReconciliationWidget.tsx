import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { BankPayment, ReconciliationResponse } from '../../types';
import { DocTypeBadge, fmtMoney, fmtDate, btnSmall, btnPrimary } from './shared';

// Виджет «Сверка с банком» для страницы Директора
export function FinanceReconciliationWidget() {
  const [data, setData] = useState<ReconciliationResponse | null>(null);
  const [matched, setMatched] = useState<BankPayment[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [autoRunning, setAutoRunning] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [rec, pairs] = await Promise.all([
        api.accounting.reconciliation(),
        api.accounting.bankPayments({ matched: 'yes', limit: 50 }),
      ]);
      setData(rec);
      setMatched(pairs.items || []);
    } catch (err: any) {
      console.error('Ошибка загрузки сверки:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await api.accounting.bankSync();
      alert(`Синхронизация завершена: получено ${res.synced}, новых ${res.new}`);
      await load();
    } catch (err: any) {
      alert(err.message || 'Ошибка синхронизации выписки');
    } finally {
      setSyncing(false);
    }
  };

  const handleAuto = async () => {
    setAutoRunning(true);
    try {
      const res = await api.accounting.reconciliationAuto();
      alert(`Автосверка: связано документов — ${res.matched}`);
      await load();
    } catch (err: any) {
      alert(err.message || 'Ошибка автосверки');
    } finally {
      setAutoRunning(false);
    }
  };

  const handleMatch = async (documentId: string, paymentId: string) => {
    try {
      await api.accounting.reconciliationMatch(documentId, paymentId);
      await load();
    } catch (err: any) {
      alert(err.message || 'Ошибка связывания');
    }
  };

  const handleUnmatch = async (documentId: string) => {
    if (!confirm('Разорвать связь документа с операцией?')) return;
    try {
      await api.accounting.reconciliationUnmatch(documentId);
      await load();
    } catch (err: any) {
      alert(err.message || 'Ошибка');
    }
  };

  const docs = data?.unmatchedDocuments || [];
  const payments = data?.unmatchedPayments || [];

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, gap: 8, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 15, fontWeight: 500 }}>Сверка с банком</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={handleSync} disabled={syncing} style={btnPrimary}>
            {syncing ? 'Синхронизация...' : 'Синхронизировать выписку'}
          </button>
          <button onClick={handleAuto} disabled={autoRunning} style={btnSmall}>
            {autoRunning ? 'Сверка...' : 'Автосверка'}
          </button>
        </div>
      </div>

      {loading && !data ? (
        <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Загрузка...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Несверённые документы с подсказками */}
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>
              Несверённые документы ({docs.length})
            </div>
            {docs.length === 0 ? (
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Все документы свёрнуты</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 300, overflow: 'auto' }}>
                {docs.map((d) => (
                  <div key={d.id} style={{ padding: '10px 12px', borderRadius: 10, background: 'var(--bg-input)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <DocTypeBadge type={d.type} />
                      <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', flex: 1, minWidth: 120 }}>
                        {d.number ? `№ ${d.number}` : 'Без номера'} · {fmtDate(d.date)} · {d.counterpartyName || '—'}
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: d.direction === 'incoming' ? '#166534' : '#991b1b', whiteSpace: 'nowrap' }}>
                        {d.direction === 'incoming' ? '+' : '−'}{fmtMoney(d.amount)}
                      </span>
                    </div>
                    {(d.suggestions || []).length > 0 && (
                      <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {d.suggestions!.map((p) => (
                          <div
                            key={p.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              padding: '6px 10px',
                              borderRadius: 8,
                              background: 'var(--bg-card)',
                              border: '1px solid var(--border-color)',
                              flexWrap: 'wrap',
                            }}
                          >
                            <span style={{ fontSize: 12, color: 'var(--text-secondary)', flex: 1, minWidth: 160 }}>
                              {fmtDate(p.date)} · {fmtMoney(p.amount)} · {p.counterpartyName || '—'}
                              {p.purpose ? ` · ${p.purpose.slice(0, 60)}` : ''}
                            </span>
                            <button onClick={() => handleMatch(d.id, p.id)} style={btnSmall}>
                              Связать
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Несверённые платежи */}
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>
              Несверённые банковские операции ({payments.length})
            </div>
            {payments.length === 0 ? (
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Нет несвязанных операций</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 220, overflow: 'auto' }}>
                {payments.map((p) => (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 10, background: 'var(--bg-input)', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)', flex: 1, minWidth: 160 }}>
                      {fmtDate(p.date)} · {p.counterpartyName || '—'}
                      {p.purpose ? ` · ${p.purpose.slice(0, 80)}` : ''}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: p.direction === 'credit' ? '#166534' : '#991b1b', whiteSpace: 'nowrap' }}>
                      {p.direction === 'credit' ? '+' : '−'}{fmtMoney(p.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Связанные пары (можно разорвать) */}
          {matched.length > 0 && (
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>
                Связанные пары ({matched.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 220, overflow: 'auto' }}>
                {matched.map((p) => (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 10, background: 'var(--bg-input)', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)', flex: 1, minWidth: 160 }}>
                      {fmtDate(p.date)} · {fmtMoney(p.amount)} · {p.counterpartyName || '—'}
                      {p.matchedDocument ? ` → документ ${p.matchedDocument.number ? `№ ${p.matchedDocument.number}` : p.matchedDocument.id.slice(0, 8)}` : ''}
                    </span>
                    {p.matchedDocumentId && (
                      <button onClick={() => handleUnmatch(p.matchedDocumentId!)} style={{ ...btnSmall, color: '#dc2626' }}>
                        Разорвать
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
