import { useEffect, useRef, useState } from 'react' ; import L from 'leaflet' ; import 'leaflet/dist/leaflet.css' ; import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png' ; import markerIcon from 'leaflet/dist/images/marker-icon.png' ; import markerShadow from 'leaflet/dist/images/marker-shadow.png' ; import { api } from '../api/client' ;
declare global { interface Window { ymaps?: any } }
L.Icon.Default.mergeOptions({ iconRetinaUrl: markerIcon2x, iconUrl: markerIcon, shadowUrl: markerShadow }) ;
let ymapsPromise: Promise<any> | null = null ;
const loadYmaps = (apiKey: string) => { if (!ymapsPromise) { ymapsPromise = new Promise((resolve, reject) => { if (window.ymaps) { resolve(window.ymaps) ; return ; } const script = document.createElement('script') ; script.src = `https://api-maps.yandex.ru/2.1/?apikey=${apiKey}&lang=ru_RU` ; script.async = true ; script.onload = () => { if (window.ymaps) { resolve(window.ymaps) } else { ymapsPromise = null ; reject(new Error('API Яндекс.Карт загрузился некорректно')) } } ; script.onerror = () => { ymapsPromise = null ; reject(new Error('Не удалось загрузить API Яндекс.Карт')) } ; document.head.appendChild(script) ; }) ; } return ymapsPromise ; } ;
const retryButtonStyle: React.CSSProperties = { marginTop: 8, padding: '6px 14px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)', cursor: 'pointer', fontSize: 13 } ;
export function YandexMap({ address }: { address: string }) { const containerRef = useRef<HTMLDivElement>(null) ; const mapRef = useRef<any>(null) ; const leafletRef = useRef<L.Map | null>(null) ; const [status, setStatus] = useState<'loading' | 'ready' | 'nokey' | 'notfound' | 'error'>('loading') ; const [mode, setMode] = useState<'yandex' | 'leaflet'>('yandex') ; const [errorMsg, setErrorMsg] = useState('') ; const [attempt, setAttempt] = useState(0) ;
  useEffect(() => { let cancelled = false ; const destroyMaps = () => { try { if (mapRef.current) { mapRef.current.destroy() } } catch (e) { /* ignore */ } mapRef.current = null ; try { if (leafletRef.current) { leafletRef.current.remove() } } catch (e) { /* ignore */ } leafletRef.current = null } ;
    (async () => { try { setStatus('loading') ; setErrorMsg('') ; const s = await api.yandex.getSettings() ; const key = s?.apiKey ; if (!key) { if (!cancelled) setStatus('nokey') ; return } destroyMaps() ;
      // 1) Основной режим: JS API Яндекс.Карт
      try { const ymaps = await loadYmaps(key) ; if (cancelled) return ; await new Promise<void>((resolve) => ymaps.ready(() => resolve())) ; if (cancelled) return ;
        const geocodeAndShow = async (): Promise<boolean> => { const res = await ymaps.geocode(address) ; const first = res.geoObjects.get(0) ; if (!first) return false ; const coords = first.geometry.getCoordinates() ; await new Promise(r => setTimeout(r, 50)) ; if (cancelled || !containerRef.current) return false ; mapRef.current = new ymaps.Map(containerRef.current, { center: coords, zoom: 16, controls: ['zoomControl', 'geolocationControl'] }) ; mapRef.current.geoObjects.add(new ymaps.Placemark(coords, { balloonContent: address })) ; return true } ;
        let ok = await geocodeAndShow() ; if (!ok && !cancelled) { await new Promise(r => setTimeout(r, 1500)) ; if (!cancelled) ok = await geocodeAndShow() } ; if (cancelled) return ;
        if (ok) { setMode('yandex') ; setStatus('ready') ; return }
      } catch (e) { console.warn('[YandexMap] JS API Яндекс недоступен, включаю резервный режим:', e) }
      // 2) Резервный режим: геокодинг через сервер (ключ Яндекс) + Leaflet с тайлами OpenStreetMap — без внешних JS-скриптов
      const g = await api.yandex.geocodeAddress(address) ; if (cancelled) return ;
      let coords: [number, number] | null = null ;
      if (g?.found && g.coords) coords = [g.coords[0], g.coords[1]] ;
      if (!coords) { try { const nr = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&accept-language=ru&q=${encodeURIComponent(address)}`) ; if (nr.ok) { const nd: any = await nr.json() ; const f = nd && nd[0] ; const nlat = Number(f?.lat) ; const nlon = Number(f?.lon) ; if (nlat && nlon) coords = [nlat, nlon] } } catch (e) { console.warn('[YandexMap] Nominatim из браузера недоступен:', e) } }
      if (!coords) { setStatus('notfound') ; return }
      await new Promise(r => setTimeout(r, 50)) ;
      if (!containerRef.current) { if (!cancelled) setStatus('error') ; return }
      const map = L.map(containerRef.current, { center: coords, zoom: 16 }) ; L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(map) ; L.marker(coords).addTo(map) ; leafletRef.current = map ; setMode('leaflet') ; setStatus('ready') ;
    } catch (e: any) { console.error('Yandex map error:', e) ; if (!cancelled) { setErrorMsg((e && e.message) || String(e)) ; setStatus('error') } } })() ;
    return () => { cancelled = true ; destroyMaps() } ;
  }, [address, attempt]) ;
  const retryBtn = <button type='button' onClick={() => setAttempt(a => a + 1)} style={retryButtonStyle}>Повторить</button> ;
  const box = (children: React.ReactNode) => <div style={{ padding: 16, borderRadius: 12, background: 'var(--bg-body)', fontSize: 13, color: 'var(--text-muted)' }}>{children}</div> ;
  if (status === 'nokey') return box(<>Для отображения карты укажите API-ключ Яндекс.Карт в Настройки → Интеграции → Яндекс{retryBtn}</>) ;
  if (status === 'error') return box(<>Ошибка отображения карты{errorMsg ? `: ${errorMsg}` : ''}.{retryBtn}</>) ;
  if (status === 'notfound') return box(<>Адрес «{address}» не найден на карте. Проверьте правильность адреса.{retryBtn}</>) ;
  return ( <div ref={containerRef} style={{ width: '100%', height: 300, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border-color)', background: 'var(--bg-body)' }} /> ) ; }
