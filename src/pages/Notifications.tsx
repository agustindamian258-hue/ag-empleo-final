// src/pages/Notifications.tsx
import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { db } from '../app/firebase';
import { useTheme } from '../context/ThemeContext';
import Navbar from '../components/Navbar';
import Menu from '../components/Menu';
import {
  BellIcon, HeartIcon, BriefcaseIcon, UserIcon, MegaphoneIcon, CheckIcon,
} from '@heroicons/react/24/outline';

interface Notif {
  id: string;
  tipo: 'like' | 'empleo' | 'seguidor' | 'sistema';
  titulo: string;
  mensaje: string;
  leida: boolean;
  creadoEn: { seconds: number } | null;
}

const ICONO: Record<Notif['tipo'], JSX.Element> = {
  like:      <HeartIcon     className="w-5 h-5 text-rose-500" />,
  empleo:    <BriefcaseIcon className="w-5 h-5 text-[--sc-500]" />,
  seguidor:  <UserIcon      className="w-5 h-5 text-purple-500" />,
  sistema:   <MegaphoneIcon className="w-5 h-5 text-amber-500" />,
};

const BG: Record<Notif['tipo'], string> = {
  like:     'bg-rose-50   dark:bg-rose-950',
  empleo:   'bg-[--sc-100] dark:bg-blue-950',
  seguidor: 'bg-purple-50 dark:bg-purple-950',
  sistema:  'bg-amber-50  dark:bg-amber-950',
};

function timeAgo(seconds: number): string {
  const diff = Math.floor(Date.now() / 1000) - seconds;
  if (diff < 60)   return 'ahora';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400)return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

export default function Notifications() {
  const { user } = useTheme();
  const [notifs,      setNotifs]      = useState<Notif[]>([]);
  const [cargando,    setCargando]    = useState(true);
  const [menuAbierto, setMenuAbierto] = useState(false);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'notifications'),
      where('uid', '==', user.uid),
      orderBy('creadoEn', 'desc'),
    );

    const unsub = onSnapshot(q, (snap) => {
      setNotifs(snap.docs.map(d => ({ id: d.id, ...d.data() } as Notif)));
      setCargando(false);
    }, () => setCargando(false));

    return () => unsub();
  }, [user]);

  const marcarLeida = async (id: string) => {
    await updateDoc(doc(db, 'notifications', id), { leida: true });
  };

  const marcarTodas = async () => {
    await Promise.all(
      notifs.filter(n => !n.leida).map(n => updateDoc(doc(db, 'notifications', n.id), { leida: true }))
    );
  };

  const sinLeer = notifs.filter(n => !n.leida).length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-24">
      <Navbar onMenuClick={() => setMenuAbierto(true)} />
      <Menu isOpen={menuAbierto} onClose={() => setMenuAbierto(false)} />

      <div className="max-w-lg mx-auto px-4 pt-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BellIcon className="w-6 h-6 text-[--sc-500]" />
            <h1 className="font-black text-xl text-gray-900 dark:text-white">Notificaciones</h1>
            {sinLeer > 0 && (
              <span className="bg-[--sc-500] text-white text-xs font-black px-2 py-0.5 rounded-full">
                {sinLeer}
              </span>
            )}
          </div>
          {sinLeer > 0 && (
            <button
              onClick={marcarTodas}
              className="flex items-center gap-1 text-xs font-bold text-[--sc-600] active:opacity-60"
            >
              <CheckIcon className="w-4 h-4" />
              Marcar todas
            </button>
          )}
        </div>

        {/* Lista */}
        {cargando ? (
          <div className="flex justify-center pt-16">
            <div className="w-8 h-8 border-4 border-[--sc-500] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : notifs.length === 0 ? (
          <div className="flex flex-col items-center gap-3 pt-20 text-center">
            <BellIcon className="w-16 h-16 text-gray-200 dark:text-gray-700" />
            <p className="font-black text-gray-400 dark:text-gray-500">Sin notificaciones</p>
            <p className="text-sm text-gray-300 dark:text-gray-600">Acá aparecerán tus alertas de empleos, likes y más</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifs.map(n => (
              <button
                key={n.id}
                onClick={() => marcarLeida(n.id)}
                className={`w-full flex items-start gap-3 p-4 rounded-3xl border transition-all active:scale-[0.98] text-left ${
                  n.leida
                    ? 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 opacity-60'
                    : `${BG[n.tipo]} border-transparent shadow-sm`
                }`}
              >
                <div className="mt-0.5 shrink-0">{ICONO[n.tipo]}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-sm text-gray-900 dark:text-white leading-tight">{n.titulo}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-snug">{n.mensaje}</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="text-[10px] text-gray-300 dark:text-gray-600">
                    {n.creadoEn ? timeAgo(n.creadoEn.seconds) : ''}
                  </span>
                  {!n.leida && (
                    <span className="w-2 h-2 rounded-full bg-[--sc-500]" />
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
    }
