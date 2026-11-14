import { api } from "../api/client";
import { MenuLinksEditor } from "./MenuLinksEditor";

// Под-вкладка «Шапка» в Системных настройках: меню публичных страниц (новости, каталог, файлы).
export function HeaderMenuSettings() {
  return (
    <MenuLinksEditor
      description="Меню в шапке публичных страниц (новости, каталог, файлы). Относительные адреса (например, /shop) открываются в этой же вкладке, остальные — в новой. Неактивные пункты в шапке не показываются."
      load={api.headerMenuLinks.get}
      save={api.headerMenuLinks.save}
    />
  );
}
