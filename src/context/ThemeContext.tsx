// src/context/ThemeContext.tsx
import { createContext, useContext, useState, ReactNode } from 'react';
import { User } from 'firebase/auth';

export type SocialColor =
  | 'blue'
  | 'purple'
  | 'rose'
  | 'green'
  | 'orange'
  | 'teal';

export interface ThemeContextType {
  isSocialMode: boolean;
  toggleMode: () => void;
  user: User | null;
  setUser: (user: User | null) => void;
  socialColor: SocialColor;
  setSocialColor: (c: SocialColor) => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
}

export const ThemeContext = createContext<ThemeContextType>({
  isSocialMode:   false,
  toggleMode:     () => {},
  user:           null,
  setUser:        () => {},
  socialColor:    'blue',
  setSocialColor: () => {},
  darkMode:       false,
  toggleDarkMode: () => {},
});

export const useTheme = () => useContext(ThemeContext);

function storage<T>(key: string, fallback: T): [() => T, (v: T) => void] {
  const get = (): T => {
    try {
      const v = localStorage.getItem(key);
      return v !== null ? (JSON.parse(v) as T) : fallback;
    } catch { return fallback; }
  };
  const set = (v: T): void => {
    try { localStorage.setItem(key, JSON.stringify(v)); } catch { /* noop */ }
  };
  return [get, set];
}

const [getMode,  setStoredMode]  = storage<boolean>('ag_modo',   false);
const [getColor, setStoredColor] = storage<SocialColor>('ag_color', 'blue');
const [getDark,  setStoredDark]  = storage<boolean>('ag_dark',   false);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isSocialMode, setIsSocialMode] = useState<boolean>(getMode);
  const [socialColor,  setSocialColorS] = useState<SocialColor>(getColor);
  const [darkMode,     setDarkMode]     = useState<boolean>(getDark);
  const [user,         setUser]         = useState<User | null>(null);

  const toggleMode = () =>
    setIsSocialMode(p => { const n = !p; setStoredMode(n); return n; });

  const setSocialColor = (c: SocialColor) => {
    setStoredColor(c);
    setSocialColorS(c);
  };

  const toggleDarkMode = () =>
    setDarkMode(p => { const n = !p; setStoredDark(n); return n; });

  return (
    <ThemeContext.Provider
      value={{ isSocialMode, toggleMode, user, setUser, socialColor, setSocialColor, darkMode, toggleDarkMode }}
    >
      {children}
    </ThemeContext.Provider>
  );
                }
