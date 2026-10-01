import React, { useEffect } from 'react';
import { AlertTriangle, Trash2, RotateCcw, X } from 'lucide-react';

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel,
}) => {
  // Close on ESC key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-description"
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
    >
      <div className="bg-white rounded-3xl max-w-md w-full border-2 border-[#E5DFD5] shadow-2xl p-6 space-y-5 animate-scale-in">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                variant === 'danger'
                  ? 'bg-[#FBE4DD] text-[#A63D26]'
                  : variant === 'warning'
                  ? 'bg-[#FAF0D9] text-[#E8A838]'
                  : 'bg-[#E7EFE5] text-[#4F6B4A]'
              }`}
            >
              {variant === 'danger' && <Trash2 className="w-5 h-5" />}
              {variant === 'warning' && <AlertTriangle className="w-5 h-5" />}
              {variant === 'primary' && <RotateCcw className="w-5 h-5" />}
            </div>
            <div>
              <h3
                id="confirm-dialog-title"
                className="text-lg font-black text-[#3D3D3D] font-heading"
              >
                {title}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onCancel}
            className="p-1 rounded-lg text-[#9E9B95] hover:text-[#3D3D3D] transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#4F6B4A]"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p id="confirm-dialog-description" className="text-xs text-[#5C5C5C] leading-relaxed">
          {description}
        </p>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 rounded-xl border border-[#D5CFBE] bg-white hover:bg-[#FAF7F2] text-xs font-bold text-[#5C5C5C] hover:text-[#3D3D3D] transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#4F6B4A]"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-5 py-2.5 rounded-xl text-xs font-black text-white transition-all shadow-md active:scale-95 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#4F6B4A] ${
              variant === 'danger'
                ? 'bg-[#A63D26] hover:bg-[#8e321e]'
                : variant === 'warning'
                ? 'bg-[#E8A838] hover:bg-[#d8972b] text-[#3D3D3D]'
                : 'bg-[#4F6B4A] hover:bg-[#3f573b]'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
