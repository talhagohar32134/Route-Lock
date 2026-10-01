import { Appointment } from '../types';
import { SERVICES, SIZES } from './constants';
import { formatMinutesToTime } from './scheduler';

/**
 * Folds a single iCalendar content line at 75 octets as per RFC 5545 Section 3.1.
 * Continuation lines begin with a space character (\r\n ).
 */
export function foldIcsLine(line: string): string {
  const maxLen = 75;
  if (line.length <= maxLen) {
    return line;
  }

  const chunks: string[] = [];
  let remaining = line;

  // First chunk up to 75 chars
  chunks.push(remaining.slice(0, maxLen));
  remaining = remaining.slice(maxLen);

  // Subsequent chunks up to 74 chars (because leading space takes 1 char)
  while (remaining.length > 0) {
    chunks.push(remaining.slice(0, maxLen - 1));
    remaining = remaining.slice(maxLen - 1);
  }

  return chunks.join('\r\n ');
}

/**
 * Generates RFC 5545 compliant iCalendar content with America/Chicago VTIMEZONE,
 * strict CRLF line endings, 75-octet line folding, and 2 VALARM reminder blocks.
 * Supports method='REQUEST' for direct email calendar attachments (Google Calendar, Outlook, Apple Mail)
 * and method='PUBLISH' for standalone calendar subscriptions.
 */
export function generateIcsCalendar(
  appointment: Appointment,
  method: 'REQUEST' | 'PUBLISH' = 'REQUEST'
): string {
  const [year, month, day] = appointment.date.split('-');
  const pad = (n: number) => String(n).padStart(2, '0');

  const startHours = Math.floor(appointment.startTime / 60);
  const startMins = appointment.startTime % 60;
  const endHours = Math.floor(appointment.endTime / 60);
  const endMins = appointment.endTime % 60;

  const dtStart = `${year}${month}${day}T${pad(startHours)}${pad(startMins)}00`;
  const dtEnd = `${year}${month}${day}T${pad(endHours)}${pad(endMins)}00`;

  const now = new Date();
  const dtStamp = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(
    now.getUTCDate()
  )}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(
    now.getUTCSeconds()
  )}Z`;

  const petLabel = appointment.petName || 'your pet';
  const speciesLabel = appointment.petSpecies === 'cat' ? 'Cat' : 'Dog';
  const summary = `${speciesLabel} grooming for ${petLabel} with Paws & Routes`;

  const service = SERVICES[appointment.serviceId]?.name || 'Mobile Grooming';
  const size = SIZES[appointment.petSize]?.label || '';
  const readinessUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/readiness/${appointment.bookingId || appointment.id}`
    : `/readiness/${appointment.bookingId || appointment.id}`;

  const description = `${speciesLabel} grooming appointment with Sarah in her fully equipped mobile spa van.\\nService: ${service}\\nPet: ${appointment.petName} (${appointment.petBreed}, ${size})\\nBooking ID: ${appointment.bookingId}\\nDeposit Paid: $${appointment.depositPaid}\\nRemaining Balance Due: $${appointment.price - appointment.depositPaid}\\nPre-Arrival Readiness Checklist: ${readinessUrl}\\n\\nPlease ensure driveway or curbside parking is clear for Sarah's 24ft van.`;

  const rawLines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Paws & Routes Mobile Pet Grooming//RouteLock Engine//EN',
    'CALSCALE:GREGORIAN',
    `METHOD:${method}`,
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
    'BEGIN:VEVENT',
    `UID:${appointment.bookingId}@pawsandroutes.com`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART;TZID=America/Chicago:${dtStart}`,
    `DTEND;TZID=America/Chicago:${dtEnd}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${appointment.address}`,
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    'ORGANIZER;CN="Sarah - Paws & Routes Mobile Pet Spa":mailto:hello@pawsandroutes.example',
    `ATTENDEE;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE;CN="${appointment.customerName || 'Valued Client'}":mailto:${appointment.customerEmail || 'client@example.com'}`,
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    `DESCRIPTION:Reminder: Sarah's mobile pet spa arrives in 24 hours for ${petLabel}!`,
    'TRIGGER:-P1D',
    'END:VALARM',
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    `DESCRIPTION:Reminder: Sarah's mobile pet spa arrives in 1 hour - please clear driveway parking!`,
    'TRIGGER:-PT1H',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ];

  // Fold all lines to max 75 octets and join with CRLF (\r\n)
  return rawLines.map(foldIcsLine).join('\r\n');
}

/**
 * Initiates a client-side download of the .ics calendar file.
 * Filename format: paws-and-routes-[petName].ics
 */
export function downloadIcsFile(appointment: Appointment): void {
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
}
