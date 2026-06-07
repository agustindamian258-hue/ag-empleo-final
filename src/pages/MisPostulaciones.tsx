// src/pages/MisPostulaciones.tsx
import { useState, useEffect } from 'react';
import { db, auth } from '../app/firebase';
import {
  collection, query, where, onSnapshot,
  getDocs, orderBy,
} from 'firebase/firestore';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeftIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import Navbar from '../components/Navbar';
import Menu from '../components/Menu';

interface Empleo {
  id:         string;
  titulo:     string;
  empresa:    string;
  requisitos?: { id: string; pregunta: string }[];
}

interface Postulacion {
  id:         string;
  uid:        string;
  nombre:     string;
  foto:       string;
  ciudad:     string;
  cargo:      string;
  nivel:      string;
  respuestas: Record<string, boolean>;
  grupo:      'apto' | 'parcial' | 'no_apto';
  createdAt:  { toDate: () => Date } | null;
}

const GRUPO_CONFIG = {
  apto:     { label: '🟢 Aptos',         color: 'bg-green-50  dark:bg-green-900/20  border-green-200  dark:border-green-800',  badge: 'bg-green-100  text-green-700  dark:bg-green-900/30  dark:text-green-300'  },
  parcial:  { label: '🟡 Parciales',     color: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800', badge: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' },
  no_apto:  { label: '🔴 No aptos',      color: 'bg-red-50    dark:bg-red-900/20    border-red-200    dark:border-red-800',    badge: 'bg-red-100    text-red-700    dark:bg-red-900/30    dark:text-red-300'    },
};

