// src/pages/CVBuilder.tsx
import { useState, useRef, useEffect, useCallback } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../app/firebase';
import Navbar from '../components/Navbar';
import Menu from '../components/Menu';
import {
  ArrowDownTrayIcon, ExclamationCircleIcon, QuestionMarkCircleIcon,
  XMarkIcon, CheckCircleIcon, PhotoIcon, PlusIcon, TrashIcon,
} from '@heroicons/react/24/outline';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Experiencia {
  id: string; cargo: string; empresa: string;
  desde: string; hasta: string; descripcion: string;
}

interface Educacion {
  id: string; titulo: string; institucion: string;
  desde: string; hasta: string;
}

interface Idioma { id: string; idioma: string; nivel: string; }
interface Certificacion { id: string; nombre: string; institucion: string; anio: string; }
interface Proyecto { id: string; nombre: string; descripcion: string; url: string; }
interface Referencia { id: string; nombre: string; cargo: string; empresa: string; telefono: string; }

interface FormCV {
  name: string; email: string; phone: string; ciudad: string;
  linkedin: string; portfolio: string; summary: string; skills: string;
  experiencias: Experiencia[]; educaciones: Educacion[];
  idiomas: Idioma[]; certificaciones: Certificacion[];
  proyectos: Proyecto[]; referencias: Referencia[];
  voluntariado: string; fotoUrl: string;
}

type PlantillaId = '1' | '2' | '3' | '4';
type SeccionId = 'idiomas' | 'certificaciones' | 'proyectos' | 'referencias' | 'voluntariado';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const uid = () => Math.random().toString(36).slice(2, 9);

const FORM_INICIAL: FormCV = {
  name: '', email: '', phone: '', ciudad: '',
  linkedin: '', portfolio: '', summary: '', skills: '',
  experiencias: [{ id: uid(), cargo: '', empresa: '', desde: '', hasta: '', descripcion: '' }],
  educaciones:  [{ id: uid(), titulo: '', institucion: '', desde: '', hasta: '' }],
  idiomas: [], certificaciones: [], proyectos: [], referencias: [],
  voluntariado: '', fotoUrl: '',
};

const PLANTILLAS = [
  { id: '1' as PlantillaId, nombre: 'Clásico',     color: 'bg-blue-600'   },
  { id: '2' as PlantillaId, nombre: 'Moderno',     color: 'bg-purple-600' },
  { id: '3' as PlantillaId, nombre: 'Minimalista', color: 'bg-gray-700'   },
  { id: '4' as PlantillaId, nombre: 'ATS Pro ✓',   color: 'bg-green-600'  },
];

const TOOLTIPS: Record<string, string> = {
  name:        'Tu nombre completo tal como aparecerá en el CV. Usá nombre y apellido.',
  email:       'Email profesional. Evitá apodos — usá nombre.apellido@gmail.com si podés.',
  phone:       'Teléfono con código de área. Ej: +54 11 1234-5678',
  ciudad:      'Ciudad donde vivís o donde podés trabajar. No es necesario poner dirección exacta.',
  linkedin:    'Tu perfil de LinkedIn. Entrá a linkedin.com, copiá la URL de tu perfil.',
  portfolio:   'Link a tu portfolio, GitHub, Behance, o cualquier trabajo online.',
  summary:     'Resumen de 2-3 oraciones sobre quién sos profesionalmente. Mencioná tu área, años de experiencia y tu mayor fortaleza.',
  skills:      'Tus habilidades técnicas y blandas separadas por coma. Ej: Excel, Atención al cliente, Trabajo en equipo.',
  experiencias:'Cargos que tuviste. Si no tenés experiencia formal, podés poner changas, trabajo familiar o proyectos personales.',
  educaciones: 'Estudios formales o en curso. Incluí secundario si no tenés título universitario.',
  idiomas:     'Idiomas que hablás. El nivel puede ser: Básico, Intermedio, Avanzado o Nativo.',
  certificaciones: 'Cursos, certificados online (Coursera, Google, etc.) u otros títulos.',
  proyectos:   'Proyectos personales, freelance o académicos que demuestren tus habilidades.',
  referencias: 'Personas que puedan dar referencias tuyas. Siempre pedí permiso antes de incluirlas.',
  voluntariado:'Trabajo voluntario en ONGs, vecinales, clubes, etc. Suma mucho en un CV.',
};

// ─── Componente Tooltip ───────────────────────────────────────────────────────

