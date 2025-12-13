/**
 * UserContext - Role-based user management context
 *
 * Provides user profile data from backend and role capabilities:
 * - isCoach: User has athletes (active coaching relationships)
 * - isAthlete: User has coaches (active athlete relationships)
 *
 * Users can be both coaches AND athletes simultaneously.
 * For development/testing, includes a user switcher to simulate different accounts.
 *
 * @module contexts/UserContext
 */
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import { api, ApiError } from '../services/api';

export interface UserProfile {
  id: string;
  clerkUserId: string | null;
  email: string;
  fullName: string;
  ftp: number | null;
  createdAt: string;
  coachingRelationships: Array<{
    athlete: {
      id: string;
      fullName: string;
      email: string;
      ftp: number | null;
    };
  }>;
  athleteRelationships: Array<{
    coach: {
      id: string;
      fullName: string;
      email: string;
    };
  }>;
}

export interface UserContextValue {
  user: UserProfile | null;
  isLoading: boolean;
  error: Error | null;
  isCoach: boolean;
  isAthlete: boolean;
  // For testing: list of available test users
  availableUsers: UserProfile[];
  // Switch to a different user (for testing)
  switchUser: (userId: string) => void;
  // Current user ID (for testing switcher)
  currentUserId: string | null;
  // Refresh user data
  refetch: () => Promise<void>;
}

const UserContext = createContext<UserContextValue | null>(null);

interface UserProviderProps {
  children: ReactNode;
}

export function UserProvider({ children }: UserProviderProps) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [availableUsers, setAvailableUsers] = useState<UserProfile[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch all users for the switcher (dev mode)
  const fetchAvailableUsers = useCallback(async () => {
    try {
      const users = await api.get<UserProfile[]>('/api/users/list');
      setAvailableUsers(users);
      return users;
    } catch (err) {
      console.warn('Could not fetch users list:', err);
      return [];
    }
  }, []);

  // Fetch a specific user by ID
  const fetchUser = useCallback(async (userId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const userData = await api.get<UserProfile>(`/api/users/${userId}/public`);
      setUser(userData);
      setCurrentUserId(userId);
      localStorage.setItem('ridepro_current_user', userId);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(new Error(err.message));
      } else {
        setError(err as Error);
      }
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Switch to a different user
  const switchUser = useCallback(
    (userId: string) => {
      fetchUser(userId);
    },
    [fetchUser]
  );

  // Refetch current user data
  const refetch = useCallback(async () => {
    if (currentUserId) {
      await fetchUser(currentUserId);
    }
  }, [currentUserId, fetchUser]);

  // Initialize: fetch available users and load saved user or first available
  useEffect(() => {
    const init = async () => {
      const users = await fetchAvailableUsers();

      if (users.length > 0) {
        // Try to restore last selected user
        const savedUserId = localStorage.getItem('ridepro_current_user');
        const userToLoad = savedUserId && users.find((u) => u.id === savedUserId)
          ? savedUserId
          : users[0].id;

        await fetchUser(userToLoad);
      } else {
        setIsLoading(false);
      }
    };

    init();
  }, [fetchAvailableUsers, fetchUser]);

  // Compute role capabilities
  const isCoach = useMemo(
    () => (user?.coachingRelationships?.length ?? 0) > 0,
    [user]
  );

  const isAthlete = useMemo(
    () => (user?.athleteRelationships?.length ?? 0) > 0,
    [user]
  );

  const value = useMemo<UserContextValue>(
    () => ({
      user,
      isLoading,
      error,
      isCoach,
      isAthlete,
      availableUsers,
      switchUser,
      currentUserId,
      refetch,
    }),
    [user, isLoading, error, isCoach, isAthlete, availableUsers, switchUser, currentUserId, refetch]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
