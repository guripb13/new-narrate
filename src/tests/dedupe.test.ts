/**
 * Deduplication Unit Tests
 * Fulfills Section S8: Exact, near-duplicate, different stories not merged.
 */
import { describe, it, expect } from 'vitest';
import { computeTitleHash, computeJaccardSimilarity, isDuplicateArticle } from '../services/dedupe';

describe('Deduplication Engine', () => {
  it('computes identical title hash for titles varying only in casing and punctuation', () => {
    const hashA = computeTitleHash('ISRO Launches New Earth Satellite!');
    const hashB = computeTitleHash('isro launches new earth satellite');
    expect(hashA).toBe(hashB);
  });

  it('computes high Jaccard similarity for near duplicate headlines', () => {
    const titleA = 'Supreme Court orders hospital fire safety audit across country';
    const titleB = 'Supreme Court directs hospital fire safety audit across all states';
    const similarity = computeJaccardSimilarity(titleA, titleB);
    expect(similarity).toBeGreaterThanOrEqual(0.6);
  });

  it('identifies exact duplicates correctly', () => {
    const existing = [
      { title: 'Sensex jumps 500 points in early trade', category: 'business' }
    ];
    const candidate = {
      title: 'Sensex Jumps 500 Points In Early Trade!',
      category: 'business'
    };
    expect(isDuplicateArticle(candidate, existing)).toBe(true);
  });

  it('does not flag distinct stories in the same category as duplicates', () => {
    const existing = [
      { title: 'RBI keeps interest rate unchanged at 6.5 percent', category: 'business' }
    ];
    const candidate = {
      title: 'Tata Motors reports record electric vehicle sales in fourth quarter',
      category: 'business'
    };
    expect(isDuplicateArticle(candidate, existing)).toBe(false);
  });
});
