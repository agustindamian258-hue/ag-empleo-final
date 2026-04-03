import React, { useState, createContext, useContext } from 'react';
import AppRoutes from './app/routes';

// Creamos un "Contexto" para que toda la app sepa en qué modo estamos
const ThemeContext = createContext({
  isSocialMode: false,
  toggleMode: () => {},
});

export const useTheme = () => useContext(ThemeContext);

function App() {
  const [isSocialMode, setIsSocialMode] = useState(false);

  const toggleMode = () => {
    setIsSocialMode(!isSocialMode);
    // Regla de oro: El cambio es real y visual
    console.log("Cambiando a modo:", !isSocialMode ? "SOCIAL" : "EMPLEO");
  };

  return (
    <ThemeContext.Provider value={{ isSocialMode, toggleMode }}>
      {/* Aplicamos una clase de CSS global según el modo */}
      <div className={isSocialMode ? "theme-social" : "theme-empleo"}>
        <AppRoutes />
      </div>
    </ThemeContext.Provider>
  );
}

export default App;
