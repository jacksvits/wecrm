import { useEffect, useState } from 'react';
import { api } from '../api/client';

/**
 * Вкладка «Расписание» в настройках администратора:
 * собственные названия кнопок «Кабинеты» и «Смены» на странице расписания.
 * Если оставить стандартные значения — на странице расписания ничего не меняется.
 */
export function ScheduleSettings() {
  const [form, setForm] = useState({ roomsLabel: 'Кабинеты', shiftsLabel: 'Смены' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    api.schedule.settings.get()
      .then((s) => setForm({ roomsLabel: s.roomsLabel || 'Кабинеты', shiftsLabel: s.shiftsLabel || 'Смены' }))
      .catch((e) => console.error('Failed to load schedule settings:', e))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.roomsLabel.trim() || !form.shiftsLabel.trim()) { setMsg('Заполните названия обеих кнопок'); return; }
    setSaving(true);
    try {
      await api.schedule.settings.save({ roomsLabel: form.roomsLabel.trim(), shiftsLabel: form.shiftsLabel.trim() });
      setMsg('Настройки расписания сохранены');
      setTimeout(() => setMsg(''), 3000);
    } catch (err: any) {
      setMsg('Ошибка: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: 20, color: 'var(--text-muted)' }}>Загрузка...</div>;

  const fieldStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', borderRadius: 12, border: '1px solid var(--border-color)',
    background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: 14, outline: 'none', boxSizing: 'border-box',
  };

  return (
    <div style={{ maxWidth: 600 }}>
      {msg && (
        <div style={{ padding: 12, borderRadius: 8, background: msg.includes('Ошибка') || msg.includes('Заполните') ? '#fee2e2' : '#dcfce7', marginBottom: 16, fontSize: 14 }}>{msg}</div>
      )}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>Название кнопки «Кабинеты»</label>
          <input
            value={form.roomsLabel}
            onChange={e => setForm({ ...form, roomsLabel: e.target.value })}
            maxLength={40}
            placeholder="Кабинеты"
            style={fieldStyle}
          />
        </div>
        <div>
          <label style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>Название кнопки «Смены»</label>
          <input
            value={form.shiftsLabel}
            onChange={e => setForm({ ...form, shiftsLabel: e.target.value })}
            maxLength={40}
            placeholder="Смены"
            style={fieldStyle}
          />
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
            Названия действуют для всей организации: кнопки и заголовки окон на странице «Расписание» покажут новые названия.
          </div>
        </div>
        <button
          type='submit'
          disabled={saving}
          style={{ padding: '10px 20px', borderRadius: 12, border: 'none', background: 'var(--text-primary)', color: 'var(--bg-card)', fontSize: 14, fontWeight: 500, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1, alignSelf: 'flex-start' }}
        >
          {saving ? 'Сохранение...' : 'Сохранить'}
        </button>
      </form>
    </div>
  );
}
