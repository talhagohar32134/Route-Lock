import React, { useEffect, useRef, useState } from 'react';
import { loadGoogleMaps } from '../../services/googleMapsLoader';
import { PRESET_ADDRESSES, ZIP_TO_ZONE } from '../../engine/constants';
import { ZoneId } from '../../types';
import { MapPin, Search, CheckCircle2, Navigation, Compass, Globe } from 'lucide-react';

interface GoogleAddressAutocompleteProps {
  value: string;
  onChange: (address: string) => void;
  onSelectAddress: (data: {
    address: string;
    zip: string;
    zone: ZoneId;
    lat?: number;
    lng?: number;
  }) => void;
  selectedZone: ZoneId | null;
  placeholder?: string;
}

export const GoogleAddressAutocomplete: React.FC<GoogleAddressAutocompleteProps> = ({
  value,
  onChange,
  onSelectAddress,
  selectedZone,
  placeholder = 'Type your Austin street address or ZIP code...',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const pacMountRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [suggestions, setSuggestions] = useState<typeof PRESET_ADDRESSES>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [hasGooglePac, setHasGooglePac] = useState(false);
  const [activeMode, setActiveMode] = useState<'austin' | 'google'>('austin');

  // Modern Google Maps PlaceAutocompleteElement setup (Places API New)
  useEffect(() => {
    let isSubscribed = true;
    let pacInstance: any = null;

    loadGoogleMaps()
      .then(async (googleApi) => {
        if (!isSubscribed) return;

        let PlacesLib: any = null;
        try {
          PlacesLib = await googleApi.maps.importLibrary('places');
        } catch {
          PlacesLib = googleApi.maps?.places;
        }

        const PlaceAutocompleteElement =
          PlacesLib?.PlaceAutocompleteElement ||
          googleApi?.maps?.places?.PlaceAutocompleteElement;

        if (PlaceAutocompleteElement && pacMountRef.current) {
          try {
            pacInstance = new PlaceAutocompleteElement({
              requestedRegion: 'us',
            });

            // Bias towards Austin Metropolitan Area
            pacInstance.locationBias = {
              center: { lat: 30.2672, lng: -97.7431 },
              radius: 35000,
            };

            const handlePlaceSelect = async (event: any) => {
              try {
                // Support both event.placePrediction.toPlace() and event.place
                const place = event.placePrediction
                  ? event.placePrediction.toPlace()
                  : event.place;

                if (!place) return;

                if (place.fetchFields) {
                  await place.fetchFields({
                    fields: [
                      'displayName',
                      'formattedAddress',
                      'addressComponents',
                      'location',
                    ],
                  });
                }

                const formattedAddress =
                  place.formattedAddress || place.displayName || '';

                let zip = '';
                if (place.addressComponents) {
                  for (const comp of place.addressComponents) {
                    if (comp.types?.includes('postal_code')) {
                      zip = comp.longText || comp.shortText || '';
                      break;
                    }
                  }
                }

                if (!zip) {
                  const match = formattedAddress.match(/\b(78\d{3})\b/);
                  if (match) zip = match[1];
                }

                let detectedZone: ZoneId = 'Central Austin';
                if (zip && ZIP_TO_ZONE[zip]) {
                  detectedZone = ZIP_TO_ZONE[zip];
                }

                const lat =
                  typeof place.location?.lat === 'function'
                    ? place.location.lat()
                    : place.location?.lat;
                const lng =
                  typeof place.location?.lng === 'function'
                    ? place.location.lng()
                    : place.location?.lng;

                onChange(formattedAddress);
                onSelectAddress({
                  address: formattedAddress,
                  zip,
                  zone: detectedZone,
                  lat,
                  lng,
                });
              } catch (err) {
                console.warn(
                  'PlaceAutocompleteElement place resolution notice:',
                  err
                );
              }
            };

            pacInstance.addEventListener('gmp-select', handlePlaceSelect);
            pacInstance.addEventListener('gmp-placeselect', handlePlaceSelect);

            pacMountRef.current.innerHTML = '';
            pacMountRef.current.appendChild(pacInstance);
            if (isSubscribed) {
              setHasGooglePac(true);
            }
          } catch (err) {
            console.warn(
              'Modern PlaceAutocompleteElement mounting fallback:',
              err
            );
          }
        }
      })
      .catch(() => {
        // Safe offline / fallback mode without throwing errors
      });

    return () => {
      isSubscribed = false;
      if (pacMountRef.current) {
        pacMountRef.current.innerHTML = '';
      }
    };
  }, [onChange, onSelectAddress]);

  // Handle typing & dynamic Austin address suggestions
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    onChange(query);

    if (query.trim().length > 1) {
      const q = query.toLowerCase();
      const filtered = PRESET_ADDRESSES.filter(
        (p) =>
          p.address.toLowerCase().includes(q) ||
          p.neighborhood.toLowerCase().includes(q) ||
          p.zip.includes(q) ||
          p.zone.toLowerCase().includes(q)
      );
      setSuggestions(filtered);
      setShowDropdown(filtered.length > 0);
    } else {
      setSuggestions([]);
      setShowDropdown(false);
    }

    // Extract 5-digit ZIP code if typed directly
    const zipMatch = query.match(/\b(78\d{3})\b/);
    if (zipMatch && zipMatch[1] && ZIP_TO_ZONE[zipMatch[1]]) {
      const detectedZone = ZIP_TO_ZONE[zipMatch[1]];
      onSelectAddress({
        address: query,
        zip: zipMatch[1],
        zone: detectedZone,
      });
    }
  };

  const handleSelectSuggestion = (preset: (typeof PRESET_ADDRESSES)[0]) => {
    onChange(preset.address);
    onSelectAddress({
      address: preset.address,
      zip: preset.zip,
      zone: preset.zone,
    });
    setShowDropdown(false);
  };

  return (
    <div ref={containerRef} className="space-y-3 relative">
      {/* Search Mode Toggle if Google Places is ready */}
      {hasGooglePac && (
        <div className="flex items-center justify-between gap-2 p-1 bg-[#FAF7F2] rounded-xl border border-[#E5DFD5] text-xs">
          <button
            type="button"
            onClick={() => setActiveMode('austin')}
            className={`flex-1 py-1.5 px-3 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeMode === 'austin'
                ? 'bg-[#4F6B4A] text-white shadow-2xs'
                : 'text-[#5C5C5C] hover:text-[#3D3D3D]'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Austin Direct Search</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveMode('google')}
            className={`flex-1 py-1.5 px-3 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeMode === 'google'
                ? 'bg-[#4F6B4A] text-white shadow-2xs'
                : 'text-[#5C5C5C] hover:text-[#3D3D3D]'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Google Places (New)</span>
          </button>
        </div>
      )}

      {/* Mode 1: Austin Direct Search Input Container */}
      {(!hasGooglePac || activeMode === 'austin') && (
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={handleInputChange}
            onFocus={() => {
              setIsFocused(true);
              if (value.trim().length > 1 && suggestions.length > 0) {
                setShowDropdown(true);
              }
            }}
            onBlur={() => {
              setTimeout(() => {
                setIsFocused(false);
                setShowDropdown(false);
              }, 250);
            }}
            placeholder={placeholder}
            className="w-full pl-11 pr-28 py-3.5 rounded-2xl border-2 border-[#D5CFBE] focus:border-[#4F6B4A] focus:outline-none text-sm text-[#3D3D3D] placeholder-[#9E9B95] shadow-xs transition-all bg-white"
          />
          <div className="absolute left-3.5 top-3.5 text-[#4F6B4A]">
            <Search className="w-5 h-5" />
          </div>

          {selectedZone && (
            <div className="absolute right-3.5 top-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#E7EFE5] text-[#4F6B4A] text-xs font-bold border border-[#A8BFA0]/60">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{selectedZone}</span>
            </div>
          )}
        </div>
      )}

      {/* Mode 2: Modern Google Maps PlaceAutocompleteElement Container */}
      <div
        ref={pacMountRef}
        className={`${
          hasGooglePac && activeMode === 'google' ? 'block' : 'hidden'
        } modern-pac-container min-h-[46px] rounded-2xl overflow-hidden border-2 border-[#D5CFBE] focus-within:border-[#4F6B4A] shadow-xs bg-white`}
      />

      {/* Dynamic Dropdown Suggestions for Austin Direct Search */}
      {showDropdown && suggestions.length > 0 && activeMode === 'austin' && (
        <div className="absolute top-12 left-0 right-0 z-30 bg-white rounded-2xl border-2 border-[#4F6B4A] shadow-xl overflow-hidden mt-1 max-h-60 overflow-y-auto">
          <div className="px-3.5 py-2 bg-[#FAF7F2] text-[10px] font-bold uppercase tracking-wider text-[#5C5C5C] border-b border-[#E5DFD5]">
            Austin Address Matches
          </div>
          {suggestions.map((s) => (
            <button
              key={s.address}
              type="button"
              onMouseDown={() => handleSelectSuggestion(s)}
              className="w-full px-4 py-3 text-left hover:bg-[#F4F8F3] border-b border-[#F0EDE6] last:border-b-0 flex items-start justify-between gap-3 transition-colors cursor-pointer"
            >
              <div className="flex items-start gap-2.5 min-w-0">
                <MapPin className="w-4 h-4 text-[#4F6B4A] shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-[#3D3D3D] truncate">
                    {s.neighborhood} · {s.address}
                  </div>
                  <div className="text-[11px] text-[#5C5C5C]">
                    Austin Metro · ZIP {s.zip}
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-bold text-[#4F6B4A] bg-[#E7EFE5] px-2 py-0.5 rounded-full shrink-0">
                {s.zone}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Google Maps Places Standards Badge */}
      <div className="flex items-center justify-between text-[11px] text-[#5C5C5C] px-1">
        <span className="flex items-center gap-1 text-[#4F6B4A]">
          <Navigation className="w-3 h-3" />
          <span>
            {hasGooglePac && activeMode === 'google'
              ? 'Google Places API (New) active'
              : 'Austin Zone Detection & RouteLock active'}
          </span>
        </span>
        <span className="text-[#9E9B95]">Austin Metropolitan Service Area</span>
      </div>

      {/* Instant 1-Click Austin Demo Chips */}
      <div className="space-y-1.5 pt-1">
        <p className="text-[11px] font-bold text-[#5C5C5C] uppercase tracking-wider">
          Quick Demo Address Selection:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {PRESET_ADDRESSES.slice(0, 4).map((p) => {
            const isSelected = value === p.address;
            return (
              <button
                key={p.address}
                type="button"
                onClick={() => {
                  onChange(p.address);
                  onSelectAddress({
                    address: p.address,
                    zip: p.zip,
                    zone: p.zone,
                  });
                }}
                className={`text-left p-2.5 rounded-xl border text-xs transition-all cursor-pointer ${
                  isSelected
                    ? 'border-[#4F6B4A] bg-[#E7EFE5] text-[#3D3D3D] font-bold shadow-2xs'
                    : 'border-[#E5DFD5] bg-white hover:bg-[#FAF7F2] text-[#5C5C5C]'
                }`}
              >
                <div className="font-semibold text-[#3D3D3D] flex items-center justify-between">
                  <span>{p.neighborhood}</span>
                  <span className="text-[10px] text-[#4F6B4A] font-bold">
                    {p.zone}
                  </span>
                </div>
                <div className="text-[11px] text-[#9E9B95] truncate mt-0.5">
                  {p.address}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
