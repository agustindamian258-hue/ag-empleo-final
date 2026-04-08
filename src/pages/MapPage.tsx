import { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { db } from '../app/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { XMarkIcon, MapPinIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';

// ─── Fix ícono Leaflet en React ───────────────────────────────────────────────
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Changa {
  id: string;
  titulo: string;
  descripcion?: string;
  pago?: string;
  urgencia: 'urgente' | 'semana' | 'mes';
  posicion: [number, number];
}

type Coordenada = [number, number];

// ─── Constantes ───────────────────────────────────────────────────────────────

const BUENOS_AIRES: Coordenada = [-34.6037, -58.3816];
const GEO_TIMEOUT_MS = 10000;

const URGENCIA_ESTILOS: Record<string, string> = {
  urgente: 'text-red-600 bg-red-50 border-red-200',
  semana:  'text-orange-600 bg-orange-50 border-orange-200',
  mes:     'text-blue-600 bg-blue-50 border-blue-200',
};

const FILTROS_URGENCIA = [
  { id: 'urgente', label: 'Urgente',       clase: 'bg-red-100 text-red-700 border-red-200' },
  { id: 'semana',  label: 'Esta semana',   clase: 'bg-orange-100 text-orange-700 border-orange-200' },
  { id: 'mes',     label: 'Este mes',      clase: 'bg-blue-100 text-blue-700 border-blue-200' },
];

// ─── Utilidades ───────────────────────────────────────────────────────────────

/**
 * Calcula la distancia en km entre dos coordenadas usando la fórmula de Haversine.
 */
function calcularDistancia(a: Coordenada, b: Coordenada): number {
  const R = 6371;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLon = ((b[1] - a[1]) * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a[0] * Math.PI) / 180) *
      Math.cos((b[0] * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

/**
 * Verifica que una posición sea una coordenada válida.
 */
function esCoordValida(pos: unknown): pos is Coordenada {
  return (
    Array.isArray(pos) &&
    pos.length === 2 &&
    typeof pos[0] === 'number' &&
    typeof pos[1] === 'number' &&
    !isNaN(pos[0]) &&
    !isNaN(pos[1])
  );
}

// ─── Sub-componente: centrar mapa ─────────────────────────────────────────────

function CentrarMapa({ centro }: { centro: Coordenada }) {
  const map = useMap();
  useEffect(() => {
    map.setView(centro, 13);
  }, [map, centro]);
  return null;
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function MapPage() {
  const navigate = useNavigate();
  const [distancia, setDistancia] = useState<number>(5);
  const [changas, setChangas] = useState<Changa[]>([]);
  const [urgenciaFiltro, setUrgenciaFiltro] = useState<string | null>(null);
  const [userLoc, setUserLoc] = useState<Coordenada>(BUENOS_AIRES);
  const [localizando, setLocalizando] = useState<boolean>(true);
  const [errorGeo, setErrorGeo] = useState<string>('');
  const [errorFirebase, setErrorFirebase] = useState<string>('');

  // Obtener GPS del usuario con timeout
  useEffect(() => {
    if (!navigator.geolocation) {
      setErrorGeo('Tu dispositivo no soporta geolocalización.');
      setLocalizando(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLoc([pos.coords.latitude, pos.coords.longitude]);
        setLocalizando(false);
      },
      (err) => {
        console.warn('[MapPage] Error de geolocalización:', err.message);
        setErrorGeo('No se pudo obtener tu ubicación. Mostrando Buenos Aires.');
        setLocalizando(false);
      },
      { timeout: GEO_TIMEOUT_MS, enableHighAccuracy: true }
    );
  }, []);

  // Escuchar changas de Firebase
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'changas'),
      (snap) => {
        const datos = snap.docs
          .map((d) => ({ id: d.id, ...d.data() } as Changa))
          .filter((c) => esCoordValida(c.posicion)); // Descartar coordenadas inválidas
        setChangas(datos);
        setErrorFirebase('');
      },
      (err) => {
        console.error('[MapPage] Error al cargar changas:', err);
        setErrorFirebase('No se pudieron cargar las changas.');
      }
    );
    return () => unsub();
  }, []);

  // Filtrar por radio y urgencia
  const changasFiltradas = changas.filter((c) => {
    const dist = calcularDistancia(userLoc, c.posicion);
    const dentroDeRadio = dist <= distancia;
    const cumpleUrgencia = !urgenciaFiltro || c.urgencia === urgenciaFiltro;
    return dentroDeRadio && cumpleUrgencia;
  });

  const toggleUrgencia = useCallback((id: string) => {
    setUrgenciaFiltro((prev) => (prev === id ? null : id));
  }, []);

  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col">

      {/* Header */}
      <div className="p-4 flex justify-between items-center bg-white border-b border-gray-100 shadow-sm">
        <div>
          <h2 className="font-black text-xl text-blue-900">Mapa de Changas</h2>
          <p className="text-xs text-gray-400">
            {changasFiltradas.length} trabajo{changasFiltradas.length !== 1 ? 's' : ''} cerca tuyo
          </p>
        </div>
        <button
          onClick={() => navigate('/')}
          aria-label="Volver al inicio"
          className="p-2 bg-gray-100 rounded-full active:scale-90 transition-transform"
        >
          <XMarkIcon className="w-6 h-6 text-gray-700" />
        </button>
      </div>

      {/* Avisos de error no bloqueantes */}
      {(errorGeo || errorFirebase) && (
        <div className="px-4 py-2 bg-yellow-50 border-b border-yellow-100 flex items-center gap-2 text-yellow-700 text-xs">
          <ExclamationCircleIcon className="w-4 h-4 shrink-0" />
          {errorGeo || errorFirebase}
        </div>
      )}

      {/* Filtros */}
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm font-bold text-gray-600">Radio de búsqueda</span>
          <span className="text-blue-600 font-black text-sm">{distancia} km</span>
        </div>
        <input
          type="range"
          min="1"
          max="100"
          value={distancia}
          onChange={(e) => setDistancia(parseInt(e.target.value))}
          className="w-full accent-blue-600"
          aria-label="Radio de búsqueda en kilómetros"
        />
        <div className="flex gap-2">
          {FILTROS_URGENCIA.map((u) => (
            <button
              key={u.id}
              onClick={() => toggleUrgencia(u.id)}
              className={`flex-1 py-1.5 text-[10px] font-black rounded-full border transition-all ${
                urgenciaFiltro === u.id
                  ? u.clase + ' ring-2 ring-offset-1 ring-blue-400'
                  : 'bg-white text-gray-400 border-gray-200'
              }`}
            >
              {u.label.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Mapa */}
      <div className="flex-grow relative">

        {/* Overlay de localización */}
        {localizando && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
            <div className="flex flex-col items-center gap-2">
              <MapPinIcon className="w-8 h-8 text-blue-600 animate-bounce" />
              <p className="text-sm text-gray-500">Buscando tu ubicación...</p>
            </div>
          </div>
        )}

        <MapContainer
          center={userLoc}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          <CentrarMapa centro={userLoc} />
          <Circle
            center={userLoc}
            radius={distancia * 1000}
            pathOptions={{
              color: '#3b82f6',
              fillColor: '#3b82f6',
              fillOpacity: 0.08,
            }}
          />
          {changasFiltradas.map((c) => (
            <Marker key={c.id} position={c.posicion}>
              <Popup>
                <div className="text-center min-w-[8rem]">
                  <p className="font-bold text-gray-800 text-sm">{c.titulo}</p>
                  {c.descripcion && (
                    <p className="text-xs text-gray-500 mt-1">{c.descripcion}</p>
                  )}
                  {c.pago && (
                    <p className="text-xs font-bold text-green-600 mt-1">{c.pago}</p>
                  )}
                  <span
                    className={`inline-block mt-2 text-[10px] font-black px-2 py-0.5 rounded-full border ${URGENCIA_ESTILOS[c.urgencia] ?? ''}`}
                  >
                    {c.urgencia?.toUpperCase()}
                  </span>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
    }
