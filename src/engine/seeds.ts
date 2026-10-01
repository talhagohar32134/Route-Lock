import { Appointment } from '../types';
import { formatBookingId } from './scheduler';

export function getAnchorDate(dayOffset: number): string {
  // Automatically roll seed anchor dates on load so "Today" always reflects the current day in America/Chicago
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Chicago',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.formatToParts(now);
  const year = parts.find((p) => p.type === 'year')?.value || '2026';
  const month = parts.find((p) => p.type === 'month')?.value || '09';
  const day = parts.find((p) => p.type === 'day')?.value || '30';

  const base = new Date(`${year}-${month}-${day}T12:00:00Z`);
  base.setDate(base.getDate() + dayOffset);
  const outYear = base.getFullYear();
  const outMonth = String(base.getMonth() + 1).padStart(2, '0');
  const outDay = String(base.getDate()).padStart(2, '0');
  return `${outYear}-${outMonth}-${outDay}`;
}

export function createInitialSeedAppointments(): Appointment[] {
  // Fresh Start Mode: Clean schedule where bookings originate from actual user actions performed in session
  return [];
}

export function createDemoSeedAppointments(): Appointment[] {
  const day0 = getAnchorDate(0); // Today (Tuesday 2026-09-29)
  const day1 = getAnchorDate(1); // Wednesday 2026-09-30
  const day2 = getAnchorDate(2); // Thursday 2026-10-01
  const day3 = getAnchorDate(3); // Friday 2026-10-02
  const day4 = getAnchorDate(4); // Saturday 2026-10-03 (Full day)
  const day5 = getAnchorDate(5); // Sunday 2026-10-04
  const day6 = getAnchorDate(6); // Monday 2026-10-05

  return [
    // --- DAY 0: Today (3 appointments: Central, East, North) ---
    {
      id: 'appt_today_1',
      bookingId: formatBookingId(day0, 1),
      date: day0,
      startTime: 540, // 9:00 AM
      duration: 120, // 2 hours
      endTime: 660, // 11:00 AM
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
      status: 'completed',
      readiness: {
        petReady: true,
        gateUnlocked: true,
        parkingClear: true,
        confirmedAt: '2026-09-29T08:35:00Z',
      },
      notes: 'Loves head scratches, sensitive right ear.',
    },
    {
      id: 'appt_today_2',
      bookingId: formatBookingId(day0, 2),
      date: day0,
      startTime: 705, // 11:45 AM
      duration: 60, // 1 hour
      endTime: 765, // 12:45 PM
      customerName: 'Elena Rostova',
      customerPhone: '(512) 555-0189',
      customerEmail: 'elena.rostova@example.com',
      address: '1801 E 6th St, Austin, TX 78702',
      zone: 'East Austin',
      petSpecies: 'cat',
      petName: 'Luna',
      petBreed: 'Domestic Shorthair',
      petSize: 'small',
      serviceId: 'bath_tidy',
      price: 55,
      depositPaid: 25,
      status: 'in_progress',
      readiness: {
        petReady: true,
        gateUnlocked: true,
        parkingClear: true,
        confirmedAt: '2026-09-29T11:20:00Z',
      },
      notes: 'Indoor cat, keep van door fully latched.',
    },
    {
      id: 'appt_today_3',
      bookingId: formatBookingId(day0, 3),
      date: day0,
      startTime: 840, // 2:00 PM
      duration: 120, // 2 hours
      endTime: 960, // 4:00 PM
      customerName: 'Devon Patel',
      customerPhone: '(512) 555-0211',
      customerEmail: 'devon.patel@example.com',
      address: '11410 Century Oaks Terrace, Austin, TX 78758',
      zone: 'North Austin',
      petSpecies: 'dog',
      petName: 'Milo',
      petBreed: 'French Bulldog',
      petSize: 'small',
      serviceId: 'full_groom',
      price: 85,
      depositPaid: 25,
      status: 'pending_readiness',
      readiness: {
        petReady: false,
        gateUnlocked: false,
        parkingClear: true,
      },
      notes: 'Van can park directly on the driveway.',
    },

    // --- DAY 1: Tomorrow (Scenario A: South Austin cluster + one gap) ---
    {
      id: 'appt_day1_1',
      bookingId: formatBookingId(day1, 1),
      date: day1,
      startTime: 540, // 9:00 AM
      duration: 120,
      endTime: 660, // 11:00 AM
      customerName: 'Chloe Bennett',
      customerPhone: '(512) 555-0322',
      customerEmail: 'chloe.b@example.com',
      address: '2901 S Capital of Texas Hwy, Austin, TX 78746',
      zone: 'South Austin',
      petSpecies: 'dog',
      petName: 'Cooper',
      petBreed: 'Australian Shepherd',
      petSize: 'medium',
      serviceId: 'full_groom',
      price: 85,
      depositPaid: 25,
      status: 'confirmed',
      readiness: {
        petReady: true,
        gateUnlocked: true,
        parkingClear: true,
      },
      notes: 'Double coat, needs gentle deshedding.',
    },
    {
      id: 'appt_day1_2',
      bookingId: formatBookingId(day1, 2),
      date: day1,
      startTime: 840, // 2:00 PM
      duration: 75, // 60 min + 15 min Large
      endTime: 915, // 3:15 PM
      customerName: 'Samir Morales',
      customerPhone: '(512) 555-0455',
      customerEmail: 'samir.m@example.com',
      address: '5000 W Slaughter Ln, Austin, TX 78749',
      zone: 'South Austin',
      petSpecies: 'dog',
      petName: 'Rocky',
      petBreed: 'Labrador Retriever',
      petSize: 'large',
      serviceId: 'bath_tidy',
      price: 55,
      depositPaid: 25,
      status: 'confirmed',
      readiness: {
        petReady: false,
        gateUnlocked: false,
        parkingClear: false,
      },
    },

    // --- DAY 2: Thursday (Scenario B: South Austin finishing at 12:00 PM for Cedar Park travel test) ---
    {
      id: 'appt_day2_1',
      bookingId: formatBookingId(day2, 1),
      date: day2,
      startTime: 600, // 10:00 AM
      duration: 120,
      endTime: 720, // 12:00 PM
      customerName: 'Julian Sterling',
      customerPhone: '(512) 555-0612',
      customerEmail: 'julian.sterling@example.com',
      address: '5000 W Slaughter Ln, Austin, TX 78749',
      zone: 'South Austin',
      petSpecies: 'dog',
      petName: 'Daisy',
      petBreed: 'Labradoodle',
      petSize: 'medium',
      serviceId: 'full_groom',
      price: 85,
      depositPaid: 25,
      status: 'confirmed',
      readiness: {
        petReady: false,
        gateUnlocked: true,
        parkingClear: true,
      },
    },

    // --- DAY 3: Friday (North & East clusters + Filler 1 farFromRoute) ---
    {
      id: 'appt_day3_1',
      bookingId: formatBookingId(day3, 1),
      date: day3,
      startTime: 540, // 9:00 AM
      duration: 60,
      endTime: 600, // 10:00 AM
      customerName: 'Ashley Graham',
      customerPhone: '(512) 555-0720',
      customerEmail: 'ashley.g@example.com',
      address: '2400 W Parmer Ln, Austin, TX 78727',
      zone: 'North Austin',
      petSpecies: 'cat',
      petName: 'Oliver',
      petBreed: 'Maine Coon',
      petSize: 'small',
      serviceId: 'bath_tidy',
      price: 55,
      depositPaid: 25,
      status: 'confirmed',
      readiness: { petReady: true, gateUnlocked: true, parkingClear: true },
    },
    {
      id: 'filler_1',
      bookingId: formatBookingId(day3, 2),
      date: day3,
      startTime: 750, // 12:30 PM (plenty of time to get there)
      duration: 90,
      endTime: 840, // 2:00 PM
      customerName: 'Tyler Briggs',
      customerPhone: '(512) 555-0899',
      customerEmail: 'tyler.b@example.com',
      address: '7010 TX-71, Austin, TX 78735',
      zone: 'Oak Hill/West',
      petSpecies: 'dog',
      petName: 'Kona',
      petBreed: 'Bernese Mountain Dog',
      petSize: 'large',
      serviceId: 'puppy_first',
      price: 65,
      depositPaid: 25,
      status: 'confirmed',
      readiness: { petReady: false, gateUnlocked: true, parkingClear: true },
      farFromRoute: true, // drive from North Austin to Oak Hill is 35 mins!
    },

    // --- DAY 4: Saturday (Full Capacity constraint: 5 appointments = dailyCap) ---
    {
      id: 'appt_day4_1',
      bookingId: formatBookingId(day4, 1),
      date: day4,
      startTime: 510, // 8:30 AM
      duration: 90,
      endTime: 600, // 10:00 AM
      customerName: 'Rachel Kim',
      customerPhone: '(512) 555-0901',
      customerEmail: 'rachel.k@example.com',
      address: '1401 S Congress Ave, Austin, TX 78704',
      zone: 'Central Austin',
      petSpecies: 'dog',
      petName: 'Teddy',
      petBreed: 'Poodle (Toy)',
      petSize: 'small',
      serviceId: 'full_groom',
      price: 85,
      depositPaid: 25,
      status: 'confirmed',
      readiness: { petReady: true, gateUnlocked: true, parkingClear: true },
    },
    {
      id: 'appt_day4_2',
      bookingId: formatBookingId(day4, 2),
      date: day4,
      startTime: 620, // 10:20 AM
      duration: 60,
      endTime: 680, // 11:20 AM
      customerName: 'Liam O’Connor',
      customerPhone: '(512) 555-0902',
      customerEmail: 'liam.o@example.com',
      address: '411 W 8th St, Austin, TX 78701',
      zone: 'Central Austin',
      petSpecies: 'dog',
      petName: 'Charlie',
      petBreed: 'Beagle',
      petSize: 'medium',
      serviceId: 'bath_tidy',
      price: 55,
      depositPaid: 25,
      status: 'confirmed',
      readiness: { petReady: true, gateUnlocked: true, parkingClear: true },
    },
    {
      id: 'appt_day4_3',
      bookingId: formatBookingId(day4, 3),
      date: day4,
      startTime: 705, // 11:45 AM
      duration: 90,
      endTime: 795, // 1:15 PM
      customerName: 'Sofia Martinez',
      customerPhone: '(512) 555-0903',
      customerEmail: 'sofia.m@example.com',
      address: '1801 E 6th St, Austin, TX 78702',
      zone: 'East Austin',
      petSpecies: 'cat',
      petName: 'Cleo',
      petBreed: 'Persian',
      petSize: 'small',
      serviceId: 'full_groom',
      price: 85,
      depositPaid: 25,
      status: 'confirmed',
      readiness: { petReady: false, gateUnlocked: true, parkingClear: true },
    },
    {
      id: 'appt_day4_4',
      bookingId: formatBookingId(day4, 4),
      date: day4,
      startTime: 825, // 1:45 PM
      duration: 90,
      endTime: 915, // 3:15 PM
      customerName: 'Nathan Wu',
      customerPhone: '(512) 555-0904',
      customerEmail: 'nathan.w@example.com',
      address: '2100 E Cesar Chavez St, Austin, TX 78702',
      zone: 'East Austin',
      petSpecies: 'dog',
      petName: 'Buster',
      petBreed: 'Corgi',
      petSize: 'small',
      serviceId: 'bath_tidy',
      price: 55,
      depositPaid: 25,
      status: 'confirmed',
      readiness: { petReady: true, gateUnlocked: true, parkingClear: true },
    },
    {
      id: 'appt_day4_5',
      bookingId: formatBookingId(day4, 5),
      date: day4,
      startTime: 930, // 3:30 PM
      duration: 60,
      endTime: 990, // 4:30 PM
      customerName: 'Harper Wilson',
      customerPhone: '(512) 555-0905',
      customerEmail: 'harper.w@example.com',
      address: '1801 E 6th St, Austin, TX 78702',
      zone: 'East Austin',
      petSpecies: 'dog',
      petName: 'Jasper',
      petBreed: 'Pomeranian',
      petSize: 'small',
      serviceId: 'nail_teeth',
      price: 35,
      depositPaid: 25,
      status: 'confirmed',
      readiness: { petReady: false, gateUnlocked: false, parkingClear: true },
    },

    // --- DAY 5: Sunday (Round Rock & Cedar Park) ---
    {
      id: 'appt_day5_1',
      bookingId: formatBookingId(day5, 1),
      date: day5,
      startTime: 570, // 9:30 AM
      duration: 120,
      endTime: 690, // 11:30 AM
      customerName: 'Lucas Campbell',
      customerPhone: '(512) 555-1011',
      customerEmail: 'lucas.c@example.com',
      address: '201 E Main St, Round Rock, TX 78664',
      zone: 'Round Rock',
      petSpecies: 'dog',
      petName: 'Finn',
      petBreed: 'Australian Shepherd',
      petSize: 'medium',
      serviceId: 'full_groom',
      price: 85,
      depositPaid: 25,
      status: 'confirmed',
      readiness: { petReady: true, gateUnlocked: true, parkingClear: true },
    },
    {
      id: 'appt_day5_2',
      bookingId: formatBookingId(day5, 2),
      date: day5,
      startTime: 750, // 12:30 PM
      duration: 60,
      endTime: 810, // 1:30 PM
      customerName: 'Hannah Abbott',
      customerPhone: '(512) 555-1012',
      customerEmail: 'hannah.a@example.com',
      address: '1101 N Bell Blvd, Cedar Park, TX 78613',
      zone: 'Cedar Park',
      petSpecies: 'cat',
      petName: 'Simba',
      petBreed: 'Bengal',
      petSize: 'small',
      serviceId: 'bath_tidy',
      price: 55,
      depositPaid: 25,
      status: 'confirmed',
      readiness: { petReady: false, gateUnlocked: true, parkingClear: true },
    },

    // --- DAY 6: Monday (Central & North Austin) ---
    {
      id: 'appt_day6_1',
      bookingId: formatBookingId(day6, 1),
      date: day6,
      startTime: 540, // 9:00 AM
      duration: 120,
      endTime: 660, // 11:00 AM
      customerName: 'Zoe Kravitz',
      customerPhone: '(512) 555-1120',
      customerEmail: 'zoe.k@example.com',
      address: '1401 S Congress Ave, Austin, TX 78704',
      zone: 'Central Austin',
      petSpecies: 'dog',
      petName: 'Penny',
      petBreed: 'Shih Tzu',
      petSize: 'small',
      serviceId: 'full_groom',
      price: 85,
      depositPaid: 25,
      status: 'confirmed',
      readiness: { petReady: true, gateUnlocked: true, parkingClear: true },
    },
    {
      id: 'appt_day6_2',
      bookingId: formatBookingId(day6, 2),
      date: day6,
      startTime: 720, // 12:00 PM
      duration: 60,
      endTime: 780, // 1:00 PM
      customerName: 'Victor Cruz',
      customerPhone: '(512) 555-1122',
      customerEmail: 'victor.c@example.com',
      address: '2400 W Parmer Ln, Austin, TX 78727',
      zone: 'North Austin',
      petSpecies: 'dog',
      petName: 'Max',
      petBreed: 'German Shepherd',
      petSize: 'large',
      serviceId: 'bath_tidy',
      price: 55,
      depositPaid: 25,
      status: 'confirmed',
      readiness: { petReady: false, gateUnlocked: true, parkingClear: true },
    },
  ];
}
