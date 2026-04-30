// src/pages/Chat.tsx
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, auth } from '../app/firebase';
import {
  doc, collection, query, orderBy, onSnapshot,
  addDoc, updateDoc, serverTimestamp, arrayRemove, getDoc, setDoc,
} from 'firebase/firestore';
import { ArrowLeftIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';

interface Message {
  id: string;
  senderId: string;
  text: string;
  createdAt: any;
}

interface OtherUser {
  name: string;
  photo: string;
}

export default function Chat() {
  const { chatId } = useParams<{ chatId: string }>();
  const navigate = useNavigate();
  const me = auth.currentUser;
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [otherUser, setOtherUser] = useState<OtherUser>({ name: 'Usuario', photo: '' });
  const [messages, setMessages] = useState<Message[]>([]);
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [otherUid, setOtherUid] = useState('');

  useEffect(() => {
    if (!chatId || !me) return;

    const uids = chatId.split('_');
    const other = uids.find((u) => u !== me.uid) ?? '';
    setOtherUid(other);

    const chatRef = doc(db, 'chats', chatId);
    const unsubChat = onSnapshot(chatRef, async (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        const pd = data.participantData?.[other];
        if (pd) setOtherUser(pd);
        if (data.unreadBy?.includes(me.uid)) {
          updateDoc(chatRef, { unreadBy: arrayRemove(me.uid) }).catch(console.error);
        }
      } else {
        try {
          const userSnap = await getDoc(doc(db, 'users', other));
          if (userSnap.exists()) {
            const d = userSnap.data();
            setOtherUser({ name: d.name || 'Usuario', photo: d.photo || '' });
          }
        } catch (e) {
          console.error('[Chat] fetchUser', e);
        }
      }
    });

    const q = query(collection(db, 'chats', chatId, 'messages'), orderBy('createdAt', 'asc'));
    const unsubMsgs = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Message)));
    });

    return () => { unsubChat(); unsubMsgs(); };
  }, [chatId, me]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function enviar() {
    if (!texto.trim() || !chatId || !me || enviando || !otherUid) return;
    const msg = texto.trim();
    setTexto('');
    setEnviando(true);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    try {
      const chatRef = doc(db, 'chats', chatId);
      const chatSnap = await getDoc(chatRef);

      if (!chatSnap.exists()) {
        const [meSnap, otherSnap] = await Promise.all([
          getDoc(doc(db, 'users', me.uid)),
          getDoc(doc(db, 'users', otherUid)),
        ]);
        const meData = meSnap.exists() ? meSnap.data() : {};
        const otherData = otherSnap.exists() ? otherSnap.data() : {};
        await setDoc(chatRef, {
          participants: [me.uid, otherUid].sort(),
          participantData: {
            [me.uid]: { name: meData.name || me.displayName || 'Yo', photo: meData.photo || me.photoURL || '' },
            [otherUid]: { name: otherData.name || 'Usuario', photo: otherData.photo || '' },
          },
          lastMessage: msg,
          lastMessageAt: serverTimestamp(),
          unreadBy: [otherUid],
        });
      } else {
        await updateDoc(chatRef, {
          lastMessage: msg,
          lastMessageAt: serverTimestamp(),
          unreadBy: [otherUid],
        });
      }

      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        senderId: me.uid,
        text: msg,
        createdAt: serverTimestamp(),
      });
    } catch (e) {
      console.error('[Chat] enviar', e);
      setTexto(msg);
    } finally {
      setEnviando(false);
    }
  }

  function handleTextareaInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setTexto(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 112) + 'px';
  }

  function formatTime(ts: any): string {
    if (!ts) return '';
    try { return ts.toDate().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }); }
    catch { return ''; }
  }

  const avatarUrl =
    otherUser.photo ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(otherUser.name)}&background=7c3aed&color=fff`;

  return (
    <div className="flex flex-col bg-gray-50 dark:bg-gray-950" style={{ height: '100dvh' }}>
      {/* Header */}
      <header className="shrink-0 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-4 py-3 flex items-center gap-3 shadow-sm z-10">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 active:scale-90 transition-transform"
        >
          <ArrowLeftIcon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        </button>
        <img src={avatarUrl} alt={otherUser.name} className="w-10 h-10 rounded-full object-cover shrink-0" />
        <p className="font-black text-gray-900 dark:text-white text-sm truncate">{otherUser.name}</p>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <p className="text-4xl mb-3">👋</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm font-bold">
              Empezá la conversación con {otherUser.name}
            </p>
          </div>
        )}

        {messages.map((msg) => {
          const isMe = msg.senderId === me?.uid;
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[75%] px-4 py-2.5 rounded-2xl shadow-sm ${
                  isMe
                    ? 'bg-[var(--sc-500)] text-white rounded-br-sm'
                    : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-sm border border-gray-100 dark:border-gray-700'
                }`}
              >
                <p className="text-sm leading-relaxed break-words">{msg.text}</p>
                <p className={`text-[10px] mt-1 ${isMe ? 'text-white/60 text-right' : 'text-gray-400'}`}>
                  {formatTime(msg.createdAt)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} className="h-1" />
      </div>

      {/* Input */}
      <div className="shrink-0 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 px-3 py-3 flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={texto}
          onChange={handleTextareaInput}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar(); } }}
          placeholder="Escribí un mensaje..."
          rows={1}
          className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 resize-none focus:outline-none"
          style={{ maxHeight: '112px', overflowY: 'auto' }}
        />
        <button
          onClick={enviar}
          disabled={!texto.trim() || enviando}
          className="shrink-0 w-11 h-11 rounded-full bg-[var(--sc-500)] flex items-center justify-center active:scale-90 transition-all disabled:opacity-40 shadow-md"
          aria-label="Enviar"
        >
          <PaperAirplaneIcon className="w-5 h-5 text-white" />
        </button>
      </div>
    </div>
  );
}
