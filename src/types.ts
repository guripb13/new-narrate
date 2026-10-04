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
  sourceTitle?: string;
  isRealNewsPhoto?: boolean;
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
  previewGifUrl?: string; // Looping video preview for hover if accuracy >= 90%
  videoAccuracy?: number; // e.g. 0.95
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

export interface VideoOption {
  youtubeId: string;
  embedUrl: string;
  previewUrl?: string; // Looping muted 6s preview
  thumbnailUrl?: string; // High-res broadcast image
  title: string;
  channel: string;
  accuracy?: number; // 0.0 to 1.0
  confidencePercent?: number; // 0 to 100
  isHighlyAccurate?: boolean; // true if >= 90%
}

export interface VideoMatch {
  options: VideoOption[];
  primary: VideoOption;
  bestAccuracy?: number;
  hasHighlyAccuratePreview?: boolean;
}
