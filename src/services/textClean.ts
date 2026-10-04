/**
 * Text Cleaning Utility for RSS Feeds
 * Complies with S4 & R5: Strip all HTML, decode entities, hard cap at 400 characters.
 */

const HTML_ENTITY_MAP: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&apos;': "'",
  '&nbsp;': ' ',
  '&#8217;': "'",
  '&#8216;': "'",
  '&#8220;': '"',
  '&#8221;': '"',
  '&#8211;': '–',
  '&#8212;': '—',
  '&hellip;': '…'
};

export function decodeEntities(text: string): string {
  if (!text) return '';
  return text.replace(/&[#a-zA-Z0-9]+;/g, (entity) => {
    if (HTML_ENTITY_MAP[entity]) return HTML_ENTITY_MAP[entity];
    if (entity.startsWith('&#x')) {
      const hex = entity.slice(3, -1);
      const code = parseInt(hex, 16);
      return !isNaN(code) ? String.fromCharCode(code) : entity;
    }
    if (entity.startsWith('&#')) {
      const dec = entity.slice(2, -1);
      const code = parseInt(dec, 10);
      return !isNaN(code) ? String.fromCharCode(code) : entity;
    }
    return entity;
  });
}

export function cleanText(raw: string, maxLength = 400): string {
  if (!raw || typeof raw !== 'string') return '';

  // 1. Strip all HTML tags
  const noTags = raw.replace(/<[^>]*>/g, ' ');

  // 2. Decode HTML entities
  const decoded = decodeEntities(noTags);

  // 3. Remove URLs
  const noUrls = decoded.replace(/https?:\/\/\S+/gi, '');

  // 4. Remove common RSS junk fragments
  const cleaned = noUrls
    .replace(/\(Photo:.*?\)/gi, '')
    .replace(/\[\+?\d+\s*chars\]/gi, '')
    .replace(/Read more\s*…?/gi, '')
    .replace(/Also read\s*…?/gi, '');

  // 5. Normalize whitespace
  const singleSpaced = cleaned.replace(/\s+/g, ' ').trim();

  // 6. Hard cap at maxLength characters, cutting at word boundary
  if (singleSpaced.length <= maxLength) {
    return singleSpaced;
  }

  const truncated = singleSpaced.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  const cleanCut = lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated;

  return `${cleanCut}…`;
}
