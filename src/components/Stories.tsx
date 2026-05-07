// src/components/Stories.tsx
import { useState, useEffect, useRef } from 'react';
import { db, auth } from '../app/firebase';
import {
  collection, addDoc, query, orderBy, onSnapshot,
  serverTimestamp, where, doc, updateDoc, arrayUnion, getDoc, setDoc, deleteDoc,
} from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { subirArchivoCloudinary } from '../utils/cloudinary';
import { PlusIcon, XMarkIcon, PaperAirplaneIcon, EyeIcon, TrashIcon, FlagIcon } from '@heroicons/react/24/outline';

interface Story {
  id:         string;
  userId:     string;
  userName:   string;
  userPhoto:  string;
  mediaUrl:   string;
  mediaType:  'image' | 'video';
  createdAt:  { toDate: () => Date } | null;
  vistos:     string[];
  reacciones: Record<string, string>;
}

interface StoryGroup {
  userId:    string;
  userName:  string;
  userPhoto: string;
  stories:   Story[];
  visto:     boolean;
}

const MAX_MB             = 50;
const STORY_EXPIRE_MS    = 12 * 60 * 60 * 1000;
const REACCIONES_RAPIDAS = ['❤️', '😂', '😍', '👏', '😲'];
const HOLD_DELAY_MS      = 150;

