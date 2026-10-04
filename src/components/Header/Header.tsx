/**
 * Header Component
 * Enforces Section A2: Logo, search, language toggle, briefing play, settings gear.
 */
import React from 'react';
import { usePrefs } from '../../context/PrefsContext';
import { usePlayer } from '../../context/PlayerContext';
import { t } from '../../i18n/useI18n';
import { SoundWaveIcon, PlayIcon, StopIcon, SearchIcon, SettingsIcon, SunIcon, MoonIcon } from '../common/Icons';
import type { Article, Language } from '../../types';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenSettings: () => void;
  articles: Article[];
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  onOpenSettings,
  articles
}) => {
  const { preferences, updatePreferences, theme, toggleTheme } = usePrefs();
  const { isBriefingMode, startBriefing, stopBriefing } = usePlayer();
  const lang = preferences.language;

  const handleLanguageToggle = (newLang: Language) => {
    if (newLang !== preferences.language) {
      updatePreferences({ language: newLang });
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-[#0E1116]/85 dark:bg-[#0E1116]/85 [data-theme=light]:bg-white/85 backdrop-blur-md border-b border-white/[0.07] [data-theme=light]:border-black/[0.07] px-4 sm:px-6 py-3 transition-colors">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4">
        
        {/* Brand & Tagline */}
        <div className="flex items-center justify-between w-full md:w-auto">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#FF6B35]/15 text-[#FF6B35] flex items-center justify-center border border-[#FF6B35]/25">
              <SoundWaveIcon className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-lg tracking-tight text-[#E8ECF1] [data-theme=light]:text-stone-900">
                  {t(lang, 'app.name')}
                </span>
                <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/[0.06] [data-theme=light]:bg-black/[0.05] text-[#9AA6B2] [data-theme=light]:text-stone-500 font-mono">
                  v1.0
                </span>
              </div>
              <p className="text-[11px] text-[#9AA6B2] [data-theme=light]:text-stone-500 leading-none hidden sm:block">
                {t(lang, 'app.tagline')}
              </p>
            </div>
          </div>

          {/* Mobile Right Quick Actions */}
          <div className="flex items-center gap-1.5 md:hidden">
            <button
              onClick={() => handleLanguageToggle(lang === 'en' ? 'hi' : 'en')}
              className="text-xs px-2.5 py-1 rounded-md border border-white/10 [data-theme=light]:border-black/10 font-medium text-[#E8ECF1] [data-theme=light]:text-stone-800"
              aria-label="Toggle language"
            >
              {lang === 'en' ? 'हिन्दी' : 'EN'}
            </button>
            <button
              onClick={onOpenSettings}
              className="p-1.5 rounded-md hover:bg-white/[0.08] [data-theme=light]:hover:bg-black/[0.06] text-[#9AA6B2] [data-theme=light]:text-stone-600"
              aria-label={t(lang, 'nav.openSettings')}
            >
              <SettingsIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Center Search Input */}
        <div className="relative w-full md:max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#6C7A89]">
            <SearchIcon className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t(lang, 'nav.searchPlaceholder')}
            maxLength={80}
            className="w-full pl-9 pr-4 py-1.5 text-xs sm:text-sm rounded-xl bg-white/[0.04] [data-theme=light]:bg-stone-100/80 border border-white/[0.08] [data-theme=light]:border-black/[0.08] text-[#E8ECF1] [data-theme=light]:text-stone-900 placeholder-[#6C7A89] focus:outline-none focus:border-[#FF6B35]/50 focus:ring-1 focus:ring-[#FF6B35]/30 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-[#6C7A89] hover:text-[#E8ECF1]"
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        {/* Right Desktop Controls */}
        <div className="hidden md:flex items-center gap-2.5">
          {/* Briefing Button */}
          {isBriefingMode ? (
            <button
              onClick={stopBriefing}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 hover:bg-rose-500/25 transition-colors"
              aria-label={t(lang, 'nav.stopBriefing')}
            >
              <StopIcon className="w-3.5 h-3.5" />
              <span>{t(lang, 'nav.stopBriefing')}</span>
            </button>
          ) : (
            <button
              onClick={() => startBriefing(articles)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl bg-[#FF6B35]/15 border border-[#FF6B35]/30 text-[#FF6B35] hover:bg-[#FF6B35]/25 transition-colors"
              aria-label={t(lang, 'nav.playBriefing')}
            >
              <PlayIcon className="w-3.5 h-3.5" />
              <span>{t(lang, 'nav.playBriefing')}</span>
            </button>
          )}

          {/* Language Switch */}
          <div className="flex items-center bg-white/[0.04] [data-theme=light]:bg-stone-100 p-0.5 rounded-lg border border-white/[0.08] [data-theme=light]:border-black/[0.08]">
            <button
              onClick={() => handleLanguageToggle('en')}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                lang === 'en'
                  ? 'bg-[#FF6B35] text-white shadow-xs'
                  : 'text-[#9AA6B2] [data-theme=light]:text-stone-600 hover:text-white'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => handleLanguageToggle('hi')}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                lang === 'hi'
                  ? 'bg-[#FF6B35] text-white shadow-xs'
                  : 'text-[#9AA6B2] [data-theme=light]:text-stone-600 hover:text-white'
              }`}
            >
              हिन्दी
            </button>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            aria-label={t(lang, 'nav.themeToggle')}
            className="p-1.5 rounded-lg hover:bg-white/[0.06] [data-theme=light]:hover:bg-black/[0.06] text-[#9AA6B2] [data-theme=light]:text-stone-600 transition-colors"
          >
            {theme === 'dark' ? <SunIcon className="w-4 h-4" /> : <MoonIcon className="w-4 h-4" />}
          </button>

          {/* Settings Gear */}
          <button
            onClick={onOpenSettings}
            aria-label={t(lang, 'nav.openSettings')}
            className="p-1.5 rounded-lg hover:bg-white/[0.06] [data-theme=light]:hover:bg-black/[0.06] text-[#9AA6B2] [data-theme=light]:text-stone-600 transition-colors"
          >
            <SettingsIcon className="w-4 h-4" />
          </button>
        </div>

      </div>
    </header>
  );
};
