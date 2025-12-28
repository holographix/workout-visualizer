/**
 * Types for strength/gym workout structure
 * Based on TrainingPeaks-style strength workouts
 */

export type LoadType = 'bodyweight' | 'weighted' | 'percentage';
export type DurationType = 'reps' | 'time';

export interface StrengthExercise {
  id: string;
  name: string;
  sets: number;
  durationType: DurationType; // 'reps' or 'time'
  repsMin?: number; // Used when durationType is 'reps'
  repsMax?: number; // If different from repsMin, it's a range
  durationSeconds?: number; // Used when durationType is 'time'
  loadType: LoadType;
  load?: number; // Weight in kg (if weighted) or percentage (if percentage of 1RM)
  restSeconds: number; // Rest between sets
  notes?: string;
  category?: 'upperBody' | 'lowerBody' | 'core' | 'fullBody' | 'mobility';
  videoUrl?: string; // YouTube URL for exercise demonstration
}

export interface StrengthWorkoutStructure {
  exercises: StrengthExercise[];
}

export interface StrengthWorkout {
  id: number;
  title: string;
  description: string;
  categoryId?: string;
  attributes: {
    structure: StrengthWorkoutStructure;
    totalTimePlanned: number; // Estimated duration in hours
    workoutTypeName: string;
    workoutType: 'gymHome' | 'gymFacility';
  };
}
