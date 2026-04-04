import React, { useState } from "react";
import Navbar from "../components/Navbar";
import Feed from "../components/Feed";
import Menu from "../components/Menu"; // 1. Importamos el menú nuevo

export default function Home() {
  // Estado para abrir/cerrar el menú de las 3 rayitas
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="relative min-h-screen bg-white pb-20">
      {/* HEADER: Nombre de la App y Eslogan corregido */}
      <header className="p-6 pt-10">
        <h1 className="text-3xl font-black text-blue-800 tracking-tighter">
          AG EMPLEO
        </h1>
        <p className="text-gray-500 font-medium text-sm mt-1">
          Tu próxima experiencia laboral
        </p>
      </header>

      {/* FEED DE TRABAJOS (Tu componente actual) */}
      <main className="px-4">
        <Feed />
      </main>

      {/* IA FLOTANTE (Regla de Oro: Botón grande y funcional) */}
      <button 
        onClick={() => alert("Hola! Soy tu IA de AG Empleo. ¿Te ayudo con tu CV o a buscar una changa?")}
        className="fixed bottom-24 right-6 bg-blue-600 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center z-40 active:scale-90 transition-transform border-2 border-white"
      >
        <span className="text-white font-black text-lg text-center leading-none">IA</span>
      </button>

      {/* NAVBAR (Con el botón de menú conectado) */}
      {/* Pasamos setIsMenuOpen para que cuando toques las 3 rayitas se abra */}
      <Navbar onMenuClick={() => setIsMenuOpen(true)} />

      {/* COMPONENTE MENÚ (Oculto hasta que se activa) */}
      <Menu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </div>
  );
}
