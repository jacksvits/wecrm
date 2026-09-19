// Общие константы и хелперы модуля «Бухгалтерия»
import React from 'react';

export const DOC_TYPE_LABELS: Record<string, string> = {
  receipt: 'Чек',
  invoice: 'Счёт',
  act: 'Акт',
  upd: 'УПД',
  bank_notice: 'Банк. уведомление',
  other: 'Прочее',
};

export const DOC_TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  receipt: { bg: '#dcfce7', text: '#166534' },
  invoice: { bg: '#dbeafe', text: '#1e40af' },
  act: { bg: '#fef3c7', text: '#92400e' },
  upd: { bg: '#e9d5ff', text: '#6b21a8' },
  bank_notice: { bg: '#e0f2fe', text: '#0369a1' },
  other: { bg: '#f3f4f6', text: '#4b5563' },
};

export const DIRECTION_LABELS: Record<string, string> = {
  incoming: 'Входящий',
  outgoing: 'Исходящий',
};

export const DOC_STATUS_LABELS: Record<string, string> = {
  new: 'Новый',
  confirmed: 'Подтверждён',
  archived: 'Архив',
};

export const MATCH_STATUS_LABELS: Record<string, string> = {
  unmatched: 'Не свёрнут',
  auto: 'Автосверка',
  manual: 'Свёрнут вручную',
  ignored: 'Игнорируется',
};

export const MATCH_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  unmatched: { bg: '#fee2e2', text: '#991b1b' },
  auto: { bg: '#dcfce7', text: '#166534' },
  manual: { bg: '#dbeafe', text: '#1e40af' },
  ignored: { bg: '#f3f4f6', text: '#4b5563' },
};

export const fmtMoney = (n: number | null | undefined) => `${(n || 0).toLocaleString('ru')} ₽`;
export const fmtDate = (d: string | null | undefined) => (d ? new Date(d).toLocaleDateString('ru') : '—');

export function Badge({ label, colors }: { label: string; colors: { bg: string; text: string } }) {
  return (
    <span
      style={{
        padding: '2px 8px',
        borderRadius: 6,
        fontSize: 11,
        background: colors.bg,
        color: colors.text,
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  );
}

export function DocTypeBadge({ type }: { type: string }) {
  return <Badge label={DOC_TYPE_LABELS[type] || type} colors={DOC_TYPE_COLORS[type] || DOC_TYPE_COLORS.other} />;
}

export function MatchStatusBadge({ status }: { status: string }) {
  return (
    <Badge
      label={MATCH_STATUS_LABELS[status] || status}
      colors={MATCH_STATUS_COLORS[status] || MATCH_STATUS_COLORS.unmatched}
    />
  );
}

export const inputStyle: React.CSSProperties = {
  padding: 10,
  borderRadius: 12,
  border: '1px solid var(--border-color)',
  background: 'var(--bg-card)',
  color: 'var(--text-primary)',
  fontSize: 13,
  width: '100%',
  boxSizing: 'border-box',
};

export const btnPrimary: React.CSSProperties = {
  padding: '8px 16px',
  borderRadius: 12,
  border: 'none',
  background: 'var(--text-primary)',
  color: 'var(--bg-card)',
  cursor: 'pointer',
  fontSize: 13,
};

export const btnSecondary: React.CSSProperties = {
  padding: '8px 16px',
  borderRadius: 12,
  border: '1px solid var(--border-color)',
  background: 'var(--bg-card)',
  color: 'var(--text-primary)',
  cursor: 'pointer',
  fontSize: 13,
};

export const btnSmall: React.CSSProperties = {
  padding: '4px 10px',
  borderRadius: 8,
  border: '1px solid var(--border-color)',
  background: 'var(--bg-card)',
  color: 'var(--text-primary)',
  cursor: 'pointer',
  fontSize: 12,
};
