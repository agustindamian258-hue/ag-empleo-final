// src/pages/Reels.tsx
import { useState, useEffect, useRef } from 'react';
import { db, auth, storage } from '../app/firebase';
import {
  collection, addDoc, query, orderBy, onSnapshot,
  doc, updateDoc, arrayUnion, arrayRemove, serverTimestamp,
} from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import {
  HeartIcon, PlusIcon, XMarkIcon,
  ArrowUpTrayIcon, ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid';
import Navbar from '../components/Navbar';
import Menu  from '../components/Menu';

interface Reel {
  id:        string;
  videoUrl:  string;
  caption:   string;
  userId:    string;
  userName:  string;
  userPhoto: string;
  likes:     string[];
  createdAt: { toDate: () => Date } | null;
}

const MAX_VIDEO_MB = 100;

export default function Reels() {
  const user = auth.currentUser;

  const [reels,        setReels]        = useState<Reel[]>([]);
  const [isMenuOpen,   setIsMenuOpen]   = useState(false);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [caption,      setCaption]      = useState('');
  const [file,         setFile]         = useState<File | null>(null);
  const [preview,      setPreview]      = useState<string | null>(null);
  const [subiendo,     setSubiendo]     = useState(false);
  const [progreso,     setProgreso]     = useState(0);
  const [error,        setError]        = useState('');
  const previewRef = useRef<string | null>(null);
  const videoRefs  = useRef<(HTMLVideoElement | null)[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'reels'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q,
      (snap) => setReels(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Reel))),
      (err)  => console.error('[Reels]', err)
    );
    return () => unsub();
  }, []);

  // Autoplay con IntersectionObserver
  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    videoRefs.current.forEach((vid) => {
      if (!vid) return;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) { vid.play().catch(() => {}); }
          else { vid.pause(); vid.currentTime = 0; }
        },
        { threshold: 0.7 }
      );
      obs.observe(vid);
      observers.push(obs);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, [reels]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith('video/')) { setError('Solo se permiten videos.'); return; }
    if (f.size > MAX_VIDEO_MB * 1024 * 1024) { setError(`Máximo ${MAX_VIDEO_MB}MB.`); return; }
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    const url = URL.createObjectURL(f);
    previewRef.current = url;
    setFile(f);
    setPreview(url);
  };

  const handleSubir = async () => {
    if (!user || !file) return;
    setSubiendo(true);
    setError('');
    setProgreso(0);
    try {
      const sRef = storageRef(storage, `reels/${Date.now()}_${file.name}`);
      await uploadBytes(sRef, file);
      setProgreso(60);
      const videoUrl = await getDownloadURL(sRef);
      setProgreso(80);
      await addDoc(collection(db, 'reels'), {
        videoUrl,
        caption:   caption.trim(),
        userId:    user.uid,
        userName:  user.displayName ?? 'Usuario',
        userPhoto: user.photoURL    ?? '',
        likes:     [],
        createdAt: serverTimestamp(),
      });
      setProgreso(100);
      setCaption('');
      setFile(null);
      setPreview(null);
      if (previewRef.current) { URL.revokeObjectURL(previewRef.current); previewRef.current = null; }
      setModalAbierto(false);
    } catch (e) {
      console.error('[Reels] Error al subir:', e);
      setError('No se pudo subir el video. Intentá de nuevo.');
    } finally {
      setSubiendo(false);
      setProgreso(0);
    }
  };

  const handleLike = async (reelId: string, likes: string[]) => {
    if (!user) return;
    const r = doc(db, 'reels', reelId);
    try {
      if (likes.includes(user.uid)) {
        await updateDoc(r, { likes: arrayRemove(user.uid) });
      } else {
        await updateDoc(r, { likes: arrayUnion(user.uid) });
      }
    } catch (e) { console.error('[Reels] Like error:', e); }
  };

  return (
    <div className="bg-black min-h-screen pb-20">

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-5 py-4 bg-gradient-to-b from-black/80 to-transparent">
        <h1 className="text-xl font-black text-white tracking-tighter">Reels</h1>
        {user && (
          <button
            onClick={() => setModalAbierto(true)}
            className="w-9 h-9 rounded-full bg-white/20 backdrop-blur flex items-center justify-center active:scale-90 transition-transform"
            aria-label="Subir reel"
          >
            <PlusIcon className="w-5 h-5 text-white" />
          </button>
        )}
      </header>

      {/* Feed vertical snap */}
      <div className="h-screen overflow-y-scroll snap-y snap-mandatory scrollbar-none pt-0">
        {reels.length === 0 && (
          <div className="h-screen flex flex-col items-center justify-center text-white/40">
            <p className="text-5xl mb-3">🎬</p>
            <p className="font-bold text-lg">Sin reels todavía</p>
            <p className="text-sm">¡Subí el primero!</p>
          </div>
        )}

        {reels.map((r, i) => {
          const liked          = r.likes?.includes(user?.uid ?? '');
          const avatarFallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(r.userName || 'U')}&background=7c3aed&color=fff`;
          return (
            <div
              key={r.id}
              className="relative h-screen w-full snap-start snap-always flex items-center justify-center bg-black"
            >
              {/* Video */}
              <video
                ref={(el) => { videoRefs.current[i] = el; }}
                src={r.videoUrl}
                loop
                muted
                playsInline
                className="w-full h-full object-cover"
              />

              {/* Overlay gradiente */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20 pointer-events-none" />

              {/* Info usuario + caption */}
              <div className="absolute bottom-24 left-4 right-16 text-white">
                <div className="flex items-center gap-2 mb-2">
                  <img
                    src={r.userPhoto || avatarFallback}
                    alt={r.userName}
                    className="w-9 h-9 rounded-full object-cover ring-2 ring-white"
                  />
                  <span className="font-black text-sm drop-shadow">{r.userName}</span>
                </div>
                {r.caption && (
                  <p className="text-sm leading-snug text-white/90 drop-shadow line-clamp-2">
                    {r.caption}
                  </p>
                )}
              </div>

              {/* Acciones derecha */}
              <div className="absolute right-4 bottom-32 flex flex-col items-center gap-6">
                <button
                  onClick={() => handleLike(r.id, r.likes || [])}
                  className="flex flex-col items-center gap-1 active:scale-90 transition-transform"
                  aria-label={liked ? 'Quitar like' : 'Dar like'}
                >
                  {liked
                    ? <HeartSolid className="w-8 h-8 text-red-500 drop-shadow" />
                    : <HeartIcon   className="w-8 h-8 text-white  drop-shadow" />
                  }
                  <span className="text-white text-xs font-bold drop-shadow">
                    {r.likes?.length || 0}
                  </span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal subir reel */}
      {modalAbierto && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && setModalAbierto(false)}
        >
          <div className="w-full max-w-lg bg-gray-900 rounded-t-3xl px-5 pt-5 pb-10 space-y-4 animate-slide-up">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-white">Subir Reel</h2>
              <button
                onClick={() => setModalAbierto(false)}
                className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-gray-400"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Preview video */}
            {preview ? (
              <div className="relative rounded-2xl overflow-hidden bg-black aspect-[9/16] max-h-64">
                <video src={preview} className="w-full h-full object-cover" controls />
                <button
                  onClick={() => { setFile(null); setPreview(null); }}
                  className="absolute top-2 right-2 bg-black/60 text-white rounded-full w-7 h-7 flex items-center justify-center text-xs font-bold"
                >✕</button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-gray-700 rounded-2xl py-10 cursor-pointer active:scale-95 transition-transform">
                <ArrowUpTrayIcon className="w-10 h-10 text-gray-500" />
                <span className="text-gray-400 text-sm font-bold">Tocá para seleccionar un video</span>
                <span className="text-gray-600 text-xs">Máximo {MAX_VIDEO_MB}MB</span>
                <input type="file" accept="video/*" onChange={handleFile} className="hidden" />
              </label>
            )}

            <input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Descripción (opcional)"
              maxLength={200}
              className="w-full px-4 py-3 rounded-2xl bg-gray-800 border border-gray-700 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />

            {/* Barra de progreso */}
            {subiendo && (
              <div className="w-full bg-gray-800 rounded-full h-2">
                <div
                  className="bg-purple-500 h-2 rounded-full transition-all"
                  style={{ width: `${progreso}%` }}
                />
              </div>
            )}

            {error && (
              <p className="text-red-400 text-xs flex items-center gap-1">
                <ExclamationCircleIcon className="w-4 h-4 shrink-0" />
                {error}
              </p>
            )}

            <button
              onClick={handleSubir}
              disabled={!file || subiendo}
              className="w-full py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-black text-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {subiendo ? `Subiendo... ${progreso}%` : 'Publicar Reel'}
            </button>
          </div>
        </div>
      )}

      <Navbar onMenuClick={() => setIsMenuOpen(true)} />
      <Menu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </div>
  );
}
