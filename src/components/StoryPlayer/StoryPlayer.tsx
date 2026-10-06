/**
 * Accessible, Responsive Story Player with Dedicated In-App Video Division,
 * Interactive Word & Sentence Narration Karaoke, and Seekable Playtime Loader.
 *
 * Interactivity Enhancements:
 * 1. Word & Sentence Narration Interactivity:
 *    - Click on ANY sentence or word to instantly seek and play narration from that point.
 *    - Live word-level highlighting as narration speaks.
 *    - Visual cue on hover ("▶ Play from here").
 * 2. Playtime Scrubber & Loader:
 *    - Real-time playtime indicators (current time vs total duration, e.g. 0:14 / 0:48).
 *    - Click & drag scrubber timeline with live preview tooltip.
 *    - Sentence markers on the timeline for chapter-like precision.
 *    - Animated audio equalizer waves during live voice output.
 *    - Quick -10s / +10s navigation controls.
 */
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { usePlayer } from '../../context/PlayerContext';
import { usePrefs } from '../../context/PrefsContext';
import { t } from '../../i18n/useI18n';
import categoriesData from '../../config/categories.json';
import { newsService } from '../../services/newsService';
import type { CategoryInfo, VideoMatch, VideoOption } from '../../types';

const categories: CategoryInfo[] = categoriesData as CategoryInfo[];

