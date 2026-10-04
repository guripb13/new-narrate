/**
 * Internationalization Hook & Utility
 * Complies with Rule R10: No hard-coded UI text in components.
 */
import enDict from './en.json';
import hiDict from './hi.json';
import type { Language } from '../types';

export function t(lang: Language, path: string, params?: Record<string, string | number>): string {
  const dict = lang === 'hi' ? hiDict : enDict;
  const keys = path.split('.');
  
  let current: any = dict;
  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      // Fallback to English dictionary
      let fallback: any = enDict;
      for (const fKey of keys) {
        if (fallback && typeof fallback === 'object' && fKey in fallback) {
          fallback = fallback[fKey];
        } else {
          return path;
        }
      }
      current = fallback;
      break;
    }
  }

  if (typeof current !== 'string') {
    return path;
  }

  if (params) {
    return Object.entries(params).reduce((str, [k, v]) => {
      return str.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
    }, current);
  }

  return current;
}
