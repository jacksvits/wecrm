import { useEffect, useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { api } from '../api/client';
import { NewsComment } from '../types';
import { useAuth } from '../hooks/useAuth';
import { useRealtime } from '../hooks/useRealtime';

const QUILL_MODULES = {
  toolbar: [
    ['bold', 'italic', 'underline', 'strike'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['link'],
    ['clean'],
  ],
};

// Текст без HTML-тегов (для валидации непустоты)
const plainText = (html: string) => html.replace(/<[^>]*>/g, '').trim();

export function NewsComments({ newsId }: { newsId: string }) {
  const { user } = useAuth();
  const [comments, setComments] = useState<NewsComment[]>([]);
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);

  const loadComments = async () => {
    try {
      const data = await api.news.comments(newsId);
      setComments(data);
    } catch {}
  };

  useEffect(() => {
    loadComments();
  }, [newsId]);

  // Обновление списка в реальном времени по SSE
  useRealtime(['news'], (data) => {
    if (data.entity !== 'news' || data.id !== newsId) return;
    if (data.action === 'new_comment' && data.comment) {
      setComments((prev) => prev.some((c) => c.id === data.comment.id) ? prev : [...prev, data.comment]);
    }
    if (data.action === 'delete_comment' && data.commentId) {
      setComments((prev) => prev.filter((c) => c.id !== data.commentId));
    }
  });

  const handleSubmit = async () => {
    if (!plainText(content) || sending) return;
    setSending(true);
    try {
      const comment = await api.news.addComment(newsId, content);
      setComments((prev) => [...prev, comment]);
      setContent('');
    } catch {}
    setSending(false);
  };

  const handleDelete = async (commentId: string) => {
    if (!window.confirm('Удалить комментарий?')) return;
    try {
      await api.news.deleteComment(newsId, commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch {}
  };

  const canDelete = (comment: NewsComment) =>
    comment.authorId === user?.id || user?.role === 'admin';

  return (
    <div style={{ marginTop: 24, borderTop: '1px solid var(--border-color)', paddingTop: 18 }}>
      <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 14px' }}>
        Комментарии ({comments.length})
      </h3>

      {/* Форма добавления (WYSIWYG-редактор) */}
      <div style={{ marginBottom: 18 }}>
        <ReactQuill
          theme="snow"
          value={content}
          onChange={setContent}
          modules={QUILL_MODULES}
          placeholder="Написать комментарий..."
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
          <button
            onClick={handleSubmit}
            disabled={sending || !plainText(content)}
            style={{
              padding: '7px 18px',
              borderRadius: 8,
              background: '#007AFF',
              border: 'none',
              color: '#fff',
              cursor: 'pointer',
              fontSize: 13,
              opacity: sending || !plainText(content) ? 0.6 : 1,
            }}
          >
            Отправить
          </button>
        </div>
      </div>

      {/* Список комментариев */}
      {comments.length === 0 ? (
        <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Пока нет комментариев</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {comments.map((comment) => (
            <div
              key={comment.id}
              style={{
                padding: 12,
                borderRadius: 10,
                background: 'var(--bg-hover)',
                border: '1px solid var(--border-color)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {comment.author?.avatar ? (
                    <img
                      src={comment.author.avatar}
                      alt=""
                      style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{
                      width: 24, height: 24, borderRadius: '50%', background: '#007AFF',
                      color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 600,
                    }}>
                      {(comment.author?.name || '?').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>
                    {comment.author?.name || 'Пользователь'}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    {new Date(comment.createdAt).toLocaleString('ru-RU')}
                  </span>
                </div>
                {canDelete(comment) && (
                  <button
                    onClick={() => handleDelete(comment.id)}
                    style={{
                      padding: '3px 10px',
                      borderRadius: 6,
                      background: 'transparent',
                      border: '1px solid var(--border-color)',
                      color: '#FF3B30',
                      cursor: 'pointer',
                      fontSize: 12,
                    }}
                  >
                    Удалить
                  </button>
                )}
              </div>
              <div
                className="rich-text"
                style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--text-primary)', wordBreak: 'break-word' }}
                dangerouslySetInnerHTML={{ __html: comment.content }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
