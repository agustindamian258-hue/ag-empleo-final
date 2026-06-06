import { useState, useRef, useEffect, useCallback } from 'react';
import { XMarkIcon, PaperAirplaneIcon, PaperClipIcon } from '@heroicons/react/24/solid';
import { auth, db } from '../app/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useLocation } from 'react-router-dom';

interface Mensaje {
  id:      string;
  role:    'ai' | 'user';
  content: string;
}

interface GeminiMessage {
  role:  'user' | 'model';
  parts: ({ text: string } | { inline_data: { mime_type: string; data: string } })[];
}

const MAX_HISTORIAL = 10;
const MAX_INPUT     = 300;
const TIMEOUT_MS    = 30000;
const MAX_PDF_MB    = 10;

const SYSTEM_PROMPT = `Sos el asistente oficial de "AG Empleo", una app argentina de búsqueda de trabajo.
Respondé siempre en español rioplatense, de forma amable, directa y profesional.
Cuando el usuario te saluda por primera vez, saludalo por su nombre y ofrecele estas opciones numeradas:
1. 📄 Mejorar mi CV
2. 🎯 Analizar si mi CV pasa filtros ATS
3. ✍️ Redactar carta de presentación
4. 💼 Preparar una entrevista de trabajo
5. 🌐 Mejorar mi perfil de LinkedIn
6. 💬 Otra consulta laboral

Cuando el usuario suba un CV en PDF, analizalo completamente y devolvé una versión mejorada con:
- Resumen profesional potente
- Experiencia laboral optimizada con verbos de acción
- Habilidades relevantes destacadas
- Formato y estructura profesional en texto
- Consejos específicos para pasar filtros ATS

Conocés estas secciones de la app: Mapa de Changas, Empresas A-Z, Generador de CV, Feed social y Reels.
Si te preguntan algo fuera del ámbito laboral, llevá la charla de vuelta al trabajo amablemente.
Respondé de forma concisa. Usá emojis con moderación.`;

const MENSAJE_INICIAL: Mensaje = {
  id:      'init',
  role:    'ai',
  content: '¡Hola! Soy el asistente de AG Empleo 💼 ¿En qué te puedo ayudar hoy?\n\nPodés escribirme o adjuntar tu CV en PDF con el botón 📎',
};

// Rutas donde el botón IA NO debe aparecer
const RUTAS_SIN_IA = [
  '/social',
  '/reels',
  '/search',
  '/notificaciones-social',
  '/messages',
  '/chat',
];

