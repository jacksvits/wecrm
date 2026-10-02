import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { api } from '../api/client';
import { updateAppBadge } from '../lib/appBadge';

/**
 * Единый хук уведомлений для десктопной и мобильной версий.
 * Загрузка списка, SSE-обновления, звук, бейдж приложения и все действия
 * (прочитать / прочитать все / удалить все) живут здесь, чтобы обе версии
 * вели себя одинаково и не открывали параллельные SSE-подключения.
 */
export function useNotifications() {
  const { user } = useAuth();
  const soundEnabled = (user as any)?.soundEnabled !== false;
  const [items, setItems] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadNotifications = useCallback(() => {
    api.notifications.list(9999).then((data: any) => {
      setItems(data.items || []);
      setUnreadCount(data.unreadCount || 0);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!user) return;
    loadNotifications();
    const token = localStorage.getItem('token');
    const es = new EventSource('/api/notifications/stream' + (token ? '?token=' + encodeURIComponent(token) : ''));
    es.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.type === 'connected') return;
      loadNotifications();
      if (soundEnabled && msg.type === 'notification') {
        const audio = new Audio('/icq-message.mp3');
        audio.volume = 0.5;
        audio.play().catch(() => {});
      }
    };
    es.onerror = () => {};
    return () => es.close();
  }, [user, soundEnabled, loadNotifications]);

  // Бейдж PWA-иконки (наклейка) и счётчик в заголовке вкладки
  useEffect(() => {
    updateAppBadge(unreadCount);
  }, [unreadCount]);

  // Сброс бейджа при выходе из аккаунта
  useEffect(() => () => {
    updateAppBadge(0);
  }, []);

  const markRead = useCallback((id: string) => {
    api.notifications.markRead(id).then(() => {
      setItems(prev => prev.map(n => n.id === id ? { ...n, readAt: new Date() } : n));
      setUnreadCount(c => Math.max(0, c - 1));
    }).catch(() => {});
  }, []);

  const markAllRead = useCallback(() => {
    api.notifications.markAllRead().then(() => {
      setItems(prev => prev.map(n => ({ ...n, readAt: new Date() })));
      setUnreadCount(0);
    }).catch(() => {});
  }, []);

  const deleteAll = useCallback(() => {
    api.notifications.deleteAll().then(() => {
      setItems([]);
      setUnreadCount(0);
    }).catch(() => {});
  }, []);

  return { items, unreadCount, markRead, markAllRead, deleteAll };
}
