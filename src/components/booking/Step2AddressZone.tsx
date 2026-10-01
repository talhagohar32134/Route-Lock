import React, { useState } from 'react';
import { useRouteLockStore } from '../../store/useRouteLockStore';
import { PresetAddress, ZoneId } from '../../types';
import { PRESET_ADDRESSES, ZIP_TO_ZONE, ZONES } from '../../engine/constants';
import { AustinZoneMapSvg } from '../illustrations/AustinZoneMapSvg';
import { GoogleAddressAutocomplete } from '../maps/GoogleAddressAutocomplete';
import { MapPin, Navigation, AlertCircle, ArrowLeft, Mail, CheckCircle2, Sparkles } from 'lucide-react';

interface Props {
  onNext: () => void;
  onBack: () => void;
}

export const Step2AddressZone: React.FC<Props> = ({ onNext, onBack }) => {
  const { bookingDraft, setBookingDraft } = useRouteLockStore();
  const [addressInput, setAddressInput] = useState(bookingDraft.address);
  const [zipInput, setZipInput] = useState(bookingDraft.zip);
  const [showWaitlistModal, setShowWaitlistModal] = useState(false);
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [waitlistSubmitted, setWaitlistSubmitted] = useState(false);
  const [addressError, setAddressError] = useState<string | null>(null);

  const handleSelectPreset = (preset: PresetAddress) => {
    setAddressInput(preset.address);
    setZipInput(preset.zip);
    setAddressError(null);
    setBookingDraft({
      address: preset.address,
      zone: preset.zone,
      zip: preset.zip,
    });
  };

  const handleAddressChange = (addr: string) => {
    setAddressInput(addr);
    setAddressError(null);

    // Try extracting 5-digit zip code
    const zipMatch = addr.match(/\b(78\d{3})\b/);
    if (zipMatch) {
      const detectedZip = zipMatch[1];
      setZipInput(detectedZip);
      const mappedZone = ZIP_TO_ZONE[detectedZip];
      if (mappedZone) {
        setBookingDraft({ address: addr, zip: detectedZip, zone: mappedZone });
      }
    } else {
      setBookingDraft({ address: addr });
    }
  };

  const handleZipChange = (zip: string) => {
    setZipInput(zip);
    setAddressError(null);
    if (zip.length === 5) {
      const mappedZone = ZIP_TO_ZONE[zip];
      if (mappedZone) {
        setBookingDraft({ zip, zone: mappedZone });
      } else {
        // Zip outside service radius
        setAddressError(`Zip code ${zip} is currently outside Sarah's mobile service coverage.`);
        setShowWaitlistModal(true);
      }
    }
  };

  const handleMapZoneSelect = (zone: ZoneId) => {
    const preset = PRESET_ADDRESSES.find((p) => p.zone === zone);
    if (preset) {
      setAddressInput(preset.address);
      setZipInput(preset.zip);
      setBookingDraft({
        address: preset.address,
        zone,
        zip: preset.zip,
      });
      setAddressError(null);
    } else {
      setBookingDraft({ zone });
    }
  };

  const canContinue = !!bookingDraft.zone && !!(bookingDraft.address.trim() || addressInput.trim());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const effectiveAddress = addressInput.trim() || bookingDraft.address.trim();
    const effectiveZone = bookingDraft.zone || 'Central Austin';

    if (!effectiveAddress) {
      const defaultPreset = PRESET_ADDRESSES.find((p) => p.zone === effectiveZone) || PRESET_ADDRESSES[0];
      setAddressInput(defaultPreset.address);
      setBookingDraft({
        address: defaultPreset.address,
        zone: defaultPreset.zone,
        zip: defaultPreset.zip,
      });
      onNext();
      return;
    }

    setBookingDraft({
      address: effectiveAddress,
      zone: effectiveZone,
    });
    onNext();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-bold text-[#4F6B4A] uppercase tracking-wider mb-1">
          <MapPin className="w-4 h-4" />
          <span>Step 2: Service Location & Zone Map</span>
        </div>
        <h2 className="text-2xl font-extrabold text-[#3D3D3D] font-heading">
          Where Should Sarah Meet You in Austin?
        </h2>
        <p className="text-sm text-[#5C5C5C] mt-1">
          Select your neighborhood on the interactive Austin map or pick a demo address below to calculate transit times.
        </p>
      </div>

      {/* Helpful instruction banner */}
      <div className="p-3.5 rounded-xl bg-[#E7EFE5] border border-[#A8BFA0] flex items-center justify-between text-xs text-[#3D3D3D]">
        <div className="flex items-center gap-2 font-medium">
          <span className="text-base">💡</span>
          <span>
            <strong>3 Ways to Select Location:</strong> 1. Click on the Austin Map to the right &nbsp;·&nbsp; 2. Type your street & zip &nbsp;·&nbsp; 3. Click any Austin Demo Address below
          </span>
        </div>
      </div>

      {/* Main 2-column layout: Inputs on left, Interactive Map on right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Form & Presets */}
        <div className="lg:col-span-6 space-y-5">
          {/* Address input with Google Places Autocomplete */}
          <div>
            <label className="block text-xs font-bold text-[#3D3D3D] uppercase tracking-wider mb-2">
              Street Address (Customer Driveway / Curb) *
            </label>
            <GoogleAddressAutocomplete
              value={addressInput}
              onChange={(addr) => {
                setAddressInput(addr);
                setAddressError(null);
                setBookingDraft({ address: addr });
              }}
              onSelectAddress={({ address, zip, zone }) => {
                setAddressInput(address);
                if (zip) setZipInput(zip);
                setAddressError(null);
                setBookingDraft({ address, zip: zip || zipInput, zone });
              }}
              selectedZone={bookingDraft.zone}
            />
            {addressError && (
              <div className="mt-2 text-xs text-[#A63D26] flex items-center gap-1.5 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{addressError}</span>
              </div>
            )}
          </div>

          {/* Zip Code & Zone Badge */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="zip-code" className="block text-xs font-bold text-[#3D3D3D] uppercase tracking-wider mb-2">
                Austin ZIP Code
              </label>
              <input
                id="zip-code"
                type="text"
                maxLength={5}
                value={zipInput}
                onChange={(e) => handleZipChange(e.target.value)}
                placeholder="78704"
                className="w-full px-4 py-3 rounded-xl border border-[#D5CFBE] bg-white text-[#3D3D3D] placeholder-[#9E9B95] focus:outline-none focus:ring-2 focus:ring-[#4F6B4A]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#3D3D3D] uppercase tracking-wider mb-2">
                Route Zone
              </label>
              <div className="h-[46px] px-3 py-2 rounded-xl bg-[#F0EDE6] border border-[#D5CFBE] flex items-center justify-between text-xs">
                <span className="font-bold text-[#3D3D3D] truncate">
                  {bookingDraft.zone || 'Auto-detecting...'}
                </span>
                {bookingDraft.zone && (
                  <span className="w-2 h-2 rounded-full bg-[#4F6B4A] shrink-0" />
                )}
              </div>
            </div>
          </div>

          {/* Quick Preset Addresses */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#3D3D3D] uppercase tracking-wider">
                Quick Demo Addresses Across Austin
              </span>
              <span className="text-[11px] text-[#5C5C5C]">Click to auto-fill</span>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {PRESET_ADDRESSES.slice(0, 6).map((preset) => {
                const isSelected = bookingDraft.address === preset.address;
                return (
                  <button
                    key={preset.address}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all flex items-center justify-between ${
                      isSelected
                        ? 'border-[#4F6B4A] bg-[#F4F8F3] text-[#3D3D3D] font-medium'
                        : 'border-[#E5DFD5] bg-white hover:border-[#A8BFA0] text-[#5C5C5C]'
                    }`}
                  >
                    <div className="truncate pr-2">
                      <div className="font-semibold text-[#3D3D3D] truncate">{preset.neighborhood}</div>
                      <div className="text-[11px] text-[#5C5C5C] truncate">{preset.address}</div>
                    </div>
                    <span className="text-[10px] font-bold text-[#4F6B4A] bg-[#E7EFE5] px-2 py-0.5 rounded whitespace-nowrap">
                      {preset.zone}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Out of area trigger link */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowWaitlistModal(true)}
              className="text-xs text-[#5C5C5C] hover:text-[#4F6B4A] underline underline-offset-2 transition-colors inline-flex items-center gap-1"
            >
              <Navigation className="w-3 h-3" />
              <span>Don't see your Austin neighborhood? Join Sarah's route expansion waitlist</span>
            </button>
          </div>
        </div>

        {/* Right Column: Austin Interactive Zone Map */}
        <div className="lg:col-span-6 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#3D3D3D] uppercase tracking-wider">
              Austin Service Territory Map
            </span>
            <span className="text-xs text-[#5C5C5C]">
              Click zone to inspect
            </span>
          </div>

          <AustinZoneMapSvg
            selectedZone={bookingDraft.zone}
            onSelectZone={handleMapZoneSelect}
            className="w-full h-auto max-h-[380px]"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-6 border-t border-[#E5DFD5]">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#D5CFBE] text-xs font-bold text-[#5C5C5C] hover:text-[#3D3D3D] hover:bg-white transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Pet Details</span>
        </button>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canContinue}
          className={`px-6 py-3 rounded-xl text-sm font-bold transition-all shadow-md active:scale-95 ${
            canContinue
              ? 'bg-[#E8A838] hover:bg-[#d8972b] text-[#3D3D3D]'
              : 'bg-[#E5DFD5] text-[#9E9B95] cursor-not-allowed'
          }`}
        >
          View RouteLock Schedule →
        </button>
      </div>

      {/* Out of Area Waitlist Modal */}
      {showWaitlistModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-[#FAF7F2] rounded-3xl border border-[#D5CFBE] p-6 max-w-md w-full shadow-2xl relative">
            <h3 className="text-xl font-extrabold text-[#3D3D3D] font-heading">
              Sarah is Expanding Her Route!
            </h3>
            <p className="text-xs text-[#5C5C5C] mt-2">
              Paws & Routes prioritizes low van travel to keep dogs calm and avoid traffic delays. When 10+ pet parents sign up in your neighborhood, Sarah adds a dedicated weekly route day!
            </p>

            {waitlistSubmitted ? (
              <div className="my-6 p-4 rounded-2xl bg-[#E7EFE5] border border-[#A8BFA0] text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-[#4F6B4A] mx-auto" />
                <div className="text-sm font-bold text-[#3D3D3D]">You're on the priority list!</div>
                <div className="text-xs text-[#5C5C5C]">
                  We'll email you the moment Sarah opens a route day in your area.
                </div>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (waitlistEmail) setWaitlistSubmitted(true);
                }}
                className="my-5 space-y-3"
              >
                <div>
                  <label className="block text-xs font-semibold text-[#3D3D3D] mb-1">
                    Your Email Address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      value={waitlistEmail}
                      onChange={(e) => setWaitlistEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#D5CFBE] bg-white text-sm text-[#3D3D3D] focus:outline-none focus:ring-2 focus:ring-[#4F6B4A]"
                    />
                    <Mail className="w-4 h-4 text-[#5C5C5C] absolute left-3 top-3" />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-[#4F6B4A] hover:bg-[#3f573b] text-white text-xs font-bold transition-all shadow-sm"
                >
                  Join Route Expansion Waitlist
                </button>
              </form>
            )}

            <div className="flex justify-end pt-2 border-t border-[#E5DFD5]">
              <button
                type="button"
                onClick={() => {
                  setShowWaitlistModal(false);
                  setWaitlistSubmitted(false);
                }}
                className="px-4 py-2 text-xs font-semibold text-[#5C5C5C] hover:text-[#3D3D3D]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
