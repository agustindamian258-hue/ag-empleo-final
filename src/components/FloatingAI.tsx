import React, { useState, useRef, useEffect } from 'react';
import { XMarkIcon, PaperAirplaneIcon } from '@heroicons/react/24/solid';
import { GoogleGenerativeAI } from "@google/generative-ai";

// CONFIGURACIÓN DEL CEREBRO (GRATIS)
const genAI = new GoogleGenerativeAI("TU_API_KEY_AQUÍ");
const model = genAI.getGenerativeModel({ 
  model: "gemini-1.5-flash",
  systemInstruction: "Sos el asistente de 'AG Empleo'. Ayudás a usuarios a buscar trabajo, mejorar su CV y navegar la app. Respondé siempre en español, de forma amable y profesional. Conocés las secciones: Mapa de Changas, Empresas A-Z y Generador de CV.",
});

const FloatingAI: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(false);
  const [historial, setHistorial] = useState([
    { role: 'ai', content: '¡Hola! Soy la inteligencia de AG Empleo. ¿En qué puedo ayudarte hoy?' }
  ]);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll al último mensaje
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
      // Llamada real al cerebro de Gemini
      const result = await model.generateContent(userMsg);
      const response = await result.response;
      const text = response.text();

      setHistorial(prev => [...prev, { role: 'ai', content: text }]);
    } catch (error) {
      setHistorial(prev => [...prev, { role: 'ai', content: "Lo siento, tuve un problema al conectarme. ¿Podés intentar de nuevo?" }]);
    } finally {
      setCargando(false);
    }
  };

  return (
    <>
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          className="fixed bottom-24 right-6 bg-blue-600 w-16 h-16 rounded-full shadow-2xl flex items-center justify-center z-50 border-2 border-white animate-pulse"
        >
          <span className="text-white font-black text-xl">IA</span>
        </button>
      )}

      {isOpen && (
        <div className="fixed bottom-24 right-6 w-[85vw] max-w-[350px] h-[500px] bg-white rounded-3xl shadow-2xl z-[100] flex flex-col border border-blue-100 animate-fade-up">
          
          <div className="bg-blue-600 p-4 flex justify-between items-center text-white rounded-t-3xl">
            <span className="font-bold">Cerebro AG Empleo</span>
            <button onClick={() => setIsOpen(false)}><XMarkIcon className="w-6 h-6" /></button>
          </div>

          <div ref={scrollRef} className="flex-grow p-4 overflow-y-auto bg-gray-50 space-y-4">
            {historial.map((chat, index) => (
              <div key={index} className={`flex ${chat.role === 'ai' ? 'justify-start' : 'justify-end'}`}>
                <div className={`p-3 rounded-2xl text-sm ${
                  chat.role === 'ai' ? 'bg-white text-gray-800 shadow-sm' : 'bg-blue-600 text-white'
                }`}>
                  {chat.content}
                </div>
              </div>
            ))}
            {cargando && <div className="text-xs text-gray-400 animate-bounce">IA pensando...</div>}
          </div>

          <div className="p-3 bg-white border-t flex gap-2 rounded-b-3xl">
            <input 
              type="text" 
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleEnviar()}
              placeholder="Preguntame lo que quieras..."
              className="flex-grow bg-gray-100 rounded-full px-4 py-2 text-sm outline-none"
            />
            <button onClick={handleEnviar} className="bg-blue-600 p-2 rounded-full text-white">
              <PaperAirplaneIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default FloatingAI;
