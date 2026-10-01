import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useRouteLockStore } from '../store/useRouteLockStore';
import { Lock, LogOut } from 'lucide-react';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const { isSarahAuthenticated, logoutSarah } = useRouteLockStore();

  const isBook = location.pathname.startsWith('/book') || location.pathname === '/';
  const isDashboard = location.pathname.startsWith('/dashboard');
  const isReadiness = location.pathname.startsWith('/readiness');

  // If currently inside Sarah's private Dashboard
  if (isDashboard) {
    return (
      <header className="sticky top-0 z-40 bg-[#FAF7F2]/95 backdrop-blur-md border-b border-[#E5DFD5]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Zone 1: Brand title with groomer badge */}
          <div className="flex items-center gap-2">
            <Link
              to="/dashboard"
              className="text-xl font-extrabold tracking-tight text-[#3D3D3D] hover:text-[#4F6B4A] transition-colors whitespace-nowrap"
              style={{ fontFamily: 'Nunito, sans-serif' }}
            >
              RouteLock
            </Link>
            <span className="hidden sm:inline-block text-[11px] font-bold text-[#4F6B4A] bg-[#E7EFE5] px-2 py-0.5 rounded-md border border-[#A8BFA0]">
              Sarah's Dispatch Hub
            </span>
          </div>

          {/* Zone 2: Groomer navigation */}
          <nav className="flex items-center gap-5 text-sm font-medium text-[#5C5C5C]">
            <Link
              to="/dashboard"
              className="whitespace-nowrap text-[#3D3D3D] font-bold border-b-2 border-[#4F6B4A] pb-0.5"
            >
              Live Route Timeline
            </Link>
            <Link
              to="/readiness/preview"
              className="hidden md:inline-block whitespace-nowrap hover:text-[#3D3D3D] transition-colors"
            >
              Customer Readiness View
            </Link>
          </nav>

          {/* Zone 3: Groomer actions */}
          <div className="flex items-center gap-2.5">
            <Link
              to="/book"
              className="px-3.5 py-2 text-xs font-semibold text-[#3D3D3D] bg-white hover:bg-[#F0EDE6] border border-[#D5CFBE] rounded-xl transition-all shadow-2xs whitespace-nowrap"
            >
              Customer Booking View →
            </Link>
            {isSarahAuthenticated && (
              <button
                type="button"
                onClick={logoutSarah}
                className="px-3 py-2 text-xs font-semibold text-[#A63D26] hover:bg-[#FBE4DD] rounded-xl transition-colors flex items-center gap-1 border border-[#E8836B]/30"
                title="Lock Groomer Portal"
              >
                <Lock className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Lock Portal</span>
              </button>
            )}
          </div>
        </div>
      </header>
    );
  }

  // Public Customer View Navigation (No admin controls or private stats)
  return (
    <header className="sticky top-0 z-40 bg-[#FAF7F2]/90 backdrop-blur-md border-b border-[#E5DFD5]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Zone 1: Single text element wordmark */}
        <Link
          to="/book"
          className="text-xl font-extrabold tracking-tight text-[#3D3D3D] hover:text-[#4F6B4A] transition-colors whitespace-nowrap"
          style={{ fontFamily: 'Nunito, sans-serif' }}
        >
          RouteLock
        </Link>

        {/* Zone 2: Clean Customer navigation links */}
        <nav className="flex items-center gap-5 text-sm font-medium text-[#5C5C5C]">
          <Link
            to="/book?step=1"
            className={`whitespace-nowrap transition-colors hover:text-[#3D3D3D] ${
              isBook ? 'text-[#3D3D3D] font-bold border-b-2 border-[#4F6B4A] pb-0.5' : ''
            }`}
          >
            Book Visit
          </Link>
          <Link
            to="/book?step=2"
            className="whitespace-nowrap transition-colors hover:text-[#3D3D3D] flex items-center gap-1 text-[#4F6B4A] font-semibold bg-[#E7EFE5] px-2.5 py-1 rounded-lg border border-[#A8BFA0]/60"
          >
            <span>📍 Austin Map & Location</span>
          </Link>
          <Link
            to="/readiness/preview"
            className={`hidden sm:inline-block whitespace-nowrap transition-colors hover:text-[#3D3D3D] ${
              isReadiness ? 'text-[#3D3D3D] font-bold border-b-2 border-[#4F6B4A] pb-0.5' : ''
            }`}
          >
            Arrival Readiness
          </Link>
          {isSarahAuthenticated && (
            <Link
              to="/dashboard"
              className="text-xs font-bold text-[#4F6B4A] bg-[#E7EFE5] px-2.5 py-1 rounded-full border border-[#4F6B4A]/30 flex items-center gap-1"
            >
              <span>Sarah's Hub</span>
            </Link>
          )}
        </nav>

        {/* Zone 3: Primary Customer Action */}
        <div className="flex items-center gap-3">
          <Link
            to="/book?step=1"
            className="px-4 py-2 text-xs font-bold text-[#3D3D3D] bg-[#E8A838] hover:bg-[#deb130] rounded-xl transition-all shadow-sm active:scale-95 whitespace-nowrap shrink-0"
          >
            Reserve Spa Van
          </Link>
        </div>
      </div>
    </header>
  );
};
