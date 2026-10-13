import { useEffect, useState } from 'react';

/**
 * Мобильный экран ≤768px — тот же порог, что и в списке задач (TaskList).
 * Используется для компактного вида календарей и других адаптивных блоков.
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return isMobile;
}
