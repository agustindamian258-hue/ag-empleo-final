import { useState } from 'react';
import Navbar from '../components/Navbar';
import Feed from '../components/Feed';
import Menu from '../components/Menu';
import FloatingAI from '../components/FloatingAI';

export default function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="relative min-h-screen bg-gray-50 pb-24">
      <header className="sticky top-0 z-30 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-blue-800 tracking-tighter">AG EMPLEO</h1>
          <p className="text-gray-400 text-xs">Tu próxima experiencia laboral</p>
        </div>
      </header>

      <main className="px-4 pt-4">
        <Feed />
      </main>

      <FloatingAI />
      <Navbar onMenuClick={() => setIsMenuOpen(true)} />
      <Menu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </div>
  );
}
