import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from 'firebase/auth';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface ThemeContextType {
  isSocialMode: boolean;
  toggleMode: () => void;
  user: User | null;
  setUser: (user: User | null) => void;
}

// ─── Contexto ─────────────────────────────────────────────────────────────────

export const ThemeContext = createContext<ThemeContextType>({
  isSocialMode: false,
  toggleMode:   () => {},
  user:         null,
  setUser:      () => {},
});

export const useTheme = () => useContext(ThemeContext);

// ─── Storage helper con fallback seguro ───────────────────────────────────────

function getStoredMode(): boolean {
  try {
    return localStorage.getItem('ag_modo') === 'social';
  } catch {
    // localStorage bloqueado (modo incógnito restrictivo, etc.)
    return false;
  }
}

function setStoredMode(isSocial: boolean): void {
  try {
    localStorage.setItem('ag_modo', isSocial ? 'social' : 'empleo');
  } catch {
    // Silenciar error si storage no está disponible
  }
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isSocialMode, setIsSocialMode] = useState<boolean>(getStoredMode);
  const [user, setUser] = useState<User | null>(null);

  const toggleMode = () => {
    setIsSocialMode((prev) => {
      const next = !prev;
      setStoredMode(next);
      return next;
    });
  };

  return (
    <ThemeContext.Provider value={{ isSocialMode, toggleMode, user, setUser }}>
      {children}
    </ThemeContext.Provider>
  );
}
