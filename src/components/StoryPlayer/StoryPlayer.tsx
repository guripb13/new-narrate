/**
 * Story Player Overlay & Media Player
 * Strictly enforces Section A3: Shared expansion, Ken Burns zoom, live captions, YouTube embed.
 */
import React, { useState, useEffect, useRef } from 'react';
import { usePlayer } from '../../context/PlayerContext';
import { usePrefs } from '../../context/PrefsContext';
import { t } from '../../i18n/useI18n';
import { formatTimeAgo } from '../../utils/timeAgo';
import { newsService } from '../../services/newsService';
import categoriesData from '../../config/categories.json';
import {
  PlayIcon,
  PauseIcon,
  StopIcon,
  PrevIcon,
  NextIcon,
  CloseIcon,
  ExternalLinkIcon
} from '../common/Icons';
import type { CategoryInfo, VideoMatch } from '../../types';

const categories: CategoryInfo[] = categoriesData as CategoryInfo[];

export const StoryPlayer: React.FC = () => {
  const {
    activeArticle,
    script,
    currentSentenceIndex,
    isPlaying,
    rate,
    hasVoiceForLanguage,
    closeStory,
    togglePlayPause,
    nextStory,
    prevStory,
    setRate
  } = usePlayer();

  const { preferences } = usePrefs();
  const lang = preferences.language;

  const [activeMediaTab, setActiveMediaTab] = useState<'image' | 'video'>('image');
  const [videoMatch, setVideoMatch] = useState<VideoMatch | null>(null);
  const captionScrollContainerRef = useRef<HTMLDivElement>(null);
  const activeCaptionRef = useRef<HTMLParagraphElement>(null);

  // Check matching video on open
  useEffect(() => {
    if (activeArticle) {
      setActiveMediaTab('image');
      const matched = newsService.getVideoForArticle(activeArticle);
      setVideoMatch(matched);
    }
  }, [activeArticle]);

  // Auto-scroll live caption into view
  useEffect(() => {
    if (activeCaptionRef.current) {
      activeCaptionRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      });
    }
  }, [currentSentenceIndex]);

  // Keyboard navigation: Space, Esc, Arrows (Section A3.4)
  useEffect(() => {
    if (!activeArticle) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeStory();
      } else if (e.key === ' ' && e.target === document.body) {
        e.preventDefault();
        togglePlayPause();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        nextStory();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prevStory();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeArticle, closeStory, togglePlayPause, nextStory, prevStory]);

  if (!activeArticle) return null;

  const categoryInfo = categories.find(c => c.id === activeArticle.category) || categories[0];
  const categoryLabel = categoryInfo.label[lang] || categoryInfo.label.en;

  const totalSentences = script?.sentences.length || 1;
  const progressPercent = Math.min(100, Math.round(((currentSentenceIndex + 1) / totalSentences) * 100));

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="player-story-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 md:p-6 bg-black/80 backdrop-blur-md transition-opacity duration-300"
    >
      {/* Click Backdrop to close */}
      <div
        className="absolute inset-0"
        onClick={closeStory}
        aria-hidden="true"
      />

      {/* Main Player Modal Window */}
      <div className="relative z-10 w-full h-full sm:h-auto sm:max-h-[92vh] max-w-5xl rounded-none sm:rounded-3xl bg-[#171C24] [data-theme=light]:bg-white border border-white/[0.08] [data-theme=light]:border-black/[0.08] shadow-2xl flex flex-col overflow-hidden">
        
        {/* Top Floating Close Button */}
        <button
          onClick={closeStory}
          aria-label={t(lang, 'player.close')}
          className="absolute top-4 right-4 z-30 p-2 rounded-full bg-black/60 text-white/80 hover:text-white hover:bg-black/80 backdrop-blur-md transition-all"
        >
          <CloseIcon className="w-5 h-5" />
        </button>

        {/* Missing Hindi Voice Notice Banner */}
        {!hasVoiceForLanguage && activeArticle.language === 'hi' && (
          <div className="bg-amber-950/70 border-b border-amber-600/30 text-amber-200 text-xs px-4 py-2 flex items-center justify-center text-center">
            <span>{t(lang, 'player.noHindiVoice')}</span>
          </div>
        )}

        {/* Modal Content Grid: Desktop Media Left (50%), Content Right (50%) */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 overflow-y-auto">
          
          {/* Media Pane */}
          <div className="relative w-full aspect-16/10 md:aspect-auto md:h-full bg-black flex flex-col justify-center overflow-hidden min-h-[260px] md:min-h-[440px]">
            {/* Media Tabs if Video is available */}
            {videoMatch && (
              <div className="absolute top-4 left-4 z-20 flex items-center bg-black/60 backdrop-blur-md p-1 rounded-xl border border-white/10">
                <button
                  onClick={() => setActiveMediaTab('image')}
                  className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors ${
                    activeMediaTab === 'image'
                      ? 'bg-white text-black'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  {t(lang, 'player.imageTab')}
                </button>
                <button
                  onClick={() => setActiveMediaTab('video')}
                  className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors ${
                    activeMediaTab === 'video'
                      ? 'bg-[#FF6B35] text-white'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  {t(lang, 'player.videoTab')}
                </button>
              </div>
            )}

            {/* Video Pane */}
            {activeMediaTab === 'video' && videoMatch ? (
              <div className="w-full h-full flex flex-col justify-center bg-black">
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${videoMatch.youtubeId}?autoplay=0&rel=0`}
                  title={videoMatch.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  loading="lazy"
                  className="w-full h-full min-h-[300px] border-0"
                />
                <div className="p-2 text-[11px] text-white/50 text-center bg-zinc-950">
                  {t(lang, 'player.videoFrom', { channel: videoMatch.channel })}
                </div>
              </div>
            ) : (
              /* Image Pane with 14s Ken Burns Zoom */
              <div className="w-full h-full relative overflow-hidden flex items-center justify-center">
                {activeArticle.image ? (
                  <img
                    src={activeArticle.image.url}
                    alt=""
                    className="w-full h-full object-cover ken-burns"
                  />
                ) : (
                  /* Gradient Fallback when no image */
                  <div
                    className="w-full h-full flex items-center justify-center p-8 relative overflow-hidden"
                    style={{
                      background: `radial-gradient(circle at 50% 50%, ${categoryInfo.color}35 0%, #0E1116 85%)`
                    }}
                  >
                    <span className="text-5xl opacity-40">📰</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
              </div>
            )}
          </div>

          {/* Text & Captions Pane */}
          <div className="p-6 md:p-8 flex flex-col justify-between overflow-y-auto">
            <div>
              {/* Category, City, Source & Timestamp */}
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span
                  className="text-xs font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-md"
                  style={{
                    backgroundColor: `${categoryInfo.color}20`,
                    color: categoryInfo.color
                  }}
                >
                  {categoryLabel}
                </span>

                {activeArticle.cities.length > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded bg-white/[0.06] [data-theme=light]:bg-black/[0.05] text-[#9AA6B2] [data-theme=light]:text-stone-600 font-medium">
                    {activeArticle.cities[0]}
                  </span>
                )}

                <span className="text-xs text-[#6C7A89] [data-theme=light]:text-stone-400">
                  • {activeArticle.source.name} • {formatTimeAgo(activeArticle.publishedAt, lang)}
                </span>
              </div>

              {/* Headline */}
              <h2
                id="player-story-title"
                className="text-xl sm:text-2xl font-bold text-[#E8ECF1] [data-theme=light]:text-stone-900 leading-snug mb-5"
              >
                {activeArticle.title}
              </h2>

              {/* Live Synced Captions Region */}
              <div
                ref={captionScrollContainerRef}
                aria-live="polite"
                className="max-h-[220px] overflow-y-auto pr-2 space-y-3 mb-6"
              >
                {script?.sentences.map((sentence, idx) => {
                  const isCurrent = idx === currentSentenceIndex;
                  return (
                    <p
                      key={idx}
                      ref={isCurrent ? activeCaptionRef : null}
                      className={`text-sm sm:text-base leading-relaxed transition-all duration-300 rounded-lg p-2 ${
                        isCurrent
                          ? 'bg-[#FF6B35]/15 text-[#E8ECF1] [data-theme=light]:text-stone-900 font-medium border-l-4 border-[#FF6B35] pl-3'
                          : 'text-[#9AA6B2]/70 [data-theme=light]:text-stone-500 hover:text-[#9AA6B2]'
                      }`}
                    >
                      {sentence}
                    </p>
                  );
                })}
              </div>
            </div>

            {/* Bottom Controls & Attribution Section */}
            <div className="pt-4 border-t border-white/[0.08] [data-theme=light]:border-black/[0.08]">
              
              {/* Sentence Progress Bar */}
              <div className="w-full bg-white/[0.08] [data-theme=light]:bg-black/[0.08] h-1.5 rounded-full overflow-hidden mb-4">
                <div
                  className="bg-[#FF6B35] h-full transition-all duration-300 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {/* Playback Controls Row */}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                  {/* Previous */}
                  <button
                    onClick={prevStory}
                    aria-label={t(lang, 'player.previousStory')}
                    className="p-2 rounded-xl text-[#9AA6B2] hover:text-white hover:bg-white/[0.06] transition-colors"
                  >
                    <PrevIcon className="w-5 h-5" />
                  </button>

                  {/* Play / Pause */}
                  <button
                    onClick={togglePlayPause}
                    aria-label={isPlaying ? t(lang, 'player.pause') : t(lang, 'player.play')}
                    className="p-3 rounded-2xl bg-[#FF6B35] text-white hover:bg-[#FA581D] shadow-md transition-all active:scale-95"
                  >
                    {isPlaying ? <PauseIcon className="w-5 h-5" /> : <PlayIcon className="w-5 h-5" />}
                  </button>

                  {/* Stop */}
                  <button
                    onClick={closeStory}
                    aria-label={t(lang, 'player.stop')}
                    className="p-2 rounded-xl text-[#9AA6B2] hover:text-white hover:bg-white/[0.06] transition-colors"
                  >
                    <StopIcon className="w-5 h-5" />
                  </button>

                  {/* Next */}
                  <button
                    onClick={nextStory}
                    aria-label={t(lang, 'player.nextStory')}
                    className="p-2 rounded-xl text-[#9AA6B2] hover:text-white hover:bg-white/[0.06] transition-colors"
                  >
                    <NextIcon className="w-5 h-5" />
                  </button>
                </div>

                {/* Speed Multiplier Select */}
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-[#6C7A89] [data-theme=light]:text-stone-400">
                    {t(lang, 'player.speed')}:
                  </span>
                  {[0.75, 1.0, 1.25, 1.5].map((s) => (
                    <button
                      key={s}
                      onClick={() => setRate(s)}
                      className={`text-xs px-2 py-1 rounded-md font-mono transition-colors ${
                        rate === s
                          ? 'bg-[#FF6B35] text-white'
                          : 'bg-white/[0.04] [data-theme=light]:bg-black/[0.04] text-[#9AA6B2] hover:text-white'
                      }`}
                    >
                      {s}×
                    </button>
                  ))}
                </div>
              </div>

              {/* Attribution & Legal Notice */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-[#6C7A89] [data-theme=light]:text-stone-500 gap-1.5 pt-2">
                <a
                  href={activeArticle.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[#FF6B35] hover:underline font-medium"
                >
                  <span>{t(lang, 'player.readFullStory', { source: activeArticle.source.name })}</span>
                  <ExternalLinkIcon className="w-3.5 h-3.5" />
                </a>
                <span className="text-[11px] opacity-75">
                  {t(lang, 'player.copyrightNotice', { source: activeArticle.source.name })}
                </span>
              </div>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
