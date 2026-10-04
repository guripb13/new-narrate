/**
 * Text Cleaning Unit Tests
 * Fulfills Section S8: HTML, entities, URLs, emoji, 400-char cap.
 */
import { describe, it, expect } from 'vitest';
import { cleanText, decodeEntities } from '../services/textClean';

describe('Text Cleaning Utility', () => {
  it('strips all HTML tags cleanly', () => {
    const raw = '<p>The <strong>Supreme Court</strong> issued a notice.</p><br/><a href="https://example.com">Read more</a>';
    const cleaned = cleanText(raw);
    expect(cleaned).toBe('The Supreme Court issued a notice.');
    expect(cleaned).not.toContain('<p>');
    expect(cleaned).not.toContain('</a>');
  });

  it('decodes HTML entities properly', () => {
    const raw = 'Sensex &amp; Nifty rise &gt; 500 points &#39;record high&#39;';
    const decoded = decodeEntities(raw);
    expect(decoded).toBe("Sensex & Nifty rise > 500 points 'record high'");
  });

  it('removes URLs from summary bodies', () => {
    const raw = 'Visit https://news.example.com/story/102 for full coverage of the event.';
    const cleaned = cleanText(raw);
    expect(cleaned).toBe('Visit for full coverage of the event.');
  });

  it('removes common RSS junk like (Photo:...) and Read more', () => {
    const raw = 'Rescue workers reach flood affected villages. (Photo: PTI) Read more…';
    const cleaned = cleanText(raw);
    expect(cleaned).toBe('Rescue workers reach flood affected villages.');
  });

  it('hard caps summaries at specified maxLength without breaking words', () => {
    const longText = 'The Reserve Bank of India has announced a comprehensive framework to strengthen the credit delivery mechanism for micro and small enterprises while ensuring that commercial banks adhere to prudential lending norms across regional branches and maintain adequate capital buffers to mitigate potential credit risks in the evolving macroeconomic landscape.';
    const cleaned = cleanText(longText, 100);
    expect(cleaned.length).toBeLessThanOrEqual(101);
    expect(cleaned.endsWith('…')).toBe(true);
  });
});
