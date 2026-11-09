import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ThemeContext = createContext(null);

const STORAGE_KEY = 'pdfstudio_theme_mode';

function getInitialMode() {
  if (typeof window === 'undefined') return 'system';
  try {
    return localStorage.getItem(STORAGE_KEY) || 'system';
  } catch (e) {
    return 'system';
  }
}

function getSystemTheme() {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

export function ThemeProvider({ children }) {
  const [themeMode, setThemeModeState] = useState(getInitialMode);
  const [effectiveTheme, setEffectiveTheme] = useState(() => {
    const mode = getInitialMode();
    return mode === 'system' ? getSystemTheme() : mode;
  });

  const applyTheme = useCallback((mode) => {
    const calculated = mode === 'system' ? getSystemTheme() : mode;
    setEffectiveTheme(calculated);
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', calculated);
      document.documentElement.setAttribute('data-theme-mode', mode);
    }
  }, []);

  const setThemeMode = useCallback((newMode) => {
    try {
      localStorage.setItem(STORAGE_KEY, newMode);
    } catch (e) {
      console.warn('Could not save theme preference to localStorage:', e);
    }
    setThemeModeState(newMode);
    applyTheme(newMode);
  }, [applyTheme]);

  // Listen to OS theme changes when in 'system' mode
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleMediaChange = (e) => {
      if (themeMode === 'system') {
        const newTheme = e.matches ? 'dark' : 'light';
        setEffectiveTheme(newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
      }
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleMediaChange);
    } else {
      mediaQuery.addListener(handleMediaChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleMediaChange);
      } else {
        mediaQuery.removeListener(handleMediaChange);
      }
    };
  }, [themeMode]);

  // Initial sync on mount
  useEffect(() => {
    applyTheme(themeMode);
  }, [themeMode, applyTheme]);

  return (
    <ThemeContext.Provider value={{ themeMode, effectiveTheme, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

