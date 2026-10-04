/**
 * Loading Skeleton Card
 */
import React from 'react';

export const SkeletonCard: React.FC = () => {
  return (
    <div className="w-full rounded-2xl mb-4 overflow-hidden border border-white/[0.05] [data-theme=light]:border-black/[0.05] bg-[#171C24] [data-theme=light]:bg-white animate-pulse">
      {/* Image placeholder */}
      <div className="w-full aspect-16/10 bg-white/[0.05] [data-theme=light]:bg-black/[0.05]" />
      
      {/* Content */}
      <div className="p-4 space-y-3">
        <div className="w-20 h-4 rounded bg-white/[0.06] [data-theme=light]:bg-black/[0.06]" />
        <div className="space-y-2">
          <div className="w-full h-4 rounded bg-white/[0.08] [data-theme=light]:bg-black/[0.08]" />
          <div className="w-5/6 h-4 rounded bg-white/[0.08] [data-theme=light]:bg-black/[0.08]" />
        </div>
        <div className="pt-2 flex justify-between">
          <div className="w-24 h-3 rounded bg-white/[0.04] [data-theme=light]:bg-black/[0.04]" />
          <div className="w-12 h-3 rounded bg-white/[0.04] [data-theme=light]:bg-black/[0.04]" />
        </div>
      </div>
    </div>
  );
};
