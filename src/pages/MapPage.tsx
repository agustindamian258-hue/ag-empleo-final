import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { db } from '../app/firebase';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { XMarkIcon } from '@heroicons/react/24/outline';

// Interfaz para que TypeScript reconozca los datos de Firebase
interface Changa {
  id: string;
  titulo: string;
  urgencia: 'urgente' | 'semana' | 'mes';
  posicion: [number, number]; 
}

const MapPage: React.FC = () => {
  const navigate = useNavigate();
  const [distancia, setDistancia] = useState(5); // Radio en KM
  const [changas, setChangas] = useState<Changa[]>([]);
  
  // Coordenadas iniciales (Podés cambiarlas por las de tu ciudad)
  const [userLoc] = useState<[number, number]>([-34.6037, -58.3816]); 

  // ESCUCHAR FIREBASE: Trae las changas en tiempo real
  useEffect(() => {
    const q = query(collection(db, "changas"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs: any = [];
      snapshot.forEach((doc) => {
        docs.push({ id: doc.id, ...doc.data() });
      });
      setChangas(docs);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col">
      {/* HEADER: BOTÓN CERRAR SIN ERRORES */}
      <div className="p-4 flex justify-between items-center bg-white border-b border-gray-200">
        <h2 className="font-bold text-xl text-blue-900">Mapa de Changas</h2>
        <button 
          onClick={() => navigate('/')} 
          className="p-2 bg-gray-100 rounded-full active:scale-90 transition-transform"
        >
          <XMarkIcon className="w-6 h-6 text-gray-700" />
        </button>
      </div>

      {/* FILTROS: DISTANCIA Y URGENCIA */}
      <div className="p-4 bg-gray-50 space-y-4 shadow-inner">
        <div>
          <div className="flex justify-between mb-1">
            <label className="text-sm font-bold text-gray-600">Radio de búsqueda</label>
            <span className="text-blue-600 font-bold">{distancia} km</span>
          </div>
          <input 
            type="range" min="1" max="100" value={distancia} 
            onChange={(e) => setDistancia(parseInt(e.target.value))}
            className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
        </div>
        
        <div className="flex justify-between gap-2">
          <button className="flex-1 py-1 bg-red-100 text-red-700 text-[10px] font-black rounded-full border border-red-200">URGENTE</button>
          <button className="flex-1 py-1 bg-orange-100 text-orange-700 text-[10px] font-black rounded-full border border-orange-200">SEMANA</button>
          <button className="flex-1 py-1 bg-blue-100 text-blue-700 text-[10px] font-black rounded-full border border-blue-200">ESTE MES</button>
        </div>
      </div>

      {/* MAPA VISUAL CON LEYENDA */}
      <div className="flex-grow relative">
        <MapContainer center={userLoc} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          
          {/* Círculo de radio visual */}
          <Circle 
            center={userLoc} 
            radius={distancia * 1000} 
            pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.1 }} 
          />

          {/* Renderizado de pines reales */}
          {changas.map((changa) => (
            <Marker key={changa.id} position={changa.posicion}>
              <Popup>
                <div className="text-center">
                  <p className="font-bold">{changa.titulo}</p>
                  <p className={`text-[10px] font-bold mb-2 ${changa.urgencia === 'urgente' ? 'text-red-600' : 'text-blue-600'}`}>
                    {changa.urgencia.toUpperCase()}
                  </p>
                  <button className="bg-blue-600 text-white px-3 py-1 rounded text-xs">Ver Detalles</button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
};

export default MapPage;
