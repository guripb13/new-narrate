/**
 * Narration Script Builder
 * Strictly complies with Specification A4.2.
 */
import { cleanText } from '../services/textClean';
import type { Language } from '../types';

export interface ScriptInput {
  id: number;
  title: string;
  summary: string;
  source: string;
  category: string;
  city?: string;
  language: Language;
}

export interface ScriptOutput {
  sentences: string[];
  text: string;
}

const EN_ABBREVIATIONS: Array<[RegExp, string]> = [
  [/\bPM\b/g, 'Prime Minister'],
  [/\bCM\b/g, 'Chief Minister'],
  [/\bHC\b/g, 'High Court'],
  [/\bSC\b/g, 'Supreme Court'],
  [/\bMP\b/g, 'Member of Parliament'],
  [/\bMLA\b/g, 'M L A'],
  [/\bBJP\b/g, 'B J P'],
  [/\bRBI\b/g, 'R B I'],
  [/\bIPL\b/g, 'I P L'],
  [/\bICC\b/g, 'I C C'],
  [/\bAI\b/g, 'A I'],
  [/%/g, ' percent']
];

export function expandAbbreviations(text: string): string {
  let expanded = text;

  // Replace ₹500 -> 500 rupees
  expanded = expanded.replace(/₹\s*([0-9,]+(\.[0-9]+)?)/g, '$1 rupees');

  for (const [regex, replacement] of EN_ABBREVIATIONS) {
    expanded = expanded.replace(regex, replacement);
  }

  return expanded;
}

export function truncateToWords(text: string, maxWords = 70): string {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) {
    const trimmed = text.trim();
    return /[.?!।]$/.test(trimmed) ? trimmed : `${trimmed}.`;
  }

  const slice = words.slice(0, maxWords).join(' ');
  // Look for last sentence boundary in the slice
  const lastSentenceMatch = slice.match(/.*[.?!।]/);
  if (lastSentenceMatch && lastSentenceMatch[0].length > 20) {
    return lastSentenceMatch[0].trim();
  }

  return `${slice.trim()}.`;
}

export function buildScript(input: ScriptInput): ScriptOutput {
  const { id, title, summary, source, category, city, language } = input;

  // 1. Clean headline & summary
  let cleanTitle = cleanText(title, 200).replace(/[.?!।]+$/, '');
  let cleanSummary = cleanText(summary, 500);

  // 2. Expand abbreviations (English only)
  if (language === 'en') {
    cleanTitle = expandAbbreviations(cleanTitle);
    cleanSummary = expandAbbreviations(cleanSummary);
  }

  // 3. Truncate summary to max 70 words
  const truncatedSummary = truncateToWords(cleanSummary, 70);

  // 4. Intro generation
  let intro = '';
  if (language === 'en') {
    if (city) {
      intro = `From ${city}:`;
    } else {
      const intros = [
        "Here's what's happening.",
        "Now, an update.",
        "In the news."
      ];
      let baseIntro = intros[Math.abs(id) % 3];

      if (category === 'sports') {
        baseIntro = 'In sports,';
      } else if (category === 'business') {
        baseIntro = 'On the business front,';
      } else if (category === 'entertainment') {
        baseIntro = 'In entertainment,';
      } else if (category === 'protests') {
        baseIntro = 'On the ground,';
      }
      intro = baseIntro;
    }
  } else {
    // Hindi
    if (city) {
      intro = `${city} से ख़बर।`;
    } else {
      const hindiIntros = [
        'ताज़ा ख़बर।',
        'आइए जानते हैं।',
        'अब ख़बरों में।'
      ];
      intro = hindiIntros[Math.abs(id) % 3];
    }
  }

  // 5. Outro generation
  const outro = language === 'en'
    ? `This report is from ${source}.`
    : `यह ख़बर ${source} के हवाले से है।`;

  // 6. Compose complete narrative
  const fullText = `${intro} ${cleanTitle}. ${truncatedSummary} ${outro}`;

  // 7. Split into chunks <= 200 characters on sentence boundaries
  const rawSentences = fullText
    .split(/(?<=[.?!।])\s+/)
    .map(s => s.trim())
    .filter(Boolean);

  const sentences: string[] = [];

  for (const s of rawSentences) {
    if (s.length <= 200) {
      sentences.push(s);
    } else {
      // Split on commas or pauses if chunk is too long
      const subParts = s.split(/(?<=[,;])\s+/);
      let buffer = '';
      for (const part of subParts) {
        if ((buffer + ' ' + part).trim().length <= 200) {
          buffer = (buffer + ' ' + part).trim();
        } else {
          if (buffer) sentences.push(buffer);
          buffer = part;
        }
      }
      if (buffer) sentences.push(buffer);
    }
  }

  return {
    sentences: sentences.length > 0 ? sentences : [fullText],
    text: fullText
  };
}
