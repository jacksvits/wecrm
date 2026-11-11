// Установка заголовка вкладки для публичных страниц (витрина, файлы, новости).
// SEO-метатеги из настроек тенанта применяются асинхронно (initSeo в lib/seo.ts)
// и перезаписали бы title после монтирования — поэтому свой title повторно
// ставим по событию 'wecrm-seo-applied', которое seo.ts диспатчит после применения.
import { useEffect } from 'react';

export function usePageTitle(title: string) {
  useEffect(() => {
    const apply = () => { document.title = title; };
    apply();
    window.addEventListener('wecrm-seo-applied', apply);
    return () => window.removeEventListener('wecrm-seo-applied', apply as EventListener);
  }, [title]);
}
