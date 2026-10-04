/**
 * Awaaz News — Main Application
 * Integrates Onboarding, Responsive Masonry Grid, Header, Story Player,
 * and Real-Time Live Internet Search for any query or topic.
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
  const [isSearchingWeb, setIsSearchingWeb] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);

  const [articles, setArticles] = useState<Article[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isRelaxed, setIsRelaxed] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [newStoriesCount, setNewStoriesCount] = useState<number>(0);

  const [, startTransition] = useTransition();

  // Debounce search query by 450ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 450);
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

  // Fetch articles query handler with Live Internet Search integration
  const loadArticles = useCallback((cursor: string | null = null, append: boolean = false) => {
    setIsLoading(true);

    const isForYou = activeCategory === 'for_you';
    const targetCategories = isForYou ? preferences.categories : undefined;
    const targetCategory = isForYou ? undefined : activeCategory;
    const targetCity = isForYou ? preferences.city : undefined;
    const trimmedQuery = debouncedQuery.trim();

    // If search query is active and not paginating, perform real-time internet search
    if (trimmedQuery.length >= 2 && !cursor && !append) {
      setIsSearchingWeb(true);
      newsService.searchInternetNews(trimmedQuery, preferences.language).then((webResults) => {
        setIsSearchingWeb(false);
        if (webResults && webResults.length > 0) {
          startTransition(() => {
            setArticles(webResults);
            setNextCursor(null);
            setIsRelaxed(false);
            setIsLoading(false);
          });
          return;
        }

        // Fallback to local search if web returned 0
        const res = newsService.queryNews({
          language: preferences.language,
          query: trimmedQuery,
          limit: 24
        });
        startTransition(() => {
          setArticles(res.items);
          setNextCursor(res.nextCursor);
          setIsRelaxed(res.relaxed);
          setIsLoading(false);
        });
      }).catch(() => {
        setIsSearchingWeb(false);
        setIsLoading(false);
      });
      return;
    }

    const res = newsService.queryNews({
      language: preferences.language,
      category: targetCategory,
      categories: targetCategories,
      city: targetCity,
      query: trimmedQuery || (isForYou ? preferences.query : undefined),
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

  // Explicit immediate web search execution (triggered when user clicks Search Web or presses Enter)
  const handleExecuteSearch = useCallback(async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;

    setDebouncedQuery(trimmed);
    setIsSearchingWeb(true);
    setIsLoading(true);

    try {
      const webResults = await newsService.searchInternetNews(trimmed, preferences.language);
      setIsSearchingWeb(false);
      if (webResults && webResults.length > 0) {
        startTransition(() => {
          setArticles(webResults);
          setNextCursor(null);
          setIsRelaxed(false);
          setIsLoading(false);
        });
      } else {
        const res = newsService.queryNews({
          language: preferences.language,
          query: trimmed,
          limit: 24
        });
        startTransition(() => {
          setArticles(res.items);
          setIsLoading(false);
        });
      }
    } catch {
      setIsSearchingWeb(false);
      setIsLoading(false);
    }
  }, [preferences.language]);

  // Check background feed updates periodically (every 3 minutes)
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

  const handleClearSearch = () => {
    setSearchQuery('');
    setDebouncedQuery('');
    setActiveCategory('for_you');
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

      {/* Navigation Header with Workable Web Search Button */}
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onExecuteSearch={handleExecuteSearch}
        isSearchingWeb={isSearchingWeb}
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

      {/* Live Internet Search Status Header */}
      {debouncedQuery.trim() && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4">
          <div className="p-4 sm:p-5 rounded-2xl bg-[#171C24] [data-theme=light]:bg-white border border-[#FF6B35]/30 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#FF6B35]/15 text-[#FF6B35] flex items-center justify-center shrink-0 text-xl border border-[#FF6B35]/25">
                {isSearchingWeb ? (
                  <div className="w-5 h-5 border-2 border-[#FF6B35] border-t-transparent rounded-full animate-spin" />
                ) : (
                  '🌐'
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase tracking-wider font-semibold text-[#FF6B35]">
                    {isSearchingWeb ? 'Searching Live Internet...' : 'Live Web News'}
                  </span>
                  <span className="text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 px-2 py-0.5 rounded-full font-mono font-medium">
                    ● Real-Time Web Wire
                  </span>
                </div>
                <h2 className="text-base sm:text-lg font-bold text-[#E8ECF1] [data-theme=light]:text-stone-900 leading-tight mt-0.5">
                  Results for &ldquo;{debouncedQuery}&rdquo;
                </h2>
                <p className="text-xs text-[#9AA6B2] [data-theme=light]:text-stone-600 mt-0.5">
                  {isSearchingWeb
                    ? 'Querying global publishers, Google News & live news networks...'
                    : `Discovered ${articles.length} news stories directly from the internet.`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-center">
              <button
                type="button"
                onClick={handleClearSearch}
                className="px-3.5 py-1.5 rounded-xl text-xs font-medium bg-white/[0.08] [data-theme=light]:bg-black/[0.05] hover:bg-white/[0.12] [data-theme=light]:hover:bg-black/[0.1] text-[#E8ECF1] [data-theme=light]:text-stone-700 transition-colors"
              >
                ✕ Clear Search
              </button>
            </div>
          </div>
        </div>
      )}

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
          onClearSearch={handleClearSearch}
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
