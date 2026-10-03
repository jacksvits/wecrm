import { useEffect, useState } from 'react' ; import { useNavigate } from 'react-router-dom' ; import { api } from '../api/client' ; import { User } from '../types' ; import { useAuth } from '../hooks/useAuth' ; import { AvatarUpload } from './AvatarUpload' ; import { usePush } from '../hooks/usePush' ; import { navItems } from '../lib/navItems' ; export function Profile() { const { logout, user: authUser, refreshUser } = useAuth() ; const { supported, subscribed, subscribe, unsubscribe } = usePush() ; const [user, setUser] = useState<User | null>(null) ; const [name, setName] = useState('') ; const [email, setEmail] = useState('') ; const [username, setUsername] = useState('') ; const [emails, setEmails] = useState<string[]>([]) ; const [newEmail, setNewEmail] = useState('') ; const [hideCompletedTasks, setHideCompletedTasks] = useState(false) ; const [darkTheme, setDarkTheme] = useState(false) ; const [pushEnabled, setPushEnabled] = useState(true) ; const [notifyTask, setNotifyTask] = useState(true) ; const [notifyComment, setNotifyComment] = useState(true) ; const [notifyChat, setNotifyChat] = useState(true) ; const [notifyCall, setNotifyCall] = useState(true) ; const [notifyDeal, setNotifyDeal] = useState(true) ; const [notifyNews, setNotifyNews] = useState(true) ; const [soundEnabled, setSoundEnabled] = useState(true) ; const [localNavOrder, setLocalNavOrder] = useState<string[] | null>(null) ; const [currentPassword, setCurrentPassword] = useState('') ; const [newPassword, setNewPassword] = useState('') ; const [confirmPassword, setConfirmPassword] = useState('') ; const [message, setMessage] = useState('') ; const [error, setError] = useState('') ; const [cols, setCols] = useState(window.innerWidth >= 1200 ? 3 : window.innerWidth >= 768 ? 2 : 1) ; const [subscriptions, setSubscriptions] = useState<any[]>([]) ; const navigate = useNavigate() ; useEffect(() => { api.profile.get().then(u => { setUser(u) ; setName(u.name) ; setEmail(u.email) ; setUsername(u.username || '') ; setEmails(u.emails || []) ; setHideCompletedTasks(u.hideCompletedTasks ?? false) ; setDarkTheme(u.darkTheme ?? false) ; setPushEnabled(u.pushEnabled ?? true) ; setNotifyTask(u.notifyTask ?? true) ; setNotifyComment(u.notifyComment ?? true) ; setNotifyChat(u.notifyChat ?? true) ; setNotifyCall(u.notifyCall ?? true) ; setNotifyDeal(u.notifyDeal ?? true) ; setNotifyNews(u.notifyNews ?? true) ; setSoundEnabled(u.soundEnabled ?? true) ; }) ; }, []) ; useEffect(() => { const check = () => setCols(window.innerWidth >= 1200 ? 3 : window.innerWidth >= 768 ? 2 : 1) ; check() ; window.addEventListener('resize', check) ; return () => window.removeEventListener('resize', check) ; }, []) ; useEffect(() => { api.subscriptions.my().then((d: any) => setSubscriptions(Array.isArray(d) ? d : [])).catch(() => {}) ; }, []) ;  const handleUpdateProfile = async (e: React.FormEvent) => { e.preventDefault() ; setMessage('') ; setError('') ; try { const updated = await api.profile.update({ name, email, username: username || null, emails, hideCompletedTasks, darkTheme, }) ; setUser(updated) ; localStorage.setItem('darkTheme', updated.darkTheme ? 'true' : 'false') ; window.dispatchEvent(new Event('themechange')) ; setMessage('Профиль обновлён') ; } catch (err: any) { setError(err.message || 'Ошибка обновления') ; } } ; const handleUpdateNotifications = async (e: React.FormEvent) => { e.preventDefault() ; setMessage('') ; setError('') ; try { const updated = await api.profile.update({ pushEnabled, notifyTask, notifyComment, notifyChat, notifyCall, notifyDeal, notifyNews, soundEnabled, }) ; setUser(updated) ; setMessage('Настройки уведомлений сохранены') ; } catch (err: any) { setError(err.message || 'Ошибка сохранения настроек') ; } } ; const handleChangePassword = async (e: React.FormEvent) => { e.preventDefault() ; setMessage('') ; setError('') ; if (newPassword !== confirmPassword) { setError('Пароли не совпадают') ; return ; } try { await api.profile.changePassword(currentPassword, newPassword) ; setMessage('Пароль изменён') ; setCurrentPassword('') ; setNewPassword('') ; setConfirmPassword('') ; } catch (err: any) { setError(err.message || 'Ошибка смены пароля') ; } } ; const handleAvatarUpdate = (avatar: string | null) => { setUser(prev => prev ? { ...prev, avatar } : null) ; } ; const addEmail = () => { const trimmed = newEmail.trim() ; if (!trimmed) return ; if (emails.includes(trimmed)) { setError('Этот email уже добавлен') ; return ; } setEmails([...emails, trimmed]) ; setNewEmail('') ; setError('') ; } ; const removeEmail = (idx: number) => { setEmails(emails.filter((_, i) => i !== idx)) ; } ; if (!user) return <div>Загрузка...</div> ; const isDark = darkTheme ; const cardBg = isDark ? '#2a2a35' : '#f9f9f9' ; const borderColor = isDark ? '#3f3f55' : '#e5e5e5' ; const checkboxRow = (label: string, checked: boolean, onChange: (v: boolean) => void, disabled?: boolean) => ( <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', opacity: disabled ? 0.5 : 1 }}> <input type='checkbox' id={label} checked={checked} onChange={e => onChange(e.target.checked)} disabled={disabled} style={{ width: 18, height: 18, cursor: disabled ? 'not-allowed' : 'pointer', accentColor: '#0077ff' }} /> <label htmlFor={label} style={{ fontSize: 14, cursor: disabled ? 'not-allowed' : 'pointer', flex: 1 }}>{label}</label> </div> ) ; const isAdminUser = authUser?.role === 'admin' ;
const allowedPages = authUser?.allowedPages || [] ;
const savedNavOrder = authUser?.mobileNav || [] ;
const navByPath = (paths: string[]) => paths.map(p => navItems.find(i => i.path === p)).filter((i): i is (typeof navItems)[number] => !!i) ;
const sortNavBy = (items: typeof navItems, order: string[]) => { if (!order.length) return items ; return [...items].sort((a, b) => { const idxA = order.indexOf(a.path) ; const idxB = order.indexOf(b.path) ; if (idxA === -1 && idxB === -1) return 0 ; if (idxA === -1) return 1 ; if (idxB === -1) return -1 ; return idxA - idxB ; }) ; } ;
const availableNav = navItems.filter(item => isAdminUser || item.path === '/news' || item.path === '/chat' || allowedPages.includes(item.path)) ;
const baseNav = sortNavBy(sortNavBy(availableNav, allowedPages), savedNavOrder) ;
const effectiveNav = localNavOrder ? [...navByPath(localNavOrder).filter(i => availableNav.some(a => a.path === i.path)), ...baseNav.filter(i => !localNavOrder.includes(i.path))] : baseNav ;
const saveNavOrder = async (order: string[]) => { setMessage('') ; setError('') ; try { await api.profile.update({ mobileNav: order }) ; await refreshUser() ; setMessage('Порядок кнопок мобильной панели сохранён') ; } catch (err: any) { setError(err.message || 'Ошибка сохранения') ; } } ;
const moveNavItem = (path: string, dir: -1 | 1) => { const current = (localNavOrder ?? effectiveNav.map(i => i.path)) ; const idx = current.indexOf(path) ; const target = idx + dir ; if (idx < 0 || target < 0 || target >= current.length) return ; const next = [...current] ; [next[idx], next[target]] = [next[target], next[idx]] ; setLocalNavOrder(next) ; saveNavOrder(next) ; } ;
const resetNavOrder = () => { setLocalNavOrder(null) ; saveNavOrder([]) ; } ;
const SUB_STATUS: Record<string, { label: string; bg: string; color: string }> = {
  new: { label: 'Новая', bg: '#dbeafe', color: '#1d4ed8' },
  active: { label: 'Активна', bg: '#dcfce7', color: '#166534' },
  paused: { label: 'Приостановлена', bg: '#fef3c7', color: '#92400e' },
  cancelled: { label: 'Отменена', bg: '#fee2e2', color: '#991b1b' },
} ;
const SUB_PERIOD: Record<string, string> = { month: 'мес.', quarter: 'квартал', year: 'год' } ;
const fmtMoney = (v: any) => Number(v || 0).toLocaleString('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) ;

return (
    <div style={{ maxWidth: 1240, margin: '0 auto', padding: '0 16px' }}>
      <h2 style={{ fontSize: 18, marginBottom: 12 }}>Профиль</h2>
      {message && <div style={{ padding: 14, borderRadius: 12, background: '#dcfce7', color: '#166534', marginBottom: 14, fontSize: 14, fontWeight: 500 }}>{message}</div>}
      {error && <div style={{ padding: 14, borderRadius: 12, background: '#fee2e2', color: '#991b1b', marginBottom: 14, fontSize: 14, fontWeight: 500 }}>{error}</div>}

      {/* Компактная шапка */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', borderRadius: 16, background: cardBg, border: `1px solid ${borderColor}`, marginBottom: 16, flexWrap: 'wrap' }}>
        <AvatarUpload name={user.name} avatar={user.avatar} onUpdate={handleAvatarUpdate} size={56} />
        <div style={{ flex: 1, minWidth: 160 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>{user.name}</span>
            {user.role ? <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 8, background: isDark ? '#353545' : '#f0f0f0', color: 'var(--text-secondary)' }}>{String(user.role)}</span> : null}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
            {user.lastActiveAt ? `Последняя активность: ${new Date(user.lastActiveAt).toLocaleString('ru')}` : 'Нажмите на аватар, чтобы изменить'}
          </div>
        </div>
        <button onClick={logout} style={{ padding: '8px 16px', borderRadius: 8, background: '#dc2626', color: '#fff', border: 'none', fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>
          Выйти
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: cols === 3 ? '1fr 1fr 1fr' : cols === 2 ? '1fr 1fr' : '1fr', gap: 16, alignItems: 'start' }}>
        {/* Колонка 1: данные + пароль */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
          <div style={{ padding: 16, borderRadius: 12, background: cardBg, border: `1px solid ${borderColor}` }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 12px', color: 'var(--text-primary)' }}>Основные данные</h3>
            <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>Имя</label>
                <input value={name} onChange={e => setName(e.target.value)} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 14, background: 'var(--bg-input, #fff)', color: 'var(--text-primary)', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>Email</label>
                <input value={email} onChange={e => setEmail(e.target.value)} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 14, background: 'var(--bg-input, #fff)', color: 'var(--text-primary)', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>Логин</label>
                <input value={username} onChange={e => setUsername(e.target.value)} placeholder='Не задан' style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 14, background: 'var(--bg-input, #fff)', color: 'var(--text-primary)', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>Дополнительные email</label>
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <input type='email' value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder='Добавить email' style={{ flex: 1, minWidth: 0, padding: '9px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 14, background: 'var(--bg-input, #fff)', color: 'var(--text-primary)' }} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault() ; addEmail() ; } }} />
                  <button type='button' onClick={addEmail} style={{ padding: '9px 14px', borderRadius: 8, border: 'none', background: '#0077ff', color: '#fff', fontSize: 14, cursor: 'pointer' }}>+</button>
                </div>
                {emails.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {emails.map((em, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 10px', borderRadius: 6, background: isDark ? '#353545' : '#f0f0f0', fontSize: 13 }}>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{em}</span>
                        <button type='button' onClick={() => removeEmail(idx)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>&times;</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type='checkbox' id='hideCompleted' checked={hideCompletedTasks} onChange={e => setHideCompletedTasks(e.target.checked)} style={{ accentColor: '#0077ff' }} />
                <label htmlFor='hideCompleted' style={{ fontSize: 13 }}>Скрывать выполненные задачи</label>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type='checkbox' id='darkTheme' checked={darkTheme} onChange={e => setDarkTheme(e.target.checked)} style={{ accentColor: '#0077ff' }} />
                <label htmlFor='darkTheme' style={{ fontSize: 13 }}>Тёмная тема</label>
              </div>
              <button type='submit' style={{ padding: '9px 16px', borderRadius: 8, background: '#0077ff', color: '#fff', border: 'none', fontSize: 14, cursor: 'pointer', fontWeight: 500, alignSelf: 'flex-start' }}>Сохранить</button>
            </form>
          </div>

          <div style={{ padding: 16, borderRadius: 12, background: cardBg, border: `1px solid ${borderColor}` }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 12px', color: 'var(--text-primary)' }}>Смена пароля</h3>
            <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input type='password' placeholder='Текущий пароль' value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 14, background: 'var(--bg-input, #fff)', color: 'var(--text-primary)', boxSizing: 'border-box' }} />
              <input type='password' placeholder='Новый пароль' value={newPassword} onChange={e => setNewPassword(e.target.value)} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 14, background: 'var(--bg-input, #fff)', color: 'var(--text-primary)', boxSizing: 'border-box' }} />
              <input type='password' placeholder='Подтвердите пароль' value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 14, background: 'var(--bg-input, #fff)', color: 'var(--text-primary)', boxSizing: 'border-box' }} />
              <button type='submit' style={{ padding: '9px 16px', borderRadius: 8, background: '#0077ff', color: '#fff', border: 'none', fontSize: 14, cursor: 'pointer', fontWeight: 500, alignSelf: 'flex-start' }}>Изменить пароль</button>
            </form>
          </div>
        </div>

        {/* Колонка 2: уведомления */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
          <div style={{ padding: 16, borderRadius: 12, background: cardBg, border: `1px solid ${borderColor}` }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 12px', color: 'var(--text-primary)' }}>Уведомления</h3>
            <form onSubmit={handleUpdateNotifications} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <h4 style={{ fontSize: 13, fontWeight: 600, margin: '4px 0 8px', color: 'var(--text-secondary)' }}>Push-уведомления в браузере</h4>
              {supported ? (
                <div style={{ marginBottom: 8 }}>
                  {subscribed ? (
                    <button type='button' onClick={unsubscribe} style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
                        <path d='M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9' />
                        <path d='M13.73 21a2 2 0 0 1-3.46 0' />
                        <line x1='1' y1='1' x2='23' y2='23' />
                      </svg>
                      Push ON — нажмите чтобы отключить
                    </button>
                  ) : (
                    <button type='button' onClick={subscribe} style={{ padding: '7px 14px', borderRadius: 8, border: 'none', background: '#0077ff', color: '#fff', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
                        <path d='M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9' />
                        <path d='M13.73 21a2 2 0 0 1-3.46 0' />
                      </svg>
                      Push OFF — нажмите чтобы включить
                    </button>
                  )}
                </div>
              ) : (
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>Push-уведомления не поддерживаются в этом браузере</div>
              )}
              {checkboxRow('Включить push-уведомления', pushEnabled, setPushEnabled, !subscribed)}
              <h4 style={{ fontSize: 13, fontWeight: 600, margin: '12px 0 4px', color: 'var(--text-secondary)' }}>Типы уведомлений</h4>
              {checkboxRow('Задачи (назначение, изменения)', notifyTask, setNotifyTask, !pushEnabled)}
              {checkboxRow('Комментарии к задачам', notifyComment, setNotifyComment, !pushEnabled)}
              {checkboxRow('Сообщения в общем чате', notifyChat, setNotifyChat, !pushEnabled)}
              {checkboxRow('Звонки', notifyCall, setNotifyCall, !pushEnabled)}
              {checkboxRow('Сделки', notifyDeal, setNotifyDeal, !pushEnabled)}
              {checkboxRow('Новости', notifyNews, setNotifyNews, !pushEnabled)}
              <h4 style={{ fontSize: 13, fontWeight: 600, margin: '12px 0 4px', color: 'var(--text-secondary)' }}>Звук</h4>
              {checkboxRow('Звуковое уведомление в чате', soundEnabled, setSoundEnabled)}
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                Воспроизводить звук при новых сообщениях в общем чате
              </div>
              <button type='submit' style={{ marginTop: 12, padding: '9px 16px', borderRadius: 8, background: '#0077ff', color: '#fff', border: 'none', fontSize: 14, cursor: 'pointer', fontWeight: 500, alignSelf: 'flex-start' }}>Сохранить</button>
            </form>
          </div>
        </div>

        {/* Колонка 3: мобильная панель + подписки */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
          {availableNav.length > 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 16, borderRadius: 12, background: cardBg, border: `1px solid ${borderColor}` }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>Мобильная панель</h3>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Порядок кнопок нижней панели: первые три — слева от уведомлений, следующие две — справа.</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {effectiveNav.map((item, idx) => (
                  <div key={item.path} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: 'var(--text-primary)' }}>
                    <svg width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' style={{ color: 'var(--text-muted)', flexShrink: 0 }}><path d={item.icon} /></svg>
                    <span style={{ flex: 1 }}>{item.label}</span>
                    <button type='button' onClick={() => moveNavItem(item.path, -1)} disabled={idx === 0} style={{ padding: '2px 8px', borderRadius: 4, border: '1px solid var(--border-color)', background: 'transparent', cursor: 'pointer', opacity: idx === 0 ? 0.3 : 1, fontSize: 12, color: 'var(--text-primary)' }}>↑</button>
                    <button type='button' onClick={() => moveNavItem(item.path, 1)} disabled={idx === effectiveNav.length - 1} style={{ padding: '2px 8px', borderRadius: 4, border: '1px solid var(--border-color)', background: 'transparent', cursor: 'pointer', opacity: idx === effectiveNav.length - 1 ? 0.3 : 1, fontSize: 12, color: 'var(--text-primary)' }}>↓</button>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
                <button type='button' onClick={resetNavOrder} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: 13, cursor: 'pointer' }}>Сбросить (порядок роли)</button>
                {(savedNavOrder.length > 0 || localNavOrder) && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Сохраняется автоматически</span>}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 16, borderRadius: 12, background: cardBg, border: `1px solid ${borderColor}` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>Мои подписки</h3>
              <button type='button' onClick={() => navigate('/subscriptions')} style={{ padding: '4px 10px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer' }}>
                Все →
              </button>
            </div>
            {subscriptions.length === 0 ? (
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Нет оформленных подписок</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {subscriptions.slice(0, 5).map(s => {
                  const st = SUB_STATUS[s.status] || { label: s.status, bg: 'var(--bg-hover)', color: 'var(--text-primary)' } ;
                  return (
                    <div key={s.id} style={{ display: 'flex', flexDirection: 'column', gap: 3, padding: '8px 10px', borderRadius: 8, background: isDark ? '#353545' : '#f0f0f0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.product?.name || 'Услуга'}</span>
                        {s.status !== 'cancelled' && (
                          <button
                            type='button'
                            title='Отказаться от подписки'
                            onClick={() => {
                              if (!window.confirm(`Отказаться от подписки «${s.product?.name || 'Услуга'}» (№${s.number})?`)) return ;
                              api.subscriptions.cancel(s.id).then(() => api.subscriptions.my().then((d: any) => setSubscriptions(Array.isArray(d) ? d : []))).catch(() => {}) ;
                            }}
                            style={{ border: 'none', background: 'none', color: 'var(--text-muted)', fontSize: 14, lineHeight: 1, cursor: 'pointer', padding: '0 2px' }}
                          >
                            ✕
                          </button>
                        )}
                        <span style={{ padding: '1px 8px', borderRadius: 8, fontSize: 11, fontWeight: 600, background: st.bg, color: st.color, whiteSpace: 'nowrap' }}>{st.label}</span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        №{s.number} · {fmtMoney(s.price)} ₽ / {SUB_PERIOD[s.period] || s.period}
                      </div>
                    </div>
                  ) ;
                })}
                {subscriptions.length > 5 && (
                  <button type='button' onClick={() => navigate('/subscriptions')} style={{ alignSelf: 'flex-start', padding: '2px 0', border: 'none', background: 'none', color: '#0077ff', fontSize: 13, cursor: 'pointer' }}>
                    И ещё {subscriptions.length - 5}…
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  ) ;
}
