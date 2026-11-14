import { useEffect, useState } from "react";

// === Публичное меню шапки публичных страниц (новости/каталог/файлы) ===
// Пункты настраиваются в Настройки → Системные → Шапка (per-tenant, /api/header-menu-links).
// Пока админ ничего не сохранял (или запрос не удался) — дефолтные ссылки как на главной welans.ru.
// На узких экранах (<640px) скрывается, чтобы не ломать шапку с полем поиска.

type NavItem = { key: string; title: string; url: string; isActive: boolean; sortOrder: number };

const DEFAULT_ITEMS: NavItem[] = [
  { key: "news", title: "Новости", url: "https://welans.ru/news", isActive: true, sortOrder: 0 },
  { key: "catalog", title: "Каталог", url: "https://welans.cc/shop", isActive: true, sortOrder: 1 },
  { key: "files", title: "Файлы", url: "https://welans.click/", isActive: true, sortOrder: 2 },
];

// Текущий пункт: для внешних ссылок совпадение хоста и начала пути, для относительных — префикс пути
function isActiveItem(item: NavItem, host: string, path: string): boolean {
  if (/^https?:\/\//i.test(item.url)) {
    try {
      const u = new URL(item.url);
      return u.host === host && (u.pathname === "/" || path.startsWith(u.pathname));
    } catch {
      return false;
    }
  }
  return item.url !== "/" && path.startsWith(item.url);
}

export function PublicNavMenu() {
  const [items, setItems] = useState<NavItem[]>(DEFAULT_ITEMS);
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const check = () => setNarrow(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  useEffect(() => {
    fetch("/api/header-menu-links")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (Array.isArray(d) && d.length) setItems(d);
      })
      .catch(() => {});
  }, []);
  if (narrow) return null;
  const host = window.location.hostname;
  const path = window.location.pathname;
  return (
    <nav style={{ display: "flex", alignItems: "center", gap: 18, flexShrink: 0 }}>
      {items
        .filter((l) => l.isActive !== false)
        .map((l) => {
          const active = isActiveItem(l, host, path);
          return (
            <a
              key={l.key}
              href={l.url}
              aria-current={active ? "page" : undefined}
              style={{
                fontSize: 14,
                color: active ? "#007AFF" : "var(--text-secondary, #555)",
                fontWeight: active ? 600 : 400,
                textDecoration: "none",
                whiteSpace: "nowrap",
              }}
            >
              {l.title}
            </a>
          );
        })}
    </nav>
  );
}

export default PublicNavMenu;
