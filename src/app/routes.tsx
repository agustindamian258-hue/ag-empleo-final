// src/app/rutas.tsx
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

interface AppRoutesProps {
  user: User | null;
  loading: boolean;
}

/**
 * Componente de ruta protegida.
 * Muestra un loader mientras Firebase resuelve el estado de auth,
 * luego redirige según corresponda.
 */
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
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        Cargando...
      </div>
    );
  }
  return user ? children : <Navigate to="/login" replace />;
}

/**
 * Componente principal de rutas de la aplicación.
 * Gestiona la navegación y protección de rutas según estado de autenticación.
 */
export default function AppRoutes({ user, loading }: AppRoutesProps) {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta pública: redirige al home si ya está autenticado */}
        <Route
          path="/login"
          element={
            loading ? (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: '100vh',
                }}
              >
                Cargando...
              </div>
            ) : !user ? (
              <Login />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        {/* Rutas protegidas */}
        <Route
          path="/"
          element={
            <ProtectedRoute user={user} loading={loading}>
              <Home />
            </ProtectedRoute>
          }
        />
        <Route
          path="/jobs"
          element={
            <ProtectedRoute user={user} loading={loading}>
              <Jobs />
            </ProtectedRoute>
          }
        />
        <Route
          path="/companies"
          element={
            <ProtectedRoute user={user} loading={loading}>
              <Companies />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cv"
          element={
            <ProtectedRoute user={user} loading={loading}>
              <CVBuilder />
            </ProtectedRoute>
          }
        />
        <Route
          path="/mapa"
          element={
            <ProtectedRoute user={user} loading={loading}>
              <MapPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/social"
          element={
            <ProtectedRoute user={user} loading={loading}>
              <Feed />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute user={user} loading={loading}>
              <Profile />
            </ProtectedRoute>
          }
        />

        {/* Ruta fallback */}
        <Route
          path="*"
          element={<Navigate to={user ? '/' : '/login'} replace />}
        />
      </Routes>
    </BrowserRouter>
  );
                }ññ
