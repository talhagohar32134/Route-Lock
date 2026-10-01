import React, { useState, useMemo } from 'react';
import { useRouteLockStore } from '../../store/useRouteLockStore';
import { PetSize, PetSpecies, ServiceId } from '../../types';
import { APP_IMAGES, CAT_BREEDS, DOG_BREEDS, SERVICES, SIZES } from '../../engine/constants';
import { calculateDuration } from '../../engine/scheduler';
import { PetSilhouette } from '../illustrations/PetSilhouettes';
import { Check, Clock, Sparkles, Search, Scissors, Heart, Award } from 'lucide-react';

interface Props {
  onNext: () => void;
}

export const Step1PetService: React.FC<Props> = ({ onNext }) => {
  const { bookingDraft, setBookingDraft } = useRouteLockStore();
  const [breedQuery, setBreedQuery] = useState(bookingDraft.petBreed || '');
  const [showBreedDropdown, setShowBreedDropdown] = useState(false);
  const [breedCategoryFilter, setBreedCategoryFilter] = useState<'all' | 'popular' | 'hypo' | 'long'>('all');

  const breedsList = bookingDraft.petSpecies === 'dog' ? DOG_BREEDS : CAT_BREEDS;

  // Filtered breeds based on query & category
  const filteredBreeds = useMemo(() => {
    let list = breedsList;
    if (breedCategoryFilter === 'popular') {
      list = list.slice(0, 14);
    } else if (breedCategoryFilter === 'hypo') {
      const hypoKeywords = ['poodle', 'doodle', 'sphynx', 'bengal', 'bichon', 'schnauzer', 'maltese', 'maltipoo', 'balinese', 'siberian', 'devon', 'cornish'];
      list = list.filter((b) => hypoKeywords.some((k) => b.toLowerCase().includes(k)));
    } else if (breedCategoryFilter === 'long') {
      const longKeywords = ['golden', 'shepherd', 'husky', 'bernese', 'pomeranian', 'longhair', 'persian', 'maine', 'ragdoll', 'norwegian', 'birman', 'collie', 'spaniel'];
      list = list.filter((b) => longKeywords.some((k) => b.toLowerCase().includes(k)));
    }

    if (!breedQuery.trim()) return list;
    return breedsList.filter((b) =>
      b.toLowerCase().includes(breedQuery.toLowerCase())
    );
  }, [breedQuery, breedsList, breedCategoryFilter]);

  const totalDuration = calculateDuration(bookingDraft.serviceId, bookingDraft.petSize);
  const hours = Math.floor(totalDuration / 60);
  const mins = totalDuration % 60;
  const durationText = hours > 0 ? `${hours} hr ${mins > 0 ? `${mins} min` : ''}` : `${mins} min`;

  const handleSpeciesChange = (species: PetSpecies) => {
    setBookingDraft({
      petSpecies: species,
      petBreed: species === 'dog' ? 'Golden Retriever' : 'Domestic Shorthair',
    });
    setBreedQuery('');
    setBreedCategoryFilter('all');
  };

  const handleSelectBreed = (breed: string) => {
    setBreedQuery(breed);
    setBookingDraft({ petBreed: breed });
    setShowBreedDropdown(false);
  };

  const handleBreedBlur = () => {
    setTimeout(() => {
      setShowBreedDropdown(false);
      if (breedQuery.trim() && !bookingDraft.petBreed) {
        setBookingDraft({ petBreed: breedQuery.trim() });
      }
    }, 200);
  };

  const canContinue = !!bookingDraft.petName.trim() && !!(bookingDraft.petBreed || breedQuery).trim();

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    setBookingDraft({
      petName: bookingDraft.petName?.trim() || 'My Pet',
      petBreed: bookingDraft.petBreed || breedQuery.trim() || (bookingDraft.petSpecies === 'dog' ? 'Golden Retriever' : 'Domestic Shorthair'),
    });
    onNext();
  };

  const handleQuickJumpToZone = (zone: typeof bookingDraft.zone) => {
    setBookingDraft({
      petName: bookingDraft.petName?.trim() || 'My Pet',
      petBreed: bookingDraft.petBreed || breedQuery.trim() || (bookingDraft.petSpecies === 'dog' ? 'Golden Retriever' : 'Domestic Shorthair'),
      zone: zone || 'Central Austin',
    });
    onNext();
  };

  return (
    <form onSubmit={handleContinue} className="space-y-8">
      {/* Header section with brand personality */}
      <div className="border-b border-[#E5DFD5] pb-5">
        <div className="flex items-center gap-2 text-xs font-bold text-[#4F6B4A] uppercase tracking-wider mb-1">
          <Award className="w-4 h-4" />
          <span>Austin's Private 1-on-1 Mobile Pet Spa</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-[#3D3D3D] font-heading">
          Tell Sarah About Your Pet
        </h2>
        <p className="text-sm text-[#5C5C5C] mt-1 leading-relaxed">
          Zero cage drying, zero cross-pet barking. Sarah brings her custom hydro-surge spa van right outside your doorstep.
        </p>
      </div>

      {/* Prominent Quick-Jump to Location & Zone Map Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#F4F8F3] to-[#E7EFE5] border-2 border-[#A8BFA0] shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#4F6B4A] text-white flex items-center justify-center shrink-0 shadow-sm">
              <span className="text-lg">📍</span>
            </div>
            <div>
              <div className="text-xs font-extrabold text-[#4F6B4A] uppercase tracking-wider">
                Select Your Austin Location (Step 2)
              </div>
              <div className="text-sm font-bold text-[#3D3D3D]">
                Want to check your address or view Sarah's Austin zone map right now?
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleQuickJumpToZone(bookingDraft.zone || 'Central Austin')}
            className="px-5 py-2.5 rounded-xl bg-[#4F6B4A] hover:bg-[#3f573b] text-white text-xs font-bold transition-all shadow-md shrink-0 flex items-center justify-center gap-1.5 active:scale-95"
          >
            <span>Open Address & Map Now →</span>
          </button>
        </div>

        {/* Quick Austin Zone Jump Chips */}
        <div className="pt-2 border-t border-[#A8BFA0]/40 flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-[11px] font-bold text-[#5C5C5C] mr-1">Direct Zone Jump:</span>
          {[
            'Central Austin',
            'South Austin',
            'North Austin',
            'East Austin',
            'Cedar Park',
            'Round Rock',
            'Oak Hill/West',
          ].map((z) => (
            <button
              key={z}
              type="button"
              onClick={() => handleQuickJumpToZone(z as any)}
              className="px-2.5 py-1 rounded-lg bg-white/90 hover:bg-white text-[#3D3D3D] hover:text-[#4F6B4A] border border-[#A8BFA0] text-[11px] font-semibold transition-all shadow-2xs hover:scale-105"
            >
              {z}
            </button>
          ))}
        </div>
      </div>

      {/* Visual Species Selector with High-Resolution Photography */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-xs font-bold text-[#3D3D3D] uppercase tracking-wider">
            1. Select Pet Species
          </label>
          <span className="text-xs text-[#5C5C5C]">
            {breedsList.length}+ verified breeds supported
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Dog Card */}
          <button
            type="button"
            onClick={() => handleSpeciesChange('dog')}
            className={`group relative overflow-hidden rounded-2xl border-2 text-left transition-all p-3 flex gap-3.5 items-center ${
              bookingDraft.petSpecies === 'dog'
                ? 'border-[#4F6B4A] bg-[#F4F8F3] shadow-md ring-2 ring-[#4F6B4A]/10'
                : 'border-[#E5DFD5] bg-white hover:border-[#A8BFA0] hover:shadow-sm'
            }`}
          >
            {/* Real photo thumbnail with fallback container */}
            <div className="relative w-24 h-24 rounded-xl overflow-hidden shrink-0 border border-[#E5DFD5] bg-[#F0EDE6]">
              <img
                src={APP_IMAGES.dogGroomed}
                alt="Freshly groomed Golden Retriever"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent flex items-end p-1.5">
                <span className="text-[10px] text-white font-bold drop-shadow">Dogs 🐕</span>
              </div>
            </div>

            <div className="flex-1 min-w-0 pr-2">
              <div className="flex items-center justify-between">
                <span className="text-base font-extrabold text-[#3D3D3D] font-heading">
                  Canine Grooming
                </span>
                <div
                  className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                    bookingDraft.petSpecies === 'dog'
                      ? 'border-[#4F6B4A] bg-[#4F6B4A] text-white'
                      : 'border-[#D5CFBE] bg-white'
                  }`}
                >
                  {bookingDraft.petSpecies === 'dog' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
              </div>
              <p className="text-xs text-[#5C5C5C] mt-1 line-clamp-2">
                Puppies, doodles, shedding breeds & seniors. Warm blow-dry & hand scissoring.
              </p>
              <div className="text-[11px] font-semibold text-[#4F6B4A] mt-1.5 flex items-center gap-1">
                <span>{DOG_BREEDS.length} breeds cataloged</span>
              </div>
            </div>
          </button>

          {/* Cat Card */}
          <button
            type="button"
            onClick={() => handleSpeciesChange('cat')}
            className={`group relative overflow-hidden rounded-2xl border-2 text-left transition-all p-3 flex gap-3.5 items-center ${
              bookingDraft.petSpecies === 'cat'
                ? 'border-[#4F6B4A] bg-[#F4F8F3] shadow-md ring-2 ring-[#4F6B4A]/10'
                : 'border-[#E5DFD5] bg-white hover:border-[#A8BFA0] hover:shadow-sm'
            }`}
          >
            {/* Real photo thumbnail with fallback container */}
            <div className="relative w-24 h-24 rounded-xl overflow-hidden shrink-0 border border-[#E5DFD5] bg-[#F0EDE6]">
              <img
                src={APP_IMAGES.catGroomed}
                alt="Gentle groomed Ragdoll cat"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent flex items-end p-1.5">
                <span className="text-[10px] text-white font-bold drop-shadow">Cats 🐈</span>
              </div>
            </div>

            <div className="flex-1 min-w-0 pr-2">
              <div className="flex items-center justify-between">
                <span className="text-base font-extrabold text-[#3D3D3D] font-heading">
                  Feline Spa Care
                </span>
                <div
                  className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                    bookingDraft.petSpecies === 'cat'
                      ? 'border-[#4F6B4A] bg-[#4F6B4A] text-white'
                      : 'border-[#D5CFBE] bg-white'
                  }`}
                >
                  {bookingDraft.petSpecies === 'cat' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
              </div>
              <p className="text-xs text-[#5C5C5C] mt-1 line-clamp-2">
                Gentle desensitization, dematting, sanitary trims & low-noise air fluffing.
              </p>
              <div className="text-[11px] font-semibold text-[#4F6B4A] mt-1.5 flex items-center gap-1">
                <span>{CAT_BREEDS.length} breeds cataloged</span>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Pet Name & 50+ Breed Search Autocomplete */}
      <div className="space-y-3">
        <span className="text-xs font-bold text-[#3D3D3D] uppercase tracking-wider block">
          2. Name & Breed Details
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="pet-name" className="block text-xs font-semibold text-[#3D3D3D] mb-1.5">
              Pet's Name *
            </label>
            <input
              id="pet-name"
              type="text"
              required
              value={bookingDraft.petName}
              onChange={(e) => setBookingDraft({ petName: e.target.value })}
              placeholder={bookingDraft.petSpecies === 'dog' ? 'e.g. Cooper, Bailey, Teddy' : 'e.g. Luna, Milo, Cleo'}
              className="w-full px-4 py-3 rounded-xl border border-[#D5CFBE] bg-white text-[#3D3D3D] placeholder-[#9E9B95] focus:outline-none focus:ring-2 focus:ring-[#4F6B4A] text-sm shadow-sm"
            />
          </div>

          <div className="relative">
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="pet-breed" className="text-xs font-semibold text-[#3D3D3D]">
                Breed Search ({breedsList.length} Options) *
              </label>
              {bookingDraft.petBreed && (
                <span className="text-[11px] text-[#4F6B4A] font-medium">
                  Selected: {bookingDraft.petBreed}
                </span>
              )}
            </div>

            <div className="relative">
              <input
                id="pet-breed"
                type="text"
                value={breedQuery || bookingDraft.petBreed}
                onFocus={() => setShowBreedDropdown(true)}
                onBlur={handleBreedBlur}
                onChange={(e) => {
                  setBreedQuery(e.target.value);
                  setBookingDraft({ petBreed: e.target.value });
                  setShowBreedDropdown(true);
                }}
                placeholder={`Search 50+ ${bookingDraft.petSpecies} breeds...`}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#D5CFBE] bg-white text-[#3D3D3D] placeholder-[#9E9B95] focus:outline-none focus:ring-2 focus:ring-[#4F6B4A] text-sm shadow-sm"
              />
              <Search className="w-4 h-4 text-[#9E9B95] absolute left-3.5 top-3.5" />
            </div>

            {/* Quick Category Filter Pills */}
            <div className="flex items-center gap-1.5 mt-2 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => setBreedCategoryFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-colors ${
                  breedCategoryFilter === 'all'
                    ? 'bg-[#3D3D3D] text-white'
                    : 'bg-[#F0EDE6] text-[#5C5C5C] hover:bg-[#E5DFD5]'
                }`}
              >
                All Breeds ({breedsList.length})
              </button>
              <button
                type="button"
                onClick={() => setBreedCategoryFilter('popular')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-colors ${
                  breedCategoryFilter === 'popular'
                    ? 'bg-[#3D3D3D] text-white'
                    : 'bg-[#F0EDE6] text-[#5C5C5C] hover:bg-[#E5DFD5]'
                }`}
              >
                Top 15 Popular
              </button>
              <button
                type="button"
                onClick={() => setBreedCategoryFilter('hypo')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-colors ${
                  breedCategoryFilter === 'hypo'
                    ? 'bg-[#3D3D3D] text-white'
                    : 'bg-[#F0EDE6] text-[#5C5C5C] hover:bg-[#E5DFD5]'
                }`}
              >
                Hypoallergenic
              </button>
              <button
                type="button"
                onClick={() => setBreedCategoryFilter('long')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-colors ${
                  breedCategoryFilter === 'long'
                    ? 'bg-[#3D3D3D] text-white'
                    : 'bg-[#F0EDE6] text-[#5C5C5C] hover:bg-[#E5DFD5]'
                }`}
              >
                Fluffy / Long Coat
              </button>
            </div>

            {/* Dropdown Menu */}
            {showBreedDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 max-h-56 overflow-y-auto bg-white rounded-2xl shadow-xl border border-[#D5CFBE] z-30 p-1.5 space-y-0.5">
                {filteredBreeds.length > 0 ? (
                  filteredBreeds.map((breed) => (
                    <button
                      key={breed}
                      type="button"
                      onMouseDown={() => handleSelectBreed(breed)}
                      className={`w-full px-3.5 py-2 text-left text-xs rounded-xl flex items-center justify-between transition-colors ${
                        bookingDraft.petBreed === breed
                          ? 'bg-[#F4F8F3] text-[#4F6B4A] font-bold'
                          : 'text-[#3D3D3D] hover:bg-[#F0EDE6]'
                      }`}
                    >
                      <span>{breed}</span>
                      {bookingDraft.petBreed === breed && (
                        <Check className="w-3.5 h-3.5 text-[#4F6B4A]" />
                      )}
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-3 text-xs text-[#5C5C5C] space-y-1">
                    <p className="font-semibold text-[#3D3D3D]">No catalog match for "{breedQuery}"</p>
                    <p className="text-[11px]">You can press enter to save this as a custom breed.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pet Size / Weight Guidance */}
      <div>
        <label className="block text-xs font-bold text-[#3D3D3D] uppercase tracking-wider mb-2">
          3. Pet Weight Class (Accurately calculates bathing & hand-drying time)
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(Object.keys(SIZES) as PetSize[]).map((sizeKey) => {
            const size = SIZES[sizeKey];
            const isSelected = bookingDraft.petSize === sizeKey;
            return (
              <button
                key={sizeKey}
                type="button"
                onClick={() => setBookingDraft({ petSize: sizeKey })}
                className={`p-3.5 rounded-2xl border-2 text-left transition-all ${
                  isSelected
                    ? 'border-[#4F6B4A] bg-[#F4F8F3] shadow-sm ring-1 ring-[#4F6B4A]'
                    : 'border-[#E5DFD5] bg-white hover:border-[#A8BFA0]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-extrabold text-[#3D3D3D] font-heading">{size.label}</span>
                  {size.extraDurationMin > 0 ? (
                    <span className="text-[10px] font-bold text-[#4F6B4A] bg-[#E7EFE5] px-1.5 py-0.5 rounded">
                      +{size.extraDurationMin}m
                    </span>
                  ) : (
                    <span className="text-[10px] text-[#5C5C5C]">Standard</span>
                  )}
                </div>
                <div className="text-xs text-[#5C5C5C] mt-1">{size.weightDesc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Service Selection with artisanal spa styling */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-xs font-bold text-[#3D3D3D] uppercase tracking-wider">
            4. Choose Spa Treatment
          </label>
          <div className="flex items-center gap-1.5 text-xs text-[#4F6B4A] font-semibold bg-[#E7EFE5] px-3 py-1 rounded-full border border-[#A8BFA0]">
            <Clock className="w-3.5 h-3.5" />
            <span>Estimated Van Time: {durationText}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {(Object.keys(SERVICES) as ServiceId[]).map((serviceKey) => {
            const service = SERVICES[serviceKey];
            const isSelected = bookingDraft.serviceId === serviceKey;
            const sizeMod = SIZES[bookingDraft.petSize].extraDurationMin;
            const effectiveDuration = service.baseDurationMin + sizeMod;

            return (
              <button
                key={serviceKey}
                type="button"
                onClick={() => setBookingDraft({ serviceId: serviceKey })}
                className={`p-5 rounded-2xl border-2 text-left transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'border-[#4F6B4A] bg-[#FAFDF9] shadow-md ring-2 ring-[#4F6B4A]/10'
                    : 'border-[#E5DFD5] bg-white hover:border-[#A8BFA0]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-black text-[#3D3D3D] font-heading">
                      {service.name}
                    </span>
                    <span className="text-xl font-black text-[#3D3D3D] tabular-nums">
                      ${service.price}
                    </span>
                  </div>
                  <p className="text-xs text-[#5C5C5C] mt-1.5 leading-relaxed">
                    {service.description}
                  </p>
                  <ul className="mt-3.5 space-y-1.5">
                    {service.features.slice(0, 3).map((feat, i) => (
                      <li key={i} className="text-xs text-[#5C5C5C] flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-[#4F6B4A] shrink-0" />
                        <span className="truncate">{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-5 pt-3 border-t border-[#EFEAE1] flex items-center justify-between text-xs text-[#5C5C5C]">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#4F6B4A]" />
                    <span>{effectiveDuration} min appointment</span>
                  </span>
                  <span
                    className={`font-bold ${
                      isSelected ? 'text-[#4F6B4A]' : 'text-[#3D3D3D]'
                    }`}
                  >
                    {isSelected ? '✓ Selected' : 'Select'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Handling Notes */}
      <div>
        <label htmlFor="notes" className="block text-xs font-bold text-[#3D3D3D] uppercase tracking-wider mb-2">
          5. Special Handling or Temperament Notes (Optional)
        </label>
        <textarea
          id="notes"
          rows={2}
          value={bookingDraft.notes}
          onChange={(e) => setBookingDraft({ notes: e.target.value })}
          placeholder="e.g. Loves treats, fearful of loud dryers, needs gentle paw pad handling, rescue pet..."
          className="w-full px-4 py-3 rounded-xl border border-[#D5CFBE] bg-white text-[#3D3D3D] placeholder-[#9E9B95] focus:outline-none focus:ring-2 focus:ring-[#4F6B4A] text-sm shadow-sm"
        />
      </div>

      {/* Bottom Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-5 border-t border-[#E5DFD5]">
        <div className="flex items-center gap-2 text-xs text-[#5C5C5C]">
          <Sparkles className="w-4 h-4 text-[#E8A838] shrink-0" />
          <span>Next: Enter your Austin address to check Sarah's route availability</span>
        </div>
        <button
          type="submit"
          className="px-7 py-3.5 rounded-xl text-sm font-extrabold transition-all shadow-md active:scale-95 bg-[#E8A838] hover:bg-[#d8972b] text-[#3D3D3D] flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>Select Your Location & View Austin Map →</span>
        </button>
      </div>
    </form>
  );
};
