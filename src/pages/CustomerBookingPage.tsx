import React, { useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useRouteLockStore } from '../store/useRouteLockStore';
import { Step1PetService } from '../components/booking/Step1PetService';
import { Step2AddressZone } from '../components/booking/Step2AddressZone';
import { Step3HeroAvailability } from '../components/booking/Step3HeroAvailability';
import { Step4SummaryDeposit } from '../components/booking/Step4SummaryDeposit';
import { Step5Confirmation } from '../components/booking/Step5Confirmation';
import { APP_IMAGES } from '../engine/constants';
import { Sparkles, Check, ShieldCheck, HeartHandshake, MapPin } from 'lucide-react';

const STEPS = [
  { num: 1, label: 'Pet & Service' },
  { num: 2, label: 'Address & Zone' },
  { num: 3, label: 'RouteLock Availability' },
  { num: 4, label: 'Summary & Deposit' },
  { num: 5, label: 'Confirmed' },
];

export const CustomerBookingPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { bookingDraft, setStep, setBookingDraft, resetBookingDraft } = useRouteLockStore();

  const step = bookingDraft.step;

  useEffect(() => {
    const urlStep = parseInt(searchParams.get('step') || '1', 10);
    if (urlStep >= 1 && urlStep <= 5 && urlStep !== step) {
      setStep(urlStep);
    }
  }, [searchParams, step, setStep]);

  const goToStep = (newStep: number) => {
    if (newStep >= 2 && !bookingDraft.petName?.trim()) {
      setBookingDraft({
        petName: 'My Pet',
        petBreed: bookingDraft.petBreed || (bookingDraft.petSpecies === 'dog' ? 'Golden Retriever' : 'Domestic Shorthair'),
      });
    }
    setStep(newStep);
    setSearchParams({ step: newStep.toString() });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBookAnother = () => {
    resetBookingDraft();
    goToStep(1);
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] pb-20">
      {/* Brand Hero Showcase Banner */}
      <section className="bg-gradient-to-b from-[#F0EDE6] via-[#F4F1EB] to-[#FAF7F2] border-b border-[#E5DFD5] pt-8 pb-8 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3 max-w-xl">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#E7EFE5] border border-[#A8BFA0] text-xs font-bold text-[#4F6B4A]">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Paws & Routes Mobile Pet Grooming · Austin, Texas</span>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#3D3D3D] font-heading tracking-tight leading-tight">
                Stress-Free Mobile Spa, Routed to Your Door
              </h1>
              <p className="text-sm text-[#5C5C5C] leading-relaxed">
                Meet Sarah, your dedicated solo groomer. Our RouteLock engine guarantees realistic arrival times based on live transit physics—no more 3-hour waiting windows.
              </p>
              
              {/* Trust proof points */}
              <div className="flex flex-wrap items-center gap-4 text-xs text-[#5C5C5C] pt-1">
                <span className="flex items-center gap-1.5 font-medium text-[#3D3D3D]">
                  <ShieldCheck className="w-4 h-4 text-[#4F6B4A]" />
                  100% 1-on-1 Cage-Free
                </span>
                <span className="flex items-center gap-1.5 font-medium text-[#3D3D3D]">
                  <HeartHandshake className="w-4 h-4 text-[#E8A838]" />
                  Warm Hydro-Surge Water
                </span>
                <span className="flex items-center gap-1.5 font-medium text-[#3D3D3D]">
                  <MapPin className="w-4 h-4 text-[#4F6B4A]" />
                  Covering 7 Austin Zones
                </span>
              </div>
            </div>

            {/* High-Resolution Van Hero Photography */}
            <div className="relative w-full md:w-80 h-48 md:h-52 rounded-3xl overflow-hidden shadow-lg border-2 border-[#FFFFFF] shrink-0 bg-[#E5DFD5]">
              <img
                src={APP_IMAGES.heroVan}
                alt="Sarah's Mobile Pet Grooming Van in Austin, Texas"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-3.5">
                <div className="text-white">
                  <div className="text-xs font-bold drop-shadow">Paws & Routes Mobile Spa Van</div>
                  <div className="text-[11px] text-[#FAF7F2]/90 drop-shadow">Fully equipped Mercedes Sprinter</div>
                </div>
              </div>
            </div>
          </div>

          {/* Stepper Navigation */}
          <div className="pt-4 max-w-2xl mx-auto">
            <div className="flex items-center justify-between relative">
              <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-[#E5DFD5] -translate-y-1/2 -z-0" />
              {STEPS.map((s) => {
                const isCompleted = step > s.num;
                const isCurrent = step === s.num;

                return (
                  <div key={s.num} className="relative z-10 flex flex-col items-center">
                    <button
                      type="button"
                      onClick={() => goToStep(s.num)}
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-black transition-all cursor-pointer hover:scale-105 active:scale-95 ${
                        isCompleted
                          ? 'bg-[#4F6B4A] text-white shadow-sm'
                          : isCurrent
                          ? 'bg-[#E8A838] text-[#3D3D3D] ring-4 ring-[#E8A838]/25 shadow-md scale-105'
                          : 'bg-[#F0EDE6] text-[#5C5C5C] hover:bg-[#E5DFD5] border border-[#D5CFBE]'
                      }`}
                      aria-label={`Step ${s.num}: ${s.label}`}
                      aria-current={isCurrent ? 'step' : undefined}
                    >
                      {isCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : s.num}
                    </button>
                    <button
                      type="button"
                      onClick={() => goToStep(s.num)}
                      className={`hidden sm:block text-[11px] font-semibold mt-2 cursor-pointer transition-colors ${
                        isCurrent
                          ? 'text-[#3D3D3D] font-bold underline underline-offset-4 decoration-[#E8A838] decoration-2'
                          : isCompleted
                          ? 'text-[#4F6B4A] hover:text-[#3D3D3D]'
                          : 'text-[#5C5C5C] hover:text-[#3D3D3D]'
                      }`}
                    >
                      {s.label}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Main Booking Container */}
      <main className="max-w-4xl mx-auto px-4 pt-8">
        <div className="bg-[#FAF7F2] rounded-3xl p-5 sm:p-8 border border-[#E5DFD5] shadow-sm">
          {step === 1 && <Step1PetService onNext={() => goToStep(2)} />}
          {step === 2 && <Step2AddressZone onNext={() => goToStep(3)} onBack={() => goToStep(1)} />}
          {step === 3 && <Step3HeroAvailability onNext={() => goToStep(4)} onBack={() => goToStep(2)} />}
          {step === 4 && <Step4SummaryDeposit onBack={() => goToStep(3)} />}
          {step === 5 && <Step5Confirmation onBookAnother={handleBookAnother} />}
        </div>
      </main>
    </div>
  );
};
