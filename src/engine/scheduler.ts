import {
  Appointment,
  DailyStats,
  PetSize,
  SchedulerSettings,
  ServiceId,
  SlotCandidate,
  ZoneId,
} from '../types';
import {
  DRIVE_MATRIX,
  HOME_BASE_DRIVE,
  HOME_BASE_ZONE,
  SERVICES,
  SIZES,
} from './constants';

export const DEFAULT_SETTINGS: SchedulerSettings = {
  dayStartMin: 510, // 8:30 AM CT
  dayEndMin: 1080, // 6:00 PM CT (permits 5:00 PM appointment start windows)
  bufferMin: 10,
  dailyCap: 5,
  enabledZones: {
    'North Austin': true,
    'Cedar Park': true,
    'Round Rock': true,
    'Central Austin': true,
    'East Austin': true,
    'South Austin': true,
    'Oak Hill/West': true,
  },
};

export function getDriveTime(fromZone: ZoneId, toZone: ZoneId): number {
  if (fromZone === toZone) {
    return DRIVE_MATRIX[fromZone][toZone] || 10;
  }
  const drive = DRIVE_MATRIX[fromZone]?.[toZone];
  if (typeof drive === 'number') {
    return drive;
  }
  return 20; // fallback safe estimate
}

export function calculateDuration(serviceId: ServiceId, petSize: PetSize): number {
  const service = SERVICES[serviceId];
  const size = SIZES[petSize];
  const base = service ? service.baseDurationMin : 60;
  const extra = size ? size.extraDurationMin : 0;
  return base + extra;
}

export function formatMinutesToTime(minutes: number): string {
  const normalized = Math.max(0, Math.floor(minutes));
  const hours24 = Math.floor(normalized / 60);
  const mins = normalized % 60;
  const period = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  const minsPadded = mins < 10 ? `0${mins}` : `${mins}`;
  return `${hours12}:${minsPadded} ${period}`;
}

export function formatTimeRange(startMin: number, endMin: number): string {
  return `${formatMinutesToTime(startMin)} – ${formatMinutesToTime(endMin)}`;
}

export function formatBookingId(dateStr: string, seqNum: number): string {
  // dateStr is expected YYYY-MM-DD
  const parts = dateStr.split('-');
  let yy = '26';
  let mm = '09';
  let dd = '29';
  if (parts.length === 3) {
    yy = parts[0].slice(-2);
    mm = parts[1].padStart(2, '0');
    dd = parts[2].padStart(2, '0');
  }
  const nnn = String(Math.max(1, Math.min(999, seqNum))).padStart(3, '0');
  return `RL-${yy}${mm}${dd}-${nnn}`;
}

export function isFarFromRoute(targetZone: ZoneId, previousZone?: ZoneId): boolean {
  if (!previousZone) {
    const homeDrive = HOME_BASE_DRIVE[targetZone] || 15;
    return homeDrive >= 25;
  }
  const drive = getDriveTime(previousZone, targetZone);
  return drive >= 25;
}

export interface SlotEvaluationResult {
  availableSlots: SlotCandidate[];
  nearMissBlockedSlots: SlotCandidate[];
  allSlots: SlotCandidate[];
  isDayFull: boolean;
}

