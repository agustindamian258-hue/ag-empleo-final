import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../App'; 
import { 
  Bars3Icon, // IMPORTAMOS EL ICONO DE MENÚ (3 RAYITAS)
  BriefcaseIcon, 
  PlusCircleIcon, 
  BellIcon, 
  ArrowsRightLeftIcon 
} from '@heroicons/react/24/outline';

// Agregamos la interfaz para recibir la función de abrir el menú
interface NavbarProps {
  onMenuClick?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onMenuClick }) => {
  const { isSocialMode, toggleMode } = useTheme();
  const navigate = useNavigate();

  const handleSwitch = () => {
    toggleMode();
    // Navegación limpia entre modos
    navigate(isSocialMode ? "/" : "/social");
  };

  return (
    <nav className={`fixed bottom-0 w-full border-t py-2 px-4 flex justify-between items-center bg-white z-50 ${isSocialMode ? 'border-purple-200' : 'border-blue-200'}`}>
      
      {/* 1. MENÚ DE LAS 3 RAYITAS (Reemplaza al Inicio para abrir el Menú lateral) */}
      <button 
        onClick={onMenuClick} 
        className="flex flex-col items-center p-2 active:scale-90 transition-transform"
      >
        <Bars3Icon className={`w-8 h-8 ${isSocialMode ? 'text-purple-600' : 'text-blue-600'}`} />
      </button>

      {/* Búsqueda / Empleos */}
      <Link to="/jobs" className="flex flex-col items-center">
        <BriefcaseIcon className="w-7 h-7 text-gray-500 hover:text-blue-500" />
      </Link>

      {/* PUBLICAR (Botón central resaltado - Regla de oro: botones grandes) */}
      <Link to={isSocialMode ? "/social" : "/jobs"} className="flex flex-col items-center">
        <PlusCircleIcon className={`w-12 h-12 -mt-6 bg-white rounded-full shadow-md ${isSocialMode ? 'text-purple-500' : 'text-blue-500'}`} />
        <span className="text-[10px] font-bold text-gray-400 mt-1 uppercase">Publicar</span>
      </Link>

      {/* Notificaciones */}
      <Link to="/notifications" className="flex flex-col items-center text-gray-500">
        <BellIcon className="w-7 h-7" />
      </Link>

      {/* Switcher de Interfaz (EL BOTÓN QUE CAMBIA TODO) */}
      <button 
        onClick={handleSwitch}
        className={`p-2 rounded-xl transition-all active:rotate-180 duration-500 ${isSocialMode ? 'bg-purple-100' : 'bg-blue-100'}`}
      >
        <ArrowsRightLeftIcon className={`w-7 h-7 ${isSocialMode ? 'text-purple-700' : 'text-blue-700'}`} />
      </button>

    </nav>
  );
};

export default Navbar;
