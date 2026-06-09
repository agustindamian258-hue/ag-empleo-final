// src/pages/Terminos.tsx
import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

const SECCIONES = [
  {
    titulo: '1. Aceptación de los términos',
    texto: 'Al registrarte y usar AG Empleo aceptás estos Términos y Condiciones en su totalidad. Si no estás de acuerdo con alguno de estos términos, no debés usar la plataforma.',
  },
  {
    titulo: '2. Descripción del servicio',
    texto: 'AG Empleo es una plataforma digital argentina que conecta personas en búsqueda de empleo con empleadores y ofrece funcionalidades de red social profesional, publicación de changas, generación de CV y asistente de inteligencia artificial. El servicio se presta de forma gratuita y puede modificarse o discontinuarse en cualquier momento.',
  },
  {
    titulo: '3. Registro y cuenta de usuario',
    texto: 'Para usar AG Empleo debés registrarte con una cuenta de Google válida. Sos responsable de mantener la confidencialidad de tu cuenta y de todas las actividades que ocurran bajo la misma. Debés notificarnos inmediatamente ante cualquier uso no autorizado de tu cuenta.',
  },
  {
    titulo: '4. Conducta del usuario',
    texto: 'Al usar AG Empleo te comprometés a: (a) no publicar contenido falso, engañoso, ofensivo, discriminatorio o ilegal; (b) no hacerte pasar por otra persona o empresa; (c) no publicar ofertas de empleo falsas o fraudulentas; (d) no usar la plataforma para actividades ilegales; (e) no intentar acceder a datos de otros usuarios sin autorización; (f) no realizar spam ni publicidad no autorizada.',
  },
  {
    titulo: '5. Contenido del usuario',
    texto: 'Vos sos el único responsable del contenido que publicás en AG Empleo (posts, ofertas de empleo, comentarios, historias, etc.). AG Empleo no se responsabiliza por el contenido generado por usuarios. Nos reservamos el derecho de eliminar contenido que viole estos términos sin previo aviso.',
  },
  {
    titulo: '6. Ofertas de empleo y postulaciones',
    texto: 'AG Empleo actúa como intermediario entre empleadores y candidatos. No garantizamos la veracidad de las ofertas publicadas ni el resultado de las postulaciones. Las empresas son las únicas responsables de sus procesos de selección. AG Empleo no interviene en negociaciones salariales ni relaciones laborales.',
  },
  {
    titulo: '7. Asistente de inteligencia artificial',
    texto: 'El asistente IA de AG Empleo utiliza tecnología de Google Gemini y tiene fines orientativos. Las respuestas generadas por la IA no constituyen asesoramiento legal, laboral ni profesional. AG Empleo no se responsabiliza por decisiones tomadas en base a las sugerencias del asistente.',
  },
  {
    titulo: '8. Limitación de responsabilidad',
    texto: 'AG Empleo se provee "tal como está". No garantizamos disponibilidad continua del servicio ni que esté libre de errores. No somos responsables por pérdidas o daños derivados del uso o imposibilidad de uso de la plataforma, incluyendo pérdidas de oportunidades laborales.',
  },
  {
    titulo: '9. Propiedad intelectual',
    texto: 'El diseño, código y marca de AG Empleo son propiedad de sus creadores. El contenido que vos publicás es tuyo, pero al publicarlo nos otorgás una licencia para mostrarlo dentro de la plataforma. No podés copiar, distribuir ni modificar ninguna parte de AG Empleo sin autorización expresa.',
  },
  {
    titulo: '10. Suspensión y cancelación',
    texto: 'Nos reservamos el derecho de suspender o eliminar cuentas que violen estos términos, sin previo aviso y sin responsabilidad. Podés cancelar tu cuenta en cualquier momento contactándonos a través de la aplicación.',
  },
  {
    titulo: '11. Ley aplicable y jurisdicción',
    texto: 'Estos términos se rigen por las leyes de la República Argentina. Ante cualquier disputa, las partes se someten a la jurisdicción de los tribunales ordinarios de la Ciudad Autónoma de Buenos Aires, renunciando a cualquier otro fuero.',
  },
  {
    titulo: '12. Modificaciones',
    texto: 'Podemos modificar estos términos en cualquier momento. Los cambios serán notificados dentro de la aplicación. El uso continuado de AG Empleo implica la aceptación de los términos modificados.',
  },
] as const;

export default function Terminos() {
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
            Términos y Condiciones
          </h1>
          <p className="text-gray-400 text-xs">AG Empleo</p>
        </div>
      </header>

      <div className="px-4 pt-6 space-y-4">
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
          <div className="flex items-center gap-3 mb-4">
            <DocumentTextIcon className="w-8 h-8 text-blue-600" />
            <p className="font-black text-gray-800 dark:text-white">Condiciones de uso</p>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            Estos Términos y Condiciones regulan el uso de AG Empleo. Al usar la plataforma
            confirmás que leíste, entendiste y aceptás estas condiciones.
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
