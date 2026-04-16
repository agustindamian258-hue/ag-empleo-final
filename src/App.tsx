// src/App.tsx
import { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './app/firebase';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import AppRoutes from './app/rutas';

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

function AppContent() {
  const { isSocialMode, setUser, socialColor, darkMode } = useTheme();
  const [user, setLocalUser] = useState<User | null | undefined>(undefined);

  // Aplica variables CSS de color
  useEffect(() => {
    const vars = COLOR_VARS[socialColor] ?? COLOR_VARS.blue;
    const root = document.documentElement;
    Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v));
  }, [socialColor]);

  // Aplica dark mode en <html>
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

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
