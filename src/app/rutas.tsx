// src/app/rutas.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { User } from 'firebase/auth';
import Home          from '../pages/Home';
import Jobs          from '../pages/Jobs';
import Companies     from '../pages/Companies';
import CVBuilder     from '../pages/CVBuilder';
import Feed          from '../pages/Feed';
import Login         from '../pages/Login';
import Profile       from '../pages/Profile';
import MapPage       from '../pages/MapPage';
import Privacidad    from '../pages/Privacidad';
import Notifications from '../pages/Notifications';

interface AppRoutesProps   { user: User | null; loading: boolean; }
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

export default function AppRoutes({ user, loading }: AppRoutesProps) {
  const PR = (el: React.ReactElement) => (
    <ProtectedRoute user={user} loading={loading}>{el}</ProtectedRoute>
  );

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={loading ? <LoadingScreen /> : !user ? <Login /> : <Navigate to="/" replace />} />

        <Route path="/"               element={PR(<Home />)}          />
        <Route path="/jobs"           element={PR(<Jobs />)}          />
        <Route path="/companies"      element={PR(<Companies />)}     />
        <Route path="/cv"             element={PR(<CVBuilder />)}     />
        <Route path="/mapa"           element={PR(<MapPage />)}       />
        <Route path="/social"         element={PR(<Feed />)}          />
        <Route path="/profile"        element={PR(<Profile />)}       />
        <Route path="/privacidad"     element={PR(<Privacidad />)}    />
        <Route path="/notificaciones" element={PR(<Notifications />)} />

        <Route path="*" element={<Navigate to={user ? '/' : '/login'} replace />} />
      </Routes>
    </BrowserRouter>
  );
      }
