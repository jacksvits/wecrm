import fs from 'fs';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { prisma } from './prisma.js';

// === Управление NFS-папками страницы «Файлы» ===
// Каждая строка file_tab_settings = одна NFS-шара: монтируется внутри контейнера
// в /app/nfs/<tabKey> (нужен nfs-common и SYS_ADMIN в compose). Реестр держится
// в памяти: resolveTabDir() синхронный, обновляется после любых изменений и
// периодически перепроверяется (ре-маунт после обрыва/NFS-рестарта).

const execFileAsync = promisify(execFile);

export const NFS_ROOT = '/app/nfs';

export interface NfsFolder {
  id: string;
  tabKey: string;
  label: string;
  host: string;
  export: string;
  readOnly: boolean;
  sort: number;
}

// tabKey -> абсолютный путь монтирования; синхронно читается resolveTabDir
const dirByTab = new Map<string, string>();
// tabKey -> ошибка последнего монтирования (для статуса в настройках)
const lastErrorByTab = new Map<string, string>();
// защита от параллельного монтирования одной точки
const inflight = new Map<string, Promise<{ ok: boolean; error?: string }>>();

const mountPoint = (tabKey: string) => path.join(NFS_ROOT, tabKey);

const isMounted = (mp: string): boolean => {
  try {
    const mounts = fs.readFileSync('/proc/mounts', 'utf8');
    return mounts.split('\n').some((line) => line.split(' ')[1] === mp);
  } catch {
    return false;
  }
};

const mountOnce = async (folder: NfsFolder): Promise<{ ok: boolean; error?: string }> => {
  const mp = mountPoint(folder.tabKey);
  try {
    fs.mkdirSync(mp, { recursive: true });
  } catch (e: any) {
    return { ok: false, error: `Не удалось создать точку монтирования: ${e?.message || e}` };
  }
  if (isMounted(mp)) return { ok: true };
  const mode = folder.readOnly ? 'ro' : 'rw';
  const source = `${folder.host}:${folder.export}`;
  const attempts = [
    ['-t', 'nfs', '-o', `${mode},soft,timeo=50,retrans=2,nfsvers=4.1`, source, mp],
    ['-t', 'nfs', '-o', `${mode},soft,timeo=50,retrans=2`, source, mp],
  ];
  let lastErr = '';
  for (const args of attempts) {
    try {
      await execFileAsync('mount', args, { timeout: 30000 });
      lastErrorByTab.delete(folder.tabKey);
      return { ok: true };
    } catch (e: any) {
      lastErr = String(e?.stderr || e?.message || e).trim().split('\n').pop() || 'ошибка монтирования';
    }
  }
  lastErrorByTab.set(folder.tabKey, lastErr);
  return { ok: false, error: lastErr };
};

// Монтирование с защитой от параллельных вызовов по одному tabKey
export const ensureMounted = (folder: NfsFolder): Promise<{ ok: boolean; error?: string }> => {
  const existing = inflight.get(folder.tabKey);
  if (existing) return existing;
  const p = mountOnce(folder).finally(() => inflight.delete(folder.tabKey));
  inflight.set(folder.tabKey, p);
  return p;
};

// Отмонтирование (ленивое — не падает при занятой точке)
export const unmount = async (tabKey: string): Promise<void> => {
  const mp = mountPoint(tabKey);
  if (!isMounted(mp)) return;
  try {
    await execFileAsync('umount', ['-l', mp], { timeout: 15000 });
  } catch {
    /* занято — lazy detach всё равно отработает позже */
  }
};

export const removeMountPoint = (tabKey: string): void => {
  try {
    fs.rmdirSync(mountPoint(tabKey));
  } catch {
    /* не пусто или уже удалена — не критично */
  }
};

// Перечитать БД, перемонтировать изменившееся, обновить реестр
export const refreshRegistry = async (): Promise<NfsFolder[]> => {
  const rows = await prisma.fileTabSetting.findMany({ orderBy: [{ sort: 'asc' }, { tabKey: 'asc' }] });
  const folders: NfsFolder[] = rows
    .filter((r) => r.host && r.export)
    .map((r) => ({
      id: r.id,
      tabKey: r.tabKey,
      label: r.label || r.tabKey,
      host: r.host,
      export: r.export,
      readOnly: r.readOnly,
      sort: r.sort,
    }));
  const seen = new Set<string>();
  for (const f of folders) {
    seen.add(f.tabKey);
    dirByTab.set(f.tabKey, mountPoint(f.tabKey));
    await ensureMounted(f);
  }
  // Строки без host/export (в т.ч. удалённые источники) — из реестра убираем
  for (const key of [...dirByTab.keys()]) {
    if (!seen.has(key)) dirByTab.delete(key);
  }
  return folders;
};

// Статус одной папки для списка в настройках
export const folderStatus = (folder: NfsFolder) => {
  const mp = mountPoint(folder.tabKey);
  const mounted = isMounted(mp);
  let readable = false;
  let writable = false;
  if (mounted) {
    try {
      fs.accessSync(mp, fs.constants.R_OK);
      readable = true;
    } catch { /* недоступно */ }
    try {
      fs.accessSync(mp, fs.constants.W_OK);
      writable = true;
    } catch { /* read-only */ }
  }
  return { mounted, readable, writable, error: lastErrorByTab.get(folder.tabKey) || '' };
};

// Синхронное разрешение вкладки в каталог (вызывается из resolveTabDir)
export const nfsDirForTab = (tabKey: string): string | undefined => dirByTab.get(tabKey);

// Допустимые ключи вкладок, созданных вручную
export const slugify = (label: string, fallback: string): string => {
  const slug = label
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\p{L}\p{N}-]/gu, '')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
  return slug || fallback;
};

// Проверка монтирования ДО сохранения новой папки: монтируем во временную точку
export const testMount = async (host: string, nfsExport: string, readOnly: boolean): Promise<{ ok: boolean; error?: string }> => {
  const staging = path.join(NFS_ROOT, `.staging-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
  try {
    fs.mkdirSync(staging, { recursive: true });
    const mode = readOnly ? 'ro' : 'rw';
    const source = `${host}:${nfsExport}`;
    const attempts = [
      ['-t', 'nfs', '-o', `${mode},soft,timeo=50,retrans=2,nfsvers=4.1`, source, staging],
      ['-t', 'nfs', '-o', `${mode},soft,timeo=50,retrans=2`, source, staging],
    ];
    let lastErr = '';
    for (const args of attempts) {
      try {
        await execFileAsync('mount', args, { timeout: 30000 });
        await execFileAsync('umount', ['-l', staging], { timeout: 15000 }).catch(() => undefined);
        return { ok: true };
      } catch (e: any) {
        lastErr = String(e?.stderr || e?.message || e).trim().split('\n').pop() || 'ошибка монтирования';
      }
    }
    return { ok: false, error: lastErr };
  } finally {
    removeMountPoint(path.basename(staging));
  }
};

// Стартовая инициализация + периодический ре-маунт
export const initNfsRegistry = (): void => {
  refreshRegistry().catch((e: any) => console.error('[NFS] Ошибка инициализации реестра:', e?.message || e));
  setInterval(() => {
    refreshRegistry().catch((e: any) => console.error('[NFS] Ошибка периодического обновления:', e?.message || e));
  }, 60 * 1000);
};
