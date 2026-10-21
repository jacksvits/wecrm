import { useEffect, useMemo, useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { api } from '../api/client';
import { ClientDevice } from '../types';
import { useAuth } from '../context/AuthContext';
import { formatDateTime } from '../lib/formatDate';

const quillModules = {
  toolbar: [[{ header: [false, 3, 4] }], ['bold', 'italic', 'underline', 'strike'], [{ list: 'ordered' }, { list: 'bullet' }], ['link'], ['clean']],
};
const quillFormats = ['header', 'bold', 'italic', 'underline', 'strike', 'list', 'bullet', 'link'];

function onlineDot(isOnline?: boolean) {
  return (
    <span
      title={isOnline ? 'Включено' : 'Выключено'}
      style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: isOnline ? '#2e7d32' : '#bdbdbd', flexShrink: 0 }}
    />
  );
}

function lastSeenText(d: ClientDevice): string {
  if (!d.lastSeenAt) return '—';
  return formatDateTime(d.lastSeenAt);
}

function ramText(mb?: number): string {
  if (!mb) return '—';
  return mb >= 1024 ? `${(mb / 1024).toFixed(1).replace('.', ',')} ГБ` : `${mb} МБ`;
}

function disksText(disks?: ClientDevice['disks']): string {
  if (!disks || disks.length === 0) return '—';
  return disks.map((x) => `${x.model || 'Диск'} (${x.sizeGb} ГБ, своб. ${x.freeGb} ГБ)`).join('; ');
}

