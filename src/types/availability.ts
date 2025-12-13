export interface TimeSlot {
  id: string;
  startHour: number;
  endHour: number;
}

export interface DayAvailability {
  dayIndex: number; // 0 = Monday, 6 = Sunday
  dayName: string;
  isAvailable: boolean;
  slots: TimeSlot[];
  maxHours: number;
  preferredType?: 'indoor' | 'outdoor' | 'any';
}

export interface WeeklyAvailability {
  days: DayAvailability[];
  totalWeeklyHours: number;
}

// Specific unavailable dates (vacations, travel, etc.)
export interface UnavailableDate {
  id: string;
  date: Date;
  reason?: string;
}

// Full availability profile including notes and unavailable dates
export interface AvailabilityProfile {
  weeklyAvailability: WeeklyAvailability;
  unavailableDates: UnavailableDate[];
  notes?: string;
}

export type GoalType = 'A' | 'B' | 'C';

export interface Goal {
  id: string;
  name: string;
  type: GoalType;
  date: Date;
  description?: string;
  targetDuration?: number;
  targetDistance?: number;
  eventType?: string;
}

export interface AthleteProfile {
  id: string;
  name: string;
  ftp?: number;
  weeklyAvailability: WeeklyAvailability;
  goals: Goal[];
}

export const DEFAULT_DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const createDefaultAvailability = (): WeeklyAvailability => ({
  days: DEFAULT_DAY_NAMES.map((name, index) => ({
    dayIndex: index,
    dayName: name,
    isAvailable: index < 5, // Mon-Fri available by default
    slots: [],
    maxHours: index < 5 ? 1.5 : 3, // 1.5h weekdays, 3h weekends
    preferredType: index >= 5 ? 'outdoor' : 'indoor',
  })),
  totalWeeklyHours: 7.5 + 6, // 5*1.5 + 2*3
});
