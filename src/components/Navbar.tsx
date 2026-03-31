
import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav style={{ display: "flex", gap: "10px" }}>
      <Link to="/">Inicio</Link>
      <Link to="/jobs">Empleos</Link>
      <Link to="/companies">Empresas</Link>
      <Link to="/cv">Crear CV</Link>
    </nav>
  );
}
