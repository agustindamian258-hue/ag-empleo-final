import Navbar from "../components/Navbar";
import { useState } from "react";

export default function CVBuilder() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    summary: "",
    skills: "",
    experience: "",
    education: "",
  });

  const [template, setTemplate] = useState("1");

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  return (
    <>
      <Navbar />
      <h1>Crear CV PRO</h1>

      {/* FORM */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <input name="name" placeholder="Nombre completo" onChange={handleChange} />
        <input name="email" placeholder="Email" onChange={handleChange} />
        <input name="phone" placeholder="Teléfono" onChange={handleChange} />

        <textarea name="summary" placeholder="Resumen profesional (clave ATS)" onChange={handleChange} />

        <textarea name="skills" placeholder="Skills (separadas por coma)" onChange={handleChange} />

        <textarea name="experience" placeholder="Experiencia (Empresa - Puesto - Logros)" onChange={handleChange} />

        <textarea name="education" placeholder="Educación" onChange={handleChange} />
      </div>

      {/* PLANTILLAS */}
      <h2>Elegir plantilla</h2>
      <div>
        {["1", "2", "3"].map((t) => (
          <button key={t} onClick={() => setTemplate(t)}>
            Plantilla {t}
          </button>
        ))}
      </div>

      {/* VISTA PREVIA */}
      <h2>Vista previa</h2>

      {template === "1" && (
        <div style={{ border: "1px solid black", padding: "10px" }}>
          <h2>{form.name}</h2>
          <p>{form.email} | {form.phone}</p>

          <h3>Resumen</h3>
          <p>{form.summary}</p>

          <h3>Skills</h3>
          <p>{form.skills}</p>

          <h3>Experiencia</h3>
          <p>{form.experience}</p>

          <h3>Educación</h3>
          <p>{form.education}</p>
        </div>
      )}

      {template === "2" && (
        <div style={{ border: "2px solid gray", padding: "10px" }}>
          <h1>{form.name}</h1>
          <p>{form.email}</p>

          <strong>Resumen:</strong>
          <p>{form.summary}</p>

          <strong>Experiencia:</strong>
          <p>{form.experience}</p>

          <strong>Skills:</strong>
          <p>{form.skills}</p>
        </div>
      )}

      {template === "3" && (
        <div style={{ border: "1px dashed black", padding: "10px" }}>
          <h2>{form.name}</h2>
          <p>{form.phone}</p>

          <h3>Perfil</h3>
          <p>{form.summary}</p>

          <h3>Educación</h3>
          <p>{form.education}</p>

          <h3>Skills</h3>
          <p>{form.skills}</p>
        </div>
      )}
    </>
  );
}
