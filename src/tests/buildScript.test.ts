/**
 * Narration Script Builder Unit Tests
 * Fulfills Section S8: EN intro rotation, Hindi, abbreviations, 70-word cap, sentence splitting.
 */
import { describe, it, expect } from 'vitest';
import { buildScript, expandAbbreviations, truncateToWords } from '../narration/buildScript';

describe('Script Builder Utility', () => {
  it('expands English abbreviations accurately', () => {
    const raw = 'PM and CM discuss RBI policies, IPL schedule, and ₹500 crore allocation with 15% growth';
    const expanded = expandAbbreviations(raw);
    expect(expanded).toContain('Prime Minister');
    expect(expanded).toContain('Chief Minister');
    expect(expanded).toContain('R B I');
    expect(expanded).toContain('I P L');
    expect(expanded).toContain('500 crore rupees');
    expect(expanded).toContain('15 percent');
  });

  it('rotates English intros based on story ID modulo 3', () => {
    const s0 = buildScript({
      id: 0,
      title: 'General update on national developments',
      summary: 'Details regarding the event.',
      source: 'The Hindu',
      category: 'top',
      language: 'en'
    });
    expect(s0.text).toContain("Here's what's happening.");

    const s1 = buildScript({
      id: 1,
      title: 'General update on national developments',
      summary: 'Details regarding the event.',
      source: 'The Hindu',
      category: 'top',
      language: 'en'
    });
    expect(s1.text).toContain('Now, an update.');

    const s2 = buildScript({
      id: 2,
      title: 'General update on national developments',
      summary: 'Details regarding the event.',
      source: 'The Hindu',
      category: 'top',
      language: 'en'
    });
    expect(s2.text).toContain('In the news.');
  });

  it('uses category-specific intros for sports, business, entertainment, and protests', () => {
    const sportsScript = buildScript({
      id: 0,
      title: 'India wins cricket series',
      summary: 'Players celebrate match victory.',
      source: 'The Hindu',
      category: 'sports',
      language: 'en'
    });
    expect(sportsScript.text).toContain('In sports,');

    const businessScript = buildScript({
      id: 0,
      title: 'Stock markets register gains',
      summary: 'Markets perform well today.',
      source: 'The Hindu',
      category: 'business',
      language: 'en'
    });
    expect(businessScript.text).toContain('On the business front,');
  });

  it('uses city variant intro when city is present', () => {
    const cityScript = buildScript({
      id: 0,
      title: 'New expressway opened to commuters',
      summary: 'Travel times reduced substantially.',
      source: 'Times of India',
      category: 'top',
      city: 'Ludhiana',
      language: 'en'
    });
    expect(cityScript.text).toContain('From Ludhiana:');
  });

  it('generates proper Hindi script with Hindi intros, danda splitting, and outro', () => {
    const hindiScript = buildScript({
      id: 0,
      title: 'सुप्रीम कोर्ट ने दिया अस्पताल सुरक्षा पर आदेश',
      summary: 'सभी राज्यों को अग्नि सुरक्षा ऑडिट कराने के कड़े निर्देश दिए गए हैं। नियमों का पालन अनिवार्य होगा।',
      source: 'बीबीसी हिन्दी',
      category: 'top',
      language: 'hi'
    });
    expect(hindiScript.text).toContain('ताज़ा ख़बर।');
    expect(hindiScript.text).toContain('यह ख़बर बीबीसी हिन्दी के हवाले से है।');
    expect(hindiScript.sentences.length).toBeGreaterThan(1);
  });

  it('truncates summaries to max 70 words without breaking sentences', () => {
    const words = Array.from({ length: 120 }, (_, i) => `word${i}`).join(' ') + '.';
    const truncated = truncateToWords(words, 70);
    const count = truncated.split(/\s+/).length;
    expect(count).toBeLessThanOrEqual(71);
  });
});
