import {
  Bike,
  Home,
  Building2,
  Footprints,
  MoreHorizontal,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { WorkoutType } from '../types/workout';

export interface WorkoutTypeConfig {
  value: WorkoutType;
  label: string;
  icon: LucideIcon;
  color: string;
}

// Workout type options with icons for reuse across the app
export const WORKOUT_TYPES: WorkoutTypeConfig[] = [
  { value: 'outdoorCycling', label: 'workoutTypes.outdoorCycling', icon: Bike, color: 'green' },
  { value: 'indoorCycling', label: 'workoutTypes.indoorCycling', icon: Bike, color: 'blue' },
  { value: 'gymHome', label: 'workoutTypes.gymHome', icon: Home, color: 'purple' },
  { value: 'gymFacility', label: 'workoutTypes.gymFacility', icon: Building2, color: 'orange' },
  { value: 'crossTraining', label: 'workoutTypes.crossTraining', icon: Footprints, color: 'cyan' },
  { value: 'other', label: 'workoutTypes.other', icon: MoreHorizontal, color: 'gray' },
];

// Helper to get workout type config by value
export const getWorkoutTypeConfig = (value: string | undefined): WorkoutTypeConfig => {
  return WORKOUT_TYPES.find((t) => t.value === value) || WORKOUT_TYPES[WORKOUT_TYPES.length - 1];
};

// Get just the icon component for a workout type
export const getWorkoutTypeIcon = (value: string | undefined): LucideIcon => {
  return getWorkoutTypeConfig(value).icon;
};

// Get the color for a workout type
export const getWorkoutTypeColor = (value: string | undefined): string => {
  return getWorkoutTypeConfig(value).color;
};
