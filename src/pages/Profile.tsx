// src/pages/Profile.tsx
import { useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, updateDoc, serverTimestamp, collection, query, where, onSnapshot, deleteDoc, addDoc, orderBy, arrayUnion, arrayRemove, getDocs, getCountFromServer } from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '../app/firebase';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Menu from '../components/Menu';
import { useTheme, SocialColor } from '../context/ThemeContext';
import {
  CheckCircleIcon, ExclamationCircleIcon,
  CameraIcon, HeartIcon, DocumentTextIcon,
  ChatBubbleOvalLeftIcon, ShareIcon, XMarkIcon,
  FaceSmileIcon, TrashIcon, PencilIcon, CheckIcon,
  PaperAirplaneIcon, FlagIcon,
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid';

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
  id:        string;
  text:      string;
  mediaUrl:  string;
  mediaType: string;
  userId:    string;
  userName:  string;
  userPhoto: string;
  reactions: Record<string, string>;
  zona:      string;
  createdAt: { toDate: () => Date } | null;
}

interface Comment {
  id:        string;
  text:      string;
  userId:    string;
  userName:  string;
  userPhoto: string;
  likes:     string[];
  replyTo:   string | null;
  createdAt: { toDate: () => Date } | null;
}

type StatusMsg = { tipo: 'exito' | 'error'; texto: string } | null;
type TabId     = 'social' | 'empleo';

const MAX_BIO        = 300;
const MAX_PHOTO_MB   = 5;
const REACCIONES     = ['❤️', '😂', '😍', '👍', '😲'];
const REPORTES_LIMITE = 5;

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

function sanitizeText(input: string): string {
  return input.replace(/</g, '&lt;').replace(/>/g, '&gt;').trim();
}

