import { useState, useEffect, useRef } from 'react';
import { auth, db, storage } from '../app/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import {
  PencilIcon,
  CheckIcon,
  ArrowLeftOnRectangleIcon,
  CameraIcon,
} from '@heroicons/react/24/outline';

interface FormData {
  name: string;
  title: string;
  bio: string;
  ciudad: string;
  photo: string;
}

export default function Profile() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    title: '',
    bio: '',
    ciudad: '',
    photo: '',
  });
  const fileRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const snap = await getDoc(doc(db, 'users', currentUser.uid));
        if (snap.exists()) {
          const data = snap.data();
          setFormData({
            name: data.name || currentUser.displayName || '',
            title: data.title || '',
            bio: data.bio || '',
            ciudad: data.ciudad || '',
            photo: data.photo || currentUser.photoURL || '',
          });
        } else {
          setFormData({
            name: currentUser.displayName || '',
            title: '',
            bio: '',
            ciudad: '',
            photo: currentUser.photoURL || '',
          });
        }
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const sRef = ref(storage, `avatars/${user.uid}`);
    await uploadBytes(sRef, file);
    const url = await getDownloadURL(sRef);
    setFormData(prev => ({ ...prev, photo: url }));
  };

  const handleSave = async () => {
    if (!user) return;
    setGuardando(true);
    try {
      await setDoc(doc(db, 'users', user.uid), {
        ...formData,
        email: user.email,
        updatedAt: new Date(),
      }, { merge: true });
      setGuardado(true);
      setTimeout(() => setGuardado(false), 3000);
    } catch (error) {
      console.error('Error al guardar:', error);
    } finally {
      setGuardando(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <header className="sticky top-0 z-30 bg-white border-b border-gray-100 px-5 py-4 shadow-sm">
        <h1 className="text-2xl font-black text-blue-800 tracking-tighter">Mi Perfil</h1>
        <p className="text-gray-400 text-xs">Tu información profesional</p>
      </header>

      <div className="px-4 pt-6 space-y-4">

        {/* FOTO DE PERFIL */}
        <div className="flex flex-col items-center gap-3 py-4">
          <div className="relative">
            <img
              src={formData.photo || `https://ui-avatars.com/api/?name=${formData.name}&size=100`}
              className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
            />
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute bottom-0 right-0 bg-blue-600 w-8 h-8 rounded-full flex items-center justify-center border-2 border-white shadow"
            >
              <CameraIcon className="w-4 h-4 text-white" />
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleFoto}
              className="hidden"
            />
          </div>
          <div className="text-center">
            <p className="font-black text-gray-800 text-lg">{formData.name || 'Tu nombre'}</p>
            <p className="text-gray-400 text-sm">{formData.title || 'Tu título profesional'}</p>
          </div>
        </div>

        {/* FORMULARIO */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Información personal</p>

          {[
            { key: 'name', label: 'Nombre completo', placeholder: 'Tu nombre' },
            { key: 'title', label: 'Título profesional', placeholder: 'Ej: Vendedor, Electricista, Diseñador' },
            { key: 'ciudad', label: 'Ciudad', placeholder: 'Ej: Buenos Aires, Córdoba...' },
          ].map(f => (
            <div key={f.key}>
              <label className="text-xs font-bold text-gray-500 mb-1 block">{f.label}</label>
              <input
                type="text"
                value={formData[f.key as keyof FormData]}
                onChange={e => setFormData({ ...formData, [f.key]: e.target.value })}
                placeholder={f.placeholder}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400 transition-colors"
              />
            </div>
          ))}

          <div>
            <label className="text-xs font-bold text-gray-500 mb-1 block">Sobre mí</label>
            <textarea
              value={formData.bio}
              onChange={e => setFormData({ ...formData, bio: e.target.value })}
              placeholder="Contá quién sos, qué sabés hacer, qué buscás..."
              rows={4}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400 transition-colors resize-none"
            />
          </div>
        </div>

        {/* BOTÓN GUARDAR */}
        <button
          onClick={handleSave}
          disabled={guardando}
          className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-base transition-all active:scale-95 disabled:opacity-60 ${
            guardado ? 'bg-green-500 text-white' : 'bg-blue-600 text-white'
          }`}
        >
          {guardado ? (
            <><CheckIcon className="w-5 h-5" /> ¡Guardado!</>
          ) : (
            <><PencilIcon className="w-5 h-5" /> {guardando ? 'Guardando...' : 'Guardar cambios'}</>
          )}
        </button>

        {/* CERRAR SESIÓN */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-base bg-red-50 text-red-500 border border-red-100 active:scale-95 transition-transform"
        >
          <ArrowLeftOnRectangleIcon className="w-5 h-5" />
          Cerrar sesión
        </button>

      </div>

      <Navbar onMenuClick={() => setIsMenuOpen(true)} />
    </div>
  );
}
