// src/pages/Jobs.tsx
import { useState, useEffect } from 'react';
import { db, auth } from '../app/firebase';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import Navbar from '../components/Navbar';
import Menu from '../components/Menu';
import {
  BriefcaseIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  MagnifyingGlassIcon,
  ExclamationCircleIcon,
  PlusIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

// ─── Tipos ────────────────────────────────────────────────────────────────────

type TipoEmpleo = 'full-time' | 'part-time' | 'changa' | 'remoto';

interface Empleo {
  id:          string;
  titulo:      string;
  empresa:     string;
  ubicacion:   string;
  salario?:    string;
  tipo:        TipoEmpleo | string;
  descripcion: string;
  createdAt:   { toDate: () => Date } | null;
}

interface FormData {
  titulo:      string;
  empresa:     string;
  ubicacion:   string;
  salario:     string;
  tipo:        TipoEmpleo;
  descripcion: string;
}

const FORM_INICIAL: FormData = {
  titulo:      '',
  empresa:     '',
  ubicacion:   '',
  salario:     '',
  tipo:        'full-time',
  descripcion: '',
};

// ─── Constantes ───────────────────────────────────────────────────────────────

const TIPOS = ['todos', 'full-time', 'part-time', 'changa', 'remoto'] as const;
const TIPOS_FORM: TipoEmpleo[] = ['full-time', 'part-time', 'changa', 'remoto'];

const BADGE_COLORS: Record<string, string> = {
  'full-time': 'bg-blue-50   text-blue-700   dark:bg-blue-900/30  dark:text-blue-300',
  'part-time': 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  'remoto':    'bg-green-50  text-green-700  dark:bg-green-900/30  dark:text-green-300',
  'changa':    'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatFecha(createdAt: Empleo['createdAt']): string {
  if (!createdAt?.toDate) return '';
  return createdAt.toDate().toLocaleDateString('es-AR', {
    day:   'numeric',
    month: 'short',
  });
}

// ─── Subcomponente: Modal de publicación ──────────────────────────────────────

interface ModalPublicarProps {
  onClose:  () => void;
  onGuardado: () => void;
}

function ModalPublicar({ onClose, onGuardado }: ModalPublicarProps) {
  const [form,      setForm]      = useState<FormData>(FORM_INICIAL);
  const [guardando, setGuardando] = useState(false);
  const [errForm,   setErrForm]   = useState('');

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit() {
    if (!form.titulo.trim() || !form.empresa.trim() || !form.ubicacion.trim() || !form.descripcion.trim()) {
      setErrForm('Completá todos los campos obligatorios.');
      return;
    }
    setGuardando(true);
    setErrForm('');
    try {
      await addDoc(collection(db, 'empleos'), {
        titulo:      form.titulo.trim(),
        empresa:     form.empresa.trim(),
        ubicacion:   form.ubicacion.trim(),
        salario:     form.salario.trim() || null,
        tipo:        form.tipo,
        descripcion: form.descripcion.trim(),
        createdAt:   serverTimestamp(),
        uid:         auth.currentUser?.uid ?? null,
      });
      onGuardado();
      onClose();
    } catch (err) {
      console.error('[Jobs] Error al publicar:', err);
      setErrForm('Error al publicar. Intentá de nuevo.');
    } finally {
      setGuardando(false);
    }
  }

  const inputBase =
    'w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--sc-500)] placeholder-gray-400 dark:placeholder-gray-500';

  return (
    /* Overlay */
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Sheet */}
      <div className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-t-3xl shadow-2xl px-5 pt-5 pb-10 space-y-4 animate-slide-up">

        {/* Cabecera */}
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-black text-gray-800 dark:text-gray-100">
            Publicar empleo
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
            aria-label="Cerrar"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Campos */}
        <input
          name="titulo"
          value={form.titulo}
          onChange={handleChange}
          placeholder="Título del puesto *"
          className={inputBase}
          maxLength={80}
        />
        <input
          name="empresa"
          value={form.empresa}
          onChange={handleChange}
          placeholder="Empresa *"
          className={inputBase}
          maxLength={80}
        />
        <input
          name="ubicacion"
          value={form.ubicacion}
          onChange={handleChange}
          placeholder="Ubicación *"
          className={inputBase}
          maxLength={80}
        />
        <input
          name="salario"
          value={form.salario}
          onChange={handleChange}
          placeholder="Salario (opcional)"
          className={inputBase}
          maxLength={40}
        />

        {/* Selector tipo */}
        <div className="flex gap-2 flex-wrap">
          {TIPOS_FORM.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setForm((p) => ({ ...p, tipo: t }))}
              className={`px-3 py-1.5 rounded-full text-xs font-black transition-all active:scale-95 ${
                form.tipo === t
                  ? 'bg-[var(--sc-600)] text-white shadow'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
              }`}
            >
              {t.toUpperCase()}
            </button>
          ))}
        </div>

        <textarea
          name="descripcion"
          value={form.descripcion}
          onChange={handleChange}
          placeholder="Descripción del puesto *"
          rows={3}
          className={`${inputBase} resize-none`}
          maxLength={500}
        />

        {/* Error */}
        {errForm && (
          <p className="text-red-500 text-xs flex items-center gap-1">
            <ExclamationCircleIcon className="w-4 h-4 shrink-0" />
            {errForm}
          </p>
        )}

        {/* Botón publicar */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={guardando}
          className="w-full py-3.5 rounded-2xl bg-[var(--sc-600)] hover:bg-[var(--sc-700)] text-white font-black text-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {guardando ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Publicando...
            </>
          ) : (
            'Publicar empleo'
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function Jobs() {
  const [empleos,      setEmpleos]      = useState<Empleo[]>([]);
  const [cargando,     setCargando]     = useState(true);
  const [error,        setError]        = useState('');
  const [filtro,       setFiltro]       = useState('todos');
  const [busqueda,     setBusqueda]     = useState('');
  const [isMenuOpen,   setIsMenuOpen]   = useState(false);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [usuario,      setUsuario]      = useState<User | null>(null);

  // Auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUsuario);
    return () => unsub();
  }, []);

  // Empleos en tiempo real
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

  const empleosFiltrados = empleos.filter((e) => {
    const coincideTipo  = filtro === 'todos' || e.tipo === filtro;
    const termino       = busqueda.toLowerCase().trim();
    const coincideTexto =
      !termino ||
      e.titulo.toLowerCase().includes(termino)    ||
      e.empresa.toLowerCase().includes(termino)   ||
      e.ubicacion.toLowerCase().includes(termino);
    return coincideTipo && coincideTexto;
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-24">

      {/* Header */}
      <header className="sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-5 py-4 shadow-sm">
        <h1 className="text-2xl font-black text-[var(--sc-700)] dark:text-[var(--sc-100)] tracking-tighter">
          Empleos
        </h1>
        <p className="text-gray-400 dark:text-gray-500 text-xs">
          {cargando
            ? 'Cargando...'
            : `${empleosFiltrados.length} oferta${empleosFiltrados.length !== 1 ? 's' : ''} disponible${empleosFiltrados.length !== 1 ? 's' : ''}`}
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
            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[var(--sc-500)]"
            aria-label="Buscar empleos"
          />
        </div>
      </div>

      {/* Filtros por tipo */}
      <div className="px-4 pt-3 overflow-x-auto">
        <div className="flex gap-2 pb-1" role="group" aria-label="Filtrar por tipo de empleo">
          {TIPOS.map((t) => (
            <button
              key={t}
              onClick={() => setFiltro(t)}
              aria-pressed={filtro === t}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-black transition-all active:scale-95 ${
                filtro === t
                  ? 'bg-[var(--sc-600)] text-white shadow-md'
                  : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700'
              }`}
            >
              {t.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Contenido */}
      <div className="px-4 pt-4 space-y-3">

        {cargando && (
          <div className="flex justify-center py-10">
            <div
              className="w-8 h-8 border-4 border-[var(--sc-600)] border-t-transparent rounded-full animate-spin"
              aria-label="Cargando empleos"
            />
          </div>
        )}

        {error && (
          <div
            className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-900/20 rounded-2xl text-red-600 dark:text-red-400 text-sm"
            role="alert"
          >
            <ExclamationCircleIcon className="w-5 h-5 shrink-0" />
            {error}
          </div>
        )}

        {!cargando && !error && empleosFiltrados.length === 0 && (
          <div className="text-center py-16">
            <p className="text-5xl mb-3">💼</p>
            <p className="text-gray-500 dark:text-gray-400 font-bold">
              {busqueda ? `Sin resultados para "${busqueda}"` : 'No hay empleos disponibles'}
            </p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
              {busqueda ? 'Probá con otra búsqueda' : 'Volvé más tarde'}
            </p>
          </div>
        )}

        {empleosFiltrados.map((empleo) => (
          <article
            key={empleo.id}
            className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-4"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-[var(--sc-100)] dark:bg-[var(--sc-700)]/20 rounded-xl flex items-center justify-center shrink-0">
                  <BriefcaseIcon className="w-6 h-6 text-[var(--sc-600)] dark:text-[var(--sc-500)]" />
                </div>
                <div>
                  <p className="font-black text-gray-800 dark:text-gray-100 text-sm">{empleo.titulo}</p>
                  <p className="text-gray-500 dark:text-gray-400 text-xs">{empleo.empresa}</p>
                </div>
              </div>
              <span
                className={`text-[10px] font-black px-2 py-1 rounded-full shrink-0 ${
                  BADGE_COLORS[empleo.tipo] ?? 'bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                }`}
              >
                {empleo.tipo?.toUpperCase()}
              </span>
            </div>

            <p className="text-gray-600 dark:text-gray-400 text-xs leading-relaxed mb-3 line-clamp-2">
              {empleo.descripcion}
            </p>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
                <span className="flex items-center gap-1">
                  <MapPinIcon className="w-3.5 h-3.5 shrink-0" />
                  {empleo.ubicacion}
                </span>
                {empleo.salario && (
                  <span className="flex items-center gap-1 text-green-600 dark:text-green-400 font-bold">
                    <CurrencyDollarIcon className="w-3.5 h-3.5 shrink-0" />
                    {empleo.salario}
                  </span>
                )}
              </div>
              {empleo.createdAt && (
                <span className="text-[10px] text-gray-300 dark:text-gray-600">
                  {formatFecha(empleo.createdAt)}
                </span>
              )}
            </div>
          </article>
        ))}
      </div>

      {/* FAB — solo para usuarios autenticados */}
      {usuario && (
        <button
          onClick={() => setModalAbierto(true)}
          aria-label="Publicar empleo"
          className="fixed bottom-24 right-5 z-40 w-14 h-14 rounded-full bg-[var(--sc-600)] hover:bg-[var(--sc-700)] text-white shadow-lg flex items-center justify-center transition-all active:scale-90"
        >
          <PlusIcon className="w-7 h-7" />
        </button>
      )}

      {/* Modal publicar */}
      {modalAbierto && (
        <ModalPublicar
          onClose={() => setModalAbierto(false)}
          onGuardado={() => {}}
        />
      )}

      <Navbar onMenuClick={() => setIsMenuOpen(true)} />
      <Menu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </div>
  );
          }
