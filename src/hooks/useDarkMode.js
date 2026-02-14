import { useState, useEffect } from 'react';

export function useDarkMode(storageKey) {
  const [darkMode, setDarkMode] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(darkMode));
    } catch {
      // Ignore localStorage errors
    }
  }, [storageKey, darkMode]);

  const toggleDarkMode = () => setDarkMode(d => !d);

  return { darkMode, setDarkMode, toggleDarkMode };
}
