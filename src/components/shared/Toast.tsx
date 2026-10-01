import React, { useEffect, useState } from 'react';
import { RotateCcw, X, Info, CheckCircle2, AlertTriangle } from 'lucide-react';

export interface ToastProps {
  id?: string;
  type?: 'info' | 'success' | 'warning' | 'undo';
  message: string;
  actionText?: string;
  onAction?: () => void;
  onDismiss: () => void;
  duration?: number; // milliseconds
}

export const Toast: React.FC<ToastProps> = ({
  type = 'info',
  message,
  actionText = 'Undo',
  onAction,
  onDismiss,
  duration = 8000,
}) => {
  const [remainingTime, setRemainingTime] = useState(duration);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const left = Math.max(0, duration - elapsed);
      setRemainingTime(left);
      if (left <= 0) {
        clearInterval(interval);
        onDismiss();
      }
    }, 100);

    return () => clearInterval(interval);
  }, [duration, onDismiss]);

  const remainingSeconds = Math.ceil(remainingTime / 1000);
  const progressPercent = (remainingTime / duration) * 100;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 sm:left-auto sm:right-6 sm:translate-x-0 z-50 max-w-md w-[calc(100vw-2rem)] sm:w-auto animate-fade-in"
    >
      <div className="bg-[#3D3D3D] text-[#FAF7F2] rounded-2xl shadow-2xl border-2 border-[#4F6B4A] overflow-hidden p-4 relative">
        <div className="flex items-center gap-3">
          {type === 'undo' && (
            <div className="w-8 h-8 rounded-xl bg-[#4F6B4A] text-white flex items-center justify-center shrink-0">
              <RotateCcw className="w-4 h-4" />
            </div>
          )}
          {type === 'info' && (
            <div className="w-8 h-8 rounded-xl bg-[#FAF0D9] text-[#E8A838] flex items-center justify-center shrink-0">
              <Info className="w-4 h-4" />
            </div>
          )}
          {type === 'success' && (
            <div className="w-8 h-8 rounded-xl bg-[#E7EFE5] text-[#4F6B4A] flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          )}
          {type === 'warning' && (
            <div className="w-8 h-8 rounded-xl bg-[#FBE4DD] text-[#A63D26] flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
          )}

          <div className="flex-1 min-w-0 pr-2">
            <p className="text-xs sm:text-sm font-bold text-white leading-tight">
              {message}
            </p>
            {type === 'undo' && (
              <span className="text-[11px] text-[#D5CFBE] font-medium mt-0.5 block">
                Auto-closing in {remainingSeconds}s
              </span>
            )}
          </div>

          {onAction && (
            <button
              type="button"
              onClick={onAction}
              className="px-3 py-1.5 rounded-xl bg-[#4F6B4A] hover:bg-[#3f573b] text-white text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer shrink-0 focus:outline-none focus:ring-2 focus:ring-[#FAF7F2]"
            >
              {actionText}
            </button>
          )}

          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss notification"
            className="p-1 rounded-lg text-[#9E9B95] hover:text-white transition-colors cursor-pointer shrink-0 focus:outline-none focus:ring-2 focus:ring-[#FAF7F2]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress Bar for timed toasts */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
          <div
            className="h-full bg-[#E8A838] transition-all ease-linear"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
};
