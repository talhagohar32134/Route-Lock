import React, { useState, useEffect } from 'react';
import { AlertCircle, X } from 'lucide-react';

export function isLocalStorageAvailable(): boolean {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return false;
    const testKey = '__routelock_storage_test__';
    window.localStorage.setItem(testKey, '1');
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

export const StorageBanner: React.FC = () => {
  const [isAvailable, setIsAvailable] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setIsAvailable(isLocalStorageAvailable());
  }, []);

  if (isAvailable || dismissed) return null;

  return (
    <div
      role="alert"
      className="bg-[#FAF0D9] border-b border-[#E8A838]/60 text-[#3D3D3D] px-4 py-2 text-xs flex items-center justify-between"
    >
      <div className="flex items-center gap-2 max-w-5xl mx-auto flex-1">
        <AlertCircle className="w-4 h-4 text-[#E8A838] shrink-0" />
        <span className="font-semibold">
          Storage Unavailable: Bookings won't be saved if you close this tab.
        </span>
      </div>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="p-1 text-[#5C5C5C] hover:text-[#3D3D3D] cursor-pointer"
        aria-label="Dismiss banner"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
