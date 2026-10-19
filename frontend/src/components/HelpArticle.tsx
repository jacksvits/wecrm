import { useEffect, useState } from 'react' ;
import { useNavigate, useParams, Link } from 'react-router-dom' ;
import { useAuth } from '../hooks/useAuth' ;
import { api } from '../api/client' ;
import { HELP_ARTICLES, HelpBlock, HelpArticle as HelpArticleData } from '../lib/helpContent' ;
import { isMainPlatformHost } from './TenantSwitcher' ;

// === Страница одной статьи справки ===
// Контент из API (един для всех доменов); при сбое — встроенная копия.
// Блоки 'p' и 'tip' содержат HTML из WYSIWYG-редактора.
export function Block({ block }: { block: HelpBlock }) {
  switch (block.type) {
    case 'h':
      return <h2 style={{ fontSize: 16, margin: '22px 0 10px', color: 'var(--text-primary)' }}>{block.text}</h2> ;
    case 'p':
      return (
        <div
          style={{ fontSize: 14, lineHeight: 1.65, margin: '0 0 12px', color: 'var(--text-primary)' }}
          dangerouslySetInnerHTML={{ __html: block.text }}
        />
      ) ;
    case 'steps':
      return (
        <ol style={{ margin: '0 0 14px', paddingLeft: 22, fontSize: 14, lineHeight: 1.65, color: 'var(--text-primary)' }}>
          {block.items.map((it, i) => <li key={i} style={{ marginBottom: 6 }}>{it}</li>)}
        </ol>
      ) ;
    case 'ul':
      return (
        <ul style={{ margin: '0 0 14px', paddingLeft: 22, fontSize: 14, lineHeight: 1.65, color: 'var(--text-primary)' }}>
          {block.items.map((it, i) => <li key={i} style={{ marginBottom: 6 }}>{it}</li>)}
        </ul>
      ) ;
    case 'tip':
      return (
        <div style={{
          display: 'flex', gap: 10, alignItems: 'flex-start', padding: '10px 14px', margin: '0 0 14px',
          borderRadius: 10, border: '1px solid rgba(34, 197, 94, 0.35)', background: 'rgba(34, 197, 94, 0.08)',
          fontSize: 13, lineHeight: 1.55, color: 'var(--text-primary)',
        }}>
          <img src="/mascot/mascot_point.png" alt="" style={{ width: 26, height: 26, objectFit: 'contain', flexShrink: 0 }} />
          <div dangerouslySetInnerHTML={{ __html: block.text }} />
        </div>
      ) ;
  }
}

export function HelpArticle() {
  const { slug } = useParams() ;
  const navigate = useNavigate() ;
  const { user } = useAuth() as any ;
  const [articles, setArticles] = useState<HelpArticleData[]>(HELP_ARTICLES) ;

  const canEdit = !!user && user.role === 'admin' && isMainPlatformHost() ;

  useEffect(() => {
    api.help.list()
      .then((list) => { if (Array.isArray(list) && list.length) setArticles(list as any) ; })
      .catch(() => {}) ;
  }, []) ;

  const article = articles.find(a => a.slug === slug) ;

  if (!article) {
    return (
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '40px 16px', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Статья не найдена.</p>
        <Link to="/help" style={{ color: 'var(--accent-color)' }}>← Все статьи справки</Link>
      </div>
    ) ;
  }

  // Предыдущая/следующая статья в общем списке для удобной навигации
  const idx = articles.findIndex(a => a.slug === article.slug) ;
  const prev = idx > 0 ? articles[idx - 1] : null ;
  const next = idx < articles.length - 1 ? articles[idx + 1] : null ;

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '20px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <button
          onClick={() => navigate('/help')}
          style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer', padding: 0 }}
        >
          ← Все статьи справки
        </button>
        {canEdit && (
          <button
            onClick={() => navigate(`/help/${article.slug}/edit`)}
            style={{
              padding: '6px 14px', borderRadius: 10, border: '1px solid var(--border-color)',
              background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: 13, cursor: 'pointer',
            }}
          >✎ Редактировать</button>
        )}
      </div>

      {/* Шапка статьи с маскотом */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 18, marginBottom: 18, padding: '16px 20px',
        borderRadius: 16, border: '1px solid var(--border-color)', background: 'var(--bg-card)',
      }}>
        {article.mascot && (
          <img src={article.mascot} alt="" style={{ height: 90, objectFit: 'contain', flexShrink: 0 }} />
        )}
        <div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>{article.group}</div>
          <h1 style={{ margin: '0 0 4px', fontSize: 22 }}>{article.title}</h1>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>{article.desc}</p>
        </div>
      </div>

      {/* Тело статьи */}
      <div style={{
        padding: '18px 22px', borderRadius: 16,
        border: '1px solid var(--border-color)', background: 'var(--bg-card)',
      }}>
        {article.blocks.map((b, i) => <Block key={i} block={b} />)}
      </div>

      {/* Навигация между статьями */}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
        {prev ? (
          <button
            onClick={() => navigate(`/help/${prev.slug}`)}
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 10, padding: '8px 14px', color: 'var(--text-primary)', fontSize: 13, cursor: 'pointer' }}
          >
            ← {prev.title}
          </button>
        ) : <span />}
        {next && (
          <button
            onClick={() => navigate(`/help/${next.slug}`)}
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 10, padding: '8px 14px', color: 'var(--text-primary)', fontSize: 13, cursor: 'pointer' }}
          >
            {next.title} →
          </button>
        )}
      </div>

      {/* Не нашли ответ — в поддержку */}
      <div style={{
        marginTop: 22, padding: '14px 18px', borderRadius: 12, textAlign: 'center',
        border: '1px dashed var(--border-color)', fontSize: 13, color: 'var(--text-secondary)',
      }}>
        Не нашли ответ на свой вопрос? Напишите нам — раздел <Link to={['welans.cc', 'www.welans.cc'].includes(window.location.hostname) ? '/support' : '/platform-support'} style={{ color: 'var(--accent-color)' }}>Поддержка</Link>.
      </div>
    </div>
  ) ;
}