export function evaluateSlotsForDate(
  date: string,
  targetZone: ZoneId,
  duration: number,
  existingAppointments: Appointment[],
  settings: SchedulerSettings = DEFAULT_SETTINGS
): SlotEvaluationResult {
  const dayAppointments = existingAppointments
    .filter((a) => a.date === date && a.status !== 'cancelled')
    .sort((a, b) => a.startTime - b.startTime);

  const isDayFull = dayAppointments.length >= settings.dailyCap;
  const isZoneEnabled = settings.enabledZones[targetZone] ?? true;

  const allSlots: SlotCandidate[] = [];
  const availableSlots: SlotCandidate[] = [];
  const blockedSlots: SlotCandidate[] = [];

  const startBound = settings.dayStartMin;
  const endBound = settings.dayEndMin;
  const step = 30; // 30-minute intervals

  for (let start = startBound; start <= 1020; start += step) {
    const end = start + duration;

    // Identify previous appointment before this slot starts
    const prevJob = dayAppointments
      .filter((a) => a.endTime <= start)
      .slice(-1)[0];

    // Identify next appointment after this slot ends
    const nextJob = dayAppointments
      .filter((a) => a.startTime >= end)[0];

    const driveFromPrev = prevJob
      ? getDriveTime(prevJob.zone, targetZone)
      : HOME_BASE_DRIVE[targetZone];

    const driveToNext = nextJob
      ? getDriveTime(targetZone, nextJob.zone)
      : HOME_BASE_DRIVE[targetZone];

    const candidate: SlotCandidate = {
      startTime: start,
      endTime: end,
      formattedTime: formatTimeRange(start, end),
      available: false,
      driveFromPrev,
      driveToNext,
      buffer: settings.bufferMin,
      prevJob: prevJob
        ? {
            customerName: prevJob.customerName,
            address: prevJob.address,
            zone: prevJob.zone,
            endTime: prevJob.endTime,
          }
        : undefined,
      nextJob: nextJob
        ? {
            customerName: nextJob.customerName,
            address: nextJob.address,
            zone: nextJob.zone,
            startTime: nextJob.startTime,
          }
        : undefined,
      isRecommendedCluster:
        prevJob?.zone === targetZone || nextJob?.zone === targetZone,
    };

    // Check Zone Enabled
    if (!isZoneEnabled) {
      candidate.available = false;
      candidate.blockedReason = `Service in ${targetZone} is currently paused in Sarah's route settings.`;
      allSlots.push(candidate);
      blockedSlots.push(candidate);
      continue;
    }

    // Rule D: Daily booking cap
    if (isDayFull) {
      candidate.available = false;
      candidate.failedRule = 'D';
      candidate.blockedReason = `Daily route capacity reached (${settings.dailyCap}/${settings.dailyCap} appointments booked).`;
      allSlots.push(candidate);
      blockedSlots.push(candidate);
      continue;
    }

    // Rule C: Exceeds operating day end
    if (end > endBound) {
      candidate.available = false;
      candidate.failedRule = 'C';
      candidate.minutesLate = end - endBound;
      candidate.blockedReason = `Service finishes at ${formatMinutesToTime(end)}, exceeding Sarah's operating hours ending at ${formatMinutesToTime(endBound)}.`;
      allSlots.push(candidate);
      blockedSlots.push(candidate);
      continue;
    }

    // -------------------------------------------------------------
    // DYNAMIC DURATION LOCKING MECHANISM:
    // When an appointment A exists at start time S with duration D (ending at E = S + D):
    // Calculate Route Buffer = Travel Time (between A.zone and targetZone) + Buffer (bufferMin).
    // LOCK the entire window from [S - Route Buffer] to [E + Route Buffer].
    // Any candidate [start, end] overlapping or violating this locked window is excluded!
    // -------------------------------------------------------------
    let lockedByAppointment = false;
    for (const appt of dayAppointments) {
      const S = appt.startTime;
      const E = appt.endTime;
      const travelTime = getDriveTime(appt.zone, targetZone);
      const routeBuffer = travelTime + settings.bufferMin;
      const lockWindowStart = S - routeBuffer;
      const lockWindowEnd = E + routeBuffer;

      // 1. Direct Overlap Check
      if (start < E && end > S) {
        lockedByAppointment = true;
        candidate.available = false;
        candidate.failedRule = 'OVERLAP';
        candidate.minutesLate = Math.max(0, E - start);
        candidate.blockedReason = `Overlaps with existing ${formatMinutesToTime(S)} – ${formatMinutesToTime(E)} booking for ${appt.petName} in ${appt.zone}.`;
        allSlots.push(candidate);
        blockedSlots.push(candidate);
        break;
      }

      // 2. Candidate is before appt, but violates departure buffer to appt
      if (start < S && end > lockWindowStart) {
        lockedByAppointment = true;
        const minutesLate = end - lockWindowStart;
        candidate.available = false;
        candidate.failedRule = 'B';
        candidate.minutesLate = minutesLate;
        candidate.blockedReason = `Finishing at ${formatMinutesToTime(end)} leaves only ${S - end}m. Need ${travelTime}m drive to ${appt.zone} + ${settings.bufferMin}m buffer to reach next stop by ${formatMinutesToTime(S)} (${minutesLate}m late).`;
        candidate.travelMathExplanation = `Finish ${formatMinutesToTime(end)} + ${travelTime}m drive + ${settings.bufferMin}m setup = arrival ${formatMinutesToTime(end + routeBuffer)} vs required ${formatMinutesToTime(S)}`;
        allSlots.push(candidate);
        blockedSlots.push(candidate);
        break;
      }

      // 3. Candidate is after appt, but violates arrival buffer from appt
      if (start >= E && start < lockWindowEnd) {
        lockedByAppointment = true;
        const minutesLate = lockWindowEnd - start;
        candidate.available = false;
        candidate.failedRule = 'A';
        candidate.minutesLate = minutesLate;
        candidate.blockedReason = `Previous stop in ${appt.zone} ends at ${formatMinutesToTime(E)}. Travel to ${targetZone} (${travelTime}m) + buffer (${settings.bufferMin}m) puts arrival at ${formatMinutesToTime(lockWindowEnd)} (${minutesLate}m late).`;
        candidate.travelMathExplanation = `Prev stop in ${appt.zone} ends ${formatMinutesToTime(E)} + ${travelTime}m drive to ${targetZone} + ${settings.bufferMin}m setup = earliest arrival ${formatMinutesToTime(lockWindowEnd)}`;
        allSlots.push(candidate);
        blockedSlots.push(candidate);
        break;
      }
    }

    if (lockedByAppointment) {
      continue;
    }

    // All rules passed!
    candidate.available = true;
    candidate.travelMathExplanation = prevJob
      ? `Sarah arrives from ${prevJob.zone} with ${start - (prevJob.endTime + driveFromPrev)}m safety window.`
      : `First appointment: direct route from Central Austin (${driveFromPrev}m drive).`;

    allSlots.push(candidate);
    availableSlots.push(candidate);
  }

  // Filter near-miss blocked slots (minutesLate <= 45, max 3)
  const nearMissBlockedSlots = blockedSlots
    .filter((s) => s.minutesLate !== undefined && s.minutesLate > 0 && s.minutesLate <= 45)
    .slice(0, 3);

  return {
    availableSlots,
    nearMissBlockedSlots,
    allSlots,
    isDayFull,
  };
}

