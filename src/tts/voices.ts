/**
 * Speech Synthesis Voices Manager
 * Selects highest quality natural voice prioritizing en-IN / hi-IN.
 */
import type { Language } from '../types';

let cachedVoices: SpeechSynthesisVoice[] = [];
let voicesLoadedPromise: Promise<SpeechSynthesisVoice[]> | null = null;

export function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    return Promise.resolve([]);
  }

  if (cachedVoices.length > 0) {
    return Promise.resolve(cachedVoices);
  }

  if (voicesLoadedPromise) {
    return voicesLoadedPromise;
  }

  voicesLoadedPromise = new Promise((resolve) => {
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      cachedVoices = voices;
      resolve(voices);
      return;
    }

    const onVoicesChanged = () => {
      const updated = window.speechSynthesis.getVoices();
      if (updated.length > 0) {
        cachedVoices = updated;
        window.speechSynthesis.removeEventListener('voiceschanged', onVoicesChanged);
        resolve(updated);
      }
    };

    window.speechSynthesis.addEventListener('voiceschanged', onVoicesChanged);

    // Timeout safety net (2 seconds)
    setTimeout(() => {
      window.speechSynthesis.removeEventListener('voiceschanged', onVoicesChanged);
      cachedVoices = window.speechSynthesis.getVoices();
      resolve(cachedVoices);
    }, 2000);
  });

  return voicesLoadedPromise;
}

export function selectBestVoice(voices: SpeechSynthesisVoice[], lang: Language): SpeechSynthesisVoice | null {
  if (!voices || voices.length === 0) return null;

  const targetLang = lang === 'hi' ? 'hi' : 'en';

  // Filter voices matching language code prefix
  const matching = voices.filter(v => {
    const vLang = (v.lang || '').toLowerCase().replace('_', '-');
    return vLang.startsWith(targetLang);
  });

  if (matching.length === 0) return null;

  // Score candidate voices based on natural quality and regional accent
  const scoreVoice = (voice: SpeechSynthesisVoice): number => {
    let score = 0;
    const vLang = (voice.lang || '').toLowerCase().replace('_', '-');
    const vName = (voice.name || '').toLowerCase();

    // Priority for Indian accent in English
    if (lang === 'en') {
      if (vLang === 'en-in') score += 50;
      else if (vLang === 'en-gb') score += 30;
      else if (vLang === 'en-us') score += 20;
    } else {
      if (vLang === 'hi-in') score += 50;
    }

    // Prefer high-fidelity neural/natural voices
    if (vName.includes('natural') || vName.includes('neural')) score += 40;
    if (vName.includes('google')) score += 30;
    if (voice.default) score += 5;

    return score;
  };

  matching.sort((a, b) => scoreVoice(b) - scoreVoice(a));
  return matching[0] || null;
}
