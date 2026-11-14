import { useEffect, useState } from 'react';
import { PublicNewsList, PublicNewsDetail } from './PublicNewsPage';

// Публичные новости тенанта: полный аналог welans.ru/news, но с контентом и
// рекламными блоками самой организации (данные — БД тенанта).

function useOrgName(): string {
  const [orgName, setOrgName] = useState('');
  useEffect(() => {
    fetch('/api/platform/me').then(r => (r.ok ? r.json() : null)).then(d => { if (d?.name) setOrgName(d.name); }).catch(() => {});
  }, []);
  return orgName;
}

export function TenantPublicNews() {
  const orgName = useOrgName();
  return (
    <PublicNewsList
      seoTitle={orgName ? `${orgName} — Новости` : undefined}
      seoDescription={orgName ? `Новости организации ${orgName}` : undefined}
    />
  );
}

export function TenantPublicNewsDetail({ idOrSlug }: { idOrSlug: string }) {
  const orgName = useOrgName();
  return (
    <PublicNewsDetail
      fetchByIdOrSlug={idOrSlug}
      brand={orgName || undefined}
    />
  );
}