export function calculateDailyStats(
  date: string,
  appointments: Appointment[],
  settings: SchedulerSettings = DEFAULT_SETTINGS
): DailyStats {
  const dayAppointments = appointments
    .filter((a) => a.date === date && a.status !== 'cancelled')
    .sort((a, b) => a.startTime - b.startTime);

  const totalCount = dayAppointments.length;
  const completedCount = dayAppointments.filter((a) => a.status === 'completed').length;
  const revenue = dayAppointments.reduce((sum, a) => sum + (a.price || 0), 0);

  if (totalCount === 0) {
    return {
      revenue: 0,
      driveTimeMin: 0,
      idleTimeMin: 0,
      savedMinutes: 0,
      completedCount: 0,
      totalCount: 0,
      efficiencyScore: 100,
    };
  }

  let driveTimeMin = 0;
  let idleTimeMin = 0;
  let serviceTimeMin = 0;

  // Drive from Central Austin home base to first appointment
  driveTimeMin += HOME_BASE_DRIVE[dayAppointments[0].zone] || 15;

  for (let i = 0; i < dayAppointments.length; i++) {
    const current = dayAppointments[i];
    serviceTimeMin += current.duration;

    if (i < dayAppointments.length - 1) {
      const next = dayAppointments[i + 1];
      const driveBetween = getDriveTime(current.zone, next.zone);
      driveTimeMin += driveBetween;

      const gap = next.startTime - current.endTime;
      const neededTravelAndBuffer = driveBetween + settings.bufferMin;
      const idle = Math.max(0, gap - neededTravelAndBuffer);
      idleTimeMin += idle;
    }
  }

  // Return drive from last appointment to Central Austin home base
  driveTimeMin += HOME_BASE_DRIVE[dayAppointments[totalCount - 1].zone] || 15;

  // Saved travel minutes:
  // Un-optimized random criss-crossing baseline in Austin = ~35 minutes per leg.
  // Legs count = totalCount + 1 (home -> stop1 -> stop2 ... -> home)
  const legsCount = totalCount + 1;
  const unoptimizedTotalDrive = legsCount * 32;
  const savedMinutes = Math.max(0, unoptimizedTotalDrive - driveTimeMin);

  // Efficiency score: percentage of active working time devoted to grooming vs downtime/driving
  const totalOperatingMinutes = serviceTimeMin + driveTimeMin + idleTimeMin;
  const efficiencyScore =
    totalOperatingMinutes > 0
      ? Math.round((serviceTimeMin / totalOperatingMinutes) * 100)
      : 100;

  return {
    revenue,
    driveTimeMin,
    idleTimeMin,
    savedMinutes,
    completedCount,
    totalCount,
    efficiencyScore,
  };
}

export { generateIcsCalendar, downloadIcsFile, foldIcsLine } from './ics';

