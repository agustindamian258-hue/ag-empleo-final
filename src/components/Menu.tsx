// src/components/Menu.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../app/firebase';
import { signOut } from 'firebase/auth';
import { doc, getDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { useTheme } from '../context/ThemeContext';
import {
  BuildingOfficeIcon, MapIcon, DocumentTextIcon,
  ArrowLeftOnRectangleIcon, XMarkIcon, UserCircleIcon,
  BriefcaseIcon, ShieldCheckIcon, SunIcon, MoonIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline';

interface UserData {
  name?:  string;
  photo?: string;
  title?: string;
  email?: string;
}

interface MenuProps {
  isOpen:  boolean;
  onClose: () => void;
}

export default function Menu({ isOpen, onClose }: MenuProps) {
  const navigate = useNavigate();
  const { darkMode, toggleDarkMode } = useTheme();
  const [userData,      setUserData]      = useState<UserData | null>(null);
  const [errorCarga,    setErrorCarga]    = useState<boolean>(false);
  const [sinMensajes,   setSinMensajes]   = useState(0);

  useEffect(() => {
    if (!isOpen) return;
    const user = auth.currentUser;
    if (!user) return;

    const fetchUserData = async () => {
      try {
        const snap = await getDoc(doc(db, 'users', user.uid));
        if (snap.exists()) setUserData(snap.data() as UserData);
      } catch (e) {
        console.error('[Menu] Error al cargar datos del usuario:', e);
        setErrorCarga(true);
      }
    };
    fetchUserData();

    // Unread messages count
    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', user.uid),
      where('unreadBy', 'array-contains', user.uid),
    );
    const unsub = onSnapshot(q, (snap) => setSinMensajes(snap.size), console.error);
    return () => unsub();
  }, [isOpen]);

  if (!isOpen) return null;

  const user = auth.currentUser;

  const avatarUrl =
    userData?.photo ||
    user?.photoURL ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(userData?.name || user?.displayName || 'U')}&background=3b82f6&color=fff`;

  const handleLogout = async (): Promise<void> => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (e) {
      console.error('[Menu] Error al cerrar sesión:', e);
    }
  };

  const goTo = (path: string): void => {
    navigate(path);
    onClose();
  };

  const herramientas = [
    {
      label: 'Empresas A-Z', sub: 'Directorio de empresas', path: '/companies',
      iconClass: 'text-blue-600', bgClass: 'bg-blue-50 border-blue-100',
      Icon: BuildingOfficeIcon, textClass: 'text-blue-900', subClass: 'text-blue-400',
    },
    {
      label: 'Mapa de Changas', sub: 'Trabajos cerca tuyo', path: '/mapa',
      iconClass: 'text-green-600', bgClass: 'bg-green-50 border-green-100',
      Icon: MapIcon, textClass: 'text-green-900', subClass: 'text-green-400',
    },
    {
      label: 'Generador de CV', sub: 'Crea tu curriculum en PDF', path: '/cv',
      iconClass: 'text-orange-600', bgClass: 'bg-orange-50 border-orange-100',
      Icon: DocumentTextIcon, textClass: 'text-orange-900', subClass: 'text-orange-400',
    },
    {
      label: 'Empleos', sub: 'Ofertas de trabajo', path: '/jobs',
      iconClass: 'text-purple-600', bgClass: 'bg-purple-50 border-purple-100',
      Icon: BriefcaseIcon, textClass: 'text-purple-900', subClass: 'text-purple-400',
    },
  ] as const;

  return (
    <div
      className="fixed inset-0 z-[200] bg-black/50 flex justify-end"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Menú de navegación"
    >
      <div
        className="w-4/5 h-full bg-white dark:bg-gray-900 shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 bg-blue-600 dark:bg-blue-800 text-white">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-xl font-black tracking-tighter">AG EMPLEO</h2>
              <p className="text-xs opacity-75">Tu experiencia laboral</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 bg-white/20 rounded-full active:scale-90 transition-transform"
              aria-label="Cerrar menú"
            >
              <XMarkIcon className="w-5 h-5 text-white" />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <img
              src={avatarUrl}
              alt={`Foto de ${userData?.name || 'usuario'}`}
              className="w-12 h-12 rounded-full border-2 border-white/50 object-cover"
            />
            <div>
              <p className="font-black text-sm">
                {userData?.name || user?.displayName || 'Usuario'}
              </p>
              <p className="text-xs opacity-75">
                {errorCarga ? 'Error al cargar perfil' : userData?.title || 'Completá tu perfil'}
              </p>
            </div>
          </div>
        </div>

        {/* Opciones */}
        <div className="flex-grow p-4 space-y-2 overflow-y-auto">

          {/* Mensajes directos */}
          <button
            onClick={() => goTo('/messages')}
            className="w-full flex items-center justify-between gap-4 p-4 rounded-2xl active:scale-95 transition-all border bg-teal-50 border-teal-100 dark:bg-teal-900/20 dark:border-teal-800 mb-3"
          >
            <div className="flex items-center gap-4">
              <ChatBubbleLeftRightIcon className="w-6 h-6 text-teal-600 dark:text-teal-400" />
              <div className="text-left">
                <p className="font-black text-sm text-teal-900 dark:text-teal-300">Mensajes</p>
                <p className="text-xs text-teal-500">Chat directo con usuarios</p>
              </div>
            </div>
            {sinMensajes > 0 && (
              <span className="w-6 h-6 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shrink-0">
                {sinMensajes > 9 ? '9+' : sinMensajes}
              </span>
            )}
          </button>

          <p className="text-xs font-black text-gray-400 uppercase tracking-widest px-2 mb-3">
            Herramientas
          </p>

          {herramientas.map(({ label, sub, path, iconClass, bgClass, Icon, textClass, subClass }) => (
            <button
              key={path}
              onClick={() => goTo(path)}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl active:scale-95 transition-all border ${bgClass}`}
            >
              <Icon className={`w-6 h-6 ${iconClass}`} />
              <div className="text-left">
                <p className={`font-black text-sm ${textClass}`}>{label}</p>
                <p className={`text-xs ${subClass}`}>{sub}</p>
              </div>
            </button>
          ))}

          {/* Cuenta */}
          <div className="pt-2">
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest px-2 mb-3">
              Cuenta
            </p>

            <button
              onClick={() => goTo('/profile')}
              className="w-full flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl active:scale-95 transition-all border border-gray-100 dark:border-gray-700"
            >
              <UserCircleIcon className="w-6 h-6 text-gray-500" />
              <p className="font-bold text-gray-700 dark:text-gray-200 text-sm">Mi Perfil</p>
            </button>

            <button
              onClick={() => goTo('/privacidad')}
              className="w-full flex items-center gap-4 p-4 mt-2 bg-gray-50 dark:bg-gray-800 rounded-2xl active:scale-95 transition-all border border-gray-100 dark:border-gray-700"
            >
              <ShieldCheckIcon className="w-6 h-6 text-gray-500" />
              <p className="font-bold text-gray-700 dark:text-gray-200 text-sm">Políticas de privacidad</p>
            </button>

            <button
              onClick={toggleDarkMode}
              className="w-full flex items-center justify-between gap-4 p-4 mt-2 bg-gray-50 dark:bg-gray-800 rounded-2xl active:scale-95 transition-all border border-gray-100 dark:border-gray-700"
            >
              <div className="flex items-center gap-4">
                {darkMode
                  ? <SunIcon  className="w-6 h-6 text-yellow-500" />
                  : <MoonIcon className="w-6 h-6 text-gray-500" />
                }
                <p className="font-bold text-gray-700 dark:text-gray-200 text-sm">
                  {darkMode ? 'Modo claro' : 'Modo oscuro'}
                </p>
              </div>
              <div className={`w-12 h-6 rounded-full transition-colors relative ${darkMode ? 'bg-blue-600' : 'bg-gray-300'}`}>
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${darkMode ? 'left-7' : 'left-1'}`} />
              </div>
            </button>
          </div>
        </div>

        {/* Logout */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 p-4 bg-red-500 text-white font-black rounded-2xl active:bg-red-600 transition-colors"
          >
            <ArrowLeftOnRectangleIcon className="w-5 h-5" />
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
      }
