import { useState, useRef, useEffect } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../app/firebase';
import Navbar from '../components/Navbar';
import Menu   from '../components/Menu';
import { ArrowDownTrayIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface FormCV {
  name:       string;
  email:      string;
  phone:      string;
  ciudad:     string;
  summary:    string;
  skills:     string;
  experience: string;
  education:  string;
}

type PlantillaId = '1' | '2' | '3' | '4';

interface Plantilla {
  id:     PlantillaId;
  nombre: string;
  color:  string;
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const FORM_INICIAL: FormCV = {
  name: '', email: '', phone: '', ciudad: '',
  summary: '', skills: '', experience: '', education: '',
};

const PLANTILLAS: Plantilla[] = [
  { id: '1', nombre: 'Clásico',     color: 'bg-blue-600'   },
  { id: '2', nombre: 'Moderno',     color: 'bg-purple-600' },
  { id: '3', nombre: 'Minimalista', color: 'bg-gray-700'   },
  { id: '4', nombre: 'ATS Pro',     color: 'bg-green-600'  },
];

const CAMPOS_TEXTO: Array<{
  name: keyof Pick<FormCV, 'name' | 'email' | 'phone' | 'ciudad'>;
  placeholder: string;
  type: string;
}> = [
  { name: 'name',   placeholder: 'Nombre completo', type: 'text'  },
  { name: 'email',  placeholder: 'Email',           type: 'email' },
  { name: 'phone',  placeholder: 'Teléfono',        type: 'tel'   },
  { name: 'ciudad', placeholder: 'Ciudad',          type: 'text'  },
];

const CAMPOS_TEXTAREA: Array<{
  name: keyof Pick<FormCV, 'summary' | 'skills' | 'experience' | 'education'>;
  placeholder: string;
  rows: number;
}> = [
  {
    name:        'summary',
    placeholder: 'Resumen profesional (2-3 líneas)',
    rows:        3,
  },
  {
    name:        'skills',
    placeholder: 'Habilidades (separadas por coma)\nEj: Excel, Atención al cliente',
    rows:        2,
  },
  {
    name:        'experience',
    placeholder: 'Experiencia (una por línea)\nEj: 2022-2024 — Vendedor en Empresa X',
    rows:        4,
  },
  {
    name:        'education',
    placeholder: 'Educación\nEj: Bachiller — Colegio Nacional (2020)',
    rows:        2,
  },
];

// ─── Componente ───────────────────────────────────────────────────────────────

export default function CVBuilder() {
  const [form,       setForm]       = useState<FormCV>(FORM_INICIAL);
  const [template,   setTemplate]   = useState<PlantillaId>('1');
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [descargando,setDescargando]= useState<boolean>(false);
  const [error,      setError]      = useState<string>('');
  const cvRef = useRef<HTMLDivElement>(null);

  // Pre-cargar datos del perfil del usuario autenticado
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user: User | null) => {
      if (!user) return;
      try {
        const snap = await getDoc(doc(db, 'users', user.uid));
        if (snap.exists()) {
          const d = snap.data();
          setForm((prev) => ({
            ...prev,
            name:    d.name    || user.displayName || '',
            email:   d.email   || user.email       || '',
            ciudad:  d.ciudad  || '',
            summary: d.bio     || '',
          }));
        }
      } catch (e) {
        console.error('[CVBuilder] Error al cargar perfil:', e);
      }
    });
    return () => unsub();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ): void => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  /**
   * Genera y descarga el CV como PDF usando html2canvas + jsPDF.
   * Scale 2 garantiza resolución adecuada para impresión.
   */
  const handleDescargar = async (): Promise<void> => {
    if (!cvRef.current) return;

    if (!form.name.trim()) {
      setError('Completá al menos tu nombre antes de descargar.');
      return;
    }

    setDescargando(true);
    setError('');

    try {
      const canvas = await html2canvas(cvRef.current, {
        scale:           2,
        useCORS:         true,
        backgroundColor: '#ffffff',
        logging:         false,
      });

      const imgData  = canvas.toDataURL('image/png');
      const pdf      = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`CV_${form.name.trim().replace(/\s+/g, '_')}.pdf`);
    } catch (e) {
      console.error('[CVBuilder] Error al generar PDF:', e);
      setError('No se pudo generar el PDF. Intentá de nuevo.');
    } finally {
      setDescargando(false);
    }
  };

  // Derivados del form — se recalculan solo cuando cambia el form
  const skillsList = form.skills
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const expList = form.experience.split('\n').filter(Boolean);

  // ─── Sub-componentes de plantilla ─────────────────────────────────────────

  const ContactLine = ({ sep = ' · ' }: { sep?: string }) => (
    <>{[form.email, form.phone, form.ciudad].filter(Boolean).join(sep)}</>
  );

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 pb-24">

      {/* Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-100 px-5 py-4 shadow-sm">
        <h1 className="text-2xl font-black text-blue-800 tracking-tighter">Generador de CV</h1>
        <p className="text-gray-400 text-xs">Completá los datos y descargá tu CV en PDF</p>
      </header>

      {/* Campos de texto */}
      <div className="px-4 pt-5 space-y-3">
        {CAMPOS_TEXTO.map((f) => (
          <input
            key={f.name}
            name={f.name}
            type={f.type}
            placeholder={f.placeholder}
            value={form[f.name]}
            onChange={handleChange}
            autoComplete={f.type === 'email' ? 'email' : f.type === 'tel' ? 'tel' : 'off'}
            className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-colors"
          />
        ))}

        {CAMPOS_TEXTAREA.map((f) => (
          <textarea
            key={f.name}
            name={f.name}
            placeholder={f.placeholder}
            value={form[f.name]}
            onChange={handleChange}
            rows={f.rows}
            className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-colors resize-none"
          />
        ))}
      </div>

      {/* Selector de plantilla */}
      <div className="px-4 pt-6">
        <p className="text-sm font-bold text-gray-700 mb-3">Elegí tu diseño:</p>
        <div className="grid grid-cols-2 gap-3">
          {PLANTILLAS.map((p) => (
            <button
              key={p.id}
              onClick={() => setTemplate(p.id)}
              aria-pressed={template === p.id}
              className={`py-3 rounded-2xl text-sm font-bold transition-all active:scale-95 border-2 ${
                template === p.id
                  ? 'border-blue-600 bg-blue-50 text-blue-700'
                  : 'border-gray-200 bg-white text-gray-500'
              }`}
            >
              {p.nombre}
              {p.id === '4' && (
                <span className="ml-1 text-xs text-green-600">✓ ATS</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Vista previa del CV */}
      <div className="px-4 pt-6">
        <p className="text-sm font-bold text-gray-700 mb-3">Vista previa:</p>

        <div
          ref={cvRef}
          className="bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm"
        >
          {/* ── Plantilla 1: Clásico ── */}
          {template === '1' && (
            <div>
              <div className="bg-blue-700 px-6 py-5 text-white">
                <h2 className="text-xl font-black">{form.name || 'Tu Nombre'}</h2>
                <p className="text-blue-200 text-xs mt-0.5">
                  <ContactLine />
                </p>
              </div>
              <div className="p-5 space-y-4">
                {form.summary && (
                  <p className="text-gray-600 text-sm leading-relaxed">{form.summary}</p>
                )}
                {skillsList.length > 0 && (
                  <div>
                    <p className="text-xs font-black text-blue-700 uppercase tracking-widest mb-2">Habilidades</p>
                    <div className="flex flex-wrap gap-1.5">
                      {skillsList.map((s, i) => (
                        <span key={`skill-${i}`} className="bg-blue-50 text-blue-700 text-xs px-3 py-1 rounded-full font-medium">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {expList.length > 0 && (
                  <div>
                    <p className="text-xs font-black text-blue-700 uppercase tracking-widest mb-2">Experiencia</p>
                    {expList.map((e, i) => (
                      <p key={`exp-${i}`} className="text-sm text-gray-700 py-1 border-l-2 border-blue-200 pl-3 mb-1">{e}</p>
                    ))}
                  </div>
                )}
                {form.education && (
                  <div>
                    <p className="text-xs font-black text-blue-700 uppercase tracking-widest mb-2">Educación</p>
                    <p className="text-sm text-gray-700">{form.education}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Plantilla 2: Moderno ── */}
          {template === '2' && (
            <div className="flex">
              <div className="w-2/5 bg-purple-700 p-4 text-white min-h-64">
                <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mb-3">
                  <span className="text-2xl font-black">
                    {(form.name || 'T')[0].toUpperCase()}
                  </span>
                </div>
                <h2 className="font-black text-base leading-tight">{form.name || 'Tu Nombre'}</h2>
                <p className="text-purple-200 text-[10px] mt-1 break-all">{form.email}</p>
                <p className="text-purple-200 text-[10px]">{form.phone}</p>
                <p className="text-purple-200 text-[10px]">{form.ciudad}</p>
                {skillsList.length > 0 && (
                  <div className="mt-4">
                    <p className="text-[9px] font-black uppercase tracking-widest text-purple-300 mb-2">Skills</p>
                    {skillsList.map((s, i) => (
                      <p key={`skill2-${i}`} className="text-[11px] py-0.5 border-b border-purple-600">{s}</p>
                    ))}
                  </div>
                )}
              </div>
              <div className="w-3/5 p-4 space-y-3">
                {form.summary && (
                  <p className="text-gray-600 text-xs leading-relaxed">{form.summary}</p>
                )}
                {expList.length > 0 && (
                  <div>
                    <p className="text-[9px] font-black text-purple-700 uppercase tracking-widest mb-1">Experiencia</p>
                    {expList.map((e, i) => (
                      <p key={`exp2-${i}`} className="text-xs text-gray-700 mb-1">{e}</p>
                    ))}
                  </div>
                )}
                {form.education && (
                  <div>
                    <p className="text-[9px] font-black text-purple-700 uppercase tracking-widest mb-1">Educación</p>
                    <p className="text-xs text-gray-700">{form.education}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Plantilla 3: Minimalista ── */}
          {template === '3' && (
            <div className="p-6 font-serif">
              <div className="border-b-2 border-gray-800 pb-3 mb-4">
                <h2 className="text-xl font-black text-gray-900">{form.name || 'Tu Nombre'}</h2>
                <p className="text-gray-500 text-xs mt-0.5"><ContactLine /></p>
              </div>
              {form.summary && (
                <p className="text-gray-700 text-sm mb-4 italic">{form.summary}</p>
              )}
              {skillsList.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Habilidades</p>
                  <p className="text-sm text-gray-700">{skillsList.join(' · ')}</p>
                </div>
              )}
              {expList.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Experiencia</p>
                  {expList.map((e, i) => (
                    <p key={`exp3-${i}`} className="text-sm text-gray-700 mb-1">— {e}</p>
                  ))}
                </div>
              )}
              {form.education && (
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Educación</p>
                  <p className="text-sm text-gray-700">{form.education}</p>
                </div>
              )}
            </div>
          )}

          {/* ── Plantilla 4: ATS Pro ── */}
          {template === '4' && (
            <div className="p-5 font-mono text-xs">
              <h2 className="text-base font-black text-gray-900 uppercase">
                {form.name || 'TU NOMBRE'}
              </h2>
              <p className="text-gray-600 mb-3">
                <ContactLine sep=" | " />
              </p>
              {form.summary && (
                <div className="mb-3">
                  <p className="font-black uppercase text-gray-800 border-b border-gray-300 mb-1">PERFIL</p>
                  <p className="text-gray-700 leading-relaxed">{form.summary}</p>
                </div>
              )}
              {skillsList.length > 0 && (
                <div className="mb-3">
                  <p className="font-black uppercase text-gray-800 border-b border-gray-300 mb-1">HABILIDADES</p>
                  <p className="text-gray-700">{skillsList.join(' | ')}</p>
                </div>
              )}
              {expList.length > 0 && (
                <div className="mb-3">
                  <p className="font-black uppercase text-gray-800 border-b border-gray-300 mb-1">EXPERIENCIA</p>
                  {expList.map((e, i) => (
                    <p key={`exp4-${i}`} className="text-gray-700 mb-0.5">• {e}</p>
                  ))}
                </div>
              )}
              {form.education && (
                <div>
                  <p className="font-black uppercase text-gray-800 border-b border-gray-300 mb-1">EDUCACIÓN</p>
                  <p className="text-gray-700">{form.education}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="px-4 pt-3">
          <div
            className="flex items-center gap-2 p-3 bg-red-50 rounded-2xl text-red-600 text-sm"
            role="alert"
          >
            <ExclamationCircleIcon className="w-5 h-5 shrink-0" />
            {error}
          </div>
        </div>
      )}

      {/* Botón descargar */}
      <div className="px-4 pt-5">
        <button
          onClick={handleDescargar}
          disabled={descargando}
          className="w-full flex items-center justify-center gap-2 bg-green-600 text-white py-4 rounded-2xl font-black text-base shadow-lg active:scale-95 transition-transform disabled:opacity-60"
        >
          <ArrowDownTrayIcon className="w-5 h-5" />
          {descargando ? 'Generando PDF...' : 'Descargar CV en PDF'}
        </button>
      </div>

      <Navbar onMenuClick={() => setIsMenuOpen(true)} />
      <Menu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </div>
  );
}
