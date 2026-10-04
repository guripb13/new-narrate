/**
 * Story Player & Briefing Playback Context
 * Manages active story, live sentence captions, controls, and briefing mode.
 */
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { ttsEngine } from '../tts/ttsEngine';
import { buildScript, ScriptOutput } from '../narration/buildScript';
import { usePrefs } from './PrefsContext';
import type { Article } from '../types';

interface PlayerContextType {
  activeArticle: Article | null;
  script: ScriptOutput | null;
  currentSentenceIndex: number;
  isPlaying: boolean;
  rate: number;
  isBriefingMode: boolean;
  hasVoiceForLanguage: boolean;
  openStory: (article: Article, storyList?: Article[]) => void;
  closeStory: () => void;
  togglePlayPause: () => void;
  nextStory: () => void;
  prevStory: () => void;
  setRate: (rate: number) => void;
  startBriefing: (stories: Article[]) => void;
  stopBriefing: () => void;
}

const PlayerContext = createContext<PlayerContextType | null>(null);

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { preferences } = usePrefs();
  const [activeArticle, setActiveArticle] = useState<Article | null>(null);
  const [script, setScript] = useState<ScriptOutput | null>(null);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [rate, setPlaybackRate] = useState<number>(preferences.narration.rate || 1.0);
  const [isBriefingMode, setIsBriefingMode] = useState<boolean>(false);
  const [hasVoiceForLanguage, setHasVoiceForLanguage] = useState<boolean>(true);

  const playlistRef = useRef<Article[]>([]);
  const currentIndexRef = useRef<number>(-1);
  const briefingTimerRef = useRef<number | null>(null);

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

    // Auto-start narration as soon as card expands (Section A3)
    ttsEngine.speak(built.sentences, article.language, {
      rate,
      onSentenceStart: (idx) => {
        setCurrentSentenceIndex(idx);
      },
      onEnd: () => {
        setIsPlaying(false);
        // Autoplay next or briefing mode
        if (isBriefingMode || preferences.narration.autoplayNext) {
          briefingTimerRef.current = window.setTimeout(() => {
            handleNextStory();
          }, 600); // 600ms gap between stories (Section A4.4)
        }
      },
      onError: (err) => {
        console.warn('TTS playback note:', err);
        setIsPlaying(false);
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
    setIsBriefingMode(false);
  };

  const togglePlayPause = () => {
    if (isPlaying) {
      ttsEngine.pause();
      setIsPlaying(false);
    } else {
      ttsEngine.resume();
      setIsPlaying(true);
    }
  };

  const handleNextStory = () => {
    const list = playlistRef.current;
    if (list.length === 0) return;

    const nextIdx = currentIndexRef.current + 1;
    if (nextIdx < list.length) {
      currentIndexRef.current = nextIdx;
      openStory(list[nextIdx]);
    } else {
      // Reached end
      closeStory();
    }
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
    const top10 = stories.slice(0, 10);
    playlistRef.current = top10;
    currentIndexRef.current = 0;
    setIsBriefingMode(true);
    openStory(top10[0], top10);
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
        currentSentenceIndex,
        isPlaying,
        rate,
        isBriefingMode,
        hasVoiceForLanguage,
        openStory,
        closeStory,
        togglePlayPause,
        nextStory: handleNextStory,
        prevStory: handlePrevStory,
        setRate,
        startBriefing,
        stopBriefing
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
};

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
}
