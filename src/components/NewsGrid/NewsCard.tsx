/**
 * Responsive Image News Card with Ordered Sequential Media Fetching,
 * 90%+ Video Hover GIF, and Seamless Gap-Filling Blur & Loading Transition.
 *
 * Prevents jarring black screens while videos load:
 * - When hovered and video is preparing, the actual news photo smoothly blurs (blur-md)
 *   with a glassmorphic loading spinner badge.
 * - When video frames are decoded and ready, the video cross-fades into view seamlessly.
 * - If hover ends, the sharp photo smoothly returns.
 */
import React, { useState, useEffect, useRef } from 'react';
import { formatTimeAgo } from '../../utils/timeAgo';
import { usePrefs } from '../../context/PrefsContext';
import { t } from '../../i18n/useI18n';
import { TextCard } from './TextCard';
import categoriesData from '../../config/categories.json';
import { orderedMediaFetcher } from '../../services/orderedMediaFetcher';
import type { Article, CategoryInfo, VideoMatch } from '../../types';

const categories: CategoryInfo[] = categoriesData as CategoryInfo[];

interface NewsCardProps {
  article: Article;
  index?: number;
  onClick: () => void;
}

export const NewsCard: React.FC<NewsCardProps> = ({ article, index = 0, onClick }) => {
  const { preferences } = usePrefs();
  const lang = preferences.language;

  // Real news image state
  const [imageUrl, setImageUrl] = useState<string | null>(article.image?.url || null);
  const [imageSource, setImageSource] = useState<string | null>(article.image?.sourceTitle || null);
  const [isRealPhoto, setIsRealPhoto] = useState<boolean>(Boolean(article.image?.isRealNewsPhoto));
  const [imageError, setImageError] = useState(false);

  // Video accuracy and hover preview state
  const [videoMatch, setVideoMatch] = useState<VideoMatch | null>(null);
  const [is90PercentAccurate, setIs90PercentAccurate] = useState<boolean>(false);
  const [confidencePercent, setConfidencePercent] = useState<number>(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Hover and loading gap transition state
  const [isHovered, setIsHovered] = useState(false);
  const [showVideoPreview, setShowVideoPreview] = useState(false);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const hoverTimeoutRef = useRef<number | null>(null);

  // Subscribe to the ordered media queue:
  // Strictly fetches media in the exact order of the news feed (topmost news first, then next)
  useEffect(() => {
    const unsubscribe = orderedMediaFetcher.subscribe(article, index, (media) => {
      if (media.imageUrl) {
        setImageUrl(media.imageUrl);
        setImageSource(media.imageSource);
        setIsRealPhoto(media.isRealPhoto);
        setImageError(false);
      }
      setVideoMatch(media.videoMatch);
      setIs90PercentAccurate(media.is90PercentAccurate);
      setConfidencePercent(media.confidencePercent);
      setPreviewUrl(media.previewUrl);
    });

    return () => {
      unsubscribe();
    };
  }, [article.id, index]);

  // Handle cell hover: elevates article to #1 in queue, and starts hover preview if >= 90% accurate
  const handleMouseEnter = () => {
    setIsHovered(true);
    setIsVideoLoaded(false);
    orderedMediaFetcher.prioritize(article.id);

    if (is90PercentAccurate) {
      hoverTimeoutRef.current = window.setTimeout(() => {
        setShowVideoPreview(true);
      }, 120);
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setShowVideoPreview(false);
    setIsVideoLoaded(false);
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
  };

  const handleImageError = () => {
    setImageError(true);
  };

  // If already hovering and accuracy gets confirmed, trigger preview
  useEffect(() => {
    if (isHovered && is90PercentAccurate && !showVideoPreview) {
      setShowVideoPreview(true);
    }
  }, [isHovered, is90PercentAccurate, showVideoPreview]);

  // Fallback to text card only if no image exists or load fails completely
  if ((!imageUrl && !article.image) || imageError) {
    return <TextCard article={article} onClick={onClick} />;
  }

  const categoryInfo = categories.find(c => c.id === article.category) || categories[0];
  const categoryLabel = categoryInfo.label[lang] || categoryInfo.label.en;

  const width = article.image?.width || 1200;
  const height = article.image?.height || 800;
  const aspectRatio = `${width} / ${height}`;

  const currentPreviewUrl = previewUrl || (videoMatch?.primary?.youtubeId
    ? `https://www.youtube-nocookie.com/embed/${videoMatch.primary.youtubeId}?autoplay=1&mute=1&controls=0&showinfo=0&rel=0&loop=1&playlist=${videoMatch.primary.youtubeId}&start=4&end=11&playsinline=1&modestbranding=1&disablekb=1&fs=0&iv_load_policy=3&cc_load_policy=0&autohide=1`
    : null);

  // Smooth gap condition: when user hovers a 90%+ accurate cell, but video is still preparing/buffering
  const isVideoPreparing = isHovered && is90PercentAccurate && (!isVideoLoaded || !showVideoPreview);

  return (
    <button
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      role="button"
      tabIndex={0}
      aria-label={t(lang, 'card.openStory', { headline: article.title })}
      className="group w-full text-left rounded-2xl mb-4 overflow-hidden border border-white/[0.07] [data-theme=light]:border-black/[0.08] bg-[#171C24] [data-theme=light]:bg-white shadow-xs hover:shadow-xl transition-all duration-300 hover:-translate-y-1.5 active:scale-[0.98] active:ring-2 active:ring-[#FF6B35]/40 focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/50 flex flex-col relative cursor-pointer will-change-transform"
    >
      {/* Top Media Container */}
      <div
        className="w-full bg-stone-900 overflow-hidden relative"
        style={{ aspectRatio }}
      >
        {/* Authentic News Photograph - smoothly blurs instead of going black during video load */}
        <img
          src={imageUrl || article.image?.url || ''}
          alt={article.title}
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={handleImageError}
          className={`w-full h-full object-cover transition-all duration-500 ease-out ${
            isVideoPreparing
              ? 'scale-105 filter blur-[6px] brightness-[0.80]'
              : isHovered && !showVideoPreview
              ? 'scale-103 blur-0'
              : 'scale-100 blur-0'
          }`}
        />

        {/* Subtle Bottom Scrim */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60 pointer-events-none" />

        {/* GAP FILLER: Smooth Blur & Loading Spinner (replaces black flash) */}
        {isVideoPreparing && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-15 transition-all duration-300 animate-fade-in">
            <div className="px-3.5 py-1.5 rounded-full bg-black/70 backdrop-blur-md border border-white/15 shadow-2xl flex items-center gap-2.5 animate-pulse">
              <div className="w-3.5 h-3.5 border-2 border-[#FF6B35] border-t-transparent rounded-full animate-spin" />
              <span className="text-[10px] font-semibold text-white/95 tracking-wide">
                Previewing Video...
              </span>
            </div>
          </div>
        )}

        {/* 90%+ ACCURACY VIDEO GIF / LOOPING PREVIEW */}
        {/* Rendered IF AND ONLY IF video probability of correctness is >= 90% and user hovers */}
        {showVideoPreview && is90PercentAccurate && currentPreviewUrl && (
          <div className="absolute inset-0 bg-transparent z-20 overflow-hidden pointer-events-none select-none transition-opacity duration-500">
            {/* Scaled & Centered Iframe: Completely cuts off and crops all player controls, titles, and branding */}
            <iframe
              src={currentPreviewUrl}
              title="News Highlight Clip"
              onLoad={() => {
                // Short buffer to let the first video frame decode before revealing
                setTimeout(() => setIsVideoLoaded(true), 350);
              }}
              className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[145%] h-[145%] pointer-events-none border-0 select-none transition-opacity duration-500 ease-out ${
                isVideoLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              tabIndex={-1}
              allow="autoplay; encrypted-media"
            />
            {/* 90%+ Accuracy Badge Overlay - smoothly emerges once video is actively playing */}
            {isVideoLoaded && (
              <div className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-full bg-black/85 backdrop-blur-md text-[10px] font-bold text-emerald-400 border border-emerald-500/40 flex items-center gap-1.5 shadow-xl pointer-events-none select-none animate-fade-in">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>{confidencePercent}% Accuracy • Live Clip</span>
              </div>
            )}
          </div>
        )}

        {/* Real News Photo Badge */}
        {isRealPhoto && !isVideoLoaded && (
          <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-md text-[9px] font-medium text-white/90 border border-white/10 flex items-center gap-1 z-10 transition-opacity duration-300">
            <span>📸</span>
            <span>{imageSource || 'Actual News Photo'}</span>
          </div>
        )}

        {/* Subtle 90%+ Video Match indicator when not hovering */}
        {is90PercentAccurate && !isHovered && (
          <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-md text-[9px] font-semibold text-[#FF6B35] border border-[#FF6B35]/30 flex items-center gap-1 shadow-sm z-10">
            <span>⚡</span>
            <span>{confidencePercent}% Match</span>
          </div>
        )}
      </div>

      {/* Body Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Category Chip & Per-cell Video Availability */}
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
            {is90PercentAccurate ? (
              <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 rounded-md ml-auto flex items-center gap-1">
                <span>▶</span>
                <span>Verified Report</span>
              </span>
            ) : videoMatch ? (
              <span className="text-[10px] text-[#FF6B35] font-medium bg-[#FF6B35]/10 border border-[#FF6B35]/20 px-1.5 py-0.5 rounded-md ml-auto flex items-center gap-1">
                <span>▶</span>
                <span>Video Available</span>
              </span>
            ) : null}
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
