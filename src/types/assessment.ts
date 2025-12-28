/**
 * Assessment Types - 2-Day Protocol
 * Types for the 2-day fitness assessment test
 *
 * Day 1: 1'/2'/5' efforts on 6-7% gradient
 * Day 2: 5" sprint + 12' climb on 6-7% gradient
 * Athletes have 15 days to complete Day 2 after Day 1
 */

/**
 * Assessment status enum
 * Tracks progression through the 2-day test
 */
export type AssessmentStatus =
  | 'DAY1_PENDING'      // Test started, Day 1 not yet completed
  | 'DAY1_COMPLETED'    // Day 1 complete, waiting for Day 2
  | 'DAY2_PENDING'      // Day 2 started but not completed
  | 'COMPLETED'         // Both days completed
  | 'EXPIRED';          // Day 1 completed but 15-day window elapsed

/**
 * Day 1 data (1'/2'/5' efforts)
 * All efforts performed on 6-7% gradient climb
 */
export interface Day1Data {
  effort1minAvgPower?: number;  // Average power during 1' effort (W)
  effort1minMaxHR?: number;     // Max HR during 1' effort (bpm)
  effort2minAvgPower?: number;  // Average power during 2' effort (W)
  effort2minMaxHR?: number;     // Max HR during 2' effort (bpm)
  effort5minAvgPower?: number;  // Average power during 5' effort (W)
  effort5minMaxHR?: number;     // Max HR during 5' effort (bpm)
  notes?: string;
}

/**
 * Day 2 data (5" sprint + 12' climb)
 * Both efforts performed on 6-7% gradient climb
 */
export interface Day2Data {
  sprint5secPeakPower?: number;  // Peak power during 5" sprint (W)
  sprint5secMaxHR?: number;      // Max HR during sprint (bpm)
  climb12minAvgPower?: number;   // Average power during 12' climb (W)
  climb12minMaxHR?: number;      // Max HR during 12' climb (bpm)
  notes?: string;
}

/**
 * Assessment record from API
 * Combines both Day 1 and Day 2 data
 */
export interface Assessment {
  id: string;
  athleteId: string;
  testStatus: AssessmentStatus;

  // Timing
  startedAt: string;
  day1CompletedAt: string | null;
  day2CompletedAt: string | null;
  expiresAt: string | null;

  // Day 1 data (1'/2'/5' efforts)
  effort1minAvgPower: number | null;
  effort1minMaxHR: number | null;
  effort2minAvgPower: number | null;
  effort2minMaxHR: number | null;
  effort5minAvgPower: number | null;
  effort5minMaxHR: number | null;

  // Day 2 data (5" sprint + 12' climb)
  sprint5secPeakPower: number | null;
  sprint5secMaxHR: number | null;
  climb12minAvgPower: number | null;
  climb12minMaxHR: number | null;

  // Calculated results
  estimatedFTP: number | null;
  maxHR: number | null;
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
 * Ongoing test response
 * Returned when checking for an athlete's ongoing test
 */
export interface OngoingTest extends Assessment {
  daysRemaining: number | null;  // Days until expiration (null if Day 1 not completed)
  isExpiringSoon: boolean;        // True if < 3 days remaining
}

/**
 * Day 1 form state
 */
export interface Day1FormState {
  effort1minAvgPower: string;
  effort1minMaxHR: string;
  effort2minAvgPower: string;
  effort2minMaxHR: string;
  effort5minAvgPower: string;
  effort5minMaxHR: string;
  notes: string;
}

/**
 * Day 2 form state
 */
export interface Day2FormState {
  sprint5secPeakPower: string;
  sprint5secMaxHR: string;
  climb12minAvgPower: string;
  climb12minMaxHR: string;
  notes: string;
}

/**
 * Protocol instructions and metadata
 */
export const ASSESSMENT_PROTOCOL = {
  title: '2-Day Assessment Protocol',
  description: 'Complete power profile test across two days on a 6-7% gradient climb',
  gradient: '6-7%',
  expirationDays: 15,

  day1: {
    title: 'Day 1: Power Profile (1\'/2\'/5\')',
    description: 'Three maximum efforts at different durations',
    efforts: [
      {
        duration: '1 minute',
        metric: 'Average Power',
        instructions: 'Maximum sustainable effort for 1 minute',
      },
      {
        duration: '2 minutes',
        metric: 'Average Power',
        instructions: 'Maximum sustainable effort for 2 minutes',
      },
      {
        duration: '5 minutes',
        metric: 'Average Power',
        instructions: 'Maximum sustainable effort for 5 minutes',
      },
    ],
    fields: [
      { key: 'effort1minAvgPower', label: '1\' Avg Power', unit: 'W', isRequired: false },
      { key: 'effort1minMaxHR', label: '1\' Max HR', unit: 'bpm', isRequired: false },
      { key: 'effort2minAvgPower', label: '2\' Avg Power', unit: 'W', isRequired: false },
      { key: 'effort2minMaxHR', label: '2\' Max HR', unit: 'bpm', isRequired: false },
      { key: 'effort5minAvgPower', label: '5\' Avg Power', unit: 'W', isRequired: false },
      { key: 'effort5minMaxHR', label: '5\' Max HR', unit: 'bpm', isRequired: false },
    ],
  },

  day2: {
    title: 'Day 2: Sprint + Endurance (5"/12\')',
    description: 'Peak power sprint followed by threshold climb',
    efforts: [
      {
        duration: '5 seconds',
        metric: 'Peak Power',
        instructions: 'All-out maximum effort sprint',
      },
      {
        duration: '12 minutes',
        metric: 'Average Power',
        instructions: 'Sustained threshold effort climb',
      },
    ],
    fields: [
      { key: 'sprint5secPeakPower', label: '5" Peak Power', unit: 'W', isRequired: false },
      { key: 'sprint5secMaxHR', label: '5" Max HR', unit: 'bpm', isRequired: false },
      { key: 'climb12minAvgPower', label: '12\' Avg Power', unit: 'W', isRequired: false },
      { key: 'climb12minMaxHR', label: '12\' Max HR', unit: 'bpm', isRequired: false },
    ],
  },
} as const;