function Tooltip({ campo }: { campo: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative inline-block ml-1">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="text-gray-400 hover:text-blue-500 transition-colors"
        aria-label="Ayuda"
      >
        <QuestionMarkCircleIcon className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute z-50 left-0 top-6 w-64 bg-gray-900 text-white text-xs rounded-2xl p-3 shadow-xl">
          {TOOLTIPS[campo] || ''}
          <button onClick={() => setOpen(false)} className="absolute top-2 right-2">
            <XMarkIcon className="w-3 h-3 text-gray-400" />
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Label con Tooltip ────────────────────────────────────────────────────────

function FieldLabel({ label, campo }: { label: string; campo: string }) {
  return (
    <label className="flex items-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
      {label}<Tooltip campo={campo} />
    </label>
  );
}

// ─── Botón Saltar Sección ─────────────────────────────────────────────────────

function SkipButton({ onSkip }: { onSkip: () => void }) {
  return (
    <button type="button" onClick={onSkip}
      className="text-xs text-gray-400 underline ml-2 hover:text-gray-600">
      Saltar sección
    </button>
  );
}

// ─── Progreso ─────────────────────────────────────────────────────────────────

function calcProgreso(form: FormCV): number {
  let pts = 0; let total = 10;
  if (form.name.trim())    pts++;
  if (form.email.trim())   pts++;
  if (form.phone.trim())   pts++;
  if (form.ciudad.trim())  pts++;
  if (form.summary.trim()) pts++;
  if (form.skills.trim())  pts++;
  if (form.experiencias.some(e => e.cargo)) pts++;
  if (form.educaciones.some(e => e.titulo)) pts++;
  if (form.linkedin.trim() || form.portfolio.trim()) pts++;
  if (form.fotoUrl) pts++;
  return Math.round((pts / total) * 100);
}

// ─── Alertas ATS ──────────────────────────────────────────────────────────────

function AlertasATS({ form }: { form: FormCV }) {
  const alertas: string[] = [];
  if (!form.summary.trim()) alertas.push('Falta el resumen profesional — muy importante para ATS');
  if (!form.skills.trim())  alertas.push('Falta la sección de habilidades — los ATS la buscan');
  if (form.experiencias.every(e => !e.cargo)) alertas.push('Sin experiencia cargada');
  if (!form.email.trim())   alertas.push('Falta el email de contacto');
  if (alertas.length === 0) return null;
  return (
    <div className="px-4 pt-4 space-y-2">
      {alertas.map((a, i) => (
        <div key={i} className="flex items-start gap-2 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-2xl p-3 text-xs text-amber-700 dark:text-amber-400">
          <ExclamationCircleIcon className="w-4 h-4 shrink-0 mt-0.5" />
          {a}
        </div>
      ))}
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function CVBuilder() {
  const [form,        setForm]        = useState<FormCV>(() => {
    try {
      const saved = localStorage.getItem('ag_cv_draft');
      return saved ? JSON.parse(saved) : FORM_INICIAL;
    } catch { return FORM_INICIAL; }
  });
  const [template,    setTemplate]    = useState<PlantillaId>('1');
  const [isMenuOpen,  setIsMenuOpen]  = useState(false);
  const [descargando, setDescargando] = useState(false);
  const [error,       setError]       = useState('');
  const [guardado,    setGuardado]    = useState(false);
  const [seccionesSaltadas, setSeccionesSaltadas] = useState<SeccionId[]>([]);
  const cvRef = useRef<HTMLDivElement>(null);
  const fotoRef = useRef<HTMLInputElement>(null);

  // Pre-cargar perfil
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user: User | null) => {
      if (!user) return;
      try {
        const snap = await getDoc(doc(db, 'users', user.uid));
        if (snap.exists()) {
          const d = snap.data();
          setForm(prev => ({
            ...prev,
            name:    prev.name    || d.name    || user.displayName || '',
            email:   prev.email   || d.email   || user.email       || '',
            ciudad:  prev.ciudad  || d.ciudad  || '',
            summary: prev.summary || d.bio     || '',
            fotoUrl: prev.fotoUrl || d.photo   || user.photoURL    || '',
          }));
        }
      } catch (e) { console.error('[CVBuilder] load:', e); }
    });
    return () => unsub();
  }, []);

  // Auto-guardar borrador
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        localStorage.setItem('ag_cv_draft', JSON.stringify(form));
        setGuardado(true);
        setTimeout(() => setGuardado(false), 2000);
      } catch { /* noop */ }
    }, 1000);
    return () => clearTimeout(t);
  }, [form]);

  const set = useCallback((field: keyof FormCV, value: unknown) => {
    setForm(prev => ({ ...prev, [field]: value }));
  }, []);

  const saltarSeccion = (id: SeccionId) => {
    setSeccionesSaltadas(prev => [...prev, id]);
    if (id === 'idiomas')        set('idiomas', []);
    if (id === 'certificaciones') set('certificaciones', []);
    if (id === 'proyectos')      set('proyectos', []);
    if (id === 'referencias')    set('referencias', []);
    if (id === 'voluntariado')   set('voluntariado', '');
  };

  const mostrarSeccion = (id: SeccionId) => {
    setSeccionesSaltadas(prev => prev.filter(s => s !== id));
  };

  const saltada = (id: SeccionId) => seccionesSaltadas.includes(id);

  // Foto
  const handleFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => set('fotoUrl', ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  // Experiencias
  const addExp = () => set('experiencias', [...form.experiencias, { id: uid(), cargo: '', empresa: '', desde: '', hasta: '', descripcion: '' }]);
  const removeExp = (id: string) => set('experiencias', form.experiencias.filter(e => e.id !== id));
  const updateExp = (id: string, field: keyof Experiencia, val: string) =>
    set('experiencias', form.experiencias.map(e => e.id === id ? { ...e, [field]: val } : e));

  // Educaciones
  const addEdu = () => set('educaciones', [...form.educaciones, { id: uid(), titulo: '', institucion: '', desde: '', hasta: '' }]);
  const removeEdu = (id: string) => set('educaciones', form.educaciones.filter(e => e.id !== id));
  const updateEdu = (id: string, field: keyof Educacion, val: string) =>
    set('educaciones', form.educaciones.map(e => e.id === id ? { ...e, [field]: val } : e));

  // Idiomas
  const addIdioma = () => set('idiomas', [...form.idiomas, { id: uid(), idioma: '', nivel: 'Intermedio' }]);
  const removeIdioma = (id: string) => set('idiomas', form.idiomas.filter(i => i.id !== id));
  const updateIdioma = (id: string, field: keyof Idioma, val: string) =>
    set('idiomas', form.idiomas.map(i => i.id === id ? { ...i, [field]: val } : i));

  // Certificaciones
  const addCert = () => set('certificaciones', [...form.certificaciones, { id: uid(), nombre: '', institucion: '', anio: '' }]);
  const removeCert = (id: string) => set('certificaciones', form.certificaciones.filter(c => c.id !== id));
  const updateCert = (id: string, field: keyof Certificacion, val: string) =>
    set('certificaciones', form.certificaciones.map(c => c.id === id ? { ...c, [field]: val } : c));

  // Proyectos
  const addProyecto = () => set('proyectos', [...form.proyectos, { id: uid(), nombre: '', descripcion: '', url: '' }]);
  const removeProyecto = (id: string) => set('proyectos', form.proyectos.filter(p => p.id !== id));
  const updateProyecto = (id: string, field: keyof Proyecto, val: string) =>
    set('proyectos', form.proyectos.map(p => p.id === id ? { ...p, [field]: val } : p));

  // Referencias
  const addRef = () => set('referencias', [...form.referencias, { id: uid(), nombre: '', cargo: '', empresa: '', telefono: '' }]);
  const removeRef = (id: string) => set('referencias', form.referencias.filter(r => r.id !== id));
  const updateRef = (id: string, field: keyof Referencia, val: string) =>
    set('referencias', form.referencias.map(r => r.id === id ? { ...r, [field]: val } : r));

  // Descargar PDF
  const handleDescargar = async () => {
    if (!cvRef.current) return;
    if (!form.name.trim()) { setError('Completá al menos tu nombre.'); return; }
    setDescargando(true); setError('');
    try {
      const canvas = await html2canvas(cvRef.current, { scale: 2, useCORS: true, backgroundColor: '#ffffff', logging: false });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const w = pdf.internal.pageSize.getWidth();
      const h = (canvas.height * w) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, w, h);
      pdf.save(`CV_${form.name.trim().replace(/\s+/g, '_')}.pdf`);
    } catch (e) {
      console.error('[CVBuilder]', e);
      setError('No se pudo generar el PDF. Intentá de nuevo.');
    } finally { setDescargando(false); }
  };

  const progreso = calcProgreso(form);
  const skillsList = form.skills.split(',').map(s => s.trim()).filter(Boolean);

  const inputCls = "w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 dark:text-white rounded-2xl px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-colors";
  const textareaCls = inputCls + " resize-none";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-24">

      {/* Header */}
      <header className="sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-5 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-[--sc-700] dark:text-white tracking-tighter">Generador de CV</h1>
            <p className="text-gray-400 text-xs">Completá los datos y descargá tu CV en PDF</p>
          </div>
          {guardado && (
            <div className="flex items-center gap-1 text-green-500 text-xs font-bold">
              <CheckCircleIcon className="w-4 h-4" /> Borrador guardado
            </div>
          )}
        </div>

        {/* Barra de progreso */}
        <div className="mt-3">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Completado</span><span>{progreso}%</span>
          </div>
          <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-[--sc-500] rounded-full transition-all duration-500"
              style={{ width: `${progreso}%` }}
            />
          </div>
        </div>
      </header>

      <AlertasATS form={form} />

      <div className="px-4 pt-5 space-y-6">

        {/* Foto */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-5">
          <FieldLabel label="Foto de perfil" campo="name" />
          <div className="flex items-center gap-4 mt-2">
            <div className="w-20 h-20 rounded-full border-2 border-gray-200 dark:border-gray-700 overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
              {form.fotoUrl
                ? <img src={form.fotoUrl} alt="foto" className="w-full h-full object-cover" />
                : <PhotoIcon className="w-8 h-8 text-gray-300" />
              }
            </div>
            <div className="space-y-2">
              <button type="button" onClick={() => fotoRef.current?.click()}
                className="text-sm font-bold text-[--sc-600] border border-[--sc-200] rounded-2xl px-4 py-2 active:scale-95 transition-transform">
                {form.fotoUrl ? 'Cambiar foto' : 'Subir foto'}
              </button>
              {form.fotoUrl && (
                <button type="button" onClick={() => set('fotoUrl', '')}
                  className="block text-xs text-red-400 underline">
                  Quitar foto
                </button>
              )}
              <p className="text-xs text-gray-400">JPG o PNG. Opcional pero recomendada.</p>
            </div>
          </div>
          <input ref={fotoRef} type="file" accept="image/*" onChange={handleFoto} className="hidden" />
        </div>

        {/* Datos personales */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-5 space-y-4">
          <h2 className="font-black text-gray-800 dark:text-white text-sm">Datos personales</h2>
          {[
            { name: 'name' as const, label: 'Nombre completo', placeholder: 'Ej: Juan Pérez', type: 'text' },
            { name: 'email' as const, label: 'Email', placeholder: 'Ej: juan.perez@gmail.com', type: 'email' },
            { name: 'phone' as const, label: 'Teléfono', placeholder: 'Ej: +54 11 1234-5678', type: 'tel' },
            { name: 'ciudad' as const, label: 'Ciudad', placeholder: 'Ej: Buenos Aires', type: 'text' },
            { name: 'linkedin' as const, label: 'LinkedIn (opcional)', placeholder: 'linkedin.com/in/tu-perfil', type: 'url' },
            { name: 'portfolio' as const, label: 'Portfolio / GitHub (opcional)', placeholder: 'github.com/tu-usuario', type: 'url' },
          ].map(f => (
            <div key={f.name}>
              <FieldLabel label={f.label} campo={f.name} />
              <input type={f.type} placeholder={f.placeholder} value={form[f.name] as string}
                onChange={e => set(f.name, e.target.value)} className={inputCls} />
            </div>
          ))}
        </div>

        {/* Resumen */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-5">
          <FieldLabel label="Resumen profesional" campo="summary" />
          <textarea placeholder="Ej: Vendedor con 3 años de experiencia en retail. Especializado en atención al cliente y cumplimiento de objetivos de ventas. Busco crecer en una empresa con proyección." value={form.summary}
            onChange={e => set('summary', e.target.value)} rows={4} className={textareaCls} />
          <p className="text-xs text-gray-400 mt-1">{form.summary.length}/500 caracteres</p>
        </div>

        {/* Habilidades */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-5">
          <FieldLabel label="Habilidades" campo="skills" />
          <textarea placeholder="Ej: Excel, Atención al cliente, Trabajo en equipo, Manejo de caja, Redes sociales" value={form.skills}
            onChange={e => set('skills', e.target.value)} rows={3} className={textareaCls} />
          <p className="text-xs text-gray-400 mt-1">Separalas por coma</p>
        </div>

        {/* Experiencia */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <h2 className="font-black text-gray-800 dark:text-white text-sm">Experiencia laboral</h2>
              <Tooltip campo="experiencias" />
            </div>
          </div>
          {form.experiencias.map((exp, i) => (
            <div key={exp.id} className="border border-gray-100 dark:border-gray-700 rounded-2xl p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-gray-400">Trabajo {i + 1}</span>
                {form.experiencias.length > 1 && (
                  <button type="button" onClick={() => removeExp(exp.id)}><TrashIcon className="w-4 h-4 text-red-400" /></button>
                )}
              </div>
              <input placeholder="Cargo / Puesto" value={exp.cargo} onChange={e => updateExp(exp.id, 'cargo', e.target.value)} className={inputCls} />
              <input placeholder="Empresa" value={exp.empresa} onChange={e => updateExp(exp.id, 'empresa', e.target.value)} className={inputCls} />
              <div className="grid grid-cols-2 gap-2">
                <input placeholder="Desde (ej: 2022)" value={exp.desde} onChange={e => updateExp(exp.id, 'desde', e.target.value)} className={inputCls} />
                <input placeholder="Hasta (ej: 2024 o Actual)" value={exp.hasta} onChange={e => updateExp(exp.id, 'hasta', e.target.value)} className={inputCls} />
              </div>
              <textarea placeholder="Describí brevemente tus tareas y logros. Ej: Atención al público, manejo de caja, cumplimiento de metas mensuales." value={exp.descripcion}
                onChange={e => updateExp(exp.id, 'descripcion', e.target.value)} rows={3} className={textareaCls} />
            </div>
          ))}
          <button type="button" onClick={addExp}
            className="flex items-center gap-2 text-sm font-bold text-[--sc-600] border border-dashed border-[--sc-300] rounded-2xl px-4 py-3 w-full justify-center active:scale-95 transition-transform">
            <PlusIcon className="w-4 h-4" /> Agregar otro trabajo
          </button>
        </div>

        {/* Educación */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-5 space-y-4">
          <div className="flex items-center">
            <h2 className="font-black text-gray-800 dark:text-white text-sm">Educación</h2>
            <Tooltip campo="educaciones" />
          </div>
          {form.educaciones.map((edu, i) => (
            <div key={edu.id} className="border border-gray-100 dark:border-gray-700 rounded-2xl p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-gray-400">Estudio {i + 1}</span>
                {form.educaciones.length > 1 && (
                  <button type="button" onClick={() => removeEdu(edu.id)}><TrashIcon className="w-4 h-4 text-red-400" /></button>
                )}
              </div>
              <input placeholder="Título o carrera" value={edu.titulo} onChange={e => updateEdu(edu.id, 'titulo', e.target.value)} className={inputCls} />
              <input placeholder="Institución" value={edu.institucion} onChange={e => updateEdu(edu.id, 'institucion', e.target.value)} className={inputCls} />
              <div className="grid grid-cols-2 gap-2">
                <input placeholder="Desde" value={edu.desde} onChange={e => updateEdu(edu.id, 'desde', e.target.value)} className={inputCls} />
                <input placeholder="Hasta / En curso" value={edu.hasta} onChange={e => updateEdu(edu.id, 'hasta', e.target.value)} className={inputCls} />
              </div>
            </div>
          ))}
          <button type="button" onClick={addEdu}
            className="flex items-center gap-2 text-sm font-bold text-[--sc-600] border border-dashed border-[--sc-300] rounded-2xl px-4 py-3 w-full justify-center active:scale-95 transition-transform">
            <PlusIcon className="w-4 h-4" /> Agregar otra educación
          </button>
        </div>

        {/* Idiomas */}
        {saltada('idiomas') ? (
          <button type="button" onClick={() => mostrarSeccion('idiomas')}
            className="text-xs text-[--sc-600] underline px-4">
            + Agregar idiomas
          </button>
        ) : (
          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <h2 className="font-black text-gray-800 dark:text-white text-sm">Idiomas</h2>
                <Tooltip campo="idiomas" />
              </div>
              <SkipButton onSkip={() => saltarSeccion('idiomas')} />
            </div>
            {form.idiomas.map(id => (
              <div key={id.id} className="flex gap-2 items-center">
                <input placeholder="Idioma (Ej: Inglés)" value={id.idioma} onChange={e => updateIdioma(id.id, 'idioma', e.target.value)} className={inputCls} />
                <select value={id.nivel} onChange={e => updateIdioma(id.id, 'nivel', e.target.value)}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 dark:text-white rounded-2xl px-3 py-3 text-sm outline-none">
                  {['Básico', 'Intermedio', 'Avanzado', 'Nativo'].map(n => <option key={n}>{n}</option>)}
                </select>
                <button type="button" onClick={() => removeIdioma(id.id)}><TrashIcon className="w-4 h-4 text-red-400 shrink-0" /></button>
              </div>
            ))}
            <button type="button" onClick={addIdioma}
              className="flex items-center gap-2 text-sm font-bold text-[--sc-600] border border-dashed border-[--sc-300] rounded-2xl px-4 py-3 w-full justify-center">
              <PlusIcon className="w-4 h-4" /> Agregar idioma
            </button>
          </div>
        )}

        {/* Certificaciones */}
        {saltada('certificaciones') ? (
          <button type="button" onClick={() => mostrarSeccion('certificaciones')}
            className="text-xs text-[--sc-600] underline px-4">+ Agregar certificaciones</button>
        ) : (
          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <h2 className="font-black text-gray-800 dark:text-white text-sm">Certificaciones y cursos</h2>
                <Tooltip campo="certificaciones" />
              </div>
              <SkipButton onSkip={() => saltarSeccion('certificaciones')} />
            </div>
            {form.certificaciones.map(c => (
              <div key={c.id} className="border border-gray-100 dark:border-gray-700 rounded-2xl p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-xs text-gray-400 font-bold">Certificación</span>
                  <button type="button" onClick={() => removeCert(c.id)}><TrashIcon className="w-4 h-4 text-red-400" /></button>
                </div>
                <input placeholder="Nombre del curso/certificación" value={c.nombre} onChange={e => updateCert(c.id, 'nombre', e.target.value)} className={inputCls} />
                <div className="grid grid-cols-2 gap-2">
                  <input placeholder="Institución" value={c.institucion} onChange={e => updateCert(c.id, 'institucion', e.target.value)} className={inputCls} />
                  <input placeholder="Año" value={c.anio} onChange={e => updateCert(c.id, 'anio', e.target.value)} className={inputCls} />
                </div>
              </div>
            ))}
            <button type="button" onClick={addCert}
              className="flex items-center gap-2 text-sm font-bold text-[--sc-600] border border-dashed border-[--sc-300] rounded-2xl px-4 py-3 w-full justify-center">
              <PlusIcon className="w-4 h-4" /> Agregar certificación
            </button>
          </div>
        )}

        {/* Proyectos */}
        {saltada('proyectos') ? (
          <button type="button" onClick={() => mostrarSeccion('proyectos')}
            className="text-xs text-[--sc-600] underline px-4">+ Agregar proyectos</button>
        ) : (
          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <h2 className="font-black text-gray-800 dark:text-white text-sm">Proyectos</h2>
                <Tooltip campo="proyectos" />
              </div>
              <SkipButton onSkip={() => saltarSeccion('proyectos')} />
            </div>
            {form.proyectos.map(p => (
              <div key={p.id} className="border border-gray-100 dark:border-gray-700 rounded-2xl p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-xs text-gray-400 font-bold">Proyecto</span>
                  <button type="button" onClick={() => removeProyecto(p.id)}><TrashIcon className="w-4 h-4 text-red-400" /></button>
                </div>
                <input placeholder="Nombre del proyecto" value={p.nombre} onChange={e => updateProyecto(p.id, 'nombre', e.target.value)} className={inputCls} />
                <textarea placeholder="Descripción breve — qué hiciste y qué tecnologías usaste" value={p.descripcion}
                  onChange={e => updateProyecto(p.id, 'descripcion', e.target.value)} rows={2} className={textareaCls} />
                <input placeholder="URL (opcional)" value={p.url} onChange={e => updateProyecto(p.id, 'url', e.target.value)} className={inputCls} />
              </div>
            ))}
            <button type="button" onClick={addProyecto}
              className="flex items-center gap-2 text-sm font-bold text-[--sc-600] border border-dashed border-[--sc-300] rounded-2xl px-4 py-3 w-full justify-center">
              <PlusIcon className="w-4 h-4" /> Agregar proyecto
            </button>
          </div>
        )}

        {/* Voluntariado */}
        {saltada('voluntariado') ? (
          <button type="button" onClick={() => mostrarSeccion('voluntariado')}
            className="text-xs text-[--sc-600] underline px-4">+ Agregar voluntariado</button>
        ) : (
          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <h2 className="font-black text-gray-800 dark:text-white text-sm">Voluntariado</h2>
                <Tooltip campo="voluntariado" />
              </div>
              <SkipButton onSkip={() => saltarSeccion('voluntariado')} />
            </div>
            <textarea placeholder="Ej: 2023 — Voluntario en Cruz Roja Argentina. Apoyo en campañas de donación de sangre." value={form.voluntariado}
              onChange={e => set('voluntariado', e.target.value)} rows={3} className={textareaCls} />
          </div>
        )}

        {/* Referencias */}
        {saltada('referencias') ? (
          <button type="button" onClick={() => mostrarSeccion('referencias')}
            className="text-xs text-[--sc-600] underline px-4">+ Agregar referencias</button>
        ) : (
          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <h2 className="font-black text-gray-800 dark:text-white text-sm">Referencias</h2>
                <Tooltip campo="referencias" />
              </div>
              <SkipButton onSkip={() => saltarSeccion('referencias')} />
            </div>
            {form.referencias.map(r => (
              <div key={r.id} className="border border-gray-100 dark:border-gray-700 rounded-2xl p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-xs text-gray-400 font-bold">Referencia</span>
                  <button type="button" onClick={() => removeRef(r.id)}><TrashIcon className="w-4 h-4 text-red-400" /></button>
                </div>
                <input placeholder="Nombre completo" value={r.nombre} onChange={e => updateRef(r.id, 'nombre', e.target.value)} className={inputCls} />
                <div className="grid grid-cols-2 gap-2">
                  <input placeholder="Cargo" value={r.cargo} onChange={e => updateRef(r.id, 'cargo', e.target.value)} className={inputCls} />
                  <input placeholder="Empresa" value={r.empresa} onChange={e => updateRef(r.id, 'empresa', e.target.value)} className={inputCls} />
                </div>
                <input placeholder="Teléfono o email de contacto" value={r.telefono} onChange={e => updateRef(r.id, 'telefono', e.target.value)} className={inputCls} />
              </div>
            ))}
            <button type="button" onClick={addRef}
              className="flex items-center gap-2 text-sm font-bold text-[--sc-600] border border-dashed border-[--sc-300] rounded-2xl px-4 py-3 w-full justify-center">
              <PlusIcon className="w-4 h-4" /> Agregar referencia
            </button>
          </div>
        )}

        {/* Selector plantilla */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-5">
          <p className="text-sm font-bold text-gray-700 dark:text-white mb-3">Elegí tu diseño:</p>
          <div className="grid grid-cols-2 gap-3">
            {PLANTILLAS.map(p => (
              <button key={p.id} type="button" onClick={() => setTemplate(p.id)}
                className={`py-3 rounded-2xl text-sm font-bold transition-all active:scale-95 border-2 ${
                  template === p.id
                    ? 'border-[--sc-500] bg-[--sc-100] text-[--sc-700]'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-300'
                }`}>
                {p.nombre}
              </button>
            ))}
          </div>
        </div>

        {/* Vista previa */}
        <div>
          <p className="text-sm font-bold text-gray-700 dark:text-white mb-3 px-0">Vista previa:</p>
          <div ref={cvRef} className="bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm">

            {/* Plantilla 1: Clásico */}
            {template === '1' && (
              <div>
                <div className="bg-blue-700 px-6 py-5 text-white flex items-center gap-4">
                  {form.fotoUrl && <img src={form.fotoUrl} alt="foto" className="w-16 h-16 rounded-full object-cover border-2 border-white/30 shrink-0" />}
                  <div>
                    <h2 className="text-xl font-black">{form.name || 'Tu Nombre'}</h2>
                    <p className="text-blue-200 text-xs mt-0.5">{[form.email, form.phone, form.ciudad].filter(Boolean).join(' · ')}</p>
                    {(form.linkedin || form.portfolio) && (
                      <p className="text-blue-200 text-xs">{[form.linkedin, form.portfolio].filter(Boolean).join(' · ')}</p>
                    )}
                  </div>
                </div>
                <div className="p-5 space-y-4">
                  {form.summary && <p className="text-gray-600 text-sm leading-relaxed">{form.summary}</p>}
                  {skillsList.length > 0 && (
                    <div>
                      <p className="text-xs font-black text-blue-700 uppercase tracking-widest mb-2">Habilidades</p>
                      <div className="flex flex-wrap gap-1.5">
                        {skillsList.map((s, i) => <span key={i} className="bg-blue-50 text-blue-700 text-xs px-3 py-1 rounded-full font-medium">{s}</span>)}
                      </div>
                    </div>
                  )}
                  {form.idiomas.length > 0 && (
                    <div>
                      <p className="text-xs font-black text-blue-700 uppercase tracking-widest mb-2">Idiomas</p>
                      <p className="text-sm text-gray-700">{form.idiomas.map(i => `${i.idioma} (${i.nivel})`).join(' · ')}</p>
                    </div>
                  )}
                  {form.experiencias.some(e => e.cargo) && (
                    <div>
                      <p className="text-xs font-black text-blue-700 uppercase tracking-widest mb-2">Experiencia</p>
                      {form.experiencias.filter(e => e.cargo).map(e => (
                        <div key={e.id} className="mb-2 pl-3 border-l-2 border-blue-200">
                          <p className="text-sm font-bold text-gray-800">{e.cargo} {e.empresa && `— ${e.empresa}`}</p>
                          {(e.desde || e.hasta) && <p className="text-xs text-gray-400">{[e.desde, e.hasta].filter(Boolean).join(' - ')}</p>}
                          {e.descripcion && <p className="text-xs text-gray-600 mt-0.5">{e.descripcion}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                  {form.educaciones.some(e => e.titulo) && (
                    <div>
                      <p className="text-xs font-black text-blue-700 uppercase tracking-widest mb-2">Educación</p>
                      {form.educaciones.filter(e => e.titulo).map(e => (
                        <div key={e.id} className="mb-1">
                          <p className="text-sm font-bold text-gray-800">{e.titulo}</p>
                          {e.institucion && <p className="text-xs text-gray-500">{e.institucion} {e.desde && `(${[e.desde, e.hasta].filter(Boolean).join('-')})`}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                  {form.certificaciones.some(c => c.nombre) && (
                    <div>
                      <p className="text-xs font-black text-blue-700 uppercase tracking-widest mb-2">Certificaciones</p>
                      {form.certificaciones.filter(c => c.nombre).map(c => (
                        <p key={c.id} className="text-xs text-gray-700">• {c.nombre} {c.institucion && `— ${c.institucion}`} {c.anio && `(${c.anio})`}</p>
                      ))}
                    </div>
                  )}
                  {form.proyectos.some(p => p.nombre) && (
                    <div>
                      <p className="text-xs font-black text-blue-700 uppercase tracking-widest mb-2">Proyectos</p>
                      {form.proyectos.filter(p => p.nombre).map(p => (
                        <div key={p.id} className="mb-1">
                          <p className="text-xs font-bold text-gray-800">{p.nombre}</p>
                          {p.descripcion && <p className="text-xs text-gray-600">{p.descripcion}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                  {form.voluntariado && (
                    <div>
                      <p className="text-xs font-black text-blue-700 uppercase tracking-widest mb-2">Voluntariado</p>
                      <p className="text-xs text-gray-700">{form.voluntariado}</p>
                    </div>
                  )}
                  {form.referencias.some(r => r.nombre) && (
                    <div>
                      <p className="text-xs font-black text-blue-700 uppercase tracking-widest mb-2">Referencias</p>
                      {form.referencias.filter(r => r.nombre).map(r => (
                        <p key={r.id} className="text-xs text-gray-700">• {r.nombre} {r.cargo && `— ${r.cargo}`} {r.empresa && `(${r.empresa})`} {r.telefono && `· ${r.telefono}`}</p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Plantilla 2: Moderno */}
            {template === '2' && (
              <div className="flex">
                <div className="w-2/5 bg-purple-700 p-4 text-white">
                  {form.fotoUrl
                    ? <img src={form.fotoUrl} alt="foto" className="w-16 h-16 rounded-full object-cover border-2 border-white/30 mb-3" />
                    : <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mb-3"><span className="text-2xl font-black">{(form.name || 'T')[0].toUpperCase()}</span></div>
                  }
                  <h2 className="font-black text-base leading-tight">{form.name || 'Tu Nombre'}</h2>
                  {[form.email, form.phone, form.ciudad, form.linkedin].filter(Boolean).map((v, i) => <p key={i} className="text-purple-200 text-[10px] break-all">{v}</p>)}
                  {skillsList.length > 0 && (
                    <div className="mt-3">
                      <p className="text-[9px] font-black uppercase tracking-widest text-purple-300 mb-1">Skills</p>
                      {skillsList.map((s, i) => <p key={i} className="text-[11px] py-0.5 border-b border-purple-600">{s}</p>)}
                    </div>
                  )}
                  {form.idiomas.length > 0 && (
                    <div className="mt-3">
                      <p className="text-[9px] font-black uppercase tracking-widest text-purple-300 mb-1">Idiomas</p>
                      {form.idiomas.map(i => <p key={i.id} className="text-[11px]">{i.idioma} — {i.nivel}</p>)}
                    </div>
                  )}
                </div>
                <div className="w-3/5 p-4 space-y-3">
                  {form.summary && <p className="text-gray-600 text-xs leading-relaxed">{form.summary}</p>}
                  {form.experiencias.some(e => e.cargo) && (
                    <div>
                      <p className="text-[9px] font-black text-purple-700 uppercase tracking-widest mb-1">Experiencia</p>
                      {form.experiencias.filter(e => e.cargo).map(e => (
                        <div key={e.id} className="mb-2">
                          <p className="text-xs font-bold text-gray-800">{e.cargo}</p>
                          <p className="text-[10px] text-gray-500">{e.empresa} {e.desde && `· ${[e.desde, e.hasta].filter(Boolean).join('-')}`}</p>
                          {e.descripcion && <p className="text-[10px] text-gray-600">{e.descripcion}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                  {form.educaciones.some(e => e.titulo) && (
                    <div>
                      <p className="text-[9px] font-black text-purple-700 uppercase tracking-widest mb-1">Educación</p>
                      {form.educaciones.filter(e => e.titulo).map(e => (
                        <div key={e.id}>
                          <p className="text-xs font-bold text-gray-800">{e.titulo}</p>
                          <p className="text-[10px] text-gray-500">{e.institucion}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  {form.certificaciones.some(c => c.nombre) && (
                    <div>
                      <p className="text-[9px] font-black text-purple-700 uppercase tracking-widest mb-1">Certificaciones</p>
                      {form.certificaciones.filter(c => c.nombre).map(c => <p key={c.id} className="text-[10px] text-gray-700">• {c.nombre} {c.anio && `(${c.anio})`}</p>)}
                    </div>
                  )}
                  {form.voluntariado && (
                    <div>
                      <p className="text-[9px] font-black text-purple-700 uppercase tracking-widest mb-1">Voluntariado</p>
                      <p className="text-[10px] text-gray-700">{form.voluntariado}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Plantilla 3: Minimalista */}
            {template === '3' && (
              <div className="p-6 font-serif">
                <div className="flex items-center gap-4 border-b-2 border-gray-800 pb-3 mb-4">
                  {form.fotoUrl && <img src={form.fotoUrl} alt="foto" className="w-14 h-14 rounded-full object-cover shrink-0" />}
                  <div>
                    <h2 className="text-xl font-black text-gray-900">{form.name || 'Tu Nombre'}</h2>
                    <p className="text-gray-500 text-xs">{[form.email, form.phone, form.ciudad].filter(Boolean).join(' · ')}</p>
                  </div>
                </div>
                {form.summary && <p className="text-gray-700 text-sm mb-4 italic">{form.summary}</p>}
                {skillsList.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-black uppercase tracking-widest text-gray-500 mb-1">Habilidades</p>
                    <p className="text-sm text-gray-700">{skillsList.join(' · ')}</p>
                  </div>
                )}
                {form.idiomas.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-black uppercase tracking-widest text-gray-500 mb-1">Idiomas</p>
                    <p className="text-sm text-gray-700">{form.idiomas.map(i => `${i.idioma} (${i.nivel})`).join(' · ')}</p>
                  </div>
                )}
                {form.experiencias.some(e => e.cargo) && (
                  <div className="mb-3">
                    <p className="text-xs font-black uppercase tracking-widest text-gray-500 mb-1">Experiencia</p>
                    {form.experiencias.filter(e => e.cargo).map(e => (
                      <div key={e.id} className="mb-2">
                        <p className="text-sm font-bold text-gray-900">— {e.cargo} {e.empresa && `en ${e.empresa}`}</p>
                        {(e.desde || e.hasta) && <p className="text-xs text-gray-400">{[e.desde, e.hasta].filter(Boolean).join(' - ')}</p>}
                        {e.descripcion && <p className="text-xs text-gray-600">{e.descripcion}</p>}
                      </div>
                    ))}
                  </div>
                )}
                {form.educaciones.some(e => e.titulo) && (
                  <div className="mb-3">
                    <p className="text-xs font-black uppercase tracking-widest text-gray-500 mb-1">Educación</p>
                    {form.educaciones.filter(e => e.titulo).map(e => (
                      <p key={e.id} className="text-sm text-gray-700">— {e.titulo} {e.institucion && `(${e.institucion})`}</p>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Plantilla 4: ATS Pro */}
            {template === '4' && (
              <div className="p-5 font-mono text-xs">
                <div className="flex items-start gap-3 mb-3">
                  {form.fotoUrl && <img src={form.fotoUrl} alt="foto" className="w-12 h-12 rounded object-cover shrink-0" />}
                  <div>
                    <h2 className="text-base font-black text-gray-900 uppercase">{form.name || 'TU NOMBRE'}</h2>
                    <p className="text-gray-600">{[form.email, form.phone, form.ciudad].filter(Boolean).join(' | ')}</p>
                    {(form.linkedin || form.portfolio) && <p className="text-gray-500">{[form.linkedin, form.portfolio].filter(Boolean).join(' | ')}</p>}
                  </div>
                </div>
                {form.summary && (
                  <div className="mb-3">
                    <p className="font-black uppercase text-gray-800 border-b border-gray-300 mb-1">PERFIL</p>
                    <p className="text-gray-700">{form.summary}</p>
                  </div>
                )}
                {skillsList.length > 0 && (
                  <div className="mb-3">
                    <p className="font-black uppercase text-gray-800 border-b border-gray-300 mb-1">HABILIDADES</p>
                    <p className="text-gray-700">{skillsList.join(' | ')}</p>
                  </div>
                )}
                {form.idiomas.length > 0 && (
                  <div className="mb-3">
                    <p className="font-black uppercase text-gray-800 border-b border-gray-300 mb-1">IDIOMAS</p>
                    <p className="text-gray-700">{form.idiomas.map(i => `${i.idioma}: ${i.nivel}`).join(' | ')}</p>
                  </div>
                )}
                {form.experiencias.some(e => e.cargo) && (
                  <div className="mb-3">
                    <p className="font-black uppercase text-gray-800 border-b border-gray-300 mb-1">EXPERIENCIA</p>
                    {form.experiencias.filter(e => e.cargo).map(e => (
                      <div key={e.id} className="mb-2">
                        <p className="font-bold text-gray-900">{e.cargo.toUpperCase()} {e.empresa && `— ${e.empresa}`}</p>
                        {(e.desde || e.hasta) && <p className="text-gray-500">{[e.desde, e.hasta].filter(Boolean).join(' - ')}</p>}
                        {e.descripcion && <p className="text-gray-700">• {e.descripcion}</p>}
                      </div>
                    ))}
                  </div>
                )}
                {form.educaciones.some(e => e.titulo) && (
                  <div className="mb-3">
                    <p className="font-black uppercase text-gray-800 border-b border-gray-300 mb-1">EDUCACIÓN</p>
                    {form.educaciones.filter(e => e.titulo).map(e => (
                      <p key={e.id} className="text-gray-700">• {e.titulo} {e.institucion && `— ${e.institucion}`} {e.desde && `(${[e.desde, e.hasta].filter(Boolean).join('-')})`}</p>
                    ))}
                  </div>
                )}
                {form.certificaciones.some(c => c.nombre) && (
                  <div className="mb-3">
                    <p className="font-black uppercase text-gray-800 border-b border-gray-300 mb-1">CERTIFICACIONES</p>
                    {form.certificaciones.filter(c => c.nombre).map(c => (
                      <p key={c.id} className="text-gray-700">• {c.nombre} {c.institucion && `— ${c.institucion}`} {c.anio && `(${c.anio})`}</p>
                    ))}
                  </div>
                )}
                {form.proyectos.some(p => p.nombre) && (
                  <div className="mb-3">
                    <p className="font-black uppercase text-gray-800 border-b border-gray-300 mb-1">PROYECTOS</p>
                    {form.proyectos.filter(p => p.nombre).map(p => (
                      <div key={p.id}>
                        <p className="font-bold text-gray-900">{p.nombre}</p>
                        {p.descripcion && <p className="text-gray-700">• {p.descripcion}</p>}
                      </div>
                    ))}
                  </div>
                )}
                {form.voluntariado && (
                  <div className="mb-3">
                    <p className="font-black uppercase text-gray-800 border-b border-gray-300 mb-1">VOLUNTARIADO</p>
                    <p className="text-gray-700">{form.voluntariado}</p>
                  </div>
                )}
                {form.referencias.some(r => r.nombre) && (
                  <div>
                    <p className="font-black uppercase text-gray-800 border-b border-gray-300 mb-1">REFERENCIAS</p>
                    {form.referencias.filter(r => r.nombre).map(r => (
                      <p key={r.id} className="text-gray-700">• {r.nombre} {r.cargo && `— ${r.cargo}`} {r.empresa && `(${r.empresa})`} {r.telefono && `· ${r.telefono}`}</p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 rounded-2xl text-red-600 text-sm" role="alert">
            <ExclamationCircleIcon className="w-5 h-5 shrink-0" />{error}
          </div>
        )}

        {/* Botones */}
        <div className="space-y-3">
          <button onClick={handleDescargar} disabled={descargando}
            className="w-full flex items-center justify-center gap-2 bg-green-600 text-white py-4 rounded-2xl font-black text-base shadow-lg active:scale-95 transition-transform disabled:opacity-60">
            <ArrowDownTrayIcon className="w-5 h-5" />
            {descargando ? 'Generando PDF...' : 'Descargar CV en PDF'}
          </button>
          <button type="button" onClick={() => { setForm(FORM_INICIAL); localStorage.removeItem('ag_cv_draft'); }}
            className="w-full py-3 rounded-2xl border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 text-sm font-bold active:scale-95 transition-transform">
            Limpiar y empezar de nuevo
          </button>
        </div>

      </div>

      <Navbar onMenuClick={() => setIsMenuOpen(true)} />
      <Menu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </div>
  );
      }
