import { useState, useEffect } from 'react';
import { db } from '../app/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import Navbar from '../components/Navbar';
import Menu from '../components/Menu';
import { BriefcaseIcon, MapPinIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';

interface Empleo {
  id: string;
  titulo: string;
  empresa: string;
  ubicacion: string;
  salario?: string;
  tipo: string;
  descripcion: string;
  createdAt: any;
}

export default function Jobs() {
  const [empleos, setEmpleos] = useState<Empleo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [filtro, setFiltro] = useState('todos');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'empleos'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snap) => {
      setEmpleos(snap.docs.map(d => ({ id: d.id, ...d.data() } as Empleo)));
      setCargando(false);
    });
  }, []);

  const tipos = ['todos', 'full-time', 'part-time', 'changa', 'remoto'];

  const empleosFiltrados = filtro === 'todos'
    ? empleos
    : empleos.filter(e => e.tipo === filtro);

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <header className="sticky top-0 z-30 bg-white border-b border-gray-100 px-5 py-4 shadow-sm">
        <h1 className="text-2xl font-black text-blue-800 tracking-tighter">Empleos</h1>
        <p className="text-gray-400 text-xs">Ofertas de trabajo disponibles</p>
      </header>

      {/* FILTROS */}
      <div className="px-4 pt-4 overflow-x-auto">
        <div className="flex gap-2 pb-1">
          {tipos.map(t => (
            <button
              key={t}
              onClick={() => setFiltro(t)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-black transition-all active:scale-95 ${
                filtro === t
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-gray-500 border border-gray-200'
              }`}
            >
              {t.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* LISTA */}
      <div className="px-4 pt-4 space-y-3">
        {cargando && (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!cargando && empleosFiltrados.length === 0 && (
          <div className="text-center py-16">
            <p className="text-5xl mb-3">💼</p>
            <p className="text-gray-500 font-medium">No hay empleos disponibles</p>
            <p className="text-gray-400 text-sm mt-1">Podés agregar ofertas desde Firebase</p>
          </div>
        )}

        {empleosFiltrados.map(empleo => (
          <div
            key={empleo.id}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center">
                  <BriefcaseIcon className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="font-black text-gray-800 text-sm">{empleo.titulo}</p>
                  <p className="text-gray-500 text-xs">{empleo.empresa}</p>
                </div>
              </div>
              <span className={`text-[10px] font-black px-2 py-1 rounded-full ${
                empleo.tipo === 'full-time' ? 'bg-blue-50 text-blue-700' :
                empleo.tipo === 'part-time' ? 'bg-purple-50 text-purple-700' :
                empleo.tipo === 'remoto' ? 'bg-green-50 text-green-700' :
                'bg-orange-50 text-orange-700'
              }`}>
                {empleo.tipo?.toUpperCase()}
              </span>
            </div>

            <p className="text-gray-600 text-xs leading-relaxed mb-3">{empleo.descripcion}</p>

            <div className="flex items-center gap-3 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <MapPinIcon className="w-3.5 h-3.5" />
                {empleo.ubicacion}
              </span>
              {empleo.salario && (
                <span className="flex items-center gap-1 text-green-600 font-bold">
                  <CurrencyDollarIcon className="w-3.5 h-3.5" />
                  {empleo.salario}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <Navbar onMenuClick={() => setIsMenuOpen(true)} />
      <Menu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </div>
  );
}
