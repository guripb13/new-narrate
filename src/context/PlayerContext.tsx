/**
 * Story Player & Briefing Playback Context
 * Manages active story, live interactive sentence/word captions, seekable playtime loader,
 * controls, and briefing mode.
 * 
 * Tracks playback in respect to each individual word across the story.
 */
import React, { createContext, useContext, useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { ttsEngine } from '../tts/ttsEngine';
import { buildScript, ScriptOutput } from '../narration/buildScript';
import { usePrefs } from './PrefsContext';
import type { Article } from '../types';

export interface StoryWord {
  sentenceIndex: number;
  wordIndex: number;
  text: string;
  globalIndex: number;
}

interface PlayerContextType {
  activeArticle: Article | null;
  script: ScriptOutput | null;
  storyWords: StoryWord[];
  currentSentenceIndex: number;
  currentWordIndex: number;
  currentGlobalWordIndex: number;
  totalWords: number;
  isPlaying: boolean;
  rate: number;
  isBriefingMode: boolean;
  hasVoiceForLanguage: boolean;
  currentTimeSeconds: number;
  totalDurationSeconds: number;
  progressPercent: number;
  isBuffering: boolean;
  openStory: (article: Article, storyList?: Article[]) => void;
  closeStory: () => void;
  togglePlayPause: () => void;
  nextStory: () => void;
  prevStory: () => void;
  setRate: (rate: number) => void;
  seekToSentence: (sentenceIndex: number) => void;
  seekToWord: (globalWordIndex: number) => void;
  seekToProgress: (ratio: number) => void;
  skipSeconds: (seconds: number) => void;
  startBriefing: (stories: Article[]) => void;
  stopBriefing: () => void;
}

const PlayerContext = createContext<PlayerContextType | null>(null);

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { preferences } = usePrefs();
  const [activeArticle, setActiveArticle] = useState<Article | null>(null);
  const [script, setScript] = useState<ScriptOutput | null>(null);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState<number>(0);
  const [currentWordIndex, setCurrentWordIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isBuffering, setIsBuffering] = useState<boolean>(false);
  const [rate, setPlaybackRate] = useState<number>(preferences.narration.rate || 1.0);
  const [isBriefingMode, setIsBriefingMode] = useState<boolean>(false);
  const [hasVoiceForLanguage, setHasVoiceForLanguage] = useState<boolean>(true);
  const [currentTimeSeconds, setCurrentTimeSeconds] = useState<number>(0);

  const playlistRef = useRef<Article[]>([]);
  const currentIndexRef = useRef<number>(-1);
  const briefingTimerRef = useRef<number | null>(null);
  const sentenceStartTimeRef = useRef<number>(Date.now());

  // Extract all individual words mapped across the entire story
  const storyWords = useMemo<StoryWord[]>(() => {
    if (!script || script.sentences.length === 0) return [];
    const list: StoryWord[] = [];
    let global = 0;
    script.sentences.forEach((s, sIdx) => {
      const words = s.trim().split(/\s+/).filter(Boolean);
      words.forEach((w, wIdx) => {
        list.push({
          sentenceIndex: sIdx,
          wordIndex: wIdx,
          text: w,
          globalIndex: global++
        });
      });
    });
    return list;
  }, [script]);

  const totalWords = storyWords.length;

  // Active word's global index across the whole story
  const currentGlobalWordIndex = useMemo(() => {
    if (totalWords === 0) return 0;
    const match = storyWords.find(
      w => w.sentenceIndex === currentSentenceIndex && w.wordIndex === currentWordIndex
    );
    return match ? match.globalIndex : 0;
  }, [storyWords, totalWords, currentSentenceIndex, currentWordIndex]);

  // Calculate estimated durations for each sentence based on word count & speech rate
  const sentenceDurations = useMemo(() => {
    if (!script || script.sentences.length === 0) return [];
    return script.sentences.map((s) => {
      const wordCount = s.trim().split(/\s+/).filter(Boolean).length;
      return Math.max(1.8, wordCount / (2.5 * rate));
    });
  }, [script, rate]);

  const totalDurationSeconds = useMemo(() => {
    if (sentenceDurations.length === 0) return 30;
    return Math.round(sentenceDurations.reduce((sum, d) => sum + d, 0));
  }, [sentenceDurations]);

  // Check voice availability when language changes
  useEffect(() => {
    if (activeArticle) {
      ttsEngine.hasVoiceForLanguage(activeArticle.language).then(setHasVoiceForLanguage);
    }
  }, [activeArticle]);

  // Clean up speech on unmount
  useEffect(() => {
    return () => {
      ttsEngine.stop();
      if (briefingTimerRef.current) clearTimeout(briefingTimerRef.current);
    };
  }, []);

  // Update real-time elapsed playtime and live word highlighting smoothly while audio is playing
  useEffect(() => {
    if (!isPlaying || !activeArticle || sentenceDurations.length === 0) return;

    const timer = setInterval(() => {
      const durationOfCurrentSentence = Math.max(sentenceDurations[currentSentenceIndex] || 2.5, 0.5);
      const elapsedInSentence = Math.max(0, (Date.now() - sentenceStartTimeRef.current) / 1000);

      // High-precision live word highlighting: calculates current spoken word in real time
      if (script && script.sentences[currentSentenceIndex]) {
        const words = script.sentences[currentSentenceIndex].trim().split(/\s+/).filter(Boolean);
        if (words.length > 0) {
          const ratio = Math.min(0.99, elapsedInSentence / durationOfCurrentSentence);
          const calculatedWordIdx = Math.min(words.length - 1, Math.floor(ratio * words.length));
          setCurrentWordIndex(calculatedWordIdx);
        }
      }

      const priorTime = sentenceDurations
        .slice(0, currentSentenceIndex)
        .reduce((sum, d) => sum + d, 0);

      const current = Math.min(totalDurationSeconds, Math.round(priorTime + Math.min(elapsedInSentence, durationOfCurrentSentence)));
      setCurrentTimeSeconds(current);
    }, 50); // 50ms for ultra-smooth live word tracking

    return () => clearInterval(timer);
  }, [isPlaying, activeArticle, currentSentenceIndex, sentenceDurations, totalDurationSeconds, script]);

  // Progress percent calculated in respect to each individual word
  const progressPercent = useMemo(() => {
    if (totalWords <= 1) return 0;
    return Math.min(100, Math.max(0, (currentGlobalWordIndex / (totalWords - 1)) * 100));
  }, [currentGlobalWordIndex, totalWords]);

  const handleNextStory = useCallback(() => {
    const list = playlistRef.current;
    if (list.length === 0) return;

    const nextIdx = currentIndexRef.current + 1;
    if (nextIdx < list.length) {
      currentIndexRef.current = nextIdx;
      openStory(list[nextIdx]);
    } else {
      closeStory();
    }
  }, []);

  const openStory = (article: Article, storyList?: Article[]) => {
    if (storyList) {
      playlistRef.current = storyList;
      currentIndexRef.current = storyList.findIndex(a => a.id === article.id);
    } else if (playlistRef.current.length === 0) {
      playlistRef.current = [article];
      currentIndexRef.current = 0;
    } else {
      currentIndexRef.current = playlistRef.current.findIndex(a => a.id === article.id);
    }

    setActiveArticle(article);
    setCurrentSentenceIndex(0);
    setCurrentWordIndex(0);
    setCurrentTimeSeconds(0);
    setIsBuffering(true);
    sentenceStartTimeRef.current = Date.now();

    // Build narration script
    const built = buildScript({
      id: article.id,
      title: article.title,
      summary: article.summary,
      source: article.source.name,
      category: article.category,
      city: article.cities[0],
      language: article.language
    });
    setScript(built);

    // Auto-start narration
    ttsEngine.speak(built.sentences, article.language, {
      rate,
      onSentenceStart: (idx) => {
        setIsBuffering(false);
        setCurrentSentenceIndex(idx);
        setCurrentWordIndex(0);
        sentenceStartTimeRef.current = Date.now();
      },
      onWordBoundary: (_sIdx, _charIdx, wIdx) => {
        setCurrentWordIndex(wIdx);
        if (built.sentences[_sIdx]) {
          const words = built.sentences[_sIdx].trim().split(/\s+/).filter(Boolean);
          if (words.length > 0) {
            const sentenceDur = Math.max(sentenceDurations[_sIdx] || 2.5, 0.5);
            const estimatedElapsed = (wIdx / words.length) * sentenceDur;
            sentenceStartTimeRef.current = Date.now() - (estimatedElapsed * 1000);
          }
        }
      },
      onEnd: () => {
        setIsPlaying(false);
        setCurrentTimeSeconds(totalDurationSeconds);
        // Autoplay next or briefing mode
        if (isBriefingMode || preferences.narration.autoplayNext) {
          briefingTimerRef.current = window.setTimeout(() => {
            handleNextStory();
          }, 600);
        }
      },
      onError: (err) => {
        console.warn('TTS playback note:', err);
        setIsPlaying(false);
        setIsBuffering(false);
      }
    });

    setIsPlaying(true);
  };

  const closeStory = () => {
    ttsEngine.stop();
    if (briefingTimerRef.current) clearTimeout(briefingTimerRef.current);
    setActiveArticle(null);
    setScript(null);
    setIsPlaying(false);
    setIsBuffering(false);
    setIsBriefingMode(false);
    setCurrentTimeSeconds(0);
  };

  const togglePlayPause = () => {
    if (isPlaying) {
      ttsEngine.pause();
      setIsPlaying(false);
    } else {
      ttsEngine.resume();
      setIsPlaying(true);
      sentenceStartTimeRef.current = Date.now();
    }
  };

  // Instant Seeking to specific sentence
  const seekToSentence = (targetIndex: number) => {
    if (!script || script.sentences.length === 0) return;
    const clamped = Math.max(0, Math.min(script.sentences.length - 1, targetIndex));
    setCurrentSentenceIndex(clamped);
    setCurrentWordIndex(0);
    sentenceStartTimeRef.current = Date.now();

    const priorTime = sentenceDurations
      .slice(0, clamped)
      .reduce((sum, d) => sum + d, 0);
    setCurrentTimeSeconds(Math.round(priorTime));

    ttsEngine.seekToSentence(clamped);
    setIsPlaying(true);
  };

  // Seeking in respect to each individual word
  const seekToWord = (targetGlobalIndex: number) => {
    if (totalWords === 0) return;
    const clampedGlobal = Math.max(0, Math.min(totalWords - 1, targetGlobalIndex));
    const targetWord = storyWords[clampedGlobal];
    if (!targetWord) return;

    setCurrentSentenceIndex(targetWord.sentenceIndex);
    setCurrentWordIndex(targetWord.wordIndex);

    // Calculate approximate time for this word
    const priorSentenceTime = sentenceDurations
      .slice(0, targetWord.sentenceIndex)
      .reduce((sum, d) => sum + d, 0);
    const wordsInSentence = script?.sentences[targetWord.sentenceIndex]?.trim().split(/\s+/).filter(Boolean).length || 1;
    const durOfSentence = sentenceDurations[targetWord.sentenceIndex] || 2.5;
    const offsetInSentence = (targetWord.wordIndex / wordsInSentence) * durOfSentence;

    setCurrentTimeSeconds(Math.round(priorSentenceTime + offsetInSentence));
    sentenceStartTimeRef.current = Date.now() - (offsetInSentence * 1000);

    ttsEngine.seekToSentence(targetWord.sentenceIndex);
    setIsPlaying(true);
  };

  // Smooth Seeking on the Scrubber Timeline (0.0 to 1.0)
  const seekToProgress = (ratio: number) => {
    if (totalWords === 0) return;
    const clampedRatio = Math.max(0, Math.min(1, ratio));
    const targetGlobalIndex = Math.round(clampedRatio * (totalWords - 1));
    seekToWord(targetGlobalIndex);
  };

  // Skip relative seconds (e.g. -10s, +10s)
  const skipSeconds = (seconds: number) => {
    if (!script || totalDurationSeconds === 0) return;
    const nextSeconds = Math.max(0, Math.min(totalDurationSeconds, currentTimeSeconds + seconds));
    seekToProgress(nextSeconds / totalDurationSeconds);
  };

  const handlePrevStory = () => {
    const list = playlistRef.current;
    if (list.length === 0) return;

    const prevIdx = currentIndexRef.current - 1;
    if (prevIdx >= 0) {
      currentIndexRef.current = prevIdx;
      openStory(list[prevIdx]);
    }
  };

  const setRate = (newRate: number) => {
    setPlaybackRate(newRate);
    ttsEngine.setRate(newRate);
  };

  const startBriefing = (stories: Article[]) => {
    if (stories.length === 0) return;
    setIsBriefingMode(true);
    playlistRef.current = stories;
    currentIndexRef.current = 0;
    openStory(stories[0], stories);
  };

  const stopBriefing = () => {
    setIsBriefingMode(false);
    closeStory();
  };

  return (
    <PlayerContext.Provider
      value={{
        activeArticle,
        script,
        storyWords,
        currentSentenceIndex,
        currentWordIndex,
        currentGlobalWordIndex,
        totalWords,
        isPlaying,
        rate,
        isBriefingMode,
        hasVoiceForLanguage,
        currentTimeSeconds,
        totalDurationSeconds,
        progressPercent,
        isBuffering,
        openStory,
        closeStory,
        togglePlayPause,
        nextStory: handleNextStory,
        prevStory: handlePrevStory,
        setRate,
        seekToSentence,
        seekToWord,
        seekToProgress,
        skipSeconds,
        startBriefing,
        stopBriefing
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
};
