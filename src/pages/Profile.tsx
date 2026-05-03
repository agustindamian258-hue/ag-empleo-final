// src/pages/Profile.tsx
import { useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, updateDoc, serverTimestamp, collection, query, where, onSnapshot } from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '../app/firebase';
import { useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Menu from '../components/Menu';
import { useTheme, SocialColor } from '../context/ThemeContext';
import {
  CheckCircleIcon, ExclamationCircleIcon,
  CameraIcon, HeartIcon, DocumentTextIcon,
} from '@heroicons/react/24/outline';

interface UserForm {
  name:             string;
  title:            string;
  bio:              string;
  ciudad:           string;
  cargoDeseado:     string;
  nivelExperiencia: string;
  disponible:       boolean;
  salarioEsperado:  string;
}

interface Post {
  id: string; text: string; mediaUrl: string;
  mediaType: string; likes: string[];
  createdAt: { toDate: () => Date } | null;
}

type StatusMsg = { tipo: 'exito' | 'error'; texto: string } | null;
type TabId     = 'social' | 'empleo';

const MAX_BIO      = 300;
const MAX_PHOTO_MB = 5;

const NIVELES = [
  'Sin experiencia',
  'Junior (0-2 años)',
  'Semi-Senior (2-5 años)',
  'Senior (5+ años)',
];

const COLORS: { id: SocialColor; bg: string; ring: string }[] = [
  { id: 'blue',   bg: 'bg-blue-500',   ring: 'ring-blue-500'   },
  { id: 'purple', bg: 'bg-purple-500', ring: 'ring-purple-500' },
  { id: 'rose',   bg: 'bg-rose-500',   ring: 'ring-rose-500'   },
  { id: 'green',  bg: 'bg-green-500',  ring: 'ring-green-500'  },
  { id: 'orange', bg: 'bg-orange-500', ring: 'ring-orange-500' },
  { id: 'teal',   bg: 'bg-teal-500',   ring: 'ring-teal-500'   },
];

export default function Profile() {
  const { socialColor, setSocialColor } = useTheme();
  const location = useLocation();

  // Lee la zona enviada desde Menu.tsx via navigate(path, { state: { zona } })
  // Si no hay state (acceso directo a /profile), default 'empleo'
  const zonaInicial: TabId =
    (location.state as { zona?: TabId } | null)?.zona ?? 'empleo';

  const [user,         setUser]         = useState<User | null>(null);
  const [form,         setForm]         = useState<UserForm>({
    name: '', title: '', bio: '', ciudad: '',
    cargoDeseado: '', nivelExperiencia: 'Junior (0-2 años)',
    disponible: true, salarioEsperado: '',
  });
  const [fotoURL,      setFotoURL]      = useState('');
  const [guardando,    setGuardando]    = useState(false);
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [status,       setStatus]       = useState<StatusMsg>(null);
  const [menuAbierto,  setMenuAbierto]  = useState(false);
  const [misPosts,     setMisPosts]     = useState<Post[]>([]);
  const [totalLikes,   setTotalLikes]   = useState(0);
  const [seguidores,   setSeguidores]   = useState(0);
  const [siguiendo,    setSiguiendo]    = useState(0);
  const [tabActiva,    setTabActiva]    = useState<TabId>(zonaInicial);

  // Si el usuario navega al perfil desde otra zona sin recargar, sincroniza el tab
  useEffect(() => {
    const zona = (location.state as { zona?: TabId } | null)?.zona;
    if (zona) setTabActiva(zona);
  }, [location.state]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        loadProfile(u.uid);
        loadMisPosts(u.uid);
        loadFollowStats(u.uid);
        setFotoURL(u.photoURL || '');
      }
    });
    return () => unsub();
  }, []);

  const loadProfile = async (uid: string) => {
    try {
      const snap = await getDoc(doc(db, 'users', uid));
      if (snap.exists()) {
        const d = snap.data();
        setForm({
          name:             d.name             || '',
          title:            d.title            || '',
          bio:              d.bio              || '',
          ciudad:           d.ciudad           || '',
          cargoDeseado:     d.cargoDeseado     || '',
          nivelExperiencia: d.nivelExperiencia || 'Junior (0-2 años)',
          disponible:       d.disponible       ?? true,
          salarioEsperado:  d.salarioEsperado  || '',
        });
        if (d.photo) setFotoURL(d.photo);
      }
    } catch (e) { console.error('[Profile] load:', e); }
  };

  const loadMisPosts = (uid: string) => {
    const q = query(collection(db, 'posts'), where('userId', '==', uid));
    onSnapshot(q, (snap) => {
      const posts = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Post));
      setMisPosts(posts);
      setTotalLikes(posts.reduce((acc, p) => acc + (p.likes?.length || 0), 0));
    });
  };

  const loadFollowStats = (uid: string) => {
    const qSeg = query(collection(db, 'follows'), where('followingId', '==', uid));
    onSnapshot(qSeg, (snap) => setSeguidores(snap.size));
    const qSig = query(collection(db, 'follows'), where('followerId', '==', uid));
    onSnapshot(qSig, (snap) => setSiguiendo(snap.size));
  };

  async function handleFotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f || !user) return;
    if (!f.type.startsWith('image/')) return;
    if (f.size > MAX_PHOTO_MB * 1024 * 1024) {
      setStatus({ tipo: 'error', texto: `La foto no puede superar ${MAX_PHOTO_MB}MB.` });
      return;
    }
    setSubiendoFoto(true);
    try {
      const sRef = storageRef(storage, `avatars/${user.uid}`);
      await uploadBytes(sRef, f);
      const url = await getDownloadURL(sRef);
      setFotoURL(url);
      await updateDoc(doc(db, 'users', user.uid), { photo: url, updatedAt: serverTimestamp() });
    } catch (e) {
      console.error('[Profile] foto upload:', e);
      setStatus({ tipo: 'error', texto: 'No se pudo subir la foto.' });
    } finally { setSubiendoFoto(false); }
  }

  const saveProfile = async () => {
    if (!user) return;
    if (!form.name.trim()) {
      setStatus({ tipo: 'error', texto: 'El nombre es obligatorio.' });
      return;
    }
    setGuardando(true); setStatus(null);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        name:             form.name.trim(),
        title:            form.title.trim(),
        bio:              form.bio.trim(),
        ciudad:           form.ciudad.trim(),
        cargoDeseado:     form.cargoDeseado.trim(),
        nivelExperiencia: form.nivelExperiencia,
        disponible:       form.disponible,
        salarioEsperado:  form.salarioEsperado.trim(),
        updatedAt:        serverTimestamp(),
      });
      setStatus({ tipo: 'exito', texto: '¡Perfil guardado!' });
    } catch (e) {
      console.error('[Profile] save:', e);
      setStatus({ tipo: 'error', texto: 'No se pudo guardar. Intentá de nuevo.' });
    } finally { setGuardando(false); }
  };

  const avatarUrl = fotoURL ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(form.name || 'U')}&background=${
      tabActiva === 'social' ? '7c3aed' : '3b82f6'
    }&color=fff&size=128`;

  const inputCls = 'w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[--sc-300]';

  // Colores del header de perfil según zona activa
  const headerGradient = tabActiva === 'social'
    ? 'from-purple-600 to-purple-800'
    : 'from-blue-600 to-blue-800';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-24">
      <Navbar onMenuClick={() => setMenuAbierto(true)} />
      <Menu isOpen={menuAbierto} onClose={() => setMenuAbierto(false)} />

      <div className="max-w-lg mx-auto px-4 pt-6 space-y-4">

        {/* Banner de zona activa */}
        <div className={`bg-gradient-to-r ${headerGradient} rounded-3xl p-4 text-white text-center`}>
          <p className="text-xs font-black uppercase tracking-widest opacity-75 mb-0.5">
            Perfil activo
          </p>
          <p className="text-lg font-black">
            {tabActiva === 'social' ? '🌐 Zona Social' : '💼 Zona Empleo'}
          </p>
        </div>

        {/* Avatar */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <img
              src={avatarUrl}
              alt="foto de perfil"
              className="w-24 h-24 rounded-full border-4 border-[--sc-100] object-cover shadow-md"
            />
            <label className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[var(--sc-600)] flex items-center justify-center cursor-pointer ring-2 ring-white dark:ring-gray-950 active:scale-90 transition-transform">
              {subiendoFoto
                ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <CameraIcon className="w-4 h-4 text-white" />
              }
              <input type="file" accept="image/*" onChange={handleFotoUpload} className="hidden" disabled={subiendoFoto} />
            </label>
          </div>
          <div className="text-center">
            <p className="font-black text-lg text-gray-900 dark:text-white">{form.name || 'Tu nombre'}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{form.title || 'Tu título profesional'}</p>
            {form.ciudad && <p className="text-xs text-gray-400 dark:text-gray-500">📍 {form.ciudad}</p>}
          </div>

          {/* Stats */}
          <div className="flex gap-6">
            <div className="flex flex-col items-center">
              <span className="font-black text-lg text-gray-900 dark:text-white">{misPosts.length}</span>
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <DocumentTextIcon className="w-3.5 h-3.5" /> Posts
              </span>
            </div>
            <div className="w-px bg-gray-200 dark:bg-gray-700" />
            <div className="flex flex-col items-center">
              <span className="font-black text-lg text-gray-900 dark:text-white">{seguidores}</span>
              <span className="text-xs text-gray-400">Seguidores</span>
            </div>
            <div className="w-px bg-gray-200 dark:bg-gray-700" />
            <div className="flex flex-col items-center">
              <span className="font-black text-lg text-gray-900 dark:text-white">{siguiendo}</span>
              <span className="text-xs text-gray-400">Siguiendo</span>
            </div>
            <div className="w-px bg-gray-200 dark:bg-gray-700" />
            <div className="flex flex-col items-center">
              <span className="font-black text-lg text-gray-900 dark:text-white">{totalLikes}</span>
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <HeartIcon className="w-3.5 h-3.5" /> Likes
              </span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-2xl">
          {(['social', 'empleo'] as TabId[]).map((t) => (
            <button
              key={t}
              onClick={() => setTabActiva(t)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-black transition-all ${
                tabActiva === t
                  ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              {t === 'social' ? '🌐 Social' : '💼 Empleo'}
            </button>
          ))}
        </div>

        {/* ── Tab Social ──────────────────────────────────────────────────── */}
        {tabActiva === 'social' && (
          <>
            {/* Color */}
            <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 p-5">
              <h2 className="font-black text-gray-800 dark:text-white text-base mb-3">Color zona Social</h2>
              <div className="flex gap-3 justify-center">
                {COLORS.map(({ id, bg, ring }) => (
                  <button
                    key={id}
                    onClick={() => setSocialColor(id)}
                    className={`w-9 h-9 rounded-full ${bg} transition-transform active:scale-90 ${
                      socialColor === id ? `ring-2 ring-offset-2 ${ring}` : ''
                    }`}
                    aria-label={id}
                  />
                ))}
              </div>
            </div>

            {/* Formulario social */}
            <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 p-5 space-y-4">
              <h2 className="font-black text-gray-800 dark:text-white text-base">Editar perfil social</h2>
              {([
                { label: 'Nombre completo',    field: 'name'   as const, placeholder: 'Ej: Juan Pérez'        },
                { label: 'Título profesional', field: 'title'  as const, placeholder: 'Ej: Desarrollador Web' },
                { label: 'Ciudad',             field: 'ciudad' as const, placeholder: 'Ej: Buenos Aires'      },
              ]).map(({ label, field, placeholder }) => (
                <div key={field} className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {label}
                  </label>
                  <input
                    type="text"
                    placeholder={placeholder}
                    value={form[field] as string}
                    onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                    className={inputCls}
                  />
                </div>
              ))}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex justify-between">
                  <span>Bio</span>
                  <span className={`normal-case font-normal ${form.bio.length >= MAX_BIO ? 'text-red-400' : 'text-gray-300'}`}>
                    {form.bio.length}/{MAX_BIO}
                  </span>
                </label>
                <textarea
                  value={form.bio}
                  onChange={(e) => { if (e.target.value.length <= MAX_BIO) setForm({ ...form, bio: e.target.value }); }}
                  rows={4}
                  maxLength={MAX_BIO}
                  placeholder="Contá algo sobre vos..."
                  className={`${inputCls} resize-none`}
                />
              </div>
            </div>
          </>
        )}

        {/* ── Tab Empleo ──────────────────────────────────────────────────── */}
        {tabActiva === 'empleo' && (
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 p-5 space-y-4">
            <h2 className="font-black text-gray-800 dark:text-white text-base">Perfil de empleo</h2>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Cargo deseado
              </label>
              <input
                type="text"
                placeholder="Ej: Operario, Vendedor, Programador"
                value={form.cargoDeseado}
                onChange={(e) => setForm({ ...form, cargoDeseado: e.target.value })}
                className={inputCls}
                maxLength={80}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Nivel de experiencia
              </label>
              <div className="flex flex-col gap-2">
                {NIVELES.map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setForm({ ...form, nivelExperiencia: n })}
                    className={`text-left px-4 py-3 rounded-2xl text-sm font-bold border transition-all active:scale-95 ${
                      form.nivelExperiencia === n
                        ? 'bg-[var(--sc-100)] dark:bg-[var(--sc-700)]/20 border-[var(--sc-500)] text-[var(--sc-700)] dark:text-[var(--sc-100)]'
                        : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Expectativa salarial (opcional)
              </label>
              <input
                type="text"
                placeholder="Ej: $500.000 - Negociable"
                value={form.salarioEsperado}
                onChange={(e) => setForm({ ...form, salarioEsperado: e.target.value })}
                className={inputCls}
                maxLength={60}
              />
            </div>

            {/* Disponible para trabajar */}
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
              <div>
                <p className="font-black text-gray-800 dark:text-white text-sm">Disponible para trabajar</p>
                <p className="text-xs text-gray-400">Visible en tu perfil público</p>
              </div>
              <button
                onClick={() => setForm({ ...form, disponible: !form.disponible })}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  form.disponible ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                  form.disponible ? 'translate-x-6' : 'translate-x-0'
                }`} />
              </button>
            </div>
          </div>
        )}

        {/* Status */}
        {status && (
          <div
            className={`flex items-center gap-2 p-3 rounded-2xl text-sm font-bold ${
              status.tipo === 'exito' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
            }`}
            role="alert"
          >
            {status.tipo === 'exito'
              ? <CheckCircleIcon      className="w-5 h-5 shrink-0" />
              : <ExclamationCircleIcon className="w-5 h-5 shrink-0" />
            }
            {status.texto}
          </div>
        )}

        {/* Guardar */}
        <button
          onClick={saveProfile}
          disabled={guardando}
          className="w-full bg-[--sc-500] hover:bg-[--sc-600] text-white font-black py-4 rounded-2xl transition-colors disabled:opacity-60"
        >
          {guardando ? 'Guardando...' : 'Guardar perfil'}
        </button>

        {/* Mis publicaciones */}
        {misPosts.length > 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 p-5">
            <h2 className="font-black text-gray-800 dark:text-white text-base mb-3">Mis publicaciones</h2>
            <div className="grid grid-cols-3 gap-1.5">
              {misPosts.map((p) => (
                <div key={p.id} className="aspect-square rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 relative">
                  {p.mediaUrl ? (
                    p.mediaType === 'video'
                      ? <video src={p.mediaUrl} className="w-full h-full object-cover" />
                      : <img src={p.mediaUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center p-2">
                      <p className="text-[10px] text-gray-400 text-center line-clamp-4">{p.text}</p>
                    </div>
                  )}
                  {p.likes?.length > 0 && (
                    <div className="absolute bottom-1 right-1 flex items-center gap-0.5 bg-black/50 rounded-full px-1.5 py-0.5">
                      <HeartIcon className="w-3 h-3 text-white" />
                      <span className="text-[9px] text-white font-bold">{p.likes.length}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
