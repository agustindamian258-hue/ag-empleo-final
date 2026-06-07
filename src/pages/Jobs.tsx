// src/pages/Jobs.tsx
import { useState, useEffect, useRef } from 'react';
import { db, auth } from '../app/firebase';
import {
  collection, query, orderBy, onSnapshot,
  addDoc, serverTimestamp, doc, updateDoc, deleteDoc,
  limit, startAfter, getDocs, QueryDocumentSnapshot, DocumentData,
  where, getDoc,
} from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Menu   from '../components/Menu';
import { subirArchivoCloudinary } from '../utils/cloudinary';
import {
  BriefcaseIcon, MapPinIcon, CurrencyDollarIcon,
  MagnifyingGlassIcon, ExclamationCircleIcon,
  PlusIcon, XMarkIcon, PhotoIcon, EnvelopeIcon,
  PencilIcon, TrashIcon, CheckIcon, UserGroupIcon,
  ClipboardDocumentListIcon,
} from '@heroicons/react/24/outline';

type TipoEmpleo = 'full-time' | 'part-time' | 'changa' | 'remoto';

interface Requisito {
  id:       string;
  pregunta: string;
}

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
  requisitos?: Requisito[];
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
const PAGE_SIZE   = 10;

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

// ── Modal Publicar ────────────────────────────────────────────────────────────
function ModalPublicar({
  onClose,
  empleoEditar,
}: {
  onClose: () => void;
  empleoEditar?: Empleo | null;
}) {
  const editando = !!empleoEditar;
  const [form,       setForm]       = useState<FormData>(
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
  const [requisitos, setRequisitos] = useState<Requisito[]>(empleoEditar?.requisitos ?? []);
  const [nuevoReq,   setNuevoReq]   = useState('');
  const [file,       setFile]       = useState<File | null>(null);
  const [preview,    setPreview]    = useState<string | null>(empleoEditar?.mediaUrl ?? null);
  const [guardando,  setGuardando]  = useState(false);
  const [errForm,    setErrForm]    = useState('');
  const previewRef = useRef<string | null>(null);

  const inputBase = 'w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--sc-500)] placeholder-gray-400 dark:placeholder-gray-500';

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  }

  function agregarRequisito() {
    if (!nuevoReq.trim() || requisitos.length >= 8) return;
    setRequisitos((p) => [...p, { id: Date.now().toString(), pregunta: nuevoReq.trim() }]);
    setNuevoReq('');
  }

  function eliminarRequisito(id: string) {
    setRequisitos((p) => p.filter((r) => r.id !== id));
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
      let mediaUrl:  string = empleoEditar?.mediaUrl  ?? '';
      let mediaType: 'image' | 'video' | '' = empleoEditar?.mediaType ?? '';
      if (file) {
        try {
          const { url, tipo } = await subirArchivoCloudinary(file);
          mediaUrl = url; mediaType = tipo;
        } catch { setErrForm('No se pudo subir el archivo.'); }
      }
      const payload = {
        titulo:      form.titulo.trim(),
        empresa:     form.empresa.trim(),
        ubicacion:   form.ubicacion.trim(),
        salario:     form.salario.trim() || null,
        tipo:        form.tipo,
        descripcion: form.descripcion.trim(),
        contacto:    form.contacto.trim() || null,
        requisitos,
        mediaUrl, mediaType,
      };
      if (editando && empleoEditar) {
        await updateDoc(doc(db, 'empleos', empleoEditar.id), { ...payload, editadoEn: serverTimestamp() });
      } else {
        await addDoc(collection(db, 'empleos'), {
          ...payload, createdAt: serverTimestamp(), uid: auth.currentUser?.uid ?? null,
        });
      }
      onClose();
    } catch (err) {
      console.error('[Jobs] Error al guardar:', err);
      setErrForm('Error al guardar. Intentá de nuevo.');
    } finally { setGuardando(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-t-3xl shadow-2xl px-5 pt-5 space-y-4 animate-slide-up overflow-y-auto"
        style={{ maxHeight: '85vh', paddingBottom: 'calc(env(safe-area-inset-bottom) + 100px)' }}>

        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-gray-800 dark:text-gray-100">
            {editando ? 'Editar empleo' : 'Publicar empleo'}
          </h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

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
                form.tipo === t ? 'bg-[var(--sc-600)] text-white shadow' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
              }`}>
              {t.toUpperCase()}
            </button>
          ))}
        </div>

        <textarea name="descripcion" value={form.descripcion} onChange={handleChange}
          placeholder="Descripción del puesto *" rows={3}
          className={`${inputBase} resize-none`} maxLength={500} />

        {/* Requisitos */}
        <div className="space-y-2">
          <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Requisitos para postularse ({requisitos.length}/8)
          </p>
          <p className="text-xs text-gray-400">Los candidatos responderán Sí o No a cada pregunta.</p>
          {requisitos.map((r) => (
            <div key={r.id} className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 rounded-2xl px-3 py-2">
              <span className="text-xs text-gray-700 dark:text-gray-300 flex-1">{r.pregunta}</span>
              <button onClick={() => eliminarRequisito(r.id)} className="text-red-400 text-xs active:scale-90">✕</button>
            </div>
          ))}
          {requisitos.length < 8 && (
            <div className="flex gap-2">
              <input
                value={nuevoReq}
                onChange={(e) => setNuevoReq(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && agregarRequisito()}
                placeholder="Ej: ¿Tenés experiencia en ventas?"
                className={`${inputBase} flex-1`}
                maxLength={100}
              />
              <button onClick={agregarRequisito}
                className="px-3 py-2 rounded-2xl bg-[var(--sc-500)] text-white text-xs font-black active:scale-95">
                +
              </button>
            </div>
          )}
        </div>

        {preview ? (
          <div className="relative rounded-2xl overflow-hidden bg-black">
            {(file?.type.startsWith('video') || empleoEditar?.mediaType === 'video')
              ? <video src={preview} controls className="w-full max-h-48 object-cover" />
              : <img src={preview} alt="Vista previa" className="w-full max-h-48 object-cover" />
            }
            <button onClick={() => { setFile(null); setPreview(null); if (previewRef.current) { URL.revokeObjectURL(previewRef.current); previewRef.current = null; } }}
              className="absolute top-2 right-2 bg-black/60 text-white rounded-full w-7 h-7 flex items-center justify-center text-xs font-bold">✕</button>
          </div>
        ) : (
          <label className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 text-gray-500 text-sm cursor-pointer active:scale-95">
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

        <button type="button" onClick={handleSubmit} disabled={guardando}
          className="w-full py-4 rounded-2xl bg-[var(--sc-600)] text-white font-black text-sm active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2">
          {guardando
            ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />{editando ? 'Guardando...' : 'Publicando...'}</>
            : <><CheckIcon className="w-4 h-4" />{editando ? 'Guardar cambios' : 'Publicar empleo'}</>
          }
        </button>
      </div>
    </div>
  );
}

// ── Modal Postularse ──────────────────────────────────────────────────────────
function ModalPostularse({ empleo, onClose }: { empleo: Empleo; onClose: () => void }) {
  const user = auth.currentUser;
  const [respuestas,  setRespuestas]  = useState<Record<string, boolean>>({});
  const [enviando,    setEnviando]    = useState(false);
  const [enviado,     setEnviado]     = useState(false);
  const [error,       setError]       = useState('');

  const requisitos = empleo.requisitos ?? [];
  const todoRespondido = requisitos.every((r) => respuestas[r.id] !== undefined);

  function calcularGrupo(): 'apto' | 'parcial' | 'no_apto' {
    if (requisitos.length === 0) return 'apto';
    const sies = requisitos.filter((r) => respuestas[r.id] === true).length;
    if (sies === requisitos.length) return 'apto';
    if (sies === 0) return 'no_apto';
    return 'parcial';
  }

  async function handlePostular() {
    if (!user) return;
    if (requisitos.length > 0 && !todoRespondido) {
      setError('Respondé todas las preguntas antes de postularte.'); return;
    }
    setEnviando(true); setError('');
    try {
      const userSnap = await getDoc(doc(db, 'users', user.uid));
      const userData = userSnap.exists() ? userSnap.data() : {};
      const grupo    = calcularGrupo();

      await addDoc(collection(db, 'empleos', empleo.id, 'postulaciones'), {
        uid:        user.uid,
        nombre:     userData.name     || user.displayName || 'Usuario',
        foto:       userData.photo    || user.photoURL    || '',
        ciudad:     userData.ciudad   || '',
        cargo:      userData.cargoDeseado || '',
        nivel:      userData.nivelExperiencia || '',
        respuestas,
        grupo,
        createdAt:  serverTimestamp(),
      });

      // Notificación al empleador
      if (empleo.uid) {
        await addDoc(collection(db, 'notifications'), {
          uid:      empleo.uid,
          titulo:   `💼 Nueva postulación en "${empleo.titulo}"`,
          mensaje:  `${userData.name || user.displayName || 'Alguien'} se postuló a tu oferta.`,
          tipo:     'empleo',
          leida:    false,
          creadoEn: serverTimestamp(),
        });
      }
      setEnviado(true);
    } catch (e) {
      console.error('[Jobs] postular:', e);
      setError('No se pudo enviar la postulación. Intentá de nuevo.');
    } finally { setEnviando(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-t-3xl shadow-2xl px-5 pt-5 pb-10 animate-slide-up overflow-y-auto"
        style={{ maxHeight: '80vh' }}>

        {enviado ? (
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <span className="text-5xl">🎉</span>
            <p className="font-black text-gray-900 dark:text-white text-xl">¡Postulación enviada!</p>
            <p className="text-gray-400 text-sm">La empresa va a revisar tu perfil y se va a contactar con vos.</p>
            <button onClick={onClose}
              className="mt-2 px-6 py-3 rounded-2xl bg-[var(--sc-500)] text-white font-black text-sm active:scale-95">
              Cerrar
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-black text-gray-800 dark:text-gray-100">Postularse</h2>
                <p className="text-xs text-gray-400">{empleo.titulo} — {empleo.empresa}</p>
              </div>
              <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                <XMarkIcon className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {requisitos.length === 0 ? (
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-4 mb-4">
                <p className="text-sm text-blue-700 dark:text-blue-300 font-bold">Esta oferta no tiene requisitos específicos.</p>
                <p className="text-xs text-blue-500 mt-1">Tu perfil se enviará directamente a la empresa.</p>
              </div>
            ) : (
              <div className="space-y-3 mb-4">
                <p className="text-sm font-black text-gray-700 dark:text-gray-300">Respondé las preguntas de la empresa:</p>
                {requisitos.map((r) => (
                  <div key={r.id} className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4 space-y-2">
                    <p className="text-sm text-gray-800 dark:text-gray-200 font-bold">{r.pregunta}</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setRespuestas((p) => ({ ...p, [r.id]: true }))}
                        className={`flex-1 py-2 rounded-xl text-sm font-black transition-all active:scale-95 ${
                          respuestas[r.id] === true
                            ? 'bg-green-500 text-white'
                            : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600'
                        }`}>
                        ✅ Sí
                      </button>
                      <button
                        onClick={() => setRespuestas((p) => ({ ...p, [r.id]: false }))}
                        className={`flex-1 py-2 rounded-xl text-sm font-black transition-all active:scale-95 ${
                          respuestas[r.id] === false
                            ? 'bg-red-500 text-white'
                            : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600'
                        }`}>
                        ❌ No
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {error && (
              <p className="text-red-500 text-xs flex items-center gap-1 mb-3">
                <ExclamationCircleIcon className="w-4 h-4 shrink-0" />{error}
              </p>
            )}

            <button onClick={handlePostular} disabled={enviando}
              className="w-full py-4 rounded-2xl bg-[var(--sc-600)] text-white font-black text-sm active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2">
              {enviando
                ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Enviando...</>
                : <>📩 Enviar postulación</>
              }
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ── Jobs principal ────────────────────────────────────────────────────────────
export default function Jobs() {
  const navigate = useNavigate();
  const [empleos,        setEmpleos]        = useState<Empleo[]>([]);
  const [cargando,       setCargando]       = useState(true);
  const [cargandoMas,    setCargandoMas]    = useState(false);
  const [hayMas,         setHayMas]         = useState(true);
  const [error,          setError]          = useState('');
  const [filtro,         setFiltro]         = useState('todos');
  const [busqueda,       setBusqueda]       = useState('');
  const [isMenuOpen,     setIsMenuOpen]     = useState(false);
  const [modalAbierto,   setModalAbierto]   = useState(false);
  const [empleoEditar,   setEmpleoEditar]   = useState<Empleo | null>(null);
  const [eliminandoId,   setEliminandoId]   = useState<string | null>(null);
  const [postulando,     setPostulando]     = useState<Empleo | null>(null);
  const [usuario,        setUsuario]        = useState<User | null>(null);
  const [accountType,    setAccountType]    = useState<string>('');
  const [yaPostulado,    setYaPostulado]    = useState<Set<string>>(new Set());
  const lastDocRef = useRef<QueryDocumentSnapshot<DocumentData> | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUsuario(u);
      if (u) {
        const snap = await getDoc(doc(db, 'users', u.uid));
        if (snap.exists()) setAccountType(snap.data().accountType ?? '');
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    setCargando(true); setEmpleos([]); lastDocRef.current = null; setHayMas(true);
    const q = query(collection(db, 'empleos'), orderBy('createdAt', 'desc'), limit(PAGE_SIZE));
    const unsub = onSnapshot(q,
      (snap) => {
        setEmpleos(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Empleo)));
        lastDocRef.current = snap.docs[snap.docs.length - 1] ?? null;
        setHayMas(snap.docs.length === PAGE_SIZE);
        setCargando(false);
      },
      (err) => { console.error('[Jobs]', err); setError('No se pudieron cargar los empleos.'); setCargando(false); }
    );
    return () => unsub();
  }, []);

  // Verificar postulaciones del usuario
  useEffect(() => {
    if (!usuario || empleos.length === 0) return;
    const checkPostulaciones = async () => {
      const nuevos = new Set<string>();
      await Promise.all(empleos.map(async (e) => {
        const q = query(
          collection(db, 'empleos', e.id, 'postulaciones'),
          where('uid', '==', usuario.uid)
        );
        const snap = await getDocs(q);
        if (!snap.empty) nuevos.add(e.id);
      }));
      setYaPostulado(nuevos);
    };
    checkPostulaciones();
  }, [usuario, empleos]);

  async function cargarMas() {
    if (!lastDocRef.current || cargandoMas || !hayMas) return;
    setCargandoMas(true);
    try {
      const q    = query(collection(db, 'empleos'), orderBy('createdAt', 'desc'), startAfter(lastDocRef.current), limit(PAGE_SIZE));
      const snap = await getDocs(q);
      const nuevos = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Empleo));
      setEmpleos((prev) => [...prev, ...nuevos]);
      lastDocRef.current = snap.docs[snap.docs.length - 1] ?? null;
      setHayMas(snap.docs.length === PAGE_SIZE);
    } catch (e) { console.error('[Jobs] cargarMas:', e); }
    finally { setCargandoMas(false); }
  }

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

  const esEmpresa = accountType === 'empresa';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-24">
      <header className="sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-5 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-[var(--sc-700)] dark:text-[var(--sc-100)] tracking-tighter">Empleos</h1>
            <p className="text-gray-400 dark:text-gray-500 text-xs">
              {cargando ? 'Cargando...' : `${empleosFiltrados.length} oferta${empleosFiltrados.length !== 1 ? 's' : ''} disponible${empleosFiltrados.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          {esEmpresa && (
            <button
              onClick={() => navigate('/mis-postulaciones')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-black active:scale-95"
            >
              <UserGroupIcon className="w-4 h-4" />
              Candidatos
            </button>
          )}
        </div>
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
            <button key={t} onClick={() => setFiltro(t)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-black transition-all active:scale-95 ${
                filtro === t
                  ? 'bg-[var(--sc-600)] text-white shadow-md'
                  : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700'
              }`}>
              {t.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pt-4 space-y-3">
        {cargando && (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-4 border-[var(--sc-600)] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-900/20 rounded-2xl text-red-600 text-sm">
            <ExclamationCircleIcon className="w-5 h-5 shrink-0" />{error}
          </div>
        )}

        {!cargando && !error && empleosFiltrados.length === 0 && (
          <div className="text-center py-16">
            <p className="text-5xl mb-3">💼</p>
            <p className="text-gray-500 dark:text-gray-400 font-bold">
              {busqueda ? `Sin resultados para "${busqueda}"` : 'No hay empleos disponibles'}
            </p>
          </div>
        )}

        {empleosFiltrados.map((empleo) => {
          const esMio       = usuario?.uid === empleo.uid;
          const postulado   = yaPostulado.has(empleo.id);
          const tieneReqs   = (empleo.requisitos?.length ?? 0) > 0;

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
                        <button onClick={() => navigate(`/mis-postulaciones?empleoId=${empleo.id}`)}
                          className="p-1.5 rounded-full bg-blue-50 dark:bg-blue-900/20 active:scale-90">
                          <ClipboardDocumentListIcon className="w-3.5 h-3.5 text-blue-500" />
                        </button>
                        <button onClick={() => { setEmpleoEditar(empleo); setModalAbierto(true); }}
                          className="p-1.5 rounded-full bg-blue-50 dark:bg-blue-900/20 active:scale-90">
                          <PencilIcon className="w-3.5 h-3.5 text-blue-500" />
                        </button>
                        <button onClick={() => setEliminandoId(eliminandoId === empleo.id ? null : empleo.id)}
                          className="p-1.5 rounded-full bg-red-50 dark:bg-red-900/20 active:scale-90">
                          <TrashIcon className="w-3.5 h-3.5 text-red-500" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {eliminandoId === empleo.id && (
                  <div className="mb-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-between">
                    <p className="text-xs text-red-700 font-bold">¿Eliminar esta oferta?</p>
                    <div className="flex gap-2">
                      <button onClick={() => handleEliminar(empleo)} className="text-xs bg-red-500 text-white px-3 py-1 rounded-full font-bold">Sí</button>
                      <button onClick={() => setEliminandoId(null)} className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 px-3 py-1 rounded-full font-bold">No</button>
                    </div>
                  </div>
                )}

                <p className="text-gray-600 dark:text-gray-400 text-xs leading-relaxed mb-3 line-clamp-2">{empleo.descripcion}</p>

                {tieneReqs && (
                  <div className="mb-3 flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400 font-bold">
                    <ClipboardDocumentListIcon className="w-3.5 h-3.5" />
                    {empleo.requisitos!.length} requisito{empleo.requisitos!.length !== 1 ? 's' : ''} para postularse
                  </div>
                )}

                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <MapPinIcon className="w-3.5 h-3.5 shrink-0" />{empleo.ubicacion}
                    </span>
                    {empleo.salario && (
                      <span className="flex items-center gap-1 text-green-600 dark:text-green-400 font-bold">
                        <CurrencyDollarIcon className="w-3.5 h-3.5 shrink-0" />{empleo.salario}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-auto">
                    {empleo.contacto && (
                      <a href={empleo.contacto.includes('@') ? `mailto:${empleo.contacto}` : `https://wa.me/${empleo.contacto.replace(/\D/g,'')}`}
                        target="_blank" rel="noreferrer"
                        className="flex items-center gap-1 text-xs text-[var(--sc-600)] font-bold active:scale-95">
                        <EnvelopeIcon className="w-3.5 h-3.5" />Contactar
                      </a>
                    )}
                    {usuario && !esMio && !esEmpresa && (
                      <button
                        onClick={() => !postulado && setPostulando(empleo)}
                        disabled={postulado}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all active:scale-95 ${
                          postulado
                            ? 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400'
                            : 'bg-[var(--sc-500)] text-white shadow-sm'
                        }`}>
                        {postulado ? '✅ Postulado' : '📩 Postularme'}
                      </button>
                    )}
                  </div>
                </div>
                {empleo.createdAt && (
                  <p className="text-[10px] text-gray-300 dark:text-gray-600 mt-2">{formatFecha(empleo.createdAt)}</p>
                )}
              </div>

              {empleo.mediaUrl && (
                empleo.mediaType === 'video'
                  ? <video src={empleo.mediaUrl} controls className="w-full max-h-56 object-cover bg-black" />
                  : <img src={empleo.mediaUrl} alt="Imagen del empleo" className="w-full max-h-56 object-cover" loading="lazy" />
              )}
            </article>
          );
        })}

        {hayMas && empleosFiltrados.length > 0 && !busqueda && filtro === 'todos' && (
          <button onClick={cargarMas} disabled={cargandoMas}
            className="w-full py-3 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-500 text-sm font-bold active:scale-95 disabled:opacity-50">
            {cargandoMas ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />Cargando...
              </span>
            ) : 'Ver más empleos'}
          </button>
        )}
      </div>

      {usuario && (
        <button onClick={() => { setEmpleoEditar(null); setModalAbierto(true); }}
          className="fixed bottom-24 right-5 z-40 w-14 h-14 rounded-full bg-[var(--sc-600)] text-white shadow-lg flex items-center justify-center active:scale-90">
          <PlusIcon className="w-7 h-7" />
        </button>
      )}

      {modalAbierto && (
        <ModalPublicar
          onClose={() => { setModalAbierto(false); setEmpleoEditar(null); }}
          empleoEditar={empleoEditar}
        />
      )}

      {postulando && (
        <ModalPostularse
          empleo={postulando}
          onClose={() => setPostulando(null)}
        />
      )}

      <Navbar onMenuClick={() => setIsMenuOpen(true)} />
      <Menu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </div>
  );
                                                              }
