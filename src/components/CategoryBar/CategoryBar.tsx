/**
 * Sticky Category Bar Component
 * Enforces Section A2: "For you" default chip, horizontal scroll, category pills.
 */
import React from 'react';
import categoriesData from '../../config/categories.json';
import { usePrefs } from '../../context/PrefsContext';
import { t } from '../../i18n/useI18n';
import type { CategoryInfo } from '../../types';

const categories: CategoryInfo[] = categoriesData as CategoryInfo[];

interface CategoryBarProps {
  activeCategory: string; // 'for_you' or category id
  onSelectCategory: (categoryId: string) => void;
  isRelaxed?: boolean;
}

export const CategoryBar: React.FC<CategoryBarProps> = ({
  activeCategory,
  onSelectCategory,
  isRelaxed = false
}) => {
  const { preferences } = usePrefs();
  const lang = preferences.language;

  return (
    <div className="sticky top-[57px] z-20 bg-[#0E1116]/90 [data-theme=light]:bg-stone-50/90 backdrop-blur-md border-b border-white/[0.05] [data-theme=light]:border-black/[0.05] py-2 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth">
        
        {/* "For You" Chip */}
        <button
          onClick={() => onSelectCategory('for_you')}
          className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
            activeCategory === 'for_you'
              ? 'bg-[#FF6B35] text-white shadow-xs'
              : 'bg-white/[0.04] [data-theme=light]:bg-black/[0.04] text-[#9AA6B2] [data-theme=light]:text-stone-600 hover:bg-white/[0.08] hover:text-[#E8ECF1]'
          }`}
        >
          {t(lang, 'nav.forYou')}
        </button>

        {/* Categories */}
        {categories.map((cat) => {
          const isSelected = activeCategory === cat.id;
          const label = cat.label[lang] || cat.label.en;

          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-white/15 [data-theme=light]:bg-black/10 text-white [data-theme=light]:text-stone-900 border border-white/20 [data-theme=light]:border-black/20'
                  : 'bg-white/[0.03] [data-theme=light]:bg-black/[0.03] text-[#9AA6B2] [data-theme=light]:text-stone-600 hover:bg-white/[0.06] hover:text-[#E8ECF1]'
              }`}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: cat.color }}
              />
              <span>{label}</span>
            </button>
          );
        })}

        {/* Relaxation Indicator Note */}
        {isRelaxed && activeCategory === 'for_you' && (
          <span className="shrink-0 text-[11px] px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 font-normal ml-auto">
            {t(lang, 'grid.broaderResults')}
          </span>
        )}

      </div>
    </div>
  );
};
