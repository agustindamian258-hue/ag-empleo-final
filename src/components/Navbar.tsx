import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import {
  Bars3Icon, PlusIcon, BellIcon, ArrowsRightLeftIcon, HomeIcon,
} from '@heroicons/react/24/outline';

interface NavbarProps {
  onMenuClick?:   () => void;
  onPublishClick?: () => void;
}

export default function Navbar({ onMenuClick, onPublishClick }: NavbarProps) {
  const { isSocialMode, toggleMode } = useTheme();
  const navigate  = useNavigate();
  const location  = useLocation();

  const handleSwitch = () => {
    toggleMode();
    navigate(isSocialMode ? '/' : '/social');
  };

  const activo = (path: string) =>
    location.pathname === path
      ? isSocialMode ? 'text-purple-600' : 'text-blue-600'
      : 'text-gray-400';

  const color  = isSocialMode ? 'text-purple-600'  : 'text-blue-600';
  const bg     = isSocialMode ? 'bg-purple-100'     : 'bg-blue-100';
  const border = isSocialMode ? 'border-purple-100' : 'border-blue-100';
  const accent = isSocialMode ? 'bg-purple-600'     : 'bg-blue-600';

  return (
    <nav
      className={`fixed bottom-0 left-0 right-0 w-full border-t ${border} bg-white/95 backdrop-blur-md z-[100] shadow-[0_-2px_10px_rgba(0,0,0,0.06)]`}
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

        {/* Inicio */}
        <Link to="/" className="flex flex-col items-center gap-0.5 active:scale-90 transition-transform">
          <HomeIcon className={`w-6 h-6 ${activo('/')}`} />
          <span className="text-[9px] text-gray-400">Inicio</span>
        </Link>

        {/* Botón central — círculo flotante */}
        <div className="flex flex-col items-center" style={{ marginTop: '-24px' }}>
          <button
            onClick={isSocialMode ? onPublishClick : () => navigate('/jobs')}
            aria-label={isSocialMode ? 'Nueva publicación' : 'Ver empleos'}
            className={`w-14 h-14 ${accent} rounded-full flex items-center justify-center shadow-lg border-4 border-white active:scale-90 transition-transform`}
          >
            <PlusIcon className="w-7 h-7 text-white" strokeWidth={2.5} />
          </button>
          <span className="text-[9px] text-gray-400 mt-1">
            {isSocialMode ? 'Publicar' : 'Empleos'}
          </span>
        </div>

        {/* Alertas */}
        <Link to="/" className="flex flex-col items-center gap-0.5 active:scale-90 transition-transform opacity-50">
          <BellIcon className="w-6 h-6 text-gray-400" />
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
