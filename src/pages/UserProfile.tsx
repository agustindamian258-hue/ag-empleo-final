// src/pages/UserProfile.tsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { db, auth } from '../app/firebase';
import {
  doc, getDoc, collection, query, where,
  onSnapshot, setDoc, deleteDoc, serverTimestamp,
  orderBy, addDoc,
} from 'firebase/firestore';
import {
  ArrowLeftIcon, HeartIcon, ChatBubbleLeftRightIcon,
  ChatBubbleOvalLeftIcon, ShareIcon, XMarkIcon,
  PaperAirplaneIcon, FaceSmileIcon,
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid';
import Navbar from '../components/Navbar';
import Menu  from '../components/Menu';

interface UserData {
  name?: string; photo?: string; title?: string;
  bio?: string; ciudad?: string;
}

interface Post {
  id:        string;
  text:      string;
  mediaUrl:  string;
  mediaType: string;
  reactions: Record<string, string>;
  userId:    string;
  userName:  string;
  createdAt: { toDate: () => Date } | null;
}

interface Comment {
  id:        string;
  text:      string;
  userId:    string;
  userName:  string;
  userPhoto: string;
  likes:     string[];
  createdAt: { toDate: () => Date } | null;
}

type Zona = 'social' | 'empleo';

const RUTAS_SOCIAL  = ['/social', '/reels', '/search'];
const REACCIONES    = ['❤️', '😂', '😍', '👍', '😲'];

function formatFecha(createdAt: Post['createdAt']): string {
  if (!createdAt?.toDate) return '';
  return createdAt.toDate().toLocaleDateString('es-AR', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

function ModalComentarios({ postId, postUserId, onClose }: {
  postId: string; postUserId: string; onClose: () => void;
}) {
  const user = auth.currentUser;
  const [comments, setComments] = useState<Comment[]>([]);
  const [texto,    setTexto]    = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'posts', postId, 'comments'), orderBy('createdAt', 'asc'));
    return onSnapshot(q, (snap) =>
      setComments(snap.docs.map(d => ({ id: d.id, ...d.data() } as Comment)))
    );
  }, [postId]);

  async function handleEnviar() {
    if (!user || !texto.trim()) return;
    setEnviando(true);
    try {
      await addDoc(collection(db, 'posts', postId, 'comments'), {
        text: texto.trim().replace(/</g, '&lt;').replace(/>/g, '&gt;'),
        userId: user.uid, userName: user.displayName ?? 'Usuario',
        userPhoto: user.photoURL ?? '', likes: [], replyTo: null,
        createdAt: serverTimestamp(),
      });
      if (postUserId !== user.uid) {
        await addDoc(collection(db, 'notifications'), {
          uid: postUserId,
          titulo: `💬 ${user.displayName ?? 'Alguien'} comentó tu publicación`,
          mensaje: texto.trim().slice(0, 80), tipo: 'comentario',
          leida: false, creadoEn: serverTimestamp(),
        });
      }
      setTexto('');
    } catch (e) { console.error('[UserProfile] comentar:', e); }
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
            return (
              <div key={c.id} className="flex gap-3">
                <img src={avatar} alt={c.userName} className="w-8 h-8 rounded-full object-cover shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl px-3 py-2">
                    <p className="font-black text-xs text-gray-800 dark:text-gray-100">{c.userName}</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-snug">{c.text}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {user && (
          <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800">
            <div className="flex gap-3 items-center">
              <img src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'U')}&background=7c3aed&color=fff`}
                alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
              <input value={texto} onChange={(e) => setTexto(e.target.value)}
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
}

export default function UserProfile() {
  const { uid }  = useParams<{ uid: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const me       = auth.currentUser;

  const zonaState = (location.state as { zona?: Zona } | null)?.zona;
  const zonaRuta: Zona = RUTAS_SOCIAL.some((r) => document.referrer.includes(r)) ? 'social' : 'empleo';
  const zona: Zona = zonaState ?? zonaRuta;

  const [userData,      setUserData]      = useState<UserData | null>(null);
  const [posts,         setPosts]         = useState<Post[]>([]);
  const [siguiendo,     setSiguiendo]     = useState(false);
  const [seguidores,    setSeguidores]    = useState(0);
  const [siguiendoN,    setSiguiendoN]    = useState(0);
  const [isMenuOpen,    setIsMenuOpen]    = useState(false);
  const [cargando,      setCargando]      = useState(true);
  const [iniciandoChat, setIniciandoChat] = useState(false);
  const [vistaGrilla,   setVistaGrilla]   = useState(true);
  const [comentandoId,  setComentandoId]  = useState<string | null>(null);
  const [comentandoUid, setComentandoUid] = useState('');
  const [reaccionandoId,setReaccionandoId]= useState<string | null>(null);

  const esPropioPerfil = me?.uid === uid;
  const followDocId    = me && uid ? `${me.uid}_${uid}_${zona}` : null;

  useEffect(() => {
    if (!uid) return;

    getDoc(doc(db, 'users', uid)).then((snap) => {
      if (snap.exists()) setUserData(snap.data() as UserData);
      setCargando(false);
    });

    const qPosts = query(
      collection(db, 'posts'),
      where('userId', '==', uid),
      orderBy('createdAt', 'desc'),
    );
    const unsubPosts = onSnapshot(qPosts, (snap) =>
      setPosts(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Post)))
    );

    const qSeg = query(collection(db, 'follows'), where('followingId', '==', uid), where('zona', '==', zona));
    const unsubSeg = onSnapshot(qSeg, (snap) => setSeguidores(snap.size));

    const qSig = query(collection(db, 'follows'), where('followerId', '==', uid), where('zona', '==', zona));
    const unsubSig = onSnapshot(qSig, (snap) => setSiguiendoN(snap.size));

    if (me && !esPropioPerfil && followDocId) {
      const unsubFollow = onSnapshot(doc(db, 'follows', followDocId), (snap) => setSiguiendo(snap.exists()));
      return () => { unsubPosts(); unsubSeg(); unsubSig(); unsubFollow(); };
    }

    return () => { unsubPosts(); unsubSeg(); unsubSig(); };
  }, [uid, me, esPropioPerfil, zona, followDocId]);

  async function handleFollow() {
    if (!me || !uid || !followDocId) return;
    const followRef = doc(db, 'follows', followDocId);
    if (siguiendo) {
      await deleteDoc(followRef);
    } else {
      await setDoc(followRef, { followerId: me.uid, followingId: uid, zona, createdAt: serverTimestamp() });
      await addDoc(collection(db, 'notifications'), {
        uid, titulo: `👤 ${me.displayName ?? 'Alguien'} te siguió en ${zona === 'social' ? 'Social' : 'Empleo'}`,
        mensaje: '', tipo: 'seguidor', leida: false, creadoEn: serverTimestamp(),
      });
    }
  }

  async function handleReaccion(postId: string, postUserId: string, emoji: string) {
    if (!me) return;
    setReaccionandoId(null);
    const postRef = doc(db, 'posts', postId);
    try {
      const snap = await getDoc(postRef);
      const reactions: Record<string, string> = snap.data()?.reactions || {};
      if (reactions[me.uid] === emoji) {
        const updated = { ...reactions }; delete updated[me.uid];
        await setDoc(postRef, { reactions: updated }, { merge: true });
      } else {
        await setDoc(postRef, { [`reactions.${me.uid}`]: emoji }, { merge: true });
        if (postUserId !== me.uid) {
          await addDoc(collection(db, 'notifications'), {
            uid: postUserId,
            titulo: `${emoji} ${me.displayName ?? 'Alguien'} reaccionó a tu publicación`,
            mensaje: emoji, tipo: 'like', leida: false, creadoEn: serverTimestamp(),
          });
        }
      }
    } catch (e) { console.error('[UserProfile] reacción:', e); }
  }

  function handleCompartir(post: Post) {
    const url = `${window.location.origin}/user/${post.userId}`;
    if (navigator.share) {
      navigator.share({ title: 'AG Empleo', text: post.text || 'Mirá esta publicación', url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url).catch(() => {});
    }
  }

  async function iniciarChat() {
    if (!me || !uid || iniciandoChat) return;
    setIniciandoChat(true);
    try {
      const chatId  = [me.uid, uid].sort().join('_');
      const chatRef = doc(db, 'chats', chatId);
      const snap    = await getDoc(chatRef);
      if (!snap.exists()) {
        const [meSnap, otherSnap] = await Promise.all([
          getDoc(doc(db, 'users', me.uid)),
          getDoc(doc(db, 'users', uid)),
        ]);
        const meData    = meSnap.exists()    ? meSnap.data()    : {};
        const otherData = otherSnap.exists() ? otherSnap.data() : {};
        await setDoc(chatRef, {
          participants: [me.uid, uid].sort(),
          participantData: {
            [me.uid]: { name: meData.name    || me.displayName || 'Yo',      photo: meData.photo    || me.photoURL    || '' },
            [uid]:    { name: otherData.name || userData?.name || 'Usuario', photo: otherData.photo || userData?.photo || '' },
          },
          lastMessage: '', lastMessageAt: serverTimestamp(), unreadBy: [],
        });
      }
      navigate(`/chat/${chatId}`);
    } catch (e) { console.error('[UserProfile] iniciarChat', e); }
    finally { setIniciandoChat(false); }
  }

  if (cargando) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
      <div className="w-8 h-8 border-4 border-[var(--sc-600)] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const avatarUrl = userData?.photo ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(userData?.name || 'U')}&background=${zona === 'social' ? '7c3aed' : '3b82f6'}&color=fff&size=128`;

  const zonaBadge = zona === 'social'
    ? { label: '🌐 Red Social', cls: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' }
    : { label: '💼 Red Empleo', cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-24">
      <header className="sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-5 py-4 flex items-center gap-3 shadow-sm">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 active:scale-90 transition-transform">
          <ArrowLeftIcon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        </button>
        <h1 className="font-black text-gray-900 dark:text-white text-lg truncate flex-1">{userData?.name || 'Perfil'}</h1>
        <span className={`text-[10px] font-black px-2 py-1 rounded-full ${zonaBadge.cls}`}>{zonaBadge.label}</span>
      </header>

      <div className="max-w-lg mx-auto px-4 pt-6 space-y-4">
        <div className="flex flex-col items-center gap-3">
          <img src={avatarUrl} alt="foto" className="w-24 h-24 rounded-full object-cover ring-4 ring-purple-100 dark:ring-purple-900 shadow-md" />
          <div className="text-center">
            <p className="font-black text-xl text-gray-900 dark:text-white">{userData?.name || 'Usuario'}</p>
            {userData?.title  && <p className="text-sm text-[var(--sc-600)] font-bold">{userData.title}</p>}
            {userData?.ciudad && <p className="text-xs text-gray-400">📍 {userData.ciudad}</p>}
          </div>

          <div className="flex gap-8">
            {[
              { value: posts.length, label: 'Posts' },
              { value: seguidores,   label: 'Seguidores' },
              { value: siguiendoN,   label: 'Siguiendo' },
            ].map((s) => (
              <div key={s.label} className="flex flex-col items-center">
                <span className="font-black text-xl text-gray-900 dark:text-white">{s.value}</span>
                <span className="text-xs text-gray-400">{s.label}</span>
              </div>
            ))}
          </div>

          {userData?.bio && (
            <p className="text-sm text-gray-600 dark:text-gray-300 text-center leading-relaxed px-4">{userData.bio}</p>
          )}

          {!esPropioPerfil && me && (
            <div className="flex gap-3">
              <button onClick={handleFollow}
                className={`px-7 py-2.5 rounded-full font-black text-sm transition-all active:scale-95 ${
                  siguiendo
                    ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600'
                    : zona === 'social'
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'bg-blue-600 text-white shadow-md'
                }`}>
                {siguiendo ? 'Dejar de seguir' : `Seguir en ${zona === 'social' ? 'Social' : 'Empleo'}`}
              </button>
              <button onClick={iniciarChat} disabled={iniciandoChat}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full font-black text-sm bg-teal-500 text-white shadow-md active:scale-95 transition-all disabled:opacity-60">
                <ChatBubbleLeftRightIcon className="w-4 h-4" />
                Mensaje
              </button>
            </div>
          )}

          {esPropioPerfil && (
            <button onClick={() => navigate('/profile', { state: { zona } })}
              className="px-8 py-2.5 rounded-full font-black text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 active:scale-95 transition-all">
              Editar perfil
            </button>
          )}
        </div>

        {/* Toggle vista grilla/feed */}
        {posts.length > 0 && (
          <div className="flex gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-2xl">
            <button onClick={() => setVistaGrilla(true)}
              className={`flex-1 py-2 rounded-xl text-sm font-black transition-all ${vistaGrilla ? 'bg-white dark:bg-gray-900 shadow-sm text-gray-900 dark:text-white' : 'text-gray-400'}`}>
              ⊞ Grilla
            </button>
            <button onClick={() => setVistaGrilla(false)}
              className={`flex-1 py-2 rounded-xl text-sm font-black transition-all ${!vistaGrilla ? 'bg-white dark:bg-gray-900 shadow-sm text-gray-900 dark:text-white' : 'text-gray-400'}`}>
              ☰ Feed
            </button>
          </div>
        )}

        {/* Vista grilla */}
        {vistaGrilla && posts.length > 0 && (
          <div className="grid grid-cols-3 gap-1.5">
            {posts.map((p) => (
              <button key={p.id} onClick={() => setVistaGrilla(false)}
                className="aspect-square rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 relative active:opacity-80">
                {p.mediaUrl ? (
                  p.mediaType === 'video'
                    ? <video src={p.mediaUrl} className="w-full h-full object-cover" />
                    : <img src={p.mediaUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center p-2">
                    <p className="text-[10px] text-gray-400 text-center line-clamp-4">{p.text}</p>
                  </div>
                )}
                {Object.keys(p.reactions || {}).length > 0 && (
                  <div className="absolute bottom-1 right-1 flex items-center gap-0.5 bg-black/50 rounded-full px-1.5 py-0.5">
                    <HeartIcon className="w-3 h-3 text-white" />
                    <span className="text-[9px] text-white font-bold">{Object.keys(p.reactions).length}</span>
                  </div>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Vista feed con reacciones y comentarios */}
        {!vistaGrilla && posts.length > 0 && (
          <div className="space-y-3">
            {posts.map((p) => {
              const miReaccion = p.reactions?.[me?.uid ?? ''];
              const avatarFallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(userData?.name || 'U')}&background=7c3aed&color=fff`;
              return (
                <article key={p.id} className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                  <div className="flex gap-3 items-center p-4 pb-3">
                    <img src={avatarUrl || avatarFallback} alt={userData?.name} className="w-10 h-10 rounded-full object-cover ring-2 ring-purple-100 dark:ring-purple-900" />
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-gray-900 dark:text-gray-100 text-sm">{userData?.name || 'Usuario'}</p>
                      <p className="text-xs text-gray-400">{formatFecha(p.createdAt)}</p>
                    </div>
                  </div>

                  {p.text && <p className="px-4 pb-3 text-gray-800 dark:text-gray-200 text-sm leading-relaxed">{p.text}</p>}

                  {p.mediaUrl && (
                    p.mediaType === 'video'
                      ? <video src={p.mediaUrl} controls className="w-full max-h-80 object-cover bg-black" />
                      : <img src={p.mediaUrl} alt="Imagen del post" className="w-full max-h-80 object-cover" loading="lazy" />
                  )}

                  {/* Resumen reacciones */}
                  {Object.keys(p.reactions || {}).length > 0 && (
                    <div className="flex items-center gap-1 px-4 pb-2">
                      {Object.values(p.reactions).slice(0, 3).map((emoji, i) => (
                        <span key={i} className="text-base">{emoji}</span>
                      ))}
                      <span className="text-xs text-gray-400 ml-1">{Object.keys(p.reactions).length}</span>
                    </div>
                  )}

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
                        <div className="absolute bottom-10 left-0 z-20 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-2 flex items-center gap-1">
                          {REACCIONES.map((e) => (
                            <button key={e} onClick={() => handleReaccion(p.id, p.userId, e)}
                              className="text-2xl active:scale-125 transition-transform hover:scale-110">{e}</button>
                          ))}
                        </div>
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

        {posts.length === 0 && (
          <div className="text-center py-16 text-gray-300 dark:text-gray-600">
            <p className="text-4xl mb-2">📭</p>
            <p className="font-bold">Sin publicaciones</p>
          </div>
        )}
      </div>

      {comentandoId && (
        <ModalComentarios postId={comentandoId} postUserId={comentandoUid}
          onClose={() => { setComentandoId(null); setComentandoUid(''); }} />
      )}

      {reaccionandoId && <div className="fixed inset-0 z-10" onClick={() => setReaccionandoId(null)} />}

      <Navbar onMenuClick={() => setIsMenuOpen(true)} />
      <Menu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </div>
  );
    }
