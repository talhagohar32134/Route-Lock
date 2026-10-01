import React, { useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useRouteLockStore } from '../store/useRouteLockStore';
import { Lock, KeyRound, ArrowLeft, ShieldCheck, LogOut, ExternalLink } from 'lucide-react';

export const GroomerLayout: React.FC = () => {
  const navigate = useNavigate();
  const { isGroomerAuthenticated, authenticateGroomer, logoutGroomer } = useRouteLockStore();
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = authenticateGroomer(pinInput);
    if (!success) {
      setPinError('Invalid groomer PIN. (Default demo PIN is 1234)');
    } else {
      setPinError(null);
      setPinInput('');
    }
  };

  const handleQuickFillPin = () => {
    setPinInput('1234');
    authenticateGroomer('1234');
    setPinError(null);
  };

  const handleLockPortal = () => {
    logoutGroomer();
    navigate('/');
  };

  // IF NOT AUTHENTICATED: Render ONLY the Private PIN Access Gate
  if (!isGroomerAuthenticated) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-4 selection:bg-[#A8BFA0]">
        <div className="max-w-md w-full bg-white rounded-3xl border border-[#D5CFBE] p-7 sm:p-8 shadow-xl space-y-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#F0EDE6] border border-[#D5CFBE] flex items-center justify-center mx-auto text-[#4F6B4A] shadow-inner">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-bold text-[#4F6B4A] uppercase tracking-wider bg-[#E7EFE5] px-3 py-1 rounded-full border border-[#A8BFA0] inline-block">
              Private Staff Area
            </span>
            <h1 className="text-2xl font-black text-[#3D3D3D] font-heading">
              Sarah's Dispatch Hub · Private Groomer Access
            </h1>
            <p className="text-xs text-[#5C5C5C] leading-relaxed">
              This portal manages Sarah's live Austin van transit routing, customer contacts, and daily dispatch analytics.
            </p>
          </div>

          <form onSubmit={handlePinSubmit} className="space-y-4 text-left">
            <div>
              <label htmlFor="staff-pin" className="block text-xs font-bold text-[#3D3D3D] uppercase tracking-wider mb-1.5">
                Enter 4-Digit Groomer Passcode
              </label>
              <div className="relative">
                <input
                  id="staff-pin"
                  type="password"
                  autoFocus
                  required
                  maxLength={6}
                  value={pinInput}
                  onChange={(e) => {
                    setPinInput(e.target.value);
                    setPinError(null);
                  }}
                  placeholder="••••"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#D5CFBE] bg-[#FAF7F2] text-center tracking-[0.5em] text-lg font-mono text-[#3D3D3D] focus:outline-none focus:ring-2 focus:ring-[#4F6B4A] shadow-inner"
                />
                <KeyRound className="w-4 h-4 text-[#5C5C5C] absolute left-3.5 top-3.5" />
              </div>
              {pinError && (
                <p className="text-xs text-[#A63D26] mt-1.5 font-medium">{pinError}</p>
              )}
            </div>

            {/* Quick Action Demo PIN Helper */}
            <div className="p-3 rounded-xl bg-[#F4F1EB] border border-[#E5DFD5] flex items-center justify-between text-xs text-[#5C5C5C]">
              <span>Demo PIN: <strong className="text-[#3D3D3D] font-mono">1234</strong></span>
              <button
                type="button"
                onClick={handleQuickFillPin}
                className="text-[11px] font-bold text-[#4F6B4A] hover:text-[#3d5439] underline decoration-[#A8BFA0] hover:decoration-[#4F6B4A] cursor-pointer"
              >
                Demo PIN: 1234 Quick-Fill
              </button>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-[#4F6B4A] hover:bg-[#3f573b] text-white text-xs font-black transition-all shadow-md active:scale-95 cursor-pointer uppercase tracking-wider"
            >
              Unlock Dispatch Hub
            </button>
          </form>

          <div className="pt-3 border-t border-[#EFEAE1]">
            <Link
              to="/book"
              className="text-xs text-[#5C5C5C] hover:text-[#3D3D3D] font-semibold inline-flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>← Return to Customer Booking View</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // IF AUTHENTICATED: Render Top Header (Dark Sage Bar) + Dashboard Outlet
  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#3D3D3D] flex flex-col">
      {/* Top Header: Dark Sage "Groomer Mode Active — Sarah's Dispatch Hub" Bar */}
      <header className="sticky top-0 z-40 bg-[#4F6B4A] text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-[#E8A838] animate-pulse shrink-0" />
            <div className="flex items-center gap-2">
              <span className="text-sm font-black tracking-wide font-heading">
                Groomer Mode Active — Sarah's Dispatch Hub
              </span>
              <span className="hidden md:inline-block text-[10px] font-bold uppercase tracking-wider bg-white/15 px-2 py-0.5 rounded text-white/90">
                Live Van Route
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/book"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-white/10 hover:bg-white/20 rounded-lg transition-colors border border-white/20"
            >
              <span>Customer Booking View</span>
              <ExternalLink className="w-3 h-3" />
            </Link>

            <button
              type="button"
              onClick={handleLockPortal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-[#A63D26] hover:bg-[#8f321d] rounded-lg transition-all shadow-sm active:scale-95 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Lock Portal / Exit</span>
            </button>
          </div>
        </div>
      </header>

      {/* Groomer Content Area */}
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
};
