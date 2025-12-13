/**
 * Assessment Types
 * Types for fitness assessment tests
 */

export type AssessmentType = 'SPRINT_12MIN' | 'POWER_1_2_5MIN';

/**
 * Sprint + 12min protocol data
 * - Sprint: 15" all-out effort - record PEAK power
 * - Climb: 12' steady effort - record AVERAGE power
 */
export interface Sprint12MinData {
  testDate: string;
  sprintPeakPower?: number;   // Peak power during 15" sprint (W)
  sprintMaxHR?: number;       // Max HR during sprint (bpm)
  climb12AvgPower?: number;   // Average power during 12' climb (W)
  climb12MaxHR?: number;      // Max HR during 12' climb (bpm)
  notes?: string;
}

/**
 * 1/2/5 minute protocol data
 * All efforts record AVERAGE power over the duration
 */
export interface Power125MinData {
  testDate: string;
  effort1minAvgPower?: number;  // Average power during 1' effort (W)
  effort1minMaxHR?: number;     // Max HR during 1' effort (bpm)
  effort2minAvgPower?: number;  // Average power during 2' effort (W)
  effort2minMaxHR?: number;     // Max HR during 2' effort (bpm)
  effort5minAvgPower?: number;  // Average power during 5' effort (W)
  effort5minMaxHR?: number;     // Max HR during 5' effort (bpm)
  notes?: string;
}

/**
 * Assessment record from API
 */
export interface Assessment {
  id: string;
  athleteId: string;
  testType: AssessmentType;
  testDate: string;
  // Sprint + 12min protocol
  sprintPeakPower: number | null;
  sprintMaxHR: number | null;
  climb12AvgPower: number | null;
  climb12MaxHR: number | null;
  // 1/2/5 min protocol
  effort1minAvgPower: number | null;
  effort1minMaxHR: number | null;
  effort2minAvgPower: number | null;
  effort2minMaxHR: number | null;
  effort5minAvgPower: number | null;
  effort5minMaxHR: number | null;
  // Calculated
  estimatedFTP: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  // Relation (when fetching single assessment)
  athlete?: {
    id: string;
    fullName: string;
    email: string;
  };
}

/**
 * Assessment form state for Sprint + 12min protocol
 */
export interface Sprint12MinFormState {
  testDate: Date;
  sprintPeakPower: string;
  sprintMaxHR: string;
  climb12AvgPower: string;
  climb12MaxHR: string;
  notes: string;
}

/**
 * Assessment form state for 1/2/5min protocol
 */
export interface Power125MinFormState {
  testDate: Date;
  effort1minAvgPower: string;
  effort1minMaxHR: string;
  effort2minAvgPower: string;
  effort2minMaxHR: string;
  effort5minAvgPower: string;
  effort5minMaxHR: string;
  notes: string;
}

/**
 * Assessment protocol metadata
 */
export const ASSESSMENT_PROTOCOLS = {
  SPRINT_12MIN: {
    value: 'SPRINT_12MIN' as const,
    titleKey: 'assessment.protocols.sprint12min.title',
    descriptionKey: 'assessment.protocols.sprint12min.description',
    fields: [
      { key: 'sprintPeakPower', labelKey: 'assessment.fields.sprintPeakPower', unit: 'W', isPeak: true },
      { key: 'sprintMaxHR', labelKey: 'assessment.fields.sprintMaxHR', unit: 'bpm', isPeak: false },
      { key: 'climb12AvgPower', labelKey: 'assessment.fields.climb12AvgPower', unit: 'W', isPeak: false },
      { key: 'climb12MaxHR', labelKey: 'assessment.fields.climb12MaxHR', unit: 'bpm', isPeak: false },
    ],
  },
  POWER_1_2_5MIN: {
    value: 'POWER_1_2_5MIN' as const,
    titleKey: 'assessment.protocols.power125min.title',
    descriptionKey: 'assessment.protocols.power125min.description',
    fields: [
      { key: 'effort1minAvgPower', labelKey: 'assessment.fields.effort1minAvgPower', unit: 'W', isPeak: false },
      { key: 'effort1minMaxHR', labelKey: 'assessment.fields.effort1minMaxHR', unit: 'bpm', isPeak: false },
      { key: 'effort2minAvgPower', labelKey: 'assessment.fields.effort2minAvgPower', unit: 'W', isPeak: false },
      { key: 'effort2minMaxHR', labelKey: 'assessment.fields.effort2minMaxHR', unit: 'bpm', isPeak: false },
      { key: 'effort5minAvgPower', labelKey: 'assessment.fields.effort5minAvgPower', unit: 'W', isPeak: false },
      { key: 'effort5minMaxHR', labelKey: 'assessment.fields.effort5minMaxHR', unit: 'bpm', isPeak: false },
    ],
  },
} as const;
