// Установка заголовка вкладки для публичных страниц (витрина, файлы, новости).
// SEO-метатеги из настроек тенанта применяются асинхронно (initSeo в lib/seo.ts)
// и перезаписали бы title после монтирования — поэтому свой title повторно
// ставим по событию 'wecrm-seo-applied', которое seo.ts диспатчит после применения.
import { useEffect } from 'react';
import { applyPageMeta, restorePageMeta, PageMeta } from './seo';

export function usePageTitle(title: string) {
  useEffect(() => {
    const apply = () => { document.title = title; };
    apply();
    window.addEventListener('wecrm-seo-applied', apply);
    return () => window.removeEventListener('wecrm-seo-applied', apply as EventListener);
  }, [title]);
}

// То же для полного набора метатегов страницы (title + description + canonical + Open Graph).
// Снимок head делается один раз на монтирование — при повторных применениях
// (событие 'wecrm-seo-applied') восстановление уходит к исходным значениям.
export function usePageSeo(meta: PageMeta) {
  useEffect(() => {
    const snapshot = applyPageMeta(meta);
    const apply = () => { applyPageMeta(meta); };
    window.addEventListener('wecrm-seo-applied', apply);
    return () => {
      window.removeEventListener('wecrm-seo-applied', apply as EventListener);
      restorePageMeta(snapshot);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meta.title, meta.description, meta.canonical, meta.ogImage]);
}
