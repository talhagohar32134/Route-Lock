import React, { useState } from 'react';
import { useRouteLockStore } from '../../store/useRouteLockStore';
import { SERVICES, SIZES, DEPOSIT_AMOUNT, APP_IMAGES } from '../../engine/constants';
import { calculateDuration } from '../../engine/scheduler';
import { dispatchBookingEmails } from '../../services/emailNotificationService';
import {
  CreditCard,
  Lock,
  ArrowLeft,
  Calendar,
  MapPin,
  Clock,
  Sparkles,
  Shield,
  CheckCircle2,
} from 'lucide-react';

interface Props {
  onBack: () => void;
}

export const Step4SummaryDeposit: React.FC<Props> = ({ onBack }) => {
  const { bookingDraft, setBookingDraft, confirmBooking, appointments } = useRouteLockStore();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const service = SERVICES[bookingDraft.serviceId];
  const size = SIZES[bookingDraft.petSize];
  const totalPrice = service ? service.price : 85;
  const balanceDue = totalPrice - DEPOSIT_AMOUNT;
  const duration = calculateDuration(bookingDraft.serviceId, bookingDraft.petSize);
  const petPhoto = bookingDraft.petSpecies === 'dog' ? APP_IMAGES.dogGroomed : APP_IMAGES.catGroomed;

  const handleCardNumberChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 16);
    const formatted = digits.replace(/(\d{4})/g, '$1 ').trim();
    setBookingDraft({ cardNumber: formatted });
  };

  const handleExpiryChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 3) {
      setBookingDraft({ cardExpiry: `${digits.slice(0, 2)}/${digits.slice(2)}` });
    } else {
      setBookingDraft({ cardExpiry: digits });
    }
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!bookingDraft.customerName?.trim()) errs.name = 'Please provide your full name';
    if (!bookingDraft.customerPhone?.trim()) errs.phone = 'Please provide your mobile phone number';
    if (!bookingDraft.customerEmail?.trim()) errs.email = 'Please provide your email address';

    const cardDigits = (bookingDraft.cardNumber || '').replace(/\D/g, '');
    if (cardDigits.length < 15) errs.card = 'Card number must be 15 or 16 digits';
    if (!bookingDraft.cardExpiry || bookingDraft.cardExpiry.length < 5) errs.expiry = 'MM/YY required';
    if (!bookingDraft.cardCvc || bookingDraft.cardCvc.length < 3) errs.cvc = 'CVC required';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    // Instant payment verification & automated dual email notifications dispatch
    setTimeout(async () => {
      // Find previous appointment stop on the same day if available
      const dayAppts = appointments.filter(
        (a) => a.date === bookingDraft.selectedDate && a.status !== 'cancelled'
      );
      const prevAppt =
        (bookingDraft.selectedSlot &&
          dayAppts
            .filter((a) => a.endTime <= bookingDraft.selectedSlot!.startTime)
            .sort((a, b) => b.endTime - a.endTime)[0]) ||
        null;

      const newAppt = confirmBooking();
      if (newAppt) {
        try {
          await dispatchBookingEmails(newAppt, prevAppt);
        } catch (err) {
          console.warn('Email dispatch non-blocking notice:', err);
        }
      }
      setIsSubmitting(false);
    }, 600);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold text-[#3D3D3D] font-heading">
          Review & Secure Your Appointment
        </h2>
        <p className="text-sm text-[#5C5C5C] mt-1">
          A flat ${DEPOSIT_AMOUNT} deposit reserves Sarah's van window and custom route schedule.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Booking Summary Card */}
        <div className="lg:col-span-6 space-y-4">
          <div className="p-5 rounded-2xl bg-white border border-[#E5DFD5] space-y-4 shadow-sm">
            <div className="flex items-center gap-3.5 border-b border-[#EFEAE1] pb-3.5">
              <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 border border-[#E5DFD5] bg-[#F0EDE6] relative">
                <img
                  src={petPhoto}
                  alt={bookingDraft.petName}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[11px] font-bold text-[#4F6B4A] uppercase tracking-wider block">
                  Private Van Appointment
                </span>
                <h3 className="text-lg font-extrabold text-[#3D3D3D] font-heading truncate">
                  {service?.name} for {bookingDraft.petName}
                </h3>
                <span className="text-xs text-[#5C5C5C]">
                  {duration} min hydro-surge spa session
                </span>
              </div>
            </div>

            {/* Pet info & location */}
            <div className="space-y-2 text-xs text-[#5C5C5C]">
              <div className="flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-[#E8A838] shrink-0 mt-0.5" />
                <span>
                  <strong className="text-[#3D3D3D]">{bookingDraft.petBreed}</strong> · {size?.label} ({size?.weightDesc})
                </span>
              </div>
              <div className="flex items-start gap-2">
                <Calendar className="w-4 h-4 text-[#4F6B4A] shrink-0 mt-0.5" />
                <span>
                  <strong className="text-[#3D3D3D]">{bookingDraft.selectedDate}</strong> at{' '}
                  <strong className="text-[#3D3D3D]">
                    {bookingDraft.selectedSlot?.formattedTime}
                  </strong>
                </span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#4F6B4A] shrink-0 mt-0.5" />
                <span>
                  <strong className="text-[#3D3D3D]">{bookingDraft.address}</strong> ({bookingDraft.zone})
                </span>
              </div>
            </div>

            {/* Arrival Timing Instructions */}
            <div className="p-3 rounded-xl bg-[#F0EDE6] border border-[#E5DFD5] text-xs text-[#5C5C5C] space-y-1">
              <div className="font-bold text-[#3D3D3D] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#4F6B4A]" />
                <span>Arrival Window & Parking Note</span>
              </div>
              <p>
                Sarah's 24ft Mercedes Sprinter van requires level driveway parking or open street space with direct access to your front door.
              </p>
            </div>

            {/* Pricing breakdown */}
            <div className="border-t border-[#EFEAE1] pt-3 space-y-2 text-xs">
              <div className="flex items-center justify-between text-[#5C5C5C]">
                <span>Service Base Price</span>
                <span className="font-semibold text-[#3D3D3D]">${totalPrice}.00</span>
              </div>
              <div className="flex items-center justify-between text-[#4F6B4A] font-medium">
                <span>Deposit Due Today (Online)</span>
                <span className="font-bold">${DEPOSIT_AMOUNT}.00</span>
              </div>
              <div className="flex items-center justify-between text-[#5C5C5C]">
                <span>Remaining Balance Due at Service</span>
                <span className="font-semibold text-[#3D3D3D]">${balanceDue}.00</span>
              </div>
              <div className="border-t border-[#EFEAE1] pt-2 flex items-center justify-between text-sm font-bold text-[#3D3D3D]">
                <span>Total Due Now</span>
                <span className="text-base text-[#4F6B4A] font-extrabold font-heading">
                  ${DEPOSIT_AMOUNT}.00
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Contact Details & Validatable Mock Payment */}
        <div className="lg:col-span-6 space-y-4">
          {/* Customer Contact */}
          <div className="p-5 rounded-2xl bg-white border border-[#E5DFD5] space-y-3 shadow-sm">
            <span className="text-xs font-bold text-[#3D3D3D] uppercase tracking-wider block">
              1. Your Contact Information
            </span>

            <div>
              <label htmlFor="customer-name" className="block text-xs font-semibold text-[#3D3D3D] mb-1">
                Your Full Name *
              </label>
              <input
                id="customer-name"
                type="text"
                required
                value={bookingDraft.customerName}
                onChange={(e) => setBookingDraft({ customerName: e.target.value })}
                placeholder="e.g. Rachel Kim"
                className="w-full px-3 py-2 rounded-xl border border-[#D5CFBE] text-sm text-[#3D3D3D] focus:outline-none focus:ring-2 focus:ring-[#4F6B4A]"
              />
              {errors.name && <p className="text-[11px] text-[#A63D26] mt-0.5">{errors.name}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="customer-phone" className="block text-xs font-semibold text-[#3D3D3D] mb-1">
                  Mobile Phone (For Arrival SMS) *
                </label>
                <input
                  id="customer-phone"
                  type="tel"
                  required
                  value={bookingDraft.customerPhone}
                  onChange={(e) => setBookingDraft({ customerPhone: e.target.value })}
                  placeholder="(512) 555-0142"
                  className="w-full px-3 py-2 rounded-xl border border-[#D5CFBE] text-sm text-[#3D3D3D] focus:outline-none focus:ring-2 focus:ring-[#4F6B4A]"
                />
                {errors.phone && <p className="text-[11px] text-[#A63D26] mt-0.5">{errors.phone}</p>}
              </div>

              <div>
                <label htmlFor="customer-email" className="block text-xs font-semibold text-[#3D3D3D] mb-1">
                  Email Address (For Calendar) *
                </label>
                <input
                  id="customer-email"
                  type="email"
                  required
                  value={bookingDraft.customerEmail}
                  onChange={(e) => setBookingDraft({ customerEmail: e.target.value })}
                  placeholder="rachel.k@example.com"
                  className="w-full px-3 py-2 rounded-xl border border-[#D5CFBE] text-sm text-[#3D3D3D] focus:outline-none focus:ring-2 focus:ring-[#4F6B4A]"
                />
                {errors.email && <p className="text-[11px] text-[#A63D26] mt-0.5">{errors.email}</p>}
              </div>
            </div>
          </div>

          {/* Payment Card Info */}
          <div className="p-5 rounded-2xl bg-white border border-[#E5DFD5] space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#3D3D3D] uppercase tracking-wider">
                2. Deposit Payment ($25)
              </span>
              <div className="flex items-center gap-1 text-[11px] text-[#4F6B4A] font-semibold">
                <Lock className="w-3.5 h-3.5" />
                <span>256-Bit Encrypted</span>
              </div>
            </div>

            <div>
              <label htmlFor="card-number" className="block text-xs font-semibold text-[#3D3D3D] mb-1">
                Card Number
              </label>
              <div className="relative">
                <input
                  id="card-number"
                  type="text"
                  required
                  value={bookingDraft.cardNumber}
                  onChange={(e) => handleCardNumberChange(e.target.value)}
                  placeholder="4532 •••• •••• 8892"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#D5CFBE] text-sm text-[#3D3D3D] font-mono focus:outline-none focus:ring-2 focus:ring-[#4F6B4A]"
                />
                <CreditCard className="w-4 h-4 text-[#5C5C5C] absolute left-3 top-2.5" />
              </div>
              {errors.card && <p className="text-[11px] text-[#A63D26] mt-0.5">{errors.card}</p>}
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label htmlFor="card-expiry" className="block text-xs font-semibold text-[#3D3D3D] mb-1">
                  Expires
                </label>
                <input
                  id="card-expiry"
                  type="text"
                  required
                  maxLength={5}
                  value={bookingDraft.cardExpiry}
                  onChange={(e) => handleExpiryChange(e.target.value)}
                  placeholder="MM/YY"
                  className="w-full px-3 py-2 rounded-xl border border-[#D5CFBE] text-sm text-[#3D3D3D] font-mono focus:outline-none focus:ring-2 focus:ring-[#4F6B4A]"
                />
                {errors.expiry && <p className="text-[11px] text-[#A63D26] mt-0.5">{errors.expiry}</p>}
              </div>

              <div>
                <label htmlFor="card-cvc" className="block text-xs font-semibold text-[#3D3D3D] mb-1">
                  CVC
                </label>
                <input
                  id="card-cvc"
                  type="text"
                  required
                  maxLength={4}
                  value={bookingDraft.cardCvc}
                  onChange={(e) =>
                    setBookingDraft({ cardCvc: e.target.value.replace(/\D/g, '') })
                  }
                  placeholder="123"
                  className="w-full px-3 py-2 rounded-xl border border-[#D5CFBE] text-sm text-[#3D3D3D] font-mono focus:outline-none focus:ring-2 focus:ring-[#4F6B4A]"
                />
                {errors.cvc && <p className="text-[11px] text-[#A63D26] mt-0.5">{errors.cvc}</p>}
              </div>

              <div>
                <label htmlFor="card-zip" className="block text-xs font-semibold text-[#3D3D3D] mb-1">
                  Billing ZIP
                </label>
                <input
                  id="card-zip"
                  type="text"
                  required
                  maxLength={5}
                  value={bookingDraft.cardZip || bookingDraft.zip}
                  onChange={(e) => setBookingDraft({ cardZip: e.target.value })}
                  placeholder="78704"
                  className="w-full px-3 py-2 rounded-xl border border-[#D5CFBE] text-sm text-[#3D3D3D] font-mono focus:outline-none focus:ring-2 focus:ring-[#4F6B4A]"
                />
              </div>
            </div>

            <div className="pt-2 text-[11px] text-[#5C5C5C] flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-[#4F6B4A] shrink-0" />
              <span>Full refund if cancelled at least 24 hours prior to service.</span>
            </div>
          </div>
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
          <span>Change Window</span>
        </button>

        <button
          type="submit"
          disabled={isSubmitting}
          className="px-8 py-3.5 rounded-xl text-sm font-extrabold bg-[#E8A838] hover:bg-[#d8972b] text-[#3D3D3D] transition-all shadow-md active:scale-95 flex items-center gap-2"
        >
          <Lock className="w-4 h-4" />
          <span>{isSubmitting ? 'Securing Van Slot...' : `Pay $${DEPOSIT_AMOUNT} & Confirm Booking`}</span>
        </button>
      </div>
    </form>
  );
};
