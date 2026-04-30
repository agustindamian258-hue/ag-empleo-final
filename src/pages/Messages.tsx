// src/pages/Messages.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../app/firebase';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { ChatBubbleLeftRightIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import Navbar from '../components/Navbar';
import Menu from '../components/Menu';

interface ChatPreview {
  id: string;
  participants: string[];
  participantData: Record<string, { name: string; photo: string }>;
  lastMessage: string;
  lastMessageAt: any;
  unreadBy: string[];
}

export default function Messages() {
  const navigate = useNavigate();
  const me = auth.currentUser;
  const [chats, setChats] = useState<ChatPreview[]>([]);
  const [cargando, setCargando] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    if (!me) return;
    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', me.uid),
      orderBy('lastMessageAt', 'desc'),
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        setChats(snap.docs.map((d) => ({ id: d.id, ...d.data() } as ChatPreview)));
        setCargando(false);
      },
      (err) => {
        console.error('[Messages]', err);
        setCargando(false);
      },
    );
    return () => unsub();
  }, [me]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-24">
      <header className="sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-4 py-4 flex items-center gap-3 shadow-sm">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 active:scale-90 transition-transform"
        >
          <ArrowLeftIcon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        </button>
        <h1 className="font-black text-gray-900 dark:text-white text-lg">Mensajes</h1>
      </header>

      {cargando && (
        <div className="flex justify-center py-16">
          <div className="w-7 h-7 border-4 border-[var(--sc-500)] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!cargando && chats.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 px-8 text-center">
          <ChatBubbleLeftRightIcon className="w-16 h-16 text-gray-300 dark:text-gray-700 mb-4" />
          <p className="font-black text-lg text-gray-500 dark:text-gray-400">Sin mensajes</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
            Buscá personas y enviáles un mensaje desde su perfil
          </p>
        </div>
      )}

      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        {chats.map((chat) => {
          const otherUid = chat.participants.find((p) => p !== me?.uid) ?? '';
          const other = chat.participantData?.[otherUid] ?? { name: 'Usuario', photo: '' };
          const avatar =
            other.photo ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(other.name)}&background=7c3aed&color=fff`;
          const hasUnread = chat.unreadBy?.includes(me?.uid ?? '');

          let timeLabel = '';
          if (chat.lastMessageAt) {
            try {
              const d = chat.lastMessageAt.toDate();
              const now = new Date();
              const isToday =
                d.getDate() === now.getDate() &&
                d.getMonth() === now.getMonth() &&
                d.getFullYear() === now.getFullYear();
              timeLabel = isToday
                ? d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
                : d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
            } catch {}
          }

          return (
            <button
              key={chat.id}
              onClick={() => navigate(`/chat/${chat.id}`)}
              className="w-full flex items-center gap-4 px-4 py-4 bg-white dark:bg-gray-900 active:bg-gray-50 dark:active:bg-gray-800 transition-colors text-left"
            >
              <div className="relative shrink-0">
                <img src={avatar} alt={other.name} className="w-14 h-14 rounded-full object-cover" />
                {hasUnread && (
                  <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-[var(--sc-500)] rounded-full border-2 border-white dark:border-gray-900" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm truncate ${
                    hasUnread
                      ? 'font-black text-gray-900 dark:text-white'
                      : 'font-bold text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {other.name}
                </p>
                <p
                  className={`text-xs truncate mt-0.5 ${
                    hasUnread ? 'font-semibold text-gray-700 dark:text-gray-200' : 'text-gray-400'
                  }`}
                >
                  {chat.lastMessage || '...'}
                </p>
              </div>
              {timeLabel && (
                <div className="shrink-0 flex flex-col items-end gap-1">
                  <span className="text-[10px] text-gray-400">{timeLabel}</span>
                  {hasUnread && <span className="w-2 h-2 rounded-full bg-[var(--sc-500)]" />}
                </div>
              )}
            </button>
          );
        })}
      </div>

      <Navbar onMenuClick={() => setIsMenuOpen(true)} />
      <Menu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </div>
  );
}
