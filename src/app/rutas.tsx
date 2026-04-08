import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { User } from 'firebase/auth';
import Home from '../pages/Home';
import Jobs from '../pages/Jobs';
import Companies from '../pages/Companies';
import CVBuilder from '../pages/CVBuilder';
import Feed from '../pages/Feed';
import Login from '../pages/Login';
import Profile from '../pages/Profile';
import MapPage from '../pages/MapPage';
import Privacidad from '../pages/Privacidad';

interface AppRoutesProps {
  user: User | null;
  loading: boolean;
}

function ProtectedRoute({
  user,
  loading,
  children,
}: {
  user: User | null;
  loading: boolean;
  children: JSX.Element;
}) {
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-blue-700 font-bold text-lg">AG EMPLEO</p>
        </div>
      </div>
    );
  }
  return user ? children : <Navigate to="/login" replace />;
}

export default function AppRoutes({ user, loading }: AppRoutesProps) {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            loading ? (
              <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : !user ? (
              <Login />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        <Route path="/" element={<ProtectedRoute user={user} loading={loading}><Home /></ProtectedRoute>} />
        <Route path="/jobs" element={<ProtectedRoute user={user} loading={loading}><Jobs /></ProtectedRoute>} />
        <Route path="/companies" element={<ProtectedRoute user={user} loading={loading}><Companies /></ProtectedRoute>} />
        <Route path="/cv" element={<ProtectedRoute user={user} loading={loading}><CVBuilder /></ProtectedRoute>} />
        <Route path="/mapa" element={<ProtectedRoute user={user} loading={loading}><MapPage /></ProtectedRoute>} />
        <Route path="/social" element={<ProtectedRoute user={user} loading={loading}><Feed /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute user={user} loading={loading}><Profile /></ProtectedRoute>} />
        <Route path="/privacidad" element={<ProtectedRoute user={user} loading={loading}><Privacidad /></ProtectedRoute>} />

        <Route path="*" element={<Navigate to={user ? '/' : '/login'} replace />} />
      </Routes>
    </BrowserRouter>
  );
}
