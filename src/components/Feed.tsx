// src/components/Feed.tsx
import { useState, useEffect, useRef } from 'react';
import { db, auth, storage } from '../app/firebase';
import {
  collection, addDoc, query, orderBy, onSnapshot,
  doc, updateDoc, serverTimestamp, getDoc,
} from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import {
  PhotoIcon, PaperAirplaneIcon, ExclamationCircleIcon,
  ChatBubbleOvalLeftIcon, ShareIcon, XMarkIcon, FaceSmileIcon,
} from '@heroicons/react/24/outline';

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Post {
  id:        string;
  text:      string;
  mediaUrl:  string;
  mediaType: 'image' | 'video' | '';
  userId:    string;
  userName:  string;
  userPhoto: string;
  reactions: Record<string, string>;
  createdAt: { toDate: () => Date } | null;
}

interface Comment {
  id:        string;
  text:      string;
  userId:    string;
  userName:  string;
  userPhoto: string;
  createdAt: { toDate: () => Date } | null;
}

interface FeedProps {
  showCompose?: boolean;
  onPublished?: () => void;
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const MAX_FILE_SIZE_MB = 50;
const MAX_TEXT_LENGTH  = 500;
const ALLOWED_TYPES    = ['image/', 'video/'];
const REACCIONES       = ['❤️', '😂', '😍', '👍', '😲'];

function sanitizeText(input: string): string {
  return input.replace(/</g, '&lt;').replace(/>/g, '&gt;').trim();
}

function formatFecha(createdAt: Post['createdAt']): string {
  if (!createdAt?.toDate) return 'Ahora';
  return createdAt.toDate().toLocaleDateString('es-AR', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

// ─── Notificación automática ──────────────────────────────────────────────────

async function crearNotificacion({
  uid, titulo, mensaje, tipo,
}: {
  uid: string; titulo: string; mensaje: string; tipo: string;
}) {
  if (!uid || uid === auth.currentUser?.uid) return;
  try {
    await addDoc(collection(db, 'notifications'), {
      uid, titulo, mensaje, tipo,
      leida: false, creadoEn: serverTimestamp(),
    });
  } catch (e) { console.error('[Notif]', e); }
}

// ─── Modal comentarios ────────────────────────────────────────────────────────

function ModalComentarios({ postId, postUserId, onClose }: {
  postId: string; postUserId: string; onClose: () => void;
}) {
  const user = auth.currentUser;
  const [comments, setComments] = useState<Comment[]>([]);
  const [texto,    setTexto]    = useState('');
  const [enviando, setEnviando] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const q = query(
      collection(db, 'posts', postId, 'comments'),
      orderBy('createdAt', 'asc')
    );
    const unsub = onSnapshot(q, (snap) =>
      setComments(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Comment)))
    );
    return () => unsub();
  }, [postId]);

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 300); }, []);

  async function handleEnviar() {
    if (!user || !texto.trim()) return;
    setEnviando(true);
    try {
      await addDoc(collection(db, 'posts', postId, 'comments'), {
        text:      sanitizeText(texto),
        userId:    user.uid,
        userName:  user.displayName ?? 'Usuario',
        userPhoto: user.photoURL    ?? '',
        createdAt: serverTimestamp(),
      });
      await crearNotificacion({
        uid:     postUserId,
        titulo:  `💬 ${user.displayName ?? 'Alguien'} comentó tu publicación`,
        mensaje: texto.trim().slice(0, 80),
        tipo:    'like',
      });
      setTexto('');
    } catch (e) { console.error('[Feed] comentar:', e); }
    finally { setEnviando(false); }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-t-3xl flex flex-col animate-slide-up"
        style={{ maxHeight: '80vh' }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <h3 className="font-black text-gray-800 dark:text-gray-100">
            Comentarios {comments.length > 0 && <span className="text-gray-400 font-normal text-sm">({comments.length})</span>}
          </h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
          {comments.length === 0 && (
            <div className="text-center py-10 text-gray-400 dark:text-gray-600">
              <p className="text-3xl mb-2">💬</p>
              <p className="text-sm font-bold">Sé el primero en comentar</p>
            </div>
          )}
          {comments.map((c) => {
            const avatar = c.userPhoto ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(c.userName || 'U')}&background=7c3aed&color=fff`;
            return (
              <div key={c.id} className="flex gap-3">
                <img src={avatar} alt={c.userName} className="w-8 h-8 rounded-full object-cover shrink-0 mt-0.5" />
                <div className="flex-1 bg-gray-50 dark:bg-gray-800 rounded-2xl px-3 py-2">
                  <p className="font-black text-xs text-gray-800 dark:text-gray-100">{c.userName}</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-snug">{c.text}</p>
                </div>
              </div>
            );
          })}
        </div>

        {user && (
          <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800 flex gap-3 items-center">
            <img
              src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'U')}&background=7c3aed&color=fff`}
              alt="" className="w-8 h-8 rounded-full object-cover shrink-0"
            />
            <input
              ref={inputRef}
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleEnviar()}
              placeholder="Escribí un comentario..."
              maxLength={300}
              className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full px-4 py-2 text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none"
            />
            <button
              onClick={handleEnviar}
              disabled={enviando || !texto.trim()}
              className="w-9 h-9 rounded-full bg-purple-600 flex items-center justify-center disabled:opacity-40 active:scale-90 transition-transform"
            >
              <PaperAirplaneIcon className="w-4 h-4 text-white" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Selector de reacción ─────────────────────────────────────────────────────

function SelectorReaccion({ onSelect }: { onSelect: (emoji: string) => void }) {
  const [custom, setCustom] = useState(false);
  const [input,  setInput]  = useState('');

  return (
    <div className="absolute bottom-10 left-0 z-20 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-2 flex items-center gap-1 animate-slide-up">
      {REACCIONES.map((e) => (
        <button
          key={e}
          onClick={() => onSelect(e)}
          className="text-2xl active:scale-125 transition-transform hover:scale-110"
        >
          {e}
        </button>
      ))}
      {custom ? (
        <input
          autoFocus
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && input.trim()) { onSelect(input.trim()); setInput(''); setCustom(false); }
          }}
          placeholder="😀"
          className="w-10 h-8 text-center text-lg bg-gray-100 dark:bg-gray-700 rounded-xl focus:outline-none"
          maxLength={2}
        />
      ) : (
        <button
          onClick={() => setCustom(true)}
          className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-500 hover:scale-110 transition-transform"
        >
          <FaceSmileIcon className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}

// ─── Contador reacciones ──────────────────────────────────────────────────────

function ResumenReacciones({ reactions }: { reactions: Record<string, string> }) {
  const conteo = Object.values(reactions || {}).reduce<Record<string, number>>((acc, e) => {
    acc[e] = (acc[e] || 0) + 1;
    return acc;
  }, {});
  const top = Object.entries(conteo).sort((a, b) => b[1] - a[1]).slice(0, 3);
  if (top.length === 0) return null;
  return (
    <div className="flex items-center gap-1 px-4 pb-2">
      <div className="flex -space-x-1">
        {top.map(([emoji]) => (
          <span key={emoji} className="text-base">{emoji}</span>
        ))}
      </div>
      <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">
        {Object.keys(reactions).length}
      </span>
    </div>
  );
}

// ─── Contador comentarios ─────────────────────────────────────────────────────

function ComentariosCount({ postId }: { postId: string }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'posts', postId, 'comments'), (s) => setCount(s.size));
    return () => unsub();
  }, [postId]);
  return <span className="text-sm font-bold">{count}</span>;
}

