/**
 * Responsive Masonry News Grid with Unlimited Doom Scrolling
 * Enforces S7 Breakpoints: default 4 cols, 1280px 3 cols, 1024px 2 cols, 640px 1 col.
 * Uninterrupted continuous pagination ahead of viewport.
 */
import React, { useEffect, useRef, useState } from 'react';
import { NewsCard } from './NewsCard';
import { SkeletonCard } from './SkeletonCard';
import { usePrefs } from '../../context/PrefsContext';
import { usePlayer } from '../../context/PlayerContext';
import { t } from '../../i18n/useI18n';
import type { Article } from '../../types';

interface NewsGridProps {
  articles: Article[];
  isLoading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onClearSearch: () => void;
  onOpenSettings: () => void;
}

export const NewsGrid: React.FC<NewsGridProps> = ({
  articles,
  isLoading,
  hasMore,
  onLoadMore,
  onClearSearch,
  onOpenSettings
}) => {
  const { preferences } = usePrefs();
  const { openStory } = usePlayer();
  const lang = preferences.language;
  const loadMoreSentinelRef = useRef<HTMLDivElement>(null);

  // Responsive column count calculation
  const [columnCount, setColumnCount] = useState<number>(4);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 640) setColumnCount(1);
      else if (width < 1024) setColumnCount(2);
      else if (width < 1280) setColumnCount(3);
      else setColumnCount(4);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Infinite Doom Scrolling IntersectionObserver with 600px proactive lookahead
  useEffect(() => {
    if (!hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoading) {
          onLoadMore();
        }
      },
      { rootMargin: '600px' }
    );

    const sentinel = loadMoreSentinelRef.current;
    if (sentinel) observer.observe(sentinel);

    return () => {
      if (sentinel) observer.unobserve(sentinel);
    };
  }, [hasMore, isLoading, onLoadMore]);

  // Distribute articles into masonry columns while preserving their original feed index
  const columns: Array<Array<{ article: Article; index: number }>> = Array.from(
    { length: columnCount },
    () => []
  );
  articles.forEach((article, index) => {
    columns[index % columnCount].push({ article, index });
  });

  // Empty State
  if (!isLoading && articles.length === 0) {
    return (
      <div className="max-w-md mx-auto text-center py-20 px-4">
        <div className="w-12 h-12 rounded-2xl bg-white/[0.04] [data-theme=light]:bg-black/[0.04] text-[#9AA6B2] flex items-center justify-center mx-auto mb-4 border border-white/[0.08]">
          📰
        </div>
        <h3 className="text-base font-semibold text-[#E8ECF1] [data-theme=light]:text-stone-900 mb-1">
          {t(lang, 'grid.emptyTitle')}
        </h3>
        <p className="text-xs sm:text-sm text-[#9AA6B2] [data-theme=light]:text-stone-600 mb-6">
          {t(lang, 'grid.emptyDesc')}
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={onClearSearch}
            className="px-4 py-2 rounded-xl text-xs font-medium bg-white/[0.06] [data-theme=light]:bg-stone-200 text-[#E8ECF1] [data-theme=light]:text-stone-800 hover:bg-white/[0.1] transition-colors"
          >
            {t(lang, 'grid.clearSearch')}
          </button>
          <button
            onClick={onOpenSettings}
            className="px-4 py-2 rounded-xl text-xs font-medium bg-[#FF6B35] text-white hover:bg-[#FA581D] transition-colors"
          >
            {t(lang, 'grid.editPreferences')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {/* Masonry Column Grid */}
      <div className="flex gap-4 items-start">
        {columns.map((colArticles, colIdx) => (
          <div key={colIdx} className="flex-1 flex flex-col min-w-0">
            {colArticles.map(({ article, index }) => (
              <NewsCard
                key={article.id}
                article={article}
                index={index}
                onClick={() => openStory(article, articles)}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Loading Skeletons */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {/* Infinite Scroll Continuous Trigger & Sentinel */}
      <div ref={loadMoreSentinelRef} className="py-8 flex flex-col items-center justify-center text-center">
        {hasMore ? (
          <div className="flex items-center gap-2 text-xs text-[#6C7A89] [data-theme=light]:text-stone-400">
            <span className="w-2 h-2 rounded-full bg-[#FF6B35] animate-ping" />
            <span>{t(lang, 'grid.loadMore')}</span>
          </div>
        ) : articles.length > 0 ? (
          <div className="flex flex-col items-center gap-2 text-xs text-[#6C7A89] [data-theme=light]:text-stone-400">
            <span>{t(lang, 'grid.noMore')}</span>
            <button
              onClick={onLoadMore}
              className="px-3.5 py-1.5 rounded-full border border-white/10 [data-theme=light]:border-black/10 text-xs text-[#FF6B35] hover:bg-[#FF6B35]/10 transition-colors"
            >
              Check for newly published stories
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
};
