import { useEffect, useState } from "react";

// Общий «картинка в картинке» для всех вкладок видеорегистратора.
// Ключи окон: "local:<id>" | "tapo:<index>" | "tapoc:<deviceId>" | "hik:<index>".
// Записи без префикса (старые) считаются локальными камерами. Подписи окон
// хранятся отдельно — чтобы не ходить за списками камер в каждый источник.

const IDS_KEY = "camera_pip_ids";
const LABELS_KEY = "camera_pip_labels";

export function loadPipKeys(): string[] {
  try {
    const raw = JSON.parse(localStorage.getItem(IDS_KEY) || "[]");
    if (Array.isArray(raw)) return raw.filter((x) => typeof x === "string");
  } catch {}
  return [];
}

function loadPipLabels(): Record<string, string> {
  try {
    const raw = JSON.parse(localStorage.getItem(LABELS_KEY) || "{}");
    if (raw && typeof raw === "object") return raw as Record<string, string>;
  } catch {}
  return {};
}

export function getPipLabel(key: string): string {
  return loadPipLabels()[key] || "";
}

// Состояние PiP для кнопок на карточках: синхронизируется с localStorage
// и оверлеем (событие camera-pip-toggle, запись — в CameraPipOverlay).
export function usePip() {
  const [keys, setKeys] = useState<string[]>(loadPipKeys);
  useEffect(() => {
    const sync = () => setKeys(loadPipKeys());
    const onToggle = (e: Event) => {
      const d = (e as CustomEvent).detail;
      const key = typeof d === "string" ? d : d?.key; // legacy: строка
      if (!key) return;
      setKeys((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
    };
    window.addEventListener("storage", sync);
    window.addEventListener("camera-pip-toggle", onToggle as EventListener);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("camera-pip-toggle", onToggle as EventListener);
    };
  }, []);
  const active = (key: string) => keys.includes(key);
  const toggle = (key: string, label = "") => {
    if (label) {
      try {
        const labels = loadPipLabels();
        labels[key] = label;
        localStorage.setItem(LABELS_KEY, JSON.stringify(labels));
      } catch {}
    }
    window.dispatchEvent(new CustomEvent("camera-pip-toggle", { detail: { key, label } }));
  };
  return { keys, active, toggle };
}

// PiP — только десктоп (как раньше в CameraWidget)
export function useIsDesktop(min = 1024) {
  const [is, setIs] = useState<boolean>(() => window.innerWidth >= min);
  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${min}px)`);
    const onChange = () => setIs(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [min]);
  return is;
}

// kind — тип источника кадра, id — идентификатор камеры в этом источнике
export function splitPipKey(key: string): { kind: string; id: string } {
  const i = key.indexOf(":");
  if (i <= 0) return { kind: "local", id: key };
  return { kind: key.slice(0, i), id: key.slice(i + 1) };
}
