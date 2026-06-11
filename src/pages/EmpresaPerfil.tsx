// src/pages/EmpresaPerfil.tsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, auth } from '../app/firebase';
import {
  doc, getDoc, collection, query, where,
  onSnapshot, orderBy, addDoc, serverTimestamp, getDocs,
} from 'firebase/firestore';
import {
  ArrowLeftIcon, BriefcaseIcon, MapPinIcon,
  CurrencyDollarIcon, EnvelopeIcon, GlobeAltIcon,
  BuildingOfficeIcon, ClipboardDocumentListIcon,
} from '@heroicons/react/24/outline';
import Navbar from '../components/Navbar';
import Menu from '../components/Menu';

interface EmpresaData {
  name?:          string;
  nombreEmpresa?: string;
  photo?:         string;
  ciudad?:        string;
  rubro?:         string;
  descripcion?:   string;
  sitioWeb?:      string;
  contacto?:      string;
  accountType?:   string;
}

interface Empleo {
  id:          string;
  titulo:      string;
  empresa:     string;
  ubicacion:   string;
  salario?:    string;
  tipo:        string;
  descripcion: string;
  contacto?:   string;
  uid?:        string;
  requisitos?: { id: string; pregunta: string }[];
  createdAt:   { toDate: () => Date } | null;
}

const BADGE_COLORS: Record<string, string> = {
  'full-time': 'bg-blue-50   text-blue-700   dark:bg-blue-900/30  dark:text-blue-300',
  'part-time': 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  'remoto':    'bg-green-50  text-green-700  dark:bg-green-900/30  dark:text-green-300',
  'changa':    'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
};

