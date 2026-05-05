// src/pages/MapPage.tsx
import { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { db, auth } from '../app/firebase';
import { collection, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import {
  XMarkIcon, MapPinIcon, ExclamationCircleIcon,
  PlusIcon, CheckIcon,
} from '@heroicons/react/24/outline';

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface Changa {
  id:           string;
  titulo:       string;
  descripcion?: string;
  pago?:        string;
  urgencia:     'urgente' | 'semana' | 'mes';
  posicion:     [number, number];
}

interface FormChanga {
  titulo:      string;
  descripcion: string;
  pago:        string;
  urgencia:    'urgente' | 'semana' | 'mes';
}

type Coordenada = [number, number];

const BUENOS_AIRES: Coordenada = [-34.6037, -58.3816];
const GEO_TIMEOUT_MS = 10_000;

const URGENCIA_ESTILOS: Record<string, string> = {
  urgente: 'text-red-600 bg-red-50 border-red-200',
  semana:  'text-orange-600 bg-orange-50 border-orange-200',
  mes:     'text-blue-600 bg-blue-50 border-blue-200',
};

const FILTROS_URGENCIA = [
  { id: 'urgente', label: 'Urgente',     clase: 'bg-red-100 text-red-700 border-red-200'          },
  { id: 'semana',  label: 'Esta semana', clase: 'bg-orange-100 text-orange-700 border-orange-200' },
  { id: 'mes',     label: 'Este mes',    clase: 'bg-blue-100 text-blue-700 border-blue-200'        },
] as const;

function calcularDistancia(a: Coordenada, b: Coordenada): number {
  const R    = 6371;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLon = ((b[1] - a[1]) * Math.PI) / 180;
  const x    =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a[0] * Math.PI) / 180) *
    Math.cos((b[0] * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

function esCoordValida(pos: unknown): pos is Coordenada {
  return (
    Array.isArray(pos) && pos.length === 2 &&
    typeof pos[0] === 'number' && !isNaN(pos[0]) &&
    typeof pos[1] === 'number' && !isNaN(pos[1]) &&
    pos[0] >= -90  && pos[0] <= 90 &&
    pos[1] >= -180 && pos[1] <= 180
  );
}

function CentrarMapa({ centro }: { centro: Coordenada }) {
  const map = useMap();
  useEffect(() => { map.setView(centro, 13); }, [map, centro]);
  return null;
}

function SelectorUbicacion({
  activo,
  onSeleccionar,
}: {
  activo: boolean;
  onSeleccionar: (pos: Coordenada) => void;
}) {
  useMapEvents({
    click(e) {
      if (activo) onSeleccionar([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

const FORM_INICIAL: FormChanga = {
  titulo: '', descripcion: '', pago: '', urgencia: 'urgente',
};

export default function MapPage() {
  const navigate = useNavigate();

  const [distancia,      setDistancia]      = useState<number>(5);
  const [changas,        setChangas]        = useState<Changa[]>([]);
  const [urgenciaFiltro, setUrgenciaFiltro] = useState<string | null>(null);
  const [userLoc,        setUserLoc]        = useState<Coordenada>(BUENOS_AIRES);
  const [localizando,    setLocalizando]    = useState<boolean>(true);
  const [errorGeo,       setErrorGeo]       = useState<string>('');
  const [errorFirebase,  setErrorFirebase]  = useState<string>('');

  const [modalAbierto,   setModalAbierto]   = useState(false);
  const [form,           setForm]           = useState<FormChanga>(FORM_INICIAL);
  const [posSelec,       setPosSelec]       = useState<Coordenada | null>(null);
  const [eligiendoPos,   setEligiendoPos]   = useState(false);
  const [guardando,      setGuardando]      = useState(false);
  const [errForm,        setErrForm]        = useState('');

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

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'changas'),
      (snap) => {
        setChangas(
          snap.docs
            .map((d) => ({ id: d.id, ...d.data() } as Changa))
            .filter((c) => esCoordValida(c.posicion))
        );
        setErrorFirebase('');
      },
      (err) => {
        console.error('[MapPage] Error al cargar changas:', err);
        setErrorFirebase('No se pudieron cargar las changas.');
      }
    );
    return () => unsub();
  }, []);

  const changasFiltradas = changas.filter((c) => {
    const dist           = calcularDistancia(userLoc, c.posicion);
    const dentroRadio    = dist <= distancia;
    const cumpleUrgencia = !urgenciaFiltro || c.urgencia === urgenciaFiltro;
    return dentroRadio && cumpleUrgencia;
  });

  const toggleUrgencia = useCallback((id: string) => {
    setUrgenciaFiltro((prev) => (prev === id ? null : id));
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  }

  async function handlePublicar() {
    if (!form.titulo.trim()) { setErrForm('El título es obligatorio.'); return; }
    if (!posSelec)           { setErrForm('Tocá el mapa para elegir la ubicación.'); return; }
    setGuardando(true);
    setErrForm('');
    try {
      await addDoc(collection(db, 'changas'), {
        titulo:      form.titulo.trim(),
        descripcion: form.descripcion.trim() || null,
        pago:        form.pago.trim() || null,
        urgencia:    form.urgencia,
        posicion:    posSelec,
        uid:         auth.currentUser?.uid ?? null,
        userName:    auth.currentUser?.displayName ?? 'Usuario',
        createdAt:   serverTimestamp(),
      });
      setForm(FORM_INICIAL);
      setPosSelec(null);
      setEligiendoPos(false);
      setModalAbierto(false);
    } catch (err) {
      console.error('[MapPage] Error al publicar:', err);
      setErrForm('No se pudo publicar. Intentá de nuevo.');
    } finally {
      setGuardando(false);
    }
  }

  const inputBase = 'w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 placeholder-gray-400';

  return (
    <div className="fixed inset-0 z-[100] bg-white dark:bg-gray-950 flex flex-col">

      <div className="p-4 flex justify-between items-center bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 shadow-sm">
        <div>
          <h2 className="font-black text-xl text-blue-900 dark:text-blue-300">Mapa de Changas</h2>
          <p className="text-xs text-gray-400">
            {changasFiltradas.length} trabajo{changasFiltradas.length !== 1 ? 's' : ''} cerca tuyo
          </p>
        </div>
        <button
          onClick={() => navigate('/')}
          aria-label="Volver al inicio"
          className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full active:scale-90 transition-transform"
        >
          <XMarkIcon className="w-6 h-6 text-gray-700 dark:text-gray-300" />
        </button>
      </div>

      {(errorGeo || errorFirebase) && (
        <div className="px-4 py-2 bg-yellow-50 border-b border-yellow-100 flex items-center gap-2 text-yellow-700 text-xs" role="alert">
          <ExclamationCircleIcon className="w-4 h-4 shrink-0" />
          {errorGeo || errorFirebase}
        </div>
      )}

      {eligiendoPos && (
        <div className="px-4 py-2 bg-green-500 flex items-center justify-between text-white text-xs font-bold">
          <span>📍 Tocá el mapa para marcar la ubicación</span>
          <button onClick={() => setEligiendoPos(false)} className="underline">Cancelar</button>
        </div>
      )}

      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm font-bold text-gray-600 dark:text-gray-400">Radio de búsqueda</span>
          <span className="text-blue-600 dark:text-blue-400 font-black text-sm">{distancia} km</span>
        </div>
        <input
          type="range" min="1" max="100" value={distancia}
          onChange={(e) => setDistancia(parseInt(e.target.value, 10))}
          className="w-full accent-blue-600"
          aria-label={`Radio de búsqueda: ${distancia} kilómetros`}
        />
        <div className="flex gap-2" role="group" aria-label="Filtrar por urgencia">
          {FILTROS_URGENCIA.map((u) => (
            <button
              key={u.id}
              onClick={() => toggleUrgencia(u.id)}
              aria-pressed={urgenciaFiltro === u.id}
              className={`flex-1 py-1.5 text-[10px] font-black rounded-full border transition-all ${
                urgenciaFiltro === u.id
                  ? u.clase + ' ring-2 ring-offset-1 ring-blue-400'
                  : 'bg-white dark:bg-gray-800 text-gray-400 border-gray-200 dark:border-gray-700'
              }`}
            >
              {u.label.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-grow relative">
        {localizando && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
            <div className="flex flex-col items-center gap-2">
              <MapPinIcon className="w-8 h-8 text-blue-600 animate-bounce" />
              <p className="text-sm text-gray-500">Buscando tu ubicación...</p>
            </div>
          </div>
        )}

        <MapContainer center={userLoc} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            attribution='&copy; OpenStreetMap &copy; CARTO'
          />
          <CentrarMapa centro={userLoc} />
          <SelectorUbicacion
            activo={eligiendoPos}
            onSeleccionar={(pos) => {
              setPosSelec(pos);
              setEligiendoPos(false);
              setModalAbierto(true);
            }}
          />
          <Circle
            center={userLoc}
            radius={distancia * 1000}
            pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.08 }}
          />
          {posSelec && <Marker position={posSelec}><Popup>Ubicación seleccionada</Popup></Marker>}

          {changasFiltradas.map((c) => (
            <Marker key={c.id} position={c.posicion}>
              <Popup>
                <div className="text-center min-w-[8rem]">
                  <p className="font-bold text-gray-800 text-sm">{c.titulo}</p>
                  {c.descripcion && <p className="text-xs text-gray-500 mt-1">{c.descripcion}</p>}
                  {c.pago && <p className="text-xs font-bold text-green-600 mt-1">{c.pago}</p>}
                  <span className={`inline-block mt-2 text-[10px] font-black px-2 py-0.5 rounded-full border ${URGENCIA_ESTILOS[c.urgencia] ?? 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                    {c.urgencia?.toUpperCase()}
                  </span>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {auth.currentUser && !eligiendoPos && (
          <button
            onClick={() => setEligiendoPos(true)}
            className="absolute bottom-6 right-4 z-[400] w-14 h-14 rounded-full bg-green-500 hover:bg-green-600 text-white shadow-lg flex items-center justify-center transition-all active:scale-90"
            aria-label="Publicar changa"
          >
            <PlusIcon className="w-7 h-7" />
          </button>
        )}
      </div>

      {modalAbierto && (
        <div
          className="fixed inset-0 z-[500] flex items-end justify-center bg-black/50 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && setModalAbierto(false)}
        >
          <div className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-t-3xl px-5 pt-5 pb-10 space-y-4 animate-slide-up">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-gray-800 dark:text-gray-100">Publicar Changa</h2>
              <button
                onClick={() => setModalAbierto(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800"
              >
                <XMarkIcon className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {posSelec && (
              <div className="flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-900/20 rounded-2xl text-green-700 dark:text-green-400 text-xs font-bold">
                <CheckIcon className="w-4 h-4 shrink-0" />
                Ubicación marcada en el mapa
              </div>
            )}

            <button
              onClick={() => { setModalAbierto(false); setEligiendoPos(true); }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl border border-dashed border-green-400 text-green-600 dark:text-green-400 text-sm font-bold active:scale-95 transition-transform"
            >
              <MapPinIcon className="w-5 h-5" />
              {posSelec ? 'Cambiar ubicación en el mapa' : 'Elegir ubicación en el mapa'}
            </button>

            <input
              name="titulo"
              value={form.titulo}
              onChange={handleChange}
              placeholder="Título de la changa *"
              className={inputBase}
              maxLength={80}
            />

            <textarea
              name="descripcion"
              value={form.descripcion}
              onChange={handleChange}
              placeholder="Descripción (opcional)"
              rows={2}
              className={`${inputBase} resize-none`}
              maxLength={300}
            />

            <input
              name="pago"
              value={form.pago}
              onChange={handleChange}
              placeholder="Pago estimado (opcional)"
              className={inputBase}
              maxLength={40}
            />

            <div className="flex gap-2">
              {(['urgente', 'semana', 'mes'] as const).map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, urgencia: u }))}
                  className={`flex-1 py-2 rounded-full text-xs font-black border transition-all active:scale-95 ${
                    form.urgencia === u
                      ? URGENCIA_ESTILOS[u]
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-400 border-gray-200 dark:border-gray-700'
                  }`}
                >
                  {u === 'urgente' ? 'URGENTE' : u === 'semana' ? 'ESTA SEMANA' : 'ESTE MES'}
                </button>
              ))}
            </div>

            {errForm && (
              <p className="text-red-500 text-xs flex items-center gap-1">
                <ExclamationCircleIcon className="w-4 h-4 shrink-0" />
                {errForm}
              </p>
            )}

            <button
              onClick={handlePublicar}
              disabled={guardando}
              className="w-full py-3.5 rounded-2xl bg-green-500 hover:bg-green-600 text-white font-black text-sm transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {guardando ? (
                <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Publicando...</>
              ) : 'Publicar en el mapa'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
                                }
