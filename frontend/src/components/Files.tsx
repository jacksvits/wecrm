import { useEffect, useState } from 'react';
import { api } from '../api/client';

const TABS = [
  { key: 'programs', label: 'Программы' },
  { key: 'drivers', label: 'Драйвера' },
  { key: 'documents', label: 'Документы' },
  { key: 'games', label: 'Игры' },
];

export function Files() {
  const [activeTab, setActiveTab] = useState('programs');
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [editingTab, setEditingTab] = useState<string | null>(null);
  const [editUrl, setEditUrl] = useState('');

  const load = async () => {
    try {
      const data = await (api as any).files.tabs();
      const map: Record<string, string> = {};
      data.forEach((t: any) => (map[t.tabKey] = t.url));
      setSettings(map);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const openSettings = (key: string) => {
    setEditingTab(key);
    setEditUrl(settings[key] || '');
  };

  const saveSettings = async () => {
    if (!editingTab) return;
    try {
      await (api as any).files.updateTab(editingTab, editUrl);
      setSettings(prev => ({ ...prev, [editingTab]: editUrl }));
      setEditingTab(null);
    } catch (e) {
      alert('Ошибка сохранения');
    }
  };

  const currentUrl = settings[activeTab] || '';

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 600 }}>Файлы</h2>
        </div>
        <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid var(--border-color)', position: 'relative' }}>
          {TABS.map(tab => (
            <div key={tab.key} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <button
                onClick={() => setActiveTab(tab.key)}
                style={{
                  padding: '10px 16px',
                  border: 'none',
                  background: activeTab === tab.key ? 'var(--bg-hover)' : 'transparent',
                  color: activeTab === tab.key ? '#007AFF' : 'var(--text-primary)',
                  borderBottom: activeTab === tab.key ? '2px solid #007AFF' : '2px solid transparent',
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 500,
                  borderRadius: '8px 8px 0 0',
                }}
              >
                {tab.label}
              </button>
              <button
                onClick={() => openSettings(tab.key)}
                title='Настройки'
                style={{
                  marginLeft: 2,
                  padding: '4px 6px',
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  borderRadius: 6,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
                  <circle cx='12' cy='12' r='3'></circle>
                  <path d='M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z'></path>
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Загрузка...</div>
      ) : currentUrl ? (
        <iframe
          src={currentUrl}
          style={{ flex: 1, border: '1px solid var(--border-color)', borderRadius: 12, background: '#fff' }}
          allow='fullscreen'
        />
      ) : (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📁</div>
            <div>URL для этой вкладки не настроен</div>
            <button
              onClick={() => openSettings(activeTab)}
              style={{
                marginTop: 12,
                padding: '8px 16px',
                borderRadius: 10,
                background: '#007AFF',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
                fontSize: 14,
              }}
            >
              Настроить ссылку
            </button>
          </div>
        </div>
      )}

      {editingTab && (
        <div
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setEditingTab(null)}
        >
          <div
            style={{
              background: 'var(--bg-color)',
              borderRadius: 16,
              padding: 24,
              width: '90%',
              maxWidth: 480,
              border: '1px solid var(--border-color)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 16px', fontSize: 18 }}>
              Настройки: {TABS.find(t => t.key === editingTab)?.label}
            </h3>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 14, color: 'var(--text-muted)' }}>
              URL для iframe
            </label>
            <input
              type='text'
              value={editUrl}
              onChange={e => setEditUrl(e.target.value)}
              placeholder='https://example.com'
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 10,
                border: '1px solid var(--border-color)',
                background: 'var(--bg-color)',
                color: 'var(--text-color)',
                fontSize: 14,
                outline: 'none',
                marginBottom: 20,
                boxSizing: 'border-box',
              }}
            />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setEditingTab(null)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 10,
                  background: 'var(--bg-hover)',
                  color: 'var(--text-color)',
                  border: '1px solid var(--border-color)',
                  cursor: 'pointer',
                  fontSize: 14,
                }}
              >
                Отмена
              </button>
              <button
                onClick={saveSettings}
                style={{
                  padding: '8px 16px',
                  borderRadius: 10,
                  background: '#007AFF',
                  color: '#fff',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 500,
                }}
              >
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
