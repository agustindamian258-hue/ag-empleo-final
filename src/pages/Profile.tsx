import { useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../app/firebase';
import Navbar from '../components/Navbar';
import Menu   from '../components/Menu';
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface UserForm {
  name:   string;
  title:  string;
  bio:    string;
  ciudad: string;
}

type StatusMsg = { tipo: 'exito' | 'error'; texto: string } | null;

// ─── Constantes ───────────────────────────────────────────────────────────────

const MAX_BIO_LENGTH = 300;

// ─── Componente ───────────────────────────────────────────────────────────────

export default function Profile() {
  const [user,        setUser]        = useState<User | null>(null);
  const [form,        setForm]        = useState<UserForm>({ name: '', title: '', bio: '', ciudad: '' });
  const [fotoURL,     setFotoURL]     = useState<string>('');
  const [guardando,   setGuardando]   = useState<boolean>(false);
  const [status,      setStatus]      = useState<StatusMsg>(null);
  const [menuAbierto, setMenuAbierto] = useState<boolean>(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        setFotoURL(u.photoURL || '');
        loadProfile(u.uid);
      }
    });
    return () => unsub();
  }, []);

  /**
   * Carga el perfil desde Firestore.
   */
  const loadProfile = async (uid: string): Promise<void> => {
    try {
      const snap = await getDoc(doc(db, 'users', uid));
      if (snap.exists()) {
        const d = snap.data();
        setForm({
          name:   d.name   || '',
          title:  d.title  || '',
          bio:    d.bio    || '',
          ciudad: d.ciudad || '',
        });
        if (d.photo) setFotoURL(d.photo);
      }
    } catch (e) {
      console.error('[Profile] Error al cargar perfil:', e);
      setStatus({ tipo: 'error', texto: 'No se pudo cargar tu perfil.' });
    }
  };

  /**
   * Valida los campos antes de guardar.
   */
  const validarForm = (): string | null => {
    if (!form.name.trim())           return 'El nombre es obligatorio.';
    if (form.bio.length > MAX_BIO_LENGTH) return `La bio no puede superar los ${MAX_BIO_LENGTH} caracteres.`;
    return null;
  };

  /**
   * Guarda solo los campos editables del perfil, sin sobreescribir
   * photo, role ni createdAt.
   */
  const saveProfile = async (): Promise<void> => {
    if (!user) return;

    const errValidacion = validarForm();
    if (errValidacion) {
      setStatus({ tipo: 'error', texto: errValidacion });
      return;
    }

    setGuardando(true);
    setStatus(null);

    try {
      await updateDoc(doc(db, 'users', user.uid), {
        name:      form.name.trim(),
        title:     form.title.trim(),
        bio:       form.bio.trim(),
        ciudad:    form.ciudad.trim(),
        updatedAt: serverTimestamp(),
      });
      setStatus({ tipo: 'exito', texto: '¡Perfil guardado correctamente!' });
    } catch (e) {
      console.error('[Profile] Error al guardar perfil:', e);
      setStatus({ tipo: 'error', texto: 'No se pudo guardar. Intentá de nuevo.' });
    } finally {
      setGuardando(false);
    }
  };

  const avatarUrl =
    fotoURL ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(form.name || 'U')}&background=3b82f6&color=fff&size=128`;

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <Navbar onMenuClick={() => setMenuAbierto(true)} />
      <Menu isOpen={menuAbierto} onClose={() => setMenuAbierto(false)} />

      <div className="max-w-lg mx-auto px-4 pt-6">

        {/* Avatar y nombre */}
        <div className="flex flex-col items-center gap-3 mb-6">
          <img
            src={avatarUrl}
            alt={`Foto de ${form.name || 'usuario'}`}
            className="w-24 h-24 rounded-full border-4 border-blue-100 object-cover shadow-md"
          />
          <div className="text-center">
            <p className="font-black text-lg text-gray-900">{form.name || 'Tu nombre'}</p>
            <p className="text-sm text-gray-500">{form.title || 'Tu título profesional'}</p>
          </div>
        </div>

        {/* Formulario */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 space-y-4">
          <h2 className="font-black text-gray-800 text-base">Editar perfil</h2>

          {[
            { label: 'Nombre completo',    field: 'name'   as const, placeholder: 'Ej: Juan Pérez'        },
            { label: 'Título profesional', field: 'title'  as const, placeholder: 'Ej: Desarrollador Web' },
            { label: 'Ciudad',             field: 'ciudad' as const, placeholder: 'Ej: Buenos Aires'      },
          ].map(({ label, field, placeholder }) => (
            <div key={field} className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                {label}
              </label>
              <input
                type="text"
                placeholder={placeholder}
                value={form[field]}
                onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>
          ))}

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex justify-between">
              <span>Bio / Descripción</span>
              <span className={`normal-case font-normal ${form.bio.length >= MAX_BIO_LENGTH ? 'text-red-400' : 'text-gray-300'}`}>
                {form.bio.length}/{MAX_BIO_LENGTH}
              </span>
            </label>
            <textarea
              placeholder="Contá algo sobre vos..."
              value={form.bio}
              onChange={(e) => {
                if (e.target.value.length <= MAX_BIO_LENGTH) {
                  setForm({ ...form, bio: e.target.value });
                }
              }}
              rows={4}
              maxLength={MAX_BIO_LENGTH}
              className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
            />
          </div>

          {/* Estado del guardado */}
          {status && (
            <div
              className={`flex items-center gap-2 p-3 rounded-2xl text-sm font-bold ${
                status.tipo === 'exito'
                  ? 'bg-green-50 text-green-700'
                  : 'bg-red-50 text-red-600'
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

          <button
            onClick={saveProfile}
            disabled={guardando}
            className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl active:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {guardando ? 'Guardando...' : 'Guardar perfil'}
          </button>
        </div>

        {/* Vista previa de la tarjeta */}
        <div className="mt-4 bg-white rounded-3xl shadow-sm border border-gray-100 p-5">
          <h2 className="font-black text-gray-800 text-base mb-3">Vista previa</h2>
          <div className="flex items-center gap-3">
            <img
              src={avatarUrl}
              alt="Vista previa del perfil"
              className="w-14 h-14 rounded-full object-cover border-2 border-blue-100"
            />
            <div>
              <p className="font-black text-gray-900 text-sm">{form.name   || 'Tu nombre'}</p>
              <p className="text-xs text-blue-600 font-bold">{form.title  || 'Tu título'}</p>
              <p className="text-xs text-gray-400">{form.ciudad}</p>
            </div>
          </div>
          {form.bio && (
            <p className="text-sm text-gray-600 mt-3 leading-relaxed">{form.bio}</p>
          )}
        </div>
      </div>
    </div>
  );
}
