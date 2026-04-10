import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import {
  Bars3Icon,
  PlusCircleIcon,
  BellIcon,
  ArrowsRightLeftIcon,
  HomeIcon,
} from '@heroicons/react/24/outline';

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface NavbarProps {
  onMenuClick?: () => void;
}

// ─── Componente ───────────────────────────────────────────────────────────────

export default function Navbar({ onMenuClick }: NavbarProps) {
  const { isSocialMode, toggleMode } = useTheme();
  const navigate  = useNavigate();
  const location  = useLocation();

  /**
   * Alterna entre modo Empleo y Social, redirigiendo a la pantalla correspondiente.
   */
  const handleSwitch = () => {
    toggleMode();
    navigate(isSocialMode ? '/' : '/social');
  };

  /** Devuelve la clase de color activo según la ruta y el modo. */
  const activo = (path: string) =>
    location.pathname === path
      ? isSocialMode ? 'text-purple-600' : 'text-blue-600'
      : 'text-gray-400';

  const color  = isSocialMode ? 'text-purple-600'  : 'text-blue-600';
  const bg     = isSocialMode ? 'bg-purple-100'     : 'bg-blue-100';
  const border = isSocialMode ? 'border-purple-100' : 'border-blue-100';
  const accent = isSocialMode ? 'bg-purple-600'     : 'bg-blue-600';

  // Ruta del botón central según el modo
  const publishPath = isSocialMode ? '/social' : '/jobs';

  return (
    <nav
      className={`fixed bottom-0 left-0 right-0 w-full border-t ${border} py-3 px-5 flex justify-between items-center bg-white/95 backdrop-blur-md z-[100] shadow-[0_-2px_10px_rgba(0,0,0,0.06)]`}
      role="navigation"
      aria-label="Navegación principal"
    >
      {/* Menú lateral */}
      <button
        onClick={onMenuClick}
        aria-label="Abrir menú"
        className="flex flex-col items-center gap-0.5 active:scale-90 transition-transform"
      >
        <Bars3Icon className={`w-6 h-6 ${color}`} />
        <span className="text-[9px] text-gray-400">menú</span>
      </button>

      {/* Inicio */}
      <Link
        to="/"
        aria-label="Ir al inicio"
        className="flex flex-col items-center gap-0.5 active:scale-90 transition-transform"
      >
        <HomeIcon className={`w-6 h-6 ${activo('/')}`} />
        <span className="text-[9px] text-gray-400">Inicio</span>
      </Link>

      {/* Botón central elevado */}
      <Link
        to={publishPath}
        aria-label={isSocialMode ? 'Nueva publicación social' : 'Ver empleos'}
        className="relative flex flex-col items-center"
      >
        <div className={`absolute -top-10 ${accent} rounded-full p-3 shadow-xl border-4 border-white`}>
          <PlusCircleIcon className="w-8 h-8 text-white" />
        </div>
        <span className="text-[9px] text-gray-400 mt-6">
          {isSocialMode ? 'Publicar' : 'Empleos'}
        </span>
      </Link>

      {/* Alertas — ruta pendiente, actualmente redirige al inicio via router fallback */}
      <Link
        to="/"
        aria-label="Alertas (próximamente)"
        className="flex flex-col items-center gap-0.5 active:scale-90 transition-transform opacity-50"
      >
        <BellIcon className="w-6 h-6 text-gray-400" />
        <span className="text-[9px] text-gray-400">Alertas</span>
      </Link>

      {/* Switch de modo */}
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
    </nav>
  );
}
