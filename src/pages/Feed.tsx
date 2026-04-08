import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { auth } from '../app/firebase';
import Navbar from '../components/Navbar';
import Menu from '../components/Menu';
import FloatingAI from '../components/FloatingAI';
import FeedComponent from '../components/Feed';

export default function FeedPage() {
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const { isSocialMode } = useTheme();

  const user = auth.currentUser;
  const nombre = user?.displayName?.split(' ')[0] || 'Bienvenido';

  return (
    <div className="relative min-h-screen bg-gray-50 pb-24">

      {/* Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-purple-100 px-5 py-4 flex items-center justify-between shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-purple-700 tracking-tighter">
            Social
          </h1>
          <p className="text-gray-400 text-xs">
            Hola {nombre}, ¿qué está pasando?
          </p>
        </div>
        <span className="text-[10px] font-black px-3 py-1 rounded-full bg-purple-100 text-purple-600">
          🌐 Social
        </span>
      </header>

      {/* Contenido */}
      <main className="px-4 pt-4">
        <FeedComponent />
      </main>

      <FloatingAI />
      <Navbar onMenuClick={() => setIsMenuOpen(true)} />
      <Menu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </div>
  );
        }