// ─── Feed principal ───────────────────────────────────────────────────────────

export default function Feed({ showCompose = true, onPublished }: FeedProps) {
  const user = auth.currentUser;

  const [posts,         setPosts]         = useState<Post[]>([]);
  const [text,          setText]          = useState('');
  const [file,          setFile]          = useState<File | null>(null);
  const [preview,       setPreview]       = useState<string | null>(null);
  const [publicando,    setPublicando]    = useState(false);
  const [error,         setError]         = useState('');
  const [comentandoId,  setComentandoId]  = useState<string | null>(null);
  const [comentandoUid, setComentandoUid] = useState<string>('');
  const [reaccionandoId, setReaccionandoId] = useState<string | null>(null);
  const previewUrlRef = useRef<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q,
      (snap) => setPosts(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Post))),
      (err)  => { console.error('[Feed]', err); setError('No se pudieron cargar las publicaciones.'); }
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    return () => { if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current); };
  }, []);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    const f = e.target.files?.[0];
    if (!f) return;
    if (!ALLOWED_TYPES.some((t) => f.type.startsWith(t))) { setError('Solo imágenes y videos.'); return; }
    if (f.size > MAX_FILE_SIZE_MB * 1024 * 1024) { setError(`Máximo ${MAX_FILE_SIZE_MB}MB.`); return; }
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    const url = URL.createObjectURL(f);
    previewUrlRef.current = url;
    setFile(f); setPreview(url);
  };

  const handlePost = async () => {
    if (!user) return;
    const textSanitizado = sanitizeText(text);
    if (!textSanitizado && !file) return;
    setPublicando(true); setError('');
    try {
      let mediaUrl  = '';
      let mediaType: 'image' | 'video' | '' = '';
      if (file) {
        const sRef = storageRef(storage, `posts/${Date.now()}_${file.name}`);
        await uploadBytes(sRef, file);
        mediaUrl  = await getDownloadURL(sRef);
        mediaType = file.type.startsWith('video') ? 'video' : 'image';
      }
      await addDoc(collection(db, 'posts'), {
        text: textSanitizado, mediaUrl, mediaType,
        userId: user.uid, userName: user.displayName ?? 'Usuario',
        userPhoto: user.photoURL ?? '', reactions: {}, createdAt: serverTimestamp(),
      });
      setText(''); setFile(null); setPreview(null);
      if (previewUrlRef.current) { URL.revokeObjectURL(previewUrlRef.current); previewUrlRef.current = null; }
      if (onPublished) onPublished();
    } catch (e) {
      console.error('[Feed] publicar:', e);
      setError('No se pudo publicar. Intentá de nuevo.');
    } finally { setPublicando(false); }
  };

  const handleReaccion = async (postId: string, postUserId: string, emoji: string) => {
    if (!user) return;
    setReaccionandoId(null);
    const postRef = doc(db, 'posts', postId);
    try {
      const snap = await getDoc(postRef);
      const reactions: Record<string, string> = snap.data()?.reactions || {};
      if (reactions[user.uid] === emoji) {
        const updated = { ...reactions };
        delete updated[user.uid];
        await updateDoc(postRef, { reactions: updated });
      } else {
        await updateDoc(postRef, { [`reactions.${user.uid}`]: emoji });
        await crearNotificacion({
          uid:     postUserId,
          titulo:  `${emoji} ${user.displayName ?? 'Alguien'} reaccionó a tu publicación`,
          mensaje: emoji,
          tipo:    'like',
        });
      }
    } catch (e) { console.error('[Feed] reacción:', e); }
  };

  const handleCompartir = (post: Post) => {
    const texto = post.text || 'Mirá esta publicación en AG Empleo';
    if (navigator.share) {
      navigator.share({ title: 'AG Empleo', text: texto, url: window.location.href }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href).catch(() => {});
    }
  };

  return (
    <div className="space-y-3">

      {/* Compose */}
      {showCompose && user && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-4 space-y-3">
          <div className="flex gap-3 items-center">
            <img
              src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'U')}&background=7c3aed&color=fff`}
              alt={user.displayName || 'usuario'}
              className="w-10 h-10 rounded-full object-cover ring-2 ring-purple-200 dark:ring-purple-800"
            />
            <span className="font-bold text-gray-800 dark:text-gray-100 text-sm">{user.displayName}</span>
          </div>
          <textarea
            value={text}
            onChange={(e) => { if (e.target.value.length <= MAX_TEXT_LENGTH) setText(e.target.value); }}
            placeholder="¿Qué querés compartir?"
            className="w-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 placeholder-gray-400 rounded-2xl p-3 text-sm resize-none focus:outline-none focus:border-purple-400 h-24"
            maxLength={MAX_TEXT_LENGTH}
          />
          <div className="flex justify-end">
            <span className={`text-xs ${text.length >= MAX_TEXT_LENGTH ? 'text-red-400' : 'text-gray-300 dark:text-gray-600'}`}>
              {text.length}/{MAX_TEXT_LENGTH}
            </span>
          </div>
          {preview && (
            <div className="relative">
              <img src={preview} alt="Vista previa" className="rounded-2xl w-full object-cover max-h-48" />
              <button
                onClick={() => { setFile(null); setPreview(null); if (previewUrlRef.current) { URL.revokeObjectURL(previewUrlRef.current); previewUrlRef.current = null; } }}
                className="absolute top-2 right-2 bg-black/60 text-white rounded-full w-7 h-7 flex items-center justify-center text-xs font-bold"
              >✕</button>
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2 text-red-500 text-xs" role="alert">
              <ExclamationCircleIcon className="w-4 h-4 shrink-0" />{error}
            </div>
          )}
          <div className="flex justify-between items-center pt-1 border-t border-gray-100 dark:border-gray-800">
            <label className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm cursor-pointer active:scale-95 transition-transform">
              <PhotoIcon className="w-5 h-5 text-purple-400" />
              <span>Foto/Video</span>
              <input type="file" accept="image/*,video/*" onChange={handleFile} className="hidden" />
            </label>
            <button
              onClick={handlePost}
              disabled={publicando || (!text.trim() && !file)}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-2xl font-bold text-sm disabled:opacity-50 active:scale-95 transition-all"
            >
              <PaperAirplaneIcon className="w-4 h-4" />
              {publicando ? 'Publicando...' : 'Publicar'}
            </button>
          </div>
        </div>
      )}

      {/* Posts */}
      {posts.map((p) => {
        const miReaccion = p.reactions?.[user?.uid ?? ''];
        const avatarFallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(p.userName || 'U')}&background=7c3aed&color=fff`;

        return (
          <article key={p.id} className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">

            {/* Header */}
            <div className="flex gap-3 items-center p-4 pb-3">
              <img src={p.userPhoto || avatarFallback} alt={p.userName} className="w-11 h-11 rounded-full object-cover ring-2 ring-purple-100 dark:ring-purple-900" />
              <div className="flex-1 min-w-0">
                <p className="font-black text-gray-900 dark:text-gray-100 text-sm">{p.userName || 'Usuario'}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">{formatFecha(p.createdAt)}</p>
              </div>
            </div>

            {/* Texto */}
            {p.text && <p className="px-4 pb-3 text-gray-800 dark:text-gray-200 text-sm leading-relaxed">{p.text}</p>}

            {/* Media */}
            {p.mediaUrl && (
              p.mediaType === 'video'
                ? <video src={p.mediaUrl} controls className="w-full max-h-80 object-cover bg-black" />
                : <img src={p.mediaUrl} alt="Imagen del post" className="w-full max-h-80 object-cover" loading="lazy" />
            )}

            {/* Resumen reacciones */}
            <ResumenReacciones reactions={p.reactions || {}} />

            {/* Acciones */}
            <div className="px-4 py-3 flex items-center gap-5 border-t border-gray-100 dark:border-gray-800">

              {/* Reacción */}
              <div className="relative">
                <button
                  onClick={() => setReaccionandoId(reaccionandoId === p.id ? null : p.id)}
                  className="flex items-center gap-1.5 active:scale-90 transition-transform"
                  aria-label="Reaccionar"
                >
                  <span className="text-2xl leading-none">
                    {miReaccion || '🤍'}
                  </span>
                  <span className={`text-sm font-bold ${miReaccion ? 'text-purple-500' : 'text-gray-400 dark:text-gray-500'}`}>
                    {Object.keys(p.reactions || {}).length || 0}
                  </span>
                </button>
                {reaccionandoId === p.id && (
                  <SelectorReaccion
                    onSelect={(emoji) => handleReaccion(p.id, p.userId, emoji)}
                  />
                )}
              </div>

              {/* Comentar */}
              <button
                onClick={() => { setComentandoId(p.id); setComentandoUid(p.userId); }}
                className="flex items-center gap-1.5 text-gray-400 dark:text-gray-500 active:scale-90 transition-transform"
              >
                <ChatBubbleOvalLeftIcon className="w-6 h-6" />
                <ComentariosCount postId={p.id} />
              </button>

              {/* Compartir */}
              <button
                onClick={() => handleCompartir(p)}
                className="flex items-center gap-1.5 text-gray-400 dark:text-gray-500 active:scale-90 transition-transform ml-auto"
              >
                <ShareIcon className="w-5 h-5" />
              </button>
            </div>
          </article>
        );
      })}

      {posts.length === 0 && !error && (
        <div className="text-center py-16 text-gray-300 dark:text-gray-600">
          <p className="text-4xl mb-3">📭</p>
          <p className="font-bold text-lg">Sin publicaciones aún</p>
          <p className="text-sm">¡Sé el primero en compartir algo!</p>
        </div>
      )}

      {/* Modal comentarios */}
      {comentandoId && (
        <ModalComentarios
          postId={comentandoId}
          postUserId={comentandoUid}
          onClose={() => { setComentandoId(null); setComentandoUid(''); }}
        />
      )}

      {/* Cerrar selector reacción al tocar afuera */}
      {reaccionandoId && (
        <div className="fixed inset-0 z-10" onClick={() => setReaccionandoId(null)} />
      )}
    </div>
  );
  }
