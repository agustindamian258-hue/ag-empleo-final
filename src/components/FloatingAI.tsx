import { useState, useRef, useEffect } from 'react';
import { XMarkIcon, PaperAirplaneIcon } from '@heroicons/react/24/solid';
import { auth, db } from '../app/firebase';
import { doc, getDoc } from 'firebase/firestore';

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Mensaje {
  id: string;
  role: 'ai' | 'user';
  content: string;
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const MAX_HISTORIAL = 10; // Máximo de mensajes enviados a la API
const MAX_INPUT = 300;

const SYSTEM_PROMPT = `Sos el asistente oficial de "AG Empleo", una app argentina de búsqueda de trabajo.
Respondé siempre en español rioplatense, de forma amable y profesional.
Conocés estas secciones: Mapa de Changas, Empresas A-Z y Generador de CV.
Si te preguntan algo fuera del ámbito laboral, llevá la charla de vuelta al trabajo.
Respondé de forma concisa, en no más de 3 oraciones cuando sea posible.`;

// ─── Componente ───────────────────────────────────────────────────────────────

export default function FloatingAI() {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [mensaje, setMensaje] = useState<string>('');
  const [cargando, setCargando] = useState<boolean>(false);
  const [historial, setHistorial] = useState<Mensaje[]>([
    {
      id: 'init',
      role: 'ai',
      content: '¡Hola! Soy la IA de AG Empleo. ¿En qué te puedo ayudar hoy, che?',
    },
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll al último mensaje
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [historial]);

  /**
   * Obtiene el contexto del perfil del usuario para personalizar las respuestas.
   */
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

  /**
   * Envía el mensaje del usuario a la API de Claude y agrega la respuesta al historial.
   */
  const handleEnviar = async (): Promise<void> => {
    if (!mensaje.trim() || cargando) return;

    const userMsg = mensaje.trim();
    const userId = `user_${Date.now()}`;
    setMensaje('');
    setCargando(true);

    const nuevoHistorial: Mensaje[] = [
      ...historial,
      { id: userId, role: 'user', content: userMsg },
    ];
    setHistorial(nuevoHistorial);

    try {
      const perfil = await obtenerPerfilUsuario();

      // Limitar historial enviado a la API para no exceder tokens
      const historialRecortado = nuevoHistorial.slice(-MAX_HISTORIAL);

      // Construir mensajes en formato correcto para la API
      const mensajesApi = historialRecortado.map((h) => ({
        role: h.role === 'ai' ? 'assistant' : 'user',
        content: h.content,
      }));

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: perfil ? `${SYSTEM_PROMPT}\n\nContexto del usuario: ${perfil}` : SYSTEM_PROMPT,
          messages: mensajesApi,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const texto: string =
        data.content?.[0]?.text?.trim() || '¿Me lo repetís? No entendí bien.';

      setHistorial((prev) => [
        ...prev,
        { id: `ai_${Date.now()}`, role: 'ai', content: texto },
      ]);
    } catch (e) {
      console.error('[FloatingAI] Error al enviar mensaje:', e);
      setHistorial((prev) => [
        ...prev,
        {
          id: `ai_err_${Date.now()}`,
          role: 'ai',
          content: 'Uh, se me cortó el cable. ¿Me lo repetís?',
        },
      ]);
    } finally {
      setCargando(false);
    }
  };

  return (
    <>
      {/* Botón flotante */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          aria-label="Abrir asistente IA"
          className="fixed bottom-24 right-6 bg-blue-600 w-16 h-16 rounded-full shadow-2xl flex items-center justify-center z-50 border-2 border-white active:scale-90 transition-transform"
        >
          <span className="text-white font-black text-xl tracking-tighter">IA</span>
        </button>
      )}

      {/* Panel del chat */}
      {isOpen && (
        <div className="fixed bottom-24 right-4 w-[90vw] max-w-[360px] h-[520px] bg-white rounded-3xl shadow-2xl z-[150] flex flex-col border border-blue-50 overflow-hidden">

          {/* Header */}
          <div className="bg-blue-600 p-4 flex justify-between items-center text-white">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center">
                <span className="font-black text-xs">AG</span>
              </div>
              <div>
                <p className="font-bold text-sm">Asistente AG Empleo</p>
                <p className="text-[10px] opacity-75">En línea ahora</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              aria-label="Cerrar asistente"
              className="p-1 active:scale-90 transition-transform"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Mensajes */}
          <div
            ref={scrollRef}
            className="flex-grow p-4 overflow-y-auto bg-gray-50 space-y-3"
          >
            {historial.map((chat) => (
              <div
                key={chat.id}
                className={`flex ${chat.role === 'ai' ? 'justify-start' : 'justify-end'}`}
              >
                <div
                  className={`px-4 py-3 rounded-2xl text-sm leading-relaxed max-w-[85%] ${
                    chat.role === 'ai'
                      ? 'bg-white text-gray-700 rounded-tl-none border border-gray-100 shadow-sm'
                      : 'bg-blue-600 text-white rounded-tr-none'
                  }`}
                >
                  {chat.content}
                </div>
              </div>
            ))}

            {/* Indicador de escritura */}
            {cargando && (
              <div className="flex gap-1 p-3">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:0.15s]" />
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce [animation-delay:0.3s]" />
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-3 bg-white border-t border-gray-100 flex gap-2">
            <input
              type="text"
              value={mensaje}
              onChange={(e) => {
                if (e.target.value.length <= MAX_INPUT) {
                  setMensaje(e.target.value);
                }
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleEnviar()}
              placeholder="Escribí tu mensaje..."
              className="flex-grow bg-gray-100 rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              disabled={cargando}
            />
            <button
              onClick={handleEnviar}
              disabled={cargando || !mensaje.trim()}
              aria-label="Enviar mensaje"
              className="bg-blue-600 w-11 h-11 flex items-center justify-center rounded-2xl text-white active:scale-95 transition-transform disabled:opacity-50"
            >
              <PaperAirplaneIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
    }
