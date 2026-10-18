import { useEffect, useState } from 'react';
import { seoBaseTitle } from '../lib/seo';
type LegalSlug = 'offer' | 'privacy';
export function LegalDocumentPage({ slug }: { slug: LegalSlug }) {
  const [doc, setDoc] = useState<{ title: string; content: string; updatedAt: string | null } | null>(null);
  const [error, setError] = useState('');
  useEffect(() => { setDoc(null); setError(''); fetch(`/api/legal/${slug}`, { cache: 'no-store' }).then(async r => { if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || `HTTP ${r.status}`); return r.json(); }).then(setDoc).catch(e => setError(e.message || 'Не удалось загрузить документ')); }, [slug]);
  // Название сайта в title берём из SEO-настроек тенанта (seoBaseTitle),
  // чтобы вкладка соответствовала полю «Title» в настройках
  useEffect(() => { document.title = doc ? `${doc.title} — ${seoBaseTitle()}` : seoBaseTitle(); }, [doc]);
  return <div className="legal-page"><div className="legal-card"><a className="legal-back" href="/">← На страницу входа</a>{error && <div className="legal-error">{error}</div>}{!doc && !error && <div className="legal-loading">Загрузка документа...</div>}{doc && <><h1>{doc.title}</h1>{doc.updatedAt && <div className="legal-updated">Обновлено: {new Date(doc.updatedAt).toLocaleDateString('ru-RU')}</div>}<div className="legal-content" dangerouslySetInnerHTML={{ __html: doc.content }} /></>}</div></div>;
}
