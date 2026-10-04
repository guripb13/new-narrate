/**
 * Awaaz News — Main Application
 * Integrates Onboarding, Responsive Masonry Grid, Header, and Story Player.
 */
import React, { useState, useEffect, useTransition, useCallback } from 'react';
import { PrefsProvider, usePrefs } from './context/PrefsContext';
import { PlayerProvider } from './context/PlayerContext';
import { Header } from './components/Header/Header';
import { CategoryBar } from './components/CategoryBar/CategoryBar';
import { NewsGrid } from './components/NewsGrid/NewsGrid';
import { StoryPlayer } from './components/StoryPlayer/StoryPlayer';
import { OnboardingWizard } from './components/Onboarding/OnboardingWizard';
import { SettingsModal } from './components/Settings/SettingsModal';
import { Banner } from './components/common/Banner';
import { newsService } from './services/newsService';
import { t } from './i18n/useI18n';
import type { Article } from './types';

function MainApp() {
  const { preferences, isOnboarded } = usePrefs();
  const lang = preferences.language;

  const [activeCategory, setActiveCategory] = useState<string>('for_you');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedQuery, setDebouncedQuery] = useState<string>('');
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);

  const [articles, setArticles] = useState<Article[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isRelaxed, setIsRelaxed] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [newStoriesCount, setNewStoriesCount] = useState<number>(0);

  const [, startTransition] = useTransition();

  // Debounce search query by 400ms (Section P6 Phase 4)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Online / Offline Detection
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Fetch articles query handler
  const loadArticles = useCallback((cursor: string | null = null, append: boolean = false) => {
    setIsLoading(true);

    const isForYou = activeCategory === 'for_you';
    const targetCategories = isForYou ? preferences.categories : undefined;
    const targetCategory = isForYou ? undefined : activeCategory;
    const targetCity = isForYou ? preferences.city : undefined;
    const targetQuery = debouncedQuery || (isForYou ? preferences.query : undefined);

    const res = newsService.queryNews({
      language: preferences.language,
      category: targetCategory,
      categories: targetCategories,
      city: targetCity,
      query: targetQuery,
      cursor,
      limit: 24
    });

    startTransition(() => {
      setArticles(prev => (append ? [...prev, ...res.items] : res.items));
      setNextCursor(res.nextCursor);
      setIsRelaxed(res.relaxed);
      setIsLoading(false);
    });
  }, [activeCategory, debouncedQuery, preferences]);

  // Refetch when filters change
  useEffect(() => {
    loadArticles(null, false);
  }, [loadArticles]);

  // Check background feed updates periodically (Section A2)
  useEffect(() => {
    const interval = setInterval(async () => {
      const added = await newsService.refreshFeeds();
      if (added > 0) {
        setNewStoriesCount(prev => prev + added);
      }
    }, 3 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const handleShowNewStories = () => {
    setNewStoriesCount(0);
    loadArticles(null, false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className={`min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors duration-200 ${lang === 'hi' ? 'lang-hi' : ''}`}>
      
      {/* Onboarding Wizard for first-time visitors */}
      {!isOnboarded && <OnboardingWizard />}

      {/* Global Notifications & Banners */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-3 space-y-2">
        {isOffline && (
          <Banner
            type="offline"
            message={t(lang, 'common.offlineNotice')}
          />
        )}
        {newStoriesCount > 0 && (
          <Banner
            type="info"
            message={t(lang, 'grid.newStoriesPill', { count: newStoriesCount })}
            actionText="Refresh feed"
            onAction={handleShowNewStories}
            onClose={() => setNewStoriesCount(0)}
          />
        )}
      </div>

      {/* Navigation Header */}
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenSettings={() => setIsSettingsOpen(true)}
        articles={articles}
      />

      {/* Sticky Categories Bar */}
      <CategoryBar
        activeCategory={activeCategory}
        onSelectCategory={(catId) => {
          setActiveCategory(catId);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        isRelaxed={isRelaxed}
      />

      {/* Responsive Masonry News Grid */}
      <main>
        <NewsGrid
          articles={articles}
          isLoading={isLoading}
          hasMore={Boolean(nextCursor)}
          onLoadMore={async () => {
            if (nextCursor && !isLoading) {
              loadArticles(nextCursor, true);
            } else if (!isLoading) {
              setIsLoading(true);
              await newsService.fetchNextBatchOfFeeds();
              loadArticles(nextCursor, true);
            }
          }}
          onClearSearch={() => {
            setSearchQuery('');
            setDebouncedQuery('');
            setActiveCategory('for_you');
          }}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />
      </main>

      {/* Story Player Modal */}
      <StoryPlayer />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* Calm, Serene Footer */}
      <footer className="mt-20 py-10 border-t border-white/[0.05] [data-theme=light]:border-black/[0.05] text-center text-xs text-[#6C7A89]">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-[#E8ECF1] [data-theme=light]:text-stone-800">
              Awaaz News
            </span>
            <span>—</span>
            <span>{t(lang, 'app.tagline')}</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="hover:underline hover:text-[#E8ECF1]"
            >
              {t(lang, 'settings.aboutTitle')}
            </button>
            <span>•</span>
            <span>Non-commercial discovery platform</span>
            <span>•</span>
            <a
              href="mailto:contact@awaaznews.org"
              className="hover:underline hover:text-[#E8ECF1]"
            >
              Contact & Removal Requests
            </a>
          </div>
        </div>
      </footer>

    </div>
  );
}

export default function App() {
  return (
    <PrefsProvider>
      <PlayerProvider>
        <MainApp />
      </PlayerProvider>
    </PrefsProvider>
  );
}
