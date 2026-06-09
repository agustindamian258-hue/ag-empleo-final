// src/pages/Privacidad.tsx
import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

const SECCIONES = [
  {
    titulo: '1. Responsable del tratamiento de datos',
    texto: 'AG Empleo es una plataforma digital desarrollada y administrada de forma independiente en la República Argentina. Para consultas sobre privacidad podés contactarnos a través de los canales oficiales de la aplicación.',
  },
  {
    titulo: '2. Datos que recopilamos',
    texto: 'Recopilamos: (a) datos de identificación provistos por Google al iniciar sesión (nombre, email y foto de perfil); (b) información que vos mismo cargás voluntariamente como ciudad, descripción, experiencia laboral, cargo deseado y expectativa salarial; (c) contenido que publicás en la plataforma como posts, historias, comentarios y ofertas de empleo; (d) datos técnicos de uso como fecha de registro y actividad dentro de la app.',
  },
  {
    titulo: '3. Finalidad del tratamiento',
    texto: 'Tus datos se utilizan exclusivamente para: (a) brindarte acceso a las funcionalidades de AG Empleo; (b) mostrar tu perfil a otros usuarios y empleadores; (c) conectarte con oportunidades laborales relevantes; (d) enviarte notificaciones relacionadas con la plataforma. No utilizamos tus datos para publicidad de terceros ni para ningún fin ajeno a los mencionados.',
  },
  {
    titulo: '4. Compartición de datos',
    texto: 'AG Empleo NO vende, alquila ni cede tu información personal a terceros. Tus datos pueden ser visibles para otros usuarios registrados de la plataforma en la medida en que vos mismo los hayas publicado (perfil público, posts, ofertas). Los datos se almacenan en los servidores de Google Firebase (Google Cloud) bajo sus propias políticas de seguridad y privacidad.',
  },
  {
    titulo: '5. Seguridad de la información',
    texto: 'Toda la información se almacena en Firebase (Google Cloud) con encriptación en tránsito (TLS/HTTPS) y en reposo. Implementamos reglas de seguridad que garantizan que cada usuario solo pueda acceder y modificar su propia información. Sin embargo, ningún sistema es 100% infalible, por lo que recomendamos no compartir información sensible en la plataforma.',
  },
  {
    titulo: '6. Derechos del usuario (Ley 25.326)',
    texto: 'En cumplimiento de la Ley de Protección de Datos Personales N° 25.326 de la República Argentina, tenés derecho a: (a) acceder a tus datos personales; (b) rectificar datos inexactos; (c) solicitar la eliminación de tu cuenta y todos tus datos; (d) oponerte al tratamiento de tus datos. Para ejercer estos derechos podés contactarnos a través de la aplicación. La Dirección Nacional de Protección de Datos Personales (DNPDP) es el organismo de control en Argentina.',
  },
  {
    titulo: '7. Retención de datos',
    texto: 'Tus datos se conservan mientras tu cuenta esté activa. Si solicitás la eliminación de tu cuenta, procederemos a eliminar tu información en un plazo razonable, excepto aquella que deba conservarse por obligaciones legales.',
  },
  {
    titulo: '8. Menores de edad',
    texto: 'AG Empleo está destinado a mayores de 18 años o menores emancipados. No recopilamos intencionalmente datos de menores de edad. Si tomamos conocimiento de que un menor registró una cuenta, procederemos a eliminarla.',
  },
  {
    titulo: '9. Cambios en esta política',
    texto: 'Nos reservamos el derecho de modificar esta política en cualquier momento. Los cambios serán notificados dentro de la aplicación. El uso continuado de AG Empleo después de dichos cambios implica la aceptación de la nueva política.',
  },
  {
    titulo: '10. Cookies y tecnologías similares',
    texto: 'AG Empleo es una Progressive Web App (PWA) que puede utilizar almacenamiento local del dispositivo (localStorage) para mejorar tu experiencia. No utilizamos cookies de rastreo ni publicidad.',
  },
] as const;

export default function Privacidad() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-24">
      <header className="sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-5 py-4 flex items-center gap-3 shadow-sm">
        <button
          onClick={() => navigate(-1)}
          className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full active:scale-90 transition-transform"
          aria-label="Volver"
        >
          <ArrowLeftIcon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        </button>
        <div>
          <h1 className="text-xl font-black text-blue-800 dark:text-blue-400 tracking-tighter">
            Políticas de Privacidad
          </h1>
          <p className="text-gray-400 text-xs">AG Empleo — Ley 25.326</p>
        </div>
      </header>

      <div className="px-4 pt-6 space-y-4">
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
          <div className="flex items-center gap-3 mb-4">
            <ShieldCheckIcon className="w-8 h-8 text-blue-600" />
            <p className="font-black text-gray-800 dark:text-white">Tu privacidad es importante</p>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            AG Empleo recopila únicamente los datos necesarios para brindarte la mejor experiencia
            en la búsqueda de empleo. Nunca vendemos ni compartimos tu información personal con terceros.
            Esta política cumple con la Ley de Protección de Datos Personales N° 25.326 de la República Argentina.
          </p>
        </div>

        {SECCIONES.map((item) => (
          <div key={item.titulo} className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
            <p className="font-black text-gray-800 dark:text-white text-sm mb-2">{item.titulo}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{item.texto}</p>
          </div>
        ))}

        <p className="text-center text-xs text-gray-400 pb-4">
          Última actualización: Junio 2026
        </p>
      </div>
    </div>
  );
}
