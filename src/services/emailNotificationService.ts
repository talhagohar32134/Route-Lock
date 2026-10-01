import { Appointment } from '../types';
import { SERVICES, SIZES } from '../engine/constants';
import {
  formatMinutesToTime,
  getDriveTime,
  generateGoogleCalendarUrl,
  generateIcsCalendar,
} from '../engine/scheduler';

export interface MimeCalendarAttachment {
  contentType: string; // 'text/calendar; method=REQUEST; name="grooming-visit.ics"'
  filename: string; // 'grooming-visit.ics'
  method: 'REQUEST';
  content: string; // raw RFC 5545 .ics payload
  base64: string;
}

export interface DispatchedEmail {
  id: string;
  type: 'client_confirmation' | 'sarah_dispatch_alert';
  to: string;
  from: string;
  subject: string;
  sentAt: string;
  previewText: string;
  htmlBody: string;
  isDemoMode?: boolean;
  mimeCalendarAttachment?: MimeCalendarAttachment;
  headers?: Record<string, string>;
  metadata: {
    bookingId: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    petName: string;
    petBreed: string;
    petSize: string;
    serviceName: string;
    duration: number;
    address: string;
    zone: string;
    date: string;
    arrivalWindow: string;
    depositPaid: number;
    balanceRemaining: number;
    readinessUrl: string;
    calendarUrl: string;
    driveTimeFromPrev: number;
    sarahDashboardUrl: string;
    hasCalendarAttachment?: boolean;
    calendarAttachmentFilename?: string;
  };
  status: 'delivered';
}

const STORAGE_KEY = 'routelock:dispatched_emails';
const ALERT_STORAGE_KEY = 'routelock:latest_booking_alert';

let memoryEmailStore: DispatchedEmail[] = [];
let memoryAlertStore: any = null;

export function getStoredEmails(): DispatchedEmail[] {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : memoryEmailStore;
    }
    return memoryEmailStore;
  } catch (err) {
    return memoryEmailStore;
  }
}

export function saveStoredEmails(emails: DispatchedEmail[]) {
  memoryEmailStore = emails.slice(0, 50);
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(memoryEmailStore));
    }
  } catch (err) {
    // Ignore
  }
}

export function getLatestBookingAlert(): {
  petName: string;
  bookingId: string;
  date: string;
  timestamp: number;
  shown?: boolean;
} | null {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(ALERT_STORAGE_KEY);
      return raw ? JSON.parse(raw) : memoryAlertStore;
    }
    return memoryAlertStore;
  } catch {
    return memoryAlertStore;
  }
}

export function markLatestBookingAlertShown() {
  if (memoryAlertStore) {
    memoryAlertStore.shown = true;
  }
  try {
    if (typeof localStorage !== 'undefined') {
      const current = getLatestBookingAlert();
      if (current) {
        localStorage.setItem(ALERT_STORAGE_KEY, JSON.stringify({ ...current, shown: true }));
      }
    }
  } catch {
    // Ignore
  }
}

/**
 * Client-Side Automated Dual Email Dispatch Service
 * 
 * 1. Client Booking Confirmation Email -> Client's email address
 * 2. Sarah's Dispatch Alert Email -> hello@pawsandroutes.example
 * 
 * Integrates EmailJS API, optional Webhook relay, and fallback simulated dispatch
 * with zero required backend server.
 */
