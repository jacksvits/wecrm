import fs from 'fs';
import http from 'http';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { prisma } from './prisma.js';

// === Управление NFS-папками страницы «Файлы» ===
// Каждая строка file_tab_settings = одна NFS-шара. Монтирование выполняет
// helper-контейнер wecrm-nfs-mounter-1 (privileged, host-сеть): NAS принимает
// NFS только с хоста, из контейнеров по NAT отвечает «access denied».
// /mnt/nfs на хосте rshared → монтирования helper'а видны на хосте и в backend
// (том /mnt/nfs:/mnt/nfs:rslave). Реестр в памяти: resolveTabDir() синхронный,
// обновляется после изменений и периодически перепроверяется (ре-маунт).

const execFileAsync = promisify(execFile);

export const NFS_ROOT = '/mnt/nfs';
const MOUNTER = process.env.NFS_MOUNTER_CONTAINER || 'wecrm-nfs-mounter-1';

export interface NfsFolder {
  id: string;
  tabKey: string;
  label: string;
  host: string;
  export: string;
  readOnly: boolean;
  sort: number;
  allowedRoles: string[];
}

// tabKey -> абсолютный путь монтирования; синхронно читается resolveTabDir
const dirByTab = new Map<string, string>();
// tabKey -> папка (в т.ч. allowedRoles для проверки видимости по ролям)
const folderByTab = new Map<string, NfsFolder>();
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


// --- Выполнение команд в helper-контейнере через Docker API (unix-сокет, без docker CLI) ---
const DOCKER_SOCK = '/var/run/docker.sock';

const dockerRequest = (
  method: string,
  path: string,
  body?: string,
): Promise<{ status: number; data: string }> =>
  new Promise((resolve, reject) => {
    const req = http.request(
      { socketPath: DOCKER_SOCK, path, method, headers: body ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } : {} },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => resolve({ status: res.statusCode || 0, data }));
      },
    );
    req.setTimeout(60000, () => req.destroy(new Error('timeout docker api')));
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });

// sh -c <cmd> внутри контейнера-монтировщика; кидает ошибку при ненулевом коде
const mounterExec = async (cmd: string): Promise<void> => {
  const run = async (): Promise<string> => {
    const created = await dockerRequest('POST', `/containers/${MOUNTER}/exec`, JSON.stringify({
      AttachStdout: true,
      AttachStderr: true,
      Tty: true,
      Cmd: ['sh', '-c', cmd],
    }));
    if (created.status !== 201) throw new Error(created.data || `docker exec create: HTTP ${created.status}`);
    const execId = JSON.parse(created.data).Id;
    const started = await dockerRequest('POST', `/exec/${execId}/start`, JSON.stringify({ Detach: false, Tty: true }));
    if (started.status !== 200) throw new Error(started.data || `docker exec start: HTTP ${started.status}`);
    const inspect = await dockerRequest('GET', `/exec/${execId}/json`);
    const info = JSON.parse(inspect.data);
    if (info.ExitCode !== 0) throw new Error((started.data || '').trim() || `exit code ${info.ExitCode}`);
    return started.data;
  };
  try {
    await run();
  } catch (e: any) {
    const msg = String(e?.message || e);
    if (/No such container/i.test(msg)) {
      await dockerRequest('POST', `/containers/${MOUNTER}/start`).catch(() => undefined);
      await run();
      return;
    }
    throw e;
  }
};

const mountOnce = async (folder: NfsFolder): Promise<{ ok: boolean; error?: string }> => {
  const mp = mountPoint(folder.tabKey);
  if (isMounted(mp)) return { ok: true };
  const mode = folder.readOnly ? 'ro' : 'rw';
  const source = `${folder.host}:${folder.export}`;
  const attempts = [
    `mkdir -p ${shellQuote(mp)} && mount -t nfs -o ${mode},soft,timeo=50,retrans=2,nfsvers=4.1 ${shellQuote(source)} ${shellQuote(mp)}`,
    `mkdir -p ${shellQuote(mp)} && mount -t nfs -o ${mode},soft,timeo=50,retrans=2 ${shellQuote(source)} ${shellQuote(mp)}`,
  ];
  let lastErr = '';
  for (const cmd of attempts) {
    try {
      await mounterExec(cmd);
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
  await mounterExec(`umount -l ${shellQuote(mp)}`).catch(() => undefined);
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
      allowedRoles: Array.isArray(r.allowedRoles) ? r.allowedRoles : [],
    }));
  const seen = new Set<string>();
  for (const f of folders) {
    seen.add(f.tabKey);
    dirByTab.set(f.tabKey, mountPoint(f.tabKey));
    folderByTab.set(f.tabKey, f);
    await ensureMounted(f);
  }
  // Строки без host/export — из реестра убираем
  for (const key of [...dirByTab.keys()]) {
    if (!seen.has(key)) {
      dirByTab.delete(key);
      folderByTab.delete(key);
    }
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

// Папка вкладки (для проверки видимости по ролям): пустой allowedRoles = видят все
export const nfsFolderForTab = (tabKey: string): NfsFolder | undefined => folderByTab.get(tabKey);

// Видимость папки пользователю: админ видит всё; пустой список ролей = все
export const folderVisibleTo = (folder: NfsFolder, user: { role?: string; roleId?: string }): boolean => {
  if (!folder.allowedRoles.length) return true;
  if (user.role === 'admin') return true;
  return !!user.roleId && folder.allowedRoles.includes(user.roleId);
};

// Ключ вкладки из названия
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

const shellQuote = (s: string) => `'${s.replace(/'/g, `'\''`)}'`;

// Проверка монтирования ДО сохранения новой папки: пробный монт во временную точку
export const testMount = async (host: string, nfsExport: string, readOnly: boolean): Promise<{ ok: boolean; error?: string }> => {
  const staging = path.join(NFS_ROOT, `.staging-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
  const mode = readOnly ? 'ro' : 'rw';
  const source = `${host}:${nfsExport}`;
  const attempts = [
    `mkdir -p ${shellQuote(staging)} && mount -t nfs -o ${mode},soft,timeo=50,retrans=2,nfsvers=4.1 ${shellQuote(source)} ${shellQuote(staging)}`,
    `mkdir -p ${shellQuote(staging)} && mount -t nfs -o ${mode},soft,timeo=50,retrans=2 ${shellQuote(source)} ${shellQuote(staging)}`,
  ];
  let lastErr = '';
  for (const cmd of attempts) {
    try {
      await mounterExec(cmd);
      await mounterExec(`umount -l ${shellQuote(staging)}`).catch(() => undefined);
      await mounterExec(`rmdir ${shellQuote(staging)}`).catch(() => undefined);
      return { ok: true };
    } catch (e: any) {
      lastErr = String(e?.stderr || e?.message || e).trim().split('\n').pop() || 'ошибка монтирования';
    }
  }
  await mounterExec(`rmdir ${shellQuote(staging)}`).catch(() => undefined);
  return { ok: false, error: lastErr };
};

// Стартовая инициализация + периодический ре-маунт
export const initNfsRegistry = (): void => {
  refreshRegistry().catch((e: any) => console.error('[NFS] Ошибка инициализации реестра:', e?.message || e));
  setInterval(() => {
    refreshRegistry().catch((e: any) => console.error('[NFS] Ошибка периодического обновления:', e?.message || e));
  }, 60 * 1000);
};
