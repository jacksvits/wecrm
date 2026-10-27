import { useEffect, useState } from 'react' ; import { api } from '../api/client' ; import { Role, Status } from '../types' ; import { useAuth } from '../hooks/useAuth' ; import { useIsMobile } from '../hooks/useIsMobile' ; import { navItems } from '../lib/navItems' ; const AVAILABLE_PAGES = [ { path: '/', label: 'Дашборд' }, { path: '/tasks', label: 'Задачи' }, { path: '/mail', label: 'Почтовый клиент' }, { path: '/schedule', label: 'Расписание' }, { path: '/deals', label: 'Сделки' }, { path: '/contacts', label: 'Контакты' }, { path: '/products', label: 'Каталог' }, { path: '/projects', label: 'Проекты' }, { path: '/users', label: 'Пользователи' }, { path: '/news', label: 'Новости' },
  { path: '/notes', label: 'Заметки' },
  { path: '/reminders', label: 'Напоминания' }, { path: '/files', label: 'Файлы' }, { path: '/chat', label: 'Чат' }, { path: '/support', label: 'Тех. поддержка' }, { path: '/browser', label: 'Браузер' }, { path: '/director', label: 'Директор' }, ] ; const getMobileNavItems = (allowedPages: string[]) => {
  const filtered = navItems.filter(item => item.path === '/news' || allowedPages.includes(item.path)) ;
  return [...filtered].sort((a, b) => {
    const idxA = allowedPages.indexOf(a.path) ;
    const idxB = allowedPages.indexOf(b.path) ;
    if (idxA === -1 && idxB === -1) return 0 ;
    if (idxA === -1) return 1 ;
    if (idxB === -1) return -1 ;
    return idxA - idxB ;
  }) ;
} ;
const fieldLabelStyle: React.CSSProperties = { fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 4 };

// Единый переключатель права роли: жирный заголовок + пояснение мелким шрифтом
const PermToggle = ({ checked, onChange, title, desc, disabled }: { checked: boolean; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; title: string; desc?: string; disabled?: boolean }) => (
  <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 14, cursor: disabled ? 'default' : 'pointer', padding: '4px 0' }}>
    <input type='checkbox' checked={checked} onChange={onChange} disabled={disabled} style={{ marginTop: 3, flexShrink: 0 }} />
    <span style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontWeight: 500 }}>{title}</div>
      {desc && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2, lineHeight: 1.4 }}>{desc}</div>}
    </span>
  </label>
);

