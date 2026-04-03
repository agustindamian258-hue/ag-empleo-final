import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../App'; // Importamos el switch de modo
import { 
  HomeIcon, 
  BriefcaseIcon, 
  PlusCircleIcon, 
  BellIcon, 
  UserIcon,
  ArrowsRightLeftIcon 
} from '@heroicons/react/24/outline';

const Navbar: React.FC = () => {
  const { isSocialMode, toggleMode } = useTheme();
  const navigate = useNavigate();

  const handleSwitch = () => {
    toggleMode();
    // Si pasamos a social, vamos al feed; si no, al home de empleo
    navigate(isSocialMode ? "/" : "/social");
  };

  return (
    <nav className={`fixed bottom-0 w-full border-t py-2 px-4 flex justify-between items-center bg-white z-50 ${isSocialMode ? 'border-purple-200' : 'border-blue-200'}`}>
      
      {/* Inicio */}
      <Link to="/" className="flex flex-col items-center">
        <HomeIcon className={`w-7 h-7 ${isSocialMode ? 'text-purple-600' : 'text-blue-600'}`} />
      </Link>

      {/* Búsqueda / Empleos */}
      <Link to="/jobs" className="flex flex-col items-center">
        <BriefcaseIcon className="w-7 h-7 text-gray-500" />
      </Link>

      {/* PUBLICAR (Botón central resaltado) */}
      <Link to={isSocialMode ? "/social" : "/jobs"} className="flex flex-col items-center">
        <PlusCircleIcon className={`w-10 h-10 -mt-4 shadow-sm ${isSocialMode ? 'text-purple-500' : 'text-blue-500'}`} />
      </Link>

      {/* Notificaciones */}
      <Link to="/notifications" className="flex flex-col items-center">
        <BellIcon className="w-7 h-7 text-gray-500" />
      </Link>

      {/* Switcher de Interfaz (EL BOTÓN QUE CAMBIA TODO) */}
      <button 
        onClick={handleSwitch}
        className={`p-2 rounded-full transition-all ${isSocialMode ? 'bg-purple-100' : 'bg-blue-100'}`}
      >
        <ArrowsRightLeftIcon className={`w-7 h-7 ${isSocialMode ? 'text-purple-700' : 'text-blue-700'}`} />
      </button>

    </nav>
  );
};

export default Navbar;
