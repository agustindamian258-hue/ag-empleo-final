// src/App.tsx
import { useState, useEffect } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import AppRoutes from './app/rutas';
import { auth } from './app/firebase';
import { ThemeContext } from './context/ThemeContext';

function App() {
  const [isSocialMode, setIsSocialMode] = useState<boolean>(() => {
    return localStorage.getItem('ag_modo') === 'social';
  });
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const toggleMode = () => {
    const nuevoModo = !isSocialMode;
    setIsSocialMode(nuevoModo);
    localStorage.setItem('ag_modo', nuevoModo ? 'social' : 'empleo');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-blue-700 font-bold text-lg">AG EMPLEO</p>
        </div>
      </div>
    );
  }

  return (
    <ThemeContext.Provider value={{ isSocialMode, toggleMode, user }}>
      <div className={isSocialMode ? 'theme-social' : 'theme-empleo'}>
        <AppRoutes user={user} loading={loading} />
      </div>
    </ThemeContext.Provider>
  );
}

export default App;
