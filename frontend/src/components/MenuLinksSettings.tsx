import { api } from "../api/client";
import { MenuLinksEditor } from "./MenuLinksEditor";

// Под-вкладка «Авторизация» в Системных настройках: меню внизу страницы входа.
export function MenuLinksSettings() {
  return (
    <MenuLinksEditor
      description="Ссылки кнопок меню внизу страницы входа. Относительные адреса (например, /presentation) открываются в этой же вкладке, остальные — в новой. Неактивные пункты на странице входа не показываются."
      load={api.menuLinks.get}
      save={api.menuLinks.save}
    />
  );
}
