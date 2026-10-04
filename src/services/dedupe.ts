/**
 * Deduplication Engine
 * Uses normalized title hashing and Jaccard word similarity.
 */
import { tokenize } from './classifier';

export function computeTitleHash(title: string): string {
  const normalized = (title || '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]/gu, '')
    .trim();
  
  // Simple fast deterministic 32-bit hash for browser/node compatibility
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return hash.toString(16);
}

export function computeJaccardSimilarity(textA: string, textB: string): number {
  const setA = new Set(tokenize(textA));
  const setB = new Set(tokenize(textB));

  if (setA.size === 0 || setB.size === 0) return 0;

  let intersectionSize = 0;
  for (const word of setA) {
    if (setB.has(word)) intersectionSize++;
  }

  const unionSize = new Set([...setA, ...setB]).size;
  return unionSize === 0 ? 0 : intersectionSize / unionSize;
}

export function isDuplicateArticle(
  candidate: { title: string; category: string },
  existingArticles: Array<{ title: string; category: string }>
): boolean {
  const candidateHash = computeTitleHash(candidate.title);

  for (const existing of existingArticles) {
    if (computeTitleHash(existing.title) === candidateHash) {
      return true;
    }
    if (existing.category === candidate.category) {
      if (computeJaccardSimilarity(candidate.title, existing.title) >= 0.8) {
        return true;
      }
    }
  }

  return false;
}
