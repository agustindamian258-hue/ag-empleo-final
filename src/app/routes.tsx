import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "../pages/Home";
import Jobs from "../pages/Jobs";
import Companies from "../pages/Companies";
import CVBuilder from "../pages/CVBuilder";
import Feed from "../pages/Feed";
import Login from "../pages/Login";
import Profile from "../pages/Profile";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Lógica de navegación principal */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        
        {/* AG Empleo: Portal de trabajo y CV */}
        <Route path="/jobs" element={<Jobs />} />
        <Route path="/companies" element={<Companies />} />
        <Route path="/cv" element={<CVBuilder />} />
        
        {/* AG Social: Muro interactivo y Perfil de usuario */}
        <Route path="/social" element={<Feed />} />
        <Route path="/profile" element={<Profile />} />

        {/* Redirección automática si el usuario entra a una ruta que no existe */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}
