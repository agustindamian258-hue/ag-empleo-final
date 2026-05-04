// src/components/Menu.tsx
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { auth, db } from '../app/firebase';
import { signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useTheme } from '../context/ThemeContext';
import {
  BuildingOfficeIcon, MapIcon, DocumentTextIcon,
  ArrowLeftOnRectangleIcon, XMarkIcon, UserCircleIcon,
  BriefcaseIcon, ShieldCheckIcon, SunIcon, MoonIcon,
  FilmIcon, MagnifyingGlassIcon,
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

const RUTAS_SOCIAL = ['/social', '/reels', '/search'];

export default function Menu({ isOpen, onClose }: MenuProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { darkMode, toggleDarkMode } = useTheme();

  const [userData,   setUserData]   = useState<UserData | null>(null);
  const [errorCarga, setErrorCarga] = useState(false);

  const isSocial = RUTAS_SOCIAL.some((r) => location.pathname.startsWith(r));

  const headerBg    = isSocial ? 'bg-purple-700 dark:bg-purple-900' : 'bg-blue-600 dark:bg-blue-800';
  const accentColor = isSocial ? 'text-purple-600 dark:text-purple-400' : 'text-blue-600 dark:text-blue-400';
  const zonaNombre  = isSocial ? 'AG SOCIAL' : 'AG EMPLEO';
  const zonaSubtitle = isSocial ? 'Tu red profesional social' : 'Tu experiencia laboral';

  useEffect(() => {
    if (!isOpen) return;
    const user = auth.currentUser;
    if (!user) return;
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'users', user.uid));
        if (snap.exists()) setUserData(snap.data() as UserData);
      } catch (e) {
        console.error('[Menu] Error al cargar datos del usuario:', e);
        setErrorCarga(true);
      }
    })();
  }, [isOpen]);

  if (!isOpen) return null;

  const user = auth.currentUser;

  const avatarUrl =
    userData?.photo ||
    user?.photoURL  ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      userData?.name || user?.displayName || 'U',
    )}&background=${isSocial ? '7c3aed' : '3b82f6'}&color=fff`;

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (e) {
      console.error('[Menu] Error al cerrar sesión:', e);
    }
  };

  const goTo = (path: string) => {
    navigate(path, { state: { zona: isSocial ? 'social' : 'empleo' } });
    onClose();
  };

  const herramientasEmpleo = [
    {
      label: 'Empresas A-Z',   sub: 'Directorio de empresas',    path: '/companies',
      iconClass: 'text-blue-600',   bgClass: 'bg-blue-50 border-blue-100 dark:bg-blue-900/20 dark:border-blue-800',
      Icon: BuildingOfficeIcon, textClass: 'text-blue-900 dark:text-blue-200',   subClass: 'text-blue-400',
    },
    {
      label: 'Mapa de Changas', sub: 'Trabajos cerca tuyo',       path: '/mapa',
      iconClass: 'text-green-600',  bgClass: 'bg-green-50 border-green-100 dark:bg-green-900/20 dark:border-green-800',
      Icon: MapIcon,            textClass: 'text-green-900 dark:text-green-200',  subClass: 'text-green-400',
    },
    {
      label: 'Generador de CV', sub: 'Creá tu curriculum en PDF', path: '/cv',
      iconClass: 'text-orange-600', bgClass: 'bg-orange-50 border-orange-100 dark:bg-orange-900/20 dark:border-orange-800',
      Icon: DocumentTextIcon,   textClass: 'text-orange-900 dark:text-orange-200', subClass: 'text-orange-400',
    },
    {
      label: 'Empleos',         sub: 'Ofertas de trabajo',         path: '/jobs',
      iconClass: 'text-purple-600', bgClass: 'bg-purple-50 border-purple-100 dark:bg-purple-900/20 dark:border-purple-800',
      Icon: BriefcaseIcon,      textClass: 'text-purple-900 dark:text-purple-200', subClass: 'text-purple-400',
    },
  ] as const;

  const herramientasSocial = [
    {
      label: 'Reels',           sub: 'Videos cortos',     path: '/reels',
      iconClass: 'text-pink-600',   bgClass: 'bg-pink-50 border-pink-100 dark:bg-pink-900/20 dark:border-pink-800',
      Icon: FilmIcon,           textClass: 'text-pink-900 dark:text-pink-200',   subClass: 'text-pink-400',
    },
    {
      label: 'Buscar personas', sub: 'Encontrá usuarios', path: '/search',
      iconClass: 'text-violet-600', bgClass: 'bg-violet-50 border-violet-100 dark:bg-violet-900/20 dark:border-violet-800',
      Icon: MagnifyingGlassIcon, textClass: 'text-violet-900 dark:text-violet-200', subClass: 'text-violet-400',
    },
  ] as const;

  const herramientas   = isSocial ? herramientasSocial : herramientasEmpleo;
  const perfilLabel    = isSocial ? 'Mi Perfil Social'        : 'Mi Perfil de Empleo';
  const perfilSubtitle = isSocial ? 'Bio, posts y seguidores' : 'CV, cargo y disponibilidad';

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
        <div className={`p-5 ${headerBg} text-white`}>
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-xl font-black tracking-tighter">{zonaNombre}</h2>
              <p className="text-xs opacity-75">{zonaSubtitle}</p>
            </div>
            <button onClick={onClose} className="p-2 bg-white/20 rounded-full active:scale-90 transition-transform" aria-label="Cerrar menú">
              <XMarkIcon className="w-5 h-5 text-white" />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <img src={avatarUrl} alt={`Foto de ${userData?.name || 'usuario'}`} className="w-12 h-12 rounded-full border-2 border-white/50 object-cover" />
            <div>
              <p className="font-black text-sm">{userData?.name || user?.displayName || 'Usuario'}</p>
              <p className="text-xs opacity-75">{errorCarga ? 'Error al cargar perfil' : userData?.title || 'Completá tu perfil'}</p>
              <span className="inline-block mt-1 text-[9px] font-black uppercase tracking-widest bg-white/20 rounded-full px-2 py-0.5">
                {isSocial ? '🌐 Zona Social' : '💼 Zona Empleo'}
              </span>
            </div>
          </div>
        </div>

        {/* Opciones */}
        <div className="flex-grow p-4 space-y-2 overflow-y-auto">
          <p className="text-xs font-black text-gray-400 uppercase tracking-widest px-2 pb-1">
            {isSocial ? 'Explorar' : 'Herramientas'}
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
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest px-2 mb-3">Cuenta</p>

            <button
              onClick={() => goTo('/profile')}
              className="w-full flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl active:scale-95 transition-all border border-gray-100 dark:border-gray-700"
            >
              <UserCircleIcon className={`w-6 h-6 ${accentColor}`} />
              <div className="text-left">
                <p className="font-bold text-gray-700 dark:text-gray-200 text-sm">{perfilLabel}</p>
                <p className="text-xs text-gray-400">{perfilSubtitle}</p>
              </div>
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
