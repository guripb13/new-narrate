/**
 * User Preferences Context
 * Manages onboarding state, language, categories, city, custom query, and theme.
 */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { loadStoredPreferences, savePreferences, clearPreferences, DEFAULT_PREFERENCES } from '../utils/storage';
import type { Preferences, Language } from '../types';

interface PrefsContextType {
  preferences: Preferences;
  isOnboarded: boolean;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  updatePreferences: (newPrefs: Partial<Preferences>) => void;
  completeOnboarding: (finalPrefs: Preferences) => void;
  resetPreferences: () => void;
}

const PrefsContext = createContext<PrefsContextType | null>(null);

export const PrefsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [preferences, setPreferences] = useState<Preferences>(() => {
    return loadStoredPreferences() || DEFAULT_PREFERENCES;
  });

  const [isOnboarded, setIsOnboarded] = useState<boolean>(() => {
    return loadStoredPreferences() !== null;
  });

  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window !== 'undefined') {
      const storedTheme = localStorage.getItem('awaaz.theme');
      if (storedTheme === 'light' || storedTheme === 'dark') return storedTheme;
      return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    }
    return 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    if (theme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
    localStorage.setItem('awaaz.theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const updatePreferences = (newPrefs: Partial<Preferences>) => {
    setPreferences(prev => {
      const merged: Preferences = {
        ...prev,
        ...newPrefs,
        narration: {
          ...prev.narration,
          ...(newPrefs.narration || {})
        }
      };
      savePreferences(merged);
      return merged;
    });
  };

  const completeOnboarding = (finalPrefs: Preferences) => {
    savePreferences(finalPrefs);
    setPreferences(finalPrefs);
    setIsOnboarded(true);
  };

  const resetPreferences = () => {
    clearPreferences();
    setPreferences(DEFAULT_PREFERENCES);
    setIsOnboarded(false);
  };

  return (
    <PrefsContext.Provider
      value={{
        preferences,
        isOnboarded,
        theme,
        toggleTheme,
        updatePreferences,
        completeOnboarding,
        resetPreferences
      }}
    >
      {children}
    </PrefsContext.Provider>
  );
};

export function usePrefs() {
  const context = useContext(PrefsContext);
  if (!context) {
    throw new Error('usePrefs must be used within a PrefsProvider');
  }
  return context;
}
