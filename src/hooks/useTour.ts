/**
 * useTour - Hook for managing tour state and setup checklist
 *
 * Provides methods to:
 * - Fetch tour state from localStorage (with API fallback when available)
 * - Mark tour as completed/dismissed
 * - Complete checklist items
 * - Check if tour should be shown
 *
 * @module hooks/useTour
 */
import { useState, useCallback, useEffect } from 'react';
import type { TourState, ChecklistItemId } from '../types/tour';

const TOUR_STORAGE_KEY = 'ridepro_tour_state';

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

/**
 * Load tour state from localStorage
 */
function loadTourState(): TourState {
  try {
    const stored = localStorage.getItem(TOUR_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore parse errors
  }
  return {
    tourCompleted: false,
    tourDismissed: false,
    setupChecklistCompleted: [],
  };
}

/**
 * Save tour state to localStorage
 */
function saveTourState(state: TourState): void {
  try {
    localStorage.setItem(TOUR_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage errors
  }
}

export function useTour(options: UseTourOptions = {}): UseTourReturn {
  const { autoFetch = true } = options;

  const [tourState, setTourState] = useState<TourState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchTourState = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Load from localStorage
      const state = loadTourState();
      setTourState(state);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch tour state'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const completeTour = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const newState: TourState = {
        ...(tourState || loadTourState()),
        tourCompleted: true,
      };
      saveTourState(newState);
      setTourState(newState);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to complete tour'));
    } finally {
      setIsLoading(false);
    }
  }, [tourState]);

  const dismissTour = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const newState: TourState = {
        ...(tourState || loadTourState()),
        tourDismissed: true,
      };
      saveTourState(newState);
      setTourState(newState);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to dismiss tour'));
    } finally {
      setIsLoading(false);
    }
  }, [tourState]);

  const completeChecklistItem = useCallback(async (itemId: ChecklistItemId) => {
    setIsLoading(true);
    setError(null);
    try {
      const currentState = tourState || loadTourState();
      const completedItems = currentState.setupChecklistCompleted || [];

      if (!completedItems.includes(itemId)) {
        const newState: TourState = {
          ...currentState,
          setupChecklistCompleted: [...completedItems, itemId],
        };
        saveTourState(newState);
        setTourState(newState);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to complete checklist item'));
    } finally {
      setIsLoading(false);
    }
  }, [tourState]);

  const isItemCompleted = useCallback((itemId: ChecklistItemId): boolean => {
    return tourState?.setupChecklistCompleted?.includes(itemId) ?? false;
  }, [tourState]);

  const shouldShowTour = !tourState?.tourCompleted && !tourState?.tourDismissed;

  const shouldShowChecklist =
    !tourState?.tourCompleted &&
    !tourState?.tourDismissed &&
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