export default function EmpresaPerfil() {
  const { uid }  = useParams<{ uid: string }>();
  const navigate = useNavigate();
  const me       = auth.currentUser;

  const [empresa,      setEmpresa]      = useState<EmpresaData | null>(null);
  const [empleos,      setEmpleos]      = useState<Empleo[]>([]);
  const [cargando,     setCargando]     = useState(true);
  const [isMenuOpen,   setIsMenuOpen]   = useState(false);
  const [yaPostulado,  setYaPostulado]  = useState<Set<string>>(new Set());
  const [postulando,   setPostulando]   = useState<string | null>(null);
  const [accountType,  setAccountType]  = useState('');

  useEffect(() => {
    if (!uid) return;

    // Cargar datos de la empresa
    getDoc(doc(db, 'users', uid)).then((snap) => {
      if (snap.exists()) setEmpresa(snap.data() as EmpresaData);
      setCargando(false);
    });

    // Cargar empleos publicados por esta empresa
    const q = query(
      collection(db, 'empleos'),
      where('uid', '==', uid),
      orderBy('createdAt', 'desc'),
    );
    const unsub = onSnapshot(q, (snap) => {
      setEmpleos(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Empleo)));
    });

    return () => unsub();
  }, [uid]);

  // Cargar accountType del usuario logueado
  useEffect(() => {
    if (!me) return;
    getDoc(doc(db, 'users', me.uid)).then((snap) => {
      if (snap.exists()) setAccountType(snap.data().accountType ?? '');
    });
  }, [me]);

  // Verificar postulaciones
  useEffect(() => {
    if (!me || empleos.length === 0) return;
    const check = async () => {
      const nuevos = new Set<string>();
      await Promise.all(empleos.map(async (e) => {
        const q = query(
          collection(db, 'empleos', e.id, 'postulaciones'),
          where('uid', '==', me.uid)
        );
        const snap = await getDocs(q);
        if (!snap.empty) nuevos.add(e.id);
      }));
      setYaPostulado(nuevos);
    };
    check();
  }, [me, empleos]);

  async function handlePostular(empleo: Empleo) {
    if (!me || postulando) return;

    // Si tiene requisitos, mandar a Jobs
    if ((empleo.requisitos?.length ?? 0) > 0) {
      navigate('/jobs');
      return;
    }

    setPostulando(empleo.id);
    try {
      const userSnap = await getDoc(doc(db, 'users', me.uid));
      const userData = userSnap.exists() ? userSnap.data() : {};

      await addDoc(collection(db, 'empleos', empleo.id, 'postulaciones'), {
        uid:        me.uid,
        nombre:     userData.name     || me.displayName || 'Usuario',
        foto:       userData.photo    || me.photoURL    || '',
        ciudad:     userData.ciudad   || '',
        cargo:      userData.cargoDeseado || '',
        nivel:      userData.nivelExperiencia || '',
        respuestas: {},
        grupo:      'apto',
        createdAt:  serverTimestamp(),
      });

      if (empleo.uid) {
        await addDoc(collection(db, 'notifications'), {
          uid:      empleo.uid,
          titulo:   `💼 Nueva postulación en "${empleo.titulo}"`,
          mensaje:  `${userData.name || me.displayName || 'Alguien'} se postuló a tu oferta.`,
          tipo:     'empleo',
          leida:    false,
          creadoEn: serverTimestamp(),
        });
      }

      setYaPostulado((prev) => new Set([...prev, empleo.id]));
    } catch (e) {
      console.error('[EmpresaPerfil] postular:', e);
    } finally {
      setPostulando(null);
    }
  }

  if (cargando) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!empresa || empresa.accountType !== 'empresa') return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 px-8 text-center">
      <p className="text-4xl mb-3">🏢</p>
      <p className="font-black text-gray-700 dark:text-gray-300">Perfil no encontrado</p>
      <button onClick={() => navigate(-1)}
        className="mt-4 px-5 py-2.5 rounded-2xl bg-blue-500 text-white font-black text-sm active:scale-95">
        Volver
      </button>
    </div>
  );

  const nombreMostrar = empresa.nombreEmpresa || empresa.name || 'Empresa';
  const avatarUrl     = empresa.photo ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(nombreMostrar)}&background=2563eb&color=fff&size=128`;
  const esPropio      = me?.uid === uid;
  const esEmpresa     = accountType === 'empresa';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-24">
      <header className="sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-5 py-4 flex items-center gap-3 shadow-sm">
        <button onClick={() => navigate(-1)}
          className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 active:scale-90 transition-transform">
          <ArrowLeftIcon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        </button>
        <h1 className="font-black text-gray-900 dark:text-white text-lg truncate flex-1">
          {nombreMostrar}
        </h1>
        <span className="text-[10px] font-black px-2 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
          💼 Empresa
        </span>
      </header>

      <div className="max-w-lg mx-auto px-4 pt-6 space-y-4">

        {/* Header empresa */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm p-6">
          <div className="flex items-center gap-4 mb-4">
            <img src={avatarUrl} alt={nombreMostrar}
              className="w-20 h-20 rounded-2xl object-cover ring-4 ring-blue-100 dark:ring-blue-900 shadow-md" />
            <div className="flex-1 min-w-0">
              <p className="font-black text-xl text-gray-900 dark:text-white leading-tight">{nombreMostrar}</p>
              {empresa.rubro && (
                <p className="text-sm text-blue-600 dark:text-blue-400 font-bold">{empresa.rubro}</p>
              )}
              {empresa.ciudad && (
                <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                  <MapPinIcon className="w-3.5 h-3.5" />{empresa.ciudad}
                </p>
              )}
            </div>
          </div>

          {empresa.descripcion && (
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
              {empresa.descripcion}
            </p>
          )}

          <div className="flex flex-col gap-2">
            {empresa.sitioWeb && (
              <a href={empresa.sitioWeb.startsWith('http') ? empresa.sitioWeb : `https://${empresa.sitioWeb}`}
                target="_blank" rel="noreferrer"
                className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400 font-bold active:opacity-60">
                <GlobeAltIcon className="w-4 h-4" />
                {empresa.sitioWeb}
              </a>
            )}
            {empresa.contacto && (
              <a href={empresa.contacto.includes('@') ? `mailto:${empresa.contacto}` : `https://wa.me/${empresa.contacto.replace(/\D/g,'')}`}
                target="_blank" rel="noreferrer"
                className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400 font-bold active:opacity-60">
                <EnvelopeIcon className="w-4 h-4" />
                {empresa.contacto}
              </a>
            )}
          </div>

          {esPropio && (
            <button onClick={() => navigate('/profile')}
              className="mt-4 w-full py-2.5 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-black text-sm active:scale-95 transition-all">
              Editar perfil de empresa
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 text-center">
            <p className="font-black text-2xl text-blue-600">{empleos.length}</p>
            <p className="text-xs text-gray-400 font-bold">Ofertas publicadas</p>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 text-center">
            <p className="font-black text-2xl text-green-600">
              {empleos.filter(e => e.tipo !== 'changa').length}
            </p>
            <p className="text-xs text-gray-400 font-bold">Empleos formales</p>
          </div>
        </div>

        {/* Ofertas de empleo */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <BriefcaseIcon className="w-5 h-5 text-blue-600" />
            <p className="font-black text-gray-800 dark:text-white">
              Ofertas activas ({empleos.length})
            </p>
          </div>

          {empleos.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
              <p className="text-3xl mb-2">📭</p>
              <p className="text-gray-400 font-bold text-sm">Sin ofertas publicadas</p>
            </div>
          ) : (
            <div className="space-y-3">
              {empleos.map((empleo) => {
                const postulado  = yaPostulado.has(empleo.id);
                const tieneReqs  = (empleo.requisitos?.length ?? 0) > 0;
                const cargandoP  = postulando === empleo.id;

                return (
                  <article key={empleo.id}
                    className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-gray-800 dark:text-gray-100 text-sm">{empleo.titulo}</p>
                        <p className="text-gray-500 dark:text-gray-400 text-xs">{empleo.empresa}</p>
                      </div>
                      <span className={`text-[10px] font-black px-2 py-1 rounded-full shrink-0 ml-2 ${BADGE_COLORS[empleo.tipo] ?? 'bg-gray-50 text-gray-600'}`}>
                        {empleo.tipo?.toUpperCase()}
                      </span>
                    </div>

                    <p className="text-gray-500 dark:text-gray-400 text-xs line-clamp-2 mb-3">
                      {empleo.descripcion}
                    </p>

                    {tieneReqs && (
                      <div className="flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400 font-bold mb-3">
                        <ClipboardDocumentListIcon className="w-3.5 h-3.5" />
                        {empleo.requisitos!.length} requisito{empleo.requisitos!.length !== 1 ? 's' : ''}
                      </div>
                    )}

                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <MapPinIcon className="w-3.5 h-3.5" />{empleo.ubicacion}
                        </span>
                        {empleo.salario && (
                          <span className="flex items-center gap-1 text-green-600 dark:text-green-400 font-bold">
                            <CurrencyDollarIcon className="w-3.5 h-3.5" />{empleo.salario}
                          </span>
                        )}
                      </div>
                      {me && !esPropio && !esEmpresa && (
                        <button
                          onClick={() => !postulado && handlePostular(empleo)}
                          disabled={postulado || cargandoP}
                          className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all active:scale-95 ${
                            postulado
                              ? 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400'
                              : 'bg-blue-500 text-white shadow-sm'
                          }`}>
                          {cargandoP ? '...' : postulado ? '✅ Postulado' : '📩 Postularme'}
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <Navbar onMenuClick={() => setIsMenuOpen(true)} />
      <Menu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </div>
  );
      }
