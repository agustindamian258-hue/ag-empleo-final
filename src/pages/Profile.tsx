// src/pages/Profile.tsx
import { useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../app/firebase';
import Navbar from '../components/Navbar';
import Menu from '../components/Menu';
import { useTheme, SocialColor } from '../context/ThemeContext';
import { CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';

interface UserForm { name: string; title: string; bio: string; ciudad: string; }
type StatusMsg = { tipo: 'exito' | 'error'; texto: string } | null;

const MAX_BIO = 300;

const COLORS: { id: SocialColor; bg: string; ring: string }[] = [
  { id: 'blue',   bg: 'bg-blue-500',   ring: 'ring-blue-500'   },
  { id: 'purple', bg: 'bg-purple-500', ring: 'ring-purple-500' },
  { id: 'rose',   bg: 'bg-rose-500',   ring: 'ring-rose-500'   },
  { id: 'green',  bg: 'bg-green-500',  ring: 'ring-green-500'  },
  { id: 'orange', bg: 'bg-orange-500', ring: 'ring-orange-500' },
  { id: 'teal',   bg: 'bg-teal-500',   ring: 'ring-teal-500'   },
];

export default function Profile() {
  const { socialColor, setSocialColor, darkMode, toggleDarkMode } = useTheme();
  const [user,        setUser]        = useState<User | null>(null);
  const [form,        setForm]        = useState<UserForm>({ name: '', title: '', bio: '', ciudad: '' });
  const [fotoURL,     setFotoURL]     = useState('');
  const [guardando,   setGuardando]   = useState(false);
  const [status,      setStatus]      = useState<StatusMsg>(null);
  const [menuAbierto, setMenuAbierto] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) { setFotoURL(u.photoURL || ''); loadProfile(u.uid); }
    });
    return () => unsub();
  }, []);

  const loadProfile = async (uid: string) => {
    try {
      const snap = await getDoc(doc(db, 'users', uid));
      if (snap.exists()) {
        const d = snap.data();
        setForm({ name: d.name || '', title: d.title || '', bio: d.bio || '', ciudad: d.ciudad || '' });
        if (d.photo) setFotoURL(d.photo);
      }
    } catch (e) {
      console.error('[Profile] load:', e);
    }
  };

  const saveProfile = async () => {
    if (!user) return;
    if (!form.name.trim()) { setStatus({ tipo: 'error', texto: 'El nombre es obligatorio.' }); return; }
    setGuardando(true); setStatus(null);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        name: form.name.trim(), title: form.title.trim(),
        bio: form.bio.trim(), ciudad: form.ciudad.trim(),
        updatedAt: serverTimestamp(),
      });
      setStatus({ tipo: 'exito', texto: '¡Perfil guardado!' });
    } catch (e) {
      console.error('[Profile] save:', e);
      setStatus({ tipo: 'error', texto: 'No se pudo guardar. Intentá de nuevo.' });
    } finally { setGuardando(false); }
  };

  const avatarUrl = fotoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(form.name || 'U')}&background=3b82f6&color=fff&size=128`;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-24">
      <Navbar onMenuClick={() => setMenuAbierto(true)} />
      <Menu isOpen={menuAbierto} onClose={() => setMenuAbierto(false)} />

      <div className="max-w-lg mx-auto px-4 pt-6 space-y-4">

        {/* Avatar */}
        <div className="flex flex-col items-center gap-3">
          <img src={avatarUrl} alt="foto" className="w-24 h-24 rounded-full border-4 border-[--sc-100] object-cover shadow-md" />
          <div className="text-center">
            <p className="font-black text-lg text-gray-900 dark:text-white">{form.name || 'Tu nombre'}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{form.title || 'Tu título profesional'}</p>
          </div>
        </div>

        {/* Selector de color zona Social */}
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

        {/* Dark mode toggle */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 p-5 flex items-center justify-between">
          <div>
            <p className="font-black text-gray-800 dark:text-white text-sm">Modo oscuro</p>
            <p className="text-xs text-gray-400">Aplica en toda la app</p>
          </div>
          <button
            onClick={toggleDarkMode}
            className={`relative w-12 h-6 rounded-full transition-colors ${darkMode ? 'bg-[--sc-500]' : 'bg-gray-200'}`}
            aria-label="toggle dark mode"
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${darkMode ? 'translate-x-6' : 'translate-x-0'}`} />
          </button>
        </div>

        {/* Formulario */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 p-5 space-y-4">
          <h2 className="font-black text-gray-800 dark:text-white text-base">Editar perfil</h2>

          {([
            { label: 'Nombre completo',    field: 'name'   as const, placeholder: 'Ej: Juan Pérez'        },
            { label: 'Título profesional', field: 'title'  as const, placeholder: 'Ej: Desarrollador Web' },
            { label: 'Ciudad',             field: 'ciudad' as const, placeholder: 'Ej: Buenos Aires'      },
          ]).map(({ label, field, placeholder }) => (
            <div key={field} className="space-y-1">
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{label}</label>
              <input
                type="text"
                placeholder={placeholder}
                value={form[field]}
                onChange={e => setForm({ ...form, [field]: e.target.value })}
                className="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[--sc-300]"
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
              onChange={e => { if (e.target.value.length <= MAX_BIO) setForm({ ...form, bio: e.target.value }); }}
              rows={4}
              maxLength={MAX_BIO}
              placeholder="Contá algo sobre vos..."
              className="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[--sc-300] resize-none"
            />
          </div>

          {status && (
            <div className={`flex items-center gap-2 p-3 rounded-2xl text-sm font-bold ${status.tipo === 'exito' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`} role="alert">
              {status.tipo === 'exito' ? <CheckCircleIcon className="w-5 h-5 shrink-0" /> : <ExclamationCircleIcon className="w-5 h-5 shrink-0" />}
              {status.texto}
            </div>
          )}

          <button
            onClick={saveProfile}
            disabled={guardando}
            className="w-full bg-[--sc-500] hover:bg-[--sc-600] text-white font-black py-4 rounded-2xl transition-colors disabled:opacity-60"
          >
            {guardando ? 'Guardando...' : 'Guardar perfil'}
          </button>
        </div>

        {/* Vista previa */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 p-5">
          <h2 className="font-black text-gray-800 dark:text-white text-base mb-3">Vista previa</h2>
          <div className="flex items-center gap-3">
            <img src={avatarUrl} alt="preview" className="w-14 h-14 rounded-full object-cover border-2 border-[--sc-100]" />
            <div>
              <p className="font-black text-gray-900 dark:text-white text-sm">{form.name || 'Tu nombre'}</p>
              <p className="text-xs text-[--sc-600] font-bold">{form.title || 'Tu título'}</p>
              <p className="text-xs text-gray-400">{form.ciudad}</p>
            </div>
          </div>
          {form.bio && <p className="text-sm text-gray-600 dark:text-gray-300 mt-3 leading-relaxed">{form.bio}</p>}
        </div>

      </div>
    </div>
  );
    }