export default function MisPostulaciones() {
  const navigate        = useNavigate();
  const [searchParams]  = useSearchParams();
  const empleoIdParam   = searchParams.get('empleoId');

  const [empleos,       setEmpleos]       = useState<Empleo[]>([]);
  const [empleoActivo,  setEmpleoActivo]  = useState<Empleo | null>(null);
  const [postulaciones, setPostulaciones] = useState<Postulacion[]>([]);
  const [cargando,      setCargando]      = useState(true);
  const [isMenuOpen,    setIsMenuOpen]    = useState(false);
  const [grupoActivo,   setGrupoActivo]   = useState<'apto' | 'parcial' | 'no_apto'>('apto');
  const [detalle,       setDetalle]       = useState<Postulacion | null>(null);

  const user = auth.currentUser;

  // Cargar empleos de la empresa
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'empleos'),
      where('uid', '==', user.uid),
      orderBy('createdAt', 'desc'),
    );
    const unsub = onSnapshot(q, (snap) => {
      const lista = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Empleo));
      setEmpleos(lista);
      setCargando(false);
      if (empleoIdParam) {
        const encontrado = lista.find((e) => e.id === empleoIdParam);
        if (encontrado) setEmpleoActivo(encontrado);
      } else if (lista.length > 0 && !empleoActivo) {
        setEmpleoActivo(lista[0]);
      }
    });
    return () => unsub();
  }, [user]);

  // Cargar postulaciones del empleo activo
  useEffect(() => {
    if (!empleoActivo) return;
    const q = query(
      collection(db, 'empleos', empleoActivo.id, 'postulaciones'),
      orderBy('createdAt', 'desc'),
    );
    const unsub = onSnapshot(q, (snap) => {
      setPostulaciones(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Postulacion)));
    });
    return () => unsub();
  }, [empleoActivo]);

  const porGrupo = {
    apto:    postulaciones.filter((p) => p.grupo === 'apto'),
    parcial: postulaciones.filter((p) => p.grupo === 'parcial'),
    no_apto: postulaciones.filter((p) => p.grupo === 'no_apto'),
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-24">
      <header className="sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-4 py-4 shadow-sm">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => navigate(-1)}
            className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 active:scale-90">
            <ArrowLeftIcon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </button>
          <div>
            <h1 className="font-black text-gray-900 dark:text-white text-lg">Panel de candidatos</h1>
            <p className="text-xs text-gray-400">{postulaciones.length} postulación{postulaciones.length !== 1 ? 'es' : ''} en total</p>
          </div>
        </div>

        {/* Selector de empleo */}
        {empleos.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {empleos.map((e) => (
              <button key={e.id}
                onClick={() => { setEmpleoActivo(e); setGrupoActivo('apto'); }}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-black transition-all active:scale-95 ${
                  empleoActivo?.id === e.id
                    ? 'bg-[var(--sc-500)] text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                }`}>
                {e.titulo}
              </button>
            ))}
          </div>
        )}
      </header>

      {cargando ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-[var(--sc-500)] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : empleos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 px-8 text-center">
          <p className="text-4xl mb-3">💼</p>
          <p className="font-black text-gray-500 dark:text-gray-400 text-lg">Sin empleos publicados</p>
          <p className="text-sm text-gray-400 mt-1">Publicá una oferta para empezar a recibir candidatos.</p>
          <button onClick={() => navigate('/jobs')}
            className="mt-4 px-5 py-3 rounded-2xl bg-[var(--sc-500)] text-white font-black text-sm active:scale-95">
            Ir a Empleos
          </button>
        </div>
      ) : (
        <div className="px-4 pt-4">

          {empleoActivo && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 mb-4">
              <p className="font-black text-gray-800 dark:text-white">{empleoActivo.titulo}</p>
              <p className="text-xs text-gray-400 mt-0.5">{empleoActivo.empresa}</p>
              {(empleoActivo.requisitos?.length ?? 0) > 0 && (
                <div className="mt-2 space-y-1">
                  <p className="text-xs font-bold text-gray-500 dark:text-gray-400">Requisitos:</p>
                  {empleoActivo.requisitos!.map((r) => (
                    <p key={r.id} className="text-xs text-gray-400">• {r.pregunta}</p>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tabs grupos */}
          <div className="flex gap-2 mb-4">
            {(Object.keys(GRUPO_CONFIG) as Array<keyof typeof GRUPO_CONFIG>).map((g) => (
              <button key={g}
                onClick={() => setGrupoActivo(g)}
                className={`flex-1 py-2 rounded-2xl text-xs font-black transition-all active:scale-95 ${
                  grupoActivo === g
                    ? 'bg-[var(--sc-500)] text-white shadow'
                    : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-500'
                }`}>
                {GRUPO_CONFIG[g].label}
                <span className="ml-1 opacity-70">({porGrupo[g].length})</span>
              </button>
            ))}
          </div>

          {/* Lista candidatos */}
          {porGrupo[grupoActivo].length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p className="text-3xl mb-2">
                {grupoActivo === 'apto' ? '🟢' : grupoActivo === 'parcial' ? '🟡' : '🔴'}
              </p>
              <p className="font-bold text-sm">Sin candidatos en este grupo</p>
            </div>
          ) : (
            <div className="space-y-3">
              {porGrupo[grupoActivo].map((p) => {
                const avatar = p.foto || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.nombre)}&background=2563eb&color=fff`;
                return (
                  <button key={p.id}
                    onClick={() => setDetalle(p)}
                    className="w-full bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 flex items-center gap-3 text-left active:scale-[0.98] transition-all">
                    <img src={avatar} alt={p.nombre} className="w-12 h-12 rounded-full object-cover shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-gray-800 dark:text-white text-sm">{p.nombre}</p>
                      {p.cargo && <p className="text-xs text-gray-400 truncate">{p.cargo}</p>}
                      {p.ciudad && <p className="text-xs text-gray-300 dark:text-gray-600">{p.ciudad}</p>}
                    </div>
                    <span className={`text-[10px] font-black px-2 py-1 rounded-full shrink-0 ${GRUPO_CONFIG[p.grupo].badge}`}>
                      {p.grupo === 'apto' ? 'APTO' : p.grupo === 'parcial' ? 'PARCIAL' : 'NO APTO'}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal detalle candidato */}
      {detalle && empleoActivo && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && setDetalle(null)}>
          <div className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-t-3xl px-5 pt-5 pb-10 animate-slide-up overflow-y-auto"
            style={{ maxHeight: '80vh' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-gray-800 dark:text-white">Detalle del candidato</h3>
              <button onClick={() => setDetalle(null)}
                className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <ArrowLeftIcon className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <div className="flex items-center gap-4 mb-4">
              <img
                src={detalle.foto || `https://ui-avatars.com/api/?name=${encodeURIComponent(detalle.nombre)}&background=2563eb&color=fff`}
                alt={detalle.nombre}
                className="w-16 h-16 rounded-full object-cover"
              />
              <div>
                <p className="font-black text-gray-900 dark:text-white">{detalle.nombre}</p>
                {detalle.cargo  && <p className="text-sm text-gray-500">{detalle.cargo}</p>}
                {detalle.ciudad && <p className="text-xs text-gray-400">{detalle.ciudad}</p>}
                {detalle.nivel  && <p className="text-xs text-gray-400">{detalle.nivel}</p>}
              </div>
            </div>

            <span className={`inline-block text-xs font-black px-3 py-1.5 rounded-full mb-4 ${GRUPO_CONFIG[detalle.grupo].badge}`}>
              {detalle.grupo === 'apto' ? '🟢 APTO' : detalle.grupo === 'parcial' ? '🟡 PARCIAL' : '🔴 NO APTO'}
            </span>

            {(empleoActivo.requisitos?.length ?? 0) > 0 && (
              <div className="space-y-2 mb-4">
                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Respuestas al test</p>
                {empleoActivo.requisitos!.map((r) => {
                  const resp = detalle.respuestas[r.id];
                  return (
                    <div key={r.id} className={`flex items-center justify-between p-3 rounded-2xl border ${
                      resp === true
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                        : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                    }`}>
                      <p className="text-xs text-gray-700 dark:text-gray-300 flex-1">{r.pregunta}</p>
                      <span className={`text-sm font-black ml-2 ${resp === true ? 'text-green-600' : 'text-red-500'}`}>
                        {resp === true ? '✅ Sí' : '❌ No'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            <button
              onClick={() => navigate(`/user/${detalle.uid}`)}
              className="w-full py-3 rounded-2xl bg-[var(--sc-500)] text-white font-black text-sm active:scale-95 flex items-center justify-center gap-2">
              <UserCircleIcon className="w-5 h-5" />
              Ver perfil completo
            </button>
          </div>
        </div>
      )}

      <Navbar onMenuClick={() => setIsMenuOpen(true)} />
      <Menu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </div>
  );
              }
