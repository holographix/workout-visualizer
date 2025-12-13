/**
 * useAssessments Hook
 * Manages fitness assessment tests and API calls
 */
import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import type {
  Assessment,
  AssessmentType,
  Sprint12MinData,
  Power125MinData,
} from '../types/assessment';

interface UseAssessmentsOptions {
  athleteId?: string;
}

export function useAssessments({ athleteId }: UseAssessmentsOptions = {}) {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [latestAssessment, setLatestAssessment] = useState<Assessment | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch all assessments for athlete
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

  // Fetch latest assessment
  const fetchLatestAssessment = useCallback(async (testType?: AssessmentType) => {
    if (!athleteId) return;

    setIsLoading(true);
    setError(null);
    try {
      const params = testType ? `?type=${testType}` : '';
      const data = await api.get<Assessment | null>(
        `/api/assessments/athlete/${athleteId}/latest${params}`
      );
      setLatestAssessment(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch latest assessment'));
    } finally {
      setIsLoading(false);
    }
  }, [athleteId]);

  // Auto-fetch on mount
  useEffect(() => {
    if (athleteId) {
      fetchAssessments();
      fetchLatestAssessment();
    }
  }, [athleteId, fetchAssessments, fetchLatestAssessment]);

  // Create Sprint + 12min assessment
  const createSprint12MinAssessment = useCallback(
    async (data: Sprint12MinData) => {
      if (!athleteId) throw new Error('No athlete ID');

      setIsSaving(true);
      try {
        const result = await api.post<Assessment>('/api/assessments/sprint-12min', {
          athleteId,
          ...data,
        });
        await fetchAssessments();
        await fetchLatestAssessment();
        return result;
      } finally {
        setIsSaving(false);
      }
    },
    [athleteId, fetchAssessments, fetchLatestAssessment]
  );

  // Create 1/2/5min assessment
  const createPower125MinAssessment = useCallback(
    async (data: Power125MinData) => {
      if (!athleteId) throw new Error('No athlete ID');

      setIsSaving(true);
      try {
        const result = await api.post<Assessment>('/api/assessments/power-125min', {
          athleteId,
          ...data,
        });
        await fetchAssessments();
        await fetchLatestAssessment();
        return result;
      } finally {
        setIsSaving(false);
      }
    },
    [athleteId, fetchAssessments, fetchLatestAssessment]
  );

  // Update assessment
  const updateAssessment = useCallback(
    async (
      id: string,
      data: Partial<Sprint12MinData & Power125MinData>
    ) => {
      setIsSaving(true);
      try {
        const result = await api.put<Assessment>(`/api/assessments/${id}`, data);
        await fetchAssessments();
        await fetchLatestAssessment();
        return result;
      } finally {
        setIsSaving(false);
      }
    },
    [fetchAssessments, fetchLatestAssessment]
  );

  // Delete assessment
  const deleteAssessment = useCallback(
    async (id: string) => {
      setIsSaving(true);
      try {
        await api.delete(`/api/assessments/${id}`);
        await fetchAssessments();
        await fetchLatestAssessment();
      } finally {
        setIsSaving(false);
      }
    },
    [fetchAssessments, fetchLatestAssessment]
  );

  // Update athlete FTP based on latest assessment
  const updateAthleteFTP = useCallback(async () => {
    if (!athleteId) throw new Error('No athlete ID');

    try {
      await api.post(`/api/assessments/athlete/${athleteId}/update-ftp`);
    } catch (err) {
      console.error('Failed to update FTP:', err);
    }
  }, [athleteId]);

  return {
    // State
    assessments,
    latestAssessment,
    isLoading,
    isSaving,
    error,
    // Data fetch
    fetchAssessments,
    fetchLatestAssessment,
    // CRUD operations
    createSprint12MinAssessment,
    createPower125MinAssessment,
    updateAssessment,
    deleteAssessment,
    updateAthleteFTP,
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
    testType: AssessmentType;
    testDate: string;
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
      testType: AssessmentType;
      testDate: string;
      estimatedFTP: number | null;
      sprintPeakPower: number | null;
      climb12AvgPower: number | null;
      effort5minAvgPower: number | null;
    } | null;
    previousAssessment: {
      id: string;
      testType: AssessmentType;
      testDate: string;
      estimatedFTP: number | null;
    } | null;
    ftpProgress: number;
    wattsPerKg: number | null;
    assessmentHistory: Array<{
      id: string;
      testType: AssessmentType;
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
