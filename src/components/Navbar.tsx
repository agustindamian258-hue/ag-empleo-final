import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../Aplicacion';

  Bars3Icon,
  BriefcaseIcon,
  PlusCircleIcon,
  BellIcon,
  ArrowsRightLeftIcon,
  HomeIcon,
} from '@heroicons/react/24/outline';

interface NavbarProps {
  onMenuClick?: () => void;
}

export default function Navbar({ onMenuClick }: NavbarProps) {
  const { isSocialMode, toggleMode } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSwitch = () => {
    toggleMode();
    navigate(isSocialMode ? '/' : '/social');
  };

  const activo = (path: string) =>
    location.pathname === path
      ? isSocialMode
        ? 'text-purple-600'
        : 'text-blue-600'
      : 'text-gray-400';

  const color = isSocialMode ? 'text-purple-600' : 'text-blue-600';
  const bg = isSocialMode ? 'bg-purple-100' : 'bg-blue-100';
  const border = isSocialMode ? 'border-purple-100' : 'border-blue-100';

  return (
    <nav className={`fixed bottom-0 left-0 right-0 w-full border-t ${border} py-3 px-5 flex justify-between items-center bg-white/95 backdrop-blur-md z-[100] shadow-[0_-2px_10px_rgba(0,0,0,0.06)]`}>

      <button 
        onClick={onMenuClick} 
        className="flex flex-col items-center gap-0.5 active:scale-90 transition-transform"
      >
        <Bars3Icon className={`w-6 h-6 ${color}`} />
        <span className="text-[9px] text-gray-400">menu</span>
      </button>

      <Link 
        to="/" 
        className="flex flex-col items-center gap-0.5 active:scale-90 transition-transform"
      >
        <HomeIcon className={`w-6 h-6 ${activo('/')}`} />
        <span className="text-[9px] text-gray-400">Inicio</span>
      </Link>

      <Link 
        to={isSocialMode ? '/social' : '/jobs'} 
        className="relative flex flex-col items-center"
      >
        <div className={`absolute -top-10 ${isSocialMode ? 'bg-purple-600' : 'bg-blue-600'} rounded-full p-3 shadow-xl border-4 border-white`}>
          <PlusCircleIcon className="w-8 h-8 text-white" />
        </div>
        <span className="text-[9px] text-gray-400 mt-6">Publicar</span>
      </Link>

      <Link 
        to="/notifications" 
        className="flex flex-col items-center gap-0.5 active:scale-90 transition-transform"
      >
        <BellIcon className={`w-6 h-6 ${activo('/notifications')}`} />
        <span className="text-[9px] text-gray-400">Alertas</span>
      </Link>

      <button
        onClick={handleSwitch}
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
