import { useState, useEffect } from 'react';
import { db } from '../app/firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import Navbar from '../components/Navbar';
import Menu from '../components/Menú';
import { MagnifyingGlassIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';

interface Empresa {
  id: string;
  nombre: string;
  website_url: string;
  categoria?: string;
}

const LETRAS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export default function Companies() {
  const [letraActiva, setLetraActiva] = useState('A');
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [cargando, setCargando] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    setCargando(true);
    const q = query(
      collection(db, 'empresas'),
      where('nombre', '>=', letraActiva),
      where('nombre', '<', letraActiva + '\uf8ff'),
      orderBy('nombre')
    );
    const unsub = onSnapshot(q, (snap) => {
      setEmpresas(snap.docs.map(d => ({ id: d.id, ...d.data() } as Empresa)));
      setCargando(false);
    });
    return () => unsub();
  }, [letraActiva]);

  const empresasFiltradas = busqueda.trim()
    ? empresas.filter(e => e.nombre.toLowerCase().includes(busqueda.toLowerCase()))
    : empresas;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <header className="sticky top-0 z-30 bg-white border-b border-gray-100 px-5 py-4 shadow-sm">
        <h1 className="text-2xl font-black text-blue-800 tracking-tighter">Empresas A-Z</h1>
        <p className="text-gray-400 text-xs">Directorio de empresas y comercios</p>
      </header>

      <div className="px-4 pt-4">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-2xl px-4 py-3">
          <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar empresa..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="flex-1 text-sm outline-none bg-transparent text-gray-700"
          />
        </div>
      </div>

      <div className="px-4 pt-4">
        <div className="flex flex-wrap gap-1.5">
          {LETRAS.map(l => (
            <button
              key={l}
              onClick={() => { setLetraActiva(l); setBusqueda(''); }}
              className={`w-9 h-9 rounded-xl text-sm font-black transition-all active:scale-90 ${
                letraActiva === l
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-gray-500 border border-gray-200'
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pt-5 space-y-3">
        {cargando && (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!cargando && empresasFiltradas.length === 0 && (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">🏢</p>
            <p className="text-gray-500 font-medium">
              No hay empresas con la letra{' '}
              <span className="text-blue-600 font-black">{letraActiva}</span>
            </p>
            <p className="text-gray-400 text-sm mt-1">Podés agregar empresas desde Firebase</p>
          </div>
        )}

        {empresasFiltradas.map(empresa => (
          
            key={empresa.id}
            href={empresa.website_url || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between bg-white border border-gray-100 rounded-2xl p-4 shadow-sm active:scale-95 transition-transform"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                <span className="text-blue-700 font-black text-lg">{empresa.nombre[0]}</span>
              </div>
              <div>
                <p className="font-bold text-gray-800 text-sm">{empresa.nombre}</p>
                {empresa.categoria && (
                  <p className="text-xs text-gray-400">{empresa.categoria}</p>
                )}
              </div>
            </div>
            <ArrowTopRightOnSquareIcon className="w-5 h-5 text-blue-400" />
          </a>
        ))}
      </div>

      <Navbar onMenuClick={() => setIsMenuOpen(true)} />
      <Menu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </div>
  );
}
