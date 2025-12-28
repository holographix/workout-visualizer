import type { Workout } from './workout';

// Workout feeling enum (matches backend)
export type WorkoutFeeling = 'GREAT' | 'GOOD' | 'OK' | 'TIRED' | 'EXHAUSTED';

// Workout result data submitted by athlete
export interface WorkoutResults {
  actualDurationSeconds?: number;
  actualDistanceKm?: number; // Distance in kilometers
  actualTSS?: number;
  actualIF?: number;
  avgPower?: number;
  avgHeartRate?: number;
  rpe?: number; // 1-10 Rate of Perceived Exertion
  feeling?: WorkoutFeeling;
  resultNotes?: string;
}

export interface ScheduledWorkout {
  id: string;
  workoutId: string;
  workout: Workout;
  dayIndex: number; // 0 = Monday, 6 = Sunday
  sortOrder: number;
  notes?: string; // Coach notes when scheduling
  completed: boolean;
  completedAt?: string;
  // Workout structure overrides (coach modifications for specific athlete/day)
  structureOverride?: any; // Modified workout structure
  durationOverride?: number; // Modified duration in seconds
  tssOverride?: number; // Recalculated TSS
  ifOverride?: number; // Recalculated IF
  isModified?: boolean; // Flag indicating workout has been customized
  // Actual results (filled by athlete after completion)
  actualDurationSeconds?: number;
  actualDistanceKm?: number;
  actualTSS?: number;
  actualIF?: number;
  avgPower?: number;
  avgHeartRate?: number;
  rpe?: number;
  feeling?: WorkoutFeeling;
  resultNotes?: string;
}

export interface TrainingWeek {
  id: string;
  weekStart: Date;
  notes?: string;
  scheduledWorkouts: ScheduledWorkout[];
}

export interface DayColumn {
  dayIndex: number;
  date: Date;
  dayName: string;
  isToday: boolean;
  workouts: ScheduledWorkout[];
}

// Athlete calendar workout (includes date)
export interface AthleteScheduledWorkout extends ScheduledWorkout {
  date: string; // ISO date string
  weekStart: Date;
  coachName?: string | null;
}
