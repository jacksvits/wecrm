// Склейка мелких inline-ресурсов главной welans.ru (/welans/opt/*) в бандлы.
// Контекст: главная < 3 МБ, но тянет ~95 файлов (53 JS + 39 CSS), ~84 блокируют рендер —
// мобильный аудит скорости страдает от числа запросов, а не только от веса.
//  - блокирующие <script src="/welans/opt/inline-*.js"> (без async/defer) -> один бандл (порядок документа)
//  - defer-скрипты -> один бандл с defer
//  - async-скрипты -> остаются отдельными (порядок выполнения не гарантирован, склейка опасна)
//  - <link href="/welans/opt/style-*.css"> -> один бандл (порядок документа)
// Использование: node frontend/scripts/bundle-welans.mjs   (из корня репозитория)
// Повторный запуск запрещён: если в index.html уже есть /welans/opt/bundle-*, скрипт отказывается.
import { readFileSync, writeFileSync, readdirSync, unlinkSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';

const dir = new URL('../public/welans', import.meta.url).pathname;
const htmlPath = join(dir, 'index.html');
let html = readFileSync(htmlPath, 'utf8');

if (html.includes('/welans/opt/bundle-')) {
  console.error('Уже склеено: в index.html есть /welans/opt/bundle-*. Прерываюсь.');
  process.exit(1);
}

const hash = (s) => createHash('sha256').update(s).digest('hex').slice(0, 10);
const readOpt = (p) => readFileSync(join(dir, p.replace(/^\/welans\//, '')), 'utf8');

const mergedFiles = [];
function concat(parts) {
  return parts.map(readOpt).join('\n;\n');
}
function writeBundle(content, ext) {
  const name = `opt/bundle-${hash(content)}.${ext}`;
  writeFileSync(join(dir, name), content);
  return `/welans/${name}`;
}

// --- JS ---
const scriptRe = /<script[^>]*src="(\/welans\/opt\/[^"]+?\.js)"[^>]*><\/script>/g;
const scripts = [];
for (const m of html.matchAll(scriptRe)) {
  const tag = m[0];
  scripts.push({ tag, src: m[1], defer: /\sdefer(\s|>|=)/.test(tag), async: /\sasync(\s|>|=)/.test(tag) });
}
const blocking = scripts.filter((s) => !s.defer && !s.async);
const deferred = scripts.filter((s) => s.defer && !s.async);
console.log(`script tags: всего ${scripts.length}, блокирующих ${blocking.length}, defer ${deferred.length}, async ${scripts.length - blocking.length - deferred.length}`);

if (blocking.length > 1) {
  const url = writeBundle(concat(blocking.map((s) => s.src)), 'js');
  html = html.replace(blocking[0].tag, `<script src="${url}"></script>`);
  for (const s of blocking.slice(1)) html = html.replace(s.tag, '');
  mergedFiles.push(...blocking.map((s) => s.src));
}
if (deferred.length > 1) {
  const url = writeBundle(concat(deferred.map((s) => s.src)), 'js');
  html = html.replace(deferred[0].tag, `<script src="${url}" defer></script>`);
  for (const s of deferred.slice(1)) html = html.replace(s.tag, '');
  mergedFiles.push(...deferred.map((s) => s.src));
}

// --- CSS ---
const cssRe = /<link[^>]*href="(\/welans\/opt\/[^"]+?\.css)"[^>]*>/g;
const css = [];
for (const m of html.matchAll(cssRe)) css.push({ tag: m[0], src: m[1] });
console.log(`css links: ${css.length}`);
if (css.length > 1) {
  const content = css.map((c) => readOpt(c.src)).join('\n');
  const url = writeBundle(content, 'css');
  html = html.replace(css[0].tag, `<link href="${url}" rel="stylesheet">`);
  for (const c of css.slice(1)) html = html.replace(c.tag, '');
  mergedFiles.push(...css.map((c) => c.src));
}

// --- проверки перед записью ---
for (const f of mergedFiles) {
  if (html.includes(f)) throw new Error(`Файл ${f} всё ещё referenced в HTML — прерываюсь`);
}

writeFileSync(htmlPath, html);
for (const f of new Set(mergedFiles)) {
  const p = join(dir, f.replace(/^\/welans\//, ''));
  if (existsSync(p)) unlinkSync(p);
}
console.log(`готово: удалено ${new Set(mergedFiles).size} файлов, бандлы в opt/`);
