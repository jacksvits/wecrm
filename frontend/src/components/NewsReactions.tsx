import { useState } from 'react';
import { api } from '../api/client';

type ReactionType = 'like' | 'dislike';

interface Props {
  newsId: string;
  likes: number;
  dislikes: number;
  myReaction: ReactionType | null;
}

export function NewsReactions({ newsId, likes, dislikes, myReaction }: Props) {
  const [state, setState] = useState<Props>({ newsId, likes, dislikes, myReaction });
  const [sending, setSending] = useState(false);

  const handleReaction = async (type: ReactionType) => {
    if (sending) return;
    setSending(true);
    const prev = { ...state };
    const next = { ...state };
    // Повторный клик по своей реакции — снимаем её
    if (next.myReaction === type) {
      next.myReaction = null;
      if (type === 'like') next.likes = Math.max(0, next.likes - 1);
      else next.dislikes = Math.max(0, next.dislikes - 1);
    } else {
      // Смена реакции: убираем старую, добавляем новую
      if (next.myReaction === 'like') next.likes = Math.max(0, next.likes - 1);
      if (next.myReaction === 'dislike') next.dislikes = Math.max(0, next.dislikes - 1);
      next.myReaction = type;
      if (type === 'like') next.likes += 1;
      else next.dislikes += 1;
    }
    setState(next);
    try {
      const data = await api.news.setReaction(newsId, next.myReaction);
      setState({ newsId, likes: data.likes, dislikes: data.dislikes, myReaction: data.myReaction });
    } catch {
      setState(prev);
    }
    setSending(false);
  };

  const buttonStyle = (active: boolean, activeColor: string): React.CSSProperties => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 14px',
    borderRadius: 20,
    background: active ? activeColor + '18' : 'var(--bg-hover)',
    border: `1px solid ${active ? activeColor : 'var(--border-color)'}`,
    color: active ? activeColor : 'var(--text-secondary)',
    cursor: 'pointer',
    fontSize: 14,
    opacity: sending ? 0.6 : 1,
  });

  return (
    <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
      <button
        onClick={() => handleReaction('like')}
        style={buttonStyle(state.myReaction === 'like', '#007AFF')}
        title="Нравится"
      >
        👍 <span>{state.likes}</span>
      </button>
      <button
        onClick={() => handleReaction('dislike')}
        style={buttonStyle(state.myReaction === 'dislike', '#FF3B30')}
        title="Не нравится"
      >
        👎 <span>{state.dislikes}</span>
      </button>
    </div>
  );
}
