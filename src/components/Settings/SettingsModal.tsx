/**
 * Settings & Preferences Modal
 * Enforces Section A1 & S4: Edit preferences, reset dialog, and legal notice.
 */
import React, { useState } from 'react';
import { usePrefs } from '../../context/PrefsContext';
import { t } from '../../i18n/useI18n';
import categoriesData from '../../config/categories.json';
import citiesData from '../../config/cities.json';
import { CloseIcon } from '../common/Icons';
import type { CategoryInfo, CityInfo, Language } from '../../types';

const categories: CategoryInfo[] = categoriesData as CategoryInfo[];
const cities: CityInfo[] = citiesData as CityInfo[];

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { preferences, updatePreferences, resetPreferences } = usePrefs();
  const lang = preferences.language;

  const [editLang, setEditLang] = useState<Language>(preferences.language);
  const [editCategories, setEditCategories] = useState<string[]>(preferences.categories);
  const [editCity, setEditCity] = useState<string>(preferences.city || '');
  const [editQuery, setEditQuery] = useState<string>(preferences.query || '');
  const [editRate, setEditRate] = useState<number>(preferences.narration.rate || 1.0);
  const [autoplayNext, setAutoplayNext] = useState<boolean>(preferences.narration.autoplayNext || false);
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);

  if (!isOpen) return null;

  const toggleCategory = (catId: string) => {
    if (editCategories.includes(catId)) {
      if (editCategories.length > 1) {
        setEditCategories(prev => prev.filter(c => c !== catId));
      }
    } else {
      if (editCategories.length < 6) {
        setEditCategories(prev => [...prev, catId]);
      }
    }
  };

  const handleSave = () => {
    updatePreferences({
      language: editLang,
      categories: editCategories,
      city: editCity.trim() || undefined,
      query: editQuery.trim() || undefined,
      narration: {
        rate: editRate,
        autoplayNext
      }
    });
    onClose();
  };

  const handleConfirmReset = () => {
    resetPreferences();
    setShowResetConfirm(false);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md"
    >
      <div
        className="absolute inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-lg bg-[#171C24] [data-theme=light]:bg-white border border-white/[0.08] [data-theme=light]:border-black/[0.08] rounded-3xl p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2
            id="settings-modal-title"
            className="text-lg sm:text-xl font-bold text-[#E8ECF1] [data-theme=light]:text-stone-900"
          >
            {t(lang, 'settings.title')}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close settings"
            className="p-1.5 rounded-lg text-[#9AA6B2] hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="space-y-6">
          
          {/* Language Selection */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#9AA6B2] mb-2">
              {t(lang, 'settings.language')}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setEditLang('en')}
                className={`py-2 px-3 rounded-xl text-xs sm:text-sm font-medium border transition-colors ${
                  editLang === 'en'
                    ? 'border-[#FF6B35] bg-[#FF6B35]/15 text-white'
                    : 'border-white/[0.08] text-[#9AA6B2]'
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setEditLang('hi')}
                className={`py-2 px-3 rounded-xl text-xs sm:text-sm font-medium border transition-colors ${
                  editLang === 'hi'
                    ? 'border-[#FF6B35] bg-[#FF6B35]/15 text-white'
                    : 'border-white/[0.08] text-[#9AA6B2]'
                }`}
              >
                हिन्दी
              </button>
            </div>
          </div>

          {/* Categories */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#9AA6B2] mb-2">
              {t(lang, 'settings.categories')} (1–6)
            </label>
            <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto pr-1">
              {categories.map((cat) => {
                const isSelected = editCategories.includes(cat.id);
                const label = cat.label[lang] || cat.label.en;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => toggleCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-[#FF6B35] text-white'
                        : 'bg-white/[0.04] text-[#9AA6B2] hover:text-white'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* City */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#9AA6B2] mb-2">
              {t(lang, 'settings.city')}
            </label>
            <select
              value={editCity}
              onChange={(e) => setEditCity(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-xs sm:text-sm bg-white/[0.04] [data-theme=light]:bg-stone-100 border border-white/[0.08] [data-theme=light]:border-black/[0.08] text-[#E8ECF1] [data-theme=light]:text-stone-900 focus:outline-none focus:border-[#FF6B35]"
            >
              <option value="">None (All regions)</option>
              {cities.map(c => (
                <option key={c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Custom Query */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#9AA6B2] mb-2">
              {t(lang, 'settings.customQuery')}
            </label>
            <input
              type="text"
              value={editQuery}
              onChange={(e) => setEditQuery(e.target.value)}
              maxLength={80}
              placeholder="e.g. farmers protest, IPL, ISRO"
              className="w-full px-3 py-2 rounded-xl text-xs sm:text-sm bg-white/[0.04] [data-theme=light]:bg-stone-100 border border-white/[0.08] [data-theme=light]:border-black/[0.08] text-[#E8ECF1] [data-theme=light]:text-stone-900 focus:outline-none focus:border-[#FF6B35]"
            />
          </div>

          {/* Narration Rate & Autoplay Next */}
          <div className="flex items-center justify-between pt-2">
            <div>
              <div className="text-xs font-semibold text-[#E8ECF1] [data-theme=light]:text-stone-900">
                {t(lang, 'settings.rate')}
              </div>
              <div className="text-[11px] text-[#6C7A89]">Speech pace multiplier</div>
            </div>
            <div className="flex items-center gap-1">
              {[0.75, 1.0, 1.25, 1.5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setEditRate(s)}
                  className={`text-xs px-2.5 py-1 rounded-md font-mono transition-colors ${
                    editRate === s
                      ? 'bg-[#FF6B35] text-white'
                      : 'bg-white/[0.04] text-[#9AA6B2]'
                  }`}
                >
                  {s}×
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div>
              <div className="text-xs font-semibold text-[#E8ECF1] [data-theme=light]:text-stone-900">
                {t(lang, 'settings.autoplayNext')}
              </div>
              <div className="text-[11px] text-[#6C7A89]">Automatically play next story in player</div>
            </div>
            <input
              type="checkbox"
              checked={autoplayNext}
              onChange={(e) => setAutoplayNext(e.target.checked)}
              className="w-4 h-4 accent-[#FF6B35]"
            />
          </div>

          {/* Legal and Ethics Section (Section S4.6) */}
          <div className="pt-4 border-t border-white/[0.05] [data-theme=light]:border-black/[0.05]">
            <h4 className="text-xs font-semibold text-[#9AA6B2] mb-1">
              {t(lang, 'settings.aboutTitle')}
            </h4>
            <p className="text-[11px] text-[#6C7A89] leading-relaxed">
              {t(lang, 'settings.aboutText')}
            </p>
          </div>

        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-6 border-t border-white/[0.08] [data-theme=light]:border-black/[0.08] mt-6">
          <button
            type="button"
            onClick={() => setShowResetConfirm(true)}
            className="text-xs text-rose-400 hover:underline"
          >
            {t(lang, 'settings.reset')}
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-[#9AA6B2] hover:text-[#E8ECF1]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#FF6B35] text-white hover:bg-[#FA581D] shadow-md transition-all active:scale-95"
            >
              {t(lang, 'settings.save')}
            </button>
          </div>
        </div>

        {/* Reset Confirmation Dialog */}
        {showResetConfirm && (
          <div className="absolute inset-0 z-30 flex items-center justify-center p-6 bg-black/90 backdrop-blur-md rounded-3xl">
            <div className="text-center max-w-xs">
              <h3 className="text-base font-bold text-white mb-2">Reset Everything?</h3>
              <p className="text-xs text-[#9AA6B2] mb-6">
                {t(lang, 'settings.resetConfirm')}
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(false)}
                  className="px-4 py-2 rounded-xl text-xs bg-white/10 text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReset}
                  className="px-4 py-2 rounded-xl text-xs bg-rose-600 text-white font-medium"
                >
                  Confirm Reset
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
