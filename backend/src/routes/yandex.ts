import { Router } from 'express' ; import { z } from 'zod' ; import { prisma } from '../lib/prisma.js' ; import { authMiddleware, AuthRequest } from '../middleware/auth.js' ; const router = Router() ; const adminOnly = (req: AuthRequest, res: any, next: any) => { if (req.user?.role !== 'admin') { return res.status(403).json({ error: 'Требуются права администратора' }) ; } next() ; } ;
// API-ключ Яндекс.Карт доступен всем авторизованным пользователям — нужен фронту для отображения карты в задачах
router.get('/settings', authMiddleware, async (_req, res) => { const settings = await prisma.yandexSettings.findFirst() ; res.json({ apiKey: settings?.apiKey || '' }) ; }) ;
const settingsSchema = z.object({ apiKey: z.string().optional().nullable() }) ;
router.post('/settings', authMiddleware, adminOnly, async (req, res) => { try { const data = settingsSchema.parse(req.body) ; const existing = await prisma.yandexSettings.findFirst() ; if (existing) { const updated = await prisma.yandexSettings.update({ where: { id: existing.id }, data: { apiKey: data.apiKey || null } }) ; res.json({ apiKey: updated.apiKey || '' }) ; } else { const created = await prisma.yandexSettings.create({ data: { apiKey: data.apiKey || null } }) ; res.status(201).json({ apiKey: created.apiKey || '' }) ; } } catch (err: any) { res.status(400).json({ error: err.message }) ; } }) ;
// Геокодинг адреса: сначала Яндекс (ключ на сервере), при недоступности — резерв через Nominatim (OSM)
router.get('/geocode', authMiddleware, async (req, res) => {
  try {
    const address = String(req.query.address || '').trim() ;
    if (!address) return res.status(400).json({ error: 'Не указан адрес' }) ;
    // 1) Яндекс HTTP Геокодер
    try {
      const settings = await prisma.yandexSettings.findFirst() ;
      if (settings?.apiKey) {
        const url = `https://geocode-maps.yandex.ru/1.x/?apikey=${encodeURIComponent(settings.apiKey)}&format=json&geocode=${encodeURIComponent(address)}` ;
        const r = await fetch(url) ;
        if (r.ok) {
          const data: any = await r.json() ;
          const members = data?.response?.GeoObjectCollection?.featureMember || [] ;
          const first = members[0] ;
          if (first) {
            const parts = String(first.GeoObject?.Point?.pos || '').split(' ').map(Number) ;
            const lon = parts[0] ; const lat = parts[1] ;
            if (lon && lat) return res.json({ found: true, coords: [lat, lon], formatted: first.GeoObject?.metaDataProperty?.GeocoderMetaData?.text || address, source: 'yandex' }) ;
          }
        }
      }
    } catch (e) { console.warn('[yandex/geocode] Яндекс недоступен, пробую Nominatim:', e) }
    // 2) Резерв: Nominatim (OpenStreetMap)
    try {
      const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(address)}`, { headers: { 'User-Agent': 'wecrm-map-fallback/1.0 (https://welans.cc)' } }) ;
      if (r.ok) {
        const data: any = await r.json() ;
        const first = data && data[0] ;
        const lat = Number(first?.lat) ; const lon = Number(first?.lon) ;
        if (lat && lon) return res.json({ found: true, coords: [lat, lon], formatted: first.display_name || address, source: 'osm' }) ;
      }
    } catch (e) { console.warn('[yandex/geocode] Nominatim недоступен:', e) }
    res.json({ found: false }) ;
  } catch (err: any) { res.status(500).json({ error: err.message }) ; }
}) ;
export default router ;
