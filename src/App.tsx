import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { PublicLayout } from './layouts/PublicLayout';
import { GroomerLayout } from './layouts/GroomerLayout';
import { CustomerBookingPage } from './pages/CustomerBookingPage';
import { ReadinessPortalPage } from './pages/ReadinessPortalPage';
import { SarahDashboardPage } from './pages/SarahDashboardPage';
import { StorageBanner } from './components/shared/StorageBanner';

export default function App() {
  const [quotaExceeded, setQuotaExceeded] = useState(false);

  useEffect(() => {
    const handleQuotaExceeded = () => setQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', handleQuotaExceeded);
    return () => window.removeEventListener('gmp-quota-exceeded', handleQuotaExceeded);
  }, []);

  return (
    <BrowserRouter>
      {quotaExceeded && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-xs">
          <span>
            Google Maps Platform quota reached. If you are the app owner, visit{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold text-amber-950 hover:text-amber-800"
            >
              maps developer site
            </a>{' '}
            for instructions to update your account.
          </span>
        </div>
      )}
      <StorageBanner />
      <Routes>
        {/* Portal 1: Public Client Portal (PublicLayout) */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Navigate to="/book?step=1" replace />} />
          <Route path="/book" element={<CustomerBookingPage />} />
          <Route path="/readiness/:id" element={<ReadinessPortalPage />} />
        </Route>

        {/* Portal 2: Private Groomer Portal (GroomerLayout with PIN Gate) */}
        <Route element={<GroomerLayout />}>
          <Route path="/dashboard" element={<SarahDashboardPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/book" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
