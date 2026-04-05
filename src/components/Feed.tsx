import { useState, useEffect } from 'react';
import { db, auth, storage } from '../app/firebase';
import {
  collection, addDoc, query, orderBy, onSnapshot,
  doc, updateDoc, arrayUnion, arrayRemove, serverTimestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { HeartIcon, PhotoIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid';

export default function Feed() {
  const user = auth.currentUser;
  const [posts, setPosts] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [publicando, setPublicando] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snap) => {
      setPosts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, []);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) { setFile(f); setPreview(URL.createObjectURL(f)); }
  };

  const handlePost = async () => {
    if (!user || (!text.trim() && !file)) return;
    setPublicando(true);
    try {
      let mediaUrl = '';
      let mediaType = '';
      if (file) {
        const sRef = ref(storage, `posts/${Date.now()}_${file.name}`);
        await uploadBytes(sRef, file);
        mediaUrl = await getDownloadURL(sRef);
        mediaType = file.type.startsWith('video') ? 'video' : 'image';
      }
      await addDoc(collection(db, 'posts'), {
        text,
        mediaUrl,
        mediaType,
        userId: user.uid,
        userName: user.displayName,
        userPhoto: user.photoURL,
        likes: [],
        createdAt: serverTimestamp(),
      });
      setText(''); setFile(null); setPreview(null);
    } finally {
      setPublicando(false);
    }
  };

  const handleLike = async (postId: string, likes: string[]) => {
    if (!user) return;
    const ref2 = doc(db, 'posts', postId);
    if (likes.includes(user.uid)) {
      await updateDoc(ref2, { likes: arrayRemove(user.uid) });
    } else {
      await updateDoc(ref2, { likes: arrayUnion(user.uid) });
    }
  };

  return (
    <div className="space-y-4">
      {user && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <div className="flex gap-3 items-center mb-3">
            <img src={user.photoURL || ''} className="w-10 h-10 rounded-full object-cover" />
            <span className="font-bold text-gray-800 text-sm">{user.displayName}</span>
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="¿Qué querés compartir?"
            className="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:border-blue-400 h-20"
          />
          {preview && (
            <img src={preview} className="mt-2 rounded-xl w-full object-cover max-h-48" />
          )}
          <div className="flex justify-between items-center mt-3">
            <label className="flex items-center gap-1 text-gray-500 text-sm cursor-pointer active:scale-95 transition-transform">
              <PhotoIcon className="w-5 h-5" />
              <span>Foto/Video</span>
              <input type="file" accept="image/*,video/*" onChange={handleFile} className="hidden" />
            </label>
            <button
              onClick={handlePost}
              disabled={publicando || (!text.trim() && !file)}
              className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-xl font-bold text-sm disabled:opacity-50 active:scale-95 transition-transform"
            >
              <PaperAirplaneIcon className="w-4 h-4" />
              {publicando ? 'Publicando...' : 'Publicar'}
            </button>
          </div>
        </div>
      )}

      {posts.map((p) => {
        const liked = p.likes?.includes(user?.uid);
        return (
          <div key={p.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex gap-3 items-center p-4">
              <img
                src={p.userPhoto || 'https://ui-avatars.com/api/?name=' + p.userName}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div>
                <p className="font-bold text-gray-800 text-sm">{p.userName || 'Usuario'}</p>
                <p className="text-xs text-gray-400">
                  {p.createdAt?.toDate?.()?.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) || 'Ahora'}
                </p>
              </div>
            </div>
            {p.text && <p className="px-4 pb-3 text-gray-700 text-sm leading-relaxed">{p.text}</p>}
            {p.mediaUrl && (
              p.mediaType === 'video'
                ? <video src={p.mediaUrl} controls className="w-full max-h-80 object-cover" />
                : <img src={p.mediaUrl} className="w-full max-h-80 object-cover" />
            )}
            <div className="px-4 py-3 flex items-center gap-2 border-t border-gray-50">
              <button
                onClick={() => handleLike(p.id, p.likes || [])}
                className="flex items-center gap-1.5 active:scale-90 transition-transform"
              >
                {liked
                  ? <HeartSolid className="w-6 h-6 text-red-500" />
                  : <HeartIcon className="w-6 h-6 text-gray-400" />}
                <span className={`text-sm font-bold ${liked ? 'text-red-500' : 'text-gray-400'}`}>
                  {p.likes?.length || 0}
                </span>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
