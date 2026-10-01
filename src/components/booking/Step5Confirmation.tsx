import React, { useState } from 'react';
import { useRouteLockStore } from '../../store/useRouteLockStore';
import { generateIcsCalendar, generateGoogleCalendarUrl } from '../../engine/scheduler';
import { SERVICES, SIZES, APP_IMAGES } from '../../engine/constants';
import { SarahVanIllustration } from '../illustrations/SarahVanIllustration';
import { getStoredEmails, DispatchedEmail } from '../../services/emailNotificationService';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  Download,
  Copy,
  Check,
  Calendar,
  MapPin,
  ClipboardCheck,
  ExternalLink,
  Mail,
  X,
  Eye,
  ShieldCheck,
} from 'lucide-react';

interface Props {
  onBookAnother: () => void;
}

export const Step5Confirmation: React.FC<Props> = ({ onBookAnother }) => {
  const { bookingDraft } = useRouteLockStore();
  const appointment = bookingDraft.confirmedBooking;
  const [copied, setCopied] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showToast, setShowToast] = useState(true);

  // Auto-dismiss the simulated demo toast after 5 seconds
  React.useEffect(() => {
    const timer = setTimeout(() => setShowToast(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  if (!appointment) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-sm text-[#5C5C5C]">No confirmed booking found.</p>
        <button
          type="button"
          onClick={onBookAnother}
          className="px-4 py-2 bg-[#4F6B4A] text-white rounded-xl text-xs font-bold"
        >
          Start New Booking
        </button>
      </div>
    );
  }

  const service = SERVICES[appointment.serviceId];
  const size = SIZES[appointment.petSize];
  const petPhoto = appointment.petSpecies === 'dog' ? APP_IMAGES.dogGroomed : APP_IMAGES.catGroomed;
  const googleCalendarUrl = generateGoogleCalendarUrl(appointment);

  const handleCopyId = () => {
    navigator.clipboard.writeText(appointment.bookingId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadIcs = () => {
    const icsString = generateIcsCalendar(appointment);
    const blob = new Blob([icsString], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const cleanPetName = (appointment.petName || 'pet')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-');
    link.setAttribute('download', `paws-and-routes-${cleanPetName}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const storedEmails = getStoredEmails();
  const clientEmailRecord = storedEmails.find(
    (e) => e.type === 'client_confirmation' && e.metadata.bookingId === appointment.bookingId
  ) || storedEmails[0];

  return (
    <div className="max-w-2xl mx-auto space-y-7 py-2 relative">
      {/* Fallback / Real Email Toast Alert */}
      {showToast && (
        <div className="fixed top-20 right-4 sm:right-8 z-50 animate-bounce transition-all">
          <div className="bg-[#4F6B4A] text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-[#7D9D78]">
            <div className="w-7 h-7 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <Mail className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="text-xs font-bold">Confirmation email dispatched</div>
              <div className="text-[10px] text-white/80">
                {clientEmailRecord?.isDemoMode
                  ? 'Demo mode active: Sent to client & Sarah dispatch alert logged'
                  : `Dispatched to ${appointment.customerEmail}`}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowToast(false)}
              className="text-white/70 hover:text-white p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Animated Checkmark & Headline */}
      <div className="text-center space-y-3">
        <div className="w-16 h-16 rounded-full bg-[#E7EFE5] border-2 border-[#4F6B4A] mx-auto flex items-center justify-center animate-bounce">
          <CheckCircle2 className="w-10 h-10 text-[#4F6B4A]" />
        </div>

        <div>
          <span className="text-xs font-bold text-[#4F6B4A] uppercase tracking-wider">
            Booking Confirmed & Route Locked
          </span>
          <h2 className="text-3xl font-black text-[#3D3D3D] font-heading mt-1">
            You're on Sarah's Schedule!
          </h2>
          <p className="text-sm text-[#5C5C5C] max-w-md mx-auto mt-2">
            Sarah has mapped {appointment.petName}'s appointment into her Austin route. She'll arrive at your door right on schedule.
          </p>
          {/* Subline Badge Required by Prompt */}
          <div className="mt-2.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E7EFE5] text-[#4F6B4A] text-xs font-semibold border border-[#A8BFA0]/60 shadow-2xs">
              <Mail className="w-3.5 h-3.5" />
              <span>Confirmation email sent to {appointment.customerEmail}.</span>
            </span>
          </div>
        </div>

        {/* Booking ID Capsule */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white border border-[#D5CFBE] shadow-sm">
          <span className="text-xs text-[#5C5C5C] font-semibold">Booking ID:</span>
          <span className="font-mono font-bold text-sm text-[#3D3D3D]">
            {appointment.bookingId}
          </span>
          <button
            type="button"
            onClick={handleCopyId}
            className="p-1 hover:bg-[#F0EDE6] rounded text-[#5C5C5C] transition-colors"
            title="Copy Booking ID"
          >
            {copied ? <Check className="w-4 h-4 text-[#4F6B4A]" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Automated Email Confirmation Banner */}
      <div className="p-4 rounded-2xl bg-[#E7EFE5] border border-[#A8BFA0] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-white text-[#4F6B4A] flex items-center justify-center shrink-0 shadow-2xs">
            <Mail className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-[#3D3D3D]">
              Confirmation Email Sent to {appointment.customerEmail}
            </div>
            <div className="text-[#5C5C5C] text-[11px]">
              Itemized deposit receipt, arrival window, &amp; MIME calendar invite (grooming-visit.ics) delivered.
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowEmailModal(true)}
          className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#FAF7F2] border border-[#D5CFBE] font-bold text-[#4F6B4A] inline-flex items-center justify-center gap-1.5 shadow-2xs transition-colors shrink-0 cursor-pointer"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Preview Email &amp; Invite</span>
        </button>
      </div>

      {/* Van Illustration Hero */}
      <div className="max-w-md mx-auto">
        <SarahVanIllustration className="w-full h-auto drop-shadow-sm" />
      </div>

      {/* Appointment Summary Box */}
      <div className="p-6 rounded-3xl bg-white border border-[#E5DFD5] space-y-4 shadow-sm">
        <div className="flex items-center gap-4 border-b border-[#EFEAE1] pb-4">
          <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 border border-[#E5DFD5] bg-[#F0EDE6] relative">
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
            <div className="text-lg font-black text-[#3D3D3D] font-heading truncate">
              {appointment.petName} ({appointment.petBreed})
            </div>
            <div className="text-xs text-[#5C5C5C]">
              {service?.name} · {size?.label}
            </div>
          </div>
          <div className="text-right shrink-0">
            <span className="text-xs text-[#4F6B4A] font-bold bg-[#E7EFE5] px-2.5 py-1 rounded-full block">
              $25 Deposit Paid
            </span>
            <div className="text-[11px] text-[#5C5C5C] mt-1">
              ${appointment.price - appointment.depositPaid} due at service
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-[#5C5C5C]">
          <div className="flex items-start gap-2">
            <Calendar className="w-4 h-4 text-[#4F6B4A] shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-[#3D3D3D] block">{appointment.date}</span>
              <span>Arrival window: {bookingDraft.selectedSlot?.formattedTime}</span>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-[#4F6B4A] shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-[#3D3D3D] block">{appointment.zone}</span>
              <span className="truncate">{appointment.address}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Two-Way Calendar Integration Options */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[#3D3D3D] uppercase tracking-wider">
            Add Visit to Your Calendar
          </span>
          <span className="text-[11px] text-[#4F6B4A] font-semibold flex items-center gap-1">
            <span>📎 Attached in confirmation email</span>
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <a
            href={googleCalendarUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-[#D5CFBE] bg-white hover:bg-[#F4F8F3] text-xs font-bold text-[#3D3D3D] transition-all shadow-2xs hover:border-[#4F6B4A]"
          >
            <Calendar className="w-4 h-4 text-[#4F6B4A]" />
            <span>Add to Google Calendar</span>
            <ExternalLink className="w-3.5 h-3.5 text-[#5C5C5C]" />
          </a>

          <button
            type="button"
            onClick={handleDownloadIcs}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-[#D5CFBE] bg-white hover:bg-[#F4F8F3] text-xs font-bold text-[#3D3D3D] transition-all shadow-2xs hover:border-[#4F6B4A] cursor-pointer"
          >
            <Download className="w-4 h-4 text-[#4F6B4A]" />
            <span>Download .ics (Apple/Outlook)</span>
          </button>
        </div>
        <p className="text-[11px] text-[#73706B] text-center pt-0.5">
          Dual Sync: Use the instant web links above, or open your confirmation email to accept the embedded calendar invite (.ics).
        </p>
      </div>

      {/* Readiness Check Direct Link CTA */}
      <div>
        <Link
          to={`/readiness/${appointment.id}`}
          className="flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-[#4F6B4A] hover:bg-[#3f573b] text-white text-sm font-black transition-all shadow-md active:scale-95 uppercase tracking-wider"
        >
          <ClipboardCheck className="w-4 h-4" />
          <span>Open Arrival Readiness Portal →</span>
        </Link>
      </div>

      {/* Secondary Links */}
      <div className="flex items-center justify-between text-xs pt-4 border-t border-[#E5DFD5]">
        <button
          type="button"
          onClick={onBookAnother}
          className="text-[#5C5C5C] hover:text-[#3D3D3D] font-semibold underline underline-offset-2 cursor-pointer"
        >
          Book Another Pet
        </button>

        <a
          href="tel:5125550100"
          className="text-[#4F6B4A] hover:text-[#3d5439] font-semibold flex items-center gap-1.5"
        >
          <span>Need help? Text Sarah: (512) 555-0100</span>
        </a>
      </div>

      {/* Email Preview Modal */}
      {showEmailModal && clientEmailRecord && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[85vh] overflow-y-auto border border-[#E5DFD5] shadow-2xl flex flex-col">
            <div className="p-4 border-b border-[#EFEAE1] flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#E7EFE5] text-[#4F6B4A] flex items-center justify-center">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#3D3D3D]">
                    Dispatched Confirmation Email
                  </div>
                  <div className="text-[10px] text-[#5C5C5C]">
                    Delivered to: {clientEmailRecord.to}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEmailModal(false)}
                className="p-1.5 rounded-full hover:bg-[#F0EDE6] text-[#5C5C5C] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-[#FAF7F2] text-xs space-y-2 border-b border-[#EFEAE1]">
              <div><strong>Subject:</strong> {clientEmailRecord.subject}</div>
              <div><strong>From:</strong> {clientEmailRecord.from}</div>
              <div><strong>Delivered:</strong> {new Date(clientEmailRecord.sentAt).toLocaleString()}</div>
              {clientEmailRecord.mimeCalendarAttachment && (
                <div className="pt-2 border-t border-[#E5DFD5] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base">📎</span>
                    <div>
                      <span className="font-bold text-[#3D3D3D]">
                        {clientEmailRecord.mimeCalendarAttachment.filename}
                      </span>
                      <span className="text-[11px] text-[#4F6B4A] block font-mono">
                        {clientEmailRecord.mimeCalendarAttachment.contentType}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadIcs}
                    className="px-2.5 py-1 rounded-lg bg-white border border-[#D5CFBE] text-[11px] font-bold text-[#4F6B4A] hover:bg-[#F4F8F3] transition-colors shrink-0 cursor-pointer flex items-center gap-1.5 self-start sm:self-center"
                  >
                    <Download className="w-3 h-3" />
                    <span>Download .ics</span>
                  </button>
                </div>
              )}
            </div>

            <div className="p-4">
              <div
                dangerouslySetInnerHTML={{ __html: clientEmailRecord.htmlBody }}
                className="border border-[#E5DFD5] rounded-2xl overflow-hidden"
              />
            </div>

            <div className="p-4 border-t border-[#EFEAE1] bg-[#FAF7F2] text-right">
              <button
                type="button"
                onClick={() => setShowEmailModal(false)}
                className="px-4 py-2 rounded-xl bg-[#4F6B4A] text-white text-xs font-bold"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
