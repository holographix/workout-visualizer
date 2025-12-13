/**
 * useOnboarding Hook
 * Manages athlete onboarding state and API calls
 */
import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import type {
  OnboardingStatus,
  AthleteProfile,
  PersonalInfoStepData,
  PhysicalStepData,
  CategoryStepData,
  DisciplineStepData,
  TerrainStepData,
  ActivityTypesStepData,
  EquipmentStepData,
} from '../types/onboarding';
import type { WeeklyAvailability } from '../types/availability';

interface UseOnboardingOptions {
  athleteId?: string;
}

export function useOnboarding({ athleteId }: UseOnboardingOptions = {}) {
  const [status, setStatus] = useState<OnboardingStatus | null>(null);
  const [profile, setProfile] = useState<AthleteProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch onboarding status
  const fetchStatus = useCallback(async () => {
    if (!athleteId) return;

    setIsLoading(true);
    setError(null);
    try {
      const data = await api.get<OnboardingStatus>(`/api/onboarding/${athleteId}/status`);
      setStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch onboarding status'));
    } finally {
      setIsLoading(false);
    }
  }, [athleteId]);

  // Fetch full profile
  const fetchProfile = useCallback(async () => {
    if (!athleteId) return;

    setIsLoading(true);
    setError(null);
    try {
      const data = await api.get<AthleteProfile>(`/api/onboarding/${athleteId}/profile`);
      setProfile(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch profile'));
    } finally {
      setIsLoading(false);
    }
  }, [athleteId]);

  // Auto-fetch status when athleteId changes
  useEffect(() => {
    if (athleteId) {
      fetchStatus();
    }
  }, [athleteId, fetchStatus]);

  // Step save functions
  const savePersonalInfo = useCallback(async (data: PersonalInfoStepData) => {
    if (!athleteId) throw new Error('No athlete ID');

    setIsSaving(true);
    try {
      await api.post(`/api/onboarding/${athleteId}/step/personal`, data);
      await fetchStatus();
    } finally {
      setIsSaving(false);
    }
  }, [athleteId, fetchStatus]);

  const savePhysical = useCallback(async (data: PhysicalStepData) => {
    if (!athleteId) throw new Error('No athlete ID');

    setIsSaving(true);
    try {
      await api.post(`/api/onboarding/${athleteId}/step/physical`, data);
      await fetchStatus();
    } finally {
      setIsSaving(false);
    }
  }, [athleteId, fetchStatus]);

  const saveCategory = useCallback(async (data: CategoryStepData) => {
    if (!athleteId) throw new Error('No athlete ID');

    setIsSaving(true);
    try {
      await api.post(`/api/onboarding/${athleteId}/step/category`, data);
      await fetchStatus();
    } finally {
      setIsSaving(false);
    }
  }, [athleteId, fetchStatus]);

  const saveDisciplines = useCallback(async (data: DisciplineStepData) => {
    if (!athleteId) throw new Error('No athlete ID');

    setIsSaving(true);
    try {
      await api.post(`/api/onboarding/${athleteId}/step/disciplines`, data);
      await fetchStatus();
    } finally {
      setIsSaving(false);
    }
  }, [athleteId, fetchStatus]);

  const saveTerrain = useCallback(async (data: TerrainStepData) => {
    if (!athleteId) throw new Error('No athlete ID');

    setIsSaving(true);
    try {
      await api.post(`/api/onboarding/${athleteId}/step/terrain`, data);
      await fetchStatus();
    } finally {
      setIsSaving(false);
    }
  }, [athleteId, fetchStatus]);

  const saveAvailability = useCallback(async (data: WeeklyAvailability) => {
    if (!athleteId) throw new Error('No athlete ID');

    setIsSaving(true);
    try {
      // Use the availability endpoint
      const availability = data.days.map((day) => ({
        dayIndex: day.dayIndex,
        available: day.isAvailable,
        maxHours: day.maxHours,
      }));
      await api.put(`/api/availability/${athleteId}`, { availability });
    } finally {
      setIsSaving(false);
    }
  }, [athleteId]);

  const saveActivityTypes = useCallback(async (data: ActivityTypesStepData) => {
    if (!athleteId) throw new Error('No athlete ID');

    setIsSaving(true);
    try {
      await api.post(`/api/onboarding/${athleteId}/step/activities`, data);
      await fetchStatus();
    } finally {
      setIsSaving(false);
    }
  }, [athleteId, fetchStatus]);

  const saveEquipment = useCallback(async (data: EquipmentStepData) => {
    if (!athleteId) throw new Error('No athlete ID');

    setIsSaving(true);
    try {
      await api.post(`/api/onboarding/${athleteId}/step/equipment`, data);
      await fetchStatus();
    } finally {
      setIsSaving(false);
    }
  }, [athleteId, fetchStatus]);

  const updateStep = useCallback(async (step: number) => {
    if (!athleteId) throw new Error('No athlete ID');

    try {
      await api.put(`/api/onboarding/${athleteId}/step`, { step });
      await fetchStatus();
    } catch (err) {
      console.error('Failed to update step:', err);
    }
  }, [athleteId, fetchStatus]);

  const completeOnboarding = useCallback(async () => {
    if (!athleteId) throw new Error('No athlete ID');

    setIsSaving(true);
    try {
      await api.post(`/api/onboarding/${athleteId}/complete`);
      await fetchStatus();
    } finally {
      setIsSaving(false);
    }
  }, [athleteId, fetchStatus]);

  return {
    // State
    status,
    profile,
    isLoading,
    isSaving,
    error,
    // Data fetch
    fetchStatus,
    fetchProfile,
    // Step saves
    savePersonalInfo,
    savePhysical,
    saveCategory,
    saveDisciplines,
    saveTerrain,
    saveAvailability,
    saveActivityTypes,
    saveEquipment,
    // Navigation
    updateStep,
    completeOnboarding,
  };
}

/**
 * Hook for coach to view athlete profile
 */
export function useAthleteProfile(athleteId?: string) {
  const [profile, setProfile] = useState<AthleteProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!athleteId) return;

    const fetchProfile = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await api.get<AthleteProfile>(`/api/onboarding/${athleteId}/profile`);
        setProfile(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch profile'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [athleteId]);

  return { profile, isLoading, error };
}
