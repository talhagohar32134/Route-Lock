import { describe, expect, it } from 'vitest';
import { Appointment } from '../types';
import {
  DEFAULT_SETTINGS,
  evaluateSlotsForDate,
  calculateDailyStats,
  formatBookingId,
  generateIcsCalendar,
  generateGoogleCalendarUrl,
  generateDayMasterIcs,
  getDriveTime,
  isFarFromRoute,
} from './scheduler';
import { createDemoSeedAppointments, getAnchorDate } from './seeds';

describe('RouteLock Scheduling Engine Test Suite', () => {
  const seeds = createDemoSeedAppointments();

  // Test 1: Scenario A South Austin slot checks
  it('1. Scenario A South Austin slot checks', () => {
    const day1 = getAnchorDate(1);
    // On Day 1, Cooper's appointment in South Austin is 9:00 AM - 11:00 AM.
    // Evaluate slot for 60 min service at 11:30 AM in South Austin.
    const resultSouth = evaluateSlotsForDate(day1, 'South Austin', 60, seeds, DEFAULT_SETTINGS);
    const slotSouth1130 = resultSouth.allSlots.find((s) => s.startTime === 690); // 11:30 AM
    expect(slotSouth1130).toBeDefined();
    expect(slotSouth1130?.available).toBe(true);

    // However, for Round Rock at 11:30 AM, drive from South Austin is 40m + 10m buffer = 50m.
    // Earliest arrival is 11:50 AM > 11:30 AM. Rule A must fail!
    const resultRoundRock = evaluateSlotsForDate(day1, 'Round Rock', 60, seeds, DEFAULT_SETTINGS);
    const slotRR1130 = resultRoundRock.allSlots.find((s) => s.startTime === 690);
    expect(slotRR1130).toBeDefined();
    expect(slotRR1130?.available).toBe(false);
    expect(slotRR1130?.failedRule).toBe('A');
    expect(slotRR1130?.minutesLate).toBe(20);
  });

  // Test 2: Scenario B Cedar Park travel constraints
  it('2. Scenario B Cedar Park travel constraints', () => {
    const day2 = getAnchorDate(2);
    // On Day 2, appointment ends at 12:00 PM (720 min) in South Austin.
    // Drive from South Austin to Cedar Park is 40 min + 10 min buffer = 50 min.
    // A candidate at 12:30 PM (750 min) would need arrival at 770 min (12:50 PM), which is 20 min late.
    const result = evaluateSlotsForDate(day2, 'Cedar Park', 60, seeds, DEFAULT_SETTINGS);
    const slot1230 = result.allSlots.find((s) => s.startTime === 750);
    expect(slot1230).toBeDefined();
    expect(slot1230?.available).toBe(false);
    expect(slot1230?.failedRule).toBe('A');
    expect(slot1230?.minutesLate).toBe(20);
    expect(slot1230?.blockedReason).toContain('Cedar Park');
  });

  // Test 3: Saturday capacity constraints
  it('3. Saturday capacity constraints', () => {
    const day4 = getAnchorDate(4); // Saturday
    const satAppointments = seeds.filter((a) => a.date === day4);
    expect(satAppointments.length).toBe(5); // dailyCap is 5

    const result = evaluateSlotsForDate(day4, 'Central Austin', 60, seeds, DEFAULT_SETTINGS);
    expect(result.isDayFull).toBe(true);
    expect(result.availableSlots.length).toBe(0);
    expect(result.allSlots.every((s) => s.failedRule === 'D' || !s.available)).toBe(true);
  });

  // Test 4: Today's seed revenue/drive/idle/saved calculations
  it("4. Today's seed revenue/drive/idle/saved calculations", () => {
    const day0 = getAnchorDate(0);
    const stats = calculateDailyStats(day0, seeds, DEFAULT_SETTINGS);

    // Revenue: Bailey (85) + Luna (55) + Milo (85) = 225
    expect(stats.revenue).toBe(225);
    // Drive: Home->Central (10) + Central->East (12) + East->North (20) + North->Home (18) = 60
    expect(stats.driveTimeMin).toBe(60);
    // Idle: (705-660)-(12+10) = 23; (840-765)-(20+10) = 45; total = 68
    expect(stats.idleTimeMin).toBe(68);
    // Saved: 4 legs * 32 = 128 - 60 = 68 min
    expect(stats.savedMinutes).toBe(68);
    expect(stats.totalCount).toBe(3);
  });

  // Test 5: Validation of all seeded days across 7 weekday anchors
  it('5. Validation of all seeded days across 7 weekday anchors', () => {
    for (let offset = 0; offset < 7; offset++) {
      const dateStr = getAnchorDate(offset);
      const dayAppts = seeds.filter((a) => a.date === dateStr);
      expect(dayAppts.length).toBeGreaterThan(0);

      // Verify structure and chronological ordering
      for (let i = 0; i < dayAppts.length; i++) {
        const appt = dayAppts[i];
        expect(appt.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(appt.bookingId).toMatch(/^RL-\d{6}-\d{3}$/);
        expect(appt.startTime).toBeLessThan(appt.endTime);
        expect(appt.duration).toBe(appt.endTime - appt.startTime);
        expect(appt.zone).toBeDefined();

        if (i < dayAppts.length - 1) {
          const next = dayAppts[i + 1];
          expect(appt.endTime).toBeLessThanOrEqual(next.startTime);
        }
      }
    }
  });

  // Test 6: Filler 1 farFromRoute flag check
  it('6. Filler 1 farFromRoute flag check', () => {
    const filler = seeds.find((a) => a.id === 'filler_1');
    expect(filler).toBeDefined();
    expect(filler?.farFromRoute).toBe(true);

    // Check distance between North Austin and Oak Hill/West
    const drive = getDriveTime('North Austin', 'Oak Hill/West');
    expect(drive).toBe(35);
    expect(isFarFromRoute('Oak Hill/West', 'North Austin')).toBe(true);
  });

  // Test 7: Route efficiency changes when filling idle gaps
  it('7. Route efficiency changes when filling idle gaps', () => {
    const day0 = getAnchorDate(0);
    const beforeStats = calculateDailyStats(day0, seeds, DEFAULT_SETTINGS);

    // Create a new appointment filling part of the afternoon idle gap (e.g. 1:00 PM to 1:45 PM in East Austin)
    const gapFiller: Appointment = {
      id: 'test_gap_filler',
      bookingId: 'RL-260929-099',
      date: day0,
      startTime: 780, // 1:00 PM (Appt 2 ended at 12:45 PM in East Austin)
      duration: 45,
      endTime: 825, // 1:45 PM (Appt 3 starts at 2:00 PM in North Austin)
      customerName: 'Gap Filler Customer',
      customerPhone: '(512) 555-9999',
      customerEmail: 'filler@example.com',
      address: '2100 E Cesar Chavez St, Austin, TX 78702',
      zone: 'East Austin',
      petSpecies: 'dog',
      petName: 'Rusty',
      petBreed: 'Beagle',
      petSize: 'small',
      serviceId: 'nail_teeth',
      price: 35,
      depositPaid: 25,
      status: 'confirmed',
      readiness: { petReady: true, gateUnlocked: true, parkingClear: true },
    };

    const afterAppts = [...seeds, gapFiller];
    const afterStats = calculateDailyStats(day0, afterAppts, DEFAULT_SETTINGS);

    // Idle time should decrease because formerly wasted gap is now productive service time
    expect(afterStats.idleTimeMin).toBeLessThan(beforeStats.idleTimeMin);
    expect(afterStats.revenue).toBe(beforeStats.revenue + 35);
    expect(afterStats.efficiencyScore).toBeGreaterThan(beforeStats.efficiencyScore);
  });

  // Test 8: 8:30 AM candidate first-job rule verification
  it('8. 8:30 AM candidate first-job rule verification', () => {
    // Empty day or day with only afternoon jobs
    const testDate = '2026-10-15';
    const afternoonJob: Appointment = {
      id: 'test_afternoon',
      bookingId: 'RL-261015-001',
      date: testDate,
      startTime: 840, // 2:00 PM
      duration: 60,
      endTime: 900,
      customerName: 'Afternoon User',
      customerPhone: '(512) 555-0000',
      customerEmail: 'user@example.com',
      address: '1401 S Congress Ave, Austin, TX 78704',
      zone: 'Central Austin',
      petSpecies: 'dog',
      petName: 'Buddy',
      petBreed: 'Golden Retriever',
      petSize: 'medium',
      serviceId: 'bath_tidy',
      price: 55,
      depositPaid: 25,
      status: 'confirmed',
      readiness: { petReady: true, gateUnlocked: true, parkingClear: true },
    };

    const result = evaluateSlotsForDate(testDate, 'South Austin', 60, [afternoonJob], DEFAULT_SETTINGS);
    const firstJobCandidate = result.allSlots.find((s) => s.startTime === 510); // 8:30 AM
    expect(firstJobCandidate).toBeDefined();
    // Rule A passes for first job from Central home base
    expect(firstJobCandidate?.available).toBe(true);
    expect(firstJobCandidate?.failedRule).toBeUndefined();
  });

  // Test 9: Release slot and undo state restoration
  it('9. Release slot and undo state restoration', () => {
    let appointments = [...seeds];
    const targetToRelease = appointments.find((a) => a.id === 'appt_today_3')!;
    expect(targetToRelease).toBeDefined();

    // Release action
    const undoStack: Appointment[] = [];
    undoStack.push(targetToRelease);
    appointments = appointments.filter((a) => a.id !== targetToRelease.id);

    expect(appointments.some((a) => a.id === 'appt_today_3')).toBe(false);

    // Undo action (restore)
    const restored = undoStack.pop();
    if (restored) {
      appointments.push(restored);
      appointments.sort((a, b) => a.startTime - b.startTime);
    }

    expect(appointments.some((a) => a.id === 'appt_today_3')).toBe(true);
    const restoredAppt = appointments.find((a) => a.id === 'appt_today_3');
    expect(restoredAppt?.customerName).toBe(targetToRelease.customerName);
  });

  // Test 10: Booking ID formatting (RL-YYMMDD-NNN)
  it('10. Booking ID formatting (RL-YYMMDD-NNN)', () => {
    const id1 = formatBookingId('2026-09-29', 1);
    expect(id1).toBe('RL-260929-001');
    expect(id1).toMatch(/^RL-\d{6}-\d{3}$/);

    const id42 = formatBookingId('2026-12-05', 42);
    expect(id42).toBe('RL-261205-042');

    const id999 = formatBookingId('2027-01-01', 999);
    expect(id999).toBe('RL-270101-999');
  });

  // Test 11: Valid .ics calendar file generation with VTIMEZONE and CRLF line endings
  it('11. Valid .ics calendar file generation with VTIMEZONE and CRLF line endings', () => {
    const sampleAppt = seeds[0];
    const icsContent = generateIcsCalendar(sampleAppt);

    expect(icsContent).toContain('BEGIN:VCALENDAR');
    expect(icsContent).toContain('VERSION:2.0');
    expect(icsContent).toContain('BEGIN:VTIMEZONE');
    expect(icsContent).toContain('TZID:America/Chicago');
    expect(icsContent).toContain('BEGIN:VEVENT');
    expect(icsContent).toContain(`UID:${sampleAppt.bookingId}@pawsandroutes.com`);
    expect(icsContent).toContain(`SUMMARY:Dog grooming for ${sampleAppt.petName} with Paws & Routes`);
    expect(icsContent).toContain('BEGIN:VALARM');
    expect(icsContent).toContain('TRIGGER:-P1D');
    expect(icsContent).toContain('TRIGGER:-PT1H');
    expect(icsContent).toContain('END:VEVENT');
    expect(icsContent).toContain('END:VCALENDAR');

    // Verify strict CRLF line endings
    expect(icsContent.includes('\r\n')).toBe(true);
    // Ensure every line ends with \r\n and there are no lone \n without \r
    const lines = icsContent.split('\r\n');
    expect(lines.length).toBeGreaterThan(10);
    // Check that none of the lines contain unescaped \n
    lines.forEach((line) => {
      expect(line.includes('\n')).toBe(false);
      expect(line.includes('\r')).toBe(false);
    });
  });

  // Test 12: Dynamic Duration Locking & Full-Day 30-min candidate start slots
  it('12. Dynamic Duration Locking & Full-Day 30-min candidate start slots', () => {
    const testDate = '2026-10-20';
    // 3:00 PM appointment with 90 min duration (ends at 4:30 PM) in South Austin
    const appt3PM: Appointment = {
      id: 'appt_3pm_test',
      bookingId: 'RL-261020-003',
      date: testDate,
      startTime: 900, // 3:00 PM
      duration: 90,
      endTime: 990, // 4:30 PM
      customerName: 'Oliver Smith',
      customerPhone: '(512) 555-3333',
      customerEmail: 'oliver@example.com',
      address: '2400 S Congress Ave, Austin, TX 78704',
      zone: 'South Austin',
      petSpecies: 'dog',
      petName: 'Rusty',
      petBreed: 'Labrador',
      petSize: 'large',
      serviceId: 'full_groom',
      price: 95,
      depositPaid: 25,
      status: 'confirmed',
      readiness: { petReady: true, gateUnlocked: true, parkingClear: true },
    };

    // Evaluate for 60 min service in Central Austin
    // South Austin <-> Central Austin drive time = 15m. Buffer = 10m. Route buffer = 25m.
    // Lock window: [900 - 25 = 875 (2:35 PM)] to [990 + 25 = 1015 (4:55 PM)].
    const evalResult = evaluateSlotsForDate(testDate, 'Central Austin', 60, [appt3PM], DEFAULT_SETTINGS);

    // Verify 30-min candidate start slots are generated across Sarah's working hours
    const allStartTimes = evalResult.allSlots.map((s) => s.startTime);
    expect(allStartTimes).toContain(510); // 8:30 AM
    expect(allStartTimes).toContain(540); // 9:00 AM
    expect(allStartTimes).toContain(690); // 11:30 AM
    expect(allStartTimes).toContain(840); // 2:00 PM
    expect(allStartTimes).toContain(900); // 3:00 PM
    expect(allStartTimes).toContain(990); // 4:30 PM
    expect(allStartTimes).toContain(1020); // 5:00 PM

    // 2:00 PM (ends at 3:00 PM > 875): leaves 0m drive time -> locked (Rule B)
    const slot200 = evalResult.allSlots.find((s) => s.startTime === 840);
    expect(slot200?.available).toBe(false);

    // 2:30 PM (ends at 3:30 PM > 875): overlaps buffer -> locked
    const slot230 = evalResult.allSlots.find((s) => s.startTime === 870);
    expect(slot230?.available).toBe(false);

    // 3:00 PM (starts 900, ends 960): direct overlap -> locked
    const slot300 = evalResult.allSlots.find((s) => s.startTime === 900);
    expect(slot300?.available).toBe(false);

    // 4:30 PM (starts 990 < 1015): needs until 4:55 PM to clean/travel -> locked (Rule A)
    const slot430 = evalResult.allSlots.find((s) => s.startTime === 990);
    expect(slot430?.available).toBe(false);

    // 5:00 PM (starts 1020 >= 1015, ends 1080 <= 1080): after travel buffer -> OPEN!
    const slot500 = evalResult.allSlots.find((s) => s.startTime === 1020);
    expect(slot500?.available).toBe(true);

    // Available slots must EXCLUDE all locked windows
    const availStarts = evalResult.availableSlots.map((s) => s.startTime);
    expect(availStarts).not.toContain(840);
    expect(availStarts).not.toContain(870);
    expect(availStarts).not.toContain(900);
    expect(availStarts).not.toContain(930);
    expect(availStarts).not.toContain(960);
    expect(availStarts).not.toContain(990);
    expect(availStarts).toContain(1020); // 5:00 PM is available
  });

  // Test 13: Google Calendar URL generation
  it('13. Google Calendar URL generation', () => {
    const sampleAppt = seeds[0];
    const url = generateGoogleCalendarUrl(sampleAppt);
    expect(url).toContain('https://calendar.google.com/calendar/render');
    expect(url).toContain('action=TEMPLATE');
    expect(url).toContain('ctz=America%2FChicago');
    expect(url).toContain('Bailey');
  });

  // Test 14: Sarah\'s Master Day Itinerary .ics generation with driving notes
  it('14. Sarah\'s Master Day Itinerary .ics generation with driving notes', () => {
    const day0 = getAnchorDate(0);
    const dayAppts = seeds.filter((a) => a.date === day0);
    const masterIcs = generateDayMasterIcs(day0, dayAppts);

    expect(masterIcs).toContain('BEGIN:VCALENDAR');
    expect(masterIcs).toContain('TZID:America/Chicago');
    expect(masterIcs).toContain('Google Maps Navigation:');
    expect(masterIcs).toContain('END:VCALENDAR');
    expect(masterIcs.includes('\r\n')).toBe(true);
  });

  // Test 15: Automated Dual Email Notifications (Client Confirmation & Sarah Alert)
  it('15. Automated Dual Email Notifications (Client Confirmation & Sarah Alert)', async () => {
    const { dispatchBookingEmails, getStoredEmails } = await import('../services/emailNotificationService');
    const sampleAppt = seeds[0];
    const prevAppt = seeds[1];

    const result = await dispatchBookingEmails(sampleAppt, prevAppt);

    // Verify Client Confirmation Email
    expect(result.clientEmail).toBeDefined();
    expect(result.clientEmail.to).toBe(sampleAppt.customerEmail);
    expect(result.clientEmail.subject).toBe(`Your Grooming Visit is Confirmed! 🐾 - Booking #${sampleAppt.bookingId}`);
    expect(result.clientEmail.htmlBody).toContain('View Pre-Arrival Readiness Page');
    expect(result.clientEmail.htmlBody).toContain('Add to Google Calendar');
    expect(result.clientEmail.htmlBody).toContain(`$${sampleAppt.depositPaid}.00`);

    // Verify MIME Calendar Attachment (method=REQUEST)
    expect(result.clientEmail.mimeCalendarAttachment).toBeDefined();
    expect(result.clientEmail.mimeCalendarAttachment?.filename).toBe('grooming-visit.ics');
    expect(result.clientEmail.mimeCalendarAttachment?.contentType).toContain('text/calendar; method=REQUEST');
    expect(result.clientEmail.mimeCalendarAttachment?.content).toContain('METHOD:REQUEST');
    expect(result.clientEmail.mimeCalendarAttachment?.content).toContain('ATTENDEE;');
    expect(result.clientEmail.mimeCalendarAttachment?.content).toContain('ORGANIZER;');

    // Verify Sarah's Dispatch Alert Email
    expect(result.sarahEmail).toBeDefined();
    expect(result.sarahEmail.to).toBe('hello@pawsandroutes.example');
    expect(result.sarahEmail.subject).toBe(
      `🚨 New Booking Received: ${sampleAppt.petName} (${sampleAppt.petBreed}) in ${sampleAppt.zone}`
    );
    expect(result.sarahEmail.htmlBody).toContain('Route Physics & Transit Calculation:');
    expect(result.sarahEmail.htmlBody).toContain("Open Sarah's Dispatch Hub");

    // Verify localStorage storage
    const stored = getStoredEmails();
    expect(stored.length).toBeGreaterThanOrEqual(2);
  });
});
