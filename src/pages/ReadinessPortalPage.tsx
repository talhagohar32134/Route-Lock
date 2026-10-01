import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useRouteLockStore } from '../store/useRouteLockStore';
import { formatMinutesToTime, generateGoogleCalendarUrl } from '../engine/scheduler';
import { SERVICES, APP_IMAGES, SIZES } from '../engine/constants';
import { RealisticSpaVan } from '../components/illustrations/RealisticSpaVan';
import { Appointment } from '../types';
import {
  ShieldCheck,
  CheckCircle2,
  Car,
  DoorOpen,
  Dog,
  MapPin,
  Clock,
  ArrowRight,
  ExternalLink,
  Sparkles,
  Calendar,
  Receipt,
  Heart,
  RefreshCw,
  Award,
} from 'lucide-react';

export const ReadinessPortalPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { appointments, updateReadiness, finalizeReadiness, setBookingDraft } = useRouteLockStore();
  const [vanDriveAway, setVanDriveAway] = useState(false);
  const [localReadiness, setLocalReadiness] = useState({
    petReady: false,
    gateUnlocked: false,
    parkingClear: false,
  });

  // If preview or no bookings yet, use realistic demo preview appointment
  const previewFallbackAppointment: Appointment = {
    id: 'demo_preview',
    bookingId: 'BK-2026-PREV',
    date: '2026-09-30',
    startTime: 570,
    duration: 120,
    endTime: 690,
    customerName: 'Marcus Vance',
    customerPhone: '(512) 555-0142',
    customerEmail: 'marcus.vance@example.com',
    address: '1401 S Congress Ave, Austin, TX 78704',
    zone: 'Central Austin',
    petSpecies: 'dog',
    petName: 'Bailey',
    petBreed: 'Golden Retriever',
    petSize: 'medium',
    serviceId: 'full_groom',
    price: 85,
    depositPaid: 25,
    status: 'pending_readiness',
    readiness: {
      petReady: false,
      gateUnlocked: false,
      parkingClear: false,
    },
    notes: 'Loves head scratches, sensitive right ear.',
  };

  const foundAppt =
    appointments.find((a) => a.id === id || a.bookingId === id) ||
    appointments.find((a) => a.status === 'pending_readiness') ||
    appointments[0];

  const appointment = foundAppt || previewFallbackAppointment;

  const isCompleted = appointment.status === 'completed';

  const petReady = foundAppt ? foundAppt.readiness.petReady : localReadiness.petReady;
  const gateUnlocked = foundAppt ? foundAppt.readiness.gateUnlocked : localReadiness.gateUnlocked;
  const parkingClear = foundAppt ? foundAppt.readiness.parkingClear : localReadiness.parkingClear;
  const confirmedAt = foundAppt?.readiness.confirmedAt;

  const allChecked = petReady && gateUnlocked && parkingClear;
  const isFinalized = !!confirmedAt || vanDriveAway;
  const service = SERVICES[appointment.serviceId];
  const size = SIZES[appointment.petSize];
  const petPhoto = appointment.petSpecies === 'dog' ? APP_IMAGES.dogGroomed : APP_IMAGES.catGroomed;

  const handleToggle = (check: 'petReady' | 'gateUnlocked' | 'parkingClear') => {
    if (foundAppt) {
      updateReadiness(appointment.id, check, !foundAppt.readiness[check]);
    } else {
      setLocalReadiness((prev) => ({
        ...prev,
        [check]: !prev[check],
      }));
    }
  };

  const handleConfirmArrival = () => {
    setVanDriveAway(true);
    if (foundAppt) {
      finalizeReadiness(appointment.id);
    }
  };

  // Re-book CTA prefilling Step 1
  const handleScheduleNextVisit = () => {
    setBookingDraft({
      petSpecies: appointment.petSpecies,
      petName: appointment.petName,
      petBreed: appointment.petBreed,
      petSize: appointment.petSize,
      serviceId: appointment.serviceId,
      address: appointment.address,
      zone: appointment.zone,
      customerName: appointment.customerName,
      customerPhone: appointment.customerPhone,
      customerEmail: appointment.customerEmail,
      notes: appointment.notes || '',
      step: 1,
      selectedSlot: null,
    });
    navigate('/book?step=1');
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] pb-16 pt-6 px-4">
      <div className="max-w-xl mx-auto space-y-6">
        {/* COMPLETED STATUS VIEW */}
        {isCompleted ? (
          <div className="space-y-6 animate-fade-in">
            {/* Header Badge */}
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#E7EFE5] text-[#4F6B4A] text-xs font-black uppercase tracking-wider shadow-2xs">
                <CheckCircle2 className="w-4 h-4 text-[#4F6B4A]" />
                <span>Completed 🐾</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-[#3D3D3D] font-heading">
                Your pet's spa session is complete!
              </h1>
              <p className="text-xs text-[#5C5C5C] max-w-md mx-auto leading-relaxed">
                Sarah has finished <strong>{appointment.petName}'s</strong> luxury spa grooming session in South Congress. {appointment.petName} is all fluffed, fresh, and ready for cuddles!
              </p>
            </div>

            {/* Celebratory Pet Artwork Hero Card */}
            <div className="relative rounded-3xl overflow-hidden border-2 border-[#A8BFA0] bg-white shadow-md p-6 text-center space-y-4">
              <div className="relative w-36 h-36 mx-auto rounded-3xl overflow-hidden border-4 border-[#E7EFE5] shadow-lg bg-[#FAF7F2]">
                <img
                  src={petPhoto}
                  alt={appointment.petName}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-2 right-2 w-7 h-7 rounded-full bg-[#E8A838] text-white flex items-center justify-center shadow-sm">
                  <Sparkles className="w-4 h-4" />
                </div>
              </div>

              <div>
                <div className="inline-flex items-center gap-1 text-xs font-bold text-[#4F6B4A] bg-[#E7EFE5] px-3 py-1 rounded-full mb-1">
                  <Award className="w-3.5 h-3.5" />
                  <span>Fresh Coat & Paw Polish Applied</span>
                </div>
                <h3 className="text-xl font-black text-[#3D3D3D] font-heading">
                  {appointment.petName} looks fabulous!
                </h3>
                <p className="text-xs text-[#5C5C5C] mt-0.5">
                  {service?.name} · {appointment.petBreed} · Groomed by Sarah
                </p>
              </div>

              <div className="flex items-center justify-center gap-4 text-xs text-[#4F6B4A] font-semibold pt-1">
                <span className="flex items-center gap-1">
                  <Heart className="w-3.5 h-3.5 fill-[#4F6B4A]" />
                  <span>Stress-Free Mobile Spa</span>
                </span>
                <span className="text-[#D5CFBE]">·</span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Doorstep Service Completed</span>
                </span>
              </div>
            </div>

            {/* Itemized Official Receipt Card */}
            <div className="p-6 rounded-3xl bg-white border border-[#E5DFD5] space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-[#EFEAE1] pb-3">
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-[#4F6B4A]" />
                  <span className="text-xs font-bold text-[#3D3D3D] uppercase tracking-wider">
                    Itemized Spa Receipt
                  </span>
                </div>
                <span className="text-xs font-mono font-bold text-[#5C5C5C]">
                  {appointment.bookingId}
                </span>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between text-[#5C5C5C]">
                  <span>Base Service ({service?.name})</span>
                  <span className="font-semibold text-[#3D3D3D]">${appointment.price}.00</span>
                </div>

                <div className="flex items-center justify-between text-[#4F6B4A] font-medium">
                  <span>Deposit Paid Online (Card)</span>
                  <span className="font-bold">-${appointment.depositPaid}.00</span>
                </div>

                <div className="flex items-center justify-between text-[#5C5C5C]">
                  <span>Balance Paid to Sarah at Van</span>
                  <span className="font-semibold text-[#3D3D3D]">
                    ${appointment.price - appointment.depositPaid}.00
                  </span>
                </div>

                <div className="pt-3 border-t border-[#EFEAE1] flex items-center justify-between text-sm">
                  <span className="font-bold text-[#3D3D3D]">Balance Remaining:</span>
                  <span className="font-extrabold text-[#4F6B4A] bg-[#E7EFE5] px-2.5 py-0.5 rounded-full text-xs">
                    $0.00 (Paid in Full)
                  </span>
                </div>
              </div>
            </div>

            {/* Action CTA: Schedule Next Visit (4-6 Weeks) */}
            <div className="space-y-3 pt-1">
              <button
                type="button"
                onClick={handleScheduleNextVisit}
                className="w-full py-4 px-6 rounded-2xl bg-[#4F6B4A] hover:bg-[#3f573b] text-white text-sm font-black transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Schedule Next Visit (4-6 Weeks)</span>
              </button>

              <div className="text-center">
                <Link
                  to="/dashboard"
                  className="text-xs text-[#5C5C5C] hover:text-[#3D3D3D] font-medium transition-colors"
                >
                  View Sarah's Schedule Hub →
                </Link>
              </div>
            </div>
          </div>
        ) : (
          /* PRE-ARRIVAL CHECKLIST VIEW */
          <>
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E7EFE5] text-[#4F6B4A] text-xs font-bold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Paws & Routes Mobile Arrival Hub</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-[#3D3D3D] font-heading">
                Pre-Arrival Readiness Check
              </h1>
              <p className="text-xs text-[#5C5C5C]">
                Confirming these 3 quick items ensures Sarah can pull up, plug in, and begin {appointment.petName}'s spa session immediately.
              </p>
            </div>

            {/* Appointment Card */}
            <div className="p-5 rounded-2xl bg-white border border-[#E5DFD5] space-y-3 shadow-sm">
              <div className="flex items-center gap-3.5 border-b border-[#EFEAE1] pb-3">
                <div className="w-14 h-14 rounded-2xl overflow-hidden shrink-0 border border-[#E5DFD5] bg-[#F0EDE6] relative">
                  <img
                    src={petPhoto}
                    alt={appointment.petName}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-base font-extrabold text-[#3D3D3D] font-heading truncate">
                    {appointment.petName} ({appointment.petBreed})
                  </div>
                  <div className="text-xs text-[#5C5C5C]">
                    {service?.name} · {appointment.zone}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-mono font-bold text-[#5C5C5C] block">
                    {appointment.bookingId}
                  </span>
                  <div className="text-xs text-[#4F6B4A] font-bold">
                    {formatMinutesToTime(appointment.startTime)}
                  </div>
                </div>
              </div>

              <div className="text-xs text-[#5C5C5C] flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#4F6B4A] shrink-0" />
                <span className="truncate">{appointment.address}</span>
              </div>
            </div>

            {/* Interactive Switches Checklist */}
            <div className="space-y-3">
              <h2 className="text-xs font-bold text-[#3D3D3D] uppercase tracking-wider">
                3-Point Arrival Checklist
              </h2>

              {/* Switch 1: Pet Ready */}
              <button
                type="button"
                role="switch"
                aria-checked={petReady}
                onClick={() => handleToggle('petReady')}
                className={`w-full p-4 rounded-2xl border-2 text-left transition-all flex items-center justify-between cursor-pointer ${
                  petReady
                    ? 'border-[#4F6B4A] bg-[#F4F8F3]'
                    : 'border-[#E5DFD5] bg-white hover:border-[#A8BFA0]'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      petReady ? 'bg-[#4F6B4A] text-white' : 'bg-[#F0EDE6] text-[#5C5C5C]'
                    }`}
                  >
                    <Dog className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-[#3D3D3D]">
                      {appointment.petName} is Ready
                    </div>
                    <div className="text-xs text-[#5C5C5C]">
                      Quick bathroom break completed, collar on, resting inside.
                    </div>
                  </div>
                </div>

                <div
                  className={`w-6 h-6 rounded-full border flex items-center justify-center transition-colors ${
                    petReady
                      ? 'border-[#4F6B4A] bg-[#4F6B4A] text-white'
                      : 'border-[#D5CFBE] bg-white'
                  }`}
                >
                  {petReady && <CheckCircle2 className="w-4 h-4" />}
                </div>
              </button>

              {/* Switch 2: Gate Unlocked */}
              <button
                type="button"
                role="switch"
                aria-checked={gateUnlocked}
                onClick={() => handleToggle('gateUnlocked')}
                className={`w-full p-4 rounded-2xl border-2 text-left transition-all flex items-center justify-between cursor-pointer ${
                  gateUnlocked
                    ? 'border-[#4F6B4A] bg-[#F4F8F3]'
                    : 'border-[#E5DFD5] bg-white hover:border-[#A8BFA0]'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      gateUnlocked ? 'bg-[#4F6B4A] text-white' : 'bg-[#F0EDE6] text-[#5C5C5C]'
                    }`}
                  >
                    <DoorOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-[#3D3D3D]">
                      Front Door / Gate Clear & Unlocked
                    </div>
                    <div className="text-xs text-[#5C5C5C]">
                      Direct access for handoff without ringing or barking distress.
                    </div>
                  </div>
                </div>

                <div
                  className={`w-6 h-6 rounded-full border flex items-center justify-center transition-colors ${
                    gateUnlocked
                      ? 'border-[#4F6B4A] bg-[#4F6B4A] text-white'
                      : 'border-[#D5CFBE] bg-white'
                  }`}
                >
                  {gateUnlocked && <CheckCircle2 className="w-4 h-4" />}
                </div>
              </button>

              {/* Switch 3: Parking Clear */}
              <button
                type="button"
                role="switch"
                aria-checked={parkingClear}
                onClick={() => handleToggle('parkingClear')}
                className={`w-full p-4 rounded-2xl border-2 text-left transition-all flex items-center justify-between cursor-pointer ${
                  parkingClear
                    ? 'border-[#4F6B4A] bg-[#F4F8F3]'
                    : 'border-[#E5DFD5] bg-white hover:border-[#A8BFA0]'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      parkingClear ? 'bg-[#4F6B4A] text-white' : 'bg-[#F0EDE6] text-[#5C5C5C]'
                    }`}
                  >
                    <Car className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-[#3D3D3D]">
                      Driveway or Curbside Van Parking Clear
                    </div>
                    <div className="text-xs text-[#5C5C5C]">
                      Flat, level parking space ready for Sarah's 24ft Sprinter spa van.
                    </div>
                  </div>
                </div>

                <div
                  className={`w-6 h-6 rounded-full border flex items-center justify-center transition-colors ${
                    parkingClear
                      ? 'border-[#4F6B4A] bg-[#4F6B4A] text-white'
                      : 'border-[#D5CFBE] bg-white'
                  }`}
                >
                  {parkingClear && <CheckCircle2 className="w-4 h-4" />}
                </div>
              </button>
            </div>

            {/* Completion Action */}
            <div className="pt-2">
              {isFinalized ? (
                <div className="p-5 rounded-2xl bg-[#E7EFE5] border-2 border-[#A8BFA0] text-center space-y-3 shadow-sm animate-fade-in">
                  <div className="text-base font-extrabold text-[#3D3D3D] flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-6 h-6 text-[#4F6B4A]" />
                    <span>Thanks! Sarah Has Been Notified</span>
                  </div>
                  <p className="text-xs text-[#5C5C5C] leading-relaxed">
                    Her Mobile Spa Van is routed directly to <strong>{appointment.address}</strong> for {appointment.petName}'s session at {formatMinutesToTime(appointment.startTime)}.
                  </p>
                  {/* Live Route Progress Indicator */}
                  <div className="pt-2 border-t border-[#A8BFA0]/40 flex items-center justify-between text-xs text-[#4F6B4A] font-bold">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#4F6B4A] animate-ping" />
                      <span>Live Dispatch: Mobile Van Dispatched</span>
                    </span>
                    <span>ETA: On Schedule</span>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={!allChecked}
                  onClick={handleConfirmArrival}
                  className={`w-full py-4 px-6 rounded-2xl text-sm font-black transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider ${
                    allChecked
                      ? 'bg-[#E8A838] hover:bg-[#d8972b] text-[#3D3D3D]'
                      : 'bg-[#E5DFD5] text-[#9E9B95] cursor-not-allowed'
                  }`}
                >
                  <span>Everything's Ready — Dispatch Van</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Realistic Sprinter Mobile Spa Van Parked Below Checklist */}
            <div className="pt-2">
              <div className="text-center text-xs font-bold text-[#5C5C5C] uppercase tracking-wider mb-2">
                Sarah's Mercedes Sprinter Mobile Spa Van
              </div>
              <RealisticSpaVan isDriving={vanDriveAway} />
            </div>

            {/* Customer Support Notice */}
            <div className="text-center pt-2">
              <Link
                to="/book?step=1"
                className="text-xs text-[#5C5C5C] hover:text-[#3D3D3D] font-medium transition-colors"
              >
                ← Back to Booking
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
