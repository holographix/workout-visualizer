/**
 * useCalendarAPI - Hook for managing calendar data with the backend API
 *
 * Handles training weeks and scheduled workouts through the API.
 */
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { startOfWeek, format, addDays } from 'date-fns';
import { api } from '../services/api';
import type { ScheduledWorkout, WorkoutResults, AthleteScheduledWorkout } from '../types/calendar';
import type { DayAvailability, Goal } from '../types/availability';
import type { WorkoutStructure } from '../types/workout';

// Debounce delay for week navigation (ms)
const WEEK_FETCH_DEBOUNCE = 300;

interface ApiWorkout {
  id: string;
  slug: string;
  name: string;
  title: string | null;
  description: string | null;
  durationSeconds: number;
  tssPlanned: number | null;
  ifPlanned: number | null;
  structure: unknown;
  workoutType?: string;
  category: {
    id: string;
    name: string;
    slug: string;
  };
}

interface ApiScheduledWorkout {
  id: string;
  dayIndex: number;
  sortOrder: number;
  notes: string | null;
  completed: boolean;
  completedAt: string | null;
  workout: ApiWorkout;
}

interface ApiTrainingWeek {
  id: string;
  weekStart: string;
  notes: string | null;
  athleteId: string;
  scheduledWorkouts: ApiScheduledWorkout[];
}

interface UseCalendarAPIOptions {
  athleteId: string | undefined;
  weekStart: Date;
  coachId?: string;
}