function formatFecha(createdAt: Post['createdAt']): string {
  if (!createdAt?.toDate) return 'Ahora';
  return createdAt.toDate().toLocaleDateString('es-AR', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

async function crearNotificacion({ uid, titulo, mensaje, tipo }: {
  uid: string; titulo: string; mensaje: string; tipo: string;
}) {
  if (!uid || uid === auth.currentUser?.uid) return;
  try {
    await addDoc(collection(db, 'notifications'), {
      uid, titulo, mensaje, tipo, leida: false, creadoEn: serverTimestamp(),
    });
  } catch (e) { console.error('[Notif]', e); }
}

function SelectorReaccion({ onSelect }: { onSelect: (emoji: string) => void }) {
  const [custom, setCustom] = useState(false);
  const [input,  setInput]  = useState('');
  return (
    <div className="absolute bottom-10 left-0 z-20 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-2 flex items-center gap-1">
      {REACCIONES.map((e) => (
        <button key={e} onClick={() => onSelect(e)} className="text-2xl active:scale-125 transition-transform hover:scale-110">{e}</button>
      ))}
      {custom ? (
        <input autoFocus value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && input.trim()) { onSelect(input.trim()); setInput(''); setCustom(false); } }}
          placeholder="😀"
          className="w-10 h-8 text-center text-lg bg-gray-100 dark:bg-gray-700 rounded-xl focus:outline-none"
          maxLength={2}
        />
      ) : (
        <button onClick={() => setCustom(true)} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-500">
          <FaceSmileIcon className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}

function ResumenReacciones({ reactions }: { reactions: Record<string, string> }) {
  const conteo = Object.values(reactions || {}).reduce<Record<string, number>>((acc, e) => {
    acc[e] = (acc[e] || 0) + 1; return acc;
  }, {});
  const top = Object.entries(conteo).sort((a, b) => b[1] - a[1]).slice(0, 3);
  if (top.length === 0) return null;
  return (
    <div className="flex items-center gap-1 px-4 pb-2">
      <div className="flex -space-x-1">{top.map(([emoji]) => <span key={emoji} className="text-base">{emoji}</span>)}</div>
      <span className="text-xs text-gray-400 ml-1">{Object.keys(reactions).length}</span>
    </div>
  );
}

function ModalComentarios({ postId, postUserId, onClose }: {
  postId: string; postUserId: string; onClose: () => void;
}) {
  const user = auth.currentUser;
  const [comments,     setComments]     = useState<Comment[]>([]);
  const [texto,        setTexto]        = useState('');
  const [enviando,     setEnviando]     = useState(false);
  const [respondiendo, setRespondiendo] = useState<{ id: string; nombre: string } | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    const q = query(collection(db, 'posts', postId, 'comments'), orderBy('createdAt', 'asc'));
    return onSnapshot(q, (snap) =>
      setComments(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Comment)))
    );
  }, [postId]);

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 300); }, []);

  async function handleLikeComentario(comment: Comment) {
    if (!user) return;
    const ref   = doc(db, 'posts', postId, 'comments', comment.id);
    const liked = comment.likes?.includes(user.uid);
    await updateDoc(ref, { likes: liked ? arrayRemove(user.uid) : arrayUnion(user.uid) });
    if (!liked) await crearNotificacion({
      uid: comment.userId,
      titulo: `❤️ ${user.displayName ?? 'Alguien'} le gustó tu comentario`,
      mensaje: comment.text.slice(0, 60), tipo: 'like',
    });
  }

  async function handleEnviar() {
    if (!user || !texto.trim()) return;
    setEnviando(true);
    try {
      await addDoc(collection(db, 'posts', postId, 'comments'), {
        text: sanitizeText(texto), userId: user.uid,
        userName: user.displayName ?? 'Usuario', userPhoto: user.photoURL ?? '',
        likes: [], replyTo: respondiendo?.nombre ?? null, createdAt: serverTimestamp(),
      });
      await crearNotificacion({
        uid: postUserId,
        titulo: `💬 ${user.displayName ?? 'Alguien'} comentó tu publicación`,
        mensaje: texto.trim().slice(0, 80), tipo: 'comentario',
      });
      setTexto(''); setRespondiendo(null);
    } catch (e) { console.error('[Profile] comentar:', e); }
    finally { setEnviando(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-t-3xl flex flex-col" style={{ maxHeight: '80vh' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <h3 className="font-black text-gray-800 dark:text-gray-100">
            Comentarios {comments.length > 0 && <span className="text-gray-400 font-normal text-sm">({comments.length})</span>}
          </h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {comments.length === 0 && (
            <div className="text-center py-10 text-gray-400">
              <p className="text-3xl mb-2">💬</p>
              <p className="text-sm font-bold">Sé el primero en comentar</p>
            </div>
          )}
          {comments.map((c) => {
            const avatar = c.userPhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.userName || 'U')}&background=7c3aed&color=fff`;
            const likedC = c.likes?.includes(user?.uid ?? '');
            return (
              <div key={c.id} className={`flex gap-3 ${c.replyTo ? 'ml-8' : ''}`}>
                <img src={avatar} alt={c.userName} className="w-8 h-8 rounded-full object-cover shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl px-3 py-2">
                    <p className="font-black text-xs text-gray-800 dark:text-gray-100">{c.userName}</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-snug">{c.text}</p>
                  </div>
                  <div className="flex items-center gap-4 mt-1 px-1">
                    <button onClick={() => handleLikeComentario(c)} className="flex items-center gap-1 active:scale-90 transition-transform">
                      {likedC ? <HeartSolid className="w-3.5 h-3.5 text-red-500" /> : <HeartIcon className="w-3.5 h-3.5 text-gray-400" />}
                      {(c.likes?.length || 0) > 0 && <span className={`text-xs font-bold ${likedC ? 'text-red-500' : 'text-gray-400'}`}>{c.likes?.length}</span>}
                    </button>
                    <button onClick={() => { setRespondiendo({ id: c.id, nombre: c.userName }); setTexto(`@${c.userName} `); inputRef.current?.focus(); }}
                      className="text-xs text-gray-400 font-bold active:scale-95 transition-transform">
                      Responder
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {user && (
          <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800 space-y-2">
            {respondiendo && (
              <div className="flex items-center justify-between bg-purple-50 dark:bg-purple-900/20 rounded-xl px-3 py-1.5">
                <span className="text-xs text-purple-600 font-bold">Respondiendo a @{respondiendo.nombre}</span>
                <button onClick={() => { setRespondiendo(null); setTexto(''); }} className="text-purple-400 text-xs">✕</button>
              </div>
            )}
            <div className="flex gap-3 items-center">
              <img src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'U')}&background=7c3aed&color=fff`}
                alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
              <input ref={inputRef} value={texto} onChange={(e) => setTexto(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleEnviar()}
                placeholder="Escribí un comentario..." maxLength={300}
                className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full px-4 py-2 text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none" />
              <button onClick={handleEnviar} disabled={enviando || !texto.trim()}
                className="w-9 h-9 rounded-full bg-purple-600 flex items-center justify-center disabled:opacity-40 active:scale-90 transition-transform">
                <PaperAirplaneIcon className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}import React from 'react';

export default function Profile() {
  const { socialColor, setSocialColor } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const zonaInicial: TabId =
    (location.state as { zona?: TabId } | null)?.zona ?? 'empleo';

  const [user,         setUser]         = useState<User | null>(null);
  const [form,         setForm]         = useState<UserForm>({
    name: '', title: '', bio: '', ciudad: '',
    cargoDeseado: '', nivelExperiencia: 'Junior (0-2 años)',
    disponible: true, salarioEsperado: '',
  });
  const [fotoURL,        setFotoURL]        = useState('');
  const [guardando,      setGuardando]      = useState(false);
  const [subiendoFoto,   setSubiendoFoto]   = useState(false);
  const [status,         setStatus]         = useState<StatusMsg>(null);
  const [menuAbierto,    setMenuAbierto]    = useState(false);
  const [misPosts,       setMisPosts]       = useState<Post[]>([]);
  const [totalLikes,     setTotalLikes]     = useState(0);
  const [seguidores,     setSeguidores]     = useState(0);
  const [siguiendo,      setSiguiendo]      = useState(0);
  const [tabActiva,      setTabActiva]      = useState<TabId>(zonaInicial);
  const [comentandoId,   setComentandoId]   = useState<string | null>(null);
  const [comentandoUid,  setComentandoUid]  = useState('');
  const [reaccionandoId, setReaccionandoId] = useState<string | null>(null);
  const [editandoId,     setEditandoId]     = useState<string | null>(null);
  const [editTexto,      setEditTexto]      = useState('');
  const [guardandoEdit,  setGuardandoEdit]  = useState(false);
  const [reportandoId,   setReportandoId]   = useState<string | null>(null);

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
    const q = query(
      collection(db, 'posts'),
      where('userId', '==', uid),
      orderBy('createdAt', 'desc'),
    );
    onSnapshot(q, (snap) => {
      const posts = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Post));
      setMisPosts(posts);
      setTotalLikes(posts.reduce((acc, p) => acc + Object.keys(p.reactions || {}).length, 0));
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
    if (!form.name.trim()) { setStatus({ tipo: 'error', texto: 'El nombre es obligatorio.' }); return; }
    setGuardando(true); setStatus(null);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        name: form.name.trim(), title: form.title.trim(), bio: form.bio.trim(),
        ciudad: form.ciudad.trim(), cargoDeseado: form.cargoDeseado.trim(),
        nivelExperiencia: form.nivelExperiencia, disponible: form.disponible,
        salarioEsperado: form.salarioEsperado.trim(), updatedAt: serverTimestamp(),
      });
      setStatus({ tipo: 'exito', texto: '¡Perfil guardado!' });
    } catch (e) {
      console.error('[Profile] save:', e);
      setStatus({ tipo: 'error', texto: 'No se pudo guardar. Intentá de nuevo.' });
    } finally { setGuardando(false); }
  };

  async function handleReaccion(postId: string, postUserId: string, emoji: string) {
    if (!user) return;
    setReaccionandoId(null);
    const postRef = doc(db, 'posts', postId);
    try {
      const snap = await getDoc(postRef);
      const reactions: Record<string, string> = snap.data()?.reactions || {};
      if (reactions[user.uid] === emoji) {
        const updated = { ...reactions }; delete updated[user.uid];
        await updateDoc(postRef, { reactions: updated });
      } else {
        await updateDoc(postRef, { [`reactions.${user.uid}`]: emoji });
        await crearNotificacion({
          uid: postUserId,
          titulo: `${emoji} ${user.displayName ?? 'Alguien'} reaccionó a tu publicación`,
          mensaje: emoji, tipo: 'like',
        });
      }
    } catch (e) { console.error('[Profile] reacción:', e); }
  }

  async function handleEliminar(post: Post) {
    if (!user || user.uid !== post.userId) return;
    try { await deleteDoc(doc(db, 'posts', post.id)); }
    catch (e) { console.error('[Profile] eliminar:', e); }
  }

  async function handleEditarGuardar(postId: string) {
    if (!user || !editTexto.trim()) return;
    setGuardandoEdit(true);
    try {
      await updateDoc(doc(db, 'posts', postId), {
        text: sanitizeText(editTexto), editadoEn: serverTimestamp(),
      });
      setEditandoId(null); setEditTexto('');
    } catch (e) { console.error('[Profile] editar:', e); }
    finally { setGuardandoEdit(false); }
  }

  async function handleReportar(postId: string) {
    if (!user) return;
    setReportandoId(null);
    try {
      const qYaReporto = query(
        collection(db, 'reports'),
        where('postId', '==', postId),
        where('reportadoPor', '==', user.uid),
      );
      const yaReporto = await getDocs(qYaReporto);
      if (!yaReporto.empty) return;
      await addDoc(collection(db, 'reports'), {
        postId, reportadoPor: user.uid, creadoEn: serverTimestamp(), revisado: false,
      });
      const snapConteo = await getCountFromServer(query(collection(db, 'reports'), where('postId', '==', postId)));
      if (snapConteo.data().count >= REPORTES_LIMITE) {
        await deleteDoc(doc(db, 'posts', postId));
      }
    } catch (e) { console.error('[Profile] reportar:', e); }
  }

  function handleCompartir(post: Post) {
    const url = `${window.location.origin}/user/${post.userId}`;
    if (navigator.share) {
      navigator.share({ title: 'AG Empleo', text: post.text || 'Mirá esta publicación', url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url).catch(() => {});
    }
  }

  const avatarUrl = fotoURL ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(form.name || 'U')}&background=${
      tabActiva === 'social' ? '7c3aed' : '3b82f6'
    }&color=fff&size=128`;

  const inputCls = 'w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[--sc-300]';
  const headerGradient = tabActiva === 'social' ? 'from-purple-600 to-purple-800' : 'from-blue-600 to-blue-800';

  const postsZona = misPosts.filter((p) => p.zona === tabActiva);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-24">
      <Navbar onMenuClick={() => setMenuAbierto(true)} />
      <Menu isOpen={menuAbierto} onClose={() => setMenuAbierto(false)} />

      <div className="max-w-lg mx-auto px-4 pt-6 space-y-4">

        <div className={`bg-gradient-to-r ${headerGradient} rounded-3xl p-4 text-white text-center`}>
          <p className="text-xs font-black uppercase tracking-widest opacity-75 mb-0.5">Perfil activo</p>
          <p className="text-lg font-black">{tabActiva === 'social' ? '🌐 Zona Social' : '💼 Zona Empleo'}</p>
        </div>

        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <img src={avatarUrl} alt="foto de perfil" className="w-24 h-24 rounded-full border-4 border-[--sc-100] object-cover shadow-md" />
            <label className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[var(--sc-600)] flex items-center justify-center cursor-pointer ring-2 ring-white dark:ring-gray-950 active:scale-90 transition-transform">
              {subiendoFoto
                ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <CameraIcon className="w-4 h-4 text-white" />}
              <input type="file" accept="image/*" onChange={handleFotoUpload} className="hidden" disabled={subiendoFoto} />
            </label>
          </div>
          <div className="text-center">
            <p className="font-black text-lg text-gray-900 dark:text-white">{form.name || 'Tu nombre'}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{form.title || 'Tu título profesional'}</p>
            {form.ciudad && <p className="text-xs text-gray-400 dark:text-gray-500">📍 {form.ciudad}</p>}
          </div>
          <div className="flex gap-6">
            {[
              { value: misPosts.length, label: 'Posts', icon: <DocumentTextIcon className="w-3.5 h-3.5" /> },
              { value: seguidores,      label: 'Seguidores' },
              { value: siguiendo,       label: 'Siguiendo' },
              { value: totalLikes,      label: 'Likes', icon: <HeartIcon className="w-3.5 h-3.5" /> },
            ].map((s, i, arr) => (
              <React.Fragment key={s.label}>
                <div className="flex flex-col items-center">
                  <span className="font-black text-lg text-gray-900 dark:text-white">{s.value}</span>
                  <span className="text-xs text-gray-400 flex items-center gap-1">{s.icon}{s.label}</span>
                </div>
                {i < arr.length - 1 && <div className="w-px bg-gray-200 dark:bg-gray-700" />}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="flex gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-2xl">
          {(['social', 'empleo'] as TabId[]).map((t) => (
            <button key={t} onClick={() => setTabActiva(t)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-black transition-all ${
                tabActiva === t ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'
              }`}>
              {t === 'social' ? '🌐 Social' : '💼 Empleo'}
            </button>
          ))}
        </div>

        {tabActiva === 'social' && (
          <>
            <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 p-5">
              <h2 className="font-black text-gray-800 dark:text-white text-base mb-3">Color zona Social</h2>
              <div className="flex gap-3 justify-center">
                {COLORS.map(({ id, bg, ring }) => (
                  <button key={id} onClick={() => setSocialColor(id)}
                    className={`w-9 h-9 rounded-full ${bg} transition-transform active:scale-90 ${socialColor === id ? `ring-2 ring-offset-2 ${ring}` : ''}`}
                    aria-label={id} />
                ))}
              </div>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 p-5 space-y-4">
              <h2 className="font-black text-gray-800 dark:text-white text-base">Editar perfil social</h2>
              {([
                { label: 'Nombre completo',    field: 'name'   as const, placeholder: 'Ej: Juan Pérez'        },
                { label: 'Título profesional', field: 'title'  as const, placeholder: 'Ej: Desarrollador Web' },
                { label: 'Ciudad',             field: 'ciudad' as const, placeholder: 'Ej: Buenos Aires'      },
              ]).map(({ label, field, placeholder }) => (
                <div key={field} className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{label}</label>
                  <input type="text" placeholder={placeholder} value={form[field] as string}
                    onChange={(e) => setForm({ ...form, [field]: e.target.value })} className={inputCls} />
                </div>
              ))}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex justify-between">
                  <span>Bio</span>
                  <span className={`normal-case font-normal ${form.bio.length >= MAX_BIO ? 'text-red-400' : 'text-gray-300'}`}>{form.bio.length}/{MAX_BIO}</span>
                </label>
                <textarea value={form.bio} onChange={(e) => { if (e.target.value.length <= MAX_BIO) setForm({ ...form, bio: e.target.value }); }}
                  rows={4} maxLength={MAX_BIO} placeholder="Contá algo sobre vos..." className={`${inputCls} resize-none`} />
              </div>
            </div>
          </>
        )}

        {tabActiva === 'empleo' && (
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 p-5 space-y-4">
            <h2 className="font-black text-gray-800 dark:text-white text-base">Perfil de empleo</h2>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Cargo deseado</label>
              <input type="text" placeholder="Ej: Operario, Vendedor, Programador" value={form.cargoDeseado}
                onChange={(e) => setForm({ ...form, cargoDeseado: e.target.value })} className={inputCls} maxLength={80} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nivel de experiencia</label>
              <div className="flex flex-col gap-2">
                {NIVELES.map((n) => (
                  <button key={n} type="button" onClick={() => setForm({ ...form, nivelExperiencia: n })}
                    className={`text-left px-4 py-3 rounded-2xl text-sm font-bold border transition-all active:scale-95 ${
                      form.nivelExperiencia === n
                        ? 'bg-[var(--sc-100)] dark:bg-[var(--sc-700)]/20 border-[var(--sc-500)] text-[var(--sc-700)] dark:text-[var(--sc-100)]'
                        : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300'
                    }`}>{n}</button>
                ))}
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Expectativa salarial (opcional)</label>
              <input type="text" placeholder="Ej: $500.000 - Negociable" value={form.salarioEsperado}
                onChange={(e) => setForm({ ...form, salarioEsperado: e.target.value })} className={inputCls} maxLength={60} />
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
              <div>
                <p className="font-black text-gray-800 dark:text-white text-sm">Disponible para trabajar</p>
                <p className="text-xs text-gray-400">Visible en tu perfil público</p>
              </div>
              <button onClick={() => setForm({ ...form, disponible: !form.disponible })}
                className={`relative w-12 h-6 rounded-full transition-colors ${form.disponible ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${form.disponible ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>
        )}

        {status && (
          <div className={`flex items-center gap-2 p-3 rounded-2xl text-sm font-bold ${status.tipo === 'exito' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`} role="alert">
            {status.tipo === 'exito' ? <CheckCircleIcon className="w-5 h-5 shrink-0" /> : <ExclamationCircleIcon className="w-5 h-5 shrink-0" />}
            {status.texto}
          </div>
        )}

        <button onClick={saveProfile} disabled={guardando}
          className="w-full bg-[--sc-500] hover:bg-[--sc-600] text-white font-black py-4 rounded-2xl transition-colors disabled:opacity-60">
          {guardando ? 'Guardando...' : 'Guardar perfil'}
        </button>

        {/* Mis publicaciones como feed completo */}
        {postsZona.length > 0 && (
          <div className="space-y-3">
            <h2 className="font-black text-gray-800 dark:text-white text-base px-1">
              Mis publicaciones ({postsZona.length})
            </h2>
            {postsZona.map((p) => {
              const miReaccion = p.reactions?.[user?.uid ?? ''];
              const editando   = editandoId === p.id;
              const avatarFallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(p.userName || 'U')}&background=7c3aed&color=fff`;
              return (
                <article key={p.id} className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                  <div className="flex gap-3 items-center p-4 pb-3">
                    <img src={fotoURL || avatarFallback} alt={p.userName} className="w-11 h-11 rounded-full object-cover ring-2 ring-purple-100 dark:ring-purple-900" />
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-gray-900 dark:text-gray-100 text-sm">{p.userName || 'Usuario'}</p>
                      <p className="text-xs text-gray-400">{formatFecha(p.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => { setEditandoId(p.id); setEditTexto(p.text); }}
                        className="p-2 rounded-full bg-blue-50 dark:bg-blue-900/20 active:scale-90 transition-transform">
                        <PencilIcon className="w-4 h-4 text-blue-500" />
                      </button>
                      <button onClick={() => handleEliminar(p)}
                        className="p-2 rounded-full bg-red-50 dark:bg-red-900/20 active:scale-90 transition-transform">
                        <TrashIcon className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </div>

                  {reportandoId === p.id && (
                    <div className="mx-4 mb-3 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-2xl flex items-center justify-between">
                      <p className="text-xs text-orange-700 font-bold">¿Reportar esta publicación?</p>
                      <div className="flex gap-2">
                        <button onClick={() => handleReportar(p.id)} className="text-xs bg-orange-500 text-white px-3 py-1 rounded-full font-bold active:scale-95">Sí</button>
                        <button onClick={() => setReportandoId(null)} className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 px-3 py-1 rounded-full font-bold active:scale-95">No</button>
                      </div>
                    </div>
                  )}

                  {editando ? (
                    <div className="px-4 pb-3 space-y-2">
                      <textarea value={editTexto}
                        onChange={(e) => { if (e.target.value.length <= 500) setEditTexto(e.target.value); }}
                        className="w-full border border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 text-gray-800 dark:text-gray-100 rounded-2xl p-3 text-sm resize-none focus:outline-none h-24"
                        maxLength={500} />
                      <div className="flex gap-2">
                        <button onClick={() => { setEditandoId(null); setEditTexto(''); }}
                          className="flex-1 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-500 text-sm font-bold active:scale-95">
                          Cancelar
                        </button>
                        <button onClick={() => handleEditarGuardar(p.id)} disabled={guardandoEdit || !editTexto.trim()}
                          className="flex-1 py-2 rounded-xl bg-blue-500 text-white text-sm font-bold flex items-center justify-center gap-1 active:scale-95 disabled:opacity-50">
                          <CheckIcon className="w-4 h-4" />
                          {guardandoEdit ? 'Guardando...' : 'Guardar'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    p.text && <p className="px-4 pb-3 text-gray-800 dark:text-gray-200 text-sm leading-relaxed">{p.text}</p>
                  )}

                  {p.mediaUrl && (
                    p.mediaType === 'video'
                      ? <video src={p.mediaUrl} controls className="w-full max-h-80 object-cover bg-black" />
                      : <img src={p.mediaUrl} alt="Imagen del post" className="w-full max-h-80 object-cover" loading="lazy" />
                  )}

                  <ResumenReacciones reactions={p.reactions || {}} />

                  <div className="px-4 py-3 flex items-center gap-5 border-t border-gray-100 dark:border-gray-800">
                    <div className="relative">
                      <button onClick={() => setReaccionandoId(reaccionandoId === p.id ? null : p.id)}
                        className="flex items-center gap-1.5 active:scale-90 transition-transform">
                        <span className="text-2xl leading-none">{miReaccion || '🤍'}</span>
                        <span className={`text-sm font-bold ${miReaccion ? 'text-purple-500' : 'text-gray-400'}`}>
                          {Object.keys(p.reactions || {}).length || 0}
                        </span>
                      </button>
                      {reaccionandoId === p.id && (
                        <SelectorReaccion onSelect={(emoji) => handleReaccion(p.id, p.userId, emoji)} />
                      )}
                    </div>
                    <button onClick={() => { setComentandoId(p.id); setComentandoUid(p.userId); }}
                      className="flex items-center gap-1.5 text-gray-400 active:scale-90 transition-transform">
                      <ChatBubbleOvalLeftIcon className="w-6 h-6" />
                    </button>
                    <button onClick={() => handleCompartir(p)}
                      className="flex items-center gap-1.5 text-gray-400 active:scale-90 transition-transform ml-auto">
                      <ShareIcon className="w-5 h-5" />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {postsZona.length === 0 && (
          <div className="text-center py-10 text-gray-400 dark:text-gray-600">
            <p className="text-4xl mb-2">📭</p>
            <p className="font-bold">Sin publicaciones en esta zona</p>
          </div>
        )}
      </div>

      {comentandoId && (
        <ModalComentarios postId={comentandoId} postUserId={comentandoUid}
          onClose={() => { setComentandoId(null); setComentandoUid(''); }} />
      )}

      {reaccionandoId && <div className="fixed inset-0 z-10" onClick={() => setReaccionandoId(null)} />}
      {reportandoId   && <div className="fixed inset-0 z-10" onClick={() => setReportandoId(null)} />}
    </div>
  );
}
