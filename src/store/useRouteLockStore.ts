import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Appointment, PetSize, PetSpecies, SchedulerSettings, ServiceId, SlotCandidate, ZoneId } from '../types';
import { DEFAULT_SETTINGS, formatBookingId, calculateDuration } from '../engine/scheduler';
import { SERVICES } from '../engine/constants';
import { createInitialSeedAppointments, createDemoSeedAppointments, getAnchorDate } from '../engine/seeds';

export interface BookingDraft {
  step: number;
  petSpecies: PetSpecies;
  petName: string;
  petBreed: string;
  petSize: PetSize;
  serviceId: ServiceId;
  notes: string;
  address: string;
  zone: ZoneId | null;
  zip: string;
  selectedDate: string;
  selectedSlot: SlotCandidate | null;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  cardNumber: string;
  cardExpiry: string;
  cardCvc: string;
  cardZip: string;
  confirmedBooking: Appointment | null;
}

export interface UndoToastState {
  appointment: Appointment;
  expiresAt: number;
}

interface RouteLockState {
  appointments: Appointment[];
  settings: SchedulerSettings;
  bookingDraft: BookingDraft;
  undoToast: UndoToastState | null;
  isGroomerAuthenticated: boolean;
  isSarahAuthenticated: boolean;

  // Actions
  authenticateGroomer: (pin: string) => boolean;
  logoutGroomer: () => void;
  authenticateSarah: (pin: string) => boolean;
  logoutSarah: () => void;
  setBookingDraft: (draft: Partial<BookingDraft>) => void;
  setStep: (step: number) => void;
  resetBookingDraft: () => void;
  confirmBooking: () => Appointment | null;
  updateReadiness: (
    appointmentId: string,
    check: 'petReady' | 'gateUnlocked' | 'parkingClear',
    value: boolean
  ) => void;
  finalizeReadiness: (appointmentId: string) => void;
  releaseAppointment: (appointmentId: string) => void;
  undoRelease: () => void;
  dismissUndoToast: () => void;
  updateSettings: (settings: Partial<SchedulerSettings>) => void;
  toggleZone: (zone: ZoneId) => void;
  resetToSeeds: () => void;
  loadDemoSchedule: () => void;
  clearAllAppointments: () => void;
  addManualBooking: (appointment: Appointment) => void;
  updateAppointmentStatus: (appointmentId: string, status: Appointment['status']) => void;
}

const initialDraft: BookingDraft = {
  step: 1,
  petSpecies: 'dog',
  petName: '',
  petBreed: '',
  petSize: 'medium',
  serviceId: 'full_groom',
  notes: '',
  address: '',
  zone: null,
  zip: '',
  selectedDate: getAnchorDate(1), // default tomorrow
  selectedSlot: null,
  customerName: '',
  customerPhone: '',
  customerEmail: '',
  cardNumber: '',
  cardExpiry: '',
  cardCvc: '',
  cardZip: '',
  confirmedBooking: null,
};