export function RoleManager() { const { user: currentUser } = useAuth() ; const tariffPages: string[] = (currentUser as any)?.allowedPages || [] ; const isAdminUser = (currentUser as any)?.role === 'admin' ; const pageAllowedByTariff = (path: string) => isAdminUser || tariffPages.length === 0 || tariffPages.includes(path) ; const tasksAllowed = pageAllowedByTariff('/tasks') ; const projectsAllowed = pageAllowedByTariff('/projects') ; const supportAllowed = pageAllowedByTariff('/support') ; const dealsAllowed = pageAllowedByTariff('/deals') ; const catalogAllowed = pageAllowedByTariff('/products') ; const [roles, setRoles] = useState<Role[]>([]) ; const [taskStatuses, setTaskStatuses] = useState<Status[]>([]) ; const [showModal, setShowModal] = useState(false) ; const [editingId, setEditingId] = useState<string | null>(null) ; const [error, setError] = useState('') ; const [form, setForm] = useState({ name: '', label: '', color: '#f0f0f0', textColor: '#666', sortOrder: 0, allowedPages: [] as string[], isAssignable: true, canAccessChat: true, canAccessSupportChat: false, canSeeAllSupportTickets: false, showFinancesTab: false, stockAccess: true, canChangeTaskStatus: true, allowedTaskStatuses: [] as string[], canCreateNews: true, canEditNews: true, canHandleSpam: false, canAccessProjects: false, showCalendarMetric: true, isSystemHandler: false, canReadContactAccesses: true, canEditContactAccesses: false, canDeleteContactAccesses: false, notifyOnNewTask: true, notifyOnNewDeal: false, notifyOnNewComment: false, notifyOnNewChat: false, notifyOnNewCall: false, notifyOnNewNews: false, }) ; useEffect(() => { loadRoles() ; api.statuses.list('task').then(list => setTaskStatuses(list)).catch(() => {}) ; }, []) ; const loadRoles = () => { api.roles.list().then(setRoles).catch(() => {}) ; } ; const openCreate = () => { setEditingId(null) ; setForm({ name: '', label: '', color: '#f0f0f0', textColor: '#666', sortOrder: roles.length + 1, allowedPages: ['/'], isAssignable: true, canAccessChat: true, canAccessSupportChat: false, canSeeAllSupportTickets: false, showFinancesTab: false, stockAccess: true, canChangeTaskStatus: true, allowedTaskStatuses: [] as string[], canCreateNews: true, canEditNews: true, canHandleSpam: false, canAccessProjects: false, showCalendarMetric: true, isSystemHandler: false, canReadContactAccesses: true, canEditContactAccesses: false, canDeleteContactAccesses: false, notifyOnNewTask: true, notifyOnNewDeal: false, notifyOnNewComment: false, notifyOnNewChat: false, notifyOnNewCall: false, notifyOnNewNews: false }) ; setError('') ; setShowModal(true) ; } ; const openEdit = (r: Role) => { setEditingId(r.id) ; setForm({ name: r.name, label: r.label, color: r.color, textColor: r.textColor, sortOrder: r.sortOrder, allowedPages: r.allowedPages?.length ? r.allowedPages : ['/'], isAssignable: r.isAssignable ?? true, canAccessChat: r.canAccessChat ?? true, canAccessSupportChat: r.canAccessSupportChat ?? false, canSeeAllSupportTickets: r.canSeeAllSupportTickets ?? false, showFinancesTab: r.showFinancesTab ?? false, stockAccess: r.stockAccess ?? true, canChangeTaskStatus: r.canChangeTaskStatus ?? true, canCreateNews: r.canCreateNews ?? true, canEditNews: r.canEditNews ?? true, canHandleSpam: r.canHandleSpam ?? false, canAccessProjects: r.canAccessProjects ?? false, showCalendarMetric: r.showCalendarMetric ?? true, isSystemHandler: r.isSystemHandler ?? false, canReadContactAccesses: r.canReadContactAccesses ?? true, canEditContactAccesses: r.canEditContactAccesses ?? false, canDeleteContactAccesses: r.canDeleteContactAccesses ?? false, allowedTaskStatuses: r.allowedTaskStatuses ?? [], notifyOnNewTask: r.notifyOnNewTask ?? true, notifyOnNewDeal: r.notifyOnNewDeal ?? false, notifyOnNewComment: r.notifyOnNewComment ?? false, notifyOnNewChat: r.notifyOnNewChat ?? false, notifyOnNewCall: r.notifyOnNewCall ?? false, notifyOnNewNews: r.notifyOnNewNews ?? false, }) ; setError('') ; setShowModal(true) ; } ; const togglePage = (path: string) => { setForm(prev => { const has = prev.allowedPages.includes(path) ; if (has) return { ...prev, allowedPages: prev.allowedPages.filter(p => p !== path) } ; return { ...prev, allowedPages: [...prev.allowedPages, path] } ; }) ; } ; const toggleTaskStatus = (name: string) => { setForm(prev => { const has = prev.allowedTaskStatuses.includes(name) ; if (has) return { ...prev, allowedTaskStatuses: prev.allowedTaskStatuses.filter(s => s !== name) } ; return { ...prev, allowedTaskStatuses: [...prev.allowedTaskStatuses, name] } ; }) ; } ;
const movePageUp = (path: string) => { setForm(prev => { const idx = prev.allowedPages.indexOf(path) ; if (idx <= 0) return prev ; const pages = [...prev.allowedPages] ; [pages[idx - 1], pages[idx]] = [pages[idx], pages[idx - 1]] ; return { ...prev, allowedPages: pages } ; }) ; } ; const movePageDown = (path: string) => { setForm(prev => { const idx = prev.allowedPages.indexOf(path) ; if (idx < 0 || idx >= prev.allowedPages.length - 1) return prev ; const pages = [...prev.allowedPages] ; [pages[idx], pages[idx + 1]] = [pages[idx + 1], pages[idx]] ; return { ...prev, allowedPages: pages } ; }) ; } ;
const mobileNavItems = getMobileNavItems(form.allowedPages) ;
const mobileLeftNav = mobileNavItems.slice(0, 3) ;
const mobileRightNav = mobileNavItems.slice(3, 5) ;
const mobileNavBtnStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '4px 0', fontSize: 9, color: 'var(--text-muted)', minWidth: 44, flex: 1 } ;
const handleSubmit = async (e: React.FormEvent) => { e.preventDefault() ; setError('') ; try { if (editingId) await api.roles.update(editingId, form) ; else await api.roles.create(form) ; setShowModal(false) ; loadRoles() ; } catch (err: any) { setError(err.message || 'Ошибка') ; } } ; const handleDelete = async (id: string) => { if (!confirm('Удалить роль?')) return ; try { await api.roles.delete(id) ; loadRoles() ; } catch (err: any) { alert(err.message || 'Ошибка удаления') ; } } ; const isAdmin = currentUser?.role === 'admin' ; const isMobile = useIsMobile() ; return ( <div> <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}> <h2 style={{ margin: 0, fontSize: 18 }}>Роли</h2> {isAdmin && ( <button onClick={openCreate} style={{ padding: '8px 16px', borderRadius: 12, border: 'none', background: '#1a1a1a', color: '#fff', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>+ Создать роль</button> )} </div> <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}> {roles.map(r => ( <div key={r.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: 12, background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}> <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}> <div style={{ width: 32, height: 32, borderRadius: 8, background: r.color, color: r.textColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 12 }}>{r.label[0]}</div> <div> <div style={{ fontWeight: 500 }}>{r.label}</div> <div style={{ fontSize: 12, color: '#888' }}>{r.name} · доступно: {r.allowedPages?.join(', ') || '—'} · {r.isAssignable ? 'Исполнитель' : 'Не исполнитель'}</div> </div> </div> {isAdmin && ( <div style={{ display: 'flex', gap: 8 }}> <button onClick={() => openEdit(r)} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-card)', cursor: 'pointer' }}>Изменить</button> <button onClick={() => handleDelete(r.id)} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: '#dc2626', cursor: 'pointer' }}>Удалить</button> </div> )} </div> ))} </div> {showModal && ( <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: isMobile ? 8 : 16 }}> <form onSubmit={handleSubmit} style={{ background: 'var(--bg-card)', borderRadius: 16, padding: isMobile ? 16 : 24, width: '100%', maxWidth: 1080, maxHeight: '90vh', overflow: 'auto' }}> <h3 style={{ margin: '0 0 16px' }}>{editingId ? 'Изменить роль' : 'Новая роль'}</h3> {error && <div style={{ color: '#dc2626', marginBottom: 12, fontSize: 14 }}>{error}</div>} <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}> <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>
  <div>
    <label style={fieldLabelStyle}>Название (системное)</label>
    <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} disabled={!!editingId} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-color)', width: '100%', boxSizing: 'border-box' }} required />
  </div>
  <div>
    <label style={fieldLabelStyle}>Отображаемое имя</label>
    <input value={form.label} onChange={e => setForm({ ...form, label: e.target.value })} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-color)', width: '100%', boxSizing: 'border-box' }} required />
  </div>
  <div>
    <label style={fieldLabelStyle}>Цвет фона</label>
    <input type='color' value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} style={{ width: '100%', height: 40, padding: 2, borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-card)', boxSizing: 'border-box' }} />
  </div>
  <div>
    <label style={fieldLabelStyle}>Цвет текста</label>
    <input type='color' value={form.textColor} onChange={e => setForm({ ...form, textColor: e.target.value })} style={{ width: '100%', height: 40, padding: 2, borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-card)', boxSizing: 'border-box' }} />
  </div>
  <div>
    <label style={fieldLabelStyle}>Порядок</label>
    <input type='number' value={form.sortOrder} onChange={e => setForm({ ...form, sortOrder: Number(e.target.value) })} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-color)', width: '100%', boxSizing: 'border-box' }} />
  </div>
</div>
<div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 12, alignItems: 'start' }}>
<div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}><label style={fieldLabelStyle}>Доступные страницы</label> <div style={{ display: 'flex', flexDirection: 'column', gap: 8, border: '1px solid var(--border-color)', borderRadius: 8, padding: 12 }}> {form.allowedPages.length > 0 && ( <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Выбранные страницы (порядок отображения):</div> )} {form.allowedPages.map((path, idx) => { const page = AVAILABLE_PAGES.find(p => p.path === path) ; if (!page) return null ; return ( <div key={page.path} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}> <input type='checkbox' checked onChange={() => togglePage(page.path)} /> <span style={{ flex: 1 }}>{page.label}</span> <button type='button' onClick={() => movePageUp(page.path)} disabled={idx === 0} style={{ padding: '2px 6px', borderRadius: 4, border: '1px solid var(--border-color)', background: 'transparent', cursor: 'pointer', opacity: idx === 0 ? 0.3 : 1, fontSize: 12 }}>↑</button> <button type='button' onClick={() => movePageDown(page.path)} disabled={idx === form.allowedPages.length - 1} style={{ padding: '2px 6px', borderRadius: 4, border: '1px solid var(--border-color)', background: 'transparent', cursor: 'pointer', opacity: idx === form.allowedPages.length - 1 ? 0.3 : 1, fontSize: 12 }}>↓</button> </div> ) ; })} {AVAILABLE_PAGES.filter(p => !form.allowedPages.includes(p.path) && pageAllowedByTariff(p.path)).length > 0 && ( <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8, marginBottom: 4 }}>Доступные страницы:</div> )} <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', columnGap: 12 }}>{AVAILABLE_PAGES.filter(p => !form.allowedPages.includes(p.path) && pageAllowedByTariff(p.path)).map(page => ( <label key={page.path} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, cursor: 'pointer' }}> <input type='checkbox' checked={false} onChange={() => togglePage(page.path)} /> {page.label} </label> ))}</div> </div></div>
<div style={{ border: '1px solid var(--border-color)', borderRadius: 8, padding: 12 }}>
  <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>Мобильная панель (порядок кнопок)</div>
  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>Так кнопки меню будут расположены на нижней панели в мобильной версии (по бокам от кнопки уведомлений):</div>
  <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-sidebar)', borderRadius: 12, padding: '8px 4px', gap: 4 }}>
    <div style={{ flex: 1, display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end' }}>
      {mobileLeftNav.map(item => (
        <div key={item.path} style={mobileNavBtnStyle}>
          <svg width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'><path d={item.icon} /></svg>
          {item.label}
        </div>
      ))}
      {mobileLeftNav.length === 0 && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>—</div>}
    </div>
    <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#00b300', flexShrink: 0 }} />
    <div style={{ flex: 1, display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end' }}>
      {mobileRightNav.map(item => (
        <div key={item.path} style={mobileNavBtnStyle}>
          <svg width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'><path d={item.icon} /></svg>
          {item.label}
        </div>
      ))}
      <div style={mobileNavBtnStyle}>
        <svg width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'><path d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' /></svg>
        Профиль
      </div>
    </div>
  </div>
  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
    Слева: {mobileLeftNav.map(i => i.label).join(', ') || '—'} · Справа: {mobileRightNav.map(i => i.label).join(', ')}{mobileRightNav.length > 0 ? ', ' : ''}Профиль
  </div>
</div>
<div style={{ border: '1px solid var(--border-color)', borderRadius: 8, padding: 12 }}>
  <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>Права роли</div>
  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>Что пользователи с этой ролью могут видеть и делать в системе.</div>
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', columnGap: 16 }}>
    <PermToggle checked={form.canAccessChat} onChange={e => setForm({ ...form, canAccessChat: e.target.checked })} title='Доступ к общему чату' desc='Просмотр и отправка сообщений в общем чате' />
    {supportAllowed && (<><PermToggle checked={form.canAccessSupportChat} onChange={e => setForm({ ...form, canAccessSupportChat: e.target.checked })} title='Чат тех. поддержки' desc='Страница «Тех. поддержка» и общение с поддержкой' />
    <PermToggle checked={form.canSeeAllSupportTickets} onChange={e => setForm({ ...form, canSeeAllSupportTickets: e.target.checked })} title='Все запросы тех. поддержки' desc='Просмотр и ответы на все обращения' /></>)}
    {catalogAllowed && (<PermToggle checked={form.stockAccess} onChange={e => setForm({ ...form, stockAccess: e.target.checked })} title='Складской учёт' desc='Вкладки «Номенклатура», «Склад», «Цены», «Резервы» в «Каталоге»' />)}
    {projectsAllowed && (<PermToggle checked={form.canAccessProjects} onChange={e => setForm({ ...form, canAccessProjects: e.target.checked })} title='Доступ к проектам' desc='Показ в списке участников проекта' />)}
    <PermToggle checked={form.isSystemHandler} onChange={e => setForm({ ...form, isSystemHandler: e.target.checked })} title='Системный обработчик' desc='Не учитывается в виджете push-уведомлений Директора' />
    <PermToggle checked={form.canCreateNews} onChange={e => setForm({ ...form, canCreateNews: e.target.checked })} title='Создание новостей' />
    <PermToggle checked={form.canEditNews} onChange={e => setForm({ ...form, canEditNews: e.target.checked })} title='Редактирование новостей' />
    {tasksAllowed && (<PermToggle checked={form.canHandleSpam ?? false} onChange={e => setForm({ ...form, canHandleSpam: e.target.checked })} title='Обработка СПАМА' desc='Кнопка «череп» на задачах из писем' />)}
  </div>
</div>
<div style={{ border: '1px solid var(--border-color)', borderRadius: 8, padding: 12 }}>
  <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>Управление задачами</div>
  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>Настройки работы с задачами для пользователей с этой ролью.</div>
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', columnGap: 16 }}>
    {tasksAllowed && (<PermToggle checked={form.isAssignable} onChange={e => setForm({ ...form, isAssignable: e.target.checked })} title='Использовать как исполнитель' desc='Пользователи с этой ролью могут быть назначены на задачи' />)}
    {(currentUser as any)?.crmAccounting !== false && (<PermToggle checked={form.showFinancesTab} onChange={e => setForm({ ...form, showFinancesTab: e.target.checked })} title='Вкладка «Финансы» в задачах' desc='Пользователи с этой ролью видят финансы задач' />)}
    <PermToggle checked={form.showCalendarMetric} onChange={e => setForm({ ...form, showCalendarMetric: e.target.checked })} title='Метрика календаря' desc='Календарь на главной странице (дашборде)' />
    {tasksAllowed && (<PermToggle checked={form.canChangeTaskStatus} onChange={e => setForm({ ...form, canChangeTaskStatus: e.target.checked })} title='Смена статуса у задач' desc='Пользователи с этой ролью могут менять статус задач' />)}
  </div>
</div>
<div style={{ border: '1px solid var(--border-color)', borderRadius: 8, padding: 12 }}>
  <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>Доступы (вкладка у контактов и организаций)</div>
  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>Логины, пароли и ссылки к видеорегистраторам, облакам, серверам, роутерам и т.п.</div>
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', columnGap: 16 }}>
    <PermToggle checked={form.canReadContactAccesses ?? true} onChange={e => setForm({ ...form, canReadContactAccesses: e.target.checked })} title='Чтение' desc='Просмотр списка доступов во вкладке' />
    <PermToggle checked={form.canEditContactAccesses ?? false} disabled={!form.canReadContactAccesses} onChange={e => setForm({ ...form, canEditContactAccesses: e.target.checked })} title='Редактирование' desc='Добавление и изменение доступов' />
    <PermToggle checked={form.canDeleteContactAccesses ?? false} disabled={!form.canReadContactAccesses} onChange={e => setForm({ ...form, canDeleteContactAccesses: e.target.checked })} title='Удаление' desc='Удаление доступов' />
  </div>
</div>
            {form.canChangeTaskStatus && tasksAllowed && (
              <div style={{ border: '1px solid var(--border-color)', borderRadius: 8, padding: 12 }}>
                <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>Доступные статусы задач</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>Отметьте статусы, которые роль может назначать задаче. Ничего не выбрано — доступны все статусы.</div>
                {taskStatuses.map((s) => (
                  <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, cursor: 'pointer', padding: '4px 0' }}>
                    <input
                      type='checkbox'
                      checked={form.allowedTaskStatuses.includes(s.name)}
                      onChange={() => toggleTaskStatus(s.name)}
                    />
                    <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 6, background: s.color, color: s.textColor, fontSize: 12 }}>{s.label}</span>
                  </label>
                ))}
                {taskStatuses.length === 0 && (
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Статусы задач не найдены — проверьте настройки статусов</div>
                )}
              </div>
            )}
            <div style={{ border: '1px solid var(--border-color)', borderRadius: 8, padding: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 8 }}>Уведомления о новых событиях</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', columnGap: 16 }}>{[
                ...((tasksAllowed ? [{ key: 'notifyOnNewTask', label: 'Новые задачи' }] : []) as any),
                ...((dealsAllowed ? [{ key: 'notifyOnNewDeal', label: 'Новые сделки' }] : []) as any),
                ...(((currentUser as any)?.crmCalls !== false ? [{ key: 'notifyOnNewCall', label: 'Новые звонки' }] : []) as any),
                { key: 'notifyOnNewComment', label: 'Новые комментарии' },
                { key: 'notifyOnNewChat', label: 'Новые сообщения в чате' },
                
                { key: 'notifyOnNewNews', label: 'Новости' },
              ].map((item) => (
                <label key={item.key} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, cursor: 'pointer', padding: '4px 0' }}>
                  <input
                    type='checkbox'
                    checked={(form as any)[item.key]}
                    onChange={(e) => setForm({ ...form, [item.key]: e.target.checked })}
                  />
                  {item.label}
                </label>
              ))}</div>
            </div>
            </div>
            </div> <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}> <button type='button' onClick={() => setShowModal(false)} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-card)', cursor: 'pointer' }}>Отмена</button> <button type='submit' style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#1a1a1a', color: '#fff', cursor: 'pointer' }}>Сохранить</button> </div> </form> </div> )} </div> ) ; }