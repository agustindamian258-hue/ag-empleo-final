// src/pages/Jobs.tsx
import { useState, useEffect, useRef } from 'react';
import { db, auth } from '../app/firebase';
import { storage } from '../app/firebase';
import {
  collection, query, orderBy, onSnapshot,
  addDoc, serverTimestamp, doc, updateDoc, deleteDoc,
} from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { onAuthStateChanged, User } from 'firebase/auth';
import Navbar from '../components/Navbar';
import Menu   from '../components/Menu';
import {
  BriefcaseIcon, MapPinIcon, CurrencyDollarIcon,
  MagnifyingGlassIcon, ExclamationCircleIcon,
  PlusIcon, XMarkIcon, PhotoIcon, EnvelopeIcon,
  PencilIcon, TrashIcon, CheckIcon,
} from '@heroicons/react/24/outline';

type TipoEmpleo = 'full-time' | 'part-time' | 'changa' | 'remoto';

interface Empleo {
  id:          string;
  titulo:      string;
  empresa:     string;
  ubicacion:   string;
  salario?:    string;
  tipo:        TipoEmpleo | string;
  descripcion: string;
  contacto?:   string;
  mediaUrl?:   string;
  mediaType?:  'image' | 'video' | '';
  uid?:        string;
  createdAt:   { toDate: () => Date } | null;
}

interface FormData {
  titulo:      string;
  empresa:     string;
  ubicacion:   string;
  salario:     string;
  tipo:        TipoEmpleo;
  descripcion: string;
  contacto:    string;
}

const FORM_INICIAL: FormData = {
  titulo: '', empresa: '', ubicacion: '',
  salario: '', tipo: 'full-time', descripcion: '', contacto: '',
};

const TIPOS      = ['todos', 'full-time', 'part-time', 'changa', 'remoto'] as const;
const TIPOS_FORM: TipoEmpleo[] = ['full-time', 'part-time', 'changa', 'remoto'];
const MAX_FILE_MB = 100;

const BADGE_COLORS: Record<string, string> = {
  'full-time': 'bg-blue-50   text-blue-700   dark:bg-blue-900/30  dark:text-blue-300',
  'part-time': 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  'remoto':    'bg-green-50  text-green-700  dark:bg-green-900/30  dark:text-green-300',
  'changa':    'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
};

function formatFecha(createdAt: Empleo['createdAt']): string {
  if (!createdAt?.toDate) return '';
  return createdAt.toDate().toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
}

