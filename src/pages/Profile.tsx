import { useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../app/firebase';
import Navbar from '../components/Navbar';
import Menu from '../components/Menu';
import {
  UserCircleIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';

interface UserForm {
  name: string;
  title: string;
  bio: string;
  ciudad: string;
}

type StatusMsg = { tipo: 'exito' | 'error'; texto: string } | null;

export default function Profile() {
  const [user, setUser] = useState<User | null>(null);
  const [form, setForm] = useState<UserForm>({
    name: '',
    title: '',
    bio: '',
    ciudad: '',
  });
  const [fotoURL, setFotoURL] = useState<string>('');
  const [guardando, setGuardando] = useState<boolean>(false);
  const [status, setStatus] = useState<StatusMsg>(null);
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
   * Carga el perfil del usuario desde Firestore.
   */
  const loadProfile = async (uid: string): Promise<void> => {
    try {
      const snap = await getDoc(doc(db, 'users', uid));
      if (snap.exists()) {
        const data = snap.data();
        setForm({
          name: data.name || '',
          title: data.title || '',
          bio: data.bio || '',
          ciudad: data.ciudad || '',
        });
        if (data.photo) setFotoURL(data.photo);
      }
    } catch (e) {
      console.error('[Profile] Error al cargar perfil:', e);
      setStatus({ tipo: 'error', texto: 'No se pudo cargar tu perfil.' });
    }
  };

  /**
   * Guarda los cambios del perfil en Firestore sin sobreescribir
   * campos existentes como photo, createdAt o role.
   */
  const saveProfile = async (): Promise<void> => {
    if (!user) return;
    setGuardando(true);
    setStatus(null);

    try {
      await updateDoc(doc(db, 'users', user.uid), {
        ...form,
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
            <p className="font-black text-lg text-gray-900">
              {form.name || 'Tu nombre'}
            </p>
            <p className="text-sm text-gray-500">
              {form.title || 'Tu título profesional'}
            </p>
          </div>
        </div>

        {/* Formulario */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 space-y-4">
          <h2 className="font-black text-gray-800 text-base">Editar perfil</h2>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Nombre completo
            </label>
            <input
              type="text"
              placeholder="Ej: Juan Pérez"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Título profesional
            </label>
            <input
              type="text"
              placeholder="Ej: Desarrollador Web"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Ciudad
            </label>
            <input
              type="text"
              placeholder="Ej: Buenos Aires"
              value={form.ciudad}
              onChange={(e) => setForm({ ...form, ciudad: e.target.value })}
              className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Bio / Descripción
            </label>
            <textarea
              placeholder="Contá algo sobre vos..."
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              rows={4}
              className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
            />
          </div>

          {/* Mensaje de estado */}
          {status && (
            <div
              className={`flex items-center gap-2 p-3 rounded-2xl text-sm font-bold ${
                status.tipo === 'exito'
                  ? 'bg-green-50 text-green-700'
                  : 'bg-red-50 text-red-600'
              }`}
              role="alert"
            >
              {status.tipo === 'exito' ? (
                <CheckCircleIcon className="w-5 h-5 shrink-0" />
              ) : (
                <ExclamationCircleIcon className="w-5 h-5 shrink-0" />
              )}
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

        {/* Vista previa */}
        <div className="mt-4 bg-white rounded-3xl shadow-sm border border-gray-100 p-5">
          <h2 className="font-black text-gray-800 text-base mb-3">Vista previa</h2>
          <div className="flex items-center gap-3">
            <img
              src={avatarUrl}
              alt="Vista previa"
              className="w-14 h-14 rounded-full object-cover border-2 border-blue-100"
            />
            <div>
              <p className="font-black text-gray-900 text-sm">
                {form.name || 'Tu nombre'}
              </p>
              <p className="text-xs text-blue-600 font-bold">
                {form.title || 'Tu título'}
              </p>
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
