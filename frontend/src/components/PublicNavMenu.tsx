import { useEffect, useState } from "react";

// === Публичное меню «Новости · Каталог · Файлы» для шапок публичных страниц ===
// Ссылки как на главной welans.ru. На узких экранах (<640px) скрывается,
// чтобы не ломать шапку с полем поиска.

const LINKS = [
  { label: "Новости", href: "https://welans.ru/news" },
  { label: "Каталог", href: "https://welans.cc/shop" },
  { label: "Файлы", href: "https://welans.click/" },
];

export function PublicNavMenu() {
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const check = () => setNarrow(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  if (narrow) return null;
  const host = window.location.hostname;
  const path = window.location.pathname;
  return (
    <nav style={{ display: "flex", alignItems: "center", gap: 18, flexShrink: 0 }}>
      {LINKS.map((l) => {
        const active =
          (l.label === "Новости" && host.endsWith("welans.ru") && path.startsWith("/news")) ||
          (l.label === "Каталог" && path.startsWith("/shop")) ||
          (l.label === "Файлы" && (host.endsWith("welans.click") || path.startsWith("/files")));
        return (
          <a
            key={l.label}
            href={l.href}
            aria-current={active ? "page" : undefined}
            style={{
              fontSize: 14,
              color: active ? "#007AFF" : "var(--text-secondary, #555)",
              fontWeight: active ? 600 : 400,
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            {l.label}
          </a>
        );
      })}
    </nav>
  );
}

export default PublicNavMenu;