export const useRouteLockStore = create<RouteLockState>()(
  persist(
    (set, get) => ({
      appointments: createInitialSeedAppointments(),
      settings: DEFAULT_SETTINGS,
      bookingDraft: initialDraft,
      undoToast: null,
      isGroomerAuthenticated: false,
      isSarahAuthenticated: false,

      authenticateGroomer: (pin: string) => {
        if (pin.trim() === '1234' || pin.trim().toLowerCase() === 'sarah') {
          set({ isGroomerAuthenticated: true, isSarahAuthenticated: true });
          return true;
        }
        return false;
      },

      logoutGroomer: () => {
        set({ isGroomerAuthenticated: false, isSarahAuthenticated: false });
      },

      authenticateSarah: (pin: string) => {
        // Sarah's private groomer PIN (default '1234' or 'sarah')
        if (pin.trim() === '1234' || pin.trim().toLowerCase() === 'sarah') {
          set({ isGroomerAuthenticated: true, isSarahAuthenticated: true });
          return true;
        }
        return false;
      },

      logoutSarah: () => {
        set({ isGroomerAuthenticated: false, isSarahAuthenticated: false });
      },

      setBookingDraft: (partial) => {
        set((state) => ({
          bookingDraft: {
            ...state.bookingDraft,
            ...partial,
          },
        }));
      },

      setStep: (step) => {
        set((state) => ({
          bookingDraft: {
            ...state.bookingDraft,
            step,
          },
        }));
      },

      resetBookingDraft: () => {
        set({
          bookingDraft: {
            ...initialDraft,
            selectedDate: getAnchorDate(1),
          },
        });
      },

      confirmBooking: () => {
        const { bookingDraft, appointments } = get();
        if (!bookingDraft.selectedSlot || !bookingDraft.zone) {
          return null;
        }

        const date = bookingDraft.selectedDate;
        const dayAppointments = appointments.filter((a) => a.date === date);
        const seq = dayAppointments.length + 1;
        const bookingId = formatBookingId(date, seq);

        const duration = calculateDuration(bookingDraft.serviceId, bookingDraft.petSize);
        const service = SERVICES[bookingDraft.serviceId];
        const price = service ? service.price : 85;

        const newAppointment: Appointment = {
          id: `appt_${Date.now()}`,
          bookingId,
          date,
          startTime: bookingDraft.selectedSlot.startTime,
          duration,
          endTime: bookingDraft.selectedSlot.startTime + duration,
          customerName: bookingDraft.customerName || 'Customer',
          customerPhone: bookingDraft.customerPhone || '(512) 555-0100',
          customerEmail: bookingDraft.customerEmail || 'client@example.com',
          address: bookingDraft.address,
          zone: bookingDraft.zone,
          petSpecies: bookingDraft.petSpecies,
          petName: bookingDraft.petName || 'My Pet',
          petBreed: bookingDraft.petBreed || 'Mixed Breed',
          petSize: bookingDraft.petSize,
          serviceId: bookingDraft.serviceId,
          price,
          depositPaid: 25,
          status: 'confirmed',
          readiness: {
            petReady: false,
            gateUnlocked: false,
            parkingClear: false,
          },
          notes: bookingDraft.notes,
        };

        const updated = [...appointments, newAppointment].sort((a, b) => {
          if (a.date !== b.date) return a.date.localeCompare(b.date);
          return a.startTime - b.startTime;
        });

        set((state) => ({
          appointments: updated,
          bookingDraft: {
            ...state.bookingDraft,
            step: 5,
            confirmedBooking: newAppointment,
          },
        }));

        return newAppointment;
      },

      updateReadiness: (appointmentId, check, value) => {
        set((state) => ({
          appointments: state.appointments.map((a) => {
            if (a.id !== appointmentId) return a;
            return {
              ...a,
              readiness: {
                ...a.readiness,
                [check]: value,
              },
            };
          }),
          bookingDraft:
            state.bookingDraft.confirmedBooking?.id === appointmentId
              ? {
                  ...state.bookingDraft,
                  confirmedBooking: {
                    ...state.bookingDraft.confirmedBooking,
                    readiness: {
                      ...state.bookingDraft.confirmedBooking.readiness,
                      [check]: value,
                    },
                  },
                }
              : state.bookingDraft,
        }));
      },

      finalizeReadiness: (appointmentId) => {
        const nowIso = new Date().toISOString();
        set((state) => ({
          appointments: state.appointments.map((a) => {
            if (a.id !== appointmentId) return a;
            return {
              ...a,
              status: 'confirmed',
              readiness: {
                ...a.readiness,
                confirmedAt: nowIso,
              },
            };
          }),
          bookingDraft:
            state.bookingDraft.confirmedBooking?.id === appointmentId
              ? {
                  ...state.bookingDraft,
                  confirmedBooking: {
                    ...state.bookingDraft.confirmedBooking,
                    status: 'confirmed',
                    readiness: {
                      ...state.bookingDraft.confirmedBooking.readiness,
                      confirmedAt: nowIso,
                    },
                  },
                }
              : state.bookingDraft,
        }));
      },

      releaseAppointment: (appointmentId) => {
        const { appointments } = get();
        const target = appointments.find((a) => a.id === appointmentId);
        if (!target) return;

        const updated = appointments.filter((a) => a.id !== appointmentId);
        set({
          appointments: updated,
          undoToast: {
            appointment: target,
            expiresAt: Date.now() + 8000,
          },
        });
      },

      undoRelease: () => {
        const { undoToast, appointments } = get();
        if (!undoToast) return;

        const restored = undoToast.appointment;
        const updated = [...appointments, restored].sort((a, b) => {
          if (a.date !== b.date) return a.date.localeCompare(b.date);
          return a.startTime - b.startTime;
        });

        set({
          appointments: updated,
          undoToast: null,
        });
      },

      dismissUndoToast: () => {
        set({ undoToast: null });
      },

      updateSettings: (partial) => {
        set((state) => ({
          settings: {
            ...state.settings,
            ...partial,
          },
        }));
      },

      toggleZone: (zone) => {
        set((state) => ({
          settings: {
            ...state.settings,
            enabledZones: {
              ...state.settings.enabledZones,
              [zone]: !state.settings.enabledZones[zone],
            },
          },
        }));
      },

      resetToSeeds: () => {
        set({
          appointments: [],
          settings: DEFAULT_SETTINGS,
          undoToast: null,
        });
      },

      clearAllAppointments: () => {
        set({
          appointments: [],
          undoToast: null,
        });
      },

      loadDemoSchedule: () => {
        set({
          appointments: createDemoSeedAppointments(),
          settings: DEFAULT_SETTINGS,
          undoToast: null,
        });
      },

      addManualBooking: (appointment: Appointment) => {
        set((state) => ({
          appointments: [...state.appointments, appointment].sort((a, b) => {
            if (a.date !== b.date) return a.date.localeCompare(b.date);
            return a.startTime - b.startTime;
          }),
        }));
      },

      updateAppointmentStatus: (appointmentId, status) => {
        set((state) => ({
          appointments: state.appointments.map((a) =>
            a.id === appointmentId ? { ...a, status } : a
          ),
        }));
      },
    }),
    {
      name: 'routelock:v1',
      partialize: (state) => ({
        appointments: state.appointments,
        settings: state.settings,
      }),
    }
  )
);
