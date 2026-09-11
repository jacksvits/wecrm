import { useEffect, useRef, useState } from 'react' ;
import { useAuth } from '../hooks/useAuth' ;
import { api } from '../api/client' ;
import { Avatar } from './Avatar' ;
import { User } from '../types' ;

const buttonStyle: React.CSSProperties = {
  width: 40, height: 40, borderRadius: 12, border: 'none', background: 'transparent',
  color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center',
  justifyContent: 'center', flexShrink: 0,
} ;

const itemStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 12px',
  border: 'none', background: 'transparent', color: 'var(--text-primary)', fontSize: 13,
  cursor: 'pointer', textAlign: 'left',
} ;

// Мультиаккаунтность: быстрый переход администратора под другой аккаунт (⇄) и возврат (⟲)
export function AccountSwitcher({ panelPosition = 'up' }: { panelPosition?: 'up' | 'down' }) {
  const { user, switchUser, switchBack } = useAuth() ;
  const [open, setOpen] = useState(false) ;
  const [users, setUsers] = useState<User[]>([]) ;
  const panelRef = useRef<HTMLDivElement>(null) ;

  useEffect(() => {
    if (open && users.length === 0) {
      api.users.list().then((list: User[]) => setUsers(list.filter(u => u.id !== user?.id))).catch(() => {}) ;
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

  if (!user) return null ;

  // Переключённый аккаунт: кнопка возврата в свой аккаунт
  if (user.impersonatorId) {
    return (
      <button
        onClick={() => switchBack().catch(() => {})}
        title={`Вы работаете как ${user.name} (вошёл: ${user.impersonatorName}). Нажмите, чтобы вернуться в свой аккаунт`}
        style={{ ...buttonStyle, color: '#f59e0b', background: 'rgba(245, 158, 11, 0.12)' }}
      >⟲</button>
    ) ;
  }

  // Переход под другой аккаунт — только для администратора
  if (user.role !== 'admin') return null ;

  return (
    <div ref={panelRef} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)} title='Перейти под другого пользователя' style={buttonStyle}>⇄</button>
      {open && (
        <div style={{
          position: 'absolute', ...(panelPosition === 'up' ? { bottom: 48 } : { top: 48 }), left: 0,
          width: 240, maxHeight: 320, overflowY: 'auto', background: 'var(--bg-sidebar)',
          border: '1px solid var(--border-color)', borderRadius: 12,
          boxShadow: '0 8px 24px rgba(0,0,0,0.25)', padding: '4px 0', zIndex: 50,
        }}>
          <div style={{ padding: '8px 12px', fontSize: 12, color: 'var(--text-muted)' }}>Перейти под пользователя</div>
          {users.map(u => (
            <button key={u.id} onClick={() => { setOpen(false) ; switchUser(u.id).catch(() => {}) ; }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)' ; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent' ; }}
              style={itemStyle}>
              <Avatar name={u.name} avatar={u.avatar} size={24} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  ) ;
}