function ModalPublicar({ onClose, empleoEditar }: { onClose: () => void; empleoEditar?: Empleo | null }) {
  const editando = !!empleoEditar;
  const [form,      setForm]      = useState<FormData>(
    empleoEditar ? {
      titulo:      empleoEditar.titulo,
      empresa:     empleoEditar.empresa,
      ubicacion:   empleoEditar.ubicacion,
      salario:     empleoEditar.salario ?? '',
      tipo:        (empleoEditar.tipo as TipoEmpleo) ?? 'full-time',
      descripcion: empleoEditar.descripcion,
      contacto:    empleoEditar.contacto ?? '',
    } : FORM_INICIAL
  );
  const [file,      setFile]      = useState<File | null>(null);
  const [preview,   setPreview]   = useState<string | null>(empleoEditar?.mediaUrl ?? null);
  const [guardando, setGuardando] = useState(false);
  const [errForm,   setErrForm]   = useState('');
  const previewRef = useRef<string | null>(null);

  const inputBase = 'w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--sc-500)] placeholder-gray-400 dark:placeholder-gray-500';

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    setErrForm('');
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith('image/') && !f.type.startsWith('video/')) { setErrForm('Solo imágenes o videos.'); return; }
    if (f.size > MAX_FILE_MB * 1024 * 1024) { setErrForm(`Máximo ${MAX_FILE_MB}MB.`); return; }
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    const url = URL.createObjectURL(f);
    previewRef.current = url;
    setFile(f); setPreview(url);
  }

  async function handleSubmit() {
    if (!form.titulo.trim() || !form.empresa.trim() || !form.ubicacion.trim() || !form.descripcion.trim()) {
      setErrForm('Completá todos los campos obligatorios.'); return;
    }
    setGuardando(true); setErrForm('');
    try {
      let mediaUrl  = empleoEditar?.mediaUrl  ?? '';
      let mediaType: 'image' | 'video' | '' = empleoEditar?.mediaType ?? '';
      if (file && storage) {
        try {
          const sRef = storageRef(storage, `empleos/${Date.now()}_${file.name}`);
          await uploadBytes(sRef, file);
          mediaUrl  = await getDownloadURL(sRef);
          mediaType = file.type.startsWith('video') ? 'video' : 'image';
        } catch { setErrForm('No se pudo subir el archivo. Se publicará sin imagen.'); }
      }
      const payload = {
        titulo: form.titulo.trim(), empresa: form.empresa.trim(),
        ubicacion: form.ubicacion.trim(), salario: form.salario.trim() || null,
        tipo: form.tipo, descripcion: form.descripcion.trim(),
        contacto: form.contacto.trim() || null, mediaUrl, mediaType,
      };
      if (editando && empleoEditar) {
        await updateDoc(doc(db, 'empleos', empleoEditar.id), { ...payload, editadoEn: serverTimestamp() });
      } else {
        await addDoc(collection(db, 'empleos'), { ...payload, createdAt: serverTimestamp(), uid: auth.currentUser?.uid ?? null });
      }
      onClose();
    } catch (err) {
      console.error('[Jobs] Error al guardar:', err);
      setErrForm('Error al guardar. Intentá de nuevo.');
    } finally { setGuardando(false); }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* flex-col: header + scroll + botón fijo */}
      <div
        className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-t-3xl shadow-2xl flex flex-col animate-slide-up"
        style={{ maxHeight: '92vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0">
          <h2 className="text-lg font-black text-gray-800 dark:text-gray-100">
            {editando ? 'Editar empleo' : 'Publicar empleo'}
          </h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Contenido scrolleable */}
        <div className="flex-1 overflow-y-auto px-5 space-y-4 pb-2">
          <input name="titulo"    value={form.titulo}    onChange={handleChange} placeholder="Título del puesto *"  className={inputBase} maxLength={80} />
          <input name="empresa"   value={form.empresa}   onChange={handleChange} placeholder="Empresa *"            className={inputBase} maxLength={80} />
          <input name="ubicacion" value={form.ubicacion} onChange={handleChange} placeholder="Ubicación *"          className={inputBase} maxLength={80} />
          <input name="salario"   value={form.salario}   onChange={handleChange} placeholder="Salario (opcional)"   className={inputBase} maxLength={40} />

          <div className="relative">
            <EnvelopeIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input name="contacto" value={form.contacto} onChange={handleChange}
              placeholder="Email o WhatsApp de contacto (opcional)"
              className={`${inputBase} pl-10`} maxLength={80} />
          </div>

          <div className="flex gap-2 flex-wrap">
            {TIPOS_FORM.map((t) => (
              <button key={t} type="button" onClick={() => setForm((p) => ({ ...p, tipo: t }))}
                className={`px-3 py-1.5 rounded-full text-xs font-black transition-all active:scale-95 ${
                  form.tipo === t ? 'bg-[var(--sc-600)] text-white shadow' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                }`}>
                {t.toUpperCase()}
              </button>
            ))}
          </div>

          <textarea name="descripcion" value={form.descripcion} onChange={handleChange}
            placeholder="Descripción del puesto *" rows={3}
            className={`${inputBase} resize-none`} maxLength={500} />

          {preview ? (
            <div className="relative rounded-2xl overflow-hidden bg-black">
              {(file?.type.startsWith('video') || empleoEditar?.mediaType === 'video')
                ? <video src={preview} controls className="w-full max-h-48 object-cover" />
                : <img src={preview} alt="Vista previa" className="w-full max-h-48 object-cover" />
              }
              <button
                onClick={() => { setFile(null); setPreview(null); if (previewRef.current) { URL.revokeObjectURL(previewRef.current); previewRef.current = null; } }}
                className="absolute top-2 right-2 bg-black/60 text-white rounded-full w-7 h-7 flex items-center justify-center text-xs font-bold"
              >✕</button>
            </div>
          ) : (
            <label className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400 text-sm cursor-pointer active:scale-95 transition-transform">
              <PhotoIcon className="w-5 h-5 text-[var(--sc-500)]" />
              <span>Agregar foto o video (opcional)</span>
              <input type="file" accept="image/*,video/*" onChange={handleFile} className="hidden" />
            </label>
          )}

          {errForm && (
            <p className="text-red-500 text-xs flex items-center gap-1">
              <ExclamationCircleIcon className="w-4 h-4 shrink-0" />{errForm}
            </p>
          )}
        </div>

        {/* Botón FIJO abajo — fuera del scroll */}
        <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-800 shrink-0"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)' }}>
          <button type="button" onClick={handleSubmit} disabled={guardando}
            className="w-full py-4 rounded-2xl bg-[var(--sc-600)] hover:bg-[var(--sc-700)] text-white font-black text-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            {guardando ? (
              <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />{editando ? 'Guardando...' : 'Publicando...'}</>
            ) : (
              <><CheckIcon className="w-4 h-4" />{editando ? 'Guardar cambios' : 'Publicar empleo'}</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Jobs() {
  const [empleos,      setEmpleos]      = useState<Empleo[]>([]);
  const [cargando,     setCargando]     = useState(true);
  const [error,        setError]        = useState('');
  const [filtro,       setFiltro]       = useState('todos');
  const [busqueda,     setBusqueda]     = useState('');
  const [isMenuOpen,   setIsMenuOpen]   = useState(false);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [empleoEditar, setEmpleoEditar] = useState<Empleo | null>(null);
  const [eliminandoId, setEliminandoId] = useState<string | null>(null);
  const [usuario,      setUsuario]      = useState<User | null>(null);

  useEffect(() => { const unsub = onAuthStateChanged(auth, setUsuario); return () => unsub(); }, []);

  useEffect(() => {
    const q = query(collection(db, 'empleos'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q,
      (snap) => { setEmpleos(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Empleo))); setCargando(false); },
      (err)  => { console.error('[Jobs]', err); setError('No se pudieron cargar los empleos.'); setCargando(false); }
    );
    return () => unsub();
  }, []);

  async function handleEliminar(empleo: Empleo) {
    if (!usuario || usuario.uid !== empleo.uid) return;
    setEliminandoId(null);
    try { await deleteDoc(doc(db, 'empleos', empleo.id)); }
    catch (e) { console.error('[Jobs] eliminar:', e); }
  }

  const empleosFiltrados = empleos.filter((e) => {
    const coincideTipo  = filtro === 'todos' || e.tipo === filtro;
    const termino       = busqueda.toLowerCase().trim();
    const coincideTexto = !termino ||
      e.titulo.toLowerCase().includes(termino) ||
      e.empresa.toLowerCase().includes(termino) ||
      e.ubicacion.toLowerCase().includes(termino);
    return coincideTipo && coincideTexto;
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-24">
      <header className="sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-5 py-4 shadow-sm">
        <h1 className="text-2xl font-black text-[var(--sc-700)] dark:text-[var(--sc-100)] tracking-tighter">Empleos</h1>
        <p className="text-gray-400 dark:text-gray-500 text-xs">
          {cargando ? 'Cargando...' : `${empleosFiltrados.length} oferta${empleosFiltrados.length !== 1 ? 's' : ''} disponible${empleosFiltrados.length !== 1 ? 's' : ''}`}
        </p>
      </header>

      <div className="px-4 pt-4">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por título, empresa o ciudad..."
            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--sc-500)]" />
        </div>
      </div>

      <div className="px-4 pt-3 overflow-x-auto">
        <div className="flex gap-2 pb-1">
          {TIPOS.map((t) => (
            <button key={t} onClick={() => setFiltro(t)} aria-pressed={filtro === t}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-black transition-all active:scale-95 ${
                filtro === t ? 'bg-[var(--sc-600)] text-white shadow-md' : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700'
              }`}>
              {t.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pt-4 space-y-3">
        {cargando && <div className="flex justify-center py-10"><div className="w-8 h-8 border-4 border-[var(--sc-600)] border-t-transparent rounded-full animate-spin" /></div>}

        {error && (
          <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-900/20 rounded-2xl text-red-600 dark:text-red-400 text-sm" role="alert">
            <ExclamationCircleIcon className="w-5 h-5 shrink-0" />{error}
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

        {empleosFiltrados.map((empleo) => {
          const esMio = usuario?.uid === empleo.uid;
          return (
            <article key={empleo.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
              <div className="p-4">
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
                  <div className="flex items-center gap-1 shrink-0">
                    <span className={`text-[10px] font-black px-2 py-1 rounded-full ${BADGE_COLORS[empleo.tipo] ?? 'bg-gray-50 text-gray-600'}`}>
                      {empleo.tipo?.toUpperCase()}
                    </span>
                    {esMio && (
                      <>
                        <button onClick={() => { setEmpleoEditar(empleo); setModalAbierto(true); }}
                          className="p-1.5 rounded-full bg-blue-50 dark:bg-blue-900/20 active:scale-90 transition-transform">
                          <PencilIcon className="w-3.5 h-3.5 text-blue-500" />
                        </button>
                        <button onClick={() => setEliminandoId(eliminandoId === empleo.id ? null : empleo.id)}
                          className="p-1.5 rounded-full bg-red-50 dark:bg-red-900/20 active:scale-90 transition-transform">
                          <TrashIcon className="w-3.5 h-3.5 text-red-500" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {eliminandoId === empleo.id && (
                  <div className="mb-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-between">
                    <p className="text-xs text-red-700 dark:text-red-300 font-bold">¿Eliminar esta oferta?</p>
                    <div className="flex gap-2">
                      <button onClick={() => handleEliminar(empleo)} className="text-xs bg-red-500 text-white px-3 py-1 rounded-full font-bold active:scale-95">Sí</button>
                      <button onClick={() => setEliminandoId(null)} className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-3 py-1 rounded-full font-bold active:scale-95">No</button>
                    </div>
                  </div>
                )}

                <p className="text-gray-600 dark:text-gray-400 text-xs leading-relaxed mb-3 line-clamp-2">{empleo.descripcion}</p>

                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
                    <span className="flex items-center gap-1"><MapPinIcon className="w-3.5 h-3.5 shrink-0" />{empleo.ubicacion}</span>
                    {empleo.salario && (
                      <span className="flex items-center gap-1 text-green-600 dark:text-green-400 font-bold">
                        <CurrencyDollarIcon className="w-3.5 h-3.5 shrink-0" />{empleo.salario}
                      </span>
                    )}
                  </div>
                  {empleo.contacto && (
                    <a href={empleo.contacto.includes('@') ? `mailto:${empleo.contacto}` : `https://wa.me/${empleo.contacto.replace(/\D/g,'')}`}
                      target="_blank" rel="noreferrer"
                      className="flex items-center gap-1 text-xs text-[var(--sc-600)] font-bold active:scale-95 transition-transform">
                      <EnvelopeIcon className="w-3.5 h-3.5" />Contactar
                    </a>
                  )}
                  {empleo.createdAt && <span className="text-[10px] text-gray-300 dark:text-gray-600 ml-auto">{formatFecha(empleo.createdAt)}</span>}
                </div>
              </div>

              {empleo.mediaUrl && (
                empleo.mediaType === 'video'
                  ? <video src={empleo.mediaUrl} controls className="w-full max-h-56 object-cover bg-black" />
                  : <img src={empleo.mediaUrl} alt="Imagen del empleo" className="w-full max-h-56 object-cover" loading="lazy" />
              )}
            </article>
          );
        })}
      </div>

      {usuario && (
        <button onClick={() => { setEmpleoEditar(null); setModalAbierto(true); }}
          className="fixed bottom-24 right-5 z-40 w-14 h-14 rounded-full bg-[var(--sc-600)] text-white shadow-lg flex items-center justify-center transition-all active:scale-90">
          <PlusIcon className="w-7 h-7" />
        </button>
      )}

      {modalAbierto && (
        <ModalPublicar
          onClose={() => { setModalAbierto(false); setEmpleoEditar(null); }}
          empleoEditar={empleoEditar}
        />
      )}

      <Navbar onMenuClick={() => setIsMenuOpen(true)} />
      <Menu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </div>
  );
        }
