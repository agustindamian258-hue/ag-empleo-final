import { useState, useEffect } from 'react';
import { db } from '../app/firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import Navbar from '../components/Navbar';
import Menu from '../components/Menu';
import {
  MagnifyingGlassIcon,
  ArrowTopRightOnSquareIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Empresa {
  id: string;
  nombre: string;
  website_url?: string;
  categoria?: string;
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const LETRAS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

// ─── Componente ───────────────────────────────────────────────────────────────

export default function Companies() {
  const [letraActiva, setLetraActiva] = useState<string>('A');
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [cargando, setCargando] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [busqueda, setBusqueda] = useState<string>('');
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);

  // Si hay búsqueda activa, ignorar el filtro por letra
  const modosBusqueda = busqueda.trim().length > 0;

  useEffect(() => {
    // Si el usuario está buscando, no hacer query por letra
    if (modosBusqueda) return;

    setCargando(true);
    setError('');

    const q = query(
      collection(db, 'empresas'),
      where('nombre', '>=', letraActiva),
      where('nombre', '<', letraActiva + '\uf8ff'),
      orderBy('nombre')
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        setEmpresas(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Empresa)));
        setCargando(false);
      },
      (err) => {
        console.error('[Companies] Error al cargar empresas:', err);
        setError('No se pudieron cargar las empresas. Revisá tu conexión.');
        setCargando(false);
      }
    );

    return () => unsub();
  }, [letraActiva, modosBusqueda]);

  // Filtrado local cuando hay búsqueda activa
  const empresasMostradas = modosBusqueda
    ? empresas.filter((e) =>
        e.nombre.toLowerCase().includes(busqueda.toLowerCase().trim())
      )
    : empresas;

  const handleLetra = (letra: string): void => {
    setLetraActiva(letra);
    setBusqueda('');
  };

  const getInicial = (nombre: string): string => {
    return nombre?.trim()?.[0]?.toUpperCase() || '?';
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">

      {/* Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-100 px-5 py-4 shadow-sm">
        <h1 className="text-2xl font-black text-blue-800 tracking-tighter">
          Empresas A-Z
        </h1>
        <p className="text-gray-400 text-xs">
          {cargando
            ? 'Cargando...'
            : `${empresasMostradas.length} empresa${empresasMostradas.length !== 1 ? 's' : ''} encontrada${empresasMostradas.length !== 1 ? 's' : ''}`}
        </p>
      </header>

      {/* Buscador */}
      <div className="px-4 pt-4">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-2xl px-4 py-3">
          <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 shrink-0" />
          <input
            type="text"
            placeholder="Buscar empresa..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="flex-1 text-sm outline-none bg-transparent text-gray-700"
          />
          {busqueda && (
            <button
              onClick={() => setBusqueda('')}
              className="text-gray-300 text-xs font-bold active:scale-90 transition-transform"
              aria-label="Limpiar búsqueda"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Selector de letras — se oculta si hay búsqueda activa */}
      {!modosBusqueda && (
        <div className="px-4 pt-4">
          <div className="flex flex-wrap gap-1.5">
            {LETRAS.map((l) => (
              <button
                key={l}
                onClick={() => handleLetra(l)}
                className={`w-9 h-9 rounded-xl text-sm font-black transition-all active:scale-90 ${
                  letraActiva === l
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-white text-gray-500 border border-gray-200'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Lista */}
      <div className="px-4 pt-5 space-y-3">

        {/* Spinner */}
        {cargando && (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Error */}
        {error && (
          <div
            className="flex items-center gap-2 p-4 bg-red-50 rounded-2xl text-red-600 text-sm"
            role="alert"
          >
            <ExclamationCircleIcon className="w-5 h-5 shrink-0" />
            {error}
          </div>
        )}

        {/* Estado vacío */}
        {!cargando && !error && empresasMostradas.length === 0 && (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">🏢</p>
            <p className="text-gray-500 font-bold">
              {modosBusqueda
                ? `Sin resultados para "${busqueda}"`
                : `No hay empresas con la letra `}
              {!modosBusqueda && (
                <span className="text-blue-600 font-black">{letraActiva}</span>
              )}
            </p>
            <p className="text-gray-400 text-sm mt-1">
              {modosBusqueda ? 'Probá con otro nombre' : 'Podés agregar empresas desde Firebase'}
            </p>
          </div>
        )}

        {/* Tarjetas de empresas */}
        {empresasMostradas.map((empresa) => (
          
            key={empresa.id}
            href={empresa.website_url || undefined}
            target={empresa.website_url ? '_blank' : undefined}
            rel="noopener noreferrer"
            onClick={!empresa.website_url ? (e) => e.preventDefault() : undefined}
            className={`flex items-center justify-between bg-white border border-gray-100 rounded-2xl p-4 shadow-sm transition-transform ${
              empresa.website_url
                ? 'active:scale-95 cursor-pointer'
                : 'cursor-default opacity-80'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                <span className="text-blue-700 font-black text-lg">
                  {getInicial(empresa.nombre)}
                </span>
              </div>
              <div>
                <p className="font-bold text-gray-800 text-sm">{empresa.nombre}</p>
                {empresa.categoria && (
                  <p className="text-xs text-gray-400">{empresa.categoria}</p>
                )}
                {!empresa.website_url && (
                  <p className="text-xs text-gray-300">Sin sitio web</p>
                )}
              </div>
            </div>
            {empresa.website_url && (
              <ArrowTopRightOnSquareIcon className="w-5 h-5 text-blue-400 shrink-0" />
            )}
          </a>
        ))}
      </div>

      <Navbar onMenuClick={() => setIsMenuOpen(true)} />
      <Menu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </div>
  );
            }