function toGeminiMessages(historial: Mensaje[]): GeminiMessage[] {
  return historial
    .filter(m => m.id !== 'init')
    .map(m => ({
      role:  m.role === 'ai' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

interface FloatingAIProps {
  visorActivo?: boolean;
}

export default function FloatingAI({ visorActivo = false }: FloatingAIProps) {
  const location = useLocation();
  const [isOpen,    setIsOpen]    = useState<boolean>(false);
  const [mensaje,   setMensaje]   = useState<string>('');
  const [cargando,  setCargando]  = useState<boolean>(false);
  const [historial, setHistorial] = useState<Mensaje[]>([MENSAJE_INICIAL]);
  const [error,     setError]     = useState<string | null>(null);
  const [pdfFile,   setPdfFile]   = useState<File | null>(null);

  const scrollRef  = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLInputElement>(null);
  const abortRef   = useRef<AbortController | null>(null);
  const fileRef    = useRef<HTMLInputElement>(null);

  // Ocultar en rutas sociales o cuando visor está activo
  const debeOcultarse = visorActivo ||
    RUTAS_SIN_IA.some(r => location.pathname.startsWith(r));

  useEffect(() => {
    if (debeOcultarse) setIsOpen(false);
  }, [debeOcultarse]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [historial, cargando]);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 100);
  }, [isOpen]);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  const obtenerPerfilUsuario = useCallback(async (): Promise<string> => {
    const user = auth.currentUser;
    if (!user) return '';
    try {
      const snap = await getDoc(doc(db, 'users', user.uid));
      if (snap.exists()) {
        const d = snap.data();
        const nombre    = d.name        ?? d.displayName ?? 'usuario';
        const ciudad    = d.ciudad      ?? 'Argentina';
        const desc      = d.descripcion ?? '';
        const profesion = d.profesion   ?? '';
        return [
          `El usuario se llama ${nombre} y vive en ${ciudad}.`,
          profesion ? `Su profesión es: ${profesion}.` : '',
          desc      ? `Su descripción es: "${desc}".`  : '',
        ].filter(Boolean).join(' ');
      }
    } catch (e) {
      console.error('[FloatingAI] Error al obtener perfil:', e);
    }
    return '';
  }, []);

  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.type !== 'application/pdf') {
      setError('Solo se aceptan archivos PDF.');
      return;
    }
    if (f.size > MAX_PDF_MB * 1024 * 1024) {
      setError(`El PDF no puede superar ${MAX_PDF_MB}MB.`);
      return;
    }
    setPdfFile(f);
    setError(null);
    setMensaje(`Analizá mi CV: ${f.name}`);
  };

  const handleEnviar = useCallback(async (): Promise<void> => {
    const userMsg = mensaje.trim();
    if ((!userMsg && !pdfFile) || cargando) return;

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    const msgUsuario: Mensaje = {
      id:      `user_${Date.now()}`,
      role:    'user',
      content: userMsg || `📎 CV adjunto: ${pdfFile?.name}`,
    };

    setMensaje('');
    setError(null);
    setCargando(true);

    const historialActualizado = [...historial.slice(-MAX_HISTORIAL), msgUsuario];
    setHistorial(historialActualizado);

    const timeoutId = setTimeout(() => abortRef.current?.abort(), TIMEOUT_MS);

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string;
      if (!apiKey) throw new Error('Clave de API no configurada.');

      const perfil      = await obtenerPerfilUsuario();
      const systemFinal = perfil
        ? `${SYSTEM_PROMPT}\n\nContexto del usuario: ${perfil}`
        : SYSTEM_PROMPT;

      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

      let contents: GeminiMessage[];

      if (pdfFile) {
        const base64 = await fileToBase64(pdfFile);
        const histPrevio = toGeminiMessages(historial.slice(-MAX_HISTORIAL));
        contents = [
          ...histPrevio,
          {
            role: 'user',
            parts: [
              { inline_data: { mime_type: 'application/pdf', data: base64 } },
              { text: userMsg || 'Analizá este CV y devolveme una versión mejorada con consejos para pasar filtros ATS.' },
            ],
          },
        ];
        setPdfFile(null);
        if (fileRef.current) fileRef.current.value = '';
      } else {
        contents = toGeminiMessages(historialActualizado.slice(-MAX_HISTORIAL));
      }

      const response = await fetch(url, {
        method:  'POST',
        signal:  abortRef.current.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemFinal }] },
          contents,
          generationConfig: {
            maxOutputTokens: 2048,
            temperature:     0.7,
          },
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData?.error?.message ?? `Error ${response.status}`);
      }

      const data  = await response.json();
      const texto = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
        ?? 'No pude generar una respuesta. ¿Me lo repetís?';

      setHistorial(prev => [
        ...prev.slice(-MAX_HISTORIAL),
        { id: `ai_${Date.now()}`, role: 'ai', content: texto },
      ]);

    } catch (e: unknown) {
      if (e instanceof DOMException && e.name === 'AbortError') {
        setError('La respuesta tardó demasiado. Intentá de nuevo.');
      } else {
        const msg = e instanceof Error ? e.message : String(e);
        console.error('[FloatingAI] Error:', msg);
        setError(msg);
      }
      setHistorial(prev => prev.filter(m => m.id !== msgUsuario.id));
      setMensaje(userMsg);
    } finally {
      clearTimeout(timeoutId);
      setCargando(false);
    }
  }, [mensaje, pdfFile, cargando, historial, obtenerPerfilUsuario]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleEnviar();
    }
  };

  const handleLimpiar = () => {
    setHistorial([MENSAJE_INICIAL]);
    setError(null);
    setMensaje('');
    setPdfFile(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  if (debeOcultarse) return null;

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
        <div className="fixed bottom-24 right-4 w-[90vw] max-w-[360px] h-[520px] bg-white dark:bg-gray-900 rounded-3xl shadow-2xl z-50 flex flex-col border border-gray-100 dark:border-gray-800 overflow-hidden">
          <div className="bg-[--sc-500] p-4 flex justify-between items-center text-white shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center">
                <span className="font-black text-xs">AG</span>
              </div>
              <div>
                <p className="font-bold text-sm">Asistente AG Empleo</p>
                <p className="text-[10px] opacity-75 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full inline-block animate-pulse" />
                  En línea ahora
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleLimpiar} aria-label="Nueva conversación"
                className="p-1 opacity-70 hover:opacity-100 active:scale-90 transition-all text-xs font-bold">
                ↺
              </button>
              <button onClick={() => setIsOpen(false)} aria-label="Cerrar"
                className="p-1 active:scale-90 transition-transform">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div ref={scrollRef}
            className="flex-grow p-4 overflow-y-auto bg-gray-50 dark:bg-gray-950 space-y-3"
            role="log" aria-live="polite">
            {historial.map(chat => (
              <div key={chat.id} className={`flex ${chat.role === 'ai' ? 'justify-start' : 'justify-end'}`}>
                <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed max-w-[85%] whitespace-pre-wrap ${
                  chat.role === 'ai'
                    ? 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-tl-none border border-gray-100 dark:border-gray-700 shadow-sm'
                    : 'bg-[--sc-500] text-white rounded-tr-none'
                }`}>
                  {chat.content}
                </div>
              </div>
            ))}

            {cargando && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm flex gap-1 items-center">
                  <div className="w-2 h-2 bg-[--sc-500] rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-[--sc-500] rounded-full animate-bounce [animation-delay:0.15s]" />
                  <div className="w-2 h-2 bg-[--sc-500] rounded-full animate-bounce [animation-delay:0.3s]" />
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-3 py-2 text-xs text-red-600 dark:text-red-400 text-center">
                ⚠️ {error}
              </div>
            )}
          </div>

          {pdfFile && (
            <div className="px-3 pt-2 bg-white dark:bg-gray-900 flex items-center gap-2">
              <div className="flex-1 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl px-3 py-2 flex items-center gap-2">
                <span className="text-green-600 text-xs">📎</span>
                <span className="text-green-700 dark:text-green-400 text-xs font-bold truncate">{pdfFile.name}</span>
              </div>
              <button onClick={() => { setPdfFile(null); if (fileRef.current) fileRef.current.value = ''; }}
                className="text-gray-400 text-xs p-1 active:scale-90">✕</button>
            </div>
          )}

          <div className="p-3 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex gap-2 shrink-0">
            <label className="w-11 h-11 flex items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800 cursor-pointer active:scale-95 transition-transform shrink-0">
              <PaperClipIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              <input ref={fileRef} type="file" accept="application/pdf" onChange={handlePdfChange} className="hidden" disabled={cargando} />
            </label>
            <input
              ref={inputRef}
              type="text"
              value={mensaje}
              onChange={e => { if (e.target.value.length <= MAX_INPUT) setMensaje(e.target.value); }}
              onKeyDown={handleKeyDown}
              placeholder={pdfFile ? 'Agregá instrucciones (opcional)...' : 'Escribí tu mensaje...'}
              className="flex-grow bg-gray-100 dark:bg-gray-800 dark:text-white rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[--sc-500] disabled:opacity-50"
              disabled={cargando}
              maxLength={MAX_INPUT}
            />
            <button
              onClick={handleEnviar}
              disabled={cargando || (!mensaje.trim() && !pdfFile)}
              className="bg-[--sc-500] w-11 h-11 flex items-center justify-center rounded-2xl text-white active:scale-95 transition-transform disabled:opacity-40 shrink-0"
            >
              <PaperAirplaneIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
                                        }
