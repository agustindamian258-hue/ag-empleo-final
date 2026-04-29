// src/pages/Onboarding.tsx
import { useState } from 'react';
import { auth, db } from '../app/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';

const NIVELES = ['Sin experiencia', 'Junior (0-2 años)', 'Semi-Senior (2-5 años)', 'Senior (5+ años)'];

const PASOS = [
  { id: 1, titulo: '👋 ¡Bienvenido a AG Empleo!',  subtitulo: 'Tu app argentina de empleo y red social profesional.' },
  { id: 2, titulo: '👤 Contanos sobre vos',         subtitulo: 'Completá tu perfil básico.' },
  { id: 3, titulo: '💼 Tu perfil laboral',           subtitulo: 'Para que las empresas te encuentren.' },
  { id: 4, titulo: '🎉 ¡Todo listo!',                subtitulo: 'Ya podés empezar a usar AG Empleo.' },
];

export default function Onboarding() {
  const user     = auth.currentUser;
  const navigate = useNavigate();

  const [paso,      setPaso]      = useState(1);
  const [guardando, setGuardando] = useState(false);
  const [error,     setError]     = useState('');
  const [form,      setForm]      = useState({
    name:             user?.displayName || '',
    ciudad:           '',
    bio:              '',
    cargoDeseado:     '',
    nivelExperiencia: 'Junior (0-2 años)',
    disponible:       true,
    salarioEsperado:  '',
  });

  const inputCls = 'w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-white rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[--sc-500] placeholder-gray-400';

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  }

  function siguiente() {
    setError('');
    if (paso === 2 && !form.name.trim()) {
      setError('El nombre es obligatorio.'); return;
    }
    setPaso((p) => p + 1);
  }

  async function finalizar() {
    if (!user) return;
    setGuardando(true); setError('');
    try {
      await setDoc(doc(db, 'users', user.uid), {
        name:             form.name.trim(),
        ciudad:           form.ciudad.trim(),
        bio:              form.bio.trim(),
        cargoDeseado:     form.cargoDeseado.trim(),
        nivelExperiencia: form.nivelExperiencia,
        disponible:       form.disponible,
        salarioEsperado:  form.salarioEsperado.trim(),
        photo:            user.photoURL || '',
        onboardingDone:   true,
        createdAt:        serverTimestamp(),
      });
      navigate('/', { replace: true });
    } catch (e) {
      console.error('[Onboarding]', e);
      setError('No se pudo guardar. Intentá de nuevo.');
    } finally { setGuardando(false); }
  }

  const progreso = ((paso - 1) / (PASOS.length - 1)) * 100;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">

      {/* Barra de progreso */}
      <div className="h-1.5 bg-gray-200 dark:bg-gray-800">
        <div
          className="h-full bg-[--sc-500] transition-all duration-500"
          style={{ width: `${progreso}%` }}
        />
      </div>

      <div className="flex-1 flex flex-col max-w-lg mx-auto w-full px-5 py-8">

        {/* Header del paso */}
        <div className="mb-8">
          <p className="text-xs text-gray-400 dark:text-gray-500 font-bold mb-1">
            Paso {paso} de {PASOS.length}
          </p>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white leading-tight">
            {PASOS[paso - 1].titulo}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            {PASOS[paso - 1].subtitulo}
          </p>
        </div>

        {/* Paso 1 — Bienvenida */}
        {paso === 1 && (
          <div className="flex-1 flex flex-col gap-5">
            <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-6 space-y-4">
              <div className="flex items-center gap-4">
                <span className="text-4xl">🗺️</span>
                <div>
                  <p className="font-black text-gray-800 dark:text-white">Mapa de Changas</p>
                  <p className="text-xs text-gray-400">Encontrá trabajo cerca tuyo</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-4xl">💼</span>
                <div>
                  <p className="font-black text-gray-800 dark:text-white">Ofertas de Empleo</p>
                  <p className="text-xs text-gray-400">Full-time, part-time y remoto</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-4xl">🌐</span>
                <div>
                  <p className="font-black text-gray-800 dark:text-white">Zona Social</p>
                  <p className="text-xs text-gray-400">Conectate con otros profesionales</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-4xl">📄</span>
                <div>
                  <p className="font-black text-gray-800 dark:text-white">Generador de CV</p>
                  <p className="text-xs text-gray-400">Creá tu CV profesional gratis</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Paso 2 — Perfil básico */}
        {paso === 2 && (
          <div className="flex-1 space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nombre completo *</label>
              <input name="name" value={form.name} onChange={handleChange} placeholder="Ej: Juan Pérez" className={inputCls} maxLength={60} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ciudad</label>
              <input name="ciudad" value={form.ciudad} onChange={handleChange} placeholder="Ej: Buenos Aires" className={inputCls} maxLength={60} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Bio (opcional)</label>
              <textarea name="bio" value={form.bio} onChange={handleChange} placeholder="Contá algo sobre vos..." rows={3} className={`${inputCls} resize-none`} maxLength={300} />
            </div>
          </div>
        )}

        {/* Paso 3 — Perfil laboral */}
        {paso === 3 && (
          <div className="flex-1 space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Cargo deseado</label>
              <input name="cargoDeseado" value={form.cargoDeseado} onChange={handleChange} placeholder="Ej: Operario, Vendedor, Programador" className={inputCls} maxLength={80} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nivel de experiencia</label>
              <div className="flex flex-col gap-2">
                {NIVELES.map((n) => (
                  <button key={n} type="button"
                    onClick={() => setForm((p) => ({ ...p, nivelExperiencia: n }))}
                    className={`text-left px-4 py-3 rounded-2xl text-sm font-bold border transition-all active:scale-95 ${
                      form.nivelExperiencia === n
                        ? 'bg-[var(--sc-100)] dark:bg-[var(--sc-700)]/20 border-[var(--sc-500)] text-[var(--sc-700)] dark:text-[var(--sc-100)]'
                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Expectativa salarial (opcional)</label>
              <input name="salarioEsperado" value={form.salarioEsperado} onChange={handleChange} placeholder="Ej: $500.000 - Negociable" className={inputCls} maxLength={60} />
            </div>
            <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
              <div>
                <p className="font-black text-gray-800 dark:text-white text-sm">Disponible para trabajar</p>
                <p className="text-xs text-gray-400">Visible en tu perfil público</p>
              </div>
              <button
                onClick={() => setForm((p) => ({ ...p, disponible: !p.disponible }))}
                className={`relative w-12 h-6 rounded-full transition-colors ${form.disponible ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${form.disponible ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>
        )}

        {/* Paso 4 — Listo */}
        {paso === 4 && (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 text-center">
            <div className="w-24 h-24 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircleIcon className="w-14 h-14 text-green-500" />
            </div>
            <div>
              <p className="text-xl font-black text-gray-900 dark:text-white">¡Tu perfil está listo!</p>
              <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
                Hola {form.name || 'bienvenido'}, ya podés explorar todas las funciones de AG Empleo.
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-2xl text-red-600 dark:text-red-400 text-sm font-bold">
            <ExclamationCircleIcon className="w-5 h-5 shrink-0" />
            {error}
          </div>
        )}

        {/* Botones */}
        <div className="mt-6 flex gap-3">
          {paso > 1 && (
            <button
              onClick={() => setPaso((p) => p - 1)}
              className="flex-1 py-4 rounded-2xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-black text-sm active:scale-95 transition-all"
            >
              Atrás
            </button>
          )}
          {paso < PASOS.length ? (
            <button
              onClick={siguiente}
              className="flex-1 py-4 rounded-2xl bg-[--sc-500] text-white font-black text-sm active:scale-95 transition-all"
            >
              Siguiente
            </button>
          ) : (
            <button
              onClick={finalizar}
              disabled={guardando}
              className="flex-1 py-4 rounded-2xl bg-green-500 hover:bg-green-600 text-white font-black text-sm active:scale-95 transition-all disabled:opacity-50"
            >
              {guardando ? 'Guardando...' : '¡Empezar!'}
            </button>
          )}
        </div>

      </div>
    </div>
  );
        }
