// src/context/ThemeContext.tsx
import { createContext, useContext } from 'react';
import { User } from 'firebase/auth';

export interface ThemeContextType {
  isSocialMode: boolean;
  toggleMode: () => void;
  user: User | null;
}

export const ThemeContext = createContext<ThemeContextType>({
  isSocialMode: false,
  toggleMode: () => {},
  user: null,
});

export const useTheme = () => useContext(ThemeContext);
