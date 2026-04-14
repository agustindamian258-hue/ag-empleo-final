import { useState, useEffect, useRef } from 'react';
import { db, auth, storage } from '../app/firebase';
import {
  collection, addDoc, query, orderBy, onSnapshot,
  doc, updateDoc, arrayUnion, arrayRemove, serverTimestamp,
} from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import {
  HeartIcon, PhotoIcon, PaperAirplaneIcon, ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid';

interface Post {
  id:        string;
  text:      string;
  mediaUrl:  string;
  mediaType: 'image' | 'video' | '';
  userId:    string;
  userName:  string;
  userPhoto: string;
  likes:     string[];
  createdAt: { toDate: () => Date } | null;
}

interface FeedProps {
  showCompose?: boolean;
  onPublished?: () => void;
}

const MAX_FILE_SIZE_MB = 50;
const MAX_TEXT_LENGTH  = 500;
const ALLOWED_TYPES    = ['image/', 'video/'];

function sanitizeText(input: string): string {
  return input.replace(/</g, '&lt;').replace(/>/g, '&gt;').trim();
}

function formatFecha(createdAt: Post['createdAt']): string {
  if (!createdAt?.toDate) return 'Ahora';
  return createdAt.toDate().toLocaleDateString('es-AR', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

export default function Feed({ showCompose = true, onPublished }: FeedProps) {
  const user = auth.currentUser;

  const [posts,      setPosts]      = useState<Post[]>([]);
  const [text,       setText]       = useState<string>('');
  const [file,       setFile]       = useState<File | null>(null);
  const [preview,    setPreview]    = useState<string | null>(null);
  const [publicando, setPublicando] = useState<boolean>(false);
  const [error,      setError]      = useState<string>('');
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

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setError('');
    const f = e.target.files?.[0];
    if (!f) return;
    if (!ALLOWED_TYPES.some((t) => f.type.startsWith(t))) {
      setError('Solo se permiten imágenes y videos.'); return;
    }
    if (f.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setError(`El archivo no puede superar los ${MAX_FILE_SIZE_MB}MB.`); return;
    }
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    const url = URL.createObjectURL(f);
    previewUrlRef.current = url;
    setFile(f);
    setPreview(url);
  };

  const handlePost = async (): Promise<void> => {
    if (!user) return;
    const textSanitizado = sanitizeText(text);
    if (!textSanitizado && !file) return;
    setPublicando(true);
    setError('');
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
        userId:    user.uid,
        userName:  user.displayName ?? 'Usuario',
        userPhoto: user.photoURL    ?? '',
        likes:     [],
        createdAt: serverTimestamp(),
      });
      setText('');
      setFile(null);
      setPreview(null);
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
      }
      // Cerrar el popup al publicar exitosamente
      if (onPublished) onPublished();
    } catch (e) {
      console.error('[Feed] Error al publicar:', e);
      setError('No se pudo publicar. Intentá de nuevo.');
    } finally {
      setPublicando(false);
    }
  };

  const handleLike = async (postId: string, likes: string[]): Promise<void> => {
    if (!user) return;
    const postRef = doc(db, 'posts', postId);
    try {
      if (likes.includes(user.uid)) {
        await updateDoc(postRef, { likes: arrayRemove(user.uid) });
      } else {
        await updateDoc(postRef, { likes: arrayUnion(user.uid) });
      }
    } catch (e) {
      console.error('[Feed] Error al actualizar like:', e);
    }
  };

  return (
    <div className="space-y-4">

      {/* Compose — solo visible cuando showCompose=true (popup) */}
      {showCompose && user && (
        <div className="space-y-3">
          <div className="flex gap-3 items-center">
            <img
              src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'U')}&background=7c3aed&color=fff`}
              alt={`Foto de ${user.displayName || 'usuario'}`}
              className="w-10 h-10 rounded-full object-cover"
            />
            <span className="font-bold text-gray-800 text-sm">{user.displayName}</span>
          </div>

          <textarea
            value={text}
            onChange={(e) => { if (e.target.value.length <= MAX_TEXT_LENGTH) setText(e.target.value); }}
            placeholder="¿Qué querés compartir?"
            className="w-full border border-gray-200 rounded-2xl p-3 text-sm resize-none focus:outline-none focus:border-purple-400 h-24"
            maxLength={MAX_TEXT_LENGTH}
            aria-label="Texto de la publicación"
          />

          <div className="flex justify-end">
            <span className={`text-xs ${text.length >= MAX_TEXT_LENGTH ? 'text-red-400' : 'text-gray-300'}`}>
              {text.length}/{MAX_TEXT_LENGTH}
            </span>
          </div>

          {preview && (
            <div className="relative">
              <img src={preview} alt="Vista previa" className="rounded-2xl w-full object-cover max-h-48" />
              <button
                onClick={() => {
                  setFile(null); setPreview(null);
                  if (previewUrlRef.current) { URL.revokeObjectURL(previewUrlRef.current); previewUrlRef.current = null; }
                }}
                className="absolute top-2 right-2 bg-black/50 text-white rounded-full w-7 h-7 flex items-center justify-center text-xs font-bold"
                aria-label="Quitar imagen"
              >✕</button>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-red-500 text-xs" role="alert">
              <ExclamationCircleIcon className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="flex justify-between items-center">
            <label className="flex items-center gap-2 text-gray-500 text-sm cursor-pointer active:scale-95 transition-transform">
              <PhotoIcon className="w-5 h-5" />
              <span>Foto/Video</span>
              <input type="file" accept="image/*,video/*" onChange={handleFile} className="hidden" />
            </label>
            <button
              onClick={handlePost}
              disabled={publicando || (!text.trim() && !file)}
              className="flex items-center gap-2 bg-purple-600 text-white px-5 py-2.5 rounded-2xl font-bold text-sm disabled:opacity-50 active:scale-95 transition-transform"
            >
              <PaperAirplaneIcon className="w-4 h-4" />
              {publicando ? 'Publicando...' : 'Publicar'}
            </button>
          </div>
        </div>
      )}

      {/* Lista de posts */}
      {posts.map((p) => {
        const liked          = p.likes?.includes(user?.uid ?? '');
        const avatarFallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(p.userName || 'U')}&background=7c3aed&color=fff`;
        return (
          <article key={p.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex gap-3 items-center p-4">
              <img src={p.userPhoto || avatarFallback} alt={`Foto de ${p.userName}`} className="w-10 h-10 rounded-full object-cover" />
              <div>
                <p className="font-bold text-gray-800 text-sm">{p.userName || 'Usuario'}</p>
                <p className="text-xs text-gray-400">{formatFecha(p.createdAt)}</p>
              </div>
            </div>
            {p.text && <p className="px-4 pb-3 text-gray-700 text-sm leading-relaxed">{p.text}</p>}
            {p.mediaUrl && (
              p.mediaType === 'video'
                ? <video src={p.mediaUrl} controls className="w-full max-h-80 object-cover" />
                : <img src={p.mediaUrl} alt="Imagen del post" className="w-full max-h-80 object-cover" loading="lazy" />
            )}
            <div className="px-4 py-3 flex items-center gap-2 border-t border-gray-50">
              <button
                onClick={() => handleLike(p.id, p.likes || [])}
                className="flex items-center gap-1.5 active:scale-90 transition-transform"
                aria-label={liked ? 'Quitar like' : 'Dar like'}
                aria-pressed={liked}
              >
                {liked ? <HeartSolid className="w-6 h-6 text-red-500" /> : <HeartIcon className="w-6 h-6 text-gray-400" />}
                <span className={`text-sm font-bold ${liked ? 'text-red-500' : 'text-gray-400'}`}>
                  {p.likes?.length || 0}
                </span>
              </button>
            </div>
          </article>
        );
      })}

      {posts.length === 0 && !error && !showCompose && (
        <div className="text-center py-16 text-gray-300">
          <p className="font-bold text-lg">Sin publicaciones aún</p>
          <p className="text-sm">¡Sé el primero en compartir algo!</p>
        </div>
      )}
    </div>
  );
            }
