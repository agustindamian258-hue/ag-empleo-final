// src/pages/Home.tsx
import { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../app/firebase';
import {
  collection, query, orderBy, onSnapshot, limit, where,
  addDoc, serverTimestamp, getDoc, doc, getDocs,
} from 'firebase/firestore';
import Navbar from '../components/Navbar';
import Menu from '../components/Menu';
import FloatingAI from '../components/FloatingAI';
import Feed from '../components/Feed';
import {
  BriefcaseIcon, MapPinIcon, CurrencyDollarIcon,
  EnvelopeIcon, StarIcon,
} from '@heroicons/react/24/outline';

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
  destacado?:  boolean;
  requisitos?: { id: string; pregunta: string }[];
  createdAt:   { toDate: () => Date } | null;
}

const BADGE_COLORS: Record<string, string> = {
  'full-time': 'bg-blue-50   text-blue-700   dark:bg-blue-900/30  dark:text-blue-300',
  'part-time': 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  'remoto':    'bg-green-50  text-green-700  dark:bg-green-900/30  dark:text-green-300',
  'changa':    'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
};

export default function Home() {
  const [isMenuOpen,    setIsMenuOpen]    = useState<boolean>(false);
  const [isPublishOpen, setIsPublishOpen] = useState<boolean>(false);
  const [empleos,       setEmpleos]       = useState<Empleo[]>([]);
  const [yaPostulado,   setYaPostulado]   = useState<Set<string>>(new Set());
  const [postulando,    setPostulando]    = useState<string | null>(null);
  const [accountType,   setAccountType]   = useState<string>('');
  const { user } = useTheme();
  const navigate = useNavigate();
  const nombre = user?.displayName?.split(' ')[0] || 'Bienvenido';

  useEffect(() => {
    if (!user) return;
    getDoc(doc(db, 'users', user.uid)).then((snap) => {
      if (snap.exists()) setAccountType(snap.data().accountType ?? '');
    });
  }, [user]);

  useEffect(() => {
    const q = query(
      collection(db, 'empleos'),
      orderBy('destacado', 'desc'),
      orderBy('createdAt', 'desc'),
      limit(5)
    );
    const unsub = onSnapshot(q, (snap) => {
      setEmpleos(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Empleo)));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user || empleos.length === 0) return;
    const check = async () => {
      const nuevos = new Set<string>();
      await Promise.all(empleos.map(async (e) => {
        const q = query(collection(db, 'empleos', e.id, 'postulaciones'), where('uid', '==', user.uid));
        const snap = await getDocs(q);
        if (!snap.empty) nuevos.add(e.id);
      }));
      setYaPostulado(nuevos);
    };
    check();
  }, [user, empleos]);

  async function handlePostular(empleo: Empleo) {
    if (!user || postulando) return;
    if ((empleo.requisitos?.length ?? 0) > 0) {
      navigate('/jobs');
      return;
    }
    setPostulando(empleo.id);
    try {
      const userSnap = await getDoc(doc(db, 'users', user.uid));
      const userData = userSnap.exists() ? userSnap.data() : {};
      await addDoc(collection(db, 'empleos', empleo.id, 'postulaciones'), {
        uid:        user.uid,
        nombre:     userData.name     || user.displayName || 'Usuario',
        foto:       userData.photo    || user.photoURL    || '',
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
          mensaje:  `${userData.name || user.displayName || 'Alguien'} se postuló a tu oferta.`,
          tipo:     'empleo',
          leida:    false,
          creadoEn: serverTimestamp(),
        });
      }
      setYaPostulado((prev) => new Set([...prev, empleo.id]));
    } catch (e) {
      console.error('[Home] postular:', e);
    } finally { setPostulando(null); }
  }

  const esEmpresa = accountType === 'empresa';

  return (
    <div className="relative min-h-screen bg-gray-50 dark:bg-gray-950 pb-24">
      <header className="sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-blue-100 dark:border-gray-800 px-5 py-4 flex items-center justify-between shadow-sm">
        <div>
          <h1 className="text-2xl font-black tracking-tighter text-blue-800 dark:text-blue-400">
            AG EMPLEO
          </h1>
          <p className="text-gray-400 text-xs">
            Hola {nombre}, encontrá tu próximo trabajo
          </p>
        </div>
        <button
          onClick={() => navigate('/social')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full active:scale-95 transition-all"
          style={{ background: 'linear-gradient(135deg, #1d4ed8, #2563eb)', boxShadow: '0 3px 12px rgba(37,99,235,0.4)' }}
        >
          <span className="text-[11px]">🌐</span>
          <span className="text-[10px] font-black text-white">Ir a Social</span>
        </button>
      </header>

      <main className="px-4 pt-4 space-y-4">
        {empleos.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="font-black text-gray-800 dark:text-white text-sm">🔥 Últimas ofertas</p>
              <button onClick={() => navigate('/jobs')}
                className="text-xs font-bold text-blue-500 active:opacity-60">
                Ver todas →
              </button>
            </div>
            <div className="space-y-3">
              {empleos.map((empleo) => {
                const esMio     = user?.uid === empleo.uid;
                const postulado = yaPostulado.has(empleo.id);
                return (
                  <article key={empleo.id}
                    className={`bg-white dark:bg-gray-900 rounded-2xl border shadow-sm p-4 ${
                      empleo.destacado
                        ? 'border-yellow-300 dark:border-yellow-600 ring-1 ring-yellow-200 dark:ring-yellow-700'
                        : 'border-gray-100 dark:border-gray-800'
                    }`}>

                    {empleo.destacado && (
                      <div className="flex items-center gap-1 mb-2">
                        <StarIcon className="w-3.5 h-3.5 text-yellow-500" />
                        <span className="text-[10px] font-black text-yellow-600 dark:text-yellow-400">OFERTA DESTACADA</span>
                      </div>
                    )}

                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center shrink-0">
                          <BriefcaseIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="font-black text-gray-800 dark:text-gray-100 text-sm">{empleo.titulo}</p>
                          <button
                            onClick={() => empleo.uid && navigate(`/empresa/${empleo.uid}`)}
                            className="text-xs text-blue-500 dark:text-blue-400 font-bold active:opacity-60 text-left"
                          >
                            {empleo.empresa}
                          </button>
                        </div>
                      </div>
                      <span className={`text-[10px] font-black px-2 py-1 rounded-full shrink-0 ${BADGE_COLORS[empleo.tipo] ?? 'bg-gray-50 text-gray-600'}`}>
                        {empleo.tipo?.toUpperCase()}
                      </span>
                    </div>

                    <p className="text-gray-500 dark:text-gray-400 text-xs line-clamp-2 mb-3">{empleo.descripcion}</p>

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
                      <div className="flex items-center gap-2">
                        {empleo.contacto && (
                          <a href={empleo.contacto.includes('@') ? `mailto:${empleo.contacto}` : `https://wa.me/${empleo.contacto.replace(/\D/g,'')}`}
                            target="_blank" rel="noreferrer"
                            className="flex items-center gap-1 text-xs text-blue-600 font-bold">
                            <EnvelopeIcon className="w-3.5 h-3.5" />Contactar
                          </a>
                        )}
                        {user && !esMio && !esEmpresa && (
                          <button
                            onClick={() => !postulado && handlePostular(empleo)}
                            disabled={postulado || postulando === empleo.id}
                            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all active:scale-95 ${
                              postulado
                                ? 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400'
                                : 'bg-blue-500 text-white shadow-sm'
                            }`}>
                            {postulado ? '✅ Postulado' : '📩 Postularme'}
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        )}

        <div>
          <p className="font-black text-gray-800 dark:text-white text-sm mb-3">📢 Publicaciones</p>
          <Feed showCompose={false} zona="empleo" />
        </div>
      </main>

      {isPublishOpen && (
        <div className="fixed inset-0 z-[200] bg-black/60 flex items-end" onClick={() => setIsPublishOpen(false)}>
          <div className="w-full bg-white dark:bg-gray-900 rounded-t-3xl px-5 pt-4 pb-16 shadow-2xl animate-slide-up"
            onClick={(e) => e.stopPropagation()}>
            <div className="w-10 h-1 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-4" />
            <p className="text-base font-black text-blue-700 dark:text-blue-400 mb-4">Nueva publicación</p>
            <Feed showCompose={true} soloCompose={true} zona="empleo" onPublished={() => setIsPublishOpen(false)} />
          </div>
        </div>
      )}

      <FloatingAI visorActivo={false} />
      <Navbar onMenuClick={() => setIsMenuOpen(true)} onPublishClick={() => setIsPublishOpen(true)} />
      <Menu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </div>
  );
                        }
