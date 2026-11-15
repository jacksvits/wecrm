import { Routes, Route, Navigate, useLocation } from 'react-router-dom' ; import { lazy, Suspense, useEffect, useState } from 'react' ; import { useAuth } from './hooks/useAuth' ; import { api } from './api/client' ; import { InstallAppBanner } from './components/InstallAppBanner' ; import { Login } from './components/Login' ; import { Layout } from './components/Layout' ; import { Dashboard } from './components/Dashboard' ; import { TaskList } from './components/TaskList' ;            import { LegalDocumentPage } from './components/LegalDocumentPage' ;   

         // Тяжёлые страницы грузятся лениво: первый экран не тянет весь бандл
const MailClient = lazy(() => import('./components/MailClient').then(m => ({ default: m.MailClient }))) ;
const SchedulePage = lazy(() => import('./components/SchedulePage').then(m => ({ default: m.SchedulePage }))) ;
const DealBoard = lazy(() => import('./components/DealBoard').then(m => ({ default: m.DealBoard }))) ;
const Products = lazy(() => import('./components/Products').then(m => ({ default: m.Products }))) ;
const ContactList = lazy(() => import('./components/ContactList').then(m => ({ default: m.ContactList }))) ;
const ContactDetail = lazy(() => import('./components/ContactDetail').then(m => ({ default: m.ContactDetail }))) ;
const ProjectList = lazy(() => import('./components/ProjectList').then(m => ({ default: m.ProjectList }))) ;
const UserList = lazy(() => import('./components/UserList').then(m => ({ default: m.UserList }))) ;
const Director = lazy(() => import('./components/Director').then(m => ({ default: m.Director }))) ;
const TenantsAdmin = lazy(() => import('./components/TenantsAdmin').then(m => ({ default: m.TenantsAdmin }))) ;
const TenantTicketsAdmin = lazy(() => import('./components/TenantTicketsAdmin').then(m => ({ default: m.TenantTicketsAdmin }))) ;
const TenantSupport = lazy(() => import('./components/TenantSupport').then(m => ({ default: m.TenantSupport }))) ;
const NewsList = lazy(() => import('./components/NewsList').then(m => ({ default: m.NewsList }))) ;
const NewsDetail = lazy(() => import('./components/NewsDetail').then(m => ({ default: m.NewsDetail }))) ;
const NewsEditor = lazy(() => import('./components/NewsEditor').then(m => ({ default: m.NewsEditor }))) ;
const Logistics = lazy(() => import('./components/Logistics').then(m => ({ default: m.Logistics }))) ;
const Notes = lazy(() => import('./components/Notes').then(m => ({ default: m.Notes }))) ;
const NoteEditor = lazy(() => import('./components/NoteEditor').then(m => ({ default: m.NoteEditor }))) ;
const Reminders = lazy(() => import('./components/Reminders').then(m => ({ default: m.Reminders }))) ;
const ReminderEditor = lazy(() => import('./components/ReminderEditor').then(m => ({ default: m.ReminderEditor }))) ;
const Files = lazy(() => import('./components/Files').then(m => ({ default: m.Files }))) ;
const Browser = lazy(() => import('./components/Browser').then(m => ({ default: m.Browser }))) ;
const VideoRecorder = lazy(() => import('./components/VideoRecorder').then(m => ({ default: m.VideoRecorder }))) ;
const Settings = lazy(() => import('./components/Settings').then(m => ({ default: m.Settings }))) ;
const HelpCenter = lazy(() => import('./components/HelpCenter').then(m => ({ default: m.HelpCenter }))) ;
const HelpArticle = lazy(() => import('./components/HelpArticle').then(m => ({ default: m.HelpArticle }))) ;
const HelpEditor = lazy(() => import('./components/HelpEditor').then(m => ({ default: m.HelpEditor }))) ;
const Profile = lazy(() => import('./components/Profile').then(m => ({ default: m.Profile }))) ;
const MySubscriptions = lazy(() => import('./components/MySubscriptions').then(m => ({ default: m.MySubscriptions }))) ;
const OrgLogin = lazy(() => import('./components/OrgLogin').then(m => ({ default: m.OrgLogin }))) ;
const TaskDetail = lazy(() => import('./components/TaskDetail').then(m => ({ default: m.TaskDetail }))) ;
const Register = lazy(() => import('./components/Register').then(m => ({ default: m.Register }))) ;
const Presentation = lazy(() => import('./components/Presentation').then(m => ({ default: m.Presentation }))) ;
const SharedFavorites = lazy(() => import('./components/SharedFavorites').then(m => ({ default: m.SharedFavorites }))) ;
const PublicNewsPage = lazy(() => import('./components/PublicNewsPage').then(m => ({ default: m.PublicNewsPage }))) ;
const PublicNewsDetail = lazy(() => import('./components/PublicNewsPage').then(m => ({ default: m.PublicNewsDetail }))) ;
const TenantPublicNews = lazy(() => import('./components/TenantPublicNews').then(m => ({ default: m.TenantPublicNews }))) ;
const TenantPublicNewsDetail = lazy(() => import('./components/TenantPublicNews').then(m => ({ default: m.TenantPublicNewsDetail }))) ;
const CameraPipOverlay = lazy(() => import('./components/CameraPipOverlay').then(m => ({ default: m.CameraPipOverlay }))) ;
const PublicVitrine = lazy(() => import('./components/PublicVitrine')) ;
const PublicFiles = lazy(() => import('./components/PublicFiles')) ;
const SharedFilePage = lazy(() => import('./components/SharedFilePage')) ;
function RequireRole({ children, path }: { children: React.ReactNode ; path: string }) { const { user } = useAuth() ; const isAdmin = user?.role === 'admin' ; const allowedPages = (user as any)?.allowedPages || [] ; if (isAdmin) return <>{children}</> ; if (path !== '/' && !allowedPages.includes(path)) { const supportByFlag = path === '/support' && ((user as any)?.canAccessSupportChat === true || allowedPages.includes('/support')) ; const tasksByContactLink = path === '/tasks' && !!(user as any)?.linkedContact ; if (!supportByFlag && !tasksByContactLink) { return <Navigate to='/' replace /> ; } } return <>{children}</> ; } function RequireAdmin({ children }: { children: React.ReactNode }) { const { user } = useAuth() ; if (user?.role !== 'admin') { return <Navigate to='/' replace /> ; } return <>{children}</> ; }          import { Chat } from './components/Chat' ; import { SupportChat } from './components/SupportChat' ; 
import { CallProvider, useCall } from './context/CallContext' ;
import { CallWindow } from './components/CallWindow' ;
import { WebPhoneWidget } from './components/WebPhoneWidget' ;
import { FloatingGlobalChat } from './components/FloatingGlobalChat' ;





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
  if (['welans.org', 'www.welans.org'].includes(window.location.hostname) && location.pathname === '/') { return ( <Suspense fallback={null}><InstallAppBanner /><OrgLogin /></Suspense> ) ; }
  if (location.pathname === '/org-login') { return ( <Suspense fallback={null}><InstallAppBanner /><OrgLogin /></Suspense> ) ; } if (location.pathname === '/register') { return ( <Suspense fallback={null}><InstallAppBanner /><Register /></Suspense> ) ; } if (location.pathname === '/presentation') { return ( <Suspense fallback={null}><InstallAppBanner /><Presentation /></Suspense> ) ; } if (location.pathname === '/shop') { return ( <Suspense fallback={null}><PublicVitrine /></Suspense> ) ; } if (location.pathname === '/vitrine') { return <Navigate to='/shop' replace /> ; } // welans.click: публичная страница «Файлы» без входа (обработка ниже по FILES_HOSTS)
  // Перенесённые новости WordPress открываются без входа по прежнему адресу /<slug>/.
  // welans.click: публичная страница «Файлы» без входа и гостевой сессии (как /shop на welans.ru)
  if (FILES_HOSTS.includes(window.location.hostname)) {
    // Публичная ссылка «Поделиться» на файл/папку: welans.click/s/<token>
    if (location.pathname.startsWith('/s/')) {
      const shareToken = location.pathname.slice(3).split('/')[0] ;
      if (shareToken) { return ( <Suspense fallback={null}><SharedFilePage token={shareToken} /></Suspense> ) ; }
    }
    if (location.pathname !== '/shop' && location.pathname !== '/vitrine') { return ( <Suspense fallback={null}><PublicFiles /></Suspense> ) ; }
  }
  // Публичные новости на welans.ru: лента /news, детальная /news/:id и старые ссылки /<slug>/
  if (WELANS_RU_HOSTS.includes(window.location.hostname)) {
    if (/^\/news\/?$/.test(location.pathname)) {
      return <Suspense fallback={null}><PublicNewsPage consent={!user} /></Suspense> ;
    }
    const newsIdMatch = location.pathname.match(/^\/news\/(?!public(?:\/|$))([^/]+)$/);
    if (newsIdMatch) {
      return <Suspense fallback={null}><PublicNewsDetail id={newsIdMatch[1]} consent={!user} /></Suspense> ;
    }
    if (/^\/[^/]+\/?$/.test(location.pathname)) {
      return <PublicNewsDetail slug={location.pathname.split('/')[1]} consent={!user} /> ;
    }
  }
  // Публичные новости тенанта: гость на тенантском домене видит опубликованные новости организации.
  // Авторизованные сотрудники по этому пути попадают во внутренний NewsList ниже.
  const isTenantHost = !WELANS_RU_HOSTS.includes(window.location.hostname) && !FILES_HOSTS.includes(window.location.hostname) && !['welans.cc', 'www.welans.cc', 'welans.org', 'www.welans.org'].includes(window.location.hostname);
  if (isTenantHost && !user) {
    if (location.pathname === '/news' || location.pathname === '/news/') return <Suspense fallback={null}><TenantPublicNews /></Suspense> ;
    const newsMatch = location.pathname.match(/^\/news\/([^/]+)\/?$/);
    if (newsMatch) return <Suspense fallback={null}><TenantPublicNewsDetail idOrSlug={decodeURIComponent(newsMatch[1])} /></Suspense> ;
    // Карточки новостей ведут на корневой /<slug> — открываем опубликованную новость и по нему
    const rootSlug = location.pathname.match(/^\/([a-z0-9][a-z0-9-]{1,200})\/?$/);
    if (rootSlug && !['offer', 'privacy', 'cookies', 'org-login', 'register', 'presentation', 'shop', 'vitrine', 'news', 'files'].includes(rootSlug[1])) {
      return <Suspense fallback={null}><TenantPublicNewsDetail idOrSlug={rootSlug[1]} /></Suspense> ;
    }
  }

  if (!user) { return ( <><InstallAppBanner /><Login /></> ) ; } return ( <CallProvider><CallOverlay /><Layout> <InstallAppBanner /> <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>Загрузка...</div>}><Routes> <Route path='/' element={<Dashboard />} /> <Route path='/tasks' element={<RequireRole path='/tasks'><TaskList /></RequireRole>} /> <Route path='/tasks/:id' element={<RequireRole path='/tasks'><TaskDetail /></RequireRole>} /> <Route path='/mail' element={<RequireRole path='/mail'><MailClient /></RequireRole>} /> <Route path='/schedule' element={<RequireRole path='/schedule'><SchedulePage /></RequireRole>} /> <Route path='/deals' element={<RequireRole path='/deals'><DealBoard /></RequireRole>} /> <Route path='/products' element={<RequireRole path='/products'><Products /></RequireRole>} />
