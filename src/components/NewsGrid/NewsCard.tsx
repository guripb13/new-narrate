/**
 * Responsive Image News Card
 * Enforces Section A2: Image with aspect-ratio, lazy loading, clamp, onError fallback.
 */
import React, { useState } from 'react';
import { formatTimeAgo } from '../../utils/timeAgo';
import { usePrefs } from '../../context/PrefsContext';
import { t } from '../../i18n/useI18n';
import { TextCard } from './TextCard';
import categoriesData from '../../config/categories.json';
import type { Article, CategoryInfo } from '../../types';

const categories: CategoryInfo[] = categoriesData as CategoryInfo[];

interface NewsCardProps {
  article: Article;
  onClick: () => void;
}

export const NewsCard: React.FC<NewsCardProps> = ({ article, onClick }) => {
  const { preferences } = usePrefs();
  const [imageError, setImageError] = useState(false);
  const lang = preferences.language;

  // Fallback to text card if image is absent or broken
  if (!article.image || imageError) {
    return <TextCard article={article} onClick={onClick} />;
  }

  const categoryInfo = categories.find(c => c.id === article.category) || categories[0];
  const categoryLabel = categoryInfo.label[lang] || categoryInfo.label.en;

  const width = article.image.width || 1200;
  const height = article.image.height || 800;
  const aspectRatio = `${width} / ${height}`;

  return (
    <button
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={t(lang, 'card.openStory', { headline: article.title })}
      className="group w-full text-left rounded-2xl mb-4 overflow-hidden border border-white/[0.07] [data-theme=light]:border-black/[0.08] bg-[#171C24] [data-theme=light]:bg-white shadow-xs hover:shadow-md transition-all duration-200 hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/50 flex flex-col"
    >
      {/* Top Image with stored aspect-ratio */}
      <div
        className="w-full bg-stone-900 overflow-hidden relative"
        style={{ aspectRatio }}
      >
        <img
          src={article.image.url}
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setImageError(true)}
          className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500 ease-out"
        />
        {/* Subtle Bottom Scrim */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60" />
      </div>

      {/* Body Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Category Chip */}
          <div className="flex items-center gap-2 mb-2">
            <span
              className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md"
              style={{
                backgroundColor: `${categoryInfo.color}20`,
                color: categoryInfo.color
              }}
            >
              {categoryLabel}
            </span>
            {article.cities.length > 0 && (
              <span className="text-[10px] text-[#9AA6B2] [data-theme=light]:text-stone-500 bg-white/[0.04] [data-theme=light]:bg-black/[0.04] px-1.5 py-0.5 rounded">
                {article.cities[0]}
              </span>
            )}
          </div>

          {/* Headline (3 lines clamp) */}
          <h3 className="text-sm sm:text-base font-semibold text-[#E8ECF1] [data-theme=light]:text-stone-900 leading-snug line-clamp-3 mb-2 group-hover:text-white [data-theme=light]:group-hover:text-black transition-colors">
            {article.title}
          </h3>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-[#6C7A89] [data-theme=light]:text-stone-500 pt-3 mt-1 border-t border-white/[0.05] [data-theme=light]:border-black/[0.05]">
          <span className="font-medium text-[#9AA6B2] [data-theme=light]:text-stone-700 truncate max-w-[150px]">
            {article.source.name}
          </span>
          <span className="text-[11px] shrink-0">
            {formatTimeAgo(article.publishedAt, lang)}
          </span>
        </div>
      </div>
    </button>
  );
};
