// src/pages/NotFound.tsx
import { useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 px-6 text-center">
      <p className="text-7xl mb-4">🔍</p>
      <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter mb-2">404</h1>
      <p className="text-gray-500 dark:text-gray-400 font-bold mb-1">Página no encontrada</p>
      <p className="text-gray-400 dark:text-gray-600 text-sm mb-8">La ruta que buscás no existe o fue movida.</p>
      <button
        onClick={() => navigate('/')}
        className="px-8 py-3 rounded-2xl bg-[--sc-600] text-white font-black text-sm active:scale-95 transition-transform shadow-md">
        Volver al inicio
      </button>
    </div>
  );
}
