import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';

export const PublicLayout: React.FC = () => {
  const location = useLocation();
  const isBook = location.pathname.startsWith('/book') || location.pathname === '/';
  const isReadiness = location.pathname.startsWith('/readiness');

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F2] text-[#3D3D3D] selection:bg-[#A8BFA0] selection:text-[#3D3D3D]">
      {/* Strictly Public Customer Navigation Bar - No Admin Indicators or Controls */}
      <header className="sticky top-0 z-40 bg-[#FAF7F2]/90 backdrop-blur-md border-b border-[#E5DFD5]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Brand Wordmark */}
          <Link
            to="/book?step=1"
            className="text-xl font-extrabold tracking-tight text-[#3D3D3D] hover:text-[#4F6B4A] transition-colors whitespace-nowrap"
            style={{ fontFamily: 'Nunito, sans-serif' }}
          >
            RouteLock
          </Link>

          {/* Clean Public Nav Links */}
          <nav className="flex items-center gap-5 text-sm font-medium text-[#5C5C5C]">
            <Link
              to="/book?step=1"
              className={`whitespace-nowrap transition-colors hover:text-[#3D3D3D] ${
                isBook && !location.search.includes('step=2')
                  ? 'text-[#3D3D3D] font-bold border-b-2 border-[#4F6B4A] pb-0.5'
                  : ''
              }`}
            >
              Book Visit
            </Link>
            <Link
              to="/book?step=2"
              className={`whitespace-nowrap transition-colors hover:text-[#3D3D3D] flex items-center gap-1 text-[#4F6B4A] font-semibold bg-[#E7EFE5] px-2.5 py-1 rounded-lg border border-[#A8BFA0]/60 ${
                location.search.includes('step=2') ? 'ring-2 ring-[#4F6B4A]/20' : ''
              }`}
            >
              <span>📍 Austin Map</span>
            </Link>
            <Link
              to="/readiness/preview"
              className={`hidden sm:inline-block whitespace-nowrap transition-colors hover:text-[#3D3D3D] ${
                isReadiness ? 'text-[#3D3D3D] font-bold border-b-2 border-[#4F6B4A] pb-0.5' : ''
              }`}
            >
              Arrival Readiness
            </Link>
          </nav>

          {/* Public Booking CTA */}
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

      {/* Main Public Content Outlet */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Subtle, Non-Intrusive Public Footer with Staff Access text link */}
      <footer className="border-t border-[#E5DFD5] bg-[#F7F4EE] py-8 px-4 text-center">
        <div className="max-w-4xl mx-auto space-y-2">
          <p className="text-xs text-[#5C5C5C]">
            © 2026 Paws & Routes Mobile Pet Grooming LLC · Austin, Texas · Climate-Controlled 1-on-1 Mobile Pet Spa
          </p>
          <div className="flex items-center justify-center gap-3 text-[11px] text-[#9E9B95]">
            <span>Central Austin (78704)</span>
            <span>·</span>
            <span>Direct: (512) 555-0100</span>
            <span>·</span>
            <Link
              to="/dashboard"
              className="text-[#9E9B95] hover:text-[#4F6B4A] transition-colors underline decoration-[#D5CFBE] hover:decoration-[#4F6B4A]"
            >
              Staff Access 🔒
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
