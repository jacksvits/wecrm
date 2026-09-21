// === Темы оформления: палитры для вкладки «Темы» в системных настройках ===
// Цвета используются в превью-карточках; сами темы задаются CSS-переменными
// в index.css через атрибут data-palette (ключи совпадают с ALLOWED_THEMES на бэкенде).

export interface ThemeColors {
  body: string;
  card: string;
  sidebar: string;
  hover: string;
  text: string;
  textSecondary: string;
  border: string;
  accent: string;
}

export interface Theme {
  key: string;
  label: string;
  description: string;
  light: ThemeColors;
  dark: ThemeColors;
}

export const THEMES: Theme[] = [
  {
    key: "classic",
    label: "Классическая",
    description: "Стандартная тема WeCRM",
    light: { body: "#f5f5f5", card: "#ffffff", sidebar: "#ffffff", hover: "#f0f0f0", text: "#1a1a1a", textSecondary: "#666666", border: "#e5e5e5", accent: "#007AFF" },
    dark: { body: "#1e1e2e", card: "#2a2a35", sidebar: "#2a2a35", hover: "#3f3f55", text: "#ffffff", textSecondary: "#a0a0b0", border: "#3f3f55", accent: "#5a9fd4" },
  },
  {
    key: "ocean",
    label: "Океан",
    description: "Спокойные синие тона",
    light: { body: "#eef4fb", card: "#ffffff", sidebar: "#f3f8fd", hover: "#e2ecf7", text: "#16283d", textSecondary: "#4a6076", border: "#d4e2ef", accent: "#1a6fd4" },
    dark: { body: "#0e1c2e", card: "#17293f", sidebar: "#142539", hover: "#223a56", text: "#e6eef7", textSecondary: "#9db4ca", border: "#27405c", accent: "#5aa2e8" },
  },
  {
    key: "forest",
    label: "Лес",
    description: "Природные зелёные оттенки",
    light: { body: "#f1f7f1", card: "#ffffff", sidebar: "#edf6ed", hover: "#e1efe1", text: "#1c2b1e", textSecondary: "#50684f", border: "#d3e3d1", accent: "#2e8b47" },
    dark: { body: "#101d13", card: "#182a1c", sidebar: "#152518", hover: "#213a26", text: "#e8f2e6", textSecondary: "#a3bda0", border: "#2c4a30", accent: "#62c476" },
  },
  {
    key: "violet",
    label: "Фиолетовый",
    description: "Современный пурпурный акцент",
    light: { body: "#f6f3fb", card: "#ffffff", sidebar: "#f3effa", hover: "#eae3f6", text: "#251d38", textSecondary: "#5c5470", border: "#ddd4ec", accent: "#7c3aed" },
    dark: { body: "#171221", card: "#221a30", sidebar: "#1e172b", hover: "#2e2440", text: "#efeaf7", textSecondary: "#b3a8c9", border: "#372b4c", accent: "#a78bfa" },
  },
  {
    key: "sunset",
    label: "Закат",
    description: "Тёплые оранжевые тона",
    light: { body: "#fdf6ef", card: "#ffffff", sidebar: "#fbf1e7", hover: "#f8e7d5", text: "#332216", textSecondary: "#75604e", border: "#ecd9c4", accent: "#ea7a1f" },
    dark: { body: "#211409", card: "#2f1d0f", sidebar: "#2a1a0d", hover: "#3d2815", text: "#f7ede2", textSecondary: "#c9ae93", border: "#4c331b", accent: "#f59e4b" },
  },
  {
    key: "graphite",
    label: "Графит",
    description: "Строгая монохромная гамма",
    light: { body: "#f4f4f5", card: "#ffffff", sidebar: "#fafafa", hover: "#e9e9eb", text: "#18181b", textSecondary: "#52525b", border: "#dcdcdf", accent: "#3f3f46" },
    dark: { body: "#131316", card: "#1d1d21", sidebar: "#1a1a1e", hover: "#2a2a30", text: "#f4f4f5", textSecondary: "#a1a1aa", border: "#333338", accent: "#d4d4d8" },
  },
  {
    key: "liquid-glass",
    label: "Liquid Glass",
    description: "Эффект жидкого стекла из iOS: полупрозрачные панели и мягкий градиент",
    light: { body: "#dfe8f3", card: "rgba(255,255,255,0.55)", sidebar: "rgba(255,255,255,0.40)", hover: "rgba(255,255,255,0.75)", text: "#1c2b3a", textSecondary: "#55677b", border: "rgba(140,170,200,0.28)", accent: "#0a84ff" },
    dark: { body: "#0c1524", card: "rgba(36,52,78,0.55)", sidebar: "rgba(22,34,54,0.50)", hover: "rgba(80,110,150,0.35)", text: "#eef4fb", textSecondary: "#a9bed4", border: "rgba(150,190,230,0.22)", accent: "#4da3ff" },
  },
];