function formatSeconds(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export const StoryPlayer: React.FC = () => {
  const {
    activeArticle,
    isPlaying,
    currentSentenceIndex,
    currentWordIndex,
    currentGlobalWordIndex,
    totalWords,
    storyWords,
    script,
    rate,
    hasVoiceForLanguage,
    currentTimeSeconds,
    totalDurationSeconds,
    progressPercent,
    isBuffering,
    closeStory,
    togglePlayPause,
    nextStory,
    prevStory,
    setRate,
    seekToSentence,
    seekToWord,
    seekToProgress,
    skipSeconds
  } = usePlayer();

  const { preferences } = usePrefs();
  const lang = preferences.language;

  const [activeMediaTab, setActiveMediaTab] = useState<'image' | 'video'>('image');
  const [videoMatch, setVideoMatch] = useState<VideoMatch | null>(null);
  const [selectedOption, setSelectedOption] = useState<VideoOption | null>(null);
  const [, setIsCheckingVideos] = useState<boolean>(false);

  // Buttery-smooth word-level scrubber states
  const [isScrubbing, setIsScrubbing] = useState<boolean>(false);
  const [scrubbingRatio, setScrubbingRatio] = useState<number | null>(null);
  const [hoverPosition, setHoverPosition] = useState<number | null>(null);
  const [hoverTimeSeconds, setHoverTimeSeconds] = useState<number | null>(null);
  const [hoverWord, setHoverWord] = useState<string | null>(null);
  const [hoverWordIndex, setHoverWordIndex] = useState<number | null>(null);
  const latestRatioRef = useRef<number>(0);

  const captionScrollContainerRef = useRef<HTMLDivElement>(null);
  const activeCaptionRef = useRef<HTMLDivElement>(null);
  const activeWordRef = useRef<HTMLSpanElement>(null);
  const scrubberTrackRef = useRef<HTMLDivElement>(null);

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

  // Auto-scroll live caption & active spoken word into view smoothly
  useEffect(() => {
    if (activeWordRef.current) {
      activeWordRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'nearest'
      });
    } else if (activeCaptionRef.current) {
      activeCaptionRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      });
    }
  }, [currentSentenceIndex, currentWordIndex]);

  // Smooth modal transition state
  const [isClosing, setIsClosing] = useState<boolean>(false);

  const handleSmoothClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      closeStory();
      setIsClosing(false);
    }, 220);
  }, [closeStory]);

  // Keyboard navigation: Space, Esc, Arrows
  useEffect(() => {
    if (!activeArticle) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleSmoothClose();
      } else if (e.key === ' ' && e.target === document.body) {
        e.preventDefault();
        togglePlayPause();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        skipSeconds(5);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        skipSeconds(-5);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeArticle, closeStory, togglePlayPause, skipSeconds]);

  // Scrubber calculation from mouse position
  const calculateRatioFromEvent = useCallback((e: MouseEvent | React.MouseEvent): number => {
    if (!scrubberTrackRef.current) return 0;
    const rect = scrubberTrackRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    return rect.width > 0 ? x / rect.width : 0;
  }, []);

  const getWordAtRatio = useCallback((ratio: number) => {
    if (totalWords === 0) return { word: null, index: 0 };
    const clamped = Math.max(0, Math.min(1, ratio));
    const targetIdx = Math.min(totalWords - 1, Math.round(clamped * (totalWords - 1)));
    return { word: storyWords[targetIdx] || null, index: targetIdx };
  }, [totalWords, storyWords]);

  const handleScrubberMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsScrubbing(true);
    const startRatio = calculateRatioFromEvent(e);
    setScrubbingRatio(startRatio);
    latestRatioRef.current = startRatio;

    const { word, index } = getWordAtRatio(startRatio);
    setHoverPosition(startRatio * 100);
    setHoverTimeSeconds(Math.round(startRatio * totalDurationSeconds));
    setHoverWord(word ? word.text : null);
    setHoverWordIndex(index);

    const onMouseMove = (moveEvent: MouseEvent) => {
      const moveRatio = calculateRatioFromEvent(moveEvent);
      setScrubbingRatio(moveRatio);
      latestRatioRef.current = moveRatio;

      const info = getWordAtRatio(moveRatio);
      setHoverPosition(moveRatio * 100);
      setHoverTimeSeconds(Math.round(moveRatio * totalDurationSeconds));
      setHoverWord(info.word ? info.word.text : null);
      setHoverWordIndex(info.index);
    };

    const onMouseUp = () => {
      setIsScrubbing(false);
      setScrubbingRatio(null);
      const finalRatio = latestRatioRef.current;
      const targetWordIdx = Math.min(totalWords - 1, Math.max(0, Math.round(finalRatio * (totalWords - 1))));
      // Single smooth commit without audio cancellation flutter
      seekToWord(targetWordIdx);

      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const handleScrubberMouseMove = (e: React.MouseEvent) => {
    if (!scrubberTrackRef.current || totalDurationSeconds <= 0) return;
    const ratio = calculateRatioFromEvent(e);
    const info = getWordAtRatio(ratio);
    setHoverPosition(ratio * 100);
    setHoverTimeSeconds(Math.round(ratio * totalDurationSeconds));
    setHoverWord(info.word ? info.word.text : null);
    setHoverWordIndex(info.index);
  };

  const handleScrubberMouseLeave = () => {
    if (!isScrubbing) {
      setHoverPosition(null);
      setHoverTimeSeconds(null);
      setHoverWord(null);
      setHoverWordIndex(null);
    }
  };

  if (!activeArticle) return null;

  const categoryInfo = categories.find(c => c.id === activeArticle.category) || categories[0];
  const categoryLabel = categoryInfo.label[lang] || categoryInfo.label.en;
  const hasVideoOptions = Boolean(videoMatch && videoMatch.options.length > 0);
  const currentVideo = selectedOption || videoMatch?.primary;

  const effectivePercent = scrubbingRatio !== null ? scrubbingRatio * 100 : progressPercent;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="player-story-title"
      className={`fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 md:p-6 transition-all duration-300 ${
        isClosing ? 'animate-backdrop-out pointer-events-none' : 'animate-backdrop-in'
      } bg-black/85 backdrop-blur-md`}
    >
      {/* Click Backdrop to close */}
      <div
        className="absolute inset-0 cursor-pointer"
        onClick={handleSmoothClose}
        aria-hidden="true"
      />

      {/* Main Player Modal Window with Smooth Cell Opening Transition */}
      <div
        key={activeArticle.id}
        className={`relative z-10 w-full h-full sm:h-auto sm:max-h-[92vh] max-w-5xl rounded-none sm:rounded-3xl bg-[#171C24] [data-theme=light]:bg-white border border-white/[0.08] [data-theme=light]:border-black/[0.08] shadow-2xl flex flex-col overflow-hidden will-change-transform ${
          isClosing ? 'animate-cell-close' : 'animate-cell-open'
        }`}
      >
        
        {/* Top Floating Close Button */}
        <button
          onClick={handleSmoothClose}
          aria-label={t(lang, 'player.close')}
          className="absolute top-4 right-4 z-30 p-2 rounded-full bg-black/60 text-white/80 hover:text-white hover:bg-black/80 backdrop-blur-md transition-all cursor-pointer"
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
                  className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors cursor-pointer ${
                    activeMediaTab === 'image'
                      ? 'bg-[#FF6B35] text-white shadow-xs'
                      : 'text-[#9AA6B2] hover:text-white'
                  }`}
                >
                  Photo
                </button>
                <button
                  onClick={() => setActiveMediaTab('video')}
                  className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                    activeMediaTab === 'video'
                      ? 'bg-[#FF6B35] text-white shadow-xs'
                      : 'text-[#9AA6B2] hover:text-white'
                  }`}
                >
                  <span>▶</span>
                  <span>Video Report</span>
                </button>
              </div>
            )}

            {/* TAB 1: Photo View with Ken Burns Pan */}
            {activeMediaTab === 'image' && (
              <div className="relative w-full h-full overflow-hidden bg-black flex items-center justify-center">
                {activeArticle.image ? (
                  <img
                    src={activeArticle.image.url}
                    alt={activeArticle.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover animate-ken-burns"
                  />
                ) : (
                  <div
                    className="w-full h-full flex flex-col items-center justify-center p-8 text-center"
                    style={{
                      background: `linear-gradient(135deg, ${categoryInfo.color}30 0%, #171C24 100%)`
                    }}
                  >
                    <span className="text-4xl mb-3">{categoryInfo.icon}</span>
                    <h4 className="text-base font-semibold text-white/90 max-w-sm">
                      {activeArticle.title}
                    </h4>
                  </div>
                )}
                {/* Cinematic Vignette Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none" />
              </div>
            )}

            {/* TAB 2: In-App Video Player Division */}
            {activeMediaTab === 'video' && hasVideoOptions && currentVideo && (
              <div className="relative w-full h-full bg-black flex flex-col">
                <div className="relative w-full aspect-video md:h-full">
                  <iframe
                    src={`${currentVideo.embedUrl}&autoplay=1`}
                    title={currentVideo.title}
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </div>

                {/* Multiple video options selector */}
                {videoMatch && videoMatch.options.length > 1 && (
                  <div className="p-2.5 bg-[#12151B] border-t border-white/10 flex items-center gap-2 overflow-x-auto">
                    <span className="text-[10px] uppercase tracking-wider text-[#6C7A89] shrink-0 font-medium">
                      Sources:
                    </span>
                    {videoMatch.options.map((opt, i) => (
                      <button
                        key={opt.youtubeId}
                        onClick={() => setSelectedOption(opt)}
                        className={`text-xs px-2.5 py-1 rounded-lg shrink-0 transition-colors cursor-pointer ${
                          currentVideo.youtubeId === opt.youtubeId
                            ? 'bg-[#FF6B35]/20 text-[#FF6B35] border border-[#FF6B35]/40 font-semibold'
                            : 'bg-white/5 text-[#9AA6B2] hover:bg-white/10'
                        }`}
                      >
                        {opt.channel || `Report ${i + 1}`}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Content Pane */}
          <div className="p-6 sm:p-8 flex flex-col justify-between overflow-y-auto">
            <div>
              {/* Category, City, & Source Header */}
              <div className="flex items-center gap-2 mb-3">
                <span
                  className="text-xs font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-lg"
                  style={{
                    backgroundColor: `${categoryInfo.color}20`,
                    color: categoryInfo.color
                  }}
                >
                  {categoryLabel}
                </span>
                {activeArticle.cities.length > 0 && (
                  <span className="text-xs text-[#9AA6B2] [data-theme=light]:text-stone-600 bg-white/[0.05] [data-theme=light]:bg-black/[0.05] px-2 py-0.5 rounded-lg">
                    {activeArticle.cities[0]}
                  </span>
                )}
                <span className="text-xs text-[#6C7A89] [data-theme=light]:text-stone-400 ml-auto font-medium">
                  {activeArticle.source.name}
                </span>
              </div>

              {/* Headline */}
              <h2
                id="player-story-title"
                className="text-lg sm:text-xl font-bold text-[#E8ECF1] [data-theme=light]:text-stone-900 leading-tight mb-4"
              >
                {activeArticle.title}
              </h2>

              {/* Live Interactive Word & Sentence Narration Division */}
              <div className="mb-2 flex items-center justify-between text-xs text-[#6C7A89]">
                <div className="font-medium flex items-center gap-1.5">
                  <span className="text-sm">🎙️</span>
                  <span>Interactive Transcript</span>
                  {isPlaying && (
                    <span className="ml-2 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-semibold flex items-center gap-1 animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      Live Speaking
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-[#FF6B35]/80">
                  Click any sentence or word to jump
                </span>
              </div>

              <div
                ref={captionScrollContainerRef}
                className="space-y-2 mb-6 max-h-[220px] overflow-y-auto pr-1.5 custom-scrollbar select-none"
              >
                {script && script.sentences.length > 0 ? (
                  script.sentences.map((sentence, sIdx) => {
                    const isCurrent = sIdx === currentSentenceIndex;
                    const isPassed = sIdx < currentSentenceIndex;
                    const words = sentence.split(/\s+/).filter(Boolean);

                    return (
                      <div
                        key={sIdx}
                        ref={isCurrent ? activeCaptionRef : undefined}
                        onClick={() => seekToSentence(sIdx)}
                        title="Click to jump narration here"
                        className={`group relative text-sm sm:text-[15px] leading-relaxed transition-all duration-200 cursor-pointer rounded-xl p-2.5 ${
                          isCurrent
                            ? 'text-white [data-theme=light]:text-stone-950 font-medium bg-[#FF6B35]/15 border-l-4 border-[#FF6B35] shadow-xs'
                            : isPassed
                            ? 'text-[#9AA6B2] [data-theme=light]:text-stone-700 hover:bg-white/[0.04] [data-theme=light]:hover:bg-black/[0.04]'
                            : 'text-[#6C7A89] [data-theme=light]:text-stone-400 opacity-80 hover:opacity-100 hover:bg-white/[0.04]'
                        }`}
                      >
                        {/* Play marker on hover */}
                        <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-[10px] bg-[#FF6B35] text-white px-1.5 py-0.5 rounded font-semibold flex items-center gap-1 shadow-sm">
                            <span>▶</span>
                            <span>Play</span>
                          </span>
                        </div>

                        {/* Interactive Word Karaoke Highlights */}
                        <p className="flex flex-wrap gap-x-1.5 gap-y-1">
                          {words.map((word, wIdx) => {
                            const isCurrentWord = isCurrent && isPlaying && wIdx === currentWordIndex;
                            const isPassedWordInCurrent = isCurrent && isPlaying && wIdx < currentWordIndex;
                            const matchWord = storyWords.find(sw => sw.sentenceIndex === sIdx && sw.wordIndex === wIdx);
                            const globalWordIdx = matchWord ? matchWord.globalIndex : 0;

                            return (
                              <span
                                key={wIdx}
                                ref={isCurrentWord ? activeWordRef : undefined}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  seekToWord(globalWordIdx);
                                }}
                                title={`Click to play from "${word}"`}
                                className={`inline-block rounded px-1.5 py-0.5 transition-all duration-100 cursor-pointer ${
                                  isCurrentWord
                                    ? 'bg-[#FF6B35] text-white font-bold scale-110 shadow-md ring-2 ring-[#FF6B35]/50'
                                    : isPassedWordInCurrent
                                    ? 'text-white [data-theme=light]:text-stone-900 font-semibold opacity-100'
                                    : isCurrent
                                    ? 'text-white/60 [data-theme=light]:text-stone-500 font-normal hover:text-[#FF6B35]'
                                    : 'hover:text-[#FF6B35]'
                                }`}
                              >
                                {word}
                              </span>
                            );
                          })}
                        </p>
                      </div>
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
            <div className="pt-3 border-t border-white/[0.08] [data-theme=light]:border-black/[0.08] space-y-3">
              
              {/* Interactive Playtime Scrubber & Loader */}
              <div className="space-y-1">
                {/* Clickable and Draggable Scrubber Timeline */}
                <div
                  ref={scrubberTrackRef}
                  onMouseDown={handleScrubberMouseDown}
                  onMouseMove={handleScrubberMouseMove}
                  onMouseLeave={handleScrubberMouseLeave}
                  className="relative w-full py-2 cursor-pointer group select-none"
                  title="Click or drag to seek in narration"
                >
                  {/* Track Background */}
                  <div className="w-full bg-white/[0.12] [data-theme=light]:bg-black/[0.1] h-2 rounded-full overflow-hidden relative group-hover:h-2.5 transition-all">
                    {/* Buffering Shimmer */}
                    {isBuffering && (
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
                    )}

                    {/* Sentence Chapter Tick Marks */}
                    {script && script.sentences.length > 1 && (
                      <div className="absolute inset-0 flex justify-between pointer-events-none px-0.5">
                        {script.sentences.map((_, i) => (
                          <div
                            key={i}
                            className="w-0.5 h-full bg-black/40 [data-theme=light]:bg-white/40"
                          />
                        ))}
                      </div>
                    )}

                    {/* Active Progress Fill - Smooth Word-by-Word Timeline */}
                    <div
                      className="bg-gradient-to-r from-[#FF6B35] to-[#FA581D] h-full transition-[width] duration-100 ease-linear"
                      style={{ width: `${effectivePercent}%` }}
                    />
                  </div>

                  {/* Scrubber Knob / Thumb with word-level precision */}
                  <div
                    className={`absolute top-1/2 -translate-y-1/2 -ml-2.5 w-5 h-5 rounded-full bg-white shadow-xl border-2 border-[#FF6B35] pointer-events-none transition-transform duration-100 flex items-center justify-center ${
                      isScrubbing ? 'scale-110 ring-4 ring-[#FF6B35]/35' : 'scale-0 group-hover:scale-100'
                    }`}
                    style={{ left: `${effectivePercent}%` }}
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-[#FF6B35]" />
                  </div>

                  {/* Hover/Scrub Time & Word Tooltip */}
                  {(hoverPosition !== null || isScrubbing) && hoverTimeSeconds !== null && (
                    <div
                      className="absolute -top-9 -translate-x-1/2 px-2.5 py-1 rounded-lg bg-stone-900/95 text-white text-[10px] font-mono shadow-2xl border border-white/15 pointer-events-none z-30 flex items-center gap-1.5 whitespace-nowrap backdrop-blur-md"
                      style={{ left: `${effectivePercent}%` }}
                    >
                      <span className="font-bold text-[#FF6B35]">{formatSeconds(hoverTimeSeconds)}</span>
                      {hoverWord && (
                        <>
                          <span className="text-white/40">•</span>
                          <span className="text-white font-sans font-medium max-w-[120px] truncate">"{hoverWord}"</span>
                        </>
                      )}
                      {hoverWordIndex !== null && totalWords > 0 && (
                        <span className="text-[9px] text-[#9AA6B2] font-sans">
                          ({hoverWordIndex + 1}/{totalWords})
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Playtime Timers & Live Audio Equalizer Indicators */}
                <div className="flex items-center justify-between text-xs text-[#9AA6B2] [data-theme=light]:text-stone-600 font-mono">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[#E8ECF1] [data-theme=light]:text-stone-900">
                      {formatSeconds(currentTimeSeconds)}
                    </span>
                    <span>/</span>
                    <span>{formatSeconds(totalDurationSeconds)}</span>

                    {/* Live Voice Audio Wave Equalizer */}
                    {isPlaying && (
                      <div className="flex items-end gap-0.5 h-3.5 ml-2" title="Voice Playing">
                        <span className="w-1 h-2 bg-[#FF6B35] rounded-full animate-pulse" />
                        <span className="w-1 h-3.5 bg-[#FF6B35] rounded-full animate-bounce" />
                        <span className="w-1 h-2.5 bg-[#FF6B35] rounded-full animate-pulse" />
                        <span className="w-1 h-1.5 bg-[#FF6B35] rounded-full animate-bounce" />
                      </div>
                    )}

                    {isBuffering && (
                      <span className="text-[10px] text-[#FF6B35] animate-pulse font-sans">
                        Buffering...
                      </span>
                    )}
                  </div>

                  <div className="text-[11px] font-sans text-[#6C7A89] flex items-center gap-1.5">
                    <span>Word {totalWords > 0 ? currentGlobalWordIndex + 1 : 0} of {totalWords}</span>
                    <span>•</span>
                    <span>Sentence {currentSentenceIndex + 1} of {script?.sentences.length || 1}</span>
                  </div>
                </div>
              </div>

              {/* Audio & Navigation Controls Bar */}
              <div className="flex items-center justify-between pt-1">
                
                {/* Playback Rate Selector (0.8x, 1x, 1.2x) */}
                <div className="flex items-center gap-1 bg-white/[0.05] [data-theme=light]:bg-black/[0.05] p-1 rounded-xl">
                  {[0.8, 1.0, 1.2].map((r) => (
                    <button
                      key={r}
                      onClick={() => setRate(r)}
                      className={`px-2 py-0.5 text-xs rounded-lg font-medium transition-colors cursor-pointer ${
                        rate === r
                          ? 'bg-[#FF6B35] text-white'
                          : 'text-[#9AA6B2] [data-theme=light]:text-stone-600 hover:text-white'
                      }`}
                    >
                      {r}x
                    </button>
                  ))}
                </div>

                {/* Primary Transport & Quick Seek Buttons */}
                <div className="flex items-center gap-2 sm:gap-3">
                  {/* Previous Story */}
                  <button
                    onClick={prevStory}
                    aria-label={t(lang, 'player.prevStory')}
                    title="Previous Story"
                    className="p-2 rounded-full hover:bg-white/[0.08] [data-theme=light]:hover:bg-black/[0.08] text-[#9AA6B2] [data-theme=light]:text-stone-600 transition-colors cursor-pointer"
                  >
                    <PrevIcon className="w-5 h-5" />
                  </button>

                  {/* Skip Back 10 Seconds */}
                  <button
                    onClick={() => skipSeconds(-10)}
                    aria-label="Skip back 10 seconds"
                    title="Rewind 10s"
                    className="p-1.5 rounded-full hover:bg-white/[0.08] [data-theme=light]:hover:bg-black/[0.08] text-[#9AA6B2] [data-theme=light]:text-stone-600 transition-colors text-xs font-semibold flex items-center justify-center cursor-pointer"
                  >
                    <span>-10s</span>
                  </button>

                  {/* Main Play / Pause */}
                  <button
                    onClick={togglePlayPause}
                    aria-label={isPlaying ? t(lang, 'player.pause') : t(lang, 'player.play')}
                    className="w-12 h-12 rounded-full bg-[#FF6B35] hover:bg-[#FA581D] text-white flex items-center justify-center shadow-lg transition-transform active:scale-95 cursor-pointer"
                  >
                    {isPlaying ? (
                      <PauseIcon className="w-6 h-6" />
                    ) : (
                      <PlayIcon className="w-6 h-6 ml-0.5" />
                    )}
                  </button>

                  {/* Skip Forward 10 Seconds */}
                  <button
                    onClick={() => skipSeconds(10)}
                    aria-label="Skip forward 10 seconds"
                    title="Forward 10s"
                    className="p-1.5 rounded-full hover:bg-white/[0.08] [data-theme=light]:hover:bg-black/[0.08] text-[#9AA6B2] [data-theme=light]:text-stone-600 transition-colors text-xs font-semibold flex items-center justify-center cursor-pointer"
                  >
                    <span>+10s</span>
                  </button>

                  {/* Next Story */}
                  <button
                    onClick={nextStory}
                    aria-label={t(lang, 'player.nextStory')}
                    title="Next Story"
                    className="p-2 rounded-full hover:bg-white/[0.08] [data-theme=light]:hover:bg-black/[0.08] text-[#9AA6B2] [data-theme=light]:text-stone-600 transition-colors cursor-pointer"
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
                  <span className="hidden sm:inline">{t(lang, 'player.readFull')}</span>
                  <ExternalLinkIcon className="w-4 h-4" />
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
