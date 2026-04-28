// src/components/Navbar.tsx
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../app/firebase';
import { useTheme } from '../context/ThemeContext';
import {
  Bars3Icon, PlusIcon, BellIcon,
  ArrowsRightLeftIcon, HomeIcon,
  FilmIcon, MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';

interface NavbarProps {
  onMenuClick?:    () => void;
  onPublishClick?: () => void;
}

export default function Navbar({ onMenuClick, onPublishClick }: NavbarProps) {
  const { isSocialMode, toggleMode, user } = useTheme();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [sinLeer, setSinLeer] = useState(0);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'notifications'),
      where('uid', '==', user.uid),
      where('leida', '==', false),
    );
    const unsub = onSnapshot(q, (snap) => setSinLeer(snap.size));
    return () => unsub();
  }, [user]);

  const handleSwitch = () => {
    toggleMode();
    navigate(isSocialMode ? '/' : '/social');
  };

  const activo = (path: string) =>
    location.pathname === path ? 'text-[--sc-500]' : 'text-gray-400';

  const color  = 'text-[--sc-500]';
  const bg     = 'bg-[--sc-100]';
  const border = 'border-[--sc-100]';
  const accent = 'bg-[--sc-500]';

  return (
    <nav
      className={`fixed bottom-0 left-0 right-0 w-full border-t ${border} bg-white/95 dark:bg-gray-900/95 backdrop-blur-md z-[100] shadow-[0_-2px_10px_rgba(0,0,0,0.06)]`}
      role="navigation"
      aria-label="Navegación principal"
    >
      <div className="flex justify-between items-center px-6 pt-2 pb-3">

        {/* Menú */}
        <button
          onClick={onMenuClick}
          aria-label="Abrir menú"
          className="flex flex-col items-center gap-0.5 active:scale-90 transition-transform"
        >
          <Bars3Icon className={`w-6 h-6 ${color}`} />
          <span className="text-[9px] text-gray-400">menú</span>
        </button>

        {/* Segundo ícono — Buscar (social) / Inicio (empleo) */}
        {isSocialMode ? (
          <Link
            to="/search"
            className="flex flex-col items-center gap-0.5 active:scale-90 transition-transform"
          >
            <MagnifyingGlassIcon className={`w-6 h-6 ${activo('/search')}`} />
            <span className="text-[9px] text-gray-400">Buscar</span>
          </Link>
        ) : (
          <Link
            to="/"
            className="flex flex-col items-center gap-0.5 active:scale-90 transition-transform"
          >
            <HomeIcon className={`w-6 h-6 ${activo('/')}`} />
            <span className="text-[9px] text-gray-400">Inicio</span>
          </Link>
        )}

        {/* Botón central */}
        <div className="flex flex-col items-center" style={{ marginTop: '-24px' }}>
          <button
            onClick={isSocialMode ? onPublishClick : () => navigate('/jobs')}
            aria-label={isSocialMode ? 'Nueva publicación' : 'Ver empleos'}
            className={`w-14 h-14 ${accent} rounded-full flex items-center justify-center shadow-lg border-4 border-white dark:border-gray-900 active:scale-90 transition-transform`}
          >
            <PlusIcon className="w-7 h-7 text-white" strokeWidth={2.5} />
          </button>
          <span className="text-[9px] text-gray-400 mt-1">
            {isSocialMode ? 'Publicar' : 'Empleos'}
          </span>
        </div>

        {/* Alertas */}
        <Link
          to="/notificaciones"
          className="flex flex-col items-center gap-0.5 active:scale-90 transition-transform relative"
        >
          <div className="relative">
            <BellIcon className={`w-6 h-6 ${activo('/notificaciones')}`} />
            {sinLeer > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                {sinLeer > 9 ? '9+' : sinLeer}
              </span>
            )}
          </div>
          <span className="text-[9px] text-gray-400">Alertas</span>
        </Link>

        {/* Switch modo */}
        <button
          onClick={handleSwitch}
          aria-label={`Cambiar a modo ${isSocialMode ? 'Empleo' : 'Social'}`}
          className={`flex flex-col items-center gap-0.5 p-2 rounded-2xl ${bg} active:scale-90 transition-all`}
        >
          <ArrowsRightLeftIcon className={`w-6 h-6 ${color}`} />
          <span className={`text-[9px] font-bold ${color}`}>
            {isSocialMode ? 'Empleo' : 'Social'}
          </span>
        </button>

      </div>
    </nav>
  );
}
