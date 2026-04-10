import { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './app/firebase';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import AppRoutes from './app/rutas';

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

function AppContent() {
  const { isSocialMode, setUser } = useTheme();
  // undefined = cargando, null = no autenticado, User = autenticado
  const [user, setLocalUser] = useState<User | null | undefined>(undefined);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setLocalUser(u);
      setUser(u);
    });
    return () => unsub();
  }, [setUser]);

  if (user === undefined) return <LoadingScreen />;

  return (
    <div className={isSocialMode ? 'theme-social' : 'theme-empleo'}>
      <AppRoutes user={user} loading={false} />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
