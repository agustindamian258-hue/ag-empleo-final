import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../App'; 
import { 
  Bars3Icon, 
  BriefcaseIcon, 
  PlusCircleIcon, 
  BellIcon, 
  ArrowsRightLeftIcon 
} from '@heroicons/react/24/outline';

interface NavbarProps {
  onMenuClick?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onMenuClick }) => {
  const { isSocialMode, toggleMode } = useTheme();
  const navigate = useNavigate();

  const handleSwitch = () => {
    toggleMode();
    navigate(isSocialMode ? "/" : "/social");
  };

  return (
    <nav className={`fixed bottom-0 left-0 right-0 w-full border-t py-3 px-6 flex justify-between items-center bg-white/90 backdrop-blur-md z-[100] ${isSocialMode ? 'border-purple-200' : 'border-blue-200 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]'}`}>
      
      {/* Menú lateral */}
      <button onClick={onMenuClick} className="flex flex-col items-center active:scale-90 transition-transform">
        <Bars3Icon className={`w-7 h-7 ${isSocialMode ? 'text-purple-600' : 'text-blue-600'}`} />
      </button>

      {/* Empleos */}
      <Link to="/jobs" className="flex flex-col items-center active:scale-90 transition-transform">
        <BriefcaseIcon className="w-7 h-7 text-gray-500" />
      </Link>

      {/* BOTÓN CENTRAL: PUBLICAR (Mejora visual de tamaño) */}
      <Link to={isSocialMode ? "/social" : "/jobs"} className="relative flex flex-col items-center">
        <div className="absolute -top-12 bg-white rounded-full p-1 shadow-lg">
           <PlusCircleIcon className={`w-14 h-14 ${isSocialMode ? 'text-purple-500' : 'text-blue-500'}`} />
        </div>
        <span className="text-[9px] font-black text-gray-500 mt-6 uppercase tracking-tighter">Publicar</span>
      </Link>

      {/* Notificaciones */}
      <Link to="/notifications" className="flex flex-col items-center active:scale-90 transition-transform">
        <BellIcon className="w-7 h-7 text-gray-500" />
      </Link>

      {/* SWITCHER (Cambio de mundo) */}
      <button onClick={handleSwitch} className={`p-2 rounded-2xl transition-all active:rotate-180 duration-700 ${isSocialMode ? 'bg-purple-100' : 'bg-blue-100'}`}>
        <ArrowsRightLeftIcon className={`w-7 h-7 ${isSocialMode ? 'text-purple-700' : 'text-blue-700'}`} />
      </button>
    </nav>
  );
};

export default Navbar;
