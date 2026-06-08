// src/pages/Onboarding.tsx
import { useState, useEffect } from 'react';
import { auth, db } from '../app/firebase';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';

type AccountType = 'persona' | 'empresa';

const NIVELES = ['Sin experiencia', 'Junior (0-2 años)', 'Semi-Senior (2-5 años)', 'Senior (5+ años)'];

interface OnboardingProps {
  onDone?: () => void;
}

export default function Onboarding({ onDone }: OnboardingProps) {
  const user     = auth.currentUser;
  const navigate = useNavigate();

  const [paso,          setPaso]          = useState(1);
  const [guardando,     setGuardando]     = useState(false);
  const [error,         setError]         = useState('');
  const [accountType,   setAccountType]   = useState<AccountType | null>(null);
  const [usuarioExiste, setUsuarioExiste] = useState(false);
  const [verificando,   setVerificando]   = useState(true);

  const [formPersona, setFormPersona] = useState({
    name:             user?.displayName || '',
    ciudad:           '',
    bio:              '',
    cargoDeseado:     '',
    nivelExperiencia: 'Junior (0-2 años)',
    disponible:       true,
    salarioEsperado:  '',
  });

  const [formEmpresa, setFormEmpresa] = useState({
    name:          user?.displayName || '',
    nombreEmpresa: '',
    ciudad:        '',
    rubro:         '',
    descripcion:   '',
    sitioWeb:      '',
    contacto:      '',
  });

  useEffect(() => {
    async function verificar() {
      if (!user) { setVerificando(false); return; }
      try {
        const snap = await getDoc(doc(db, 'users', user.uid));
        if (snap.exists()) {
          const data = snap.data();
          setUsuarioExiste(true);
          setFormPersona((p) => ({
            ...p,
            name:             data.name             || user.displayName || '',
            ciudad:           data.ciudad           || '',
            bio:              data.bio              || '',
            cargoDeseado:     data.cargoDeseado     || '',
            nivelExperiencia: data.nivelExperiencia || 'Junior (0-2 años)',
            disponible:       data.disponible       ?? true,
            salarioEsperado:  data.salarioEsperado  || '',
          }));
          setFormEmpresa((p) => ({
            ...p,
            name:          data.name          || user.displayName || '',
            nombreEmpresa: data.nombreEmpresa || '',
            ciudad:        data.ciudad        || '',
            rubro:         data.rubro         || '',
            descripcion:   data.descripcion   || '',
            sitioWeb:      data.sitioWeb      || '',
            contacto:      data.contacto      || '',
          }));
        }
      } catch (e) { console.error('[Onboarding] verificar:', e); }
      finally { setVerificando(false); }
    }
    verificar();
  }, [user]);

  const inputCls = 'w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-white rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[--sc-500] placeholder-gray-400';

  const PASOS_PERSONA = usuarioExiste
    ? [
        { id: 1, titulo: '👋 ¿Quién sos?',  subtitulo: 'Contanos cómo vas a usar AG Empleo.' },
        { id: 2, titulo: '🎉 ¡Todo listo!', subtitulo: 'Ya podés empezar a usar AG Empleo.' },
      ]
    : [
        { id: 1, titulo: '👋 ¿Quién sos?',       subtitulo: 'Contanos cómo vas a usar AG Empleo.' },
        { id: 2, titulo: '👤 Contanos sobre vos', subtitulo: 'Completá tu perfil básico.' },
        { id: 3, titulo: '💼 Tu perfil laboral',  subtitulo: 'Para que las empresas te encuentren.' },
        { id: 4, titulo: '🎉 ¡Todo listo!',       subtitulo: 'Ya podés empezar a usar AG Empleo.' },
      ];

  const PASOS_EMPRESA = usuarioExiste
    ? [
        { id: 1, titulo: '👋 ¿Quién sos?',  subtitulo: 'Contanos cómo vas a usar AG Empleo.' },
        { id: 2, titulo: '🎉 ¡Todo listo!', subtitulo: 'Ya podés publicar empleos en AG Empleo.' },
      ]
    : [
        { id: 1, titulo: '👋 ¿Quién sos?', subtitulo: 'Contanos cómo vas a usar AG Empleo.' },
        { id: 2, titulo: '🏢 Tu empresa',  subtitulo: 'Completá los datos de tu empresa.' },
        { id: 3, titulo: '🎉 ¡Todo listo!', subtitulo: 'Ya podés publicar empleos en AG Empleo.' },
      ];

  const PASOS      = accountType === 'empresa' ? PASOS_EMPRESA : PASOS_PERSONA;
  const totalPasos = accountType ? PASOS.length : 1;
  const progreso   = accountType ? ((paso - 1) / (totalPasos - 1)) * 100 : 0;
  const esPasoFinal = accountType && paso === totalPasos;

  function handleChangePersona(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setFormPersona((p) => ({ ...p, [e.target.name]: e.target.value }));
  }

  function handleChangeEmpresa(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setFormEmpresa((p) => ({ ...p, [e.target.name]: e.target.value }));
  }

  function seleccionarTipo(tipo: AccountType) {
    setAccountType(tipo);
    setPaso(2);
    setError('');
  }

  function siguiente() {
    setError('');
    if (accountType === 'persona' && !usuarioExiste) {
      if (paso === 2 && !formPersona.name.trim()) { setError('El nombre es obligatorio.'); return; }
    }
    if (accountType === 'empresa' && !usuarioExiste) {
      if (paso === 2 && !formEmpresa.nombreEmpresa.trim()) { setError('El nombre de la empresa es obligatorio.'); return; }
    }
    setPaso((p) => p + 1);
  }

  async function finalizar() {
    if (!user) return;
    setGuardando(true); setError('');
    try {
      if (usuarioExiste) {
        await updateDoc(doc(db, 'users', user.uid), {
          accountType,
          onboardingDone: true,
          ...(accountType === 'empresa' && formEmpresa.nombreEmpresa
            ? { nombreEmpresa: formEmpresa.nombreEmpresa }
            : {}),
        });
      } else if (accountType === 'persona') {
        await setDoc(doc(db, 'users', user.uid), {
          name:             formPersona.name.trim(),
          ciudad:           formPersona.ciudad.trim(),
          bio:              formPersona.bio.trim(),
          cargoDeseado:     formPersona.cargoDeseado.trim(),
          nivelExperiencia: formPersona.nivelExperiencia,
          disponible:       formPersona.disponible,
          salarioEsperado:  formPersona.salarioEsperado.trim(),
          photo:            user.photoURL || '',
          accountType:      'persona',
          onboardingDone:   true,
          createdAt:        serverTimestamp(),
        });
      } else {
        await setDoc(doc(db, 'users', user.uid), {
          name:           formEmpresa.name.trim() || user.displayName || '',
          nombreEmpresa:  formEmpresa.nombreEmpresa.trim(),
          ciudad:         formEmpresa.ciudad.trim(),
          rubro:          formEmpresa.rubro.trim(),
          descripcion:    formEmpresa.descripcion.trim(),
          sitioWeb:       formEmpresa.sitioWeb.trim(),
          contacto:       formEmpresa.contacto.trim(),
          photo:          user.photoURL || '',
          accountType:    'empresa',
          onboardingDone: true,
          createdAt:      serverTimestamp(),
        });
      }

      // Llamar onDone si existe (usuarios existentes), sino navegar
      if (onDone) {
        onDone();
      } else {
        navigate('/', { replace: true });
      }
    } catch (e) {
      console.error('[Onboarding]', e);
      setError('No se pudo guardar. Intentá de nuevo.');
    } finally { setGuardando(false); }
  }

  if (verificando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="w-8 h-8 border-4 border-[--sc-500] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">

      <div className="h-1.5 bg-gray-200 dark:bg-gray-800">
        <div className="h-full bg-[--sc-500] transition-all duration-500" style={{ width: `${progreso}%` }} />
      </div>

      <div className="flex-1 flex flex-col max-w-lg mx-auto w-full px-5 py-8">

        <div className="mb-8">
          {accountType && (
            <p className="text-xs text-gray-400 dark:text-gray-500 font-bold mb-1">
              Paso {paso} de {totalPasos}
            </p>
          )}
          <h1 className="text-2xl font-black text-gray-900 dark:text-white leading-tight">
            {paso === 1 ? '👋 ¿Quién sos?' : PASOS[paso - 1]?.titulo}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            {paso === 1 ? 'Contanos cómo vas a usar AG Empleo.' : PASOS[paso - 1]?.subtitulo}
          </p>
        </div>

        {/* Paso 1 — Selección tipo */}
        {paso === 1 && (
          <div className="flex-1 flex flex-col gap-4">
            <button onClick={() => seleccionarTipo('persona')}
              className="w-full bg-white dark:bg-gray-900 rounded-3xl border-2 border-gray-100 dark:border-gray-800 p-6 text-left active:scale-95 transition-all hover:border-blue-400 shadow-sm">
              <div className="flex items-center gap-4 mb-3">
                <span className="text-4xl">🙋</span>
                <div>
                  <p className="font-black text-gray-900 dark:text-white text-lg">Soy una persona</p>
                  <p className="text-xs text-gray-400">Busco empleo o publico changas</p>
                </div>
              </div>
              <div className="space-y-2 pl-2">
                <p className="text-xs text-gray-500 dark:text-gray-400">✅ Postulate a ofertas de empleo</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">✅ Publicá changas y trabajos freelance</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">✅ Generá tu CV profesional gratis</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">✅ Conectate con otros profesionales</p>
              </div>
            </button>

            <button onClick={() => seleccionarTipo('empresa')}
              className="w-full bg-white dark:bg-gray-900 rounded-3xl border-2 border-gray-100 dark:border-gray-800 p-6 text-left active:scale-95 transition-all hover:border-purple-400 shadow-sm">
              <div className="flex items-center gap-4 mb-3">
                <span className="text-4xl">🏢</span>
                <div>
                  <p className="font-black text-gray-900 dark:text-white text-lg">Soy una empresa</p>
                  <p className="text-xs text-gray-400">Publico ofertas y busco candidatos</p>
                </div>
              </div>
              <div className="space-y-2 pl-2">
                <p className="text-xs text-gray-500 dark:text-gray-400">✅ Publicá ofertas de empleo gratis</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">✅ Recibí postulaciones de candidatos</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">✅ Test de compatibilidad automático</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">✅ Panel de candidatos clasificados</p>
              </div>
            </button>
          </div>
        )}

        {/* Paso 2 PERSONA — Perfil básico (solo usuarios nuevos) */}
        {paso === 2 && accountType === 'persona' && !usuarioExiste && (
          <div className="flex-1 space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nombre completo *</label>
              <input name="name" value={formPersona.name} onChange={handleChangePersona} placeholder="Ej: Juan Pérez" className={inputCls} maxLength={60} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ciudad</label>
              <input name="ciudad" value={formPersona.ciudad} onChange={handleChangePersona} placeholder="Ej: Buenos Aires" className={inputCls} maxLength={60} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Bio (opcional)</label>
              <textarea name="bio" value={formPersona.bio} onChange={handleChangePersona} placeholder="Contá algo sobre vos..." rows={3} className={`${inputCls} resize-none`} maxLength={300} />
            </div>
          </div>
        )}

        {/* Paso 3 PERSONA — Perfil laboral (solo usuarios nuevos) */}
        {paso === 3 && accountType === 'persona' && !usuarioExiste && (
          <div className="flex-1 space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Cargo deseado</label>
              <input name="cargoDeseado" value={formPersona.cargoDeseado} onChange={handleChangePersona} placeholder="Ej: Operario, Vendedor, Programador" className={inputCls} maxLength={80} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nivel de experiencia</label>
              <div className="flex flex-col gap-2">
                {NIVELES.map((n) => (
                  <button key={n} type="button"
                    onClick={() => setFormPersona((p) => ({ ...p, nivelExperiencia: n }))}
                    className={`text-left px-4 py-3 rounded-2xl text-sm font-bold border transition-all active:scale-95 ${
                      formPersona.nivelExperiencia === n
                        ? 'bg-[var(--sc-100)] dark:bg-[var(--sc-700)]/20 border-[var(--sc-500)] text-[var(--sc-700)] dark:text-[var(--sc-100)]'
                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300'
                    }`}>
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Expectativa salarial (opcional)</label>
              <input name="salarioEsperado" value={formPersona.salarioEsperado} onChange={handleChangePersona} placeholder="Ej: $500.000 - Negociable" className={inputCls} maxLength={60} />
            </div>
            <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
              <div>
                <p className="font-black text-gray-800 dark:text-white text-sm">Disponible para trabajar</p>
                <p className="text-xs text-gray-400">Visible en tu perfil público</p>
              </div>
              <button
                onClick={() => setFormPersona((p) => ({ ...p, disponible: !p.disponible }))}
                className={`relative w-12 h-6 rounded-full transition-colors ${formPersona.disponible ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${formPersona.disponible ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>
        )}

        {/* Paso 2 EMPRESA — Datos empresa (solo usuarios nuevos) */}
        {paso === 2 && accountType === 'empresa' && !usuarioExiste && (
          <div className="flex-1 space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nombre de la empresa *</label>
              <input name="nombreEmpresa" value={formEmpresa.nombreEmpresa} onChange={handleChangeEmpresa} placeholder="Ej: Acme S.A." className={inputCls} maxLength={80} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ciudad</label>
              <input name="ciudad" value={formEmpresa.ciudad} onChange={handleChangeEmpresa} placeholder="Ej: Córdoba" className={inputCls} maxLength={60} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Rubro</label>
              <input name="rubro" value={formEmpresa.rubro} onChange={handleChangeEmpresa} placeholder="Ej: Tecnología, Gastronomía, Construcción" className={inputCls} maxLength={80} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Descripción (opcional)</label>
              <textarea name="descripcion" value={formEmpresa.descripcion} onChange={handleChangeEmpresa} placeholder="Contá de qué se trata tu empresa..." rows={3} className={`${inputCls} resize-none`} maxLength={300} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Sitio web (opcional)</label>
              <input name="sitioWeb" value={formEmpresa.sitioWeb} onChange={handleChangeEmpresa} placeholder="https://miempresa.com" className={inputCls} maxLength={100} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Email o WhatsApp de contacto</label>
              <input name="contacto" value={formEmpresa.contacto} onChange={handleChangeEmpresa} placeholder="Ej: rrhh@empresa.com" className={inputCls} maxLength={80} />
            </div>
          </div>
        )}

        {/* Paso final */}
        {esPasoFinal && (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 text-center">
            <div className="w-24 h-24 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircleIcon className="w-14 h-14 text-green-500" />
            </div>
            <div>
              <p className="text-xl font-black text-gray-900 dark:text-white">¡Todo listo!</p>
              <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
                {accountType === 'empresa'
                  ? 'Ya podés publicar empleos y encontrar candidatos.'
                  : 'Ya podés explorar todas las funciones de AG Empleo.'
                }
              </p>
            </div>
            {accountType === 'empresa' && (
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-4 text-left space-y-2 w-full">
                <p className="font-black text-blue-700 dark:text-blue-300 text-sm">¿Qué podés hacer ahora?</p>
                <p className="text-xs text-blue-600 dark:text-blue-400">💼 Publicar ofertas de empleo con requisitos</p>
                <p className="text-xs text-blue-600 dark:text-blue-400">🎯 Ver candidatos clasificados automáticamente</p>
                <p className="text-xs text-blue-600 dark:text-blue-400">📊 Gestionar postulaciones desde tu panel</p>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-2xl text-red-600 dark:text-red-400 text-sm font-bold">
            <ExclamationCircleIcon className="w-5 h-5 shrink-0" />
            {error}
          </div>
        )}

        {accountType && (
          <div className="mt-6 flex gap-3">
            <button
              onClick={() => { setPaso((p) => p - 1); if (paso === 2) setAccountType(null); }}
              className="flex-1 py-4 rounded-2xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-black text-sm active:scale-95 transition-all">
              Atrás
            </button>
            {!esPasoFinal ? (
              <button onClick={siguiente}
                className="flex-1 py-4 rounded-2xl bg-[--sc-500] text-white font-black text-sm active:scale-95 transition-all">
                Siguiente
              </button>
            ) : (
              <button onClick={finalizar} disabled={guardando}
                className="flex-1 py-4 rounded-2xl bg-green-500 text-white font-black text-sm active:scale-95 transition-all disabled:opacity-50">
                {guardando ? 'Guardando...' : '¡Empezar!'}
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