export async function dispatchBookingEmails(
  appointment: Appointment,
  prevAppointment?: Appointment | null
): Promise<{ clientEmail: DispatchedEmail; sarahEmail: DispatchedEmail; isDemoMode: boolean }> {
  const service = SERVICES[appointment.serviceId];
  const serviceName = service ? service.name : 'Mobile Spa Grooming';
  const size = SIZES[appointment.petSize];
  const sizeLabel = size ? `${size.label} (${size.weightDesc})` : appointment.petSize;

  // Format date nicely (e.g. "Friday, Oct 2 around 3:00 PM CT")
  let dateFormattedStr = appointment.date;
  try {
    const dObj = new Date(`${appointment.date}T12:00:00Z`);
    const dayName = dObj.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'America/Chicago' });
    const monthDay = dObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/Chicago' });
    dateFormattedStr = `${dayName}, ${monthDay} around ${formatMinutesToTime(appointment.startTime)} CT`;
  } catch {
    dateFormattedStr = `${appointment.date} around ${formatMinutesToTime(appointment.startTime)} CT`;
  }

  const arrivalWindow = `${formatMinutesToTime(appointment.startTime)} – ${formatMinutesToTime(
    appointment.endTime
  )} CT`;
  const balanceRemaining = appointment.price - appointment.depositPaid;
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://pawsandroutes.austin';
  const readinessUrl = `${baseUrl}/readiness/${appointment.bookingId || appointment.id}`;
  const sarahDashboardUrl = `${baseUrl}/dashboard?date=${appointment.date}`;
  const calendarUrl = generateGoogleCalendarUrl(appointment);

  const driveTimeFromPrev = prevAppointment
    ? getDriveTime(prevAppointment.zone, appointment.zone)
    : 15;

  const nowIso = new Date().toISOString();

  // Check if live API keys exist
  const emailJsServiceId = import.meta.env.VITE_EMAILJS_SERVICE_ID as string;
  const emailJsTemplateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID as string;
  const emailJsPublicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY as string;
  const webhookUrl = import.meta.env.VITE_EMAIL_WEBHOOK_URL as string;

  const isDemoMode = !emailJsServiceId && !webhookUrl;

  // RFC 5545 MIME Calendar Attachment (method=REQUEST for auto-detection in Google Calendar, Outlook, Apple Mail)
  const icsPayload = generateIcsCalendar(appointment, 'REQUEST');
  const base64Ics =
    typeof btoa !== 'undefined'
      ? btoa(unescape(encodeURIComponent(icsPayload)))
      : '';

  const calendarAttachment: MimeCalendarAttachment = {
    contentType: 'text/calendar; method=REQUEST; name="grooming-visit.ics"',
    filename: 'grooming-visit.ics',
    method: 'REQUEST',
    content: icsPayload,
    base64: base64Ics,
  };

  // 1. TRIGGER 1: CLIENT BOOKING CONFIRMATION EMAIL
  const clientSubject = `Your Grooming Visit is Confirmed! 🐾 - Booking #${appointment.bookingId}`;
  const clientHtml = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><title>${clientSubject}</title></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #FAF7F2; padding: 24px; color: #3D3D3D; margin: 0;">
      <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 20px; border: 1px solid #E5DFD5; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.04);">
        <!-- Header -->
        <div style="background: #4F6B4A; padding: 28px 24px; text-align: center; color: #ffffff;">
          <div style="font-size: 32px; margin-bottom: 6px;">🚐 🐾</div>
          <h1 style="margin: 0; font-size: 22px; font-weight: 800;">Paws & Routes Mobile Pet Spa</h1>
          <p style="margin: 6px 0 0 0; font-size: 13px; color: #E7EFE5;">Austin's Premier Route-Locked Doorstep Grooming</p>
        </div>

        <!-- Body -->
        <div style="padding: 28px 24px;">
          <div style="display: inline-block; background: #E7EFE5; color: #4F6B4A; font-size: 12px; font-weight: 700; padding: 4px 12px; border-radius: 12px; margin-bottom: 14px;">
            ✓ Visit Confirmed & Route Locked
          </div>
          
          <h2 style="margin: 0 0 10px 0; font-size: 20px; color: #3D3D3D;">
            Hi ${appointment.customerName}, ${appointment.petName}'s spa visit is locked in!
          </h2>
          <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #5C5C5C;">
            Sarah has mapped <strong>${appointment.petName}</strong> (${appointment.petBreed}) into her private Austin route. Her 24ft self-powered spa van will arrive right at your doorstep.
          </p>

          <!-- Appointment Summary Table -->
          <div style="background: #FAF7F2; border-radius: 16px; border: 1px solid #E5DFD5; padding: 20px; margin-bottom: 18px;">
            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
              <tr>
                <td style="padding: 6px 0; color: #5C5C5C; width: 140px;">Booking ID:</td>
                <td style="padding: 6px 0; font-weight: 700; font-family: monospace; color: #3D3D3D;">${appointment.bookingId}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #5C5C5C;">Pet / Breed:</td>
                <td style="padding: 6px 0; font-weight: 700; color: #3D3D3D;">${appointment.petName} (${appointment.petBreed})</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #5C5C5C;">Service & Size:</td>
                <td style="padding: 6px 0; font-weight: 700; color: #3D3D3D;">${serviceName} · ${sizeLabel} (${appointment.duration} min)</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #5C5C5C;">Date & Arrival:</td>
                <td style="padding: 6px 0; font-weight: 700; color: #4F6B4A;">${dateFormattedStr}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #5C5C5C;">Arrival Window:</td>
                <td style="padding: 6px 0; font-weight: 700; color: #3D3D3D;">${arrivalWindow}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #5C5C5C;">Service Address:</td>
                <td style="padding: 6px 0; font-weight: 700; color: #3D3D3D;">${appointment.address} (${appointment.zone})</td>
              </tr>
            </table>

            <!-- Financial Breakdown -->
            <div style="margin-top: 16px; padding-top: 14px; border-top: 1px dashed #D5CFBE; font-size: 13px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                <span style="color: #5C5C5C;">Total Service Price:</span>
                <span style="font-weight: 700; color: #3D3D3D;">$${appointment.price}.00</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                <span style="color: #4F6B4A; font-weight: 700;">Deposit Paid Today:</span>
                <span style="font-weight: 700; color: #4F6B4A;">-$${appointment.depositPaid}.00 (Card)</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-top: 8px; padding-top: 8px; border-top: 1px solid #E5DFD5;">
                <span style="font-weight: 800; color: #3D3D3D;">Remaining Balance Due at Visit:</span>
                <span style="font-weight: 800; color: #3D3D3D; font-size: 15px;">$${balanceRemaining}.00</span>
              </div>
            </div>
          </div>

          <!-- MIME Calendar Invite Attachment Notice -->
          <div style="background: #F4F8F3; border: 1.5px solid #4F6B4A; border-radius: 14px; padding: 14px 18px; margin-bottom: 22px;">
            <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px;">
              <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 22px;">📎</span>
                <div>
                  <div style="font-size: 13px; font-weight: 800; color: #3D3D3D;">
                    Attached: grooming-visit.ics
                  </div>
                  <div style="font-size: 11px; color: #4F6B4A; font-family: monospace; font-weight: 600;">
                    Content-Type: text/calendar; method=REQUEST; name=&quot;grooming-visit.ics&quot;
                  </div>
                </div>
              </div>
              <span style="background: #4F6B4A; color: #ffffff; font-size: 10px; font-weight: 800; padding: 4px 10px; border-radius: 8px; text-transform: uppercase;">
                MIME Calendar Event
              </span>
            </div>
            <p style="margin: 8px 0 0 0; font-size: 11px; color: #5C5C5C; line-height: 1.4;">
              Your email provider (Google Calendar, Outlook, Apple Mail) automatically detects this attachment to present an instant <strong>&quot;Add to Calendar / RSVP&quot;</strong> prompt directly in your inbox.
            </p>
          </div>

          <!-- Action Buttons -->
          <div style="margin-bottom: 24px; text-align: center;">
            <a href="${readinessUrl}" style="display: inline-block; background: #4F6B4A; color: #ffffff; text-decoration: none; padding: 13px 24px; border-radius: 12px; font-weight: 700; font-size: 13px; margin: 4px;">
              ✓ View Pre-Arrival Readiness Page
            </a>
            <a href="${calendarUrl}" target="_blank" style="display: inline-block; background: #F0EDE6; color: #3D3D3D; text-decoration: none; padding: 13px 20px; border-radius: 12px; font-weight: 700; font-size: 13px; border: 1px solid #D5CFBE; margin: 4px;">
              📅 Add to Google Calendar / .ics
            </a>
          </div>

          <p style="font-size: 12px; color: #888580; line-height: 1.5; margin: 0; text-align: center;">
            Sarah requires level driveway or curbside parking for her 24ft Sprinter spa van. See you soon!
          </p>
        </div>

        <!-- Footer -->
        <div style="background: #F0EDE6; padding: 16px 24px; text-align: center; font-size: 11px; color: #73706B; border-top: 1px solid #E5DFD5;">
          Paws & Routes Mobile Pet Spa · Austin, TX · Questions? Text Sarah: (512) 555-0100
        </div>
      </div>
    </body>
    </html>
  `;

  // 2. TRIGGER 2: SARAH'S DISPATCH ALERT EMAIL
  const sarahSubject = `🚨 New Booking Received: ${appointment.petName} (${appointment.petBreed}) in ${appointment.zone}`;
  const sarahHtml = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><title>${sarahSubject}</title></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #FAF7F2; padding: 24px; color: #3D3D3D; margin: 0;">
      <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 20px; border: 2px solid #4F6B4A; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.06);">
        <!-- Header -->
        <div style="background: #3D3D3D; padding: 24px; color: #ffffff;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="background: #E8A838; color: #3D3D3D; font-weight: 800; font-size: 11px; padding: 3px 10px; border-radius: 8px; text-transform: uppercase;">
              🚨 Real-Time Dispatch Alert
            </span>
            <span style="font-family: monospace; font-size: 12px; color: #FAF7F2;">${appointment.bookingId}</span>
          </div>
          <h1 style="margin: 12px 0 4px 0; font-size: 20px; font-weight: 800;">
            New Stop Confirmed: ${appointment.petName} (${appointment.petBreed})
          </h1>
          <p style="margin: 0; font-size: 13px; color: #D5CFBE;">
            ${appointment.date} · ${arrivalWindow} (${appointment.duration} mins)
          </p>
        </div>

        <!-- Body -->
        <div style="padding: 24px;">
          <!-- Route Physics Context -->
          <div style="background: #E7EFE5; border-radius: 12px; padding: 14px 18px; margin-bottom: 20px; border: 1px solid #A8BFA0;">
            <div style="font-size: 13px; font-weight: 700; color: #4F6B4A; margin-bottom: 2px;">
              🚗 Route Physics & Transit Calculation:
            </div>
            <div style="font-size: 12px; color: #3D3D3D;">
              Estimated transit: <strong>${driveTimeFromPrev} min drive</strong> ${
    prevAppointment ? `from previous stop in ${prevAppointment.zone} (${prevAppointment.customerName})` : 'from Central Austin Base (78704)'
  } + 10 min buffer.
            </div>
          </div>

          <!-- Customer Details -->
          <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 20px;">
            <tr>
              <td style="padding: 8px 0; color: #5C5C5C; width: 140px; border-bottom: 1px solid #F0EDE6;">Customer Name:</td>
              <td style="padding: 8px 0; font-weight: 700; color: #3D3D3D; border-bottom: 1px solid #F0EDE6;">${appointment.customerName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #5C5C5C; border-bottom: 1px solid #F0EDE6;">Phone Number:</td>
              <td style="padding: 8px 0; font-weight: 700; color: #4F6B4A; border-bottom: 1px solid #F0EDE6;">
                <a href="tel:${appointment.customerPhone}" style="color: #4F6B4A; text-decoration: none;">${appointment.customerPhone}</a>
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #5C5C5C; border-bottom: 1px solid #F0EDE6;">Full Address:</td>
              <td style="padding: 8px 0; font-weight: 700; color: #3D3D3D; border-bottom: 1px solid #F0EDE6;">
                ${appointment.address} (${appointment.zone})
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #5C5C5C; border-bottom: 1px solid #F0EDE6;">Assigned Schedule:</td>
              <td style="padding: 8px 0; font-weight: 700; color: #3D3D3D; border-bottom: 1px solid #F0EDE6;">
                ${appointment.date} at ${formatMinutesToTime(appointment.startTime)} (${appointment.duration} min duration)
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #5C5C5C; border-bottom: 1px solid #F0EDE6;">Service:</td>
              <td style="padding: 8px 0; font-weight: 700; color: #3D3D3D; border-bottom: 1px solid #F0EDE6;">
                ${serviceName} · ${sizeLabel} ($${appointment.price})
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #5C5C5C;">Financials:</td>
              <td style="padding: 8px 0; font-weight: 700; color: #4F6B4A;">
                $25 Deposit Collected · $${balanceRemaining} Due at Stop
              </td>
            </tr>
          </table>

          <!-- Direct Link to Sarah's Dispatch Hub -->
          <div style="text-align: center; margin-top: 10px;">
            <a href="${sarahDashboardUrl}" style="display: inline-block; background: #4F6B4A; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-weight: 800; font-size: 14px;">
              Open Sarah's Dispatch Hub (${appointment.date}) →
            </a>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  const clientEmailRecord: DispatchedEmail = {
    id: `email_client_${Date.now()}`,
    type: 'client_confirmation',
    to: appointment.customerEmail,
    from: 'Paws & Routes Mobile Grooming <hello@pawsandroutes.example>',
    subject: clientSubject,
    sentAt: nowIso,
    previewText: `Confirmed! Booking #${appointment.bookingId} for ${appointment.petName} on ${appointment.date}`,
    htmlBody: clientHtml,
    isDemoMode,
    mimeCalendarAttachment: calendarAttachment,
    headers: {
      'Content-Type': 'text/calendar; method=REQUEST; name="grooming-visit.ics"',
      'Content-Disposition': 'attachment; filename="grooming-visit.ics"',
    },
    metadata: {
      bookingId: appointment.bookingId,
      customerName: appointment.customerName,
      customerEmail: appointment.customerEmail,
      customerPhone: appointment.customerPhone,
      petName: appointment.petName,
      petBreed: appointment.petBreed,
      petSize: sizeLabel,
      serviceName,
      duration: appointment.duration,
      address: appointment.address,
      zone: appointment.zone,
      date: appointment.date,
      arrivalWindow,
      depositPaid: appointment.depositPaid,
      balanceRemaining,
      readinessUrl,
      calendarUrl,
      driveTimeFromPrev,
      sarahDashboardUrl,
      hasCalendarAttachment: true,
      calendarAttachmentFilename: 'grooming-visit.ics',
    },
    status: 'delivered',
  };

  const sarahEmailRecord: DispatchedEmail = {
    id: `email_sarah_${Date.now() + 1}`,
    type: 'sarah_dispatch_alert',
    to: 'hello@pawsandroutes.example',
    from: 'RouteLock Dispatcher <dispatcher@pawsandroutes.example>',
    subject: sarahSubject,
    sentAt: nowIso,
    previewText: `New Booking in ${appointment.zone}: ${appointment.petName} (${appointment.petBreed}) on ${appointment.date}`,
    htmlBody: sarahHtml,
    isDemoMode,
    metadata: {
      bookingId: appointment.bookingId,
      customerName: appointment.customerName,
      customerEmail: appointment.customerEmail,
      customerPhone: appointment.customerPhone,
      petName: appointment.petName,
      petBreed: appointment.petBreed,
      petSize: sizeLabel,
      serviceName,
      duration: appointment.duration,
      address: appointment.address,
      zone: appointment.zone,
      date: appointment.date,
      arrivalWindow,
      depositPaid: appointment.depositPaid,
      balanceRemaining,
      readinessUrl,
      calendarUrl,
      driveTimeFromPrev,
      sarahDashboardUrl,
    },
    status: 'delivered',
  };

  // 1. Store in local storage
  const existing = getStoredEmails();
  saveStoredEmails([clientEmailRecord, sarahEmailRecord, ...existing]);

  // 2. Set new booking alert in localStorage for Sarah's Dashboard
  memoryAlertStore = {
    petName: appointment.petName,
    bookingId: appointment.bookingId,
    date: appointment.date,
    timestamp: Date.now(),
    shown: false,
  };
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(
        ALERT_STORAGE_KEY,
        JSON.stringify(memoryAlertStore)
      );
    }
  } catch (err) {
    // Ignore
  }

  // 3. Emit browser event for immediate same-window reactivity
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('routelock:new_booking', {
        detail: {
          petName: appointment.petName,
          bookingId: appointment.bookingId,
          date: appointment.date,
        },
      })
    );
  }

  // 4. Client-side EmailJS integration if configured
  if (emailJsServiceId && emailJsTemplateId && emailJsPublicKey) {
    try {
      // Send client email via EmailJS API
      fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id: emailJsServiceId,
          template_id: emailJsTemplateId,
          user_id: emailJsPublicKey,
          template_params: {
            to_email: appointment.customerEmail,
            to_name: appointment.customerName,
            subject: clientSubject,
            pet_name: appointment.petName,
            booking_id: appointment.bookingId,
            service_name: serviceName,
            date: appointment.date,
            address: appointment.address,
            html_body: clientHtml,
            ical_attachment: calendarAttachment.base64,
            ical_filename: calendarAttachment.filename,
            content_type: calendarAttachment.contentType,
          },
        }),
      }).catch((e) => console.warn('EmailJS non-blocking dispatch note:', e));
    } catch (err) {
      console.warn('EmailJS execution caught:', err);
    }
  }

  // 5. Webhook backend relay if configured
  if (webhookUrl) {
    try {
      fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientEmail: clientEmailRecord,
          sarahEmail: sarahEmailRecord,
          appointment,
          mimeAttachment: calendarAttachment,
        }),
      }).catch((e) => console.warn('Email webhook non-blocking error:', e));
    } catch {
      // Non-blocking
    }
  }

  return {
    clientEmail: clientEmailRecord,
    sarahEmail: sarahEmailRecord,
    isDemoMode,
  };
}
