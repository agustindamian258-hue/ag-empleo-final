import Navbar from "../components/Navbar";
import { useState } from "react";

export default function CVBuilder() {
  const [name, setName] = useState("");
  const [skill, setSkill] = useState("");

  return (
    <>
      <Navbar />
      <h1>Crear CV</h1>

      <input
        placeholder="Nombre"
        onChange={(e) => setName(e.target.value)}
      />

      <input
        placeholder="Habilidad"
        onChange={(e) => setSkill(e.target.value)}
      />

      <h2>Vista previa:</h2>
      <p>{name}</p>
      <p>{skill}</p>
    </>
  );
}
