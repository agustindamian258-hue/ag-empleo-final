import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import Navbar     from '../components/Navbar';
import Feed       from '../components/Feed';
import Menu       from '../components/Menu';
import FloatingAI from '../components/FloatingAI';

export default function Home() {
  const [isMenuOpen,    setIsMenuOpen]    = useState<boolean>(false);
  const [isPublishOpen, setIsPublishOpen] = useState<boolean>(false);
  const { isSocialMode, user }            = useTheme();
  const nombre = user?.displayName?.split(' ')[0] || 'Bienvenido';

  return (
    <div className="relative min-h-screen bg-gray-50 pb-24">
      <header
        className={`sticky top-0 z-30 bg-white border-b ${
          isSocialMode ? 'border-purple-100' : 'border-blue-100'
        } px-5 py-4 flex items-center justify-between shadow-sm`}
      >
        <div>
          <h1 className={`text-2xl font-black tracking-tighter ${
            isSocialMode ? 'text-purple-700' : 'text-blue-800'
          }`}>
            AG EMPLEO
          </h1>
          <p className="text-gray-400 text-xs">
            {isSocialMode
              ? `Hola ${nombre}, ¿qué está pasando?`
              : `Hola ${nombre}, encontrá tu próximo trabajo`}
          </p>
        </div>
        <span className={`text-[10px] font-black px-3 py-1 rounded-full ${
          isSocialMode ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'
        }`}>
          {isSocialMode ? '🌐 Social' : '💼 Empleo'}
        </span>
      </header>

      {/* Solo lista de posts — sin compose */}
      <main className="px-4 pt-4">
        <Feed showCompose={false} />
      </main>

      <FloatingAI />
      <Navbar
        onMenuClick={() => setIsMenuOpen(true)}
        onPublishClick={() => setIsPublishOpen(true)}
      />
      <Menu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

      {/* Popup de publicar desde abajo */}
      {isPublishOpen && (
        <div
          className="fixed inset-0 z-[200] bg-black/60 flex items-end"
          onClick={() => setIsPublishOpen(false)}
        >
          <div
            className="w-full bg-white rounded-t-3xl p-5 pb-10 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle visual */}
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
            <p className={`text-base font-black mb-4 ${
              isSocialMode ? 'text-purple-700' : 'text-blue-800'
            }`}>
              Nueva publicación
            </p>
            <Feed
              showCompose={true}
              onPublished={() => setIsPublishOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
