import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../app/firebase';
import { useTheme } from '../context/ThemeContext';
import {
  Bars3Icon, PlusIcon, BellIcon, HomeIcon,
  MagnifyingGlassIcon, ChatBubbleLeftEllipsisIcon,
  FilmIcon,
} from '@heroicons/react/24/outline';

interface NavbarProps {
  onMenuClick?:    () => void;
  onPublishClick?: () => void;
}

export default function Navbar({ onMenuClick, onPublishClick }: NavbarProps) {
  const { isSocialMode, toggleMode, user } = useTheme();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [sinLeer,     setSinLeer]     = useState(0);
  const [sinMensajes, setSinMensajes] = useState(0);
  const [switching,   setSwitching]   = useState(false);

  useEffect(() => {
    if (!user) return;
    const qNotif = query(
      collection(db, 'notifications'),
      where('uid', '==', user.uid),
      where('leida', '==', false),
    );
    const unsubNotif = onSnapshot(qNotif, (snap) => setSinLeer(snap.size));

    const qChats = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', user.uid),
      where('unreadBy', 'array-contains', user.uid),
    );
    const unsubChats = onSnapshot(qChats, (snap) => setSinMensajes(snap.size), console.error);

    return () => { unsubNotif(); unsubChats(); };
  }, [user]);

  const handleSwitch = () => {
    setSwitching(true);
    setTimeout(() => {
      toggleMode();
      navigate(isSocialMode ? '/' : '/social');
      setSwitching(false);
    }, 180);
  };

  const isActive = (path: string) => location.pathname === path;
  const modeColor = isSocialMode ? '#9333ea' : '#2563eb';
  const modeBg    = isSocialMode ? 'rgba(147,51,234,0.12)' : 'rgba(37,99,235,0.12)';

  const iconStyle = (path: string) => ({
    color: isActive(path) ? modeColor : '#9ca3af',
  });

  return (
    <>
      {/* Pill flotante switch */}
      <div className="fixed z-[101] left-1/2" style={{ bottom: '72px', transform: 'translateX(-50%)' }}>
        <button
          onClick={handleSwitch}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '7px 16px', borderRadius: '999px',
            background: isSocialMode
              ? 'linear-gradient(135deg, #7c3aed, #9333ea)'
              : 'linear-gradient(135deg, #1d4ed8, #2563eb)',
            boxShadow: isSocialMode
              ? '0 4px 20px rgba(147,51,234,0.5)'
              : '0 4px 20px rgba(37,99,235,0.5)',
            border: 'none', cursor: 'pointer',
            opacity: switching ? 0.6 : 1,
            transform: switching ? 'scale(0.93)' : 'scale(1)',
            transition: 'all 0.18s cubic-bezier(0.34,1.56,0.64,1)',
            whiteSpace: 'nowrap',
          }}
        >
          <span style={{ fontSize: '13px' }}>{isSocialMode ? '💼' : '🌐'}</span>
          <span style={{ fontSize: '11px', fontWeight: 800, color: '#fff', letterSpacing: '0.03em' }}>
            Ir a {isSocialMode ? 'Empleo' : 'Social'}
          </span>
          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.8)' }}>→</span>
        </button>
      </div>

      {/* Navbar */}
      <nav
        className="fixed bottom-0 left-0 right-0 w-full bg-white/96 dark:bg-gray-900/96 backdrop-blur-xl z-[100]"
        style={{
          borderTop: `2px solid ${isSocialMode ? 'rgba(147,51,234,0.2)' : 'rgba(37,99,235,0.2)'}`,
          boxShadow: '0 -4px 24px rgba(0,0,0,0.08)',
          transition: 'border-color 0.3s ease',
        }}
      >
        <div className="flex justify-between items-center px-3 pt-2 pb-3">

          {/* Menú */}
          <button
            onClick={onMenuClick}
            className="flex flex-col items-center gap-0.5 active:scale-90 transition-transform px-1"
          >
            <Bars3Icon className="w-[22px] h-[22px] text-gray-400 dark:text-gray-500" />
            <span className="text-[9px] text-gray-400">menú</span>
          </button>

          {/* 2do ícono — según modo */}
          {isSocialMode ? (
            <NavLink to="/search" label="Buscar" active={isActive('/search')} color={modeColor} bg={modeBg}>
              <MagnifyingGlassIcon className="w-[22px] h-[22px]" style={iconStyle('/search')} />
            </NavLink>
          ) : (
            <NavLink to="/" label="Inicio" active={isActive('/')} color={modeColor} bg={modeBg}>
              <HomeIcon className="w-[22px] h-[22px]" style={iconStyle('/')} />
            </NavLink>
          )}

          {/* Botón central */}
          <div className="flex flex-col items-center" style={{ marginTop: '-22px' }}>
            <button
              onClick={isSocialMode ? onPublishClick : () => navigate('/jobs')}
              style={{
                width: 52, height: 52, borderRadius: '50%',
                background: isSocialMode
                  ? 'linear-gradient(135deg, #7c3aed, #9333ea)'
                  : 'linear-gradient(135deg, #1d4ed8, #2563eb)',
                boxShadow: isSocialMode
                  ? '0 6px 20px rgba(147,51,234,0.45)'
                  : '0 6px 20px rgba(37,99,235,0.45)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '3px solid white', cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.34,1.56,0.64,1)',
              }}
              className="active:scale-90 dark:[border-color:#111827]"
            >
              <PlusIcon className="w-6 h-6 text-white" strokeWidth={2.8} />
            </button>
            <span className="text-[9px] text-gray-400 mt-1">
              {isSocialMode ? 'Publicar' : 'Empleos'}
            </span>
          </div>

          {/* Reels — solo en Social / Mensajes — solo en Empleo */}
          {isSocialMode ? (
            <NavLink to="/reels" label="Reels" active={isActive('/reels')} color={modeColor} bg={modeBg}>
              <FilmIcon className="w-[22px] h-[22px]" style={iconStyle('/reels')} />
            </NavLink>
          ) : (
            <NavLink to="/messages" label="Mensajes" active={isActive('/messages')} color={modeColor} bg={modeBg}>
              <div className="relative">
                <ChatBubbleLeftEllipsisIcon className="w-[22px] h-[22px]" style={iconStyle('/messages')} />
                {sinMensajes > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center text-white font-black rounded-full"
                    style={{ width: 16, height: 16, fontSize: 9, background: '#ef4444' }}>
                    {sinMensajes > 9 ? '9+' : sinMensajes}
                  </span>
                )}
              </div>
            </NavLink>
          )}

          {/* Alertas */}
          <NavLink to="/notificaciones" label="Alertas" active={isActive('/notificaciones')} color={modeColor} bg={modeBg}>
            <div className="relative">
              <BellIcon className="w-[22px] h-[22px]" style={iconStyle('/notificaciones')} />
              {sinLeer > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center text-white font-black rounded-full"
                  style={{ width: 16, height: 16, fontSize: 9, background: '#ef4444' }}>
                  {sinLeer > 9 ? '9+' : sinLeer}
                </span>
              )}
            </div>
          </NavLink>

        </div>

        {/* Línea modo */}
        <div style={{
          height: 3,
          background: isSocialMode
            ? 'linear-gradient(90deg, #7c3aed, #9333ea, #c084fc)'
            : 'linear-gradient(90deg, #1d4ed8, #2563eb, #60a5fa)',
          transition: 'background 0.4s ease',
        }} />
      </nav>
    </>
  );
}

function NavLink({ to, label, active, color, bg, children }: {
  to: string; label: string; active: boolean; color: string; bg: string; children: React.ReactNode;
}) {
  return (
    <Link
      to={to}
      className="flex flex-col items-center gap-0.5 active:scale-90 transition-transform"
      style={active ? { background: bg, borderRadius: 12, padding: '4px 8px', marginTop: -4, marginBottom: -4 } : { padding: '4px 8px' }}
    >
      {children}
      <span className="text-[9px] font-semibold" style={{ color: active ? color : '#9ca3af' }}>
        {label}
      </span>
    </Link>
  );
              }
