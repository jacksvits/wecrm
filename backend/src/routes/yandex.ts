import { Router } from 'express' ; import { z } from 'zod' ; import { prisma } from '../lib/prisma.js' ; import { authMiddleware, AuthRequest } from '../middleware/auth.js' ; const router = Router() ; const adminOnly = (req: AuthRequest, res: any, next: any) => { if (req.user?.role !== 'admin') { return res.status(403).json({ error: 'Требуются права администратора' }) ; } next() ; } ;
// API-ключ Яндекс.Карт доступен всем авторизованным пользователям — нужен фронту для отображения карты в задачах
router.get('/settings', authMiddleware, async (_req, res) => { const settings = await prisma.yandexSettings.findFirst() ; res.json({ apiKey: settings?.apiKey || '' }) ; }) ;
const settingsSchema = z.object({ apiKey: z.string().optional().nullable() }) ;
router.post('/settings', authMiddleware, adminOnly, async (req, res) => { try { const data = settingsSchema.parse(req.body) ; const existing = await prisma.yandexSettings.findFirst() ; if (existing) { const updated = await prisma.yandexSettings.update({ where: { id: existing.id }, data: { apiKey: data.apiKey || null } }) ; res.json({ apiKey: updated.apiKey || '' }) ; } else { const created = await prisma.yandexSettings.create({ data: { apiKey: data.apiKey || null } }) ; res.status(201).json({ apiKey: created.apiKey || '' }) ; } } catch (err: any) { res.status(400).json({ error: err.message }) ; } }) ;
// Прокси тайлов Яндекс.Карт — чтобы карта не зависела от блокировок внешних доменов на устройствах (без авторизации: это публичные картинки, <img> не шлёт токен)
router.get('/tiles', async (req, res) => {
  try {
    const l = String(req.query.l || 'map') ; const x = String(req.query.x || '') ; const y = String(req.query.y || '') ; const z = String(req.query.z || '') ; const lang = String(req.query.lang || 'ru_RU') ;
    if (!x || !y || !z) return res.status(400).json({ error: 'Не указаны координаты тайла' }) ;
    const url = `https://core-renderer-tiles.maps.yandex.net/tiles?l=${encodeURIComponent(l)}&x=${encodeURIComponent(x)}&y=${encodeURIComponent(y)}&z=${encodeURIComponent(z)}&lang=${encodeURIComponent(lang)}` ;
    const r = await fetch(url) ;
    if (!r.ok) return res.status(502).json({ error: `Тайлы Яндекс вернули HTTP ${r.status}` }) ;
    const buf = Buffer.from(await r.arrayBuffer()) ;
    res.setHeader('Content-Type', r.headers.get('content-type') || 'image/png') ;
    res.setHeader('Cache-Control', 'public, max-age=86400') ;
    res.send(buf) ;
  } catch (err: any) { res.status(500).json({ error: err.message }) ; }
}) ;
// Геокодинг адреса — только Яндекс (ключ на сервере). У ключа ограничение по HTTP Referer: серверные запросы без Referer отклоняются (403), поэтому отправляем Referer сайта
router.get('/geocode', authMiddleware, async (req, res) => {
  try {
    const address = String(req.query.address || '').trim() ;
    if (!address) return res.status(400).json({ error: 'Не указан адрес' }) ;
    const settings = await prisma.yandexSettings.findFirst() ;
    if (!settings?.apiKey) return res.status(400).json({ error: 'API-ключ Яндекс не задан' }) ;
    const url = `https://geocode-maps.yandex.ru/1.x/?apikey=${encodeURIComponent(settings.apiKey)}&format=json&geocode=${encodeURIComponent(address)}` ;
    const r = await fetch(url, { headers: { Referer: 'https://welans.cc/' } }) ;
    if (!r.ok) return res.status(502).json({ error: `Геокодер Яндекс вернул HTTP ${r.status}` }) ;
    const data: any = await r.json() ;
    const members = data?.response?.GeoObjectCollection?.featureMember || [] ;
    const first = members[0] ;
    if (!first) return res.json({ found: false }) ;
    const parts = String(first.GeoObject?.Point?.pos || '').split(' ').map(Number) ;
    const lon = parts[0] ; const lat = parts[1] ;
    if (!lon || !lat) return res.json({ found: false }) ;
    res.json({ found: true, coords: [lat, lon], formatted: first.GeoObject?.metaDataProperty?.GeocoderMetaData?.text || address, source: 'yandex' }) ;
  } catch (err: any) { res.status(500).json({ error: err.message }) ; }
}) ;
export default router ;
