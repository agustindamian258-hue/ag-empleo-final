import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import Navbar from '../components/Navbar';
import Menu from '../components/Menu';
import FloatingAI from '../components/FloatingAI';

export default function Home() {
  const [isMenuOpen,    setIsMenuOpen]    = useState<boolean>(false);
  const [isPublishOpen, setIsPublishOpen] = useState<boolean>(false);
  const { user } = useTheme();
  const nombre = user?.displayName?.split(' ')[0] || 'Bienvenido';

  return (
    <div className="relative min-h-screen bg-gray-50 dark:bg-gray-950 pb-24">
      <header className="sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-blue-100 dark:border-gray-800 px-5 py-4 flex items-center justify-between shadow-sm">
        <div>
          <h1 className="text-2xl font-black tracking-tighter text-blue-800 dark:text-blue-400">
            AG EMPLEO
          </h1>
          <p className="text-gray-400 text-xs">
            Hola {nombre}, encontrá tu próximo trabajo
          </p>
        </div>
        <span className="text-[10px] font-black px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
          💼 Empleo
        </span>
      </header>

      {/* Zona Empleo — sin feed social */}
      <main className="px-4 pt-6 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <a href="/jobs" className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 flex flex-col gap-2 shadow-sm active:scale-95 transition-transform">
            <span className="text-2xl">💼</span>
            <p className="font-black text-gray-800 dark:text-white text-sm">Empleos</p>
            <p className="text-xs text-gray-400">Ofertas de trabajo</p>
          </a>
          <a href="/companies" className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 flex flex-col gap-2 shadow-sm active:scale-95 transition-transform">
            <span className="text-2xl">🏢</span>
            <p className="font-black text-gray-800 dark:text-white text-sm">Empresas A-Z</p>
            <p className="text-xs text-gray-400">Directorio completo</p>
          </a>
          <a href="/cv" className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 flex flex-col gap-2 shadow-sm active:scale-95 transition-transform">
            <span className="text-2xl">📄</span>
            <p className="font-black text-gray-800 dark:text-white text-sm">Generador CV</p>
            <p className="text-xs text-gray-400">Creá tu curriculum</p>
          </a>
          <a href="/mapa" className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 flex flex-col gap-2 shadow-sm active:scale-95 transition-transform">
            <span className="text-2xl">🗺️</span>
            <p className="font-black text-gray-800 dark:text-white text-sm">Mapa Changas</p>
            <p className="text-xs text-gray-400">Trabajos cerca tuyo</p>
          </a>
        </div>
      </main>

      <FloatingAI />
      <Navbar
        onMenuClick={() => setIsMenuOpen(true)}
        onPublishClick={() => setIsPublishOpen(true)}
      />
      <Menu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </div>
  );
}
