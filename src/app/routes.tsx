import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "../pages/Home";
import Jobs from "../pages/Jobs";
import Companies from "../pages/Companies";
import CVBuilder from "../pages/CVBuilder";
import Feed from "../pages/Feed"; // Importamos el Feed real que armamos
import Login from "../pages/Login"; // Importamos el Login

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} /> {/* Ruta de Login agregada */}
        <Route path="/jobs" element={<Jobs />} />
        <Route path="/companies" element={<Companies />} />
        <Route path="/cv" element={<CVBuilder />} /> {/* Tu creador de CV con las 4 plantillas */}
        <Route path="/social" element={<Feed />} /> {/* Ruta para el muro de Likes y Comentarios */}
      </Routes>
    </BrowserRouter>
  );
}
