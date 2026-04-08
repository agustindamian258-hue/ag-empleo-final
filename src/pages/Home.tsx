import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { auth } from '../app/firebase';
import Navbar from '../components/Navbar';
import Feed from '../components/Feed';
import Menu from '../components/Menu';
import FloatingAI from '../components/FloatingAI';

export default function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const { isSocialMode } = useTheme();

  const user = auth.currentUser;
  const nombre = user?.displayName?.split(' ')[0] || 'Bienvenido';

  return (
    <div className="relative min-h-screen bg-gray-50 pb-24">

      {/* Header */}
      <header className={`sticky top-0 z-30 bg-white border-b ${isSocialMode ? 'border-purple-100' : 'border-blue-100'} px-5 py-4 flex items-center justify-between shadow-sm`}>
        <div>
          <h1 className={`text-2xl font-black tracking-tighter ${isSocialMode ? 'text-purple-700' : 'text-blue-800'}`}>
            AG EMPLEO
          </h1>
          <p className="text-gray-400 text-xs">
            {isSocialMode
              ? `Hola ${nombre}, ¿qué está pasando?`
              : `Hola ${nombre}, encontrá tu próximo trabajo`}
          </p>
        </div>

        {/* Badge de modo */}
        <span className={`text-[10px] font-black px-3 py-1 rounded-full ${isSocialMode ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
          {isSocialMode ? '🌐 Social' : '💼 Empleo'}
        </span>
      </header>

      {/* Contenido */}
      <main className="px-4 pt-4">
        <Feed />
      </main>

      <FloatingAI />
      <Navbar onMenuClick={() => setIsMenuOpen(true)} />
      <Menu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </div>
  );
                                                                }
