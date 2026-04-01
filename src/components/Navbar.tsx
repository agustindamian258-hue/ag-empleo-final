import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav style={{ 
      display: "flex", 
      gap: "15px", 
      padding: "10px", 
      background: "#f8f9fa", 
      borderBottom: "1px solid #ddd",
      alignItems: "center"
    }}>
      <Link to="/" style={{ textDecoration: "none", color: "blue" }}>Inicio</Link>
      <Link to="/jobs" style={{ textDecoration: "none", color: "blue" }}>Empleos</Link>
      <Link to="/companies" style={{ textDecoration: "none", color: "blue" }}>Empresas</Link>
      <Link to="/cv" style={{ textDecoration: "none", color: "blue" }}>Crear CV</Link>
      
      {/* Agregamos el acceso al Feed Social que configuramos en Firebase */}
      <Link to="/social" style={{ textDecoration: "none", color: "blue" }}>Social</Link>

      {/* Agregamos el enlace de Login que pediste */}
      <Link to="/login" style={{ 
        marginLeft: "auto", 
        padding: "5px 15px", 
        background: "#007bff", 
        color: "white", 
        borderRadius: "5px", 
        textDecoration: "none" 
      }}>
        Login
      </Link>
    </nav>
  );
}
