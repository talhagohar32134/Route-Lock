import React, { useState, useEffect } from 'react';
import { useRouteLockStore } from '../store/useRouteLockStore';
import { Appointment, ZoneId } from '../types';
import {
  calculateDailyStats,
  formatMinutesToTime,
  getDriveTime,
  formatBookingId,
  calculateDuration,
  generateDayMasterIcs,
} from '../engine/scheduler';
import { getAnchorDate } from '../engine/seeds';
import { SERVICES, SIZES, ZONES, APP_IMAGES, PRESET_ADDRESSES } from '../engine/constants';
import { SarahVanIllustration } from '../components/illustrations/SarahVanIllustration';
import { RouteTransitMap } from '../components/maps/RouteTransitMap';
import {
  getStoredEmails,
  getLatestBookingAlert,
  markLatestBookingAlertShown,
  DispatchedEmail,
} from '../services/emailNotificationService';
import {
  Calendar,
  Clock,
  DollarSign,
  TrendingUp,
  SlidersHorizontal,
  Phone,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Trash2,
  X,
  Play,
  Check,
  ChevronRight,
  Sparkles,
  Lock,
  KeyRound,
  ArrowLeft,
  ShieldCheck,
  Plus,
  Navigation,
  Download,
  Mail,
  ExternalLink,
  Eye,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const SarahDashboardPage: React.FC = () => {
  const {
    appointments,
    settings,
    updateSettings,
    toggleZone,
    releaseAppointment,
    undoRelease,
    dismissUndoToast,
    undoToast,
    resetToSeeds,
    updateAppointmentStatus,
    loadDemoSchedule,
    clearAllAppointments,
    addManualBooking,
  } = useRouteLockStore();

  const [selectedDate, setSelectedDate] = useState(getAnchorDate(0)); // Today default
  const [showSettingsDrawer, setShowSettingsDrawer] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [heldSlotIds, setHeldSlotIds] = useState<Record<string, boolean>>({});
  const [selectedApptId, setSelectedApptId] = useState<string | null>(null);
  const [showEmailLogsModal, setShowEmailLogsModal] = useState(false);
  const [selectedEmailForView, setSelectedEmailForView] = useState<DispatchedEmail | null>(null);
  const [calendarExportSuccess, setCalendarExportSuccess] = useState(false);
  const [dispatchedEmails, setDispatchedEmails] = useState<DispatchedEmail[]>([]);
  const [newBookingAlert, setNewBookingAlert] = useState<{
    petName: string;
    date: string;
    bookingId: string;
  } | null>(null);

  // Check for newly registered booking in localStorage or custom event
  useEffect(() => {
    const alert = getLatestBookingAlert();
    if (alert && !alert.shown && Date.now() - alert.timestamp < 120000) {
      setNewBookingAlert({ petName: alert.petName, date: alert.date, bookingId: alert.bookingId });
      markLatestBookingAlertShown();
    }

    const handleNewBooking = (e: any) => {
      const detail = e.detail;
      if (detail?.petName) {
        setNewBookingAlert({
          petName: detail.petName,
          date: detail.date,
          bookingId: detail.bookingId,
        });
        markLatestBookingAlertShown();
      }
    };

    window.addEventListener('routelock:new_booking', handleNewBooking);
    return () => {
      window.removeEventListener('routelock:new_booking', handleNewBooking);
    };
  }, []);

  // Auto-dismiss new booking toast alert after 6 seconds
  useEffect(() => {
    if (!newBookingAlert) return;
    const timer = setTimeout(() => setNewBookingAlert(null), 6000);
    return () => clearTimeout(timer);
  }, [newBookingAlert]);

  // Manual booking form state
  const [manualForm, setManualForm] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    petName: '',
    petBreed: 'Golden Retriever',
    petSpecies: 'dog' as 'dog' | 'cat',
    petSize: 'medium' as any,
    serviceId: 'full_groom' as any,
    address: '1401 S Congress Ave, Austin, TX 78704',
    zone: 'Central Austin' as ZoneId,
    startTime: 540,
  });

  // 8-second toast timer
  useEffect(() => {
    if (!undoToast) return;
    const interval = setInterval(() => {
      if (Date.now() >= undoToast.expiresAt) {
        dismissUndoToast();
      }
    }, 500);
    return () => clearInterval(interval);
  }, [undoToast, dismissUndoToast]);

  const daysList = Array.from({ length: 7 }, (_, i) => {
    const dateStr = getAnchorDate(i);
    const dateObj = new Date(`${dateStr}T12:00:00Z`);
    const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
    const dayNumber = dateObj.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
    return { dateStr, dayName, dayNumber, isToday: i === 0 };
  });

  const dayAppointments = appointments
    .filter((a) => a.date === selectedDate && a.status !== 'cancelled')
    .sort((a, b) => a.startTime - b.startTime);

  const stats = calculateDailyStats(selectedDate, appointments, settings);

  // Sync stored emails when modal opens
  useEffect(() => {
    setDispatchedEmails(getStoredEmails());
  }, [showEmailLogsModal]);

  // Ensure active appointment syncs when date changes or appointments update
  useEffect(() => {
    if (dayAppointments.length > 0) {
      const exists = dayAppointments.some((a) => a.id === selectedApptId);
      if (!exists) {
        setSelectedApptId(dayAppointments[0].id);
      }
    } else {
      setSelectedApptId(null);
    }
  }, [selectedDate, dayAppointments.length]);

  const activeAppt =
    dayAppointments.find((a) => a.id === selectedApptId) || dayAppointments[0] || null;
  const activeIdx = activeAppt ? dayAppointments.findIndex((a) => a.id === activeAppt.id) : -1;
  const activePrevAppt = activeIdx > 0 ? dayAppointments[activeIdx - 1] : null;

  const handleExportDayIcs = () => {
    if (dayAppointments.length === 0) return;
    const icsContent = generateDayMasterIcs(selectedDate, dayAppointments);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `sarah-route-${selectedDate}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setCalendarExportSuccess(true);
    setTimeout(() => setCalendarExportSuccess(false), 3000);
  };

  // Attention: items on this date that are not fully ready
  const attentionItems = dayAppointments.filter(
    (a) => !a.readiness.petReady || !a.readiness.parkingClear || !a.readiness.gateUnlocked
  );

  const handleToggleHold = (id: string) => {
    setHeldSlotIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] pb-20">
      {/* Top Header & Settings Trigger */}
      <section className="bg-white border-b border-[#E5DFD5] px-4 py-5 sm:px-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#4F6B4A] uppercase tracking-wider">
                Private Route Dispatch
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#4F6B4A]" />
              <span className="text-xs text-[#5C5C5C]">Austin, Texas</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#3D3D3D] font-heading mt-0.5">
              Sarah's Mobile Grooming Schedule
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowManualModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#4F6B4A] hover:bg-[#3f573b] text-white text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Walk-In Booking</span>
            </button>
            <button
              type="button"
              onClick={() => setShowSettingsDrawer(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-[#D5CFBE] bg-[#F0EDE6] hover:bg-white text-xs font-bold text-[#3D3D3D] transition-colors shadow-sm cursor-pointer"
            >
              <SlidersHorizontal className="w-4 h-4 text-[#4F6B4A]" />
              <span>Route Settings</span>
            </button>
            <button
              type="button"
              onClick={() => setShowResetDialog(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#D5CFBE] text-xs font-semibold text-[#5C5C5C] hover:text-[#3D3D3D] hover:bg-white transition-colors cursor-pointer"
              title="Reset or Demo Data"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Schedule Controls</span>
            </button>
          </div>
        </div>
      </section>

      <main className="max-w-6xl mx-auto px-4 sm:px-8 pt-6 space-y-6">
        {/* Date Strip Selector */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {daysList.map((day) => {
            const isSelected = selectedDate === day.dateStr;
            const apptsOnDay = appointments.filter(
              (a) => a.date === day.dateStr && a.status !== 'cancelled'
            );

            return (
              <button
                key={day.dateStr}
                type="button"
                onClick={() => setSelectedDate(day.dateStr)}
                className={`flex-1 min-w-[84px] p-3 rounded-2xl border-2 text-center transition-all ${
                  isSelected
                    ? 'border-[#4F6B4A] bg-[#4F6B4A] text-white shadow-md'
                    : 'border-[#E5DFD5] bg-white hover:border-[#A8BFA0] text-[#3D3D3D]'
                }`}
              >
                <div
                  className={`text-[10px] font-bold uppercase tracking-wider ${
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
                      : apptsOnDay.length > 0
                      ? 'text-[#4F6B4A]'
                      : 'text-[#9E9B95]'
                  }`}
                >
                  {apptsOnDay.length} stop{apptsOnDay.length === 1 ? '' : 's'}
                </div>
              </button>
            );
          })}
        </div>

        {/* Real-Time Daily Stats Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Revenue */}
          <div className="p-4 rounded-2xl bg-white border border-[#E5DFD5] shadow-sm">
            <div className="flex items-center justify-between text-xs text-[#5C5C5C]">
              <span>Day Revenue</span>
              <DollarSign className="w-4 h-4 text-[#4F6B4A]" />
            </div>
            <div className="text-2xl font-black text-[#3D3D3D] font-heading mt-1 tabular-nums">
              ${stats.revenue}
            </div>
            <div className="text-[11px] text-[#4F6B4A] font-semibold mt-0.5">
              ${stats.totalCount * 25} deposits secured
            </div>
          </div>

          {/* Drive Time */}
          <div className="p-4 rounded-2xl bg-white border border-[#E5DFD5] shadow-sm">
            <div className="flex items-center justify-between text-xs text-[#5C5C5C]">
              <span>Drive Time</span>
              <Clock className="w-4 h-4 text-[#E8A838]" />
            </div>
            <div className="text-2xl font-black text-[#3D3D3D] font-heading mt-1 tabular-nums">
              {stats.driveTimeMin}m
            </div>
            <div className="text-[11px] text-[#5C5C5C] mt-0.5">
              Across {stats.totalCount + 1} route legs
            </div>
          </div>

          {/* Idle Gap Time */}
          <div className="p-4 rounded-2xl bg-white border border-[#E5DFD5] shadow-sm">
            <div className="flex items-center justify-between text-xs text-[#5C5C5C]">
              <span>Idle Buffer</span>
              <AlertTriangle className="w-4 h-4 text-[#5C5C5C]" />
            </div>
            <div className="text-2xl font-black text-[#3D3D3D] font-heading mt-1 tabular-nums">
              {stats.idleTimeMin}m
            </div>
            <div className="text-[11px] text-[#5C5C5C] mt-0.5">
              Available booking gap
            </div>
          </div>

          {/* Saved Travel */}
          <div className="p-4 rounded-2xl bg-white border border-[#E5DFD5] shadow-sm">
            <div className="flex items-center justify-between text-xs text-[#5C5C5C]">
              <span>Travel Saved</span>
              <TrendingUp className="w-4 h-4 text-[#4F6B4A]" />
            </div>
            <div className="text-2xl font-black text-[#4F6B4A] font-heading mt-1 tabular-nums">
              +{stats.savedMinutes}m
            </div>
            <div className="text-[11px] text-[#4F6B4A] font-semibold mt-0.5">
              Clustering efficiency
            </div>
          </div>

          {/* Route Efficiency Score */}
          <div className="col-span-2 lg:col-span-1 p-4 rounded-2xl bg-white border border-[#E5DFD5] shadow-sm">
            <div className="flex items-center justify-between text-xs text-[#5C5C5C]">
              <span>Route Score</span>
              <Sparkles className="w-4 h-4 text-[#E8A838]" />
            </div>
            <div className="text-2xl font-black text-[#3D3D3D] font-heading mt-1 tabular-nums">
              {stats.efficiencyScore}%
            </div>
            <div className="text-[11px] text-[#5C5C5C] mt-0.5">
              Active grooming ratio
            </div>
          </div>
        </div>

        {/* 2-Column Responsive Layout: Left = Route Timeline, Right = Attention & Route Tools */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Day Route Timeline */}
          <div className="lg:col-span-8 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-[#3D3D3D] uppercase tracking-wider block">
                  Sequential Route ({dayAppointments.length} Stop{dayAppointments.length === 1 ? '' : 's'})
                </span>
                <span className="text-xs text-[#5C5C5C]">
                  Operating {formatMinutesToTime(settings.dayStartMin)} – {formatMinutesToTime(settings.dayEndMin)}
                </span>
              </div>

              {/* Sarah's Master Calendar Export & Dispatch Email Logs */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleExportDayIcs}
                  disabled={dayAppointments.length === 0}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#D5CFBE] bg-white hover:bg-[#F4F8F3] text-xs font-bold text-[#3D3D3D] transition-colors shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  title="Export all day stops as master itinerary .ics"
                >
                  <Download className="w-3.5 h-3.5 text-[#4F6B4A]" />
                  <span>{calendarExportSuccess ? '✓ Route Exported!' : 'Sync Route to Calendar (.ics)'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowEmailLogsModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#D5CFBE] bg-white hover:bg-[#F4F8F3] text-xs font-bold text-[#3D3D3D] transition-colors shadow-2xs cursor-pointer"
                  title="View automated dual email notifications dispatch logs"
                >
                  <Mail className="w-3.5 h-3.5 text-[#4F6B4A]" />
                  <span>Email Alerts ({dispatchedEmails.length})</span>
                </button>
              </div>
            </div>

            {/* Departure from Central Austin Hub */}
            <div className="p-3.5 rounded-2xl bg-[#F0EDE6] border border-[#D5CFBE] flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#4F6B4A]" />
                <span className="font-bold text-[#3D3D3D]">
                  {formatMinutesToTime(settings.dayStartMin)} · Van Departs Central Austin Hub
                </span>
              </div>
              <span className="text-[#5C5C5C] font-mono">Central Hub</span>
            </div>

            {dayAppointments.length > 0 ? (
              <div className="space-y-3">
                {dayAppointments.map((appt, idx) => {
                  const prevAppt = idx > 0 ? dayAppointments[idx - 1] : undefined;
                  const driveFromPrev = prevAppt
                    ? getDriveTime(prevAppt.zone, appt.zone)
                    : 15;
                  const isHeld = !!heldSlotIds[appt.id];
                  const isSelected = activeAppt?.id === appt.id;
                  const isCompleted = appt.status === 'completed';
                  const service = SERVICES[appt.serviceId];
                  const size = SIZES[appt.petSize];

                  return (
                    <React.Fragment key={appt.id}>
                      {/* Transit Connector between jobs */}
                      <div className="flex items-center gap-3 px-4 py-1 text-xs text-[#5C5C5C]">
                        <div className="w-0.5 h-6 bg-[#D5CFBE] ml-3" />
                        <span className="text-[11px] text-[#4F6B4A] font-semibold bg-[#E7EFE5] px-2 py-0.5 rounded-full">
                          🚗 {driveFromPrev}m drive to {appt.zone} + {settings.bufferMin}m buffer
                        </span>
                        {appt.farFromRoute && (
                          <span className="text-[10px] font-bold text-[#A63D26] bg-[#FBE4DD] px-1.5 py-0.5 rounded">
                            Long Transit Leg
                          </span>
                        )}
                      </div>

                      {/* Appointment Stop Card with Interactive Selection & Map Focus */}
                      <div
                        onClick={() => setSelectedApptId(appt.id)}
                        className={`p-5 rounded-2xl border-2 transition-all cursor-pointer relative ${
                          isSelected
                            ? 'border-[#4F6B4A] bg-[#F4F8F3] shadow-md ring-2 ring-[#4F6B4A]/20 -translate-y-0.5'
                            : isCompleted
                            ? 'border-[#D5CFBE] bg-[#F0EDE6]/60 opacity-90'
                            : isHeld
                            ? 'border-[#E8A838] bg-[#FFFBF0]'
                            : 'border-[#E5DFD5] bg-white hover:border-[#A8BFA0] shadow-sm'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#EFEAE1] pb-3">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-sm font-black tabular-nums font-heading ${
                                isCompleted ? 'text-[#73706B] line-through' : 'text-[#3D3D3D]'
                              }`}
                            >
                              {formatMinutesToTime(appt.startTime)} – {formatMinutesToTime(appt.endTime)}
                            </span>
                            <span className="text-xs text-[#5C5C5C]">({appt.duration}m)</span>
                            {isSelected && (
                              <span className="text-[10px] font-bold text-[#4F6B4A] bg-[#E7EFE5] px-2 py-0.5 rounded-full flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#4F6B4A] animate-ping" />
                                <span>Active on Map 📍</span>
                              </span>
                            )}
                            {isCompleted && (
                              <span className="text-[10px] font-bold text-[#4F6B4A] bg-[#E7EFE5] px-2 py-0.5 rounded-full">
                                Completed 🐾
                              </span>
                            )}
                            {isHeld && !isCompleted && (
                              <span className="text-[10px] font-bold text-[#E8A838] bg-[#FAF0D9] px-2 py-0.5 rounded">
                                Held
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-[#5C5C5C]">
                              {appt.bookingId}
                            </span>
                            <span className="text-sm font-extrabold text-[#3D3D3D] tabular-nums">
                              ${appt.price}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 text-xs">
                          <div className="flex items-start gap-3">
                            <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-[#E5DFD5] bg-[#F0EDE6] relative">
                              <img
                                src={appt.petSpecies === 'dog' ? APP_IMAGES.dogGroomed : APP_IMAGES.catGroomed}
                                alt={appt.petName}
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = 'none';
                                }}
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-bold text-[#3D3D3D] truncate">
                                {appt.petName} ({appt.petBreed})
                              </div>
                              <div className="text-[#5C5C5C] mt-0.5 truncate">
                                {service?.name} · {size?.label} · {appt.customerName}
                              </div>
                              <div className="text-[#5C5C5C] mt-1 font-mono text-[11px]">
                                {appt.customerPhone}
                              </div>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="font-semibold text-[#3D3D3D]">{appt.zone}</div>
                            <div className="text-[#5C5C5C] truncate">{appt.address}</div>
                            {appt.notes && (
                              <div className="text-[11px] text-[#A63D26] bg-[#FBE4DD] p-1.5 rounded">
                                Note: {appt.notes}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Card Actions Footer */}
                        <div className="mt-4 pt-3 border-t border-[#EFEAE1] flex flex-wrap items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                isCompleted
                                  ? 'bg-[#E7EFE5] text-[#4F6B4A]'
                                  : appt.readiness.petReady && appt.readiness.parkingClear
                                  ? 'bg-[#E7EFE5] text-[#4F6B4A]'
                                  : 'bg-[#FBE4DD] text-[#A63D26]'
                              }`}
                            >
                              {isCompleted
                                ? 'Completed 🐾'
                                : appt.readiness.petReady && appt.readiness.parkingClear
                                ? '✓ Customer Ready'
                                : 'Pending Readiness'}
                            </span>

                            <a
                              href={`tel:${appt.customerPhone}`}
                              onClick={(e) => e.stopPropagation()}
                              className="px-2.5 py-1 rounded-lg border border-[#D5CFBE] text-[#3D3D3D] hover:bg-[#F0EDE6] inline-flex items-center gap-1 font-semibold text-[11px]"
                            >
                              <Phone className="w-3 h-3 text-[#4F6B4A]" />
                              <span>Call</span>
                            </a>

                            {/* Direct Navigate in Google Maps Button */}
                            <a
                              href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                                appt.address
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="px-2.5 py-1 rounded-lg bg-[#4F6B4A] hover:bg-[#3f573b] text-white text-[11px] font-bold inline-flex items-center gap-1 shadow-2xs transition-colors"
                              title="Open turn-by-turn navigation in Google Maps"
                            >
                              <Navigation className="w-3 h-3" />
                              <span>Navigate in Google Maps</span>
                            </a>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleHold(appt.id);
                              }}
                              className="px-2.5 py-1 rounded-lg border border-[#D5CFBE] text-[#5C5C5C] hover:text-[#3D3D3D] text-[11px] font-medium cursor-pointer"
                            >
                              {isHeld ? 'Unhold' : 'Hold'}
                            </button>

                            {appt.status !== 'completed' ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateAppointmentStatus(appt.id, 'completed');
                                }}
                                className="px-2.5 py-1 rounded-lg bg-[#4F6B4A] hover:bg-[#3f573b] text-white text-[11px] font-bold shadow-2xs active:scale-95 transition-all cursor-pointer"
                              >
                                Mark Completed
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateAppointmentStatus(appt.id, 'confirmed');
                                }}
                                className="px-2.5 py-1 rounded-lg border border-[#A8BFA0] bg-[#E7EFE5] text-[#4F6B4A] hover:bg-[#d8e6d5] text-[11px] font-bold transition-colors cursor-pointer"
                                title="Click to reopen if marked completed by mistake"
                              >
                                Completed 🐾
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                releaseAppointment(appt.id);
                              }}
                              className="p-1 text-[#5C5C5C] hover:text-[#A63D26] transition-colors cursor-pointer"
                              title="Release Slot"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })}

                {/* Return Trip to Central Hub */}
                <div className="flex items-center gap-3 px-4 py-1 text-xs text-[#5C5C5C]">
                  <div className="w-0.5 h-6 bg-[#D5CFBE] ml-3" />
                  <span className="text-[11px] text-[#4F6B4A] font-semibold bg-[#E7EFE5] px-2 py-0.5 rounded-full">
                    🚗 Return drive to Central Austin Hub (15m)
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#F0EDE6] border border-[#D5CFBE] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#3D3D3D]" />
                    <span className="font-bold text-[#3D3D3D]">
                      Day Route Concluded at Central Austin Base
                    </span>
                  </div>
                  <span className="text-[#5C5C5C] font-mono">Home</span>
                </div>
              </div>
            ) : (
              <div className="p-8 sm:p-10 rounded-3xl bg-white border border-[#E5DFD5] text-center space-y-4 shadow-sm">
                <div className="w-14 h-14 rounded-2xl bg-[#E7EFE5] text-[#4F6B4A] flex items-center justify-center mx-auto">
                  <Calendar className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-black text-[#3D3D3D] font-heading">
                    No Appointments Scheduled for Today ({selectedDate})
                  </h3>
                  <p className="text-xs text-[#5C5C5C] max-w-sm mx-auto leading-relaxed">
                    Sarah's Austin route is currently clear. Bookings made by clients through the public booking flow will appear here automatically in real-time.
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowManualModal(true)}
                    className="px-4 py-2.5 rounded-xl bg-[#4F6B4A] hover:bg-[#3f573b] text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Walk-In / Manual Booking</span>
                  </button>
                  <button
                    type="button"
                    onClick={loadDemoSchedule}
                    className="px-4 py-2.5 rounded-xl border border-[#D5CFBE] bg-white hover:bg-[#FAF7F2] text-[#3D3D3D] text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#E8A838]" />
                    <span>Load Demo Day Route</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Interactive Map, Attention Card & Quick Tools */}
          <div className="lg:col-span-4 space-y-4">
            {/* Real Google Maps Route Transit Visualizer */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#3D3D3D] uppercase tracking-wider flex items-center gap-1.5">
                  <Navigation className="w-3.5 h-3.5 text-[#4F6B4A]" />
                  <span>Interactive Route Transit Map</span>
                </span>
                <span className="text-[10px] text-[#5C5C5C]">
                  {dayAppointments.length} Active Stop{dayAppointments.length === 1 ? '' : 's'}
                </span>
              </div>
              <RouteTransitMap
                currentZone={activeAppt ? activeAppt.zone : 'Central Austin'}
                previousAppointment={activePrevAppt}
                selectedAppointment={activeAppt}
                allAppointments={dayAppointments}
                onSelectAppointment={(id) => setSelectedApptId(id)}
                height="300px"
              />
            </div>

            {/* Attention Card */}
            <div className="p-5 rounded-2xl bg-white border border-[#E5DFD5] shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#A63D26] uppercase tracking-wider">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Action Items ({attentionItems.length})</span>
                </div>
                <span className="text-[10px] text-[#5C5C5C]">Pre-Arrival</span>
              </div>

              {attentionItems.length > 0 ? (
                <div className="space-y-2.5">
                  {attentionItems.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-xl bg-[#FBE4DD] border border-[#E8836B]/40 space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#A63D26]">
                          {item.petName} ({item.zone})
                        </span>
                        <span className="text-[10px] font-bold text-[#A63D26]">
                          {formatMinutesToTime(item.startTime)}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#A63D26] leading-tight">
                        Checklist pending: {!item.readiness.parkingClear && 'Driveway parking space · '}{' '}
                        {!item.readiness.gateUnlocked && 'Gate access · '}{' '}
                        {!item.readiness.petReady && 'Pet ready'}
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <a
                          href={`tel:${item.customerPhone}`}
                          className="text-[10px] font-bold text-[#A63D26] underline"
                        >
                          Call {item.customerName}
                        </a>
                        <button
                          type="button"
                          onClick={() => releaseAppointment(item.id)}
                          className="text-[10px] font-semibold text-[#A63D26] hover:underline"
                        >
                          Release Slot
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-[#E7EFE5] text-center text-xs text-[#4F6B4A] font-medium">
                  ✓ All booked customers have completed arrival readiness!
                </div>
              )}
            </div>

            {/* Van Status Profile Widget */}
            <div className="p-5 rounded-2xl bg-white border border-[#E5DFD5] shadow-sm space-y-3">
              <span className="text-xs font-bold text-[#3D3D3D] uppercase tracking-wider block">
                Mobile Van Status & Equipment
              </span>
              <div className="relative w-full h-36 rounded-xl overflow-hidden border border-[#E5DFD5] bg-[#F0EDE6]">
                <img
                  src={APP_IMAGES.heroVan}
                  alt="Sarah's Mobile Van"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-2.5">
                  <span className="text-white text-xs font-bold drop-shadow">Mercedes Sprinter Mobile Spa</span>
                </div>
              </div>
              <div className="space-y-1.5 text-xs text-[#5C5C5C] pt-1">
                <div className="flex justify-between">
                  <span>Van Hub:</span>
                  <strong className="text-[#3D3D3D]">Central Austin (78704)</strong>
                </div>
                <div className="flex justify-between">
                  <span>Van Equipment:</span>
                  <strong className="text-[#3D3D3D]">Water, Solar & AC Active</strong>
                </div>
                <div className="flex justify-between">
                  <span>Sanitization Buffer:</span>
                  <strong className="text-[#4F6B4A]">{settings.bufferMin} min / stop</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 8-Second Undo Toast */}
      {undoToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#3D3D3D] text-white p-4 rounded-2xl shadow-2xl flex items-center gap-4 max-w-md animate-slide-up border border-[#5C5C5C]">
          <div>
            <div className="text-xs font-bold">
              Released {undoToast.appointment.petName}'s slot ({formatMinutesToTime(undoToast.appointment.startTime)})
            </div>
            <div className="text-[11px] text-[#D5CFBE] mt-0.5">
              Available to other customers in {undoToast.appointment.zone}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={undoRelease}
              className="px-3 py-1.5 rounded-lg bg-[#E8A838] hover:bg-[#d8972b] text-[#3D3D3D] font-bold text-xs transition-colors"
            >
              Undo (8s)
            </button>
            <button
              type="button"
              onClick={dismissUndoToast}
              className="p-1 text-[#D5CFBE] hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Settings Drawer */}
      {showSettingsDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm">
          <div className="bg-[#FAF7F2] w-full max-w-md h-full shadow-2xl p-6 overflow-y-auto space-y-6 flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-[#E5DFD5] pb-4">
                <div>
                  <h3 className="text-xl font-extrabold text-[#3D3D3D] font-heading">
                    Route & Dispatch Settings
                  </h3>
                  <p className="text-xs text-[#5C5C5C]">Configure Sarah's operating constraints</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSettingsDrawer(false)}
                  className="p-1 rounded-lg hover:bg-[#E5DFD5] text-[#5C5C5C]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Working Hours */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-[#3D3D3D] uppercase tracking-wider block">
                  Operating Window
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#5C5C5C] mb-1">
                      Day Start Time
                    </label>
                    <select
                      value={settings.dayStartMin}
                      onChange={(e) =>
                        updateSettings({ dayStartMin: parseInt(e.target.value, 10) })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-[#D5CFBE] bg-white text-xs text-[#3D3D3D]"
                    >
                      <option value={480}>8:00 AM</option>
                      <option value={510}>8:30 AM (Default)</option>
                      <option value={540}>9:00 AM</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#5C5C5C] mb-1">
                      Day End Time
                    </label>
                    <select
                      value={settings.dayEndMin}
                      onChange={(e) =>
                        updateSettings({ dayEndMin: parseInt(e.target.value, 10) })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-[#D5CFBE] bg-white text-xs text-[#3D3D3D]"
                    >
                      <option value={1020}>5:00 PM</option>
                      <option value={1050}>5:30 PM (Default)</option>
                      <option value={1080}>6:00 PM</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Buffer & Daily Cap */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#3D3D3D] uppercase tracking-wider mb-1">
                    Setup Buffer
                  </label>
                  <select
                    value={settings.bufferMin}
                    onChange={(e) =>
                      updateSettings({ bufferMin: parseInt(e.target.value, 10) })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-[#D5CFBE] bg-white text-xs text-[#3D3D3D]"
                  >
                    <option value={5}>5 min</option>
                    <option value={10}>10 min (Standard)</option>
                    <option value={15}>15 min</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#3D3D3D] uppercase tracking-wider mb-1">
                    Daily Booking Cap
                  </label>
                  <select
                    value={settings.dailyCap}
                    onChange={(e) =>
                      updateSettings({ dailyCap: parseInt(e.target.value, 10) })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-[#D5CFBE] bg-white text-xs text-[#3D3D3D]"
                  >
                    <option value={3}>3 jobs/day</option>
                    <option value={4}>4 jobs/day</option>
                    <option value={5}>5 jobs/day (Default)</option>
                    <option value={6}>6 jobs/day</option>
                  </select>
                </div>
              </div>

              {/* Zone Toggles */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-[#3D3D3D] uppercase tracking-wider block">
                  Austin Zone Availability Toggles
                </span>
                <div className="space-y-2">
                  {ZONES.map((zone) => {
                    const isEnabled = settings.enabledZones[zone] ?? true;
                    return (
                      <div
                        key={zone}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-[#E5DFD5] text-xs"
                      >
                        <span className="font-semibold text-[#3D3D3D]">{zone}</span>
                        <button
                          type="button"
                          onClick={() => toggleZone(zone)}
                          className={`px-3 py-1 rounded-full text-[11px] font-bold transition-colors ${
                            isEnabled
                              ? 'bg-[#E7EFE5] text-[#4F6B4A]'
                              : 'bg-[#FBE4DD] text-[#A63D26]'
                          }`}
                        >
                          {isEnabled ? 'Active' : 'Paused'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[#E5DFD5]">
              <button
                type="button"
                onClick={() => setShowSettingsDrawer(false)}
                className="w-full py-2.5 rounded-xl bg-[#4F6B4A] text-white font-bold text-xs"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Controls & Demo Dialog */}
      {showResetDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-[#FAF7F2] rounded-3xl border border-[#D5CFBE] p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#E5DFD5] pb-3">
              <h3 className="text-lg font-black text-[#3D3D3D] font-heading">
                Schedule Controls & Data Mode
              </h3>
              <button
                type="button"
                onClick={() => setShowResetDialog(false)}
                className="text-[#5C5C5C] hover:text-[#3D3D3D]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#5C5C5C] leading-relaxed">
              Switch between Fresh Start Live Mode (clean schedule showing only orders you book in real-time) or Load Demo Day Route.
            </p>

            <div className="space-y-2.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  clearAllAppointments();
                  setShowResetDialog(false);
                }}
                className="w-full p-3.5 rounded-xl border border-[#A63D26]/40 bg-[#FBE4DD] hover:bg-[#f7d6cb] text-left transition-colors cursor-pointer"
              >
                <div className="text-xs font-bold text-[#A63D26] flex items-center justify-between">
                  <span>Clear to Fresh Start (0 Bookings)</span>
                  <Trash2 className="w-4 h-4" />
                </div>
                <div className="text-[11px] text-[#A63D26]/80 mt-0.5">
                  Wipes all fake seeds so only new user bookings appear.
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  loadDemoSchedule();
                  setShowResetDialog(false);
                }}
                className="w-full p-3.5 rounded-xl border border-[#A8BFA0] bg-[#E7EFE5] hover:bg-[#dbe7d9] text-left transition-colors cursor-pointer"
              >
                <div className="text-xs font-bold text-[#4F6B4A] flex items-center justify-between">
                  <span>Load Verified Demo Week Route</span>
                  <Sparkles className="w-4 h-4 text-[#E8A838]" />
                </div>
                <div className="text-[11px] text-[#4F6B4A]/80 mt-0.5">
                  Populates 7-day realistic Austin route with verified times.
                </div>
              </button>
            </div>

            <div className="flex items-center justify-end pt-2 border-t border-[#E5DFD5]">
              <button
                type="button"
                onClick={() => setShowResetDialog(false)}
                className="px-4 py-2 text-xs font-semibold text-[#5C5C5C] hover:text-[#3D3D3D]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual / Walk-In Booking Modal */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[#FAF7F2] rounded-3xl border border-[#D5CFBE] p-6 max-w-lg w-full shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-[#E5DFD5] pb-3">
              <div>
                <span className="text-[10px] font-bold text-[#4F6B4A] uppercase tracking-wider bg-[#E7EFE5] px-2 py-0.5 rounded">
                  Dispatch Action
                </span>
                <h3 className="text-lg font-black text-[#3D3D3D] font-heading mt-1">
                  Add Walk-In / Manual Booking
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowManualModal(false)}
                className="text-[#5C5C5C] hover:text-[#3D3D3D]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const serv = SERVICES[manualForm.serviceId];
                const dur = calculateDuration(manualForm.serviceId, manualForm.petSize);
                const newBooking: Appointment = {
                  id: `manual_${Date.now()}`,
                  bookingId: formatBookingId(selectedDate, dayAppointments.length + 1),
                  date: selectedDate,
                  startTime: manualForm.startTime,
                  duration: dur,
                  endTime: manualForm.startTime + dur,
                  customerName: manualForm.customerName || 'Walk-In Customer',
                  customerPhone: manualForm.customerPhone || '(512) 555-0199',
                  customerEmail: manualForm.customerEmail || 'walkin@example.com',
                  address: manualForm.address,
                  zone: manualForm.zone,
                  petSpecies: manualForm.petSpecies,
                  petName: manualForm.petName || 'Buddy',
                  petBreed: manualForm.petBreed,
                  petSize: manualForm.petSize,
                  serviceId: manualForm.serviceId,
                  price: serv?.price || 75,
                  depositPaid: 25,
                  status: 'confirmed',
                  readiness: {
                    petReady: true,
                    gateUnlocked: true,
                    parkingClear: true,
                    confirmedAt: new Date().toISOString(),
                  },
                  notes: 'Direct manual dispatch entry by Sarah.',
                };

                addManualBooking(newBooking);
                setShowManualModal(false);
              }}
              className="space-y-3.5 text-xs text-[#3D3D3D]"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">Customer Name *</label>
                  <input
                    type="text"
                    required
                    value={manualForm.customerName}
                    onChange={(e) => setManualForm({ ...manualForm, customerName: e.target.value })}
                    placeholder="e.g. Taylor Smith"
                    className="w-full px-3 py-2 rounded-xl border border-[#D5CFBE] bg-white"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Customer Phone *</label>
                  <input
                    type="tel"
                    required
                    value={manualForm.customerPhone}
                    onChange={(e) => setManualForm({ ...manualForm, customerPhone: e.target.value })}
                    placeholder="(512) 555-0199"
                    className="w-full px-3 py-2 rounded-xl border border-[#D5CFBE] bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">Pet Name *</label>
                  <input
                    type="text"
                    required
                    value={manualForm.petName}
                    onChange={(e) => setManualForm({ ...manualForm, petName: e.target.value })}
                    placeholder="e.g. Milo"
                    className="w-full px-3 py-2 rounded-xl border border-[#D5CFBE] bg-white"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Pet Breed *</label>
                  <input
                    type="text"
                    required
                    value={manualForm.petBreed}
                    onChange={(e) => setManualForm({ ...manualForm, petBreed: e.target.value })}
                    placeholder="e.g. Golden Retriever"
                    className="w-full px-3 py-2 rounded-xl border border-[#D5CFBE] bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">Service</label>
                  <select
                    value={manualForm.serviceId}
                    onChange={(e) => setManualForm({ ...manualForm, serviceId: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-[#D5CFBE] bg-white"
                  >
                    {Object.values(SERVICES).map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} (${s.price})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold mb-1">Time on {selectedDate}</label>
                  <select
                    value={manualForm.startTime}
                    onChange={(e) => setManualForm({ ...manualForm, startTime: parseInt(e.target.value, 10) })}
                    className="w-full px-3 py-2 rounded-xl border border-[#D5CFBE] bg-white"
                  >
                    <option value={540}>9:00 AM</option>
                    <option value={600}>10:00 AM</option>
                    <option value={660}>11:00 AM</option>
                    <option value={720}>12:00 PM</option>
                    <option value={780}>1:00 PM</option>
                    <option value={840}>2:00 PM</option>
                    <option value={900}>3:00 PM</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">Austin Street Address</label>
                <input
                  type="text"
                  required
                  value={manualForm.address}
                  onChange={(e) => setManualForm({ ...manualForm, address: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[#D5CFBE] bg-white"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Austin Geographic Zone</label>
                <select
                  value={manualForm.zone}
                  onChange={(e) => setManualForm({ ...manualForm, zone: e.target.value as ZoneId })}
                  className="w-full px-3 py-2 rounded-xl border border-[#D5CFBE] bg-white"
                >
                  {ZONES.map((z) => (
                    <option key={z} value={z}>
                      {z}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E5DFD5]">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="px-4 py-2 font-semibold text-[#5C5C5C] hover:text-[#3D3D3D]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#4F6B4A] hover:bg-[#3f573b] text-white font-bold transition-all shadow-md active:scale-95"
                >
                  Confirm & Dispatch Stop
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Automated Email Notifications & Dispatch Logs Modal */}
      {showEmailLogsModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-y-auto border border-[#E5DFD5] shadow-2xl flex flex-col">
            <div className="p-5 border-b border-[#EFEAE1] flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#E7EFE5] text-[#4F6B4A] flex items-center justify-center">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#3D3D3D] font-heading">
                    Automated Dual Email Dispatch Logs
                  </h3>
                  <p className="text-xs text-[#5C5C5C]">
                    Client confirmations & Sarah dispatch alerts sent upon payment confirmation
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowEmailLogsModal(false);
                  setSelectedEmailForView(null);
                }}
                className="p-1.5 rounded-full hover:bg-[#F0EDE6] text-[#5C5C5C] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 flex-1">
              {selectedEmailForView ? (
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => setSelectedEmailForView(null)}
                    className="text-xs font-bold text-[#4F6B4A] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    ← Back to Email Log List
                  </button>

                  <div className="p-4 bg-[#FAF7F2] rounded-2xl border border-[#E5DFD5] text-xs space-y-1.5">
                    <div><strong>Subject:</strong> {selectedEmailForView.subject}</div>
                    <div><strong>To:</strong> {selectedEmailForView.to}</div>
                    <div><strong>From:</strong> {selectedEmailForView.from}</div>
                    <div><strong>Sent:</strong> {new Date(selectedEmailForView.sentAt).toLocaleString()}</div>
                    {selectedEmailForView.mimeCalendarAttachment && (
                      <div className="pt-1.5 border-t border-[#E5DFD5] flex items-center justify-between text-[#4F6B4A]">
                        <span>
                          📎 <strong>MIME Attachment:</strong> {selectedEmailForView.mimeCalendarAttachment.filename} (<code>{selectedEmailForView.mimeCalendarAttachment.contentType}</code>)
                        </span>
                      </div>
                    )}
                    <div>
                      <strong>Status:</strong>{' '}
                      <span className="text-[#4F6B4A] font-bold">✓ Delivered</span>
                    </div>
                  </div>

                  <div
                    dangerouslySetInnerHTML={{ __html: selectedEmailForView.htmlBody }}
                    className="border border-[#E5DFD5] rounded-2xl overflow-hidden shadow-2xs"
                  />
                </div>
              ) : dispatchedEmails.length > 0 ? (
                <div className="space-y-3">
                  {dispatchedEmails.map((email) => {
                    const isClient = email.type === 'client_confirmation';
                    return (
                      <div
                        key={email.id}
                        className="p-4 rounded-2xl border border-[#E5DFD5] bg-[#FAF7F2] hover:bg-white hover:border-[#4F6B4A] transition-all space-y-2 cursor-pointer shadow-2xs"
                        onClick={() => setSelectedEmailForView(email)}
                      >
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span
                              className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${
                                isClient
                                  ? 'bg-[#E7EFE5] text-[#4F6B4A]'
                                  : 'bg-[#FAF0D9] text-[#E8A838]'
                              }`}
                            >
                              {isClient ? 'Client Confirmation Email' : "Sarah's Dispatch Alert"}
                            </span>
                            {email.mimeCalendarAttachment && (
                              <span className="text-[10px] font-semibold text-[#4F6B4A] bg-white border border-[#D5CFBE] px-1.5 py-0.5 rounded-md">
                                📎 .ics invite
                              </span>
                            )}
                          </div>
                          <span className="text-[#5C5C5C] text-[11px]">
                            {new Date(email.sentAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>

                        <div className="font-bold text-sm text-[#3D3D3D]">{email.subject}</div>
                        <div className="text-xs text-[#5C5C5C]">
                          Recipient: <span className="font-mono text-[#3D3D3D]">{email.to}</span>
                        </div>
                        <div className="text-[11px] text-[#5C5C5C] line-clamp-1">{email.previewText}</div>

                        <div className="pt-2 border-t border-[#EFEAE1] flex items-center justify-between text-xs">
                          <span className="text-[#4F6B4A] font-bold">✓ Status: Delivered</span>
                          <span className="text-[#4F6B4A] font-bold flex items-center gap-1">
                            <Eye className="w-3.5 h-3.5" />
                            <span>Click to View Full HTML Template →</span>
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-10 space-y-2 bg-[#FAF7F2] rounded-2xl border border-[#E5DFD5]">
                  <Mail className="w-8 h-8 text-[#9E9B95] mx-auto" />
                  <div className="text-sm font-bold text-[#3D3D3D]">No Dispatched Emails Yet</div>
                  <p className="text-xs text-[#5C5C5C] max-w-xs mx-auto">
                    When a client completes payment on Step 4, both the client confirmation email and Sarah's real-time dispatch alert are dispatched and logged here.
                  </p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-[#EFEAE1] bg-[#FAF7F2] text-right">
              <button
                type="button"
                onClick={() => {
                  setShowEmailLogsModal(false);
                  setSelectedEmailForView(null);
                }}
                className="px-4 py-2 rounded-xl bg-[#4F6B4A] hover:bg-[#3f573b] text-white text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Subtle Toast Alert for New Bookings Registered */}
      {newBookingAlert && (
        <div className="fixed bottom-6 right-4 sm:right-6 z-50 animate-bounce transition-all">
          <div className="bg-[#3D3D3D] text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border-2 border-[#4F6B4A]">
            <div className="w-8 h-8 rounded-xl bg-[#4F6B4A] text-white flex items-center justify-center shrink-0 text-sm">
              🐾
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>New booking received for {newBookingAlert.petName}!</span>
              </div>
              <div className="text-[11px] text-[#D5CFBE]">
                Date: {newBookingAlert.date} · Route updated in real-time
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedDate(newBookingAlert.date);
                setSelectedApptId(newBookingAlert.bookingId);
                setNewBookingAlert(null);
              }}
              className="px-2.5 py-1 rounded-lg bg-[#4F6B4A] hover:bg-[#3f573b] text-white text-[11px] font-bold cursor-pointer transition-colors shrink-0"
            >
              View
            </button>
            <button
              type="button"
              onClick={() => setNewBookingAlert(null)}
              className="text-[#9E9B95] hover:text-white p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
