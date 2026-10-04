/**
 * TTS Engine Interface (Tier 1: Browser Web Speech API)
 * Strictly complies with M3 & A4.3: Chunk queueing, speed multiplier, boundary events.
 */
import { loadVoices, selectBestVoice } from './voices';
import type { Language } from '../types';

export interface TTSOptions {
  rate?: number;
  onSentenceStart?: (index: number) => void;
  onEnd?: () => void;
  onError?: (err: any) => void;
}

class TTSEngine {
  private currentSentences: string[] = [];
  private currentIndex: number = 0;
  private currentLanguage: Language = 'en';
  private currentRateMultiplier: number = 1.0;
  private isPaused: boolean = false;
  private isSpeaking: boolean = false;
  private options: TTSOptions = {};

  public isSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  public async hasVoiceForLanguage(lang: Language): Promise<boolean> {
    if (!this.isSupported()) return false;
    const voices = await loadVoices();
    return selectBestVoice(voices, lang) !== null;
  }

  public async speak(
    sentences: string[],
    language: Language,
    options: TTSOptions = {}
  ): Promise<void> {
    if (!this.isSupported()) {
      options.onError?.(new Error('Speech synthesis not supported on this device'));
      return;
    }

    this.stop();

    this.currentSentences = sentences;
    this.currentIndex = 0;
    this.currentLanguage = language;
    this.currentRateMultiplier = options.rate || 1.0;
    this.isPaused = false;
    this.isSpeaking = true;
    this.options = options;

    const voices = await loadVoices();
    const voice = selectBestVoice(voices, language);

    this.playNextChunk(voice);
  }

  private playNextChunk(voice: SpeechSynthesisVoice | null): void {
    if (!this.isSpeaking || this.currentIndex >= this.currentSentences.length) {
      this.isSpeaking = false;
      this.options.onEnd?.();
      return;
    }

    const textChunk = this.currentSentences[this.currentIndex];
    this.options.onSentenceStart?.(this.currentIndex);

    const utterance = new SpeechSynthesisUtterance(textChunk);
    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang;
    } else {
      utterance.lang = this.currentLanguage === 'hi' ? 'hi-IN' : 'en-IN';
    }

    // Base rates: 0.95 English, 0.9 Hindi, scaled by user setting
    const baseRate = this.currentLanguage === 'hi' ? 0.9 : 0.95;
    utterance.rate = Math.max(0.5, Math.min(2.0, baseRate * this.currentRateMultiplier));
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    utterance.onend = () => {
      if (this.isSpeaking && !this.isPaused) {
        this.currentIndex++;
        this.playNextChunk(voice);
      }
    };

    utterance.onerror = (e) => {
      // In some browsers 'interrupted' is fired when cancel() is invoked
      if (e.error !== 'interrupted' && e.error !== 'canceled') {
        this.options.onError?.(e);
      }
    };

    window.speechSynthesis.speak(utterance);
  }

  public pause(): void {
    if (!this.isSupported() || !this.isSpeaking) return;
    this.isPaused = true;
    window.speechSynthesis.pause();
  }

  public resume(): void {
    if (!this.isSupported() || !this.isSpeaking) return;
    this.isPaused = false;
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    } else {
      // Android / Safari workaround: restart from current sentence index
      loadVoices().then((voices) => {
        const voice = selectBestVoice(voices, this.currentLanguage);
        this.playNextChunk(voice);
      });
    }
  }

  public setRate(rate: number): void {
    this.currentRateMultiplier = rate;
  }

  public stop(): void {
    this.isSpeaking = false;
    this.isPaused = false;
    this.currentSentences = [];
    this.currentIndex = 0;
    if (this.isSupported()) {
      window.speechSynthesis.cancel();
    }
  }

  public getCurrentIndex(): number {
    return this.currentIndex;
  }

  public getIsPlaying(): boolean {
    return this.isSpeaking && !this.isPaused;
  }
}

export const ttsEngine = new TTSEngine();
