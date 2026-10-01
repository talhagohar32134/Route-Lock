import React, { useState, useEffect } from 'react';
import { useRouteLockStore } from '../../store/useRouteLockStore';
import { SlotCandidate } from '../../types';
import { calculateDuration, evaluateSlotsForDate, formatMinutesToTime } from '../../engine/scheduler';
import { getAnchorDate } from '../../engine/seeds';
import { RouteConnectorAnimation } from '../illustrations/RouteConnectorAnimation';
import { RouteTransitMap } from '../maps/RouteTransitMap';
import { Toast } from '../shared/Toast';
import {
  Clock,
  Car,
  AlertTriangle,
  Sparkles,
  Info,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  Calendar,
  ShieldCheck,
} from 'lucide-react';

interface Props {
  onNext: () => void;
  onBack: () => void;
}

export const Step3HeroAvailability: React.FC<Props> = ({ onNext, onBack }) => {
  const { bookingDraft, setBookingDraft, appointments, settings } = useRouteLockStore();
  const [isLoading, setIsLoading] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [timeFilter, setTimeFilter] = useState<'all' | 'morning' | 'afternoon'>('all');
  const [showBlockedDetails, setShowBlockedDetails] = useState(false);
  const [autoAdvanceToast, setAutoAdvanceToast] = useState<string | null>(null);

  const duration = calculateDuration(bookingDraft.serviceId, bookingDraft.petSize);
  const selectedDate = bookingDraft.selectedDate;

  // 7-day strip anchor dates
  const daysList = Array.from({ length: 7 }, (_, i) => {
    const dateStr = getAnchorDate(i);
    const dateObj = new Date(`${dateStr}T12:00:00Z`);
    const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
    const dayNumber = dateObj.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
    return { dateStr, dayName, dayNumber, isToday: i === 0 };
  });

  const targetZone = bookingDraft.zone || 'Central Austin';

  // Evaluate candidate slots
  const evaluation = evaluateSlotsForDate(
    selectedDate,
    targetZone,
    duration,
    appointments,
    settings
  );

  const { availableSlots, nearMissBlockedSlots, isDayFull } = evaluation;

  // Auto-advance if initial day is full and show informative toast
  useEffect(() => {
    const curEval = evaluateSlotsForDate(selectedDate, targetZone, duration, appointments, settings);
    if (curEval.availableSlots.length === 0 || curEval.isDayFull) {
      const nextAvailableDay = daysList.find((day) => {
        if (day.dateStr === selectedDate) return false;
        const evalD = evaluateSlotsForDate(day.dateStr, targetZone, duration, appointments, settings);
        return evalD.availableSlots.length > 0;
      });

      if (nextAvailableDay) {
        const curDateObj = new Date(`${selectedDate}T12:00:00Z`);
        const curDayName = curDateObj.toLocaleDateString('en-US', { weekday: 'long' });
        const nextDateObj = new Date(`${nextAvailableDay.dateStr}T12:00:00Z`);
        const nextDayName = nextDateObj.toLocaleDateString('en-US', { weekday: 'long' });

        setBookingDraft({ selectedDate: nextAvailableDay.dateStr, selectedSlot: null });
        setAutoAdvanceToast(`${curDayName} is full for ${targetZone}. Showing ${nextDayName} instead.`);
      }
    }
  }, []);

  const handleSelectDate = (dateStr: string) => {
    setIsLoading(true);
    setBookingDraft({ selectedDate: dateStr, selectedSlot: null });
    setTimeout(() => {
      setIsLoading(false);
    }, 280);
  };

  const handleSelectSlot = (slot: SlotCandidate) => {
    setBookingDraft({ selectedSlot: slot });
  };

  const dayAppointments = appointments
    .filter((a) => a.date === selectedDate && a.status !== 'cancelled')
    .sort((a, b) => a.startTime - b.startTime);

  return (
    <div className="space-y-6">
      {/* Step Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-bold text-[#4F6B4A] uppercase tracking-wider mb-1">
          <ShieldCheck className="w-4 h-4" />
          <span>Real-Time Travel Math Engine</span>
        </div>
        <h2 className="text-2xl font-extrabold text-[#3D3D3D] font-heading">
          Available Route Windows for {targetZone}
        </h2>
        <p className="text-sm text-[#5C5C5C] mt-1">
          Sarah only offers arrival times her mobile spa van can physically reach without rushing or delays.
        </p>
      </div>

      {/* 7-Day Picker Strip */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1 scrollbar-none">
        {daysList.map((day) => {
          const isSelected = selectedDate === day.dateStr;
          // Count available slots for this day preview
          const dayEval = evaluateSlotsForDate(
            day.dateStr,
            targetZone,
            duration,
            appointments,
            settings
          );
          const count = dayEval.availableSlots.length;
          const isFull = dayEval.isDayFull;

          return (
            <button
              key={day.dateStr}
              type="button"
              onClick={() => handleSelectDate(day.dateStr)}
              className={`flex-1 min-w-[76px] py-3 px-2 rounded-2xl border-2 text-center transition-all ${
                isSelected
                  ? 'border-[#4F6B4A] bg-[#4F6B4A] text-white shadow-md'
                  : 'border-[#E5DFD5] bg-white hover:border-[#A8BFA0] text-[#3D3D3D]'
              }`}
            >
              <div
                className={`text-[11px] font-bold uppercase tracking-wider ${
                  isSelected ? 'text-[#FAF7F2]' : 'text-[#5C5C5C]'
                }`}
              >
                {day.isToday ? 'Today' : day.dayName}
              </div>
              <div
                className={`text-base font-extrabold my-0.5 font-heading ${
                  isSelected ? 'text-white' : 'text-[#3D3D3D]'
                }`}
              >
                {day.dayNumber}
              </div>
              <div
                className={`text-[10px] font-semibold truncate ${
                  isSelected
                    ? 'text-[#F4F9F2]'
                    : isFull
                    ? 'text-[#A63D26]'
                    : count > 0
                    ? 'text-[#4F6B4A]'
                    : 'text-[#9E9B95]'
                }`}
              >
                {isFull ? 'Route Full' : count > 0 ? `${count} open` : 'None open'}
              </div>
            </button>
          );
        })}
      </div>

      {/* Loading Skeleton / Route Connector Animation */}
      {isLoading ? (
        <div className="p-8 rounded-2xl bg-[#F0EDE6] border border-[#E5DFD5] flex flex-col items-center justify-center space-y-3 animate-pulse">
          <Car className="w-8 h-8 text-[#4F6B4A] animate-bounce" />
          <div className="text-xs font-bold text-[#3D3D3D]">
            Calculating Austin highway travel & traffic buffers...
          </div>
          <div className="h-2 w-48 bg-[#D5CFBE] rounded-full" />
        </div>
      ) : (
        bookingDraft.selectedSlot && (
          <RouteConnectorAnimation
            fromZone={
              bookingDraft.selectedSlot.prevJob
                ? bookingDraft.selectedSlot.prevJob.zone
                : 'Central Austin (Home Base)'
            }
            toZone={targetZone}
            driveTimeMin={bookingDraft.selectedSlot.driveFromPrev}
            bufferMin={bookingDraft.selectedSlot.buffer}
            nextZone={
              bookingDraft.selectedSlot.nextJob
                ? bookingDraft.selectedSlot.nextJob.zone
                : undefined
            }
            driveToNextMin={bookingDraft.selectedSlot.driveToNext}
          />
        )
      )}

      {/* Slot Listing Section */}
      <div className="space-y-4">
        {/* Available Slots Group Header & Time Filter Tabs */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3">
            <div>
              <span className="text-xs font-bold text-[#3D3D3D] uppercase tracking-wider block">
                Guaranteed Arrival Windows ({availableSlots.length} Open)
              </span>
              <span className="text-[11px] text-[#5C5C5C]">
                30-min start options across Sarah's working hours (8:30 AM – 5:30 PM CT)
              </span>
            </div>

            {/* Morning / Afternoon Filter Pills */}
            <div className="flex items-center gap-1 bg-[#F0EDE6] p-1 rounded-xl self-start sm:self-auto border border-[#E5DFD5]">
              <button
                type="button"
                onClick={() => setTimeFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  timeFilter === 'all'
                    ? 'bg-white text-[#3D3D3D] shadow-2xs'
                    : 'text-[#5C5C5C] hover:text-[#3D3D3D]'
                }`}
              >
                All Times ({availableSlots.length})
              </button>
              <button
                type="button"
                onClick={() => setTimeFilter('morning')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  timeFilter === 'morning'
                    ? 'bg-white text-[#3D3D3D] shadow-2xs'
                    : 'text-[#5C5C5C] hover:text-[#3D3D3D]'
                }`}
              >
                Morning
              </button>
              <button
                type="button"
                onClick={() => setTimeFilter('afternoon')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  timeFilter === 'afternoon'
                    ? 'bg-white text-[#3D3D3D] shadow-2xs'
                    : 'text-[#5C5C5C] hover:text-[#3D3D3D]'
                }`}
              >
                Afternoon
              </button>
            </div>
          </div>

          {availableSlots.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {availableSlots
                .filter((slot) => {
                  if (timeFilter === 'morning') return slot.startTime < 720;
                  if (timeFilter === 'afternoon') return slot.startTime >= 720;
                  return true;
                })
                .map((slot) => {
                  const isSelected = bookingDraft.selectedSlot?.startTime === slot.startTime;
                  const startTimeLabel = formatMinutesToTime(slot.startTime);

                  return (
                    <button
                      key={slot.startTime}
                      type="button"
                      onClick={() => handleSelectSlot(slot)}
                      className={`p-4 rounded-2xl border-2 text-left transition-all relative flex flex-col justify-between cursor-pointer ${
                        isSelected
                          ? 'border-[#4F6B4A] bg-[#F4F8F3] shadow-md ring-2 ring-[#4F6B4A]/10'
                          : 'border-[#E5DFD5] bg-white hover:border-[#A8BFA0] hover:-translate-y-0.5 shadow-2xs'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-[#E7EFE5] text-[#4F6B4A]">
                              {startTimeLabel}
                            </span>
                            <span className="text-base font-extrabold text-[#3D3D3D] font-heading">
                              {slot.formattedTime}
                            </span>
                          </div>
                          {slot.isRecommendedCluster && (
                            <span className="text-[10px] font-bold text-[#4F6B4A] bg-[#E7EFE5] px-2 py-0.5 rounded-full">
                              Cluster Match
                            </span>
                          )}
                        </div>

                        {/* Travel explanation line */}
                        <div className="text-xs text-[#5C5C5C] mt-2 flex items-center gap-1.5">
                          <Car className="w-3.5 h-3.5 text-[#4F6B4A] shrink-0" />
                          <span>
                            {slot.prevJob
                              ? `Coming from ${slot.prevJob.zone} (${slot.driveFromPrev}m drive)`
                              : `Direct from Central Austin hub (${slot.driveFromPrev}m drive)`}
                          </span>
                        </div>

                        <div className="text-[11px] text-[#4F6B4A] mt-1 font-medium">
                          {slot.travelMathExplanation}
                        </div>
                      </div>

                      <div className="mt-4 pt-2.5 border-t border-[#EFEAE1] flex items-center justify-between text-xs">
                        <span className="text-[#5C5C5C]">{duration} min service</span>
                        <span
                          className={`font-bold ${
                            isSelected ? 'text-[#4F6B4A]' : 'text-[#3D3D3D]'
                          }`}
                        >
                          {isSelected ? '✓ Window Selected' : 'Choose Window'}
                        </span>
                      </div>
                    </button>
                  );
                })}
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-[#F0EDE6] border border-[#E5DFD5] text-center space-y-2">
              <Calendar className="w-8 h-8 text-[#5C5C5C] mx-auto" />
              <div className="text-sm font-bold text-[#3D3D3D]">
                {isDayFull
                  ? `Sarah's route is completely full on ${selectedDate}`
                  : `No safe transit windows available for ${targetZone} on this day`}
              </div>
              <div className="text-xs text-[#5C5C5C] max-w-md mx-auto">
                Sarah may be operating in another Austin quadrant. Try selecting another date on the strip above to find an open cluster window!
              </div>
            </div>
          )}
        </div>

        {/* Collapsed Route Protection Details (Clean UX: Hidden by default) */}
        {nearMissBlockedSlots.length > 0 && (
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowBlockedDetails(!showBlockedDetails)}
              className="flex items-center justify-between w-full p-2.5 rounded-xl border border-[#E5DFD5] bg-[#FAF7F2] hover:bg-[#F0EDE6] text-xs text-[#5C5C5C] font-semibold transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#4F6B4A]" />
                <span>
                  RouteLock Protection Details ({nearMissBlockedSlots.length} conflicting windows dynamically locked)
                </span>
              </span>
              {showBlockedDetails ? (
                <ChevronUp className="w-4 h-4 text-[#5C5C5C]" />
              ) : (
                <ChevronDown className="w-4 h-4 text-[#5C5C5C]" />
              )}
            </button>

            {showBlockedDetails && (
              <div className="mt-2 space-y-2 animate-fade-in">
                {nearMissBlockedSlots.map((slot) => (
                  <div
                    key={slot.startTime}
                    className="p-3 rounded-xl border border-[#D5CFBE] bg-white text-xs text-[#5C5C5C] flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#A63D26] line-through">
                          {slot.formattedTime}
                        </span>
                        <span className="text-[10px] font-bold text-[#A63D26] bg-[#FBE4DD] px-1.5 py-0.5 rounded">
                          Dynamically Locked
                        </span>
                      </div>
                      <div className="text-[#5C5C5C] text-[11px] leading-relaxed">
                        {slot.blockedReason}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Interactive Google Maps Route Transit Visualizer */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-[#3D3D3D] uppercase tracking-wider flex items-center gap-1.5">
              <span>📍 Live Austin Van Transit Route</span>
            </span>
            <span className="text-[11px] text-[#4F6B4A] font-semibold">
              Destination: {targetZone}
            </span>
          </div>

          <RouteTransitMap
            currentZone={targetZone}
            previousAppointment={bookingDraft.selectedSlot?.prevJob || (dayAppointments.length > 0 ? dayAppointments[dayAppointments.length - 1] : null)}
            allAppointments={dayAppointments}
            height="260px"
          />
        </div>

        {/* Mini Day Timeline Visualization */}
        <div className="p-4 rounded-2xl bg-white border border-[#E5DFD5] space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-[#3D3D3D] uppercase tracking-wider">
              Sarah's Van Route for {selectedDate}
            </span>
            <span className="text-[#5C5C5C]">{dayAppointments.length} existing stops</span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto py-2">
            <div className="shrink-0 px-2.5 py-1 rounded bg-[#E5DFD5] text-[10px] font-bold text-[#5C5C5C]">
              8:30 AM Central Hub
            </div>
            {dayAppointments.map((appt) => (
              <React.Fragment key={appt.id}>
                <span className="text-[10px] text-[#A8BFA0]">→</span>
                <div className="shrink-0 px-2.5 py-1 rounded border border-[#A8BFA0] bg-[#F4F8F3] text-[10px] text-[#3D3D3D]">
                  <span className="font-bold">{formatMinutesToTime(appt.startTime)}</span>: {appt.zone} ({appt.petName})
                </div>
              </React.Fragment>
            ))}
            <span className="text-[10px] text-[#A8BFA0]">→</span>
            <div className="shrink-0 px-2.5 py-1 rounded bg-[#E5DFD5] text-[10px] font-bold text-[#5C5C5C]">
              5:30 PM Home Base
            </div>
          </div>
        </div>

        {/* "Why Some Times Aren't Shown" Collapsible */}
        <div className="border border-[#E5DFD5] rounded-2xl bg-[#F0EDE6] overflow-hidden">
          <button
            type="button"
            onClick={() => setShowExplanation(!showExplanation)}
            className="w-full px-4 py-3 text-left flex items-center justify-between text-xs font-bold text-[#3D3D3D]"
          >
            <span className="flex items-center gap-2">
              <Info className="w-4 h-4 text-[#4F6B4A]" />
              <span>Why some appointment times aren't shown</span>
            </span>
            {showExplanation ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showExplanation && (
            <div className="px-4 pb-4 pt-1 text-xs text-[#5C5C5C] space-y-2 border-t border-[#E5DFD5]/60">
              <p>
                Traditional mobile groomers often accept any open time slot, leading to 45-minute cross-city drives across Austin traffic. When highway congestion hits, pet owners are left waiting for hours with stressed pets.
              </p>
              <p>
                RouteLock uses dynamic route geography: Sarah only displays times when she is either already clustered in your Austin neighborhood or has ample highway transit buffers.
              </p>
              <div className="grid grid-cols-2 gap-2 pt-1 font-medium text-[#3D3D3D]">
                <div className="p-2 rounded bg-white border border-[#E5DFD5]">
                  ✓ 10-Minute Van Sanitization Buffer
                </div>
                <div className="p-2 rounded bg-white border border-[#E5DFD5]">
                  ✓ Highway Real-Time Transit Protection
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-6 border-t border-[#E5DFD5]">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#D5CFBE] text-xs font-bold text-[#5C5C5C] hover:text-[#3D3D3D] hover:bg-white transition-all focus:outline-none focus:ring-2 focus:ring-[#4F6B4A]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Change Location</span>
        </button>

        <button
          type="button"
          onClick={onNext}
          disabled={!bookingDraft.selectedSlot}
          className={`px-6 py-3 rounded-xl text-sm font-bold transition-all shadow-md active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#4F6B4A] ${
            bookingDraft.selectedSlot
              ? 'bg-[#E8A838] hover:bg-[#d8972b] text-[#3D3D3D] cursor-pointer'
              : 'bg-[#E5DFD5] text-[#9E9B95] cursor-not-allowed'
          }`}
        >
          Review & Reserve Van →
        </button>
      </div>

      {/* Screen-reader announcement */}
      <div aria-live="polite" className="sr-only">
        {availableSlots.length} available grooming arrival windows for {targetZone} on {selectedDate}.
      </div>

      {/* Day Change Auto-Advance Informative Toast */}
      {autoAdvanceToast && (
        <Toast
          type="info"
          message={autoAdvanceToast}
          duration={6000}
          onDismiss={() => setAutoAdvanceToast(null)}
        />
      )}
    </div>
  );
};
