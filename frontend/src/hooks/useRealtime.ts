import { useEffect, useRef, useCallback } from 'react';

const API_URL = '';
let globalEs: EventSource | null = null;
let globalChannels: string = '';
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let reconnectDelay = 5000; // Начальная задержка 5с
const MAX_RECONNECT_DELAY = 60000; // Максимум 60с
const listeners = new Set<(data: any) => void>();

function getToken() {
  return localStorage.getItem('token');
}

function connect(channels: string[]) {
  const token = getToken();
  if (!token) return null;

  const chKey = channels.join(',');
  if (globalEs && globalChannels === chKey && globalEs.readyState !== EventSource.CLOSED) {
    return globalEs;
  }
  if (globalEs) {
    globalEs.close();
    globalEs = null;
  }

  globalChannels = chKey;
  const es = new EventSource(
    `${API_URL}/api/events?channels=${encodeURIComponent(chKey)}&token=${encodeURIComponent(token)}`
  );

  es.onopen = () => {
    console.log('[SSE] Connected to channels:', chKey);
    reconnectDelay = 5000; // Сброс задержки при успешном подключении
  };

  es.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.type === 'connected') return;
      for (const cb of listeners) {
        try {
          cb(data);
        } catch (e) {
          console.error('[SSE] Listener error:', e);
        }
      }
    } catch (e) {
      console.error('[SSE] Parse error:', e);
    }
  };

  es.onerror = () => {
    console.warn(`[SSE] Connection error, reconnecting in ${reconnectDelay}ms...`);
    es.close();
    globalEs = null;
    if (reconnectTimer) clearTimeout(reconnectTimer);
    reconnectTimer = setTimeout(() => {
      connect(channels);
    }, reconnectDelay);
    // Экспоненциальный рост задержки: 5с -> 10с -> 20с -> 40с -> 60с
    reconnectDelay = Math.min(reconnectDelay * 2, MAX_RECONNECT_DELAY);
  };

  globalEs = es;
  return es;
}

export function useRealtime(channels: string[], onMessage: (data: any) => void) {
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  const wrappedCallback = useCallback((data: any) => {
    onMessageRef.current(data);
  }, []);

  useEffect(() => {
    listeners.add(wrappedCallback);
    const es = connect(channels);
    return () => {
      listeners.delete(wrappedCallback);
      if (listeners.size === 0 && es) {
        es.close();
        globalEs = null;
      }
    };
  }, [channels.join(','), wrappedCallback]);
} 