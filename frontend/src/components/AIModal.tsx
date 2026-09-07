import { useState } from 'react';
import { api } from '../api/client';

interface AIModalProps {
  type: 'task' | 'deal';
  onGenerate: (data: any) => void;
  onClose: () => void;
}

export function AIModal({ type, onGenerate, onClose }: AIModalProps) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!text.trim() || loading) return;
    setLoading(true);
    setError('');

    try {
      const result = type === 'task'
        ? await api.ai.generateTask(text)
        : await api.ai.generateDeal(text);
      onGenerate(result);
      onClose();
    } catch (e: any) {
      setError(e.message || 'Ошибка генерации');
    }
    setLoading(false);
  };

  const placeholder = type === 'task'
    ? 'Опишите задачу своими словами...\nНапример: "Нужно подготовить презентацию для клиента Иванова к пятнице, это срочно"'
    : 'Опишите сделку своими словами...\nНапример: "Клиент Петров хочет купить лицензию на 100 пользователей, бюджет около 500 тыс руб"';

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }} onClick={onClose}>
      <div style={{
        background: 'var(--bg-color)',
        borderRadius: 16,
        padding: 24,
        width: '90%',
        maxWidth: 560,
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }} onClick={e => e.stopPropagation()}>
        <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 600 }}>
          🤖 Создать {type === 'task' ? 'задачу' : 'сделку'} с помощью AI
        </h3>
        <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--text-muted)' }}>
          Опишите {type === 'task' ? 'задачу' : 'сделку'} своими словами — AI извлечёт все поля
        </p>

        {error && (
          <div style={{
            padding: '10px 14px',
            borderRadius: 10,
            background: '#fee2e2',
            color: '#dc2626',
            fontSize: 13,
            marginBottom: 12,
          }}>
            {error}
          </div>
        )}

        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder={placeholder}
          rows={6}
          style={{
            width: '100%',
            padding: '12px 16px',
            borderRadius: 12,
            border: '1px solid var(--border-color)',
            background: 'var(--bg-color)',
            color: 'var(--text-color)',
            fontSize: 14,
            lineHeight: 1.5,
            resize: 'vertical',
            outline: 'none',
            fontFamily: 'inherit',
            marginBottom: 16,
          }}
        />

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              borderRadius: 10,
              background: 'var(--bg-hover)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-color)',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            Отмена
          </button>
          <button
            onClick={handleGenerate}
            disabled={loading || !text.trim()}
            style={{
              padding: '10px 24px',
              borderRadius: 10,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: '#fff',
              border: 'none',
              cursor: loading || !text.trim() ? 'not-allowed' : 'pointer',
              fontSize: 14,
              fontWeight: 600,
              opacity: loading || !text.trim() ? 0.5 : 1,
            }}
          >
            {loading ? 'Генерация...' : 'Создать'}
          </button>
        </div>
      </div>
    </div>
  );
}
