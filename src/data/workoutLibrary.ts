import type { Workout } from '../types/workout';

// Import all workout category files
import anaerobicCapacity from './workouts/anaerobic-capacity.json';
import easyRide from './workouts/easy-ride.json';
import fatmax from './workouts/fatmax.json';
import generalRide from './workouts/general-ride.json';
import muscolarElasticity from './workouts/muscolar-elasticity.json';
import racepace from './workouts/racepace.json';
import resistence from './workouts/resistence.json';
import strength from './workouts/strength.json';
import vo2max from './workouts/vo2max.json';
import test from './workouts/test.json';
import activaction from './workouts/activaction.json';
import warmup from './workouts/warmup.json';
import riposo from './workouts/riposo.json';

export interface WorkoutLibraryItem {
    id: string;
    name: string;
    workout: Workout;
}

export interface WorkoutCategory {
    id: string;
    name: string;
    description: string;
    workouts: WorkoutLibraryItem[];
}

// Type assertion for imported JSON (using unknown first for safe casting)
const categories = [
    anaerobicCapacity,
    easyRide,
    fatmax,
    generalRide,
    muscolarElasticity,
    racepace,
    resistence,
    strength,
    vo2max,
    test,
    activaction,
    warmup,
    riposo,
] as unknown as WorkoutCategory[];

// Filter out empty categories
export const workoutLibrary: WorkoutCategory[] = categories.filter(
    c => c.workouts.length > 0
);

// Helper to get all workouts flat
export const getAllWorkouts = (): WorkoutLibraryItem[] => {
    return workoutLibrary.flatMap(category => category.workouts);
};

// Helper to find workout by id
export const findWorkoutById = (id: string): WorkoutLibraryItem | undefined => {
    return getAllWorkouts().find(w => w.id === id);
};

// Helper to find category by id
export const findCategoryById = (id: string): WorkoutCategory | undefined => {
    return workoutLibrary.find(c => c.id === id);
};
