// src/pages/Notifications.tsx
import { useEffect, useState } from 'react';
import {
  collection, query, where, orderBy, onSnapshot,
  updateDoc, doc, deleteDoc, writeBatch,
} from 'firebase/firestore';
import { db } from '../app/firebase';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Menu from '../components/Menu';
import {
  BellIcon, HeartIcon, BriefcaseIcon, UserIcon,
  MegaphoneIcon, CheckIcon, TrashIcon, ChatBubbleLeftIcon,
  StarIcon,
} from '@heroicons/react/24/outline';

interface Notif {
  id:       string;
  tipo:     'like' | 'empleo' | 'seguidor' | 'sistema' | 'comentario' | 'reaccion' | 'mensaje';
  titulo:   string;
  mensaje:  string;
  leida:    boolean;
  creadoEn: { toDate: () => Date; seconds: number } | null;
}

const ICONO: Record<string, JSX.Element> = {
  like:      <HeartIcon            className="w-5 h-5 text-rose-500" />,
  empleo:    <BriefcaseIcon        className="w-5 h-5 text-blue-500" />,
  seguidor:  <UserIcon             className="w-5 h-5 text-purple-500" />,
  sistema:   <MegaphoneIcon        className="w-5 h-5 text-amber-500" />,
  comentario:<ChatBubbleLeftIcon   className="w-5 h-5 text-green-500" />,
  reaccion:  <StarIcon             className="w-5 h-5 text-yellow-500" />,
  mensaje:   <ChatBubbleLeftIcon   className="w-5 h-5 text-blue-400" />,
};

const BG: Record<string, string> = {
  like:      'bg-rose-50   dark:bg-rose-950/40',
  empleo:    'bg-blue-50   dark:bg-blue-950/40',
  seguidor:  'bg-purple-50 dark:bg-purple-950/40',
  sistema:   'bg-amber-50  dark:bg-amber-950/40',
  comentario:'bg-green-50  dark:bg-green-950/40',
  reaccion:  'bg-yellow-50 dark:bg-yellow-950/40',
  mensaje:   'bg-blue-50   dark:bg-blue-950/40',
};

function timeAgo(n: Notif): string {
  if (!n.creadoEn) return '';
  let seconds: number;
  try {
    seconds = typeof n.creadoEn.toDate === 'function'
      ? Math.floor(n.creadoEn.toDate().getTime() / 1000)
      : n.creadoEn.seconds;
  } catch { return ''; }
  const diff = Math.floor(Date.now() / 1000) - seconds;
  if (diff < 60)    return 'ahora';
  if (diff < 3600)  return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

export default function Notifications() {
  const { user }   = useTheme();
  const navigate   = useNavigate();
  const [notifs,      setNotifs]      = useState<Notif[]>([]);
  const [cargando,    setCargando]    = useState(true);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [seleccion,   setSeleccion]   = useState<Set<string>>(new Set());
  const [modoSelec,   setModoSelec]   = useState(false);

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

  async function marcarLeida(id: string) {
    await updateDoc(doc(db, 'notifications', id), { leida: true });
  }

  async function marcarTodas() {
    const batch = writeBatch(db);
    notifs.filter(n => !n.leida).forEach(n => {
      batch.update(doc(db, 'notifications', n.id), { leida: true });
    });
    await batch.commit();
  }

  async function eliminarSeleccion() {
    const batch = writeBatch(db);
    seleccion.forEach(id => batch.delete(doc(db, 'notifications', id)));
    await batch.commit();
    setSeleccion(new Set());
    setModoSelec(false);
  }

  async function eliminarLeidas() {
    const batch = writeBatch(db);
    notifs.filter(n => n.leida).forEach(n => batch.delete(doc(db, 'notifications', n.id)));
    await batch.commit();
  }

  function toggleSeleccion(id: string) {
    setSeleccion(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function handleTap(n: Notif) {
    if (modoSelec) { toggleSeleccion(n.id); return; }
    if (!n.leida) marcarLeida(n.id);
    if (n.tipo === 'mensaje') navigate('/messages');
  }

  const sinLeer  = notifs.filter(n => !n.leida).length;
  const conLeidas = notifs.filter(n => n.leida).length;

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
          <div className="flex items-center gap-2">
            {sinLeer > 0 && !modoSelec && (
              <button onClick={marcarTodas}
                className="flex items-center gap-1 text-xs font-bold text-[--sc-600] active:opacity-60">
                <CheckIcon className="w-4 h-4" />
                Leer todas
              </button>
            )}
            {conLeidas > 0 && !modoSelec && (
              <button onClick={eliminarLeidas}
                className="flex items-center gap-1 text-xs font-bold text-gray-400 active:opacity-60">
                <TrashIcon className="w-4 h-4" />
                Limpiar
              </button>
            )}
            {notifs.length > 0 && (
              <button onClick={() => { setModoSelec(p => !p); setSeleccion(new Set()); }}
                className="text-xs font-bold text-gray-400 active:opacity-60 px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800">
                {modoSelec ? 'Cancelar' : 'Seleccionar'}
              </button>
            )}
          </div>
        </div>

        {/* Barra acción selección */}
        {modoSelec && seleccion.size > 0 && (
          <div className="flex items-center justify-between bg-red-50 dark:bg-red-950/40 rounded-2xl px-4 py-3 mb-3">
            <span className="text-sm font-black text-red-600">{seleccion.size} seleccionada{seleccion.size !== 1 ? 's' : ''}</span>
            <button onClick={eliminarSeleccion}
              className="flex items-center gap-1 text-sm font-black text-red-600 active:scale-95">
              <TrashIcon className="w-4 h-4" /> Eliminar
            </button>
          </div>
        )}

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
            {notifs.map(n => {
              const seleccionada = seleccion.has(n.id);
              const icono = ICONO[n.tipo] ?? ICONO.sistema;
              const bg    = BG[n.tipo]    ?? BG.sistema;
              return (
                <button
                  key={n.id}
                  onClick={() => handleTap(n)}
                  onLongPress={() => { setModoSelec(true); toggleSeleccion(n.id); }}
                  className={`w-full flex items-start gap-3 p-4 rounded-3xl border transition-all active:scale-[0.98] text-left ${
                    seleccionada
                      ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700'
                      : n.leida
                        ? 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 opacity-60'
                        : `${bg} border-transparent shadow-sm`
                  }`}
                >
                  {modoSelec && (
                    <div className={`w-5 h-5 rounded-full border-2 shrink-0 mt-0.5 flex items-center justify-center ${
                      seleccionada ? 'bg-blue-500 border-blue-500' : 'border-gray-300 dark:border-gray-600'
                    }`}>
                      {seleccionada && <CheckIcon className="w-3 h-3 text-white" />}
                    </div>
                  )}
                  <div className="mt-0.5 shrink-0">{icono}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-sm text-gray-900 dark:text-white leading-tight">{n.titulo}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-snug">{n.mensaje}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-[10px] text-gray-300 dark:text-gray-600">{timeAgo(n)}</span>
                    {!n.leida && <span className="w-2 h-2 rounded-full bg-[--sc-500]" />}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
