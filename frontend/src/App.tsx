import { Routes, Route, Navigate, useLocation } from 'react-router-dom' ; import { useEffect, useState } from 'react' ; import { useAuth } from './hooks/useAuth' ; import { api } from './api/client' ; import { InstallAppBanner } from './components/InstallAppBanner' ; import { Login } from './components/Login' ; import { Layout } from './components/Layout' ; import { Dashboard } from './components/Dashboard' ; import { TaskList } from './components/TaskList' ; import { SchedulePage } from './components/SchedulePage' ; import { DealBoard } from './components/DealBoard' ; import { ContactList } from './components/ContactList' ; import { ContactDetail } from './components/ContactDetail' ; import { ProjectList } from './components/ProjectList' ; import { Profile } from './components/Profile' ; import { MySubscriptions } from './components/MySubscriptions' ; import { UserList } from './components/UserList' ; import { Settings } from './components/Settings' ; import { TaskDetail } from './components/TaskDetail' ; import { MailClient } from './components/MailClient' ; import { LegalDocumentPage } from './components/LegalDocumentPage' ; import { Register } from './components/Register' ; import { Presentation } from './components/Presentation' ; import PublicVitrine from './components/PublicVitrine' ;
import PublicFiles from './components/PublicFiles' ; import { Logistics } from './components/Logistics' ; import { HelpCenter } from './components/HelpCenter' ; import { HelpArticle } from './components/HelpArticle' ; import { HelpEditor } from './components/HelpEditor' ; import { OrgLogin } from './components/OrgLogin' ; import { TenantsAdmin } from './components/TenantsAdmin' ; import { TenantSupport } from './components/TenantSupport' ; import { TenantTicketsAdmin } from './components/TenantTicketsAdmin' ; function RequireRole({ children, path }: { children: React.ReactNode ; path: string }) { const { user } = useAuth() ; const isAdmin = user?.role === 'admin' ; const allowedPages = (user as any)?.allowedPages || [] ; if (isAdmin) return <>{children}</> ; if (path !== '/' && !allowedPages.includes(path)) { const supportByFlag = path === '/support' && ((user as any)?.canAccessSupportChat === true || allowedPages.includes('/support')) ; if (!supportByFlag) { return <Navigate to='/' replace /> ; } } return <>{children}</> ; } function RequireAdmin({ children }: { children: React.ReactNode }) { const { user } = useAuth() ; if (user?.role !== 'admin') { return <Navigate to='/' replace /> ; } return <>{children}</> ; } import { Director } from './components/Director' ; import { NewsList } from './components/NewsList' ; import { NewsDetail } from './components/NewsDetail' ; import { NewsEditor } from './components/NewsEditor' ; import { Notes } from './components/Notes' ; import { NoteEditor } from './components/NoteEditor' ; import { Reminders } from './components/Reminders' ; import { ReminderEditor } from './components/ReminderEditor' ; import { Files } from './components/Files' ; import { Products } from './components/Products'
import { SharedFavorites } from './components/SharedFavorites'
import { Chat } from './components/Chat' ; import { SupportChat } from './components/SupportChat' ; import { Browser } from './components/Browser' ;
import { CallProvider, useCall } from './context/CallContext' ;
import { CallWindow } from './components/CallWindow' ;
import { WebPhoneWidget } from './components/WebPhoneWidget' ;
import { FloatingGlobalChat } from './components/FloatingGlobalChat' ;
import { CameraPipOverlay } from './components/CameraPipOverlay' ;
import { VideoRecorder } from './components/VideoRecorder' ;
import { PublicNewsPage, PublicNewsDetail } from './components/PublicNewsPage' ;

