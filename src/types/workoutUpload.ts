/**
 * Types for workout file upload and parsing
 */

export type IntensityClass = 'warmUp' | 'active' | 'rest' | 'coolDown';
export type SourceFormat = 'zwo' | 'erg' | 'mrc' | 'fit';
export type SportType = 'bike' | 'run' | 'swim' | 'other';

export interface ParsedSegment {
  startTime: number;
  endTime: number;
  duration: number;
  powerMin: number;
  powerMax: number;
  intensityClass: IntensityClass;
  name: string;
  cadenceMin?: number;
  cadenceMax?: number;
}

export interface ParsedWorkoutResult {
  name: string;
  author?: string;
  description?: string;
  sportType: SportType;
  segments: ParsedSegment[];
  totalDuration: number;
  sourceFormat: SourceFormat;
  ftp?: number;
}

export interface ConvertedWorkout {
  name: string;
  slug: string;
  description: string;
  durationSeconds: number;
  tssPlanned: number;
  ifPlanned: number;
  workoutType: string;
  environment: 'INDOOR' | 'OUTDOOR' | 'ANY';
  intensity: 'EASY' | 'MODERATE' | 'HARD' | 'VERY_HARD';
  structure: unknown[];
  rawJson: Record<string, unknown>;
  sourceFormat: string;
}

export interface SupportedFormatsResponse {
  formats: string[];
  description: string;
}

export interface ParseWorkoutResponse {
  success: boolean;
  parsed: ParsedWorkoutResult;
}

export interface ConvertWorkoutResponse {
  success: boolean;
  workout: ConvertedWorkout;
}

export interface UploadAndParseResponse {
  success: boolean;
  filename: string;
  parsed: ParsedWorkoutResult;
}

export interface UploadAndConvertResponse {
  success: boolean;
  filename: string;
  workout: ConvertedWorkout;
}

export interface WorkoutImportOptions {
  name?: string;
  description?: string;
  categoryId?: string;
}
