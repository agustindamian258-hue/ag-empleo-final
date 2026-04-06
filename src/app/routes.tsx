import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from '../pages/Home';
import Jobs from '../pages/Jobs';
import Companies from '../pages/Companies';
import CVBuilder from '../pages/CVBuilder';
import Feed from '../pages/Feed';
import Login from '../pages/Login';
import Profile from '../pages/Profile';
import MapPage from '../pages/MapPage';

interface AppRoutesProps {
  user: any;
}

export default function AppRoutes({ user }: AppRoutesProps) {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={!user ? <Login /> : <Navigate to="/" />}
        />
        <Route path="/" element={user ? <Home /> : <Navigate to="/login" />} />
        <Route path="/jobs" element={user ? <Jobs /> : <Navigate to="/login" />} />
        <Route path="/companies" element={user ? <Companies /> : <Navigate to="/login" />} />
        <Route path="/cv" element={user ? <CVBuilder /> : <Navigate to="/login" />} />
        <Route path="/mapa" element={user ? <MapPage /> : <Navigate to="/login" />} />
        <Route path="/social" element={user ? <Feed /> : <Navigate to="/login" />} />
        <Route path="/profile" element={user ? <Profile /> : <Navigate to="/login" />} />
        <Route path="*" element={<Navigate to={user ? "/" : "/login"} />} />
      </Routes>
    </BrowserRouter>
  );
}
