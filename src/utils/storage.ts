/**
 * Preferences Storage Manager
 * Strictly enforces Section A1: localStorage["awaaz.prefs.v1"] shape.
 */
import type { Preferences } from '../types';

export const PREFS_STORAGE_KEY = 'awaaz.prefs.v1';

export const DEFAULT_PREFERENCES: Preferences = {
  version: 1,
  country: 'IN',
  language: 'en',
  categories: ['top', 'protests', 'entertainment'],
  city: undefined,
  query: undefined,
  narration: {
    rate: 1.0,
    autoplayNext: false
  }
};

export function loadStoredPreferences(): Preferences | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = localStorage.getItem(PREFS_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (parsed && parsed.version === 1 && parsed.language && Array.isArray(parsed.categories)) {
      return parsed as Preferences;
    }
  } catch {
    // If malformed, return null to show onboarding
  }

  return null;
}

export function savePreferences(prefs: Preferences): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(prefs));
  } catch (err) {
    console.error('Failed to save preferences to localStorage', err);
  }
}

export function clearPreferences(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(PREFS_STORAGE_KEY);
  } catch (err) {
    console.error('Failed to clear preferences', err);
  }
}
