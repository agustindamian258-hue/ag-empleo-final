// src/pages/SearchUsers.tsx
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../app/firebase';
import {
  collection, getDocs, limit,
  doc, setDoc, deleteDoc, serverTimestamp, getDoc, query,
} from 'firebase/firestore';
import {
  MagnifyingGlassIcon, ArrowLeftIcon,
  UserIcon, BuildingOfficeIcon,
} from '@heroicons/react/24/outline';
import Navbar from '../components/Navbar';
import Menu  from '../components/Menu';

const ZONA        = 'social' as const;
const MAX_RESULTS = 100;

interface UsuarioBuscado {
  uid:          string;
  name:         string;
  nameLower?:   string;
  photo:        string;
  title?:       string;
  ciudad?:      string;
  accountType?: string;
  nombreEmpresa?: string;
  rubro?:       string;
}

type Filtro = 'todos' | 'personas' | 'empresas';

export default function SearchUsers() {
  const navigate = useNavigate();
  const me       = auth.currentUser;

  const [busqueda,   setBusqueda]   = useState('');
  const [resultados, setResultados] = useState<UsuarioBuscado[]>([]);
  const [cargando,   setCargando]   = useState(false);
  const [siguiendo,  setSiguiendo]  = useState<Record<string, boolean>>({});
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [filtro,     setFiltro]     = useState<Filtro>('todos');

  const poolRef     = useRef<UsuarioBuscado[]>([]);
  const poolCargado = useRef(false);

  function followId(targetUid: string): string {
    return `${me!.uid}_${targetUid}_${ZONA}`;
  }

  async function cargarPool() {
    if (poolCargado.current) return;
    const snap = await getDocs(query(collection(db, 'users'), limit(MAX_RESULTS)));
    poolRef.current = snap.docs
      .map((d) => ({ uid: d.id, ...d.data() } as UsuarioBuscado))
      .filter((u) => u.uid !== me?.uid);
    poolCargado.current = true;
  }

  async function buscar(termino: string) {
    setBusqueda(termino);
    if (termino.trim().length < 2) { setResultados([]); return; }
    setCargando(true);
    try {
      await cargarPool();

      const terminoLower = termino.toLowerCase();
      const users = poolRef.current.filter((u) => {
        const nombreLower   = (u.nameLower ?? u.name ?? '').toLowerCase();
        const empresaLower  = (u.nombreEmpresa ?? '').toLowerCase();
        const rubroLower    = (u.rubro ?? '').toLowerCase();
        const ciudadLower   = (u.ciudad ?? '').toLowerCase();
        return (
          nombreLower.includes(terminoLower)  ||
          empresaLower.includes(terminoLower) ||
          rubroLower.includes(terminoLower)   ||
          ciudadLower.includes(terminoLower)
        );
      });

      setResultados(users);

      if (me && users.length > 0) {
        const followStates: Record<string, boolean> = {};
        await Promise.all(users.map(async (u) => {
          if (u.accountType !== 'empresa') {
            const snap = await getDoc(doc(db, 'follows', followId(u.uid)));
            followStates[u.uid] = snap.exists();
          }
        }));
        setSiguiendo(followStates);
      }
    } catch (e) { console.error('[SearchUsers.buscar]', e); }
    finally { setCargando(false); }
  }

  async function handleFollow(uid: string) {
    if (!me) return;
    const followRef = doc(db, 'follows', followId(uid));
    if (siguiendo[uid]) {
      await deleteDoc(followRef);
      setSiguiendo((p) => ({ ...p, [uid]: false }));
    } else {
      await setDoc(followRef, {
        followerId:  me.uid,
        followingId: uid,
        zona:        ZONA,
        createdAt:   serverTimestamp(),
      });
      setSiguiendo((p) => ({ ...p, [uid]: true }));
    }
  }

  const resultadosFiltrados = resultados.filter((u) => {
    if (filtro === 'personas') return u.accountType !== 'empresa';
    if (filtro === 'empresas') return u.accountType === 'empresa';
    return true;
  });

  const cantPersonas = resultados.filter((u) => u.accountType !== 'empresa').length;
  const cantEmpresas = resultados.filter((u) => u.accountType === 'empresa').length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-24">
      <header className="sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-4 py-4 space-y-3 shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)}
            className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 active:scale-90 transition-transform">
            <ArrowLeftIcon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </button>
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              autoFocus
              type="text"
              value={busqueda}
              onChange={(e) => buscar(e.target.value)}
              placeholder="Buscar personas, empresas, rubros..."
              className="w-full pl-9 pr-4 py-2.5 bg-gray-100 dark:bg-gray-800 rounded-2xl text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none"
            />
          </div>
        </div>

        {/* Filtros */}
        {resultados.length > 0 && (
          <div className="flex gap-2">
            {([
              { id: 'todos',    label: `Todos (${resultados.length})` },
              { id: 'personas', label: `👤 Personas (${cantPersonas})` },
              { id: 'empresas', label: `🏢 Empresas (${cantEmpresas})` },
            ] as { id: Filtro; label: string }[]).map((f) => (
              <button key={f.id}
                onClick={() => setFiltro(f.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-black transition-all active:scale-95 ${
                  filtro === f.id
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                }`}>
                {f.label}
              </button>
            ))}
          </div>
        )}
      </header>

      <div className="px-4 pt-4 space-y-3">
        {cargando && (
          <div className="flex justify-center py-10">
            <div className="w-7 h-7 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!cargando && busqueda.length >= 2 && resultadosFiltrados.length === 0 && (
          <div className="text-center py-16 text-gray-400 dark:text-gray-600">
            <p className="text-4xl mb-2">🔍</p>
            <p className="font-bold">Sin resultados para "{busqueda}"</p>
          </div>
        )}

        {!cargando && busqueda.length < 2 && (
          <div className="text-center py-16 text-gray-400 dark:text-gray-600">
            <p className="text-4xl mb-2">👥</p>
            <p className="font-bold">Buscá personas o empresas</p>
            <p className="text-sm mt-1">Por nombre, rubro o ciudad</p>
          </div>
        )}

        {resultadosFiltrados.map((u) => {
          const esEmpresa    = u.accountType === 'empresa';
          const nombreMostrar = esEmpresa ? (u.nombreEmpresa || u.name) : u.name;
          const avatar = u.photo ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(nombreMostrar || 'U')}&background=${esEmpresa ? '2563eb' : '7c3aed'}&color=fff`;

          return (
            <div key={u.uid}
              className="flex items-center justify-between bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 shadow-sm">
              <button
                onClick={() => navigate(esEmpresa ? `/empresa/${u.uid}` : `/user/${u.uid}`)}
                className="flex items-center gap-3 flex-1 min-w-0 text-left active:opacity-70 transition-opacity"
              >
                <div className="relative shrink-0">
                  <img src={avatar} alt={nombreMostrar}
                    className={`w-12 h-12 object-cover ${esEmpresa ? 'rounded-xl' : 'rounded-full'}`} />
                  <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center ${
                    esEmpresa ? 'bg-blue-500' : 'bg-purple-500'
                  }`}>
                    {esEmpresa
                      ? <BuildingOfficeIcon className="w-3 h-3 text-white" />
                      : <UserIcon className="w-3 h-3 text-white" />
                    }
                  </div>
                </div>
                <div className="min-w-0">
                  <p className="font-black text-gray-900 dark:text-white text-sm truncate">{nombreMostrar}</p>
                  {esEmpresa ? (
                    <>
                      {u.rubro  && <p className="text-xs text-blue-600 dark:text-blue-400 truncate">{u.rubro}</p>}
                      {u.ciudad && <p className="text-xs text-gray-400 truncate">📍 {u.ciudad}</p>}
                    </>
                  ) : (
                    <>
                      {u.title  && <p className="text-xs text-purple-600 dark:text-purple-400 truncate">{u.title}</p>}
                      {u.ciudad && <p className="text-xs text-gray-400 truncate">📍 {u.ciudad}</p>}
                    </>
                  )}
                </div>
              </button>

              {!esEmpresa && (
                <button
                  onClick={() => handleFollow(u.uid)}
                  className={`ml-3 px-4 py-2 rounded-full text-xs font-black transition-all active:scale-95 shrink-0 ${
                    siguiendo[u.uid]
                      ? 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600'
                      : 'bg-purple-600 text-white'
                  }`}>
                  {siguiendo[u.uid] ? 'Siguiendo' : 'Seguir'}
                </button>
              )}

              {esEmpresa && (
                <button
                  onClick={() => navigate(`/empresa/${u.uid}`)}
                  className="ml-3 px-4 py-2 rounded-full text-xs font-black bg-blue-500 text-white active:scale-95 transition-all shrink-0">
                  Ver ofertas
                </button>
              )}
            </div>
          );
        })}
      </div>

      <Navbar onMenuClick={() => setIsMenuOpen(true)} />
      <Menu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </div>
  );
}
