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
      <h1 style={{ textAlign: "center", margin: "20px 0" }}>Crear CV PRO</h1>

      {/* FORMULARIO DE ENTRADA */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px", padding: "0 15px" }}>
        <input name="name" style={{ padding: "10px", borderRadius: "5px", border: "1px solid #ccc" }} placeholder="Nombre completo" onChange={handleChange} />
        <input name="email" style={{ padding: "10px", borderRadius: "5px", border: "1px solid #ccc" }} placeholder="Email" onChange={handleChange} />
        <input name="phone" style={{ padding: "10px", borderRadius: "5px", border: "1px solid #ccc" }} placeholder="Teléfono" onChange={handleChange} />

        <textarea name="summary" style={{ padding: "10px", borderRadius: "5px", border: "1px solid #ccc", height: "80px" }} placeholder="Resumen profesional (clave ATS)" onChange={handleChange} />

        <textarea name="skills" style={{ padding: "10px", borderRadius: "5px", border: "1px solid #ccc" }} placeholder="Skills (separadas por coma: React, Firebase, Excel)" onChange={handleChange} />

        <textarea name="experience" style={{ padding: "10px", borderRadius: "5px", border: "1px solid #ccc", height: "100px" }} placeholder="Experiencia (una por línea)" onChange={handleChange} />

        <textarea name="education" style={{ padding: "10px", borderRadius: "5px", border: "1px solid #ccc" }} placeholder="Educación" onChange={handleChange} />
      </div>

      {/* BOTONES DE SELECCIÓN DE PLANTILLA */}
      <h2 style={{ padding: "0 15px", marginTop: "30px" }}>Elegir diseño</h2>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", padding: "0 15px", marginBottom: "20px" }}>
        {["1", "2", "3", "4"].map((t) => (
          <button 
            key={t} 
            onClick={() => setTemplate(t)} 
            style={{ 
              flex: "1 0 40%", 
              padding: "10px", 
              backgroundColor: template === t ? "#0070f3" : "#eee", 
              color: template === t ? "white" : "black", 
              border: "none", 
              borderRadius: "5px",
              fontWeight: "bold"
            }}
          >
            Plantilla {t} {t === "4" ? "PRO" : ""}
          </button>
        ))}
      </div>

      {/* SECCIÓN DE VISTA PREVIA */}
      <h2 style={{ padding: "0 15px" }}>Vista previa</h2>
      <div style={{ padding: "0 15px", marginBottom: "50px" }}>

        {/* PLANTILLA 1: CLÁSICA */}
        {template === "1" && (
          <div style={{ border: "1px solid black", padding: "20px", backgroundColor: "white" }}>
            <h2 style={{ textTransform: "uppercase", marginBottom: "5px" }}>{form.name || "Tu Nombre"}</h2>
            <p style={{ borderBottom: "1px solid #000", paddingBottom: "10px" }}>{form.email} | {form.phone}</p>
            <h3>Resumen</h3>
            <p>{form.summary}</p>
            <h3>Skills</h3>
            <ul>
              {form.skills.split(",").map((s, i) => (
                <li key={i}>{s.trim()}</li>
              ))}
            </ul>
            <h3>Experiencia</h3>
            <ul>
              {form.experience.split("\n").map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
            <h3>Educación</h3>
            <p>{form.education}</p>
          </div>
        )}

        {/* PLANTILLA 2: MODERNA */}
        {template === "2" && (
          <div style={{ border: "2px solid #444", padding: "20px", backgroundColor: "#f9f9f9" }}>
            <h1 style={{ color: "#0070f3", marginBottom: "0" }}>{form.name || "Tu Nombre"}</h1>
            <p style={{ color: "gray" }}>{form.email} | {form.phone}</p>
            <hr />
            <strong>PERFIL PROFESIONAL</strong>
            <p>{form.summary}</p>
            <strong>HABILIDADES</strong>
            <ul style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
              {form.skills.split(",").map((s, i) => (
                <li key={i}>{s.trim()}</li>
              ))}
            </ul>
            <strong>EXPERIENCIA</strong>
            <ul>
              {form.experience.split("\n").map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          </div>
        )}

        {/* PLANTILLA 3: ATS FRIENDLY */}
        {template === "3" && (
          <div style={{ border: "1px dashed gray", padding: "20px", fontFamily: "serif" }}>
            <h2 style={{ textAlign: "center" }}>{form.name || "Tu Nombre"}</h2>
            <p style={{ textAlign: "center", fontSize: "0.9rem" }}>{form.email} | {form.phone}</p>
            <h4 style={{ borderBottom: "1px solid #ccc", marginTop: "20px" }}>PERFIL</h4>
            <p>{form.summary}</p>
            <h4 style={{ borderBottom: "1px solid #ccc" }}>SKILLS</h4>
            <ul>
              {form.skills.split(",").map((s, i) => (
                <li key={i}>{s.trim()}</li>
              ))}
            </ul>
            <h4 style={{ borderBottom: "1px solid #ccc" }}>EXPERIENCIA</h4>
            <ul>
              {form.experience.split("\n").map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          </div>
        )}

        {/* PLANTILLA 4: PRO VISUAL (DOS COLUMNAS) */}
        {template === "4" && (
          <div style={{ display: "flex", border: "1px solid black", minHeight: "400px", backgroundColor: "white" }}>
            {/* LADO IZQUIERDO (Gris) */}
            <div style={{ width: "35%", background: "#eee", padding: "15px", borderRight: "1px solid #ccc" }}>
              <h3 style={{ fontSize: "1.2rem", marginBottom: "5px" }}>{form.name || "Tu Nombre"}</h3>
              <p style={{ fontSize: "0.8rem", wordBreak: "break-all" }}>{form.email}</p>
              <p style={{ fontSize: "0.8rem" }}>{form.phone}</p>
              <h4 style={{ marginTop: "25px", borderBottom: "1px solid #999" }}>Skills</h4>
              <ul style={{ paddingLeft: "20px", fontSize: "0.9rem" }}>
                {form.skills.split(",").map((s, i) => (
                  <li key={i}>{s.trim()}</li>
                ))}
              </ul>
            </div>
            {/* LADO DERECHO (Blanco) */}
            <div style={{ width: "65%", padding: "15px" }}>
              <h3 style={{ borderBottom: "2px solid #eee" }}>Resumen</h3>
              <p style={{ fontSize: "0.9rem" }}>{form.summary}</p>
              <h3 style={{ borderBottom: "2px solid #eee", marginTop: "20px" }}>Experiencia</h3>
              <ul style={{ paddingLeft: "20px", fontSize: "0.9rem" }}>
                {form.experience.split("\n").map((e, i) => (
                  <li key={i} style={{ marginBottom: "5px" }}>{e}</li>
                ))}
              </ul>
              <h3 style={{ borderBottom: "2px solid #eee", marginTop: "20px" }}>Educación</h3>
              <p style={{ fontSize: "0.9rem" }}>{form.education}</p>
            </div>
          </div>
        )}

      </div>
    </>
  );
}
