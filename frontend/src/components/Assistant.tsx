import { useState, useRef, useEffect } from 'react';
import { api } from '../api/client';
import { linkifyTaskTagsHtml, useTaskHashtagClick } from '../lib/taskHashtags';


interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  type?: 'text' | 'image';
}

interface OllamaModel {
  name: string;
  size: number;
  modified_at: string;
  parameter_size: string;
  family: string;
}

export function Assistant() {
  const onTagClick = useTaskHashtagClick();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [error, setError] = useState('');
  const [models, setModels] = useState<OllamaModel[]>([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [modelsLoading, setModelsLoading] = useState(true);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Загружаем список моделей и историю диалога при монтировании
  useEffect(() => {
    loadModels();
    api.assistant.getHistory().then((data: any) => {
      if (data.messages?.length) {
        setMessages(data.messages.map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp || Date.now()),
        })));
      }
      setHistoryLoaded(true);
    }).catch(() => setHistoryLoaded(true));
  }, []);

  const loadModels = async () => {
    try {
      const data = await api.assistant.models();
      setModels(data.models || []);
      setSelectedModel(data.default || (data.models[0]?.name ?? ''));
    } catch (e: any) {
      console.error('Ошибка загрузки моделей:', e);
      setError('Не удалось загрузить список моделей');
    } finally {
      setModelsLoading(false);
    }
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { role: 'user', content: text, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setError('');

    try {
      const history = [...messages, userMsg].map(m => ({ role: m.role, content: m.content }));
      const res = await api.assistant.chat(history, selectedModel);
      const assistantMsg: Message = { role: 'assistant', content: res.text, timestamp: new Date() };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (e: any) {
      setError(e.message || 'Ошибка при обращении к ИИ');
    }
    setLoading(false);
  };

  const handleGenerateImage = async () => {
    const text = input.trim();
    if (!text || imageLoading) return;

    const userMsg: Message = { role: 'user', content: text, timestamp: new Date(), type: 'text' };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setImageLoading(true);
    setError('');

    try {
      const res = await api.assistant.image(text, 1024, 1024);
      const assistantMsg: Message = { role: 'assistant', content: res.imageUrl, timestamp: new Date(), type: 'image' };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (e: any) {
      setError(e.message || 'Ошибка генерации изображения');
    }
    setImageLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Формат размера модели
  const formatSize = (bytes: number) => {
    if (bytes > 1e9) return (bytes / 1e9).toFixed(1) + ' GB';
    if (bytes > 1e6) return (bytes / 1e6).toFixed(0) + ' MB';
    return bytes + ' B';
  };

  // Auto-save dialog history (last 50 messages)
  useEffect(() => {
    if (!historyLoaded) return;
    const plainMessages = messages.map(m => ({
      role: m.role,
      content: m.content,
      type: m.type,
      timestamp: m.timestamp.toISOString(),
    }));
    api.assistant.saveHistory(plainMessages).catch(() => {});
  }, [messages, historyLoaded]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)', maxWidth: 900, margin: '0 auto' }}>
      {/* Шапка с выбором модели */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>Ассистент</h2>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>
              Чат с ИИ (локальная модель Ollama)
            </p>
          </div>

          {/* Селект выбора модели */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Модель:</span>
            <select
              value={selectedModel}
              onChange={e => setSelectedModel(e.target.value)}
              disabled={modelsLoading || loading}
              style={{
                padding: '8px 12px',
                borderRadius: 10,
                border: '1px solid var(--border-color)',
                background: 'var(--bg-color)',
                color: 'var(--text-color)',
                fontSize: 13,
                cursor: modelsLoading || loading ? 'not-allowed' : 'pointer',
                minWidth: 180,
                outline: 'none',
              }}
            >
              {modelsLoading ? (
                <option>Загрузка...</option>
              ) : models.length === 0 ? (
                <option>Нет моделей</option>
              ) : (
                models.map(m => (
                  <option key={m.name} value={m.name}>
                    {m.name} ({formatSize(m.size)})
                  </option>
                ))
              )}
            </select>
            <button
              onClick={loadModels}
              disabled={modelsLoading}
              title="Обновить список моделей"
              style={{
                padding: '8px 12px',
                borderRadius: 10,
                background: 'var(--bg-hover)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-color)',
                cursor: modelsLoading ? 'not-allowed' : 'pointer',
                fontSize: 13,
              }}
            >
              {modelsLoading ? '...' : '↻'}
            </button>
          </div>
        </div>
      </div>

      {/* Сообщения */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        borderRadius: 16,
        border: '1px solid var(--border-color)',
        background: 'var(--bg-color)',
        padding: '16px 20px',
        marginBottom: 16,
      }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40, fontSize: 14 }}>
            <p style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 500 }}>Начните диалог с ассистентом</p>
            <p style={{ margin: 0 }}>Выберите модель сверху и напишите сообщение</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} style={{
            display: 'flex',
            justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
            marginBottom: 12,
          }}>
            <div style={{
              maxWidth: '80%',
              padding: '10px 14px',
              borderRadius: 14,
              background: msg.role === 'user' ? '#007AFF' : 'var(--bg-hover)',
              color: msg.role === 'user' ? '#fff' : 'var(--text-color)',
              fontSize: 14,
              lineHeight: 1.5,
              wordBreak: 'break-word',
            }}>
              {msg.type === 'image' ? (
                <img
                  src={msg.content}
                  alt="Generated"
                  style={{
                    maxWidth: '100%',
                    maxHeight: 400,
                    borderRadius: 12,
                    cursor: 'pointer',
                  }}
                  onClick={() => window.open(msg.content, '_blank')}
                />
              ) : msg.role === 'assistant' ? (
                <div onClick={onTagClick} dangerouslySetInnerHTML={{ __html: linkifyTaskTagsHtml(msg.content) }} />
              ) : (
                msg.content
              )}
              <div style={{
                fontSize: 10,
                opacity: 0.6,
                marginTop: 4,
                textAlign: 'right',
              }}>
                {msg.timestamp.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 12 }}>
            <div style={{
              padding: '10px 14px',
              borderRadius: 14,
              background: 'var(--bg-hover)',
              color: 'var(--text-muted)',
              fontSize: 14,
            }}>
              <span style={{ display: 'inline-block', animation: 'pulse 1.4s infinite' }}>Думает</span>
              <span style={{ animation: 'pulse 1.4s infinite 0.2s', display: 'inline-block' }}>.</span>
              <span style={{ animation: 'pulse 1.4s infinite 0.4s', display: 'inline-block' }}>.</span>
              <span style={{ animation: 'pulse 1.4s infinite 0.6s', display: 'inline-block' }}>.</span>
            </div>
          </div>
        )}

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

        <div ref={bottomRef} />
      </div>

      {/* Ввод */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Введите сообщение..."
          rows={3}
          style={{
            flex: 1,
            padding: '12px 16px',
            borderRadius: 14,
            border: '1px solid var(--border-color)',
            background: 'var(--bg-color)',
            color: 'var(--text-color)',
            fontSize: 14,
            lineHeight: 1.5,
            resize: 'vertical',
            outline: 'none',
            fontFamily: 'inherit',
          }}
        />
        <button
          onClick={handleGenerateImage}
          disabled={imageLoading || !input.trim()}
          title="Сгенерировать картинку"
          style={{
            padding: '12px 16px',
            borderRadius: 14,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: '#fff',
            border: 'none',
            cursor: imageLoading || !input.trim() ? 'not-allowed' : 'pointer',
            fontSize: 14,
            fontWeight: 600,
            opacity: imageLoading || !input.trim() ? 0.5 : 1,
            height: 44,
            alignSelf: 'center',
          }}
        >
          {imageLoading ? '...' : '🎨'}
        </button>
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          style={{
            padding: '12px 24px',
            borderRadius: 14,
            background: '#007AFF',
            color: '#fff',
            border: 'none',
            cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
            fontSize: 14,
            fontWeight: 600,
            opacity: loading || !input.trim() ? 0.5 : 1,
            height: 44,
            alignSelf: 'center',
          }}
        >
          {loading ? '...' : 'Отправить'}
        </button>
      </div>
    </div>
  );
}
