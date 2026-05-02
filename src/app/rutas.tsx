import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { User } from 'firebase/auth';
import { useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import Home          from '../pages/Home';
import Jobs          from '../pages/Jobs';
import Companies     from '../pages/Companies';
import CVBuilder     from '../pages/CVBuilder';
import Feed          from '../pages/Feed';
import Reels         from '../pages/Reels';
import Login         from '../pages/Login';
import Profile       from '../pages/Profile';
import UserProfile   from '../pages/UserProfile';
import SearchUsers   from '../pages/SearchUsers';
import MapPage       from '../pages/MapPage';
import Privacidad    from '../pages/Privacidad';
import Notifications from '../pages/Notifications';
import Messages      from '../pages/Messages';
import Chat          from '../pages/Chat';

interface AppRoutesProps      { user: User | null; loading: boolean; }
interface ProtectedRouteProps { user: User | null; loading: boolean; children: React.ReactElement; }

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-[--sc-500] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-[--sc-600] font-bold text-lg tracking-tighter">AG EMPLEO</p>
      </div>
    </div>
  );
}

function ProtectedRoute({ user, loading, children }: ProtectedRouteProps) {
  if (loading) return <LoadingScreen />;
  return user ? children : <Navigate to="/login" replace />;
}

const RUTAS_SOCIAL = ['/social', '/reels', '/search'];

function SyncMode() {
  const location = useLocation();
  const { isSocialMode, toggleMode } = useTheme();

  useEffect(() => {
    const enSocial = RUTAS_SOCIAL.some((r) => location.pathname.startsWith(r));
    if (enSocial && !isSocialMode) toggleMode();
    if (!enSocial && isSocialMode) toggleMode();
  }, [location.pathname]);

  return null;
}

export default function AppRoutes({ user, loading }: AppRoutesProps) {
  const PR = (el: React.ReactElement) => (
    <ProtectedRoute user={user} loading={loading}>{el}</ProtectedRoute>
  );

  return (
    <BrowserRouter>
      <SyncMode />
      <Routes>
        <Route path="/login" element={loading ? <LoadingScreen /> : !user ? <Login /> : <Navigate to="/" replace />} />

        <Route path="/"               element={PR(<Home />)}          />
        <Route path="/jobs"           element={PR(<Jobs />)}          />
        <Route path="/companies"      element={PR(<Companies />)}     />
        <Route path="/cv"             element={PR(<CVBuilder />)}     />
        <Route path="/mapa"           element={PR(<MapPage />)}       />
        <Route path="/social"         element={PR(<Feed />)}          />
        <Route path="/reels"          element={PR(<Reels />)}         />
        <Route path="/profile"        element={PR(<Profile />)}       />
        <Route path="/user/:uid"      element={PR(<UserProfile />)}   />
        <Route path="/search"         element={PR(<SearchUsers />)}   />
        <Route path="/privacidad"     element={PR(<Privacidad />)}    />
        <Route path="/notificaciones" element={PR(<Notifications />)} />
        <Route path="/messages"       element={PR(<Messages />)}      />
        <Route path="/chat/:chatId"   element={PR(<Chat />)}          />

        <Route path="*" element={<Navigate to={user ? '/' : '/login'} replace />} />
      </Routes>
    </BrowserRouter>
  );
}
