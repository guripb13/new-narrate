/**
 * 5-Step Onboarding Wizard
 * Strictly enforces Section A1: Country, Language, Categories, City, Query.
 */
import React, { useState } from 'react';
import { usePrefs } from '../../context/PrefsContext';
import { t } from '../../i18n/useI18n';
import categoriesData from '../../config/categories.json';
import citiesData from '../../config/cities.json';
import { SoundWaveIcon } from '../common/Icons';
import type { CategoryInfo, CityInfo, Language, Preferences } from '../../types';

const categories: CategoryInfo[] = categoriesData as CategoryInfo[];
const cities: CityInfo[] = citiesData as CityInfo[];

export const OnboardingWizard: React.FC = () => {
  const { preferences, completeOnboarding } = usePrefs();

  const [step, setStep] = useState<number>(1);
  const [country, setCountry] = useState<string>('IN');
  const [language, setLanguage] = useState<Language>(preferences.language || 'en');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['top']);
  const [city, setCity] = useState<string>('');
  const [citySearch, setCitySearch] = useState<string>('');
  const [query, setQuery] = useState<string>('');
  const [isPreparing, setIsPreparing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const toggleCategory = (catId: string) => {
    setErrorMsg('');
    if (selectedCategories.includes(catId)) {
      if (selectedCategories.length === 1) {
        setErrorMsg(t(language, 'onboarding.selectAtLeastOne'));
        return;
      }
      setSelectedCategories(prev => prev.filter(c => c !== catId));
    } else {
      if (selectedCategories.length >= 6) {
        setErrorMsg(t(language, 'onboarding.selectAtMostSix'));
        return;
      }
      setSelectedCategories(prev => [...prev, catId]);
    }
  };

  const handleNext = () => {
    setErrorMsg('');
    if (step === 3 && selectedCategories.length === 0) {
      setErrorMsg(t(language, 'onboarding.selectAtLeastOne'));
      return;
    }

    if (step < 5) {
      setStep(prev => prev + 1);
    } else {
      // Step 5 Finish: 1-second preparing state then complete (Section A1)
      setIsPreparing(true);
      setTimeout(() => {
        const finalPrefs: Preferences = {
          version: 1,
          country,
          language,
          categories: selectedCategories,
          city: city.trim() || undefined,
          query: query.trim() || undefined,
          narration: {
            rate: 1.0,
            autoplayNext: false
          }
        };
        completeOnboarding(finalPrefs);
      }, 1000);
    }
  };

  const handleBack = () => {
    setErrorMsg('');
    if (step > 1) setStep(prev => prev - 1);
  };

  // Filtered cities list
  const filteredCities = cities.filter(c => {
    if (!citySearch) return true;
    const s = citySearch.toLowerCase();
    return c.name.toLowerCase().includes(s) || c.aliases.some(a => a.toLowerCase().includes(s));
  });

  if (isPreparing) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0E1116] p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#FF6B35]/20 text-[#FF6B35] flex items-center justify-center mb-6 border border-[#FF6B35]/30">
          <SoundWaveIcon className="w-8 h-8" />
        </div>
        <h2 className="text-xl sm:text-2xl font-semibold text-[#E8ECF1] mb-2">
          {t(language, 'onboarding.preparing')}
        </h2>
        <div className="w-48 h-1.5 bg-white/10 rounded-full overflow-hidden mt-4">
          <div className="bg-[#FF6B35] h-full w-full animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0E1116]/95 backdrop-blur-lg">
      <div className="w-full max-w-xl bg-[#171C24] [data-theme=light]:bg-white border border-white/[0.08] [data-theme=light]:border-black/[0.08] rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col justify-between min-h-[500px]">
        
        {/* Header & Progress Indicator */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#FF6B35]/20 text-[#FF6B35] flex items-center justify-center">
                <SoundWaveIcon className="w-4 h-4" />
              </div>
              <span className="font-semibold text-sm text-[#E8ECF1] [data-theme=light]:text-stone-900">
                Awaaz News
              </span>
            </div>
            <span className="text-xs font-mono text-[#9AA6B2] [data-theme=light]:text-stone-500">
              {t(language, 'onboarding.step', { current: step, total: 5 })}
            </span>
          </div>

          {/* Progress Dots */}
          <div className="flex items-center gap-2 mb-8">
            {[1, 2, 3, 4, 5].map((s) => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  s === step
                    ? 'w-8 bg-[#FF6B35]'
                    : s < step
                    ? 'w-4 bg-[#FF6B35]/50'
                    : 'w-4 bg-white/10 [data-theme=light]:bg-black/10'
                }`}
              />
            ))}
          </div>

          {/* STEP 1: Country */}
          {step === 1 && (
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#E8ECF1] [data-theme=light]:text-stone-900 mb-2">
                {t(language, 'onboarding.step1Title')}
              </h2>
              <p className="text-xs sm:text-sm text-[#9AA6B2] [data-theme=light]:text-stone-600 mb-6">
                {t(language, 'onboarding.step1Desc')}
              </p>

              <div className="space-y-3">
                <button
                  onClick={() => setCountry('IN')}
                  className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between transition-all ${
                    country === 'IN'
                      ? 'border-[#FF6B35] bg-[#FF6B35]/10 text-white'
                      : 'border-white/[0.08] bg-white/[0.02] text-[#9AA6B2]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🇮🇳</span>
                    <div>
                      <div className="font-medium text-sm text-[#E8ECF1] [data-theme=light]:text-stone-900">
                        India (IN)
                      </div>
                      <div className="text-xs text-[#9AA6B2]">
                        English & हिन्दी publishers included
                      </div>
                    </div>
                  </div>
                  <span className="w-2.5 h-2.5 rounded-full bg-[#FF6B35]" />
                </button>

                <div className="w-full p-4 rounded-2xl border border-white/[0.05] bg-white/[0.01] opacity-50 flex items-center justify-between cursor-not-allowed">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🌍</span>
                    <div>
                      <div className="font-medium text-sm text-[#E8ECF1]">Global / Other Countries</div>
                      <div className="text-xs text-[#9AA6B2]">United States, UK, Canada</div>
                    </div>
                  </div>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-white/10 text-white/70">
                    {t(language, 'onboarding.comingSoon')}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Language */}
          {step === 2 && (
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#E8ECF1] [data-theme=light]:text-stone-900 mb-2">
                {t(language, 'onboarding.step2Title')}
              </h2>
              <p className="text-xs sm:text-sm text-[#9AA6B2] [data-theme=light]:text-stone-600 mb-6">
                {t(language, 'onboarding.step2Desc')}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={() => setLanguage('en')}
                  className={`p-6 rounded-2xl border text-center transition-all ${
                    language === 'en'
                      ? 'border-[#FF6B35] bg-[#FF6B35]/15 text-white shadow-lg'
                      : 'border-white/[0.08] bg-white/[0.02] text-[#9AA6B2] hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="text-3xl mb-3">🗣️</div>
                  <div className="font-bold text-lg text-[#E8ECF1] [data-theme=light]:text-stone-900 mb-1">
                    English
                  </div>
                  <div className="text-xs text-[#9AA6B2]">
                    Clear Indian & international English narration
                  </div>
                </button>

                <button
                  onClick={() => setLanguage('hi')}
                  className={`p-6 rounded-2xl border text-center transition-all ${
                    language === 'hi'
                      ? 'border-[#FF6B35] bg-[#FF6B35]/15 text-white shadow-lg'
                      : 'border-white/[0.08] bg-white/[0.02] text-[#9AA6B2] hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="text-3xl mb-3">🎙️</div>
                  <div className="font-bold text-lg text-[#E8ECF1] [data-theme=light]:text-stone-900 mb-1">
                    हिन्दी
                  </div>
                  <div className="text-xs text-[#9AA6B2]">
                    शुद्ध और स्पष्ट हिन्दी समाचार वाचन
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Categories */}
          {step === 3 && (
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#E8ECF1] [data-theme=light]:text-stone-900 mb-2">
                {t(language, 'onboarding.step3Title')}
              </h2>
              <p className="text-xs sm:text-sm text-[#9AA6B2] [data-theme=light]:text-stone-600 mb-4">
                {t(language, 'onboarding.step3Desc')}
              </p>

              {errorMsg && (
                <div className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded-lg mb-4">
                  {errorMsg}
                </div>
              )}

              <div className="flex flex-wrap gap-2.5 max-h-[260px] overflow-y-auto pr-1">
                {categories.map((cat) => {
                  const isSelected = selectedCategories.includes(cat.id);
                  const label = cat.label[language] || cat.label.en;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => toggleCategory(cat.id)}
                      className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all flex items-center gap-2 ${
                        isSelected
                          ? 'bg-[#FF6B35] text-white shadow-xs'
                          : 'bg-white/[0.04] [data-theme=light]:bg-black/[0.04] text-[#9AA6B2] hover:bg-white/[0.08] hover:text-[#E8ECF1]'
                      }`}
                    >
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span>{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 4: City */}
          {step === 4 && (
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#E8ECF1] [data-theme=light]:text-stone-900 mb-2">
                {t(language, 'onboarding.step4Title')}
              </h2>
              <p className="text-xs sm:text-sm text-[#9AA6B2] [data-theme=light]:text-stone-600 mb-4">
                {t(language, 'onboarding.step4Desc')}
              </p>

              <input
                type="text"
                value={citySearch}
                onChange={(e) => setCitySearch(e.target.value)}
                placeholder="Search city (e.g. Ludhiana, Delhi, Mumbai, जयपुर)…"
                className="w-full px-4 py-2.5 rounded-xl text-xs sm:text-sm bg-white/[0.04] [data-theme=light]:bg-stone-100 border border-white/[0.08] [data-theme=light]:border-black/[0.08] text-[#E8ECF1] [data-theme=light]:text-stone-900 mb-4 focus:outline-none focus:border-[#FF6B35]"
              />

              <div className="flex flex-wrap gap-2 max-h-[190px] overflow-y-auto pr-1">
                {filteredCities.slice(0, 18).map((c) => {
                  const isChosen = city === c.name;
                  return (
                    <button
                      key={c.name}
                      onClick={() => setCity(isChosen ? '' : c.name)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        isChosen
                          ? 'bg-[#FF6B35] text-white'
                          : 'bg-white/[0.04] text-[#9AA6B2] hover:text-white hover:bg-white/[0.08]'
                      }`}
                    >
                      {c.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 5: Free Query */}
          {step === 5 && (
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#E8ECF1] [data-theme=light]:text-stone-900 mb-2">
                {t(language, 'onboarding.step5Title')}
              </h2>
              <p className="text-xs sm:text-sm text-[#9AA6B2] [data-theme=light]:text-stone-600 mb-6">
                {t(language, 'onboarding.step5Desc')}
              </p>

              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                maxLength={80}
                placeholder={t(language, 'onboarding.step5Placeholder')}
                className="w-full px-4 py-3 rounded-2xl text-sm bg-white/[0.04] [data-theme=light]:bg-stone-100 border border-white/[0.08] [data-theme=light]:border-black/[0.08] text-[#E8ECF1] [data-theme=light]:text-stone-900 focus:outline-none focus:border-[#FF6B35] focus:ring-1 focus:ring-[#FF6B35]/30"
              />
              <div className="text-[11px] text-[#6C7A89] mt-2 text-right">
                {query.length} / 80
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-6 border-t border-white/[0.08] [data-theme=light]:border-black/[0.08] mt-8">
          <div>
            {step > 1 ? (
              <button
                onClick={handleBack}
                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-medium text-[#9AA6B2] hover:text-[#E8ECF1] transition-colors"
              >
                {t(language, 'onboarding.back')}
              </button>
            ) : null}
          </div>

          <div className="flex items-center gap-3">
            {step === 4 && !city && (
              <button
                onClick={handleNext}
                className="px-4 py-2 rounded-xl text-xs font-medium text-[#9AA6B2] hover:text-white"
              >
                {t(language, 'onboarding.skip')}
              </button>
            )}
            <button
              onClick={handleNext}
              className="px-6 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-[#FF6B35] text-white hover:bg-[#FA581D] shadow-md transition-all active:scale-95"
            >
              {step === 5 ? t(language, 'onboarding.finish') : t(language, 'onboarding.next')}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
