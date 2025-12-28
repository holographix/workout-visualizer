/**
 * useAssessments Hook
 * Manages 2-day fitness assessment tests and API calls
 *
 * Day 1: 1'/2'/5' efforts on 6-7% gradient
 * Day 2: 5" sprint + 12' climb on 6-7% gradient
 * Athletes have 15 days to complete Day 2 after Day 1
 */
import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import type {
  Assessment,
  Day1Data,
  Day2Data,
  OngoingTest,
} from '../types/assessment';

interface UseAssessmentsOptions {
  athleteId?: string;
}

export function useAssessments({ athleteId }: UseAssessmentsOptions = {}) {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [latestAssessment, setLatestAssessment] = useState<Assessment | null>(null);
  const [ongoingTest, setOngoingTest] = useState<OngoingTest | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch all completed assessments for athlete
  const fetchAssessments = useCallback(async () => {
    if (!athleteId) return;

    setIsLoading(true);
    setError(null);
    try {
      const data = await api.get<Assessment[]>(`/api/assessments/athlete/${athleteId}`);
      setAssessments(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch assessments'));
    } finally {
      setIsLoading(false);
    }
  }, [athleteId]);

  // Fetch latest completed assessment
  const fetchLatestAssessment = useCallback(async () => {
    if (!athleteId) return;

    setIsLoading(true);
    setError(null);
    try {
      const data = await api.get<Assessment | null>(
        `/api/assessments/athlete/${athleteId}/latest`
      );
      setLatestAssessment(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch latest assessment'));
    } finally {
      setIsLoading(false);
    }
  }, [athleteId]);

  // Fetch ongoing test (if any)
  const fetchOngoingTest = useCallback(async () => {
    if (!athleteId) return;

    setError(null);
    try {
      const data = await api.get<OngoingTest | null>(
        `/api/assessments/athlete/${athleteId}/ongoing`
      );
      setOngoingTest(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch ongoing test'));
    }
  }, [athleteId]);

  // Auto-fetch on mount
  useEffect(() => {
    if (athleteId) {
      fetchAssessments();
      fetchLatestAssessment();
      fetchOngoingTest();
    }
  }, [athleteId, fetchAssessments, fetchLatestAssessment, fetchOngoingTest]);

  // ============================================
  // 2-DAY ASSESSMENT WORKFLOW METHODS
  // ============================================

  /**
   * Start a new 2-day assessment test
   * Creates assessment with status DAY1_PENDING
   */
  const startTest = useCallback(
    async () => {
      if (!athleteId) throw new Error('No athlete ID');

      setIsSaving(true);
      try {
        const result = await api.post<Assessment>('/api/assessments/start', {
          athleteId,
        });
        await fetchOngoingTest();
        return result;
      } finally {
        setIsSaving(false);
      }
    },
    [athleteId, fetchOngoingTest]
  );

  /**
   * Complete Day 1 of the assessment (1'/2'/5' efforts)
   * Transitions from DAY1_PENDING → DAY1_COMPLETED
   * Sets expiration date (15 days from now)
   */
  const completeDay1 = useCallback(
    async (assessmentId: string, data: Day1Data) => {
      setIsSaving(true);
      try {
        const result = await api.post<Assessment>(
          `/api/assessments/${assessmentId}/complete-day1`,
          data
        );
        await fetchOngoingTest();
        return result;
      } finally {
        setIsSaving(false);
      }
    },
    [fetchOngoingTest]
  );

  /**
   * Start Day 2 of the assessment
   * Validates Day 1 is complete and test hasn't expired
   * Transitions from DAY1_COMPLETED → DAY2_PENDING
   */
  const startDay2 = useCallback(
    async (assessmentId: string) => {
      setIsSaving(true);
      try {
        const result = await api.post<Assessment>(
          `/api/assessments/${assessmentId}/start-day2`
        );
        await fetchOngoingTest();
        return result;
      } finally {
        setIsSaving(false);
      }
    },
    [fetchOngoingTest]
  );

  /**
   * Complete Day 2 of the assessment (5" sprint + 12' climb)
   * Transitions from DAY2_PENDING → COMPLETED
   * Calculates FTP and maxHR, auto-updates athlete's profile
   */
  const completeDay2 = useCallback(
    async (assessmentId: string, data: Day2Data) => {
      setIsSaving(true);
      try {
        const result = await api.post<Assessment>(
          `/api/assessments/${assessmentId}/complete-day2`,
          data
        );
        // Refresh all assessment data after completion
        await Promise.all([
          fetchAssessments(),
          fetchLatestAssessment(),
          fetchOngoingTest(),
        ]);
        return result;
      } finally {
        setIsSaving(false);
      }
    },
    [fetchAssessments, fetchLatestAssessment, fetchOngoingTest]
  );

  /**
   * Delete an assessment
   * Only allowed for tests in progress (not completed)
   */
  const deleteAssessment = useCallback(
    async (id: string) => {
      setIsSaving(true);
      try {
        await api.delete(`/api/assessments/${id}`);
        await Promise.all([
          fetchAssessments(),
          fetchLatestAssessment(),
          fetchOngoingTest(),
        ]);
      } finally {
        setIsSaving(false);
      }
    },
    [fetchAssessments, fetchLatestAssessment, fetchOngoingTest]
  );

  return {
    // State
    assessments,
    latestAssessment,
    ongoingTest,
    isLoading,
    isSaving,
    error,

    // Data fetch
    fetchAssessments,
    fetchLatestAssessment,
    fetchOngoingTest,

    // 2-day workflow
    startTest,
    completeDay1,
    startDay2,
    completeDay2,
    deleteAssessment,
  };
}

/**
 * Fetch a single assessment by ID
 */
export async function fetchAssessment(id: string): Promise<Assessment> {
  return api.get<Assessment>(`/api/assessments/${id}`);
}

/**
 * Types for coach assessment status
 */
export interface AthleteAssessmentStatus {
  athleteId: string;
  athleteName: string;
  email: string;
  ftp: number | null;
  hasAssessment: boolean;
  lastTestDate: string | null;
  daysSinceTest: number | null;
  isOverdue: boolean;
  isNewAssessment: boolean;
  latestAssessment: {
    id: string;
    day2CompletedAt: string;
    estimatedFTP: number | null;
  } | null;
}

/**
 * Hook for coach to get assessment status of all athletes
 */
export function useCoachAssessmentStatus(coachId: string | undefined) {
  const [athletes, setAthletes] = useState<AthleteAssessmentStatus[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchStatus = useCallback(async () => {
    if (!coachId) return;

    setIsLoading(true);
    setError(null);
    try {
      const data = await api.get<AthleteAssessmentStatus[]>(`/api/assessments/coach/${coachId}/status`);
      setAthletes(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch assessment status'));
    } finally {
      setIsLoading(false);
    }
  }, [coachId]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Derived data for easy access
  const athletesNeedingAssessment = athletes.filter(a => !a.hasAssessment || a.isOverdue);
  const athletesWithNewAssessment = athletes.filter(a => a.isNewAssessment);

  return {
    athletes,
    athletesNeedingAssessment,
    athletesWithNewAssessment,
    isLoading,
    error,
    refetch: fetchStatus,
  };
}

/**
 * Types for athlete stats
 */
export interface AthleteStatsData {
  athlete: {
    id: string;
    fullName: string;
    email: string;
    ftp: number | null;
    heightCm: number | null;
    weightKg: number | null;
  };
  assessment: {
    hasAssessment: boolean;
    isOverdue: boolean;
    daysSinceTest: number | null;
    latestAssessment: {
      id: string;
      day2CompletedAt: string;
      estimatedFTP: number | null;
      sprint5secPeakPower: number | null;
      climb12minAvgPower: number | null;
      effort5minAvgPower: number | null;
    } | null;
    previousAssessment: {
      id: string;
      day2CompletedAt: string;
      estimatedFTP: number | null;
    } | null;
    ftpProgress: number;
    wattsPerKg: number | null;
    assessmentHistory: Array<{
      id: string;
      testDate: string;
      estimatedFTP: number | null;
    }>;
  };
}

/**
 * Hook to get athlete stats with assessment data
 */
export function useAthleteStats(athleteId: string | undefined) {
  const [stats, setStats] = useState<AthleteStatsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchStats = useCallback(async () => {
    if (!athleteId) return;

    setIsLoading(true);
    setError(null);
    try {
      const data = await api.get<AthleteStatsData>(`/api/assessments/athlete/${athleteId}/stats`);
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch athlete stats'));
    } finally {
      setIsLoading(false);
    }
  }, [athleteId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    isLoading,
    error,
    refetch: fetchStats,
  };
}
