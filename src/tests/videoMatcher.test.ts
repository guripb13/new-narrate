/**
 * Related Video Matcher Tests
 * Fulfills Section S8: Positive, negative, tokenization.
 */
import { describe, it, expect } from 'vitest';
import { findMatchingVideo, tokenizeForMatching, computeOverlap } from '../services/videoMatcher';

describe('Video Matcher Service', () => {
  it('removes stop words and tokenizes correctly', () => {
    const tokens = tokenizeForMatching('The Supreme Court and the hearing on petitions');
    expect(tokens).toContain('supreme');
    expect(tokens).toContain('court');
    expect(tokens).toContain('hearing');
    expect(tokens).toContain('petitions');
    expect(tokens).not.toContain('the');
    expect(tokens).not.toContain('and');
  });

  it('computes overlap coefficient accurately', () => {
    const tokensA = ['supreme', 'court', 'hearing', 'petitions'];
    const tokensB = ['supreme', 'court', 'hearing', 'directives'];
    const { shared, overlapCoeff } = computeOverlap(tokensA, tokensB);
    expect(shared).toBe(3);
    expect(overlapCoeff).toBe(0.75);
  });

  it('finds matching video when shared tokens and overlap criteria are met', () => {
    const match = findMatchingVideo(
      'Supreme Court hearing on constitutional bench petitions and directives',
      'en'
    );
    expect(match).not.toBeNull();
    expect(match?.channel).toBe('ANI News');
    expect(match?.youtubeId).toBe('V5E8a3w25wM');
  });

  it('returns null when no official video matches the story topic', () => {
    const match = findMatchingVideo(
      'Local bakery in Goa celebrates 100 years of traditional bread baking',
      'en'
    );
    expect(match).toBeNull();
  });

  it('matches Hindi video for Hindi story topic', () => {
    const match = findMatchingVideo(
      'संसद में बजट और महंगाई पर गरमा-गरम बहस, विपक्ष ने उठाए सवाल',
      'hi'
    );
    expect(match).not.toBeNull();
    expect(match?.channel).toBe('Aaj Tak');
  });
});
