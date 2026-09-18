import { User } from "../types";

// Формат отображения пользователя в списках выбора: «Имя/Роль»
export const userOptionLabel = (u: User): string => {
  const roleName =
    typeof u.role === "string" ? u.role : u.role?.label || u.role?.name || "";
  return roleName ? `${u.name}/${roleName}` : u.name;
};
