export type ZoneId =
  | 'North Austin'
  | 'Cedar Park'
  | 'Round Rock'
  | 'Central Austin'
  | 'East Austin'
  | 'South Austin'
  | 'Oak Hill/West';

export type PetSpecies = 'dog' | 'cat';

export type PetSize = 'small' | 'medium' | 'large' | 'xl';

export type ServiceId = 'full_groom' | 'bath_tidy' | 'nail_teeth' | 'puppy_first';

export interface ServiceDefinition {
  id: ServiceId;
  name: string;
  description: string;
  baseDurationMin: number;
  price: number;
  features: string[];
}

export interface SizeDefinition {
  id: PetSize;
  label: string;
  weightDesc: string;
  extraDurationMin: number;
}

export interface Appointment {
  id: string;
  bookingId: string; // e.g. RL-260929-001
  date: string; // YYYY-MM-DD
  startTime: number; // minutes from midnight
  duration: number; // minutes
  endTime: number; // minutes from midnight
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  address: string;
  zone: ZoneId;
  petSpecies: PetSpecies;
  petName: string;
  petBreed: string;
  petSize: PetSize;
  serviceId: ServiceId;
  price: number;
  depositPaid: number;
  status: 'confirmed' | 'pending_readiness' | 'in_progress' | 'completed' | 'cancelled';
  readiness: {
    petReady: boolean;
    gateUnlocked: boolean;
    parkingClear: boolean;
    confirmedAt?: string;
  };
  notes?: string;
  farFromRoute?: boolean;
}

export interface SlotCandidate {
  startTime: number;
  endTime: number;
  formattedTime: string;
  available: boolean;
  blockedReason?: string;
  minutesLate?: number;
  failedRule?: 'A' | 'B' | 'C' | 'D' | 'OVERLAP';
  prevJob?: {
    customerName: string;
    address: string;
    zone: ZoneId;
    endTime: number;
  };
  nextJob?: {
    customerName: string;
    address: string;
    zone: ZoneId;
    startTime: number;
  };
  driveFromPrev: number;
  driveToNext: number;
  buffer: number;
  travelMathExplanation?: string;
  isRecommendedCluster?: boolean;
}

export interface SchedulerSettings {
  dayStartMin: number; // default 510 (8:30 AM)
  dayEndMin: number; // default 1050 (5:30 PM)
  bufferMin: number; // default 10
  dailyCap: number; // default 5
  enabledZones: Record<ZoneId, boolean>;
}

export interface DailyStats {
  revenue: number;
  driveTimeMin: number;
  idleTimeMin: number;
  savedMinutes: number;
  completedCount: number;
  totalCount: number;
  efficiencyScore: number;
}

export interface PresetAddress {
  address: string;
  zone: ZoneId;
  zip: string;
  neighborhood: string;
}