export function generateGoogleCalendarUrl(appointment: Appointment): string {
  const [year, month, day] = appointment.date.split('-');
  const pad = (n: number) => String(n).padStart(2, '0');
  const startHours = Math.floor(appointment.startTime / 60);
  const startMins = appointment.startTime % 60;
  const endHours = Math.floor(appointment.endTime / 60);
  const endMins = appointment.endTime % 60;

  const dtStart = `${year}${month}${day}T${pad(startHours)}${pad(startMins)}00`;
  const dtEnd = `${year}${month}${day}T${pad(endHours)}${pad(endMins)}00`;

  const summary = `${appointment.petName}'s Grooming - Paws & Routes Mobile Pet Spa`;
  const service = SERVICES[appointment.serviceId]?.name || 'Grooming';
  const size = SIZES[appointment.petSize]?.label || '';
  const readinessUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/readiness/${appointment.id}`
    : `/readiness/${appointment.id}`;

  const details = `Mobile pet grooming appointment with Sarah in her fully equipped mobile spa van.\n\nPet: ${appointment.petName} (${appointment.petBreed}, ${size})\nService: ${service}\nBooking ID: ${appointment.bookingId}\nDeposit Paid: $${appointment.depositPaid}\nBalance Due at Visit: $${appointment.price - appointment.depositPaid}\n\nPre-Arrival Readiness Check: ${readinessUrl}\n\nPlease ensure driveway/street parking is clear for Sarah's 24ft van.`;

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: summary,
    dates: `${dtStart}/${dtEnd}`,
    details,
    location: appointment.address,
    ctz: 'America/Chicago',
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function generateDayMasterIcs(date: string, dayAppointments: Appointment[]): string {
  const [year, month, day] = date.split('-');
  const pad = (n: number) => String(n).padStart(2, '0');
  const now = new Date();
  const dtStamp = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(
    now.getUTCDate()
  )}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(
    now.getUTCSeconds()
  )}Z`;

  const sorted = [...dayAppointments].sort((a, b) => a.startTime - b.startTime);

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Paws & Routes Mobile Grooming//Sarah Master Route//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VTIMEZONE',
    'TZID:America/Chicago',
    'X-LIC-LOCATION:America/Chicago',
    'BEGIN:DAYLIGHT',
    'TZOFFSETFROM:-0600',
    'TZOFFSETTO:-0500',
    'TZNAME:CDT',
    'DTSTART:19700308T020000',
    'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU',
    'END:DAYLIGHT',
    'BEGIN:STANDARD',
    'TZOFFSETFROM:-0500',
    'TZOFFSETTO:-0600',
    'TZNAME:CST',
    'DTSTART:19701101T020000',
    'RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU',
    'END:STANDARD',
    'END:VTIMEZONE',
  ];

  sorted.forEach((appt, idx) => {
    const prevAppt = idx > 0 ? sorted[idx - 1] : undefined;
    const driveMin = prevAppt ? getDriveTime(prevAppt.zone, appt.zone) : 15;
    const prevNote = prevAppt
      ? `Transit: ${driveMin}m drive from previous stop in ${prevAppt.zone} (${prevAppt.customerName})`
      : `Transit: 15m departure drive from Central Austin Base`;

    const startHours = Math.floor(appt.startTime / 60);
    const startMins = appt.startTime % 60;
    const endHours = Math.floor(appt.endTime / 60);
    const endMins = appt.endTime % 60;
    const dtStart = `${year}${month}${day}T${pad(startHours)}${pad(startMins)}00`;
    const dtEnd = `${year}${month}${day}T${pad(endHours)}${pad(endMins)}00`;

    const navUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
      appt.address
    )}`;

    const desc = `Stop #${idx + 1} of ${sorted.length}\\nClient: ${appt.customerName} (${appt.customerPhone})\\nPet: ${appt.petName} (${appt.petBreed})\\nService: ${SERVICES[appt.serviceId]?.name || 'Grooming'}\\nPrice: $${appt.price} ($${appt.depositPaid} deposit paid)\\n\\n${prevNote}\\n\\nGoogle Maps Navigation: ${navUrl}`;

    lines.push(
      'BEGIN:VEVENT',
      `UID:route-${date}-stop-${idx + 1}-${appt.bookingId}@pawsandroutes.com`,
      `DTSTAMP:${dtStamp}`,
      `DTSTART;TZID=America/Chicago:${dtStart}`,
      `DTEND;TZID=America/Chicago:${dtEnd}`,
      `SUMMARY:Stop #${idx + 1}: ${appt.petName} (${appt.customerName}) - ${appt.zone}`,
      `DESCRIPTION:${desc}`,
      `LOCATION:${appt.address}`,
      'STATUS:CONFIRMED',
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      `DESCRIPTION:Upcoming Grooming Stop: ${appt.petName} at ${appt.address}`,
      'TRIGGER:-PT15M',
      'END:VALARM',
      'END:VEVENT'
    );
  });

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}
