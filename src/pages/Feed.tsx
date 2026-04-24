// src/pages/Feed.tsx
import { useState } from 'react';
import { useTheme }     from '../context/ThemeContext';
import Navbar           from '../components/Navbar';
import Menu             from '../components/Menu';
import FloatingAI       from '../components/FloatingAI';
import FeedComponent    from '../components/Feed';
import Stories          from '../components/Stories';

export default function FeedPage() {
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const { user }                    = useTheme();

  const nombre = user?.displayName?.split(' ')[0] || 'Bienvenido';

  return (
    <div className="relative min-h-screen bg-gray-100 dark:bg-gray-950 pb-24">

      <header className="sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-purple-100 dark:border-gray-800 px-5 py-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-2xl font-black text-purple-700 dark:text-purple-400 tracking-tighter">Social</h1>
            <p className="text-gray-400 dark:text-gray-500 text-xs">Hola {nombre}, ¿qué está pasando?</p>
          </div>
          <span className="text-[10px] font-black px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
            🌐 Social
          </span>
        </div>
        {/* Stories en el header */}
        <Stories />
      </header>

      <main className="px-4 pt-4">
        <FeedComponent />
      </main>

      <FloatingAI />
      <Navbar onMenuClick={() => setIsMenuOpen(true)} />
      <Menu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </div>
  );
}
