// src/components/Stories.tsx
import { useState, useEffect, useRef } from 'react';
import { db, auth, storage } from '../app/firebase';
import {
  collection, addDoc, query, orderBy,
  onSnapshot, serverTimestamp, where,
} from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface Story {
  id:        string;
  userId:    string;
  userName:  string;
  userPhoto: string;
  mediaUrl:  string;
  mediaType: 'image' | 'video';
  createdAt: { toDate: () => Date } | null;
}

interface StoryGroup {
  userId:    string;
  userName:  string;
  userPhoto: string;
  stories:   Story[];
  visto:     boolean;
}

const MAX_MB = 50;
const STORY_EXPIRE_MS = 24 * 60 * 60 * 1000; // 24hs

// ─── Visor de story ───────────────────────────────────────────────────────────

function VisorStory({
  grupo,
  onClose,
}: {
  grupo: StoryGroup;
  onClose: () => void;
}) {
  const [idx,       setIdx]       = useState(0);
  const [progreso,  setProgreso]  = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const story = grupo.stories[idx];
  const DURACION = story?.mediaType === 'video' ? 15000 : 5000;

  useEffect(() => {
    setProgreso(0);
    const start = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - start;
      const p = Math.min((elapsed / DURACION) * 100, 100);
      setProgreso(p);
      if (p >= 100) {
        clearInterval(timerRef.current!);
        if (idx < grupo.stories.length - 1) {
          setIdx((i) => i + 1);
        } else {
          onClose();
        }
      }
    }, 50);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [idx]);

  if (!story) return null;

  return (
    <div className="fixed inset-0 z-[300] bg-black flex items-center justify-center">
      {/* Barras de progreso */}
      <div className="absolute top-4 left-3 right-3 flex gap-1 z-10">
        {grupo.stories.map((_, i) => (
          <div key={i} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-none"
              style={{ width: `${i < idx ? 100 : i === idx ? progreso : 0}%` }}
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="absolute top-8 left-4 right-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <img
            src={grupo.userPhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(grupo.userName)}&background=7c3aed&color=fff`}
            alt={grupo.userName}
            className="w-9 h-9 rounded-full object-cover ring-2 ring-white"
          />
          <div>
            <p className="text-white font-black text-sm drop-shadow">{grupo.userName}</p>
            <p className="text-white/60 text-xs">
              {story.createdAt?.toDate().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
        <button onClick={onClose} className="w-8 h-8 rounded-full bg-black/40 flex items-center justify-center">
          <XMarkIcon className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Media */}
      {story.mediaType === 'video' ? (
        <video
          src={story.mediaUrl}
          autoPlay
          muted
          playsInline
          className="w-full h-full object-cover"
        />
      ) : (
        <img
          src={story.mediaUrl}
          alt="story"
          className="w-full h-full object-cover"
        />
      )}

      {/* Tap zonas */}
      <div className="absolute inset-0 flex">
        <div className="flex-1" onClick={() => setIdx((i) => Math.max(0, i - 1))} />
        <div className="flex-1" onClick={() => {
          if (idx < grupo.stories.length - 1) setIdx((i) => i + 1);
          else onClose();
        }} />
      </div>
    </div>
  );
}

// ─── Stories principal ────────────────────────────────────────────────────────

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

  useEffect(() => {
    const corte = new Date(Date.now() - STORY_EXPIRE_MS);
    const q = query(
      collection(db, 'stories'),
      where('createdAt', '>=', corte),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, (snap) =>
      setStories(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Story)))
    );
    return () => unsub();
  }, []);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f || !user) return;
    if (!f.type.startsWith('image/') && !f.type.startsWith('video/')) return;
    if (f.size > MAX_MB * 1024 * 1024) return;
    setSubiendo(true);
    try {
      const sRef = storageRef(storage, `stories/${Date.now()}_${f.name}`);
      await uploadBytes(sRef, f);
      const mediaUrl = await getDownloadURL(sRef);
      await addDoc(collection(db, 'stories'), {
        userId:    user.uid,
        userName:  user.displayName ?? 'Usuario',
        userPhoto: user.photoURL    ?? '',
        mediaUrl,
        mediaType: f.type.startsWith('video') ? 'video' : 'image',
        createdAt: serverTimestamp(),
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

  // Agrupar por usuario
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

        {/* Mi story */}
        <div className="flex flex-col items-center gap-1 shrink-0">
          <label className={`relative w-16 h-16 rounded-full cursor-pointer ${subiendo ? 'opacity-60' : ''}`}>
            <img
              src={user?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.displayName || 'U')}&background=7c3aed&color=fff`}
              alt="Mi story"
              className={`w-16 h-16 rounded-full object-cover ${
                miStory ? 'ring-2 ring-purple-500 ring-offset-2' : 'ring-2 ring-gray-200 dark:ring-gray-700 ring-offset-2'
              }`}
            />
            <div className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-purple-600 flex items-center justify-center ring-2 ring-white dark:ring-gray-900">
              {subiendo
                ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <PlusIcon className="w-3 h-3 text-white" strokeWidth={3} />
              }
            </div>
            <input type="file" accept="image/*,video/*" onChange={handleUpload} className="hidden" disabled={subiendo} />
          </label>
          <span className="text-[10px] text-gray-500 dark:text-gray-400 font-bold">Tu historia</span>
        </div>

        {/* Historias de otros */}
        {grupos.filter((g) => g.userId !== user?.uid).map((g) => (
          <div
            key={g.userId}
            className="flex flex-col items-center gap-1 shrink-0 cursor-pointer"
            onClick={() => abrirGrupo(g)}
          >
            <img
              src={g.userPhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(g.userName)}&background=7c3aed&color=fff`}
              alt={g.userName}
              className={`w-16 h-16 rounded-full object-cover ring-2 ring-offset-2 ${
                g.visto
                  ? 'ring-gray-300 dark:ring-gray-600'
                  : 'ring-purple-500'
              }`}
            />
            <span className="text-[10px] text-gray-500 dark:text-gray-400 font-bold max-w-[64px] truncate">
              {g.userName.split(' ')[0]}
            </span>
          </div>
        ))}
      </div>

      {/* Visor */}
      {viendoGrupo && (
        <VisorStory grupo={viendoGrupo} onClose={() => setViendoGrupo(null)} />
      )}
    </>
  );
}
