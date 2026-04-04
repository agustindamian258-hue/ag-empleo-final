import React, { useState, useRef, useEffect } from 'react';
import { XMarkIcon, PaperAirplaneIcon } from '@heroicons/react/24/solid';
import { GoogleGenerativeAI } from "@google/generative-ai";

// CONFIGURACIÓN CON TU CLAVE REAL (NIVEL GRATUITO)
const genAI = new GoogleGenerativeAI("AIzaSyC4lgQaEmC34AVq3Qv9Zl1KIfse-yn0Gz8");
const model = genAI.getGenerativeModel({ 
  model: "gemini-1.5-flash",
  systemInstruction: "Sos el asistente oficial de 'AG Empleo'. Tu misión es ayudar a trabajadores a encontrar changas y a empresas a buscar talento. Respondé siempre en español rioplatense (usá el 'che', 'viste', 'querés'), de forma muy amable y profesional. Conocés perfectamente las secciones: Mapa de Changas (para ver trabajos cerca), Empresas A-Z (directorio de marcas) y Generador de CV (para armar el currículum). Si te preguntan algo fuera de trabajo, intentá llevar la charla de vuelta a lo laboral.",
});

const FloatingAI: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(false);
  const [historial, setHistorial] = useState([
    { role: 'ai', content: '¡Hola! Soy la inteligencia de AG Empleo. ¿En qué te puedo ayudar hoy, che?' }
  ]);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll para que siempre se vea el último mensaje
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [historial]);

  const handleEnviar = async () => {
    if (!mensaje.trim() || cargando) return;
    
    const userMsg = mensaje;
    setMensaje("");
    setCargando(true);
    setHistorial(prev => [...prev, { role: 'user', content: userMsg }]);

    try {
      // LLAMADA A GEMINI 1.5 FLASH
      const result = await model.generateContent(userMsg);
      const response = await result.response;
      const text = response.text();

      setHistorial(prev => [...prev, { role: 'ai', content: text }]);
    } catch (error) {
      console.error("Error en la IA:", error);
      setHistorial(prev => [...prev, { role: 'ai', content: "Uh, se me cortó el cable. ¿Me lo repetís?" }]);
    } finally {
      setCargando(false);
    }
  };

  return (
    <>
      {/* BOTÓN FLOTANTE */}
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          className="fixed bottom-24 right-6 bg-blue-600 w-16 h-16 rounded-full shadow-2xl flex items-center justify-center z-50 border-2 border-white animate-pulse active:scale-90 transition-transform"
        >
          <span className="text-white font-black text-xl tracking-tighter">IA</span>
        </button>
      )}

      {/* VENTANA DE CHAT INTELIGENTE */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-[88vw] max-w-[360px] h-[520px] bg-white rounded-[32px] shadow-2xl z-[100] flex flex-col border border-blue-50 overflow-hidden animate-fade-up">
          
          {/* Header con estilo moderno */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-5 flex justify-between items-center text-white">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <span className="font-black text-xs">AG</span>
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-sm">Asistente Virtual</span>
                <span className="text-[10px] opacity-80 uppercase tracking-widest">En línea ahora</span>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:rotate-90 transition-transform p-1">
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Cuerpo del Chat con Scrollbar invisible */}
          <div ref={scrollRef} className="flex-grow p-5 overflow-y-auto bg-gray-50/50 space-y-4">
            {historial.map((chat, index) => (
              <div key={index} className={`flex ${chat.role === 'ai' ? 'justify-start' : 'justify-end'}`}>
                <div className={`p-4 rounded-[22px] text-[13px] leading-relaxed shadow-sm ${
                  chat.role === 'ai' 
                    ? 'bg-white text-gray-700 rounded-tl-none border border-gray-100' 
                    : 'bg-blue-600 text-white rounded-tr-none'
                }`}>
                  {chat.content}
                </div>
              </div>
            ))}
            {cargando && (
              <div className="flex gap-1 p-2">
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:0.4s]"></div>
              </div>
            )}
          </div>

          {/* Input de Mensaje */}
          <div className="p-4 bg-white border-t border-gray-100 flex gap-2">
            <input 
              type="text" 
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleEnviar()}
              placeholder="Escribí tu mensaje..."
              className="flex-grow bg-gray-100 rounded-2xl px-5 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-600 transition-all"
            />
            <button 
              onClick={handleEnviar} 
              className="bg-blue-600 w-11 h-11 flex items-center justify-center rounded-2xl text-white shadow-lg active:scale-95 transition-transform"
            >
              <PaperAirplaneIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default FloatingAI;
