import { useEffect, useMemo, useState } from 'react' ;
import { useNavigate } from 'react-router-dom' ;
import { useAuth } from '../hooks/useAuth' ;
import { api } from '../api/client' ;
import { HELP_ARTICLES, HelpArticle as HelpArticleData } from '../lib/helpContent' ;
import { isMainPlatformHost } from './TenantSwitcher' ;

// === Справочный центр: оглавление статей по функциям и интеграциям ===
// Контент грузится из API (платформенная БД, един для всех); при сбое — встроенная копия.
// Главный администратор платформы видит кнопки редактирования.
export function HelpCenter() {
  const navigate = useNavigate() ;
  const { user } = useAuth() as any ;
  const [query, setQuery] = useState('') ;
  const [articles, setArticles] = useState<HelpArticleData[]>(HELP_ARTICLES) ;

  const canEdit = !!user && user.role === 'admin' && isMainPlatformHost() ;

  useEffect(() => {
    api.help.list()
      .then((list) => { if (Array.isArray(list) && list.length) setArticles(list as any) ; })
      .catch(() => {}) ;
  }, []) ;

  const groups = useMemo(() => ['Начало работы', 'Функции', 'Интеграции'], []) ;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase() ;
    if (!q) return articles ;
    return articles.filter(a =>
      a.title.toLowerCase().includes(q) || a.desc.toLowerCase().includes(q)
    ) ;
  }, [query, articles]) ;

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '20px 16px' }}>
      {/* Приветствие с маскотом */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24, padding: '18px 22px',
        borderRadius: 16, border: '1px solid var(--border-color)', background: 'var(--bg-card)', flexWrap: 'wrap',
      }}>
        <img src="/mascot/mascot_wave.png" alt="Маскот WeCRM" style={{ height: 110, objectFit: 'contain', flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 220 }}>
          <h1 style={{ margin: '0 0 6px', fontSize: 24 }}>Справка WeCRM</h1>
          <p style={{ margin: 0, fontSize: 14, color: 'var(--text-secondary)' }}>
            Инструкции по всем функциям и интеграциям системы. Выберите раздел ниже
            или воспользуйтесь поиском.
          </p>
        </div>
        {canEdit && (
          <button
            onClick={() => navigate('/help/new')}
            style={{
              padding: '8px 16px', borderRadius: 10, border: 'none', background: '#16a34a',
              color: '#fff', fontSize: 14, cursor: 'pointer', flexShrink: 0,
            }}
          >+ Новая статья</button>
        )}
      </div>

      {/* Поиск по статьям */}
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Поиск по справке: например, «задачи» или «1С»"
        style={{
          width: '100%', padding: '10px 16px', borderRadius: 12, marginBottom: 24,
          border: '1px solid var(--border-color)', background: 'var(--bg-card)',
          color: 'var(--text-primary)', fontSize: 14, outline: 'none', boxSizing: 'border-box',
        }}
      />

      {groups.map(group => {
        const items = filtered.filter(a => a.group === group) ;
        if (items.length === 0) return null ;
        return (
          <div key={group} style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 17, margin: '0 0 12px', color: 'var(--text-primary)' }}>{group}</h2>
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12,
            }}>
              {items.map(a => (
                <div key={a.slug} style={{ position: 'relative' }}>
                  <button
                    onClick={() => navigate(`/help/${a.slug}`)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', textAlign: 'left',
                      borderRadius: 12, border: '1px solid var(--border-color)', background: 'var(--bg-card)',
                      cursor: 'pointer', color: 'var(--text-primary)', fontFamily: 'inherit', width: '100%',
                    }}
                  >
                    {a.mascot && (
                      <img src={a.mascot} alt="" style={{ width: 44, height: 44, objectFit: 'contain', flexShrink: 0 }} />
                    )}
                    <span>
                      <span style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 3 }}>{a.title}</span>
                      <span style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{a.desc}</span>
                    </span>
                  </button>
                  {canEdit && (
                    <button
                      onClick={() => navigate(`/help/${a.slug}/edit`)}
                      title="Редактировать статью"
                      style={{
                        position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: 8,
                        border: '1px solid var(--border-color)', background: 'var(--bg-card)',
                        color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer',
                      }}
                    >✎</button>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) ;
      })}

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: 40, fontSize: 14 }}>
          По запросу «{query}» ничего не найдено. Попробуйте другое слово или напишите в поддержку.
        </div>
      )}
    </div>
  ) ;
}
