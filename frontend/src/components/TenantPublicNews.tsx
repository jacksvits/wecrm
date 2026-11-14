import { useEffect, useState } from 'react';
import { PublicNewsList } from './PublicNewsPage';
import PublicAuthArea from './PublicAuthArea';

// Публичные новости тенанта: анонимный посетитель <slug>.welans.cc/news видит
// опубликованные новости организации (GET /api/news отдаёт гостю только isPublished).

const headerStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '14px 20px', borderBottom: '1px solid #eee', maxWidth: 960, margin: '0 auto', width: '100%', boxSizing: 'border-box' };
const mainStyle: React.CSSProperties = { flex: 1, maxWidth: 960, margin: '0 auto', width: '100%', boxSizing: 'border-box', padding: '20px 16px' };

function useOrgName(): string {
  const [orgName, setOrgName] = useState('');
  useEffect(() => {
    fetch('/api/platform/me').then(r => (r.ok ? r.json() : null)).then(d => { if (d?.name) setOrgName(d.name); }).catch(() => {});
  }, []);
  return orgName;
}

function TenantPublicHeader({ orgName }: { orgName: string }) {
  return (
    <header style={headerStyle}>
      <a href='/news' style={{ fontWeight: 700, fontSize: 18, color: '#689F38', textDecoration: 'none' }}>{orgName || 'Новости'}</a>
      <PublicAuthArea />
    </header>
  );
}

export function TenantPublicNews() {
  const orgName = useOrgName();
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#fff' }}>
      <TenantPublicHeader orgName={orgName} />
      <main style={mainStyle}>
        <h1 style={{ fontSize: 22, margin: '0 0 16px' }}>Новости</h1>
        <PublicNewsList seoTitle={orgName ? `${orgName} — Новости` : undefined} seoDescription={orgName ? `Новости организации ${orgName}` : undefined} />
      </main>
    </div>
  );
}

export function TenantPublicNewsDetail({ idOrSlug }: { idOrSlug: string }) {
  const orgName = useOrgName();
  const [item, setItem] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setItem(null);
    setError('');
    fetch('/api/news/public/post/' + encodeURIComponent(idOrSlug))
      .then(async r => {
        if (!r.ok) throw new Error(((await r.json().catch(() => ({}))) as any)?.error || 'Новость не найдена');
        return r.json();
      })
      .then(setItem)
      .catch(e => setError(e?.message || 'Ошибка загрузки'));
  }, [idOrSlug]);

  if (error) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#fff' }}>
        <TenantPublicHeader orgName={orgName} />
        <main style={mainStyle}>
          <p style={{ color: '#c00' }}>{error}</p>
          <a href='/news' style={{ color: '#689F38' }}>← К новостям</a>
        </main>
      </div>
    );
  }
  if (!item) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#fff' }}>
        <TenantPublicHeader orgName={orgName} />
        <main style={mainStyle}><p style={{ color: '#888' }}>Загрузка…</p></main>
      </div>
    );
  }
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#fff' }}>
      <TenantPublicHeader orgName={orgName} />
      <main style={mainStyle}>
        <article style={{ maxWidth: 760 }}>
          <h1 style={{ fontSize: 24, margin: '4px 0 10px', lineHeight: 1.3 }}>{item.title}</h1>
          <div style={{ fontSize: 13, color: '#888', marginBottom: 14 }}>
            {item.category?.name ? <span style={{ color: item.category.color || '#689F38', marginRight: 8 }}>{item.category.name}</span> : null}
            {item.publishedAt ? new Date(item.publishedAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }) : null}
            {item.author?.name ? <span style={{ marginLeft: 8 }}>· {item.author.name}</span> : null}
          </div>
          {item.coverImage ? <img src={item.coverImage} alt='' style={{ maxWidth: '100%', borderRadius: 8, marginBottom: 14 }} /> : null}
          {item.summary ? <p style={{ fontSize: 15, color: '#555', marginBottom: 14 }}>{item.summary}</p> : null}
          {item.content ? <div dangerouslySetInnerHTML={{ __html: item.content }} /> : null}
        </article>
        <div style={{ marginTop: 24 }}>
          <a href='/news' style={{ color: '#689F38' }}>← К новостям</a>
        </div>
      </main>
    </div>
  );
}
