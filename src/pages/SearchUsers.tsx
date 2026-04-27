// src/pages/SearchUsers.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../app/firebase';
import {
  collection, query, where, getDocs,
  doc, setDoc, deleteDoc, serverTimestamp, getDoc,
} from 'firebase/firestore';
import {
  MagnifyingGlassIcon, ArrowLeftIcon,
} from '@heroicons/react/24/outline';
import Navbar from '../components/Navbar';
import Menu  from '../components/Menu';

interface UsuarioBuscado {
  uid:    string;
  name:   string;
  photo:  string;
  title?: string;
  ciudad?: string;
}

export default function SearchUsers() {
  const navigate    = useNavigate();
  const me          = auth.currentUser;

  const [busqueda,   setBusqueda]   = useState('');
  const [resultados, setResultados] = useState<UsuarioBuscado[]>([]);
  const [cargando,   setCargando]   = useState(false);
  const [siguiendo,  setSiguiendo]  = useState<Record<string, boolean>>({});
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  async function buscar(termino: string) {
    setBusqueda(termino);
    if (termino.trim().length < 2) { setResultados([]); return; }
    setCargando(true);
    try {
      const q = query(
        collection(db, 'users'),
        where('name', '>=', termino),
        where('name', '<=', termino + '\uf8ff')
      );
      const snap = await getDocs(q);
      const users = snap.docs
        .map((d) => ({ uid: d.id, ...d.data() } as UsuarioBuscado))
        .filter((u) => u.uid !== me?.uid);
      setResultados(users);

      // Verificar cuáles sigo
      if (me) {
        const followStates: Record<string, boolean> = {};
        await Promise.all(users.map(async (u) => {
          const ref  = doc(db, 'follows', `${me.uid}_${u.uid}`);
          const snap = await getDoc(ref);
          followStates[u.uid] = snap.exists();
        }));
        setSiguiendo(followStates);
      }
    } catch (e) { console.error('[Search]', e); }
    finally { setCargando(false); }
  }

  async function handleFollow(uid: string) {
    if (!me) return;
    const followRef = doc(db, 'follows', `${me.uid}_${uid}`);
    if (siguiendo[uid]) {
      await deleteDoc(followRef);
      setSiguiendo((p) => ({ ...p, [uid]: false }));
    } else {
      await setDoc(followRef, {
        followerId:  me.uid,
        followingId: uid,
        createdAt:   serverTimestamp(),
      });
      setSiguiendo((p) => ({ ...p, [uid]: true }));
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-24">

      {/* Header */}
      <header className="sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-4 py-4 flex items-center gap-3 shadow-sm">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 active:scale-90 transition-transform">
          <ArrowLeftIcon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        </button>
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            autoFocus
            type="text"
            value={busqueda}
            onChange={(e) => buscar(e.target.value)}
            placeholder="Buscar personas..."
            className="w-full pl-9 pr-4 py-2.5 bg-gray-100 dark:bg-gray-800 rounded-2xl text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none"
          />
        </div>
      </header>

      <div className="px-4 pt-4 space-y-3">

        {cargando && (
          <div className="flex justify-center py-10">
            <div className="w-7 h-7 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!cargando && busqueda.length >= 2 && resultados.length === 0 && (
          <div className="text-center py-16 text-gray-400 dark:text-gray-600">
            <p className="text-4xl mb-2">🔍</p>
            <p className="font-bold">Sin resultados para "{busqueda}"</p>
          </div>
        )}

        {!cargando && busqueda.length < 2 && (
          <div className="text-center py-16 text-gray-400 dark:text-gray-600">
            <p className="text-4xl mb-2">👥</p>
            <p className="font-bold">Buscá personas por nombre</p>
          </div>
        )}

        {resultados.map((u) => {
          const avatar = u.photo ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || 'U')}&background=7c3aed&color=fff`;
          return (
            <div key={u.uid} className="flex items-center justify-between bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 shadow-sm">
              <button
                onClick={() => navigate(`/user/${u.uid}`)}
                className="flex items-center gap-3 flex-1 min-w-0 text-left active:opacity-70 transition-opacity"
              >
                <img src={avatar} alt={u.name} className="w-12 h-12 rounded-full object-cover shrink-0" />
                <div className="min-w-0">
                  <p className="font-black text-gray-900 dark:text-white text-sm truncate">{u.name}</p>
                  {u.title  && <p className="text-xs text-[var(--sc-600)] truncate">{u.title}</p>}
                  {u.ciudad && <p className="text-xs text-gray-400 truncate">📍 {u.ciudad}</p>}
                </div>
              </button>
              <button
                onClick={() => handleFollow(u.uid)}
                className={`ml-3 px-4 py-2 rounded-full text-xs font-black transition-all active:scale-95 shrink-0 ${
                  siguiendo[u.uid]
                    ? 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600'
                    : 'bg-purple-600 text-white'
                }`}
              >
                {siguiendo[u.uid] ? 'Siguiendo' : 'Seguir'}
              </button>
            </div>
          );
        })}
      </div>

      <Navbar onMenuClick={() => setIsMenuOpen(true)} />
      <Menu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </div>
  );
}
