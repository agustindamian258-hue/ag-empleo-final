import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
// Paso 4: Importamos auth y el detector de estado de Firebase
import { auth } from "../app/firebase"; 
import { onAuthStateChanged } from "firebase/auth"; 

export default function Navbar() {
  // Paso 4: Estado para guardar al usuario
  const [user, setUser] = useState<any>(null);

  // Paso 4: Efecto para detectar si el usuario inicia o cierra sesión
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsub();
  }, []);

  return (
    <nav style={{ 
      display: "flex", 
      gap: "15px", 
      padding: "10px", 
      background: "#f8f9fa", 
      borderBottom: "1px solid #ddd",
      alignItems: "center"
    }}>
      <Link to="/">Inicio</Link>
      <Link to="/jobs">Empleos</Link>
      <Link to="/companies">Empresas</Link>
      <Link to="/cv">Crear CV</Link>
      <Link to="/social">Social</Link>

      <div style={{ marginLeft: "auto" }}>
        {/* Paso 4: Mostrar nombre del usuario o botón de Login */}
        {user ? (
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontWeight: "bold", color: "#333" }}>
              👤 {user.displayName || "Usuario"}
            </span>
            {/* Opcional: Podés agregar un botón de cerrar sesión aquí más adelante */}
          </div>
        ) : (
          <Link to="/login" style={{ 
            padding: "5px 15px", 
            background: "#007bff", 
            color: "white", 
            borderRadius: "5px", 
            textDecoration: "none" 
          }}>
            Login
          </Link>
        )}
      </div>
    </nav>
  );
}
