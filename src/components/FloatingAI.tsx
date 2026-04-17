// src/components/FloatingAI.tsx
import { useState, useRef, useEffect } from 'react';
import { XMarkIcon, PaperAirplaneIcon } from '@heroicons/react/24/solid';
import { auth, db } from '../app/firebase';
import { doc, getDoc } from 'firebase/firestore';

interface Mensaje {
  id:      string;
  role:    'ai' | 'user';
  content: string;
}

const MAX_HISTORIAL = 10;
const MAX_INPUT     = 300;

const SYSTEM_PROMPT = `Sos el asistente oficial de "AG Empleo", una app argentina de búsqueda de trabajo.
Respondé siempre en español rioplatense, de forma amable y profesional.
Conocés estas secciones: Mapa de Changas, Empresas A-Z y Generador de CV.
Si te preguntan algo fuera del ámbito laboral, llevá la charla de vuelta al trabajo.
Respondé de forma concisa, en no más de 3 oraciones cuando sea posible.`;

const MENSAJE_INICIAL: Mensaje = {
  id:      'init',
  role:    'ai',
  content: '¡Hola! Soy la IA de AG Empleo. ¿En qué te puedo ayudar hoy, che?',
};

export default function FloatingAI() {
  const [isOpen,    setIsOpen]    = useState<boolean>(false);
  const [mensaje,   setMensaje]   = useState<string>('');
  const [cargando,  setCargando]  = useState<boolean>(false);
  const [historial, setHistorial] = useState<Mensaje[]>([MENSAJE_INICIAL]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [historial, cargando]);

  const obtenerPerfilUsuario = async (): Promise<string> => {
    const user = auth.currentUser;
    if (!user) return '';
    try {
      const snap = await getDoc(doc(db, 'users', user.uid));
      if (snap.exists()) {
        const d = snap.data();
        return `El usuario se llama ${d.name ?? 'desconocido'}, vive en ${d.ciudad || 'Argentina'} y su descripción es: "${d.descripcion || 'sin descripción'}".`;
      }
    } catch (e) {
      console.error('[FloatingAI] Error al obtener perfil:', e);
    }
    return '';
  };

  const handleEnviar = async (): Promise<void> => {
    const userMsg = mensaje.trim();
    if (!userMsg || cargando) return;

    setMensaje('');
    setCargando(true);

    const nuevoHistorial: Mensaje[] = [
      ...historial,
      { id: `user_${Date.now()}`, role: 'user', content: userMsg },
    ];
    setHistorial(nuevoHistorial);

    try {
      const perfil = await obtenerPerfilUsuario();
      const systemFinal = perfil
        ? `${SYSTEM_PROMPT}\n\nContexto del usuario: ${perfil}`
        : SYSTEM_PROMPT;

      const contents = nuevoHistorial.slice(-MAX_HISTORIAL).map(h => ({
        role:  h.role === 'ai' ? 'model' : 'user',
        parts: [{ text: h.content }],
      }));

      // Bearer token para keys AQ. de Google AI Studio
      const response = await fetch(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
        {
          method: 'POST',
          headers: {
            'Content-Type':  'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_GEMINI_API_KEY}`,
          },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: systemFinal }] },
            contents,
            generationConfig: { maxOutputTokens: 500, temperature: 0.7 },
          }),
        }
      );

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(`API ${response.status}: ${JSON.stringify(errData)}`);
      }

      const data  = await response.json();
      const texto = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
        || '¿Me lo repetís? No entendí bien.';

      setHistorial(prev => [
        ...prev,
        { id: `ai_${Date.now()}`, role: 'ai', content: texto },
      ]);
    } catch (e) {
      console.error('[FloatingAI] Error:', e);
      setHistorial(prev => [
        ...prev,
        { id: `ai_err_${Date.now()}`, role: 'ai', content: 'Uh, se me cortó el cable. ¿Me lo repetís?' },
      ]);
    } finally {
      setCargando(false);
    }
  };

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          aria-label="Abrir asistente IA"
          className="fixed bottom-24 right-6 bg-[--sc-500] w-16 h-16 rounded-full shadow-2xl flex items-center justify-center z-50 border-2 border-white active:scale-90 transition-transform"
        >
          <span className="text-white font-black text-xl tracking-tighter">IA</span>
        </button>
      )}

      {isOpen && (
        <div className="fixed bottom-24 right-4 w-[90vw] max-w-[360px] h-[520px] bg-white dark:bg-gray-900 rounded-3xl shadow-2xl z-[150] flex flex-col border border-gray-100 dark:border-gray-800 overflow-hidden">

          <div className="bg-[--sc-500] p-4 flex justify-between items-center text-white">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center">
                <span className="font-black text-xs">AG</span>
              </div>
              <div>
                <p className="font-bold text-sm">Asistente AG Empleo</p>
                <p className="text-[10px] opacity-75">En línea ahora</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} aria-label="Cerrar" className="p-1 active:scale-90 transition-transform">
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          <div
            ref={scrollRef}
            className="flex-grow p-4 overflow-y-auto bg-gray-50 dark:bg-gray-950 space-y-3"
            role="log"
            aria-live="polite"
          >
            {historial.map(chat => (
              <div key={chat.id} className={`flex ${chat.role === 'ai' ? 'justify-start' : 'justify-end'}`}>
                <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed max-w-[85%] ${
                  chat.role === 'ai'
                    ? 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-tl-none border border-gray-100 dark:border-gray-700 shadow-sm'
                    : 'bg-[--sc-500] text-white rounded-tr-none'
                }`}>
                  {chat.content}
                </div>
              </div>
            ))}

            {cargando && (
              <div className="flex gap-1 p-3">
                <div className="w-2 h-2 bg-[--sc-500] rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-[--sc-500] rounded-full animate-bounce [animation-delay:0.15s]" />
                <div className="w-2 h-2 bg-[--sc-500] rounded-full animate-bounce [animation-delay:0.3s]" />
              </div>
            )}
          </div>

          <div className="p-3 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex gap-2">
            <input
              type="text"
              value={mensaje}
              onChange={e => { if (e.target.value.length <= MAX_INPUT) setMensaje(e.target.value); }}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleEnviar(); } }}
              placeholder="Escribí tu mensaje..."
              className="flex-grow bg-gray-100 dark:bg-gray-800 dark:text-white rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[--sc-500]"
              disabled={cargando}
              maxLength={MAX_INPUT}
            />
            <button
              onClick={handleEnviar}
              disabled={cargando || !mensaje.trim()}
              className="bg-[--sc-500] w-11 h-11 flex items-center justify-center rounded-2xl text-white active:scale-95 transition-transform disabled:opacity-50"
            >
              <PaperAirplaneIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
                                                                }