function VisorStory({ grupo, onClose }: { grupo: StoryGroup; onClose: () => void }) {
  const user     = auth.currentUser;
  const navigate = useNavigate();

  const [idx,            setIdx]            = useState(0);
  const [progreso,       setProgreso]       = useState(0);
  const [pausado,        setPausado]        = useState(false);
  const [mostrarVistos,  setMostrarVistos]  = useState(false);
  const [mostrarOpciones,setMostrarOpciones]= useState(false);
  const [respuesta,      setRespuesta]      = useState('');
  const [enviando,       setEnviando]       = useState(false);

  const timerRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const holdTimer = useRef<ReturnType<typeof setTimeout>  | null>(null);
  const isHolding = useRef(false);
  const progresoRef = useRef(0);

  const story  = grupo.stories[idx];
  const esMia  = story?.userId === user?.uid;
  const DURACION = story?.mediaType === 'video' ? 15000 : 5000;

  // Marcar como visto
  useEffect(() => {
    if (user && story && !esMia && !story.vistos?.includes(user.uid)) {
      updateDoc(doc(db, 'stories', story.id), { vistos: arrayUnion(user.uid) }).catch(() => {});
    }
  }, [story?.id]);

  // Timer
  function iniciarTimer() {
    if (timerRef.current) clearInterval(timerRef.current);
    const startProg = progresoRef.current;
    const startTime = Date.now() - (startProg / 100) * DURACION;

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const p = Math.min((elapsed / DURACION) * 100, 100);
      progresoRef.current = p;
      setProgreso(p);
      if (p >= 100) {
        clearInterval(timerRef.current!);
        progresoRef.current = 0;
        setIdx((prev) => {
          if (prev < grupo.stories.length - 1) return prev + 1;
          onClose();
          return prev;
        });
      }
    }, 50);
  }

  function detenerTimer() {
    if (timerRef.current) clearInterval(timerRef.current);
  }

  useEffect(() => {
    progresoRef.current = 0;
    setProgreso(0);
    if (!pausado) iniciarTimer();
    return () => detenerTimer();
  }, [idx]);

  useEffect(() => {
    if (pausado) {
      detenerTimer();
    } else {
      iniciarTimer();
    }
  }, [pausado]);

  useEffect(() => {
    setPausado(mostrarVistos || mostrarOpciones || !!respuesta);
  }, [mostrarVistos, mostrarOpciones, respuesta]);

  // Hold handlers
  function onTouchStart(side: 'left' | 'right') {
    isHolding.current = false;
    holdTimer.current = setTimeout(() => {
      isHolding.current = true;
      setPausado(true);
    }, HOLD_DELAY_MS);
  }

  function onTouchEnd(side: 'left' | 'right') {
    if (holdTimer.current) clearTimeout(holdTimer.current);
    if (isHolding.current) {
      setPausado(false);
      isHolding.current = false;
      return;
    }
    if (side === 'left') {
      progresoRef.current = 0;
      setIdx((prev) => Math.max(0, prev - 1));
    } else {
      progresoRef.current = 0;
      if (idx < grupo.stories.length - 1) {
        setIdx((prev) => prev + 1);
      } else {
        onClose();
      }
    }
  }

  async function handleReaccion(emoji: string) {
    if (!user || !story) return;
    try {
      await updateDoc(doc(db, 'stories', story.id), { [`reacciones.${user.uid}`]: emoji });
      if (story.userId !== user.uid) {
        await addDoc(collection(db, 'notifications'), {
          uid: story.userId, titulo: `${emoji} ${user.displayName ?? 'Alguien'} reaccionó a tu historia`,
          mensaje: emoji, tipo: 'reaccion', leida: false, creadoEn: serverTimestamp(),
        });
      }
    } catch (e) { console.error('[Stories] reacción:', e); }
  }

  async function handleEliminar() {
    if (!story || !esMia) return;
    try {
      await deleteDoc(doc(db, 'stories', story.id));
      if (grupo.stories.length <= 1) {
        onClose();
      } else {
        progresoRef.current = 0;
        setIdx((prev) => Math.max(0, prev - 1));
      }
    } catch (e) { console.error('[Stories] eliminar:', e); }
  }

  async function handleReportar() {
    if (!user || !story) return;
    setMostrarOpciones(false);
    try {
      await addDoc(collection(db, 'reports'), {
        storyId: story.id, reportadoPor: user.uid,
        creadoEn: serverTimestamp(), revisado: false,
      });
    } catch (e) { console.error('[Stories] reportar:', e); }
  }

  async function handleResponder() {
    if (!user || !respuesta.trim() || !story) return;
    setEnviando(true);
    try {
      const chatId   = [user.uid, story.userId].sort().join('_');
      const chatRef  = doc(db, 'chats', chatId);
      const chatSnap = await getDoc(chatRef);
      const msg      = `↩️ Historia: "${respuesta.trim()}"`;
      if (!chatSnap.exists()) {
        const [meSnap, otherSnap] = await Promise.all([
          getDoc(doc(db, 'users', user.uid)),
          getDoc(doc(db, 'users', story.userId)),
        ]);
        const meData    = meSnap.exists()    ? meSnap.data()    : {};
        const otherData = otherSnap.exists() ? otherSnap.data() : {};
        await setDoc(chatRef, {
          participants: [user.uid, story.userId].sort(),
          participantData: {
            [user.uid]:     { name: meData.name    || user.displayName || 'Yo',      photo: meData.photo    || user.photoURL   || '' },
            [story.userId]: { name: otherData.name || story.userName   || 'Usuario', photo: otherData.photo || story.userPhoto || '' },
          },
          lastMessage: msg, lastMessageAt: serverTimestamp(), unreadBy: [story.userId],
        });
      } else {
        await updateDoc(chatRef, { lastMessage: msg, lastMessageAt: serverTimestamp(), unreadBy: [story.userId] });
      }
      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        senderId: user.uid, text: msg, createdAt: serverTimestamp(),
      });
      await addDoc(collection(db, 'notifications'), {
        uid: story.userId, titulo: `💬 ${user.displayName ?? 'Alguien'} respondió tu historia`,
        mensaje: respuesta.trim().slice(0, 80), tipo: 'mensaje', leida: false, creadoEn: serverTimestamp(),
      });
      setRespuesta('');
      navigate(`/chat/${chatId}`);
    } catch (e) { console.error('[Stories] responder:', e); }
    finally { setEnviando(false); }
  }

  if (!story) return null;

  const miReaccion  = story.reacciones?.[user?.uid ?? ''];
  const totalVistos = story.vistos?.length ?? 0;

  return (
    <div className="fixed inset-0 z-[300] bg-black flex flex-col select-none">

      {/* Barras progreso */}
      <div className="absolute top-4 left-3 right-3 flex gap-1 z-10">
        {grupo.stories.map((_, i) => (
          <div key={i} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
            <div className="h-full bg-white rounded-full transition-none"
              style={{ width: `${i < idx ? 100 : i === idx ? progreso : 0}%` }} />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="absolute top-8 left-4 right-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <img
            src={grupo.userPhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(grupo.userName)}&background=7c3aed&color=fff`}
            alt={grupo.userName} className="w-9 h-9 rounded-full object-cover ring-2 ring-white"
          />
          <div>
            <p className="text-white font-black text-sm drop-shadow">{grupo.userName}</p>
            <p className="text-white/60 text-xs">
              {story.createdAt?.toDate().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {esMia && (
            <>
              <button onClick={() => setMostrarVistos(true)}
                className="flex items-center gap-1 bg-black/40 rounded-full px-3 py-1">
                <EyeIcon className="w-4 h-4 text-white" />
                <span className="text-white text-xs font-bold">{totalVistos}</span>
              </button>
              <button onClick={handleEliminar}
                className="w-8 h-8 rounded-full bg-black/40 flex items-center justify-center">
                <TrashIcon className="w-4 h-4 text-red-400" />
              </button>
            </>
          )}
          {!esMia && (
            <button onClick={() => setMostrarOpciones(true)}
              className="w-8 h-8 rounded-full bg-black/40 flex items-center justify-center">
              <FlagIcon className="w-4 h-4 text-white" />
            </button>
          )}
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-black/40 flex items-center justify-center">
            <XMarkIcon className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Media */}
      {story.mediaType === 'video'
        ? <video src={story.mediaUrl} autoPlay muted playsInline className="w-full h-full object-cover" />
        : <img src={story.mediaUrl} alt="story" className="w-full h-full object-cover" />
      }

      {/* Zonas tap/hold */}
      <div className="absolute inset-x-0 top-0 flex z-10" style={{ bottom: esMia ? '0' : '130px' }}>
        <div className="flex-1 h-full"
          onTouchStart={() => onTouchStart('left')}
          onTouchEnd={() => onTouchEnd('left')}
          onMouseDown={() => onTouchStart('left')}
          onMouseUp={() => onTouchEnd('left')}
        />
        <div className="flex-1 h-full"
          onTouchStart={() => onTouchStart('right')}
          onTouchEnd={() => onTouchEnd('right')}
          onMouseDown={() => onTouchStart('right')}
          onMouseUp={() => onTouchEnd('right')}
        />
      </div>

      {/* Bottom: reacciones + respuesta (solo para historias ajenas) */}
      {!esMia && (
        <div className="absolute bottom-0 left-0 right-0 z-20 px-4 pb-8 pt-4 space-y-3 bg-gradient-to-t from-black/60 to-transparent">
          <div className="flex justify-center gap-3">
            {REACCIONES_RAPIDAS.map((emoji) => (
              <button key={emoji} onClick={() => handleReaccion(emoji)}
                className={`text-2xl transition-transform active:scale-125 ${miReaccion === emoji ? 'scale-125' : ''}`}>
                {emoji}
              </button>
            ))}
          </div>
          <div className="flex gap-2 items-center">
            <input
              value={respuesta}
              onChange={(e) => setRespuesta(e.target.value)}
              onFocus={() => setPausado(true)}
              onBlur={() => { if (!respuesta) setPausado(false); }}
              onKeyDown={(e) => e.key === 'Enter' && handleResponder()}
              placeholder="Responder historia..."
              maxLength={200}
              className="flex-1 bg-white/20 backdrop-blur rounded-full px-4 py-2.5 text-white placeholder-white/60 text-sm focus:outline-none focus:ring-2 focus:ring-white/50"
            />
            {respuesta.trim() && (
              <button onClick={handleResponder} disabled={enviando}
                className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center active:scale-90 transition-transform disabled:opacity-50">
                <PaperAirplaneIcon className="w-5 h-5 text-white" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Modal vistos */}
      {mostrarVistos && esMia && (
        <div className="fixed inset-0 z-[400] flex items-end justify-center bg-black/60"
          onClick={(e) => e.target === e.currentTarget && setMostrarVistos(false)}>
          <div className="w-full max-w-lg bg-gray-900 rounded-t-3xl px-5 pt-5 pb-10 space-y-3 overflow-y-auto" style={{ maxHeight: '60vh' }}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-black text-white flex items-center gap-2">
                <EyeIcon className="w-5 h-5" /> Visto por {totalVistos}
              </h3>
              <button onClick={() => setMostrarVistos(false)} className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center">
                <XMarkIcon className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            {Object.entries(story.reacciones || {}).length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Reacciones</p>
                {Object.entries(story.reacciones || {}).map(([uid, emoji]) => (
                  <div key={uid} className="flex items-center justify-between py-2 border-b border-gray-800">
                    <span className="text-gray-300 text-sm">{uid === user?.uid ? 'Vos' : uid.slice(0, 8) + '...'}</span>
                    <span className="text-2xl">{emoji}</span>
                  </div>
                ))}
              </div>
            )}
            {totalVistos === 0 && (
              <div className="text-center py-8 text-gray-600">
                <p className="text-3xl mb-2">👁️</p>
                <p className="text-sm font-bold">Nadie vio esta historia aún</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal opciones (reportar) */}
      {mostrarOpciones && !esMia && (
        <div className="fixed inset-0 z-[400] flex items-end justify-center bg-black/60"
          onClick={(e) => e.target === e.currentTarget && setMostrarOpciones(false)}>
          <div className="w-full max-w-lg bg-gray-900 rounded-t-3xl px-5 pt-5 pb-10 space-y-2">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-black text-white">Opciones</h3>
              <button onClick={() => setMostrarOpciones(false)} className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center">
                <XMarkIcon className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <button onClick={handleReportar}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-red-900/20 text-red-400 font-bold text-sm active:scale-95 transition-transform">
              <FlagIcon className="w-5 h-5" />
              Reportar historia
            </button>
            <button onClick={() => setMostrarOpciones(false)}
              className="w-full px-4 py-3 rounded-2xl bg-gray-800 text-gray-300 font-bold text-sm active:scale-95 transition-transform">
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Stories() {
  const user = auth.currentUser;

  const [stories,     setStories]     = useState<Story[]>([]);
  const [subiendo,    setSubiendo]    = useState(false);
  const [viendoGrupo, setViendoGrupo] = useState<StoryGroup | null>(null);
  const [vistos,      setVistos]      = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem('ag_stories_vistos');
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch { return new Set(); }
  });

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const corte = new Date(Date.now() - STORY_EXPIRE_MS);
    const q = query(
      collection(db, 'stories'),
      where('createdAt', '>=', corte),
      orderBy('createdAt', 'desc')
    );
    return onSnapshot(q, (snap) =>
      setStories(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Story)))
    );
  }, []);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f || !user) return;
    if (!f.type.startsWith('image/') && !f.type.startsWith('video/')) return;
    if (f.size > MAX_MB * 1024 * 1024) return;
    setSubiendo(true);
    try {
      const { url: mediaUrl, tipo: mediaType } = await subirArchivoCloudinary(f);
      await addDoc(collection(db, 'stories'), {
        userId:     user.uid,
        userName:   user.displayName ?? 'Usuario',
        userPhoto:  user.photoURL    ?? '',
        mediaUrl,
        mediaType,
        vistos:     [],
        reacciones: {},
        createdAt:  serverTimestamp(),
      });
    } catch (e) { console.error('[Stories] upload error:', e); }
    finally { setSubiendo(false); }
  }

  function abrirGrupo(grupo: StoryGroup) {
    setViendoGrupo(grupo);
    const nuevos = new Set(vistos);
    nuevos.add(grupo.userId);
    setVistos(nuevos);
    try { localStorage.setItem('ag_stories_vistos', JSON.stringify([...nuevos])); } catch {}
  }

  const grupos = Object.values(
    stories.reduce<Record<string, StoryGroup>>((acc, s) => {
      if (!acc[s.userId]) {
        acc[s.userId] = {
          userId: s.userId, userName: s.userName,
          userPhoto: s.userPhoto, stories: [], visto: vistos.has(s.userId),
        };
      }
      acc[s.userId].stories.push(s);
      return acc;
    }, {})
  ).sort((a, b) => Number(a.visto) - Number(b.visto));

  const miStory = grupos.find((g) => g.userId === user?.uid);

  return (
    <>
      <div className="flex gap-3 overflow-x-auto pb-2 px-1 scrollbar-none">
        <div className="flex flex-col items-center gap-1 shrink-0">
          <div className="relative w-16 h-16">
            <button
              className="w-16 h-16 rounded-full overflow-hidden focus:outline-none"
              onClick={() => miStory ? abrirGrupo(miStory) : inputRef.current?.click()}
            >
              <img
                src={user?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.displayName || 'U')}&background=7c3aed&color=fff`}
                alt="Mi story"
                className={`w-16 h-16 rounded-full object-cover ${
                  miStory ? 'ring-2 ring-purple-500 ring-offset-2' : 'ring-2 ring-gray-200 dark:ring-gray-700 ring-offset-2'
                }`}
              />
            </button>
            <label
              className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-purple-600 flex items-center justify-center ring-2 ring-white dark:ring-gray-900 cursor-pointer"
              onClick={(e) => e.stopPropagation()}
            >
              {subiendo
                ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <PlusIcon className="w-3 h-3 text-white" strokeWidth={3} />
              }
              <input ref={inputRef} type="file" accept="image/*,video/*" onChange={handleUpload} className="hidden" disabled={subiendo} />
            </label>
          </div>
          <span className="text-[10px] text-gray-500 dark:text-gray-400 font-bold">Tu historia</span>
        </div>

        {grupos.filter((g) => g.userId !== user?.uid).map((g) => (
          <div key={g.userId} className="flex flex-col items-center gap-1 shrink-0 cursor-pointer" onClick={() => abrirGrupo(g)}>
            <img
              src={g.userPhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(g.userName)}&background=7c3aed&color=fff`}
              alt={g.userName}
              className={`w-16 h-16 rounded-full object-cover ring-2 ring-offset-2 ${
                g.visto ? 'ring-gray-300 dark:ring-gray-600' : 'ring-purple-500'
              }`}
            />
            <span className="text-[10px] text-gray-500 dark:text-gray-400 font-bold max-w-[64px] truncate">
              {g.userName.split(' ')[0]}
            </span>
          </div>
        ))}
      </div>

      {viendoGrupo && (
        <VisorStory grupo={viendoGrupo} onClose={() => setViendoGrupo(null)} />
      )}
    </>
  );
                                        }
