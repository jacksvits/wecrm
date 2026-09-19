import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { AccountingAnalytics } from '../../types';
import { DOC_TYPE_LABELS, fmtMoney, btnSmall, inputStyle } from './shared';

type Period = 'month' | 'quarter' | 'year' | 'all';

const PERIOD_LABELS: Record<Period, string> = {
  month: 'Месяц',
  quarter: 'Квартал',
  year: 'Год',
  all: 'Всё время',
};

function periodRange(p: Period): { from?: string; to?: string } {
  if (p === 'all') return {};
  const now = new Date();
  const to = now.toISOString().slice(0, 10);
  const from = new Date(now);
  if (p === 'month') from.setMonth(from.getMonth() - 1);
  else if (p === 'quarter') from.setMonth(from.getMonth() - 3);
  else from.setFullYear(from.getFullYear() - 1);
  return { from: from.toISOString().slice(0, 10), to };
}

// Виджет «Аналитика бухгалтерии» для страницы Директора (div-бары, без chart-библиотек)
export function FinanceAnalyticsWidget() {
  const [period, setPeriod] = useState<Period>('quarter');
  const [data, setData] = useState<AccountingAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      setData(await api.accounting.analytics(periodRange(period)));
    } catch (err: any) {
      console.error('Ошибка загрузки аналитики:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [period]);

  const handleExport = async () => {
    setExporting(true);
    try {
      await api.accounting.exportExcel(periodRange(period));
    } catch (err: any) {
      alert(err.message || 'Ошибка экспорта');
    } finally {
      setExporting(false);
    }
  };

  const t = data?.totals;
  const diff = (t?.incoming || 0) - (t?.outgoing || 0);
  const maxMonth = Math.max(1, ...(t?.byMonth || []).map((m) => Math.max(m.incoming, m.outgoing)));

  const statCard = (label: string, value: string, color: string) => (
    <div style={{ padding: 12, borderRadius: 10, background: 'var(--bg-input)' }}>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 700, color }}>{value}</div>
    </div>
  );

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, gap: 8, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 15, fontWeight: 500 }}>Аналитика бухгалтерии</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <select value={period} onChange={(e) => setPeriod(e.target.value as Period)} style={{ ...inputStyle, width: 'auto', padding: '6px 10px' }}>
            {Object.entries(PERIOD_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
          <button onClick={handleExport} disabled={exporting} style={btnSmall}>
            {exporting ? 'Экспорт...' : 'Экспорт Excel'}
          </button>
        </div>
      </div>

      {loading && !data ? (
        <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Загрузка...</div>
      ) : !t ? (
        <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Нет данных</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Stat-карточки */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 8 }}>
            {statCard('Приход', fmtMoney(t.incoming), '#166534')}
            {statCard('Расход', fmtMoney(t.outgoing), '#991b1b')}
            {statCard('Разница', fmtMoney(diff), diff >= 0 ? '#10b981' : '#dc2626')}
            {statCard('Несверено', `${t.unmatchedCount} · ${fmtMoney(t.unmatchedSum)}`, '#b45309')}
          </div>

          {/* Горизонтальные div-бары по месяцам */}
          {t.byMonth.length > 0 && (
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>По месяцам</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 220, overflow: 'auto' }}>
                {t.byMonth.map((m) => (
                  <div key={m.month} style={{ display: 'grid', gridTemplateColumns: '64px 1fr', gap: 8, alignItems: 'center' }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{m.month}</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ height: 8, borderRadius: 4, background: '#166534', width: `${Math.max(2, (m.incoming / maxMonth) * 100)}%`, minWidth: 2 }} />
                        <span style={{ fontSize: 10, color: '#166534', whiteSpace: 'nowrap' }}>{fmtMoney(m.incoming)}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ height: 8, borderRadius: 4, background: '#991b1b', width: `${Math.max(2, (m.outgoing / maxMonth) * 100)}%`, minWidth: 2 }} />
                        <span style={{ fontSize: 10, color: '#991b1b', whiteSpace: 'nowrap' }}>{fmtMoney(m.outgoing)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* По типам документов */}
          {t.byType.length > 0 && (
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>По типам</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {t.byType.map((x) => (
                  <span
                    key={`${x.type}-${x.direction}`}
                    style={{ padding: '4px 10px', borderRadius: 8, background: 'var(--bg-input)', fontSize: 12, color: 'var(--text-secondary)' }}
                  >
                    {DOC_TYPE_LABELS[x.type] || x.type} ({x.direction === 'incoming' ? 'вх.' : 'исх.'}): {fmtMoney(x.sum)} · {x.count} шт.
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Топ контрагентов */}
          {t.byCounterparty.length > 0 && (
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>Топ контрагентов</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 180, overflow: 'auto' }}>
                {t.byCounterparty.slice(0, 10).map((c, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, padding: '6px 10px', borderRadius: 8, background: 'var(--bg-input)' }}>
                    <span style={{ fontSize: 12, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.name || '—'} <span style={{ color: 'var(--text-muted)' }}>· {c.count} док.</span>
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>{fmtMoney(c.sum)}</span>
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
