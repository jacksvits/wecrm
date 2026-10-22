import { useEffect, useRef, useState } from 'react' ;
import { useAuth } from '../hooks/useAuth' ;
import { api } from '../api/client' ;

const buttonStyle: React.CSSProperties = {
  width: 40, height: 40, borderRadius: 12, border: 'none', background: 'transparent',
  color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center',
  justifyContent: 'center', flexShrink: 0,
} ;

const rowButtonStyle: React.CSSProperties = {
  width: 20, height: 20, padding: 0, border: 'none', background: 'transparent',
  color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center',
  justifyContent: 'center', flexShrink: 0,
} ;

// Иконка «войти в организацию» в стиле остального меню (stroke='currentColor', 20x20)
const enterIcon = 'M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4 M10 17l5-5-5-5 M15 12H3' ;
const svgProps = { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const } ;

const itemStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 12px',
  border: 'none', background: 'transparent', color: 'var(--text-primary)', fontSize: 13,
  cursor: 'pointer', textAlign: 'left',
} ;

// Домены главной организации платформы — кнопка «Сменить тенант» показывается только на них
// (дублирует MAIN_DOMAINS на backend; там видимость дополнительно защищена requirePlatformAdmin)
const MAIN_HOSTS = ['welans.cc', 'www.welans.cc', 'crm.welans.org', 'localhost', '127.0.0.1'] ;
export const isMainPlatformHost = () => MAIN_HOSTS.includes(window.location.hostname) ;

// Признак активной призрачной сессии: вошли в тенант кнопкой «Сменить тенант»
export const isPlatformTenantSwitch = () => localStorage.getItem('platformTenantSwitch') === '1' ;

// Выход из тенанта обратно на главный домен с автоматическим выходом из аккаунта тенанта
export function leaveTenantSwitch() {
  localStorage.removeItem('token') ;
  localStorage.removeItem('platformTenantSwitch') ;
  window.location.href = 'https://welans.cc' ;
}

interface TenantItem { id: string ; name: string ; slug: string ; status: string }

// Мультитенантность: быстрый вход главного администратора платформы в организацию (⇉)
// под её главным администратором. Видна только на главном домене и только администратору.
export function TenantSwitcher({ panelPosition = 'up', inRow = false }: { panelPosition?: 'up' | 'down', inRow?: boolean }) {
  const { user } = useAuth() ;
  const [open, setOpen] = useState(false) ;
  const [tenants, setTenants] = useState<TenantItem[]>([]) ;
  const [loadingId, setLoadingId] = useState<string | null>(null) ;
  const panelRef = useRef<HTMLDivElement>(null) ;

  useEffect(() => {
    if (open && tenants.length === 0) {
      api.platform.tenants()
        .then((data: any) => setTenants((data?.tenants || []).filter((t: TenantItem) => t.status === 'active')))
        .catch(() => {}) ;
    }
  }, [open]) ;

  useEffect(() => {
    if (!open) return ;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false) ;
    } ;
    document.addEventListener('mousedown', handler) ;
    return () => document.removeEventListener('mousedown', handler) ;
  }, [open]) ;

  // Только главный администратор платформы: основной домен + роль admin.
  // Во время смены аккаунта (impersonate) и внутри тенанта кнопку не показываем.
  if (!user || user.role !== 'admin' || !isMainPlatformHost() || (user as any)?.impersonatorId) return null ;

  const enter = async (t: TenantItem) => {
    if (loadingId) return ;
    setLoadingId(t.id) ;
    try {
      const res = await api.platform.impersonate(t.id) ;
      window.location.href = `${res.url}/?switch_token=${encodeURIComponent(res.token)}` ;
    } catch {
      setLoadingId(null) ;
    }
  } ;

  return (
    <div ref={panelRef} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)} title='Перейти в организацию (тенант)' style={inRow ? rowButtonStyle : buttonStyle}><svg {...svgProps}><path d={enterIcon} /></svg></button>
      {open && (
        <div data-switcher-panel style={{
          position: 'absolute', ...(panelPosition === 'up' ? { bottom: 48 } : { top: 48 }), left: 0,
          width: 240, maxHeight: 320, overflowY: 'auto', background: 'var(--bg-sidebar)',
          border: '1px solid var(--border-color)', borderRadius: 12,
          boxShadow: '0 8px 24px rgba(0,0,0,0.25)', padding: '4px 0', zIndex: 50,
        }}>
          <div style={{ padding: '8px 12px', fontSize: 12, color: 'var(--text-muted)' }}>Перейти в организацию</div>
          {tenants.length === 0 && (
            <div style={{ padding: '8px 12px', fontSize: 13, color: 'var(--text-muted)' }}>Нет активных организаций</div>
          )}
          {tenants.map(t => (
            <button key={t.id} onClick={() => { setOpen(false) ; enter(t) ; }}
              disabled={loadingId !== null}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)' ; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent' ; }}
              style={itemStyle}>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {loadingId === t.id ? 'Входим…' : t.name}
              </span>
              <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>{t.slug}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  ) ;
}
