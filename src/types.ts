/**
 * Type Definitions for Awaaz News
 */

export type Language = 'en' | 'hi';

export interface Preferences {
  version: 1;
  country: string;
  language: Language;
  categories: string[];
  city?: string;
  query?: string;
  narration: {
    rate: number;
    autoplayNext: boolean;
  };
}

export interface Source {
  id: string;
  name: string;
  country: string;
  language: Language;
  feedUrl: string;
  homeUrl: string;
  categoryHint?: string;
}

export interface ArticleImage {
  url: string;
  width: number;
  height: number;
}

export interface Article {
  id: number;
  title: string;
  summary: string;
  url: string;
  source: {
    id: string;
    name: string;
    homeUrl: string;
  };
  language: Language;
  category: string;
  tags: string[];
  cities: string[];
  image: ArticleImage | null;
  publishedAt: string;
}

export interface CategoryInfo {
  id: string;
  label: {
    en: string;
    hi: string;
  };
  icon: string;
  color: string;
  gradient?: string;
  keywords: {
    en: string[];
    hi: string[];
  };
}

export interface CityInfo {
  name: string;
  aliases: string[];
}

export interface VideoMatch {
  youtubeId: string;
  title: string;
  channel: string;
}
