// src/pages/UserProfile.tsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { db, auth } from '../app/firebase';
import {
  doc, getDoc, collection, query, where,
  onSnapshot, setDoc, deleteDoc, serverTimestamp,
} from 'firebase/firestore';
import { ArrowLeftIcon, HeartIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import Navbar from '../components/Navbar';
import Menu  from '../components/Menu';

interface UserData {
  name?: string; photo?: string; title?: string;
  bio?: string; ciudad?: string;
}

interface Post {
  id: string; text: string; mediaUrl: string;
  mediaType: string; likes: string[];
}

type Zona = 'social' | 'empleo';

const RUTAS_SOCIAL = ['/social', '/reels', '/search'];

export default function UserProfile() {
  const { uid }  = useParams<{ uid: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const me       = auth.currentUser;

  // Detecta zona activa por la ruta anterior (state) o pathname actual
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

  const esPropioPerfil = me?.uid === uid;

  // ID de follow con zona embebida — evita mezcla entre redes
  const followDocId = me && uid ? `${me.uid}_${uid}_${zona}` : null;

  useEffect(() => {
    if (!uid) return;

    getDoc(doc(db, 'users', uid)).then((snap) => {
      if (snap.exists()) setUserData(snap.data() as UserData);
      setCargando(false);
    });

    // Posts del usuario
    const qPosts = query(collection(db, 'posts'), where('userId', '==', uid));
    const unsubPosts = onSnapshot(qPosts, (snap) =>
      setPosts(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Post)))
    );

    // Seguidores en esta zona específica
    const qSeg = query(
      collection(db, 'follows'),
      where('followingId', '==', uid),
      where('zona', '==', zona),
    );
    const unsubSeg = onSnapshot(qSeg, (snap) => setSeguidores(snap.size));

    // Siguiendo en esta zona específica
    const qSig = query(
      collection(db, 'follows'),
      where('followerId', '==', uid),
      where('zona', '==', zona),
    );
    const unsubSig = onSnapshot(qSig, (snap) => setSiguiendoN(snap.size));

    // Estado de follow del usuario actual en esta zona
    if (me && !esPropioPerfil && followDocId) {
      const followRef  = doc(db, 'follows', followDocId);
      const unsubFollow = onSnapshot(followRef, (snap) => setSiguiendo(snap.exists()));
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
      await setDoc(followRef, {
        followerId:  me.uid,
        followingId: uid,
        zona,                      // <-- campo clave que separa las redes
        createdAt:   serverTimestamp(),
      });
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
            [me.uid]: {
              name:  meData.name    || me.displayName || 'Yo',
              photo: meData.photo   || me.photoURL    || '',
            },
            [uid]: {
              name:  otherData.name  || userData?.name  || 'Usuario',
              photo: otherData.photo || userData?.photo || '',
            },
          },
          lastMessage:   '',
          lastMessageAt: serverTimestamp(),
          unreadBy:      [],
        });
      }
      navigate(`/chat/${chatId}`);
    } catch (e) {
      console.error('[UserProfile] iniciarChat', e);
    } finally {
      setIniciandoChat(false);
    }
  }

  if (cargando) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
      <div className="w-8 h-8 border-4 border-[var(--sc-600)] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const avatarUrl = userData?.photo ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(userData?.name || 'U')}&background=${
      zona === 'social' ? '7c3aed' : '3b82f6'
    }&color=fff&size=128`;

  const zonaBadge = zona === 'social'
    ? { label: '🌐 Red Social',  cls: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' }
    : { label: '💼 Red Empleo',  cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-24">

      <header className="sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-5 py-4 flex items-center gap-3 shadow-sm">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 active:scale-90 transition-transform"
        >
          <ArrowLeftIcon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        </button>
        <h1 className="font-black text-gray-900 dark:text-white text-lg truncate flex-1">
          {userData?.name || 'Perfil'}
        </h1>
        {/* Badge de zona visible en el header */}
        <span className={`text-[10px] font-black px-2 py-1 rounded-full ${zonaBadge.cls}`}>
          {zonaBadge.label}
        </span>
      </header>

      <div className="max-w-lg mx-auto px-4 pt-6 space-y-4">

        <div className="flex flex-col items-center gap-3">
          <img
            src={avatarUrl}
            alt="foto"
            className="w-24 h-24 rounded-full object-cover ring-4 ring-purple-100 dark:ring-purple-900 shadow-md"
          />
          <div className="text-center">
            <p className="font-black text-xl text-gray-900 dark:text-white">{userData?.name || 'Usuario'}</p>
            {userData?.title  && <p className="text-sm text-[var(--sc-600)] font-bold">{userData.title}</p>}
            {userData?.ciudad && <p className="text-xs text-gray-400">📍 {userData.ciudad}</p>}
          </div>

          {/* Stats — contadores filtrados por zona */}
          <div className="flex gap-8">
            <div className="flex flex-col items-center">
              <span className="font-black text-xl text-gray-900 dark:text-white">{posts.length}</span>
              <span className="text-xs text-gray-400">Posts</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="font-black text-xl text-gray-900 dark:text-white">{seguidores}</span>
              <span className="text-xs text-gray-400">Seguidores</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="font-black text-xl text-gray-900 dark:text-white">{siguiendoN}</span>
              <span className="text-xs text-gray-400">Siguiendo</span>
            </div>
          </div>

          {userData?.bio && (
            <p className="text-sm text-gray-600 dark:text-gray-300 text-center leading-relaxed px-4">
              {userData.bio}
            </p>
          )}

          {/* Acciones */}
          {!esPropioPerfil && me && (
            <div className="flex gap-3">
              <button
                onClick={handleFollow}
                className={`px-7 py-2.5 rounded-full font-black text-sm transition-all active:scale-95 ${
                  siguiendo
                    ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600'
                    : zona === 'social'
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'bg-blue-600 text-white shadow-md'
                }`}
              >
                {siguiendo ? 'Dejar de seguir' : `Seguir en ${zona === 'social' ? 'Social' : 'Empleo'}`}
              </button>
              <button
                onClick={iniciarChat}
                disabled={iniciandoChat}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full font-black text-sm bg-teal-500 text-white shadow-md active:scale-95 transition-all disabled:opacity-60"
              >
                <ChatBubbleLeftRightIcon className="w-4 h-4" />
                Mensaje
              </button>
            </div>
          )}

          {esPropioPerfil && (
            <button
              onClick={() => navigate('/profile', { state: { zona } })}
              className="px-8 py-2.5 rounded-full font-black text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 active:scale-95 transition-all"
            >
              Editar perfil
            </button>
          )}
        </div>

        {/* Grid de posts */}
        {posts.length > 0 ? (
          <div className="grid grid-cols-3 gap-1.5">
            {posts.map((p) => (
              <div key={p.id} className="aspect-square rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 relative">
                {p.mediaUrl ? (
                  p.mediaType === 'video'
                    ? <video src={p.mediaUrl} className="w-full h-full object-cover" />
                    : <img src={p.mediaUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center p-2">
                    <p className="text-[10px] text-gray-400 text-center line-clamp-4">{p.text}</p>
                  </div>
                )}
                {p.likes?.length > 0 && (
                  <div className="absolute bottom-1 right-1 flex items-center gap-0.5 bg-black/50 rounded-full px-1.5 py-0.5">
                    <HeartIcon className="w-3 h-3 text-white" />
                    <span className="text-[9px] text-white font-bold">{p.likes.length}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-gray-300 dark:text-gray-600">
            <p className="text-4xl mb-2">📭</p>
            <p className="font-bold">Sin publicaciones</p>
          </div>
        )}
      </div>

      <Navbar onMenuClick={() => setIsMenuOpen(true)} />
      <Menu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </div>
  );
                }
