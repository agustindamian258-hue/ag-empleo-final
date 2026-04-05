import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from '../pages/Inicio';
import Jobs from '../pages/Empleos';
import Companies from '../pages/Empresas';
import CVBuilder from '../pages/CVBuilder';
import Feed from '../pages/Feed';
import Login from '../pages/IniciarSesion';
import Profile from '../pages/Perfil';
import MapPage from '../pages/PaginaDelMapa';

interface AppRoutesProps {
  user: any;
}

export default function AppRoutes({ user }: AppRoutesProps) {
  return (
    <BrowserRouter>
      <Routes>
        {/* Si no hay usuario, siempre va al login */}
        <Route
          path="/login"
          element={!user ? <Login /> : <Navigate to="/" />}
        />

        {/* Rutas protegidas: solo si hay usuario */}
        <Route path="/" element={user ? <Home /> : <Navigate to="/login" />} />
        <Route path="/jobs" element={user ? <Jobs /> : <Navigate to="/login" />} />
        <Route path="/companies" element={user ? <Companies /> : <Navigate to="/login" />} />
        <Route path="/cv" element={user ? <CVBuilder /> : <Navigate to="/login" />} />
        <Route path="/mapa" element={user ? <MapPage /> : <Navigate to="/login" />} />
        <Route path="/social" element={user ? <Feed /> : <Navigate to="/login" />} />
        <Route path="/profile" element={user ? <Profile /> : <Navigate to="/login" />} />

        {/* Cualquier ruta desconocida */}
        <Route path="*" element={<Navigate to={user ? "/" : "/login"} />} />
      </Routes>
    </BrowserRouter>
  );
}
