export interface WorkoutTarget {
  minValue: number;
  maxValue: number;
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

export interface TrainingPeaksWorkoutAttributes {
  structure: WorkoutStructure;
  tssPlanned: number;
  ifPlanned: number;
  totalTimePlanned: number;
  workoutTypeName: string;
}

export interface TrainingPeaksWorkout {
  id: number;
  title: string;
  description: string;
  attributes: TrainingPeaksWorkoutAttributes;
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
