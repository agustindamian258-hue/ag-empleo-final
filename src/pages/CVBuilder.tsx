import { useState, useRef } from 'react';
import Navbar from '../components/Navbar';
import Menu from '../components/Menu';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface FormCV {
  name: string;
  email: string;
  phone: string;
  ciudad: string;
  summary: string;
  skills: string;
  experience: string;
  education: string;
}

export default function CVBuilder() {
  const [form, setForm] = useState<FormCV>({
    name: '', email: '', phone: '', ciudad: '',
    summary: '', skills: '', experience: '', education: '',
  });
  const [template, setTemplate] = useState('1');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [descargando, setDescargando] = useState(false);
  const cvRef = useRef<HTMLDivElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleDescargar = async () => {
    if (!cvRef.current) return;
    setDescargando(true);
    try {
      const canvas = await html2canvas(cvRef.current, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`CV_${form.name || 'AG_Empleo'}.pdf`);
    } finally {
      setDescargando(false);
    }
  };

  const skillsList = form.skills.split(',').map(s => s.trim()).filter(Boolean);
  const expList = form.experience.split('\n').filter(Boolean);

  const plantillas = [
    { id: '1', nombre: 'Clásico', color: 'bg-blue-600' },
    { id: '2', nombre: 'Moderno', color: 'bg-purple-600' },
    { id: '3', nombre: 'Minimalista', color: 'bg-gray-700' },
    { id: '4', nombre: 'ATS Pro', color: 'bg-green-600' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <header className="sticky top-0 z-30 bg-white border-b border-gray-100 px-5 py-4 shadow-sm">
        <h1 className="text-2xl font-black text-blue-800 tracking-tighter">Generador de CV</h1>
        <p className="text-gray-400 text-xs">Completá los datos y descargá tu CV en PDF</p>
      </header>

      <div className="px-4 pt-5 space-y-3">
        {[
          { name: 'name', placeholder: 'Nombre completo' },
          { name: 'email', placeholder: 'Email' },
          { name: 'phone', placeholder: 'Teléfono' },
          { name: 'ciudad', placeholder: 'Ciudad' },
        ].map(f => (
          <input
            key={f.name}
            name={f.name}
            placeholder={f.placeholder}
            onChange={handleChange}
            className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3 text-sm outline-none focus:border-blue-400 transition-colors"
          />
        ))}
        {[
          { name: 'summary', placeholder: 'Resumen profesional (2-3 líneas)' },
          { name: 'skills', placeholder: 'Habilidades (separadas por coma)' },
          { name: 'experience', placeholder: 'Experiencia (una por línea)\nEj: 2022-2024 — Vendedor en Empresa X' },
          { name: 'education', placeholder: 'Educación\nEj: Bachiller — Colegio Nacional (2020)' },
        ].map(f => (
          <textarea
            key={f.name}
            name={f.name}
            placeholder={f.placeholder}
            onChange={handleChange}
            rows={3}
            className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3 text-sm outline-none focus:border-blue-400 transition-colors resize-none"
          />
        ))}
      </div>

      {/* SELECTOR DE PLANTILLA */}
      <div className="px-4 pt-6">
        <p className="text-sm font-bold text-gray-700 mb-3">Elegí tu diseño:</p>
        <div className="grid grid-cols-2 gap-3">
          {plantillas.map(p => (
            <button
              key={p.id}
              onClick={() => setTemplate(p.id)}
              className={`py-3 rounded-2xl text-sm font-bold transition-all active:scale-95 border-2 ${
                template === p.id
                  ? 'border-blue-600 bg-blue-50 text-blue-700'
                  : 'border-gray-200 bg-white text-gray-500'
              }`}
            >
              {p.nombre}
              {p.id === '4' && <span className="ml-1 text-xs text-green-600">✓ ATS</span>}
            </button>
          ))}
        </div>
      </div>

      {/* VISTA PREVIA */}
      <div className="px-4 pt-6">
        <p className="text-sm font-bold text-gray-700 mb-3">Vista previa:</p>

        <div ref={cvRef} className="bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm">

          {template === '1' && (
            <div>
              <div className="bg-blue-700 px-6 py-5 text-white">
                <h2 className="text-xl font-black">{form.name || 'Tu Nombre'}</h2>
                <p className="text-blue-200 text-xs mt-0.5">{form.email} {form.phone && `· ${form.phone}`} {form.ciudad && `· ${form.ciudad}`}</p>
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
                {expList.length > 0 && (
                  <div>
                    <p className="text-xs font-black text-blue-700 uppercase tracking-widest mb-2">Experiencia</p>
                    {expList.map((e, i) => <p key={i} className="text-sm text-gray-700 py-1 border-l-2 border-blue-200 pl-3 mb-1">{e}</p>)}
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

          {template === '2' && (
            <div className="flex">
              <div className="w-2/5 bg-purple-700 p-4 text-white min-h-64">
                <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mb-3">
                  <span className="text-2xl font-black">{(form.name || 'T')[0]}</span>
                </div>
                <h2 className="font-black text-base leading-tight">{form.name || 'Tu Nombre'}</h2>
                <p className="text-purple-200 text-[10px] mt-1 break-all">{form.email}</p>
                <p className="text-purple-200 text-[10px]">{form.phone}</p>
                <p className="text-purple-200 text-[10px]">{form.ciudad}</p>
                {skillsList.length > 0 && (
                  <div className="mt-4">
                    <p className="text-[9px] font-black uppercase tracking-widest text-purple-300 mb-2">Skills</p>
                    {skillsList.map((s, i) => <p key={i} className="text-[11px] py-0.5 border-b border-purple-600">{s}</p>)}
                  </div>
                )}
              </div>
              <div className="w-3/5 p-4 space-y-3">
                {form.summary && <p className="text-gray-600 text-xs leading-relaxed">{form.summary}</p>}
                {expList.length > 0 && (
                  <div>
                    <p className="text-[9px] font-black text-purple-700 uppercase tracking-widest mb-1">Experiencia</p>
                    {expList.map((e, i) => <p key={i} className="text-xs text-gray-700 mb-1">{e}</p>)}
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

          {template === '3' && (
            <div className="p-6 font-serif">
              <div className="border-b-2 border-gray-800 pb-3 mb-4">
                <h2 className="text-xl font-black text-gray-900">{form.name || 'Tu Nombre'}</h2>
                <p className="text-gray-500 text-xs mt-0.5">{[form.email, form.phone, form.ciudad].filter(Boolean).join(' · ')}</p>
              </div>
              {form.summary && <p className="text-gray-700 text-sm mb-4 italic">{form.summary}</p>}
              {skillsList.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Habilidades</p>
                  <p className="text-sm text-gray-700">{skillsList.join(' · ')}</p>
                </div>
              )}
              {expList.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Experiencia</p>
                  {expList.map((e, i) => <p key={i} className="text-sm text-gray-700 mb-1">— {e}</p>)}
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

          {template === '4' && (
            <div className="p-5 font-mono text-xs">
              <h2 className="text-base font-black text-gray-900 uppercase">{form.name || 'TU NOMBRE'}</h2>
              <p className="text-gray-600 mb-3">{[form.email, form.phone, form.ciudad].filter(Boolean).join(' | ')}</p>
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
                  {expList.map((e, i) => <p key={i} className="text-gray-700 mb-0.5">• {e}</p>)}
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

      {/* BOTÓN DESCARGAR */}
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
