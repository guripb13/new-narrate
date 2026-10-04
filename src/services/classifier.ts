/**
 * Article Classifier, City & Celebrity Extractor
 * Enforces specification A5: Keyword-based scoring, Devanagari tokenizer, entity linking.
 */
import categoriesData from '../config/categories.json';
import citiesData from '../config/cities.json';
import celebritiesData from '../config/celebrities.json';
import type { CategoryInfo, CityInfo, Language } from '../types';

const categories: CategoryInfo[] = categoriesData as CategoryInfo[];
const cities: CityInfo[] = citiesData as CityInfo[];
const celebrities: string[] = celebritiesData as string[];

/**
 * Tokenize for both Latin and Devanagari scripts
 */
export function tokenize(text: string): string[] {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'।॥]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

function countKeywordHits(textLower: string, keywords: string[]): number {
  let hits = 0;
  for (const kw of keywords) {
    const kwLower = kw.toLowerCase();
    if (kwLower.includes(' ')) {
      if (textLower.includes(kwLower)) hits++;
    } else {
      // Unicode-aware word boundary matching
      const regex = new RegExp(`(^|[^\\p{L}\\p{N}])${kwLower}([^\\p{L}\\p{N}]|$)`, 'u');
      if (regex.test(textLower)) hits++;
    }
  }
  return hits;
}

export interface ClassificationResult {
  category: string;
  tags: string[];
  cities: string[];
}

export function classifyArticle({
  title,
  summary,
  language = 'en',
  feedCategoryHint
}: {
  title: string;
  summary: string;
  language?: Language;
  feedCategoryHint?: string;
}): ClassificationResult {
  const titleLower = (title || '').toLowerCase();
  const summaryLower = (summary || '').toLowerCase();
  const combined = `${titleLower} ${summaryLower}`;

  const langKey = language === 'hi' ? 'hi' : 'en';
  const scores: Record<string, number> = {};

  for (const cat of categories) {
    if (cat.id === 'top') continue;

    let score = 0;
    if (feedCategoryHint === cat.id) score += 3;

    const keywords = cat.keywords[langKey] || [];
    const titleHits = countKeywordHits(titleLower, keywords);
    const summaryHits = countKeywordHits(summaryLower, keywords);

    score += (titleHits * 2) + summaryHits;
    scores[cat.id] = score;
  }

  // Find primary category
  let primaryCategory = 'top';
  let highestScore = 0;

  for (const [catId, score] of Object.entries(scores)) {
    if (score > highestScore) {
      highestScore = score;
      primaryCategory = catId;
    }
  }

  if (highestScore < 2) {
    primaryCategory = feedCategoryHint && feedCategoryHint !== 'top' ? feedCategoryHint : 'top';
  }

  // Tags: all categories with score >= 2
  const tagsSet = new Set<string>();
  if (primaryCategory !== 'top') tagsSet.add(primaryCategory);

  for (const [catId, score] of Object.entries(scores)) {
    if (score >= 2) tagsSet.add(catId);
  }

  // Celebrity Sub-tag Check
  let hasCelebrity = false;
  for (const celeb of celebrities) {
    const celebLower = celeb.toLowerCase();
    if (combined.includes(celebLower)) {
      hasCelebrity = true;
      break;
    }
  }

  if (hasCelebrity) {
    tagsSet.add('celebrity');
    tagsSet.add('entertainment');
  }

  // City Matching
  const matchedCities = new Set<string>();
  for (const city of cities) {
    for (const alias of city.aliases) {
      const aliasLower = alias.toLowerCase();
      const regex = new RegExp(`(^|[^\\p{L}\\p{N}])${aliasLower}([^\\p{L}\\p{N}]|$)`, 'u');
      if (regex.test(combined)) {
        matchedCities.add(city.name);
        break;
      }
    }
  }

  return {
    category: primaryCategory,
    tags: Array.from(tagsSet),
    cities: Array.from(matchedCities)
  };
}
