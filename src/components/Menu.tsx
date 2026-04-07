import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../app/firebase';
import { signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import {
  BuildingOfficeIcon,
  MapIcon,
  DocumentTextIcon,
  ArrowLeftOnRectangleIcon,
  XMarkIcon,
  UserCircleIcon,
  BriefcaseIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';

interface MenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const Menu: React.FC<MenuProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      getDoc(doc(db, 'users', user.uid)).then(snap => {
        if (snap.exists()) setUserData(snap.data());
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  const goTo = (path: string) => {
    navigate(path);
    onClose();
  };

  const user = auth.currentUser;

  return (
    <div
      className="fixed inset-0 z-[200] bg-black/50 flex justify-end"
      onClick={onClose}
    >
      <div
        className="w-4/5 h-full bg-white shadow-2xl flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-5 bg-blue-600 text-white">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-xl font-black tracking-tighter">AG EMPLEO</h2>
              <p className="text-xs opacity-75">Tu experiencia laboral</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 bg-white/20 rounded-full active:scale-90 transition-transform"
            >
              <XMarkIcon className="w-5 h-5 text-white" />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <img
              src={userData?.photo || user?.photoURL || 'https://ui-avatars.com/api/?name=U'}
              className="w-12 h-12 rounded-full border-2 border-white/50 object-cover"
            />
            <div>
              <p className="font-black text-sm">{userData?.name || user?.displayName || 'Usuario'}</p>
              <p className="text-xs opacity-75">{userData?.title || 'Completa tu perfil'}</p>
            </div>
          </div>
        </div>

        <div className="flex-grow p-4 space-y-2 overflow-y-auto">
          <p className="text-xs font-black text-gray-400 uppercase tracking-widest px-2 mb-3">Herramientas</p>

          <button
            onClick={() => goTo('/companies')}
            className="w-full flex items-center gap-4 p-4 bg-blue-50 rounded-2xl active:scale-95 transition-all border border-blue-100"
          >
            <BuildingOfficeIcon className="w-6 h-6 text-blue-600" />
            <div className="text-left">
              <p className="font-black text-blue-900 text-sm">Empresas A-Z</p>
              <p className="text-xs text-blue-400">Directorio de empresas</p>
            </div>
          </button>

          <button
            onClick={() => goTo('/mapa')}
            className="w-full flex items-center gap-4 p-4 bg-green-50 rounded-2xl active:scale-95 transition-all border border-green-100"
          >
            <MapIcon className="w-6 h-6 text-green-600" />
            <div className="text-left">
              <p className="font-black text-green-900 text-sm">Mapa de Changas</p>
              <p className="text-xs text-green-400">Trabajos cerca tuyo</p>
            </div>
          </button>

          <button
            onClick={() => goTo('/cv')}
            className="w-full flex items-center gap-4 p-4 bg-orange-50 rounded-2xl active:scale-95 transition-all border border-orange-100"
          >
            <DocumentTextIcon className="w-6 h-6 text-orange-600" />
            <div className="text-left">
              <p className="font-black text-orange-900 text-sm">Generador de CV</p>
              <p className="text-xs text-orange-400">Crea tu curriculum en PDF</p>
            </div>
          </button>

          <button
            onClick={() => goTo('/jobs')}
            className="w-full flex items-center gap-4 p-4 bg-purple-50 rounded-2xl active:scale-95 transition-all border border-purple-100"
          >
            <BriefcaseIcon className="w-6 h-6 text-purple-600" />
            <div className="text-left">
              <p className="font-black text-purple-900 text-sm">Empleos</p>
              <p className="text-xs text-purple-400">Ofertas de trabajo</p>
            </div>
          </button>

          <div className="pt-2">
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest px-2 mb-3">Cuenta</p>

            <button
              onClick={() => goTo('/profile')}
              className="w-full flex items-center gap-4 p-4 bg-gray-50 rounded-2xl active:scale-95 transition-all border border-gray-100"
            >
              <UserCircleIcon className="w-6 h-6 text-gray-500" />
              <p className="font-bold text-gray-700 text-sm">Mi Perfil</p>
            </button>

            <button
              onClick={() => goTo('/privacidad')}
              className="w-full flex items-center gap-4 p-4 mt-2 bg-gray-50 rounded-2xl active:scale-95 transition-all border border-gray-100"
            >
              <ShieldCheckIcon className="w-6 h-6 text-gray-500" />
              <p className="font-bold text-gray-700 text-sm">Politicas de privacidad</p>
            </button>
          </div>
        </div>

        <div className="p-4 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 p-4 bg-red-500 text-white font-black rounded-2xl active:bg-red-600 transition-colors"
          >
            <ArrowLeftOnRectangleIcon className="w-5 h-5" />
            Cerrar sesion
          </button>
        </div>
      </div>
    </div>
  );
};

export default Menu;