<Route path='/favorites/share/:token' element={<SharedFavorites />} /> <Route path='/promo-blocks' element={<Navigate to='/settings' replace />} /> <Route path='/contacts' element={<RequireRole path='/contacts'><ContactList /></RequireRole>} /> <Route path='/contacts/:id' element={<RequireRole path='/contacts'><ContactDetail /></RequireRole>} /> <Route path='/projects' element={<RequireRole path='/projects'><ProjectList /></RequireRole>} /> <Route path='/users' element={<RequireRole path='/users'><UserList /></RequireRole>} /> <Route path='/director' element={<RequireAdmin><Director /></RequireAdmin>} /> <Route path='/platform' element={<RequireAdmin><TenantsAdmin /></RequireAdmin>} /> <Route path='/platform/tickets' element={<RequireAdmin><TenantTicketsAdmin /></RequireAdmin>} /> <Route path='/platform-support' element={<TenantSupport />} /> <Route path='/news' element={<RequireRole path='/news'><NewsList /></RequireRole>} /> <Route path='/news/new' element={<RequireRole path='/news'><NewsEditor /></RequireRole>} /> <Route path='/news/:id' element={<RequireRole path='/news'><NewsDetail /></RequireRole>} /> <Route path='/news/:id/edit' element={<RequireRole path='/news'><NewsEditor /></RequireRole>} /><Route path='/logistics' element={<RequireRole path='/logistics'><Logistics /></RequireRole>} /><Route path='/notes' element={<RequireRole path='/notes'><Notes /></RequireRole>} /><Route path='/notes/new' element={<RequireRole path='/notes'><NoteEditor /></RequireRole>} /><Route path='/notes/:id' element={<RequireRole path='/notes'><NoteEditor /></RequireRole>} /><Route path='/notes/:id/edit' element={<RequireRole path='/notes'><NoteEditor /></RequireRole>} /><Route path='/reminders' element={<RequireRole path='/reminders'><Reminders /></RequireRole>} /><Route path='/reminders/new' element={<RequireRole path='/reminders'><ReminderEditor /></RequireRole>} /><Route path='/reminders/:id/edit' element={<RequireRole path='/reminders'><ReminderEditor /></RequireRole>} /><Route path='/files' element={<RequireRole path='/files'><Files /></RequireRole>} /><Route path='/chat' element={<RequireRole path='/chat'><Chat /></RequireRole>} /> <Route path='/support' element={<RequireRole path='/support'><SupportChat /></RequireRole>} /> <Route path='/browser' element={<RequireRole path='/browser'><Browser /></RequireRole>} /> <Route path='/calls' element={<Navigate to='/settings' replace />} />
              <Route path='/video-recorder' element={<RequireAdmin><VideoRecorder /></RequireAdmin>} /> <Route path='/hikvision-cameras' element={<Navigate to='/video-recorder?tab=hik' replace />} /> <Route path='/tapo-cameras' element={<Navigate to='/video-recorder?tab=tapo' replace />} /> <Route path='/settings' element={<RequireAdmin><Settings /></RequireAdmin>} /> <Route path='/help' element={<HelpCenter />} /> <Route path='/help/new' element={<HelpEditor />} /> <Route path='/help/:slug/edit' element={<HelpEditor />} /> <Route path='/help/:slug' element={<HelpArticle />} /> <Route path='/profile' element={<Profile />} /> <Route path='/subscriptions' element={<MySubscriptions />} /> <Route path='*' element={<Navigate to='/' />} /> </Routes></Suspense> </Layout><FloatingGlobalChat /><CameraPipOverlay /></CallProvider> ) ; } export default App ;