export function ContactDevices({ contactId }: { contactId: string }) {
  const { user } = useAuth();
  const [devices, setDevices] = useState<ClientDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [commentDraft, setCommentDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const canEdit = user?.role === 'admin' || user?.role === 'manager';

  const load = () => {
    setLoading(true);
    api.clientDevices.list(contactId).then(setDevices).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(load, [contactId]);

  const onlineCount = useMemo(() => devices.filter((d) => d.isOnline).length, [devices]);

  const saveComment = async (id: string) => {
    setSaving(true);
    try {
      const updated = await api.clientDevices.update(id, { comment: commentDraft });
      setDevices((prev) => prev.map((d) => (d.id === id ? { ...updated, isOnline: d.isOnline } : d)));
      setEditingComment(null);
    } catch { /* ошибка показывается глобальным обработчиком fetchApi */ }
    setSaving(false);
  };

  const remove = async (id: string) => {
    if (!window.confirm('Удалить устройство? Агент создаст его заново при следующем отчёте.')) return;
    try {
      await api.clientDevices.delete(id);
      setDevices((prev) => prev.filter((d) => d.id !== id));
    } catch { /* ignore */ }
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Загрузка...</div>;

  if (devices.length === 0) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
        Устройств пока нет. Скачайте WeAGENT у контакта-сотрудника (поле «ID для агента» → «Скачать агента») — компьютер появится здесь автоматически.
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
        Устройств: {devices.length} · Включено: {onlineCount}
      </div>
      {devices.map((d) => (
        <div key={d.id} style={{ border: '1px solid var(--border-color)', borderRadius: 12, background: 'var(--bg-card)', padding: '14px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {onlineDot(d.isOnline)}
            <strong style={{ fontSize: 15 }}>{d.hostname}</strong>
            {d.contact?.name && (
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }} title="Владелец устройства">
                👤 {d.contact.name}
              </span>
            )}
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {d.osCaption || 'Windows'} {d.osVersion && `(${d.osVersion})`}
            </span>
            <span style={{ fontSize: 12, color: d.isOnline ? '#2e7d32' : '#999' }}>
              {d.isOnline ? 'Включено' : `Выключено · было ${lastSeenText(d)}`}
            </span>
            <span style={{ flex: 1 }} />
            <button onClick={() => setExpanded(expanded === d.id ? null : d.id)} style={{ padding: '6px 12px', borderRadius: 10, border: '1px solid var(--border-color)', background: 'transparent', cursor: 'pointer', fontSize: 13 }}>
              {expanded === d.id ? 'Свернуть' : 'Подробнее'}
            </button>
            {canEdit && (
              <button onClick={() => remove(d.id)} style={{ padding: '6px 12px', borderRadius: 10, border: '1px solid #e0a0a0', background: 'transparent', color: '#c62828', cursor: 'pointer', fontSize: 13 }}>Удалить</button>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '8px 24px', marginTop: 10, fontSize: 13 }}>
            <div><span style={{ color: 'var(--text-muted)' }}>Пользователь: </span>{d.username || '—'}</div>
            <div><span style={{ color: 'var(--text-muted)' }}>IP: </span>{d.ipAddress || '—'}</div>
            <div><span style={{ color: 'var(--text-muted)' }}>MAC: </span>{d.macAddress || '—'}</div>
            <div><span style={{ color: 'var(--text-muted)' }}>CPU: </span>{d.cpu || '—'}{d.cpuCores ? ` (${d.cpuCores}/${d.cpuThreads || d.cpuCores})` : ''}</div>
            <div><span style={{ color: 'var(--text-muted)' }}>ОЗУ: </span>{ramText(d.ramTotalMb)}</div>
            <div><span style={{ color: 'var(--text-muted)' }}>GPU: </span>{d.gpu || '—'}</div>
          </div>

          {expanded === d.id && (
            <div style={{ marginTop: 12, borderTop: '1px solid var(--border-color)', paddingTop: 12, fontSize: 13 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '8px 24px' }}>
                <div><span style={{ color: 'var(--text-muted)' }}>Производитель: </span>{d.manufacturer || '—'}</div>
                <div><span style={{ color: 'var(--text-muted)' }}>Модель: </span>{d.model || '—'}</div>
                <div><span style={{ color: 'var(--text-muted)' }}>Серийный номер: </span>{d.serialNumber || '—'}</div>
                <div><span style={{ color: 'var(--text-muted)' }}>Рабочая группа: </span>{d.workgroup || '—'}</div>
                <div><span style={{ color: 'var(--text-muted)' }}>Сборка ОС: </span>{d.osBuild || '—'}</div>
                <div><span style={{ color: 'var(--text-muted)' }}>Разрядность: </span>{d.osArch || '—'}</div>
                <div><span style={{ color: 'var(--text-muted)' }}>Установлена ОС: </span>{d.osInstallDate ? formatDateTime(d.osInstallDate) : '—'}</div>
                <div><span style={{ color: 'var(--text-muted)' }}>Последняя загрузка: </span>{d.lastBootAt ? formatDateTime(d.lastBootAt) : '—'}</div>
                <div style={{ gridColumn: '1 / -1' }}><span style={{ color: 'var(--text-muted)' }}>Диски: </span>{disksText(d.disks)}</div>
                <div><span style={{ color: 'var(--text-muted)' }}>Агент: </span>{d.agentVersion || '—'}</div>
                <div><span style={{ color: 'var(--text-muted)' }}>Первый отчёт: </span>{d.firstSeenAt ? formatDateTime(d.firstSeenAt) : '—'}</div>
              </div>

              <h4 style={{ margin: '14px 0 6px', fontSize: 13 }}>Диспетчер устройств ({d.pnpDevices?.length || 0})</h4>
              <div style={{ maxHeight: 320, overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: 8 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ textAlign: 'left', color: 'var(--text-muted)', position: 'sticky', top: 0, background: 'var(--bg-card)' }}>
                      <th style={{ padding: '6px 10px', borderBottom: '1px solid var(--border-color)' }}>Класс</th>
                      <th style={{ padding: '6px 10px', borderBottom: '1px solid var(--border-color)' }}>Устройство</th>
                      <th style={{ padding: '6px 10px', borderBottom: '1px solid var(--border-color)' }}>Производитель</th>
                      <th style={{ padding: '6px 10px', borderBottom: '1px solid var(--border-color)' }}>Статус</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(d.pnpDevices || []).map((p, idx) => (
                      <tr key={idx} title={p.deviceId}>
                        <td style={{ padding: '5px 10px', borderBottom: '1px solid #f0f0f0', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{p.class || '—'}</td>
                        <td style={{ padding: '5px 10px', borderBottom: '1px solid #f0f0f0' }}>{p.name || '—'}</td>
                        <td style={{ padding: '5px 10px', borderBottom: '1px solid #f0f0f0' }}>{p.manufacturer || '—'}</td>
                        <td style={{ padding: '5px 10px', borderBottom: '1px solid #f0f0f0', color: p.status === 'OK' || p.status === 'Error' ? (p.status === 'OK' ? '#2e7d32' : '#c62828') : 'inherit' }}>{p.status || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <h4 style={{ margin: '14px 0 6px', fontSize: 13 }}>Комментарий</h4>
              {editingComment === d.id ? (
                <div>
                  <ReactQuill theme="snow" value={commentDraft} onChange={setCommentDraft} modules={quillModules} formats={quillFormats} style={{ background: 'var(--bg-card)' }} />
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <button disabled={saving} onClick={() => saveComment(d.id)} style={{ padding: '7px 16px', borderRadius: 10, border: 'none', background: '#1565c0', color: '#fff', cursor: 'pointer', fontSize: 13 }}>
                      {saving ? 'Сохранение...' : 'Сохранить'}
                    </button>
                    <button onClick={() => setEditingComment(null)} style={{ padding: '7px 16px', borderRadius: 10, border: '1px solid var(--border-color)', background: 'transparent', cursor: 'pointer', fontSize: 13 }}>Отмена</button>
                  </div>
                </div>
              ) : (
                <div>
                  {d.comment
                    ? <div dangerouslySetInnerHTML={{ __html: d.comment }} />
                    : <span style={{ color: 'var(--text-muted)' }}>Нет комментария</span>}
                  {canEdit && (
                    <button onClick={() => { setEditingComment(d.id); setCommentDraft(d.comment || ''); }} style={{ marginTop: 6, padding: '5px 12px', borderRadius: 10, border: '1px solid var(--border-color)', background: 'transparent', cursor: 'pointer', fontSize: 12 }}>
                      ✏️ {d.comment ? 'Изменить' : 'Добавить комментарий'}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
