/**
 * Relative Timestamp Formatter with i18n
 */
import { t } from '../i18n/useI18n';
import type { Language } from '../types';

export function formatTimeAgo(isoString: string, lang: Language): string {
  const published = new Date(isoString).getTime();
  const now = Date.now();
  const diffSecs = Math.max(0, Math.floor((now - published) / 1000));

  if (diffSecs < 60) {
    return t(lang, 'card.justNow');
  }

  const diffMins = Math.floor(diffSecs / 60);
  if (diffMins < 60) {
    return t(lang, 'card.minutesAgo', { mins: diffMins });
  }

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) {
    return t(lang, 'card.hoursAgo', { hours: diffHours });
  }

  const diffDays = Math.floor(diffHours / 24);
  return t(lang, 'card.daysAgo', { days: diffDays });
}
