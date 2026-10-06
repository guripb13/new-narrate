/**
 * Deterministic Gradient Text Card
 * Rendered when article has no usable image or if image load fails (Section A2).
 */
import React from 'react';
import { formatTimeAgo } from '../../utils/timeAgo';
import { usePrefs } from '../../context/PrefsContext';
import { t } from '../../i18n/useI18n';
import categoriesData from '../../config/categories.json';
import { hasCachedVideoMatch } from '../../services/videoMatcher';
import type { Article, CategoryInfo } from '../../types';

const categories: CategoryInfo[] = categoriesData as CategoryInfo[];

interface TextCardProps {
  article: Article;
  onClick: () => void;
}

export const TextCard: React.FC<TextCardProps> = ({ article, onClick }) => {
  const { preferences } = usePrefs();
  const lang = preferences.language;

  const categoryInfo = categories.find(c => c.id === article.category) || categories[0];
  const categoryLabel = categoryInfo.label[lang] || categoryInfo.label.en;

  return (
    <button
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={t(lang, 'card.openStory', { headline: article.title })}
      className="group w-full text-left rounded-2xl p-5 mb-4 border border-white/[0.07] [data-theme=light]:border-black/[0.08] bg-[#171C24] [data-theme=light]:bg-white shadow-xs hover:shadow-xl transition-all duration-300 hover:-translate-y-1.5 active:scale-[0.98] active:ring-2 active:ring-[#FF6B35]/40 focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/50 flex flex-col justify-between relative overflow-hidden cursor-pointer will-change-transform"
    >
      {/* Subtle Deterministic Background Gradient Glow */}
      <div
        className="absolute -right-12 -top-12 w-44 h-44 rounded-full blur-3xl opacity-15 pointer-events-none transition-opacity group-hover:opacity-25"
        style={{ backgroundColor: categoryInfo.color }}
      />

      <div>
        {/* Category & Badge */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span
              className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md"
              style={{
                backgroundColor: `${categoryInfo.color}20`,
                color: categoryInfo.color
              }}
            >
              {categoryLabel}
            </span>
            {hasCachedVideoMatch(article) && (
              <span className="text-[10px] text-[#FF6B35] font-medium bg-[#FF6B35]/10 border border-[#FF6B35]/20 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                <span>▶</span>
                <span>Video Available</span>
              </span>
            )}
          </div>
          <span className="text-[10px] text-[#6C7A89] [data-theme=light]:text-stone-400 font-mono">
            {t(lang, 'card.textCardBadge')}
          </span>
        </div>

        {/* Larger Headline for Text Cards (max 6 lines clamp) */}
        <h3 className="text-base sm:text-lg font-semibold text-[#E8ECF1] [data-theme=light]:text-stone-900 leading-snug line-clamp-6 mb-3 group-hover:text-white [data-theme=light]:group-hover:text-black transition-colors">
          {article.title}
        </h3>

        {/* Summary Snippet */}
        <p className="text-xs sm:text-sm text-[#9AA6B2] [data-theme=light]:text-stone-600 line-clamp-3 leading-relaxed mb-4">
          {article.summary}
        </p>
      </div>

      {/* Footer: Source + Relative Time */}
      <div className="flex items-center justify-between text-xs text-[#6C7A89] [data-theme=light]:text-stone-500 pt-3 border-t border-white/[0.05] [data-theme=light]:border-black/[0.05]">
        <span className="font-medium text-[#9AA6B2] [data-theme=light]:text-stone-700 truncate max-w-[160px]">
          {article.source.name}
        </span>
        <span className="text-[11px] shrink-0">
          {formatTimeAgo(article.publishedAt, lang)}
        </span>
      </div>
    </button>
  );
};
