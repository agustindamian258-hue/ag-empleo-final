import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

const SECCIONES = [
  {
    titulo: '¿Qué datos recopilamos?',
    texto:  'Recopilamos tu nombre, email y foto de perfil a través de Google. También guardamos la información que vos mismo cargás como ciudad, descripción y experiencia laboral.',
  },
  {
    titulo: '¿Para qué usamos tus datos?',
    texto:  'Tus datos se usan exclusivamente para personalizar tu experiencia en AG Empleo, mostrarte empleos relevantes y permitirte generar tu CV.',
  },
  {
    titulo: '¿Cómo protegemos tu información?',
    texto:  'Toda la información se almacena en Firebase (Google Cloud) con encriptación en tránsito y en reposo. Solo vos podés acceder y modificar tu perfil.',
  },
  {
    titulo: '¿Podés eliminar tus datos?',
    texto:  'Sí. Podés solicitar la eliminación de tu cuenta y todos tus datos en cualquier momento contactándonos por los canales oficiales de AG Empleo.',
  },
] as const;

export default function Privacidad() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <header className="sticky top-0 z-30 bg-white border-b border-gray-100 px-5 py-4 flex items-center gap-3 shadow-sm">
        <button
          onClick={() => navigate(-1)}
          className="p-2 bg-gray-100 rounded-full active:scale-90 transition-transform"
          aria-label="Volver"
        >
          <ArrowLeftIcon className="w-5 h-5 text-gray-700" />
        </button>
        <div>
          <h1 className="text-xl font-black text-blue-800 tracking-tighter">
            Políticas de Privacidad
          </h1>
          <p className="text-gray-400 text-xs">AG Empleo</p>
        </div>
      </header>

      <div className="px-4 pt-6 space-y-4">
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-3 mb-4">
            <ShieldCheckIcon className="w-8 h-8 text-blue-600" />
            <p className="font-black text-gray-800">Tu privacidad es importante</p>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">
            AG Empleo recopila únicamente los datos necesarios para brindarte
            la mejor experiencia en la búsqueda de empleo. Nunca vendemos ni
            compartimos tu información personal con terceros.
          </p>
        </div>

        {SECCIONES.map((item) => (
          <div
            key={item.titulo}
            className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5"
          >
            <p className="font-black text-gray-800 text-sm mb-2">{item.titulo}</p>
            <p className="text-sm text-gray-600 leading-relaxed">{item.texto}</p>
          </div>
        ))}

        <p className="text-center text-xs text-gray-400 pb-4">
          Última actualización: Abril 2026
        </p>
      </div>
    </div>
  );
}