function CallOverlay() {
  const { info } = useCall() ;
  return (<>
    {info && <div style={{ position: 'fixed', top: 'calc(16px + env(safe-area-inset-top, 0px))', left: '50%', transform: 'translateX(-50%)', zIndex: 2000, background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow)', borderRadius: 12, padding: '10px 18px', fontSize: 14 }}>{info}</div>}
    <CallWindow />
    <WebPhoneWidget />
  </>) ;
}
import { initSoundUnlock } from './lib/sound' ;
// welans.click — публичная страница «Файлы»: автоматический гостевой вход
// (тот же механизм, что у кнопки «Войти как гость»), затем отдельная публичная страница PublicFiles
const FILES_HOSTS = ['welans.click', 'www.welans.click'];
const WELANS_RU_HOSTS = ['welans.ru', 'www.welans.ru'];
function AutoGuestLogin() {
  const { guestLogin } = useAuth() ;
  const [failed, setFailed] = useState(false) ;
  useEffect(() => {
    let cancelled = false ;
    guestLogin().catch(() => { if (!cancelled) setFailed(true) ; }) ;
    return () => { cancelled = true ; } ;
  }, [guestLogin]) ;
  if (failed) return <Login /> ;
  return (<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}><div>Загрузка...</div></div>) ;
}
function App() { const { user, loading } = useAuth() ; const location = useLocation() ;
  // Разблокировка звуковых уведомлений первым жестом пользователя (autoplay policy)
  useEffect(() => { initSoundUnlock() ; }, []) ;

  // Global heartbeat: mark user as online on every navigation and every 30s
  useEffect(() => {
    if (!user) return;
    // Призрачная сессия «Сменить тенант»: heartbeats не отправляем вовсе
    // (сервер их тоже игнорирует) — админ организации не светится «онлайн»
    if (localStorage.getItem('platformTenantSwitch')) return;
    // Send heartbeat immediately on mount and route change
    api.users.heartbeat().catch(() => {});
    // Send heartbeat every 30 seconds while user is active
    const interval = setInterval(() => {
      api.users.heartbeat().catch(() => {});
    }, 30000);
    // Send heartbeat on user activity (clicks, keypresses) — debounced
    let activityTimeout: ReturnType<typeof setTimeout>;
    const handleActivity = () => {
      clearTimeout(activityTimeout);
      activityTimeout = setTimeout(() => {
        api.users.heartbeat().catch(() => {});
      }, 5000);
    };
    window.addEventListener('click', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('scroll', handleActivity);
    return () => {
      clearInterval(interval);
      clearTimeout(activityTimeout);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('scroll', handleActivity);
    };
  }, [user, location.pathname]);

  if (loading) { return ( <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}> <div>Загрузка...</div> </div> ) ; } const legalSlug = location.pathname === '/offer' ? 'offer' : location.pathname === '/privacy' ? 'privacy' : location.pathname === '/cookies' ? 'cookies' : null; if (legalSlug) { return ( <><InstallAppBanner /><LegalDocumentPage slug={legalSlug} /></> ) ; } // welans.org: корень домена — страница входа организации (как /org-login), адрес не меняется
  if (['welans.org', 'www.welans.org'].includes(window.location.hostname) && location.pathname === '/') { return ( <><InstallAppBanner /><OrgLogin /></> ) ; }
  if (location.pathname === '/org-login') { return ( <><InstallAppBanner /><OrgLogin /></> ) ; } if (location.pathname === '/register') { return ( <><InstallAppBanner /><Register /></> ) ; } if (location.pathname === '/presentation') { return ( <><InstallAppBanner /><Presentation /></> ) ; } if (location.pathname === '/shop') { return ( <PublicVitrine /> ) ; } if (location.pathname === '/vitrine') { return <Navigate to='/shop' replace /> ; } // welans.click: без сессии — авто-вход гостем; с сессией корень домена — сразу «Файлы»
  // Перенесённые новости WordPress открываются без входа по прежнему адресу /<slug>/.
  if (FILES_HOSTS.includes(window.location.hostname)) {
    if (!user) { return ( <><InstallAppBanner /><AutoGuestLogin /></> ) ; }
    // Публичная страница «Файлы» — отдельный вид без Layout/сайдбара (по макету),
    // по любому пути на welans.click, кроме витрины /shop
    if (location.pathname !== '/shop' && location.pathname !== '/vitrine') { return ( <PublicFiles /> ) ; }
  }
  // Публичные новости на welans.ru: лента /news, детальная /news/:id и старые ссылки /<slug>/
  if (WELANS_RU_HOSTS.includes(window.location.hostname)) {
    if (/^\/news\/?$/.test(location.pathname)) {
      return <PublicNewsPage /> ;
    }
    const newsIdMatch = location.pathname.match(/^\/news\/(?!public(?:\/|$))([^/]+)$/);
    if (newsIdMatch) {
      return <PublicNewsDetail id={newsIdMatch[1]} /> ;
    }
    if (/^\/[^/]+\/?$/.test(location.pathname)) {
      return <PublicNewsDetail slug={location.pathname.split('/')[1]} /> ;
    }
  }
  if (!user) { return ( <><InstallAppBanner /><Login /></> ) ; } return ( <CallProvider><CallOverlay /><Layout> <InstallAppBanner /> <Routes> <Route path='/' element={<Dashboard />} /> <Route path='/tasks' element={<RequireRole path='/tasks'><TaskList /></RequireRole>} /> <Route path='/tasks/:id' element={<RequireRole path='/tasks'><TaskDetail /></RequireRole>} /> <Route path='/mail' element={<RequireRole path='/mail'><MailClient /></RequireRole>} /> <Route path='/schedule' element={<RequireRole path='/schedule'><SchedulePage /></RequireRole>} /> <Route path='/deals' element={<RequireRole path='/deals'><DealBoard /></RequireRole>} /> <Route path='/products' element={<RequireRole path='/products'><Products /></RequireRole>} />
<Route path='/favorites/share/:token' element={<SharedFavorites />} /> <Route path='/promo-blocks' element={<Navigate to='/settings' replace />} /> <Route path='/contacts' element={<RequireRole path='/contacts'><ContactList /></RequireRole>} /> <Route path='/contacts/:id' element={<RequireRole path='/contacts'><ContactDetail /></RequireRole>} /> <Route path='/projects' element={<RequireRole path='/projects'><ProjectList /></RequireRole>} /> <Route path='/users' element={<RequireRole path='/users'><UserList /></RequireRole>} /> <Route path='/director' element={<RequireAdmin><Director /></RequireAdmin>} /> <Route path='/platform' element={<RequireAdmin><TenantsAdmin /></RequireAdmin>} /> <Route path='/platform/tickets' element={<RequireAdmin><TenantTicketsAdmin /></RequireAdmin>} /> <Route path='/platform-support' element={<TenantSupport />} /> <Route path='/news' element={<RequireRole path='/news'><NewsList /></RequireRole>} /> <Route path='/news/new' element={<RequireRole path='/news'><NewsEditor /></RequireRole>} /> <Route path='/news/:id' element={<RequireRole path='/news'><NewsDetail /></RequireRole>} /> <Route path='/news/:id/edit' element={<RequireRole path='/news'><NewsEditor /></RequireRole>} /><Route path='/logistics' element={<RequireRole path='/logistics'><Logistics /></RequireRole>} /><Route path='/notes' element={<RequireRole path='/notes'><Notes /></RequireRole>} /><Route path='/notes/new' element={<RequireRole path='/notes'><NoteEditor /></RequireRole>} /><Route path='/notes/:id' element={<RequireRole path='/notes'><NoteEditor /></RequireRole>} /><Route path='/notes/:id/edit' element={<RequireRole path='/notes'><NoteEditor /></RequireRole>} /><Route path='/reminders' element={<RequireRole path='/reminders'><Reminders /></RequireRole>} /><Route path='/reminders/new' element={<RequireRole path='/reminders'><ReminderEditor /></RequireRole>} /><Route path='/reminders/:id/edit' element={<RequireRole path='/reminders'><ReminderEditor /></RequireRole>} /><Route path='/files' element={<RequireRole path='/files'><Files /></RequireRole>} /><Route path='/chat' element={<RequireRole path='/chat'><Chat /></RequireRole>} /> <Route path='/support' element={<RequireRole path='/support'><SupportChat /></RequireRole>} /> <Route path='/browser' element={<RequireRole path='/browser'><Browser /></RequireRole>} /> <Route path='/calls' element={<Navigate to='/settings' replace />} />
              <Route path='/video-recorder' element={<RequireAdmin><VideoRecorder /></RequireAdmin>} /> <Route path='/hikvision-cameras' element={<Navigate to='/video-recorder?tab=hik' replace />} /> <Route path='/tapo-cameras' element={<Navigate to='/video-recorder?tab=tapo' replace />} /> <Route path='/settings' element={<RequireAdmin><Settings /></RequireAdmin>} /> <Route path='/help' element={<HelpCenter />} /> <Route path='/help/new' element={<HelpEditor />} /> <Route path='/help/:slug/edit' element={<HelpEditor />} /> <Route path='/help/:slug' element={<HelpArticle />} /> <Route path='/profile' element={<Profile />} /> <Route path='/subscriptions' element={<MySubscriptions />} /> <Route path='*' element={<Navigate to='/' />} /> </Routes> </Layout><FloatingGlobalChat /><CameraPipOverlay /></CallProvider> ) ; } export default App ;