export interface WorkoutTarget {
  minValue: number;        // Power % FTP (existing)
  maxValue: number;        // Power % FTP (existing)
  cadenceMin?: number;     // Optional RPM (30-200)
  cadenceMax?: number;     // Optional RPM (30-200)
  hrMin?: number;          // Optional BPM or %
  hrMax?: number;          // Optional BPM or %
  hrType?: 'bpm' | 'percent'; // Absolute vs percentage
}

// The actual step data (inside steps array or directly)
export interface WorkoutStepData {
  type?: 'step';
  name?: string;
  length: {
    value: number;
    unit: 'second' | 'minute' | 'repetition';
  };
  targets: WorkoutTarget[];
  intensityClass: 'warmUp' | 'active' | 'rest' | 'coolDown';
  openDuration: boolean;
}

// A wrapper step that contains steps array
export interface WorkoutStepWrapper {
  type: 'step';
  length: {
    value: number;
    unit: 'repetition';
  };
  steps: WorkoutStepData[];
  begin?: number;
  end?: number;
}

export interface WorkoutRepetition {
  type: 'repetition';
  length: {
    value: number;
    unit: 'repetition';
  };
  steps: (WorkoutStepData | WorkoutRepetition)[];
  begin?: number;
  end?: number;
}

export type WorkoutStructureItem = WorkoutStepWrapper | WorkoutRepetition;

export interface WorkoutStructure {
  structure: WorkoutStructureItem[];
}

export type WorkoutType =
  | 'outdoorCycling'
  | 'indoorCycling'
  | 'gymHome'
  | 'gymFacility'
  | 'crossTraining'
  | 'other';

export interface WorkoutAttributes {
  structure: WorkoutStructure;
  tssPlanned: number;
  ifPlanned: number;
  totalTimePlanned: number;
  workoutTypeName: string;
  workoutType?: WorkoutType;
}

export interface Workout {
  id: number;
  title: string;
  description: string;
  categoryId?: string;
  attributes: WorkoutAttributes;
}

// --- Flattened Internal Format ---

export interface FlatSegment {
  startTime: number; // seconds from start
  endTime: number;   // seconds from start
  duration: number;  // seconds
  targetMin: number; // absolute value (e.g. % FTP or Watts)
  targetMax: number;
  type: 'warmUp' | 'active' | 'rest' | 'coolDown';
  name: string;
  description?: string;
  openDuration: boolean;
  group?: number; // ID to link repetitions together
  // Optional cadence and HR targets
  cadenceMin?: number;
  cadenceMax?: number;
  hrMin?: number;
  hrMax?: number;
  hrType?: 'bpm' | 'percent';
}

export interface ParsedWorkout {
  segments: FlatSegment[];
  totalDuration: number;
  metadata: {
    title: string;
    description: string;
    tss: number;
    if: number;
  };
}
