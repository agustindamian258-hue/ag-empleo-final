import Navbar from "../components/Navbar";
import { Link } from "react-router-dom";

export default function Jobs() {
  return (
    <>
      <Navbar />
      <h1>Empleos</h1>

      <Link to="/companies">
        <button>Empresas</button>
      </Link>
    </>
  );
}
