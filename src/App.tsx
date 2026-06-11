// src/App.tsx
import { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from './app/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import AppRoutes from './app/rutas';
import InstallBanner from './components/InstallBanner';
import { WifiIcon } from '@heroicons/react/24/outline';

const COLOR_VARS: Record<string, Record<string, string>> = {
  blue:   { '--sc-500': '#3b82f6', '--sc-600': '#2563eb', '--sc-100': '#dbeafe', '--sc-700': '#1d4ed8' },
  purple: { '--sc-500': '#a855f7', '--sc-600': '#9333ea', '--sc-100': '#f3e8ff', '--sc-700': '#7e22ce' },
  rose:   { '--sc-500': '#f43f5e', '--sc-600': '#e11d48', '--sc-100': '#ffe4e6', '--sc-700': '#be123c' },
  green:  { '--sc-500': '#22c55e', '--sc-600': '#16a34a', '--sc-100': '#dcfce7', '--sc-700': '#15803d' },
  orange: { '--sc-500': '#f97316', '--sc-600': '#ea580c', '--sc-100': '#ffedd5', '--sc-700': '#c2410c' },
  teal:   { '--sc-500': '#14b8a6', '--sc-600': '#0d9488', '--sc-100': '#ccfbf1', '--sc-700': '#0f766e' },
};

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-[--sc-500] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-[--sc-600] font-black text-lg tracking-tighter">AG EMPLEO</p>
      </div>
    </div>
  );
}

function SinConexion() {
  return (
    <div className="fixed inset-0 z-[9999] bg-gray-950 flex flex-col items-center justify-center px-8 text-center">
      <div className="w-20 h-20 rounded-full bg-gray-800 flex items-center justify-center mb-6">
        <WifiIcon className="w-10 h-10 text-gray-500" />
      </div>
      <h2 className="text-2xl font-black text-white mb-2">Sin conexión</h2>
      <p className="text-gray-400 text-sm mb-8">
        No tenés internet en este momento. Revisá tu conexión y volvé a intentarlo.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="px-6 py-3 rounded-2xl bg-blue-600 text-white font-black text-sm active:scale-95 transition-all"
      >
        Reintentar
      </button>
    </div>
  );
}

function AppContent() {
  const { isSocialMode, setUser, socialColor, darkMode } = useTheme();
  const [user,         setLocalUser]   = useState<User | null | undefined>(undefined);
  const [needsOnboard, setNeedsOnboard] = useState(false);
  const [checked,      setChecked]     = useState(false);
  const [sinInternet,  setSinInternet] = useState(!navigator.onLine);

  useEffect(() => {
    const vars = COLOR_VARS[socialColor] ?? COLOR_VARS.blue;
    const root = document.documentElement;
    Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v));
  }, [socialColor]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  // Detectar conexión
  useEffect(() => {
    const online  = () => setSinInternet(false);
    const offline = () => setSinInternet(true);
    window.addEventListener('online',  online);
    window.addEventListener('offline', offline);
    return () => {
      window.removeEventListener('online',  online);
      window.removeEventListener('offline', offline);
    };
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setLocalUser(u);
      setUser(u);
      if (u) {
        try {
          const snap = await getDoc(doc(db, 'users', u.uid));
          if (snap.exists()) {
            const data = snap.data();
            if (!data.accountType || !data.onboardingDone) {
              setNeedsOnboard(true);
            }
          }
        } catch (e) {
          console.error('[App] Error verificando usuario:', e);
        }
      }
      setChecked(true);
    });
    return () => unsub();
  }, [setUser]);

  if (sinInternet) return <SinConexion />;
  if (user === undefined || !checked) return <LoadingScreen />;

  return (
    <div className={isSocialMode ? 'theme-social' : 'theme-empleo'}>
      <AppRoutes
        user={user}
        loading={false}
        needsOnboard={needsOnboard}
        onOnboardDone={() => setNeedsOnboard(false)}
      />
      <InstallBanner />
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
