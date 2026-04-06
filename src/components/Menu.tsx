import React from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../app/firebase';
import { signOut } from 'firebase/auth';
import {
  BuildingOfficeIcon,
  MapIcon,
  DocumentTextIcon,
  ArrowLeftOnRectangleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface menuProps {
  isOpen: boolean;
  onClose: () => void;
}

const menu: React.FC<menuProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  const goTo = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black bg-opacity-50 flex justify-end">
      
      <div className="w-4/5 h-full bg-white shadow-2xl flex flex-col animate-fade-left">
        
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-blue-600 text-white">
          <div>
            <h2 className="text-xl font-bold">AG EMPLEO</h2>
            <p className="text-xs opacity-80">Tu experiencia laboral</p>
          </div>
          <button onClick={onClose} className="p-2 bg-white/20 rounded-full">
            <XMarkIcon className="w-6 h-6 text-white" />
          </button>
        </div>

        <div className="flex-grow p-4 space-y-3 overflow-y-auto">
          
          <button 
            onClick={() => goTo('/companies')}
            className="w-full flex items-center gap-4 p-4 bg-blue-50 rounded-xl active:scale-95 transition-all border border-blue-100"
          >
            <BuildingOfficeIcon className="w-6 h-6 text-blue-600" />
            <span className="font-bold text-blue-900 text-sm">EMPRESAS A-Z</span>
          </button>

          <button 
            onClick={() => goTo('/mapa')}
            className="w-full flex items-center gap-4 p-4 bg-green-50 rounded-xl active:scale-95 transition-all border border-green-100"
          >
            <MapIcon className="w-6 h-6 text-green-600" />
            <span className="font-bold text-green-900 text-sm">MAPA DE CHANGAS</span>
          </button>

          <button 
            onClick={() => goTo('/cv')}
            className="w-full flex items-center gap-4 p-4 bg-orange-50 rounded-xl active:scale-95 transition-all border border-orange-100"
          >
            <DocumentTextIcon className="w-6 h-6 text-orange-600" />
            <span className="font-bold text-orange-900 text-sm">GENERADOR DE CV</span>
          </button>

          <hr className="my-4 border-gray-100" />

          <button className="w-full text-left p-3 text-gray-500 font-medium text-sm">
            Ajustes de Perfil
          </button>

          <button className="w-full text-left p-3 text-gray-500 font-medium text-sm">
            Políticas de Privacidad
          </button>
        </div>

        <div className="p-4 border-t border-gray-100">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 p-4 bg-red-500 text-white font-bold rounded-xl active:bg-red-600 transition-colors"
          >
            <ArrowLeftOnRectangleIcon className="w-5 h-5" />
            Cerrar sesión
          </button>
        </div>

      </div>
    </div>
  );
};

export default menu;
