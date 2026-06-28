import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemeType = 'obsidian' | 'cyberpunk' | 'emerald';

interface ThemeContextProps {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeType>(() => {
    const saved = localStorage.getItem('pipsflow-theme');
    return (saved as ThemeType) || 'obsidian';
  });

  const setTheme = (newTheme: ThemeType) => {
    setThemeState(newTheme);
    localStorage.setItem('pipsflow-theme', newTheme);
  };

  useEffect(() => {
    const root = window.document.documentElement;
    // Remove existing themes
    root.classList.remove('theme-cyberpunk', 'theme-emerald');

    if (theme === 'cyberpunk') {
      root.classList.add('theme-cyberpunk');
    } else if (theme === 'emerald') {
      root.classList.add('theme-emerald');
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
