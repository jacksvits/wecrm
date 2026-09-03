import { Routes, Route, Navigate, useLocation } from 'react-router-dom' ; import { useEffect } from 'react' ; import { useAuth } from './hooks/useAuth' ; import { api } from './api/client' ; import { Login } from './components/Login' ; import { Layout } from './components/Layout' ; import { Dashboard } from './components/Dashboard' ; import { TaskList } from './components/TaskList' ; import { DealBoard } from './components/DealBoard' ; import { ContactList } from './components/ContactList' ; import { ContactDetail } from './components/ContactDetail' ; import { ProjectList } from './components/ProjectList' ; import { Profile } from './components/Profile' ; import { UserList } from './components/UserList' ; import { Settings } from './components/Settings' ; import { TaskDetail } from './components/TaskDetail' ; function RequireRole({ children, path }: { children: React.ReactNode ; path: string }) { const { user } = useAuth() ; const isAdmin = user?.role === 'admin' ; const allowedPages = (user as any)?.allowedPages || [] ; if (isAdmin) return <>{children}</> ; if (path !== '/' && !allowedPages.includes(path)) { return <Navigate to='/' replace /> ; } return <>{children}</> ; } function RequireAdmin({ children }: { children: React.ReactNode }) { const { user } = useAuth() ; if (user?.role !== 'admin') { return <Navigate to='/' replace /> ; } return <>{children}</> ; } import { Director } from './components/Director' ; import { NewsList } from './components/NewsList' ; import { NewsDetail } from './components/NewsDetail' ; import { NewsEditor } from './components/NewsEditor' ; function App() { const { user, loading } = useAuth() ; const location = useLocation() ;

  // Global heartbeat: mark user as online on every navigation and every 30s
  useEffect(() => {
    if (!user) return;
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

  if (loading) { return ( <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}> <div>Загрузка...</div> </div> ) ; } if (!user) { return <Login /> ; } return ( <Layout> <Routes> <Route path='/' element={<Dashboard />} /> <Route path='/tasks' element={<RequireRole path='/tasks'><TaskList /></RequireRole>} /> <Route path='/tasks/:id' element={<RequireRole path='/tasks'><TaskDetail /></RequireRole>} /> <Route path='/deals' element={<RequireRole path='/deals'><DealBoard /></RequireRole>} /> <Route path='/contacts' element={<RequireRole path='/contacts'><ContactList /></RequireRole>} /> <Route path='/contacts/:id' element={<RequireRole path='/contacts'><ContactDetail /></RequireRole>} /> <Route path='/projects' element={<RequireRole path='/projects'><ProjectList /></RequireRole>} /> <Route path='/users' element={<RequireRole path='/users'><UserList /></RequireRole>} /> <Route path='/director' element={<RequireAdmin><Director /></RequireAdmin>} /> <Route path='/news' element={<RequireRole path='/news'><NewsList /></RequireRole>} /> <Route path='/news/new' element={<RequireRole path='/news'><NewsEditor /></RequireRole>} /> <Route path='/news/:id' element={<RequireRole path='/news'><NewsDetail /></RequireRole>} /> <Route path='/news/:id/edit' element={<RequireRole path='/news'><NewsEditor /></RequireRole>} /> <Route path='/settings' element={<RequireAdmin><Settings /></RequireAdmin>} /> <Route path='/profile' element={<Profile />} /> <Route path='*' element={<Navigate to='/' />} /> </Routes> </Layout> ) ; } export default App ;