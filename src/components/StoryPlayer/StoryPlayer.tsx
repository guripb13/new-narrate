/**
 * Accessible, Responsive Story Player with Dedicated In-App Video Division
 * Enforces S3, S5, S6, S8, S9, A3, A7 specifications.
 * Automatically verifies video availability; drops unavailable options per-story.
 * Zero external redirects - user plays and watches videos directly inside the website.
 */
import React, { useEffect, useRef, useState } from 'react';
import { usePlayer } from '../../context/PlayerContext';
import { usePrefs } from '../../context/PrefsContext';
import { t } from '../../i18n/useI18n';
import categoriesData from '../../config/categories.json';
import { newsService } from '../../services/newsService';
import type { CategoryInfo, VideoMatch, VideoOption } from '../../types';

const categories: CategoryInfo[] = categoriesData as CategoryInfo[];

export const StoryPlayer: React.FC = () => {
  const {
    activeArticle,
    isPlaying,
    currentSentenceIndex,
    script,
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
  const [selectedOption, setSelectedOption] = useState<VideoOption | null>(null);
  const [isCheckingVideos, setIsCheckingVideos] = useState<boolean>(false);
  const captionScrollContainerRef = useRef<HTMLDivElement>(null);
  const activeCaptionRef = useRef<HTMLParagraphElement>(null);

  // Automatically check video availability in backend on story open
  useEffect(() => {
    let isMounted = true;
    if (activeArticle) {
      setActiveMediaTab('image');
      setSelectedOption(null);
      setVideoMatch(null);
      setIsCheckingVideos(true);

      newsService.getVerifiedVideoForArticle(activeArticle).then((matched) => {
        if (!isMounted) return;
        setIsCheckingVideos(false);
        if (matched && matched.options.length > 0) {
          setVideoMatch(matched);
          setSelectedOption(matched.primary);
        } else {
          setVideoMatch(null);
          setSelectedOption(null);
        }
      }).catch(() => {
        if (isMounted) setIsCheckingVideos(false);
      });
    }
    return () => {
      isMounted = false;
    };
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

  const hasVideoOptions = Boolean(videoMatch && videoMatch.options.length > 0);
  const currentVideo = selectedOption || videoMatch?.primary;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="player-story-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md transition-opacity duration-300"
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
            
            {/* Media Tabs: ONLY shown if this specific cell has verified working video options */}
            {hasVideoOptions && (
              <div className="absolute top-4 left-4 z-20 flex items-center bg-black/75 backdrop-blur-md p-1 rounded-xl border border-white/10 shadow-lg">
                <button
                  onClick={() => setActiveMediaTab('image')}
                  className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors ${
                    activeMediaTab === 'image'
                      ? 'bg-white text-black font-semibold'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  {t(lang, 'player.imageTab')}
                </button>
                <button
                  onClick={() => {
                    setActiveMediaTab('video');
                    if (isPlaying) {
                      togglePlayPause();
                    }
                  }}
                  className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors ${
                    activeMediaTab === 'video'
                      ? 'bg-[#FF6B35] text-white font-semibold'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  ▶ {t(lang, 'player.videoTab')} ({videoMatch?.options.length})
                </button>
              </div>
            )}

            {/* In-App Video Player Division */}
            {activeMediaTab === 'video' && hasVideoOptions && currentVideo ? (
              <div className="video-player-division w-full h-full flex flex-col justify-between bg-black relative">
                
                {/* Specific Channel Video Options Switcher for this exact news item */}
                {videoMatch && videoMatch.options.length > 1 && (
                  <div className="flex items-center gap-1.5 overflow-x-auto py-2 px-3 bg-zinc-950/95 border-b border-white/10 text-[11px] no-scrollbar shrink-0">
                    <span className="text-white/50 shrink-0 font-medium mr-1">Available Videos:</span>
                    {videoMatch.options.map((opt, idx) => {
                      const isSelected = currentVideo.youtubeId === opt.youtubeId;
                      return (
                        <button
                          key={opt.youtubeId}
                          type="button"
                          onClick={() => setSelectedOption(opt)}
                          className={`px-2.5 py-1 rounded-lg shrink-0 transition-colors flex items-center gap-1.5 ${
                            isSelected
                              ? 'bg-[#FF6B35] text-white font-semibold shadow-xs'
                              : 'bg-white/10 text-white/75 hover:bg-white/20'
                          }`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          <span>{opt.channel}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Video Player Division Container (plays natively on this website) */}
                <div className="w-full flex-1 flex items-center justify-center bg-black min-h-[260px] relative">
                  <iframe
                    key={currentVideo.youtubeId}
                    src={`https://www.youtube-nocookie.com/embed/${currentVideo.youtubeId}?autoplay=0&rel=0&modestbranding=1&controls=1`}
                    title={currentVideo.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    className="w-full h-full min-h-[260px] border-0"
                  />
                </div>

                {/* Division Info Caption (strictly in-app, NO external redirect links) */}
                <div className="px-4 py-2.5 text-xs text-white/80 bg-zinc-950 border-t border-white/10 flex items-center justify-between">
                  <div className="truncate mr-3">
                    <span className="font-semibold text-white">{currentVideo.channel}</span>
                    <span className="text-white/40 mx-2">•</span>
                    <span className="text-white/70">{currentVideo.title}</span>
                  </div>
                  <span className="text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-500/20 px-2 py-0.5 rounded-full shrink-0 font-medium">
                    ● Verified Active
                  </span>
                </div>
              </div>
            ) : (
              /* Image Pane with Ken Burns Effect */
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

          {/* Content Pane */}
          <div className="p-6 md:p-8 flex flex-col justify-between overflow-y-auto">
            <div>
              {/* Category, City, Source Header */}
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span
                  className="text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded-md"
                  style={{
                    backgroundColor: `${categoryInfo.color}20`,
                    color: categoryInfo.color
                  }}
                >
                  {categoryLabel}
                </span>

                {activeArticle.cities.length > 0 && (
                  <span className="text-xs text-[#9AA6B2] [data-theme=light]:text-stone-600 bg-white/[0.05] [data-theme=light]:bg-black/[0.05] px-2 py-0.5 rounded-md">
                    📍 {activeArticle.cities.join(', ')}
                  </span>
                )}

                <span className="text-xs text-[#6C7A89] [data-theme=light]:text-stone-400">
                  {activeArticle.source.name}
                </span>

                {/* Per-Cell Video Availability Status */}
                {hasVideoOptions && (
                  <span className="text-[10px] text-emerald-400 bg-emerald-950/40 border border-emerald-500/20 px-2 py-0.5 rounded-md ml-auto">
                    ▶ {videoMatch?.options.length} Video{videoMatch && videoMatch.options.length > 1 ? 's' : ''} Available
                  </span>
                )}
              </div>

              {/* Story Title */}
              <h2
                id="player-story-title"
                className="text-xl sm:text-2xl font-bold text-[#E8ECF1] [data-theme=light]:text-stone-900 leading-tight mb-4"
              >
                {activeArticle.title}
              </h2>

              {/* Paragraphs with Live Sentence Karaoke Highlights */}
              <div
                ref={captionScrollContainerRef}
                className="space-y-3 mb-6 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar"
              >
                {script && script.sentences.length > 0 ? (
                  script.sentences.map((sentence, idx) => {
                    const isCurrent = idx === currentSentenceIndex;
                    const isPassed = idx < currentSentenceIndex;

                    return (
                      <p
                        key={idx}
                        ref={isCurrent ? activeCaptionRef : undefined}
                        className={`text-sm sm:text-base leading-relaxed transition-all duration-200 ${
                          isCurrent
                            ? 'text-white [data-theme=light]:text-stone-950 font-medium bg-[#FF6B35]/15 px-2 py-1 rounded-lg border-l-2 border-[#FF6B35]'
                            : isPassed
                            ? 'text-[#9AA6B2] [data-theme=light]:text-stone-700'
                            : 'text-[#6C7A89] [data-theme=light]:text-stone-400 opacity-80'
                        }`}
                      >
                        {sentence}
                      </p>
                    );
                  })
                ) : (
                  <p className="text-sm sm:text-base leading-relaxed text-[#9AA6B2] [data-theme=light]:text-stone-700">
                    {activeArticle.summary}
                  </p>
                )}
              </div>
            </div>

            {/* Bottom Controls Area */}
            <div className="pt-4 border-t border-white/[0.08] [data-theme=light]:border-black/[0.08] space-y-4">
              
              {/* Progress Bar */}
              <div className="w-full bg-white/[0.08] [data-theme=light]:bg-black/[0.08] h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-[#FF6B35] h-full transition-all duration-300 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {/* Audio & Navigation Controls Bar */}
              <div className="flex items-center justify-between">
                
                {/* Playback Rate Selector (0.8x, 1x, 1.2x) */}
                <div className="flex items-center gap-1 bg-white/[0.05] [data-theme=light]:bg-black/[0.05] p-1 rounded-xl">
                  {[0.8, 1.0, 1.2].map((r) => (
                    <button
                      key={r}
                      onClick={() => setRate(r)}
                      className={`px-2 py-0.5 text-xs rounded-lg font-medium transition-colors ${
                        rate === r
                          ? 'bg-[#FF6B35] text-white'
                          : 'text-[#9AA6B2] [data-theme=light]:text-stone-600 hover:text-white'
                      }`}
                    >
                      {r}x
                    </button>
                  ))}
                </div>

                {/* Primary Transport Buttons */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={prevStory}
                    aria-label={t(lang, 'player.prevStory')}
                    className="p-2 rounded-full hover:bg-white/[0.08] [data-theme=light]:hover:bg-black/[0.08] text-[#9AA6B2] [data-theme=light]:text-stone-600 transition-colors"
                  >
                    <PrevIcon className="w-5 h-5" />
                  </button>

                  <button
                    onClick={togglePlayPause}
                    aria-label={isPlaying ? t(lang, 'player.pause') : t(lang, 'player.play')}
                    className="w-12 h-12 rounded-full bg-[#FF6B35] hover:bg-[#FA581D] text-white flex items-center justify-center shadow-lg transition-transform active:scale-95"
                  >
                    {isPlaying ? (
                      <PauseIcon className="w-6 h-6" />
                    ) : (
                      <PlayIcon className="w-6 h-6 ml-0.5" />
                    )}
                  </button>

                  <button
                    onClick={nextStory}
                    aria-label={t(lang, 'player.nextStory')}
                    className="p-2 rounded-full hover:bg-white/[0.08] [data-theme=light]:hover:bg-black/[0.08] text-[#9AA6B2] [data-theme=light]:text-stone-600 transition-colors"
                  >
                    <NextIcon className="w-5 h-5" />
                  </button>
                </div>

                {/* Publisher Full Article Link */}
                <a
                  href={activeArticle.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-[#9AA6B2] hover:text-[#FF6B35] transition-colors"
                >
                  <span>{t(lang, 'player.readFull')}</span>
                  <ExternalLinkIcon className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// UI Icons
const PlayIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M8 5v14l11-7z" />
  </svg>
);

const PauseIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
  </svg>
);

const NextIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="5 4 15 12 5 20 5 4" fill="currentColor" />
    <line x1="19" y1="5" x2="19" y2="19" />
  </svg>
);

const PrevIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="19 20 9 12 19 4 19 20" fill="currentColor" />
    <line x1="5" y1="19" x2="5" y2="5" />
  </svg>
);

const CloseIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const ExternalLinkIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);
