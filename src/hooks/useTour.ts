/**
 * useTour - Hook for managing tour state and setup checklist
 *
 * Provides methods to:
 * - Fetch tour state from API
 * - Mark tour as completed/dismissed
 * - Complete checklist items
 * - Check if tour should be shown
 *
 * @module hooks/useTour
 */
import { useState, useCallback, useEffect } from 'react';
import { useAuthenticatedApi } from './useAuthenticatedApi';
import type { TourState, ChecklistItemId } from '../types/tour';

interface UseTourOptions {
  /**
   * Whether to auto-fetch tour state on mount
   * @default true
   */
  autoFetch?: boolean;
}

interface UseTourReturn {
  /** Current tour state */
  tourState: TourState | null;
  /** Whether data is loading */
  isLoading: boolean;
  /** Error if any */
  error: Error | null;
  /** Whether to show the tour (not completed and not dismissed) */
  shouldShowTour: boolean;
  /** Whether to show the checklist (some items incomplete) */
  shouldShowChecklist: boolean;
  /** Fetch tour state from API */
  fetchTourState: () => Promise<void>;
  /** Mark tour as completed */
  completeTour: () => Promise<void>;
  /** Dismiss tour (skip without completing) */
  dismissTour: () => Promise<void>;
  /** Complete a checklist item */
  completeChecklistItem: (itemId: ChecklistItemId) => Promise<void>;
  /** Check if a checklist item is completed */
  isItemCompleted: (itemId: ChecklistItemId) => boolean;
}

export function useTour(options: UseTourOptions = {}): UseTourReturn {
  const { autoFetch = true } = options;
  const api = useAuthenticatedApi();

  const [tourState, setTourState] = useState<TourState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchTourState = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const state = await api.get<TourState>('/api/users/me/tour');
      setTourState(state);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch tour state'));
    } finally {
      setIsLoading(false);
    }
  }, [api]);

  const completeTour = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const state = await api.put<TourState>('/api/users/me/tour', {
        tourCompleted: true,
      });
      setTourState(state);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to complete tour'));
    } finally {
      setIsLoading(false);
    }
  }, [api]);

  const dismissTour = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const state = await api.put<TourState>('/api/users/me/tour', {
        tourDismissed: true,
      });
      setTourState(state);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to dismiss tour'));
    } finally {
      setIsLoading(false);
    }
  }, [api]);

  const completeChecklistItem = useCallback(async (itemId: ChecklistItemId) => {
    setIsLoading(true);
    setError(null);
    try {
      const state = await api.post<TourState>(`/api/users/me/tour/checklist/${itemId}`);
      setTourState(state);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to complete checklist item'));
    } finally {
      setIsLoading(false);
    }
  }, [api]);

  const isItemCompleted = useCallback((itemId: ChecklistItemId): boolean => {
    return tourState?.setupChecklistCompleted?.includes(itemId) ?? false;
  }, [tourState]);

  const shouldShowTour = !tourState?.tourCompleted && !tourState?.tourDismissed;

  const shouldShowChecklist =
    !tourState?.tourCompleted &&
    (tourState?.setupChecklistCompleted?.length ?? 0) < 4;

  useEffect(() => {
    if (autoFetch) {
      fetchTourState();
    }
  }, [autoFetch, fetchTourState]);

  return {
    tourState,
    isLoading,
    error,
    shouldShowTour,
    shouldShowChecklist,
    fetchTourState,
    completeTour,
    dismissTour,
    completeChecklistItem,
    isItemCompleted,
  };
}