export function useCalendarAPI({ athleteId, weekStart, coachId }: UseCalendarAPIOptions) {
  const [trainingWeek, setTrainingWeek] = useState<ApiTrainingWeek | null>(null);
  const [scheduledWorkouts, setScheduledWorkouts] = useState<ScheduledWorkout[]>([]);
  const [isLoading, setIsLoading] = useState(true); // Initial load only
  const [isFetching, setIsFetching] = useState(false); // Any fetch (including week changes)
  const [error, setError] = useState<Error | null>(null);

  // Track previous week to detect navigation
  const prevWeekRef = useRef<string | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Format week start for API (always Monday at midnight UTC)
  const weekStartISO = format(startOfWeek(weekStart, { weekStartsOn: 1 }), 'yyyy-MM-dd');

  // Convert API scheduled workout to frontend format
  const convertToFrontendFormat = useCallback((apiWorkout: ApiScheduledWorkout): ScheduledWorkout => {
    const workout = apiWorkout.workout;
    return {
      id: apiWorkout.id,
      workoutId: workout.id,
      workout: {
        id: parseInt(workout.id, 10) || 0,
        title: workout.name,
        description: workout.description || '',
        attributes: {
          structure: { structure: [] },
          totalTimePlanned: workout.durationSeconds / 3600,
          tssPlanned: workout.tssPlanned || 0,
          ifPlanned: workout.ifPlanned || 0,
          workoutTypeName: workout.category?.name || 'Workout',
          workoutType: workout.workoutType as 'outdoorCycling' | 'indoorCycling' | 'gymHome' | 'gymFacility' | 'crossTraining' | 'other' | undefined,
        },
      },
      dayIndex: apiWorkout.dayIndex,
      sortOrder: apiWorkout.sortOrder,
      completed: apiWorkout.completed,
    };
  }, []);

  // Load training week and scheduled workouts
  const loadWeek = useCallback(async () => {
    if (!athleteId) return;

    setIsFetching(true);
    setError(null);

    try {
      // Try to get existing week
      const week = await api.get<ApiTrainingWeek | null>(
        `/api/calendar/week/${athleteId}?weekStart=${weekStartISO}`
      ).catch(() => null);

      if (week && week.scheduledWorkouts) {
        setTrainingWeek(week);
        setScheduledWorkouts(week.scheduledWorkouts.map(convertToFrontendFormat));
      } else {
        // No week exists - will create on first workout add
        setTrainingWeek(null);
        setScheduledWorkouts([]);
      }
    } catch (err) {
      console.error('Failed to load calendar week:', err);
      setError(err instanceof Error ? err : new Error('Failed to load calendar'));
      // Clear workouts on error to prevent stale data
      setTrainingWeek(null);
      setScheduledWorkouts([]);
    } finally {
      setIsLoading(false); // Mark initial load as complete
      setIsFetching(false);
    }
  }, [athleteId, weekStartISO, convertToFrontendFormat]);

  // Create training week if it doesn't exist
  const ensureTrainingWeek = useCallback(async (): Promise<string> => {
    if (trainingWeek) return trainingWeek.id;
    if (!athleteId) throw new Error('No athlete ID');

    const newWeek = await api.post<ApiTrainingWeek>('/api/calendar/week', {
      athleteId,
      weekStart: weekStartISO,
      coachId,
    });

    setTrainingWeek(newWeek);
    return newWeek.id;
  }, [trainingWeek, athleteId, weekStartISO, coachId]);

  // Add workout to a day
  const addWorkout = useCallback(async (workoutId: string, dayIndex: number): Promise<ScheduledWorkout | null> => {
    try {
      const weekId = await ensureTrainingWeek();
      const sortOrder = scheduledWorkouts.filter(sw => sw.dayIndex === dayIndex).length;

      const result = await api.post<ApiScheduledWorkout>('/api/calendar/scheduled', {
        trainingWeekId: weekId,
        workoutId,
        dayIndex,
        sortOrder,
      });

      const newScheduled = convertToFrontendFormat(result);
      setScheduledWorkouts(prev => [...prev, newScheduled]);
      return newScheduled;
    } catch (err) {
      console.error('Failed to add workout:', err);
      throw err;
    }
  }, [ensureTrainingWeek, scheduledWorkouts, convertToFrontendFormat]);

  // Remove scheduled workout
  const removeWorkout = useCallback(async (scheduledId: string) => {
    try {
      await api.delete(`/api/calendar/scheduled/${scheduledId}`);
      setScheduledWorkouts(prev => prev.filter(sw => sw.id !== scheduledId));
    } catch (err) {
      console.error('Failed to remove workout:', err);
      throw err;
    }
  }, []);

  // Mark workout as completed
  const toggleComplete = useCallback(async (scheduledId: string, completed: boolean) => {
    try {
      await api.put(`/api/calendar/scheduled/${scheduledId}/complete`, { completed });
      setScheduledWorkouts(prev =>
        prev.map(sw =>
          sw.id === scheduledId ? { ...sw, completed } : sw
        )
      );
    } catch (err) {
      console.error('Failed to update workout:', err);
      throw err;
    }
  }, []);

  // Load on mount and when week changes (with debouncing for rapid navigation)
  useEffect(() => {
    const isWeekChange = prevWeekRef.current !== null && prevWeekRef.current !== weekStartISO;

    // Clear any pending debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // If week changed, clear workouts immediately for skeleton state
    if (isWeekChange) {
      setScheduledWorkouts([]);
      setTrainingWeek(null);
      setIsFetching(true);
    }

    // Update prev week ref
    prevWeekRef.current = weekStartISO;

    // Debounce the actual fetch (but not on initial load)
    if (isWeekChange) {
      debounceTimerRef.current = setTimeout(() => {
        loadWeek();
      }, WEEK_FETCH_DEBOUNCE);
    } else {
      // Initial load - no debounce
      loadWeek();
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [weekStartISO, athleteId]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    scheduledWorkouts,
    isLoading, // True only on initial load
    isFetching, // True during any fetch (including week changes)
    error,
    addWorkout,
    removeWorkout,
    toggleComplete,
    refetch: loadWeek,
  };
}

// API workout creation payload
export interface CreateWorkoutPayload {
  slug: string;
  name: string;
  description?: string;
  durationSeconds: number;
  durationCategory: 'SHORT' | 'MEDIUM' | 'LONG';
  tssPlanned?: number;
  ifPlanned?: number;
  structure: unknown;
  categoryId: string;
  coachId?: string;
  workoutType?: string;
}

// API workout response (full details including id)
export interface ApiWorkoutResponse extends ApiWorkout {
  coachId: string | null;
}

// Hook to fetch workouts from API
export function useWorkoutsAPI() {
  const [workouts, setWorkouts] = useState<ApiWorkout[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [workoutsData, categoriesData] = await Promise.all([
        api.get<ApiWorkout[]>('/api/workouts'),
        api.get<{ id: string; name: string; slug: string }[]>('/api/workouts/categories'),
      ]);
      setWorkouts(workoutsData);
      setCategories(categoriesData);
    } catch (err) {
      console.error('Failed to fetch workouts:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetchCategories = useCallback(async () => {
    try {
      const categoriesData = await api.get<{ id: string; name: string; slug: string }[]>('/api/workouts/categories');
      setCategories(categoriesData);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  }, []);

  return { workouts, categories, isLoading, refetchCategories };
}

// Create a new workout
export async function createWorkout(payload: CreateWorkoutPayload): Promise<ApiWorkoutResponse> {
  return api.post<ApiWorkoutResponse>('/api/workouts', payload);
}

// Update an existing workout
export async function updateWorkout(id: string, payload: Partial<CreateWorkoutPayload>): Promise<ApiWorkoutResponse> {
  return api.put<ApiWorkoutResponse>(`/api/workouts/${id}`, payload);
}

// Delete a workout
export async function deleteWorkout(id: string): Promise<void> {
  return api.delete(`/api/workouts/${id}`);
}

// Interface matching the API response for athlete settings
// Note: API uses "available" while frontend type uses "isAvailable"
interface ApiAvailabilityDay {
  id: string;
  dayIndex: number;
  available: boolean;
  timeSlots: string[];
  maxHours: number;
  notes: string | null;
  athleteId: string;
}

interface ApiGoal {
  id: string;
  name: string;
  eventDate: string | null;
  priority: 'A' | 'B' | 'C';
  eventType: string | null;
  targetDuration: string | null;
  notes: string | null;
}

interface ApiAthleteSettings {
  id: string;
  availability: ApiAvailabilityDay[];
  goals: ApiGoal[];
}

// Hook to fetch coach's own workouts
export function useCoachWorkoutsAPI(coachId: string | undefined) {
  const [workouts, setWorkouts] = useState<ApiWorkout[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!coachId) {
      setIsLoading(false);
      return;
    }

    try {
      const workoutsData = await api.get<ApiWorkout[]>(`/api/workouts?coachId=${coachId}`);
      setWorkouts(workoutsData);
    } catch (err) {
      console.error('[useCoachWorkoutsAPI] Failed to fetch coach workouts:', err);
    } finally {
      setIsLoading(false);
    }
  }, [coachId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { workouts, isLoading, refetch: fetchData };
}

// Hook to fetch a single workout by ID
export function useWorkoutById(workoutId: string | undefined) {
  const [workout, setWorkout] = useState<ApiWorkoutResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchWorkout = async () => {
      if (!workoutId || workoutId === 'new') {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const data = await api.get<ApiWorkoutResponse>(`/api/workouts/${workoutId}`);
        setWorkout(data);
      } catch (err) {
        console.error('[useWorkoutById] Failed to fetch workout:', err);
        setError(err instanceof Error ? err : new Error('Failed to load workout'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchWorkout();
  }, [workoutId]);

  return { workout, isLoading, error };
}

// Hook to fetch multiple weeks for monthly view
export function useCalendarMonthAPI({
  athleteId,
  startDate,
  endDate,
}: {
  athleteId: string | undefined;
  startDate: Date;
  endDate: Date;
}) {
  const [weeks, setWeeks] = useState<Array<{
    id: string;
    weekStart: string;
    scheduledWorkouts: Array<{
      id: string;
      dayIndex: number;
      sortOrder: number;
      workout: {
        id: string;
        name: string;
        durationSeconds: number;
        tssPlanned: number | null;
        ifPlanned: number | null;
      };
    }>;
  }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const startDateISO = format(startDate, 'yyyy-MM-dd');
  const endDateISO = format(endDate, 'yyyy-MM-dd');

  const loadWeeks = useCallback(async () => {
    if (!athleteId) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await api.get<typeof weeks>(
        `/api/calendar/weeks/${athleteId}?start=${startDateISO}&end=${endDateISO}`
      ).catch(() => []);

      setWeeks(data || []);
    } catch (err) {
      console.error('Failed to load calendar weeks:', err);
      setError(err instanceof Error ? err : new Error('Failed to load calendar'));
      setWeeks([]);
    } finally {
      setIsLoading(false);
    }
  }, [athleteId, startDateISO, endDateISO]);

  useEffect(() => {
    loadWeeks();
  }, [loadWeeks]);

  // Flatten all workouts from all weeks with their actual dates
  const scheduledWorkouts = useMemo(() => {
    const result: ScheduledWorkout[] = [];

    for (const week of weeks) {
      const weekStartDate = new Date(week.weekStart);

      for (const sw of week.scheduledWorkouts) {
        result.push({
          id: sw.id,
          workoutId: sw.workout.id,
          workout: {
            id: parseInt(sw.workout.id, 10) || 0,
            title: sw.workout.name,
            description: '',
            attributes: {
              structure: { structure: [] },
              totalTimePlanned: sw.workout.durationSeconds / 3600,
              tssPlanned: sw.workout.tssPlanned || 0,
              ifPlanned: sw.workout.ifPlanned || 0,
              workoutTypeName: 'Workout',
            },
          },
          dayIndex: sw.dayIndex,
          sortOrder: sw.sortOrder,
          completed: false,
          // Add the actual date for monthly view
          date: addDays(weekStartDate, sw.dayIndex),
        } as ScheduledWorkout & { date: Date });
      }
    }

    return result;
  }, [weeks]);

  return {
    scheduledWorkouts,
    weeks,
    isLoading,
    error,
    refetch: loadWeeks,
  };
}

// Hook to fetch athlete settings (availability and goals)
export function useAthleteSettings(athleteId: string | undefined) {
  const [apiAvailability, setApiAvailability] = useState<ApiAvailabilityDay[]>([]);
  const [apiGoals, setApiGoals] = useState<ApiGoal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      if (!athleteId) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const data = await api.get<ApiAthleteSettings>(`/api/athlete-settings/${athleteId}`);
        setApiAvailability(data.availability || []);
        setApiGoals(data.goals || []);
      } catch (err) {
        console.error('Failed to fetch athlete settings:', err);
        setError(err instanceof Error ? err : new Error('Failed to load settings'));
        // Use empty array - will default to all days available
        setApiAvailability([]);
        setApiGoals([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, [athleteId]);

  // Map API response to frontend type (available -> isAvailable)
  const availability: DayAvailability[] = apiAvailability.map((day) => ({
    dayIndex: day.dayIndex,
    dayName: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][day.dayIndex] || '',
    isAvailable: day.available,
    slots: [],
    maxHours: day.maxHours,
  }));

  // Map API goals to frontend Goal type (eventDate -> date, priority -> type)
  const goals: Goal[] = apiGoals.map((g) => ({
    id: g.id,
    name: g.name,
    type: g.priority,
    date: g.eventDate ? new Date(g.eventDate) : new Date(),
    eventType: g.eventType || undefined,
  }));

  // Calculate unavailable day indices (0-6 where 0=Monday)
  const unavailableDays = apiAvailability
    .filter((day) => !day.available)
    .map((day) => day.dayIndex);

  return { availability, goals, unavailableDays, isLoading, error };
}

// Types for coach calendar
interface CoachCalendarAthlete {
  id: string;
  name: string;
}

interface CoachCalendarWorkout {
  id: string;
  dayIndex: number;
  sortOrder: number;
  completed: boolean;
  date: string;
  athleteId: string;
  athleteName: string;
  workout: {
    id: string;
    name: string;
    durationSeconds: number;
    tssPlanned: number | null;
    ifPlanned: number | null;
    category: {
      id: string;
      name: string;
      slug: string;
    };
  };
}

interface CoachCalendarResponse {
  athletes: CoachCalendarAthlete[];
  workouts: CoachCalendarWorkout[];
}

// Extended scheduled workout with athlete info for coach view
export interface CoachScheduledWorkout extends ScheduledWorkout {
  date: Date;
  athleteId: string;
  athleteName: string;
}

// Hook to fetch coach calendar (aggregated view of all athletes)
export function useCoachCalendarAPI({
  coachId,
  startDate,
  endDate,
  filterAthleteIds,
}: {
  coachId: string | undefined;
  startDate: Date;
  endDate: Date;
  filterAthleteIds?: string[];
}) {
  const [athletes, setAthletes] = useState<CoachCalendarAthlete[]>([]);
  const [scheduledWorkouts, setScheduledWorkouts] = useState<CoachScheduledWorkout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const startDateISO = format(startDate, 'yyyy-MM-dd');
  const endDateISO = format(endDate, 'yyyy-MM-dd');
  const filterParam = filterAthleteIds?.length ? `&athleteIds=${filterAthleteIds.join(',')}` : '';

  const loadData = useCallback(async () => {
    if (!coachId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await api.get<CoachCalendarResponse>(
        `/api/calendar/coach/${coachId}?start=${startDateISO}&end=${endDateISO}${filterParam}`
      );

      setAthletes(data.athletes || []);

      // Convert to frontend format
      const workouts: CoachScheduledWorkout[] = (data.workouts || []).map((w) => ({
        id: w.id,
        workoutId: w.workout.id,
        workout: {
          id: parseInt(w.workout.id, 10) || 0,
          title: w.workout.name,
          description: '',
          attributes: {
            structure: { structure: [] },
            totalTimePlanned: w.workout.durationSeconds / 3600,
            tssPlanned: w.workout.tssPlanned || 0,
            ifPlanned: w.workout.ifPlanned || 0,
            workoutTypeName: w.workout.category?.name || 'Workout',
          },
        },
        dayIndex: w.dayIndex,
        sortOrder: w.sortOrder,
        completed: w.completed,
        date: new Date(w.date),
        athleteId: w.athleteId,
        athleteName: w.athleteName,
      }));

      setScheduledWorkouts(workouts);
    } catch (err) {
      console.error('Failed to load coach calendar:', err);
      setError(err instanceof Error ? err : new Error('Failed to load calendar'));
      setAthletes([]);
      setScheduledWorkouts([]);
    } finally {
      setIsLoading(false);
    }
  }, [coachId, startDateISO, endDateISO, filterParam]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    athletes,
    scheduledWorkouts,
    isLoading,
    error,
    refetch: loadData,
  };
}

// Hook for athlete's own calendar view
export function useAthleteCalendarAPI({
  athleteId,
  startDate,
  endDate,
}: {
  athleteId: string | undefined;
  startDate: Date;
  endDate: Date;
}) {
  const [scheduledWorkouts, setScheduledWorkouts] = useState<AthleteScheduledWorkout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const startDateISO = format(startDate, 'yyyy-MM-dd');
  const endDateISO = format(endDate, 'yyyy-MM-dd');

  const loadData = useCallback(async () => {
    if (!athleteId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await api.get<{
        workouts: Array<{
          id: string;
          dayIndex: number;
          sortOrder: number;
          notes: string | null;
          completed: boolean;
          completedAt: string | null;
          actualDurationSeconds: number | null;
          actualTSS: number | null;
          actualIF: number | null;
          avgPower: number | null;
          avgHeartRate: number | null;
          rpe: number | null;
          feeling: string | null;
          resultNotes: string | null;
          date: string;
          weekStart: string;
          coachName: string | null;
          workout: {
            id: string;
            name: string;
            description: string | null;
            durationSeconds: number;
            tssPlanned: number | null;
            ifPlanned: number | null;
            workoutType: string;
            structure: unknown;
            category: {
              id: string;
              name: string;
              slug: string;
            };
          };
        }>;
      }>(`/api/calendar/athlete/${athleteId}?start=${startDateISO}&end=${endDateISO}`);

      // Convert to frontend format
      const workouts: AthleteScheduledWorkout[] = (data.workouts || []).map((w) => ({
        id: w.id,
        workoutId: w.workout.id,
        workout: {
          id: parseInt(w.workout.id, 10) || 0,
          title: w.workout.name,
          description: w.workout.description || '',
          attributes: {
            structure: (w.workout.structure as WorkoutStructure) || { structure: [] },
            totalTimePlanned: w.workout.durationSeconds / 3600,
            tssPlanned: w.workout.tssPlanned || 0,
            ifPlanned: w.workout.ifPlanned || 0,
            workoutTypeName: w.workout.category?.name || 'Workout',
            workoutType: w.workout.workoutType as 'outdoorCycling' | 'indoorCycling' | 'gymHome' | 'gymFacility' | 'crossTraining' | 'other' | undefined,
          },
        },
        dayIndex: w.dayIndex,
        sortOrder: w.sortOrder,
        notes: w.notes || undefined,
        completed: w.completed,
        completedAt: w.completedAt || undefined,
        actualDurationSeconds: w.actualDurationSeconds || undefined,
        actualTSS: w.actualTSS || undefined,
        actualIF: w.actualIF || undefined,
        avgPower: w.avgPower || undefined,
        avgHeartRate: w.avgHeartRate || undefined,
        rpe: w.rpe || undefined,
        feeling: w.feeling as AthleteScheduledWorkout['feeling'],
        resultNotes: w.resultNotes || undefined,
        date: w.date,
        weekStart: new Date(w.weekStart),
        coachName: w.coachName,
      }));

      setScheduledWorkouts(workouts);
    } catch (err) {
      console.error('Failed to load athlete calendar:', err);
      setError(err instanceof Error ? err : new Error('Failed to load calendar'));
      setScheduledWorkouts([]);
    } finally {
      setIsLoading(false);
    }
  }, [athleteId, startDateISO, endDateISO]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    scheduledWorkouts,
    isLoading,
    error,
    refetch: loadData,
  };
}

// Submit workout results (athlete completion with actual data)
export async function submitWorkoutResults(
  scheduledWorkoutId: string,
  results: WorkoutResults
): Promise<ScheduledWorkout> {
  return api.put<ScheduledWorkout>(`/api/calendar/scheduled/${scheduledWorkoutId}/results`, results);
}

// Types for coach dashboard
export interface CoachDashboardOverview {
  totalAthletes: number;
  totalWorkoutsPlanned: number;
  totalWorkoutsCompleted: number;
  overallCompliance: number;
  totalTSSPlanned: number;
  totalTSSCompleted: number;
}

export interface AthleteProgress {
  athleteId: string;
  athleteName: string;
  workoutsPlanned: number;
  workoutsCompleted: number;
  compliance: number;
  plannedTSS: number;
  completedTSS: number;
  plannedHours: number;
  completedHours: number;
  missedWorkouts: number;
  lastWorkoutDate: string | null;
}

export interface CoachDashboardGoal {
  id: string;
  name: string;
  eventDate: string | null;
  priority: 'A' | 'B' | 'C';
  eventType: string | null;
  athleteId: string;
  athleteName: string;
}

interface CoachDashboardResponse {
  overview: CoachDashboardOverview;
  athleteProgress: AthleteProgress[];
  athletesNeedingAttention: AthleteProgress[];
  upcomingGoals: CoachDashboardGoal[];
}

// Hook to fetch coach dashboard data
export function useCoachDashboardAPI({
  coachId,
  weekStart,
}: {
  coachId: string | undefined;
  weekStart: Date;
}) {
  const [data, setData] = useState<CoachDashboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const weekStartISO = format(startOfWeek(weekStart, { weekStartsOn: 1 }), 'yyyy-MM-dd');

  const loadData = useCallback(async () => {
    if (!coachId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await api.get<CoachDashboardResponse>(
        `/api/calendar/coach/${coachId}/dashboard?weekStart=${weekStartISO}`
      );
      setData(response);
    } catch (err) {
      console.error('Failed to load coach dashboard:', err);
      setError(err instanceof Error ? err : new Error('Failed to load dashboard'));
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [coachId, weekStartISO]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    overview: data?.overview || null,
    athleteProgress: data?.athleteProgress || [],
    athletesNeedingAttention: data?.athletesNeedingAttention || [],
    upcomingGoals: data?.upcomingGoals || [],
    isLoading,
    error,
    refetch: loadData,
  };
}
