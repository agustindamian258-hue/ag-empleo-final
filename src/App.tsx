import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './app/firebase';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import AppRoutes from './app/rutas';

// ─── Spinner de carga global ──────────────────────────────────────────────────

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-blue-700 font-bold text-lg tracking-tighter">AG EMPLEO</p>
      </div>
    </div>
  );
}

// ─── AppContent: accede al contexto ya provisto ───────────────────────────────

function AppContent() {
  const { isSocialMode, user, setUser } = useTheme();

  // Suscripción al estado de autenticación de Firebase
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsub();
  }, [setUser]);

  // Mientras Firebase resuelve el estado inicial, mostramos loading
  // user === undefined significa "aún no resuelto"; null = no autenticado
  if (user === undefined) return <LoadingScreen />;

  return (
    <div className={isSocialMode ? 'theme-social' : 'theme-empleo'}>
      <AppRoutes user={user} loading={false} />
    </div>
  );
}

// ─── App: provee contexto global ──────────────────────────────────────────────

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
