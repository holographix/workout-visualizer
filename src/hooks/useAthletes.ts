/**
 * useAthletes Hook
 *
 * Fetches and manages athletes for a coach.
 *
 * @module hooks/useAthletes
 */
import { useState, useEffect, useCallback } from 'react';
import { startOfWeek, format } from 'date-fns';
import {
  relationshipsService,
  type CoachAthleteListItem,
  type RelationshipStatus,
} from '../services/relationships';
import { api } from '../services/api';
import type { Athlete } from '../components/organisms/Coach';

interface UseAthletesOptions {
  coachId: string | null;
  status?: RelationshipStatus;
}

interface UseAthletesResult {
  athletes: Athlete[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

type AthleteStats = Record<string, { upcomingWorkouts: number; weeklyTSS: number }>;

/**
 * Fetches athlete stats for the current week
 */
async function fetchAthleteStats(athleteIds: string[]): Promise<AthleteStats> {
  if (athleteIds.length === 0) return {};

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekStartStr = format(weekStart, 'yyyy-MM-dd');

  try {
    const stats = await api.get<AthleteStats>(
      `/api/calendar/stats/athletes?athleteIds=${athleteIds.join(',')}&weekStart=${weekStartStr}`
    );
    return stats;
  } catch {
    // If stats fetch fails, return empty stats
    return {};
  }
}

/**
 * Maps API relationship data to Athlete interface
 */
function mapToAthlete(
  item: CoachAthleteListItem,
  stats: AthleteStats
): Athlete {
  const statusMap: Record<RelationshipStatus, Athlete['status']> = {
    PENDING: 'new',
    ACTIVE: 'active',
    PAUSED: 'inactive',
    ENDED: 'inactive',
  };

  const athleteStats = stats[item.athlete.id] || { upcomingWorkouts: 0, weeklyTSS: 0 };

  return {
    id: item.athlete.id,
    name: item.athlete.fullName || item.athlete.email.split('@')[0],
    email: item.athlete.email,
    status: statusMap[item.status],
    weeklyTSS: athleteStats.weeklyTSS,
    upcomingWorkouts: athleteStats.upcomingWorkouts,
  };
}

export function useAthletes({
  coachId,
  status,
}: UseAthletesOptions): UseAthletesResult {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchAthletes = useCallback(async () => {
    if (!coachId) {
      setAthletes([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await relationshipsService.getAthletesForCoach(coachId, status);

      // Fetch stats for all athletes
      const athleteIds = data.map(item => item.athlete.id);
      const stats = await fetchAthleteStats(athleteIds);

      setAthletes(data.map(item => mapToAthlete(item, stats)));
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch athletes'));
      setAthletes([]);
    } finally {
      setIsLoading(false);
    }
  }, [coachId, status]);

  useEffect(() => {
    fetchAthletes();
  }, [fetchAthletes]);

  return {
    athletes,
    isLoading,
    error,
    refetch: fetchAthletes,
  };
}
