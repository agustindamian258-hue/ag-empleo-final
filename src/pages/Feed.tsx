// src/pages/Feed.tsx
import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import Navbar from '../components/Navbar';
import Menu from '../components/Menu';
import FloatingAI from '../components/FloatingAI';
import FeedComponent from '../components/Feed';
import Stories from '../components/Stories';

export default function FeedPage() {
  const [isMenuOpen,       setIsMenuOpen]       = useState(false);
  const [isPublishOpen,    setIsPublishOpen]    = useState(false);
  const [visorActivo,      setVisorActivo]      = useState(false);
  const { user } = useTheme();
  const navigate = useNavigate();
  const nombre = user?.displayName?.split(' ')[0] || 'Bienvenido';

  return (
    <div className="relative min-h-screen bg-gray-100 dark:bg-gray-950 pb-24">

      <header className="sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-purple-100 dark:border-gray-800 px-5 py-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-2xl font-black text-purple-700 dark:text-purple-400 tracking-tighter">Social</h1>
            <p className="text-gray-400 dark:text-gray-500 text-xs">Hola {nombre}, ¿qué está pasando?</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/search')}
              className="p-2 rounded-full bg-purple-50 dark:bg-purple-900/20 active:scale-95 transition-transform"
              aria-label="Buscar usuarios">
              <MagnifyingGlassIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </button>
            <button onClick={() => navigate('/')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full active:scale-95 transition-all"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #9333ea)', boxShadow: '0 3px 12px rgba(147,51,234,0.4)' }}>
              <span className="text-[11px]">💼</span>
              <span className="text-[10px] font-black text-white">Empleo</span>
            </button>
          </div>
        </div>
        <Stories onVisorChange={setVisorActivo} />
      </header>

      <main className="px-4 pt-4">
        <FeedComponent showCompose={false} zona="social" />
      </main>

      {isPublishOpen && (
        <div className="fixed inset-0 z-[200] bg-black/60 flex items-end" onClick={() => setIsPublishOpen(false)}>
          <div className="w-full bg-white dark:bg-gray-900 rounded-t-3xl px-5 pt-4 pb-16 shadow-2xl animate-slide-up"
            onClick={(e) => e.stopPropagation()}>
            <div className="w-10 h-1 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-4" />
            <p className="text-base font-black text-purple-700 dark:text-purple-400 mb-4">Nueva publicación</p>
            <FeedComponent showCompose={true} soloCompose={true} zona="social" onPublished={() => setIsPublishOpen(false)} />
          </div>
        </div>
      )}

      <FloatingAI />
      {!visorActivo && (
        <Navbar onMenuClick={() => setIsMenuOpen(true)} onPublishClick={() => setIsPublishOpen(true)} />
      )}
      <Menu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </div>
  );
}
