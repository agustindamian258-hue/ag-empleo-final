import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth } from "../app/firebase"; 
import { onAuthStateChanged, signOut } from "firebase/auth"; 

export default function Navbar() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  // Detector de estado de Firebase
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsub();
  }, []);

  // Función real para cerrar sesión
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login"); // Al cerrar sesión, lo mandamos al login
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  return (
    <nav style={{ 
      display: "flex", 
      gap: "15px", 
      padding: "10px 20px", 
      background: "#ffffff", 
      borderBottom: "2px solid #eee",
      alignItems: "center",
      fontFamily: "sans-serif"
    }}>
      {/* Secciones principales */}
      <Link to="/" style={linkStyle}>Inicio</Link>
      <Link to="/jobs" style={linkStyle}>Empleos</Link>
      <Link to="/companies" style={linkStyle}>Empresas</Link>
      <Link to="/cv" style={linkStyle}>Crear CV</Link>
      <Link to="/social" style={linkStyle}>Social</Link>

      <div style={{ marginLeft: "auto" }}>
        {user ? (
          <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
            {/* Link al Perfil con el nombre del usuario */}
            <Link to="/profile" style={{ 
              textDecoration: "none", 
              fontWeight: "bold", 
              color: "#333",
              display: "flex",
              alignItems: "center",
              gap: "5px"
            }}>
              👤 {user.displayName || "Mi Perfil"}
            </Link>

            {/* Botón de Cerrar Sesión Funcional */}
            <button 
              onClick={handleLogout}
              style={{
                padding: "6px 12px",
                background: "#ff4d4d",
                color: "white",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
                fontWeight: "bold"
              }}
            >
              Salir
            </button>
          </div>
        ) : (
          <Link to="/login" style={{ 
            padding: "8px 20px", 
            background: "#007bff", 
            color: "white", 
            borderRadius: "8px", 
            textDecoration: "none",
            fontWeight: "bold"
          }}>
            Ingresar
          </Link>
        )}
      </div>
    </nav>
  );
}

// Estilo simple para los links
const linkStyle = {
  textDecoration: "none",
  color: "#555",
  fontWeight: "500"
};
