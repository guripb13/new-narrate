/**
 * Non-blocking Notification Banners
 */
import React from 'react';

interface BannerProps {
  type?: 'info' | 'warning' | 'offline';
  message: string;
  actionText?: string;
  onAction?: () => void;
  onClose?: () => void;
}

export const Banner: React.FC<BannerProps> = ({
  type = 'info',
  message,
  actionText,
  onAction,
  onClose
}) => {
  const getColors = () => {
    switch (type) {
      case 'warning':
        return 'bg-amber-950/40 border-amber-600/30 text-amber-200';
      case 'offline':
        return 'bg-zinc-900 border-zinc-700 text-zinc-300';
      default:
        return 'bg-blue-950/40 border-blue-600/30 text-blue-200';
    }
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className={`px-4 py-2.5 text-xs sm:text-sm border rounded-xl flex items-center justify-between gap-3 shadow-sm ${getColors()}`}
    >
      <div className="flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
        <span>{message}</span>
      </div>
      <div className="flex items-center gap-2">
        {actionText && onAction && (
          <button
            onClick={onAction}
            className="underline underline-offset-2 font-medium hover:opacity-80 transition-opacity"
          >
            {actionText}
          </button>
        )}
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Dismiss banner"
            className="text-xs opacity-60 hover:opacity-100 ml-2"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
};
