import { useState, useEffect } from 'react';
import { db } from '../app/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import Navbar from '../components/Navbar';
import Menu from '../components/Menu';
import {
  BriefcaseIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  MagnifyingGlassIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Empleo {
  id: string;
  titulo: string;
  empresa: string;
  ubicacion: string;
  salario?: string;
  tipo: 'full-time' | 'part-time' | 'changa' | 'remoto' | string;
  descripcion: string;
  createdAt: { toDate: () => Date } | null;
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const TIPOS = ['todos', 'full-time', 'part-time', 'changa', 'remoto'] as const;

const BADGE_COLORS: Record<string, string> = {
  'full-time': 'bg-blue-50 text-blue-700',
  'part-time': 'bg-purple-50 text-purple-700',
  'remoto':    'bg-green-50 text-green-700',
  'changa':    'bg-orange-50 text-orange-700',
};

// ─── Componente ───────────────────────────────────────────────────────────────

export default function Jobs() {
  const [empleos, setEmpleos] = useState<Empleo[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [filtro, setFiltro] = useState<string>('todos');
  const [busqueda, setBusqueda] = useState<string>('');
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);

  useEffect(() => {
    const q = query(collection(db, 'empleos'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setEmpleos(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Empleo)));
        setCargando(false);
        setError('');
      },
      (err) => {
        console.error('[Jobs] Error al cargar empleos:', err);
        setError('No se pudieron cargar los empleos. Revisá tu conexión.');
        setCargando(false);
      }
    );
    return () => unsub();
  }, []);

  // Filtrado por tipo y búsqueda de texto
  const empleosFiltrados = empleos.filter((e) => {
    const coincideTipo = filtro === 'todos' || e.tipo === filtro;
    const textoBusqueda = busqueda.toLowerCase().trim();
    const coincideBusqueda =
      !textoBusqueda ||
      e.titulo.toLowerCase().includes(textoBusqueda) ||
      e.empresa.toLowerCase().includes(textoBusqueda) ||
      e.ubicacion.toLowerCase().includes(textoBusqueda);
    return coincideTipo && coincideBusqueda;
  });

  const formatFecha = (createdAt: Empleo['createdAt']): string => {
    if (!createdAt?.toDate) return '';
    return createdAt.toDate().toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'short',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">

      {/* Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-100 px-5 py-4 shadow-sm">
        <h1 className="text-2xl font-black text-blue-800 tracking-tighter">Empleos</h1>
        <p className="text-gray-400 text-xs">
          {cargando ? 'Cargando...' : `${empleosFiltrados.length} ofertas disponibles`}
        </p>
      </header>

      {/* Buscador */}
      <div className="px-4 pt-4">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por título, empresa o ciudad..."
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
        </div>
      </div>

      {/* Filtros */}
      <div className="px-4 pt-3 overflow-x-auto">
        <div className="flex gap-2 pb-1">
          {TIPOS.map((t) => (
            <button
              key={t}
              onClick={() => setFiltro(t)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-black transition-all active:scale-95 ${
                filtro === t
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-gray-500 border border-gray-200'
              }`}
            >
              {t.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Contenido */}
      <div className="px-4 pt-4 space-y-3">

        {/* Spinner */}
        {cargando && (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 p-4 bg-red-50 rounded-2xl text-red-600 text-sm" role="alert">
            <ExclamationCircleIcon className="w-5 h-5 shrink-0" />
            {error}
          </div>
        )}

        {/* Estado vacío */}
        {!cargando && !error && empleosFiltrados.length === 0 && (
          <div className="text-center py-16">
            <p className="text-5xl mb-3">💼</p>
            <p className="text-gray-500 font-bold">
              {busqueda ? `Sin resultados para "${busqueda}"` : 'No hay empleos disponibles'}
            </p>
            <p className="text-gray-400 text-sm mt-1">
              {busqueda ? 'Probá con otra búsqueda' : 'Volvé más tarde'}
            </p>
          </div>
        )}

        {/* Lista de empleos */}
        {empleosFiltrados.map((empleo) => (
          <div
            key={empleo.id}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                  <BriefcaseIcon className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="font-black text-gray-800 text-sm">{empleo.titulo}</p>
                  <p className="text-gray-500 text-xs">{empleo.empresa}</p>
                </div>
              </div>
              <span className={`text-[10px] font-black px-2 py-1 rounded-full shrink-0 ${BADGE_COLORS[empleo.tipo] ?? 'bg-gray-50 text-gray-600'}`}>
                {empleo.tipo?.toUpperCase()}
              </span>
            </div>

            <p className="text-gray-600 text-xs leading-relaxed mb-3 line-clamp-2">
              {empleo.descripcion}
            </p>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <MapPinIcon className="w-3.5 h-3.5 shrink-0" />
                  {empleo.ubicacion}
                </span>
                {empleo.salario && (
                  <span className="flex items-center gap-1 text-green-600 font-bold">
                    <CurrencyDollarIcon className="w-3.5 h-3.5 shrink-0" />
                    {empleo.salario}
                  </span>
                )}
              </div>
              {empleo.createdAt && (
                <span className="text-[10px] text-gray-300">
                  {formatFecha(empleo.createdAt)}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <Navbar onMenuClick={() => setIsMenuOpen(true)} />
      <Menu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </div>
  );
}
