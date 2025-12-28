/**
 * AthleteCalendarPage - Coach view of an athlete's calendar
 *
 * Shows the athlete's weekly calendar with the workout library sidebar
 * so coaches can drag/drop workouts to assign them. Respects athlete's
 * availability settings and saves workouts to the database.
 *
 * @module pages/AthleteCalendarPage
 */
import { useState, useCallback, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  GridItem,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  HStack,
  VStack,
  Avatar,
  Text,
  IconButton,
  Badge,
  Spinner,
  ButtonGroup,
  Button,
  useColorModeValue,
  useToast,
  useBreakpointValue,
  Input,
  Tooltip,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  FormControl,
  FormLabel,
  Select,
  useDisclosure,
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { startOfWeek, startOfMonth, endOfMonth, startOfWeek as getWeekStart, endOfWeek, addWeeks, subWeeks, format } from 'date-fns';
import { ArrowLeft, Library, User, CalendarDays, CalendarRange, X, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { MonthlyCalendar, MultiWeekCalendar, WorkoutLibrarySidebar, ScheduledWorkoutEditor } from '../components/organisms/Calendar';
import type { ScheduledWorkout } from '../types/calendar';
import type { ApiWorkoutItem } from '../components/organisms/Calendar/WorkoutLibrarySidebar';
import { useCalendarAPI, useCalendarMonthAPI, useWorkoutsAPI, useAthleteSettings } from '../hooks';
import { useUser } from '../contexts/UserContext';
import { api } from '../services/api';
import { relationshipsService, type CoachAthleteListItem } from '../services/relationships';

type CalendarView = 'multiweek' | 'month';

interface AthleteData {
  id: string;
  fullName: string;
  email: string;
  ftp: number | null;
  avatarUrl?: string;
}

export function AthleteCalendarPage() {
  const { athleteId } = useParams<{ athleteId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useUser();

  const [athlete, setAthlete] = useState<AthleteData | null>(null);
  const [isLoadingAthlete, setIsLoadingAthlete] = useState(true);
  const [selectedWorkout, setSelectedWorkout] = useState<ApiWorkoutItem | null>(null);
  const [editingWorkout, setEditingWorkout] = useState<ScheduledWorkout | null>(null);
  const [mobileTabIndex, setMobileTabIndex] = useState(0);
  const [undoStack, setUndoStack] = useState<Array<{ workoutId: string; absoluteDayIndex: number; title: string }>>([]);
  const toast = useToast();

  // View mode toggle (multi-week vs month)
  const [viewMode, setViewMode] = useState<CalendarView>('multiweek');

  // Week state - controlled by parent
  const [weekStart, setWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );

  // Month state for monthly view
  const [currentMonth, setCurrentMonth] = useState(() => new Date());

  const isMobile = useBreakpointValue({ base: true, lg: false });
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const headerBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const tabBg = useColorModeValue('white', 'gray.800'); // For mobile tabs

  // Compare modal state
  const { isOpen: isCompareModalOpen, onOpen: onOpenCompareModal, onClose: onCloseCompareModal } = useDisclosure();
  const [compareAthletes, setCompareAthletes] = useState<CoachAthleteListItem[]>([]);
  const [selectedCompareAthleteId, setSelectedCompareAthleteId] = useState<string>('');

  // Fetch coach's athletes for comparison
  useEffect(() => {
    if (user?.id) {
      relationshipsService.getAthletesForCoach(user.id, 'ACTIVE')
        .then(athletes => {
          // Filter out current athlete from the list
          setCompareAthletes(athletes.filter(a => a.athlete.id !== athleteId));
        })
        .catch(console.error);
    }
  }, [user?.id, athleteId]);

  // Fetch athlete data
  useEffect(() => {
    const fetchAthlete = async () => {
      if (!athleteId) return;

      setIsLoadingAthlete(true);
      try {
        const data = await api.get<AthleteData>(`/api/users/${athleteId}/public`);
        setAthlete(data);
      } catch (err) {
        console.error('Failed to fetch athlete:', err);
        toast({
          title: t('common.error'),
          description: t('coach.athleteNotFound'),
          status: 'error',
          duration: 3000,
        });
        navigate('/coach');
      } finally {
        setIsLoadingAthlete(false);
      }
    };

    fetchAthlete();
  }, [athleteId, navigate, toast, t]);

  // Calendar API - persists scheduled workouts to database
  const {
    scheduledWorkouts,
    isLoading: isLoadingCalendar,
    isFetching: isFetchingCalendar,
    addWorkout,
    removeWorkout,
    moveWorkout,
    copyWorkout,
    modifyWorkoutStructure,
    resetWorkoutStructure,
  } = useCalendarAPI({
    athleteId,
    weekStart,
    coachId: user?.id,
  });

  // Workouts API - fetches available workouts from database
  const {
    workouts: apiWorkouts,
    categories: apiCategories,
    isLoading: isLoadingWorkouts,
  } = useWorkoutsAPI();

  // Athlete settings - availability and goals
  const {
    availability,
    unavailableDays,
    isLoading: isLoadingSettings,
  } = useAthleteSettings(athleteId);

  // Multi-week calendar API - fetches 12 weeks of data for multi-week view
  const multiWeekStart = useMemo(() => weekStart, [weekStart]);
  const multiWeekEnd = useMemo(() => endOfWeek(addWeeks(weekStart, 11), { weekStartsOn: 1 }), [weekStart]);
  const {
    scheduledWorkouts: multiWeekWorkouts,
    weekLoadingStates,
    isFetching: isFetchingMultiWeek,
    refetch: refetchMultiWeek,
  } = useCalendarMonthAPI({
    athleteId,
    startDate: multiWeekStart,
    endDate: multiWeekEnd,
  });

  // Monthly calendar API - fetches multiple weeks for month view
  const monthStart = useMemo(() => startOfMonth(currentMonth), [currentMonth]);
  const monthEnd = useMemo(() => endOfMonth(currentMonth), [currentMonth]);
  const { scheduledWorkouts: monthlyWorkouts } = useCalendarMonthAPI({
    athleteId,
    startDate: getWeekStart(monthStart, { weekStartsOn: 1 }),
    endDate: endOfWeek(monthEnd, { weekStartsOn: 1 }),
  });

  // Convert availability to dayCapacities format for WeeklyCalendar
  const dayCapacities = availability.map((day) => ({
    dayIndex: day.dayIndex,
    maxHours: day.maxHours,
  }));

  // Handle scheduling a workout via drag/drop or mobile tap
  const handleScheduleWorkout = useCallback(async (workoutId: string, absoluteDayIndex: number) => {
    // Convert absolute day index to week + relative day index
    const weekOffset = Math.floor(absoluteDayIndex / 7);
    const relativeDayIndex = absoluteDayIndex % 7;

    // Check if day is available
    if (unavailableDays.includes(relativeDayIndex)) {
      toast({
        title: t('calendar.dayUnavailable'),
        description: t('calendar.cannotScheduleUnavailable'),
        status: 'warning',
        duration: 2000,
      });
      return;
    }

    try {
      // Calculate the target week
      const targetWeekStart = addWeeks(weekStart, weekOffset);
      const targetWeekISO = format(targetWeekStart, 'yyyy-MM-dd');

      // Get or create training week (fetch first to avoid 500 errors)
      let weekResponse: {id: string};
      try {
        // Try to fetch existing week first
        weekResponse = await api.get<{id: string}>(`/api/calendar/week/${athleteId}?weekStart=${targetWeekISO}`);
      } catch {
        // Week doesn't exist, create it
        try {
          weekResponse = await api.post<{id: string}>('/api/calendar/week', {
            athleteId,
            weekStart: targetWeekISO,
            coachId: user?.id,
          });
        } catch {
          // Race condition: another request created it, fetch again
          weekResponse = await api.get<{id: string}>(`/api/calendar/week/${athleteId}?weekStart=${targetWeekISO}`);
        }
      }

      // Add workout to the correct week with relative day index
      await api.post('/api/calendar/scheduled', {
        trainingWeekId: weekResponse.id,
        workoutId,
        dayIndex: relativeDayIndex,
        sortOrder: 0,
      });

      // Refetch multi-week data to show the new workout
      refetchMultiWeek();

      const workout = apiWorkouts.find(w => w.id === workoutId);
      toast({
        title: t('calendar.workoutScheduled'),
        description: t('calendar.addedToCalendar', { name: workout?.name || 'Workout' }),
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (err) {
      console.error('Failed to schedule workout:', err);
      toast({
        title: t('common.error'),
        description: t('calendar.failedToSchedule'),
        status: 'error',
        duration: 3000,
      });
    }

    setSelectedWorkout(null);
    if (isMobile) {
      setMobileTabIndex(1);
    }
  }, [weekStart, athleteId, user, refetchMultiWeek, apiWorkouts, unavailableDays, toast, isMobile, t]);

  // Perform undo of last removed workout
  const performUndo = useCallback(async () => {
    if (undoStack.length === 0) return;

    const lastRemoved = undoStack[undoStack.length - 1];

    try {
      // Convert absolute day index to week + relative day index
      const weekOffset = Math.floor(lastRemoved.absoluteDayIndex / 7);
      const relativeDayIndex = lastRemoved.absoluteDayIndex % 7;

      // Calculate the target week
      const targetWeekStart = addWeeks(weekStart, weekOffset);
      const targetWeekISO = format(targetWeekStart, 'yyyy-MM-dd');

      // Get or create training week (fetch first to avoid 500 errors)
      let weekResponse: {id: string};
      try {
        // Try to fetch existing week first
        weekResponse = await api.get<{id: string}>(`/api/calendar/week/${athleteId}?weekStart=${targetWeekISO}`);
      } catch {
        // Week doesn't exist, create it
        try {
          weekResponse = await api.post<{id: string}>('/api/calendar/week', {
            athleteId,
            weekStart: targetWeekISO,
            coachId: user?.id,
          });
        } catch {
          // Race condition: another request created it, fetch again
          weekResponse = await api.get<{id: string}>(`/api/calendar/week/${athleteId}?weekStart=${targetWeekISO}`);
        }
      }

      // Re-add workout to the correct week with relative day index
      await api.post('/api/calendar/scheduled', {
        trainingWeekId: weekResponse.id,
        workoutId: lastRemoved.workoutId,
        dayIndex: relativeDayIndex,
        sortOrder: 0,
      });

      // Refetch multi-week data
      refetchMultiWeek();

      // Remove from undo stack
      setUndoStack(prev => prev.slice(0, -1));

      toast({
        title: t('calendar.workoutRestored'),
        description: lastRemoved.title,
        status: 'success',
        duration: 2000,
      });
    } catch (err) {
      console.error('Failed to undo remove:', err);
      toast({
        title: t('common.error'),
        description: t('calendar.failedToRestore'),
        status: 'error',
        duration: 3000,
      });
    }
  }, [undoStack, weekStart, athleteId, user, refetchMultiWeek, toast, t]);

  // Keyboard shortcut: CMD/CTRL + Z to undo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for CMD (Mac) or CTRL (Windows/Linux) + Z
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        // Prevent default browser undo
        e.preventDefault();

        // Perform our undo
        if (undoStack.length > 0) {
          performUndo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undoStack, performUndo]);

  // Handle removing a workout with undo mechanism
  const handleRemoveWorkout = useCallback(async (scheduledId: string) => {
    // Find the workout being removed
    const workoutToRemove = multiWeekWorkouts.find(sw => sw.id === scheduledId);
    if (!workoutToRemove) return;

    try {
      // Remove the workout via API
      await api.delete(`/api/calendar/scheduled/${scheduledId}`);

      // Refetch multi-week data
      refetchMultiWeek();

      // Add to undo stack with absolute day index
      const undoItem = {
        workoutId: workoutToRemove.workoutId,
        absoluteDayIndex: workoutToRemove.dayIndex, // Already absolute from useCalendarMonthAPI
        title: workoutToRemove.workout?.title || t('workout.fallbackTitle'),
      };
      setUndoStack(prev => [...prev, undoItem]);

      // Auto-clear from undo stack after 10 seconds
      setTimeout(() => {
        setUndoStack(prev => prev.filter(item => item !== undoItem));
      }, 10000);

      // Show toast with undo button
      toast({
        title: t('calendar.workoutRemoved'),
        description: workoutToRemove.workout?.title || t('workout.fallbackTitle'),
        status: 'warning',
        duration: 5000,
        isClosable: true,
        render: ({ onClose }) => (
          <Box
            color="white"
            p={3}
            bg="orange.500"
            borderRadius="md"
            boxShadow="lg"
          >
            <HStack justify="space-between">
              <VStack align="start" spacing={0}>
                <Text fontWeight="bold">{t('calendar.workoutRemoved')}</Text>
                <Text fontSize="sm">{workoutToRemove.workout?.title || t('workout.fallbackTitle')}</Text>
              </VStack>
              <HStack spacing={2}>
                <Button
                  size="sm"
                  variant="outline"
                  colorScheme="whiteAlpha"
                  onClick={async () => {
                    try {
                      // Re-add the workout using the captured undoItem
                      await addWorkout(undoItem.workoutId, undoItem.dayIndex);

                      // Remove from undo stack
                      setUndoStack(prev => prev.filter(item => item !== undoItem));

                      onClose();
                      toast({
                        title: t('calendar.workoutRestored'),
                        description: undoItem.title,
                        status: 'success',
                        duration: 2000,
                      });
                    } catch (err) {
                      console.error('Failed to undo remove:', err);
                      onClose();
                      toast({
                        title: t('common.error'),
                        description: t('calendar.failedToRestore'),
                        status: 'error',
                        duration: 3000,
                      });
                    }
                  }}
                >
                  {t('common.undo')}
                </Button>
                <IconButton
                  size="sm"
                  variant="ghost"
                  colorScheme="whiteAlpha"
                  aria-label="Close"
                  icon={<X size={16} />}
                  onClick={onClose}
                />
              </HStack>
            </HStack>
          </Box>
        ),
      });
    } catch (err) {
      console.error('Failed to remove workout:', err);
      toast({
        title: t('common.error'),
        description: t('calendar.failedToRemove'),
        status: 'error',
        duration: 3000,
      });
    }
  }, [refetchMultiWeek, multiWeekWorkouts, toast, t]);

  const handleWorkoutClick = useCallback((scheduled: ScheduledWorkout) => {
    console.log('Workout clicked:', scheduled);
    // TODO: Open workout detail modal
  }, []);

  const handleEditWorkout = useCallback((scheduled: ScheduledWorkout) => {
    setEditingWorkout(scheduled);
  }, []);

  // Calculate current day hours (excluding the workout being edited)
  const getCurrentDayHours = useCallback((dayIndex: number, excludeWorkoutId: string) => {
    return scheduledWorkouts
      .filter(sw => sw.dayIndex === dayIndex && sw.id !== excludeWorkoutId)
      .reduce((total, sw) => {
        const duration = sw.durationOverride
          ? sw.durationOverride / 3600
          : sw.workout.attributes?.totalTimePlanned || 0;
        return total + duration;
      }, 0);
  }, [scheduledWorkouts]);

  // Handle moving a scheduled workout to a different day
  const handleMoveWorkout = useCallback(async (scheduledId: string, absoluteTargetDayIndex: number) => {
    const workoutToMove = multiWeekWorkouts.find(sw => sw.id === scheduledId);
    if (!workoutToMove) return;

    // Convert absolute day indices to week + relative day index
    const sourceWeekOffset = Math.floor(workoutToMove.dayIndex / 7);
    const targetWeekOffset = Math.floor(absoluteTargetDayIndex / 7);
    const targetRelativeDayIndex = absoluteTargetDayIndex % 7;

    // Check if day is available
    if (unavailableDays.includes(targetRelativeDayIndex)) {
      toast({
        title: t('calendar.dayUnavailable'),
        description: t('calendar.cannotScheduleUnavailable'),
        status: 'warning',
        duration: 2000,
      });
      return;
    }

    try {
      // If moving within the same week, just update dayIndex
      if (sourceWeekOffset === targetWeekOffset) {
        await api.put(`/api/calendar/scheduled/${scheduledId}`, {
          dayIndex: targetRelativeDayIndex,
        });
      } else {
        // Moving to a different week - delete and recreate
        const targetWeekStart = addWeeks(weekStart, targetWeekOffset);
        const targetWeekISO = format(targetWeekStart, 'yyyy-MM-dd');

        // Get or create target training week (fetch first to avoid 500 errors)
        let weekResponse: {id: string};
        try {
          weekResponse = await api.get<{id: string}>(`/api/calendar/week/${athleteId}?weekStart=${targetWeekISO}`);
        } catch {
          try {
            weekResponse = await api.post<{id: string}>('/api/calendar/week', {
              athleteId,
              weekStart: targetWeekISO,
              coachId: user?.id,
            });
          } catch {
            // Race condition: another request created it, fetch again
            weekResponse = await api.get<{id: string}>(`/api/calendar/week/${athleteId}?weekStart=${targetWeekISO}`);
          }
        }

        // Delete from source week
        await api.delete(`/api/calendar/scheduled/${scheduledId}`);

        // Create in target week
        await api.post('/api/calendar/scheduled', {
          trainingWeekId: weekResponse.id,
          workoutId: workoutToMove.workoutId,
          dayIndex: targetRelativeDayIndex,
          sortOrder: 0,
        });
      }

      // Refetch multi-week data
      refetchMultiWeek();

      toast({
        title: t('calendar.workoutMoved'),
        status: 'success',
        duration: 1500,
        isClosable: true,
      });
    } catch (err) {
      console.error('Failed to move workout:', err);
      toast({
        title: t('common.error'),
        description: t('calendar.failedToMove'),
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  }, [multiWeekWorkouts, weekStart, athleteId, user, refetchMultiWeek, unavailableDays, toast, t]);

  // Handle copying a scheduled workout to a different day (Alt-drag)
  const handleCopyWorkout = useCallback(async (scheduledId: string, absoluteTargetDayIndex: number) => {
    const workoutToCopy = multiWeekWorkouts.find(sw => sw.id === scheduledId);
    if (!workoutToCopy) return;

    // Convert absolute day index to week + relative day index
    const targetWeekOffset = Math.floor(absoluteTargetDayIndex / 7);
    const targetRelativeDayIndex = absoluteTargetDayIndex % 7;

    // Check if day is available
    if (unavailableDays.includes(targetRelativeDayIndex)) {
      toast({
        title: t('calendar.dayUnavailable'),
        description: t('calendar.cannotScheduleUnavailable'),
        status: 'warning',
        duration: 2000,
      });
      return;
    }

    try {
      // Calculate the target week
      const targetWeekStart = addWeeks(weekStart, targetWeekOffset);
      const targetWeekISO = format(targetWeekStart, 'yyyy-MM-dd');

      // Get or create target training week (fetch first to avoid 500 errors)
      let weekResponse: {id: string};
      try {
        weekResponse = await api.get<{id: string}>(`/api/calendar/week/${athleteId}?weekStart=${targetWeekISO}`);
      } catch {
        try {
          weekResponse = await api.post<{id: string}>('/api/calendar/week', {
            athleteId,
            weekStart: targetWeekISO,
            coachId: user?.id,
          });
        } catch {
          // Race condition: another request created it, fetch again
          weekResponse = await api.get<{id: string}>(`/api/calendar/week/${athleteId}?weekStart=${targetWeekISO}`);
        }
      }

      // Create copy in target week
      await api.post('/api/calendar/scheduled', {
        trainingWeekId: weekResponse.id,
        workoutId: workoutToCopy.workoutId,
        dayIndex: targetRelativeDayIndex,
        sortOrder: 0,
      });

      // Refetch multi-week data
      refetchMultiWeek();

      toast({
        title: t('calendar.workoutCopied'),
        status: 'success',
        duration: 1500,
        isClosable: true,
      });
    } catch (err) {
      console.error('Failed to copy workout:', err);
      toast({
        title: t('common.error'),
        description: t('calendar.failedToCopy'),
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  }, [multiWeekWorkouts, weekStart, athleteId, user, refetchMultiWeek, unavailableDays, toast, t]);

  // Mobile: tap workout in library to select it
  const handleMobileWorkoutSelect = useCallback((workout: ApiWorkoutItem) => {
    setSelectedWorkout(workout);
    toast({
      title: t('calendar.selected', { name: workout.name }),
      description: t('calendar.tapDayToSchedule'),
      status: 'info',
      duration: 2000,
      isClosable: true,
    });
    setMobileTabIndex(1);
  }, [toast, t]);

  // Mobile: tap day to place selected workout
  const handleMobileDayTap = useCallback((dayIndex: number) => {
    if (selectedWorkout) {
      handleScheduleWorkout(selectedWorkout.id, dayIndex);
    }
  }, [selectedWorkout, handleScheduleWorkout]);

  // Handle week change from calendar
  const handleWeekChange = useCallback((newWeekStart: Date) => {
    setWeekStart(newWeekStart);
  }, []);

  // Handle month change from monthly calendar
  const handleMonthChange = useCallback((newMonth: Date) => {
    setCurrentMonth(newMonth);
  }, []);

  // Handle clicking a week in monthly view to switch to multi-week view
  const handleWeekClick = useCallback((weekStartDate: Date) => {
    setWeekStart(weekStartDate);
    setViewMode('multiweek');
  }, []);

  // Handle compare with another athlete
  const handleCompareConfirm = useCallback(() => {
    if (!selectedCompareAthleteId || !athleteId) {
      toast({
        title: 'Selection Required',
        description: 'Please select an athlete to compare with',
        status: 'warning',
        duration: 3000,
      });
      return;
    }

    // Navigate to compare page with current athlete on left, selected on right
    navigate(`/coach/compare?left=${athleteId}&right=${selectedCompareAthleteId}`);
    onCloseCompareModal();
  }, [selectedCompareAthleteId, athleteId, navigate, onCloseCompareModal, toast]);

  // Loading state
  const isLoading = isLoadingAthlete || isLoadingCalendar || isLoadingSettings;

  if (isLoading) {
    return (
      <Box h="100vh" bg={bgColor} display="flex" alignItems="center" justifyContent="center">
        <Spinner size="xl" color="brand.500" />
      </Box>
    );
  }

  // Athlete header component - different for mobile/desktop
  const AthleteHeader = () => (
    <HStack
      px={4}
      py={3}
      bg={headerBg}
      borderBottomWidth="1px"
      borderColor={borderColor}
      spacing={{ base: 2, md: 4 }}
    >
      <IconButton
        aria-label={t('common.back')}
        icon={<ArrowLeft size={20} />}
        variant="ghost"
        size="sm"
        onClick={() => navigate('/coach')}
      />
      <Avatar
        name={athlete?.fullName}
        src={athlete?.avatarUrl}
        size="sm"
        icon={<User size={16} />}
      />
      <VStack align="start" spacing={0} flex={1} minW={0}>
        <HStack spacing={1}>
          <Text fontWeight="semibold" fontSize={{ base: 'sm', md: 'md' }} noOfLines={1}>
            {athlete?.fullName}
          </Text>
          <Badge colorScheme="blue" fontSize="2xs" display={{ base: 'none', sm: 'flex' }}>
            {t('coach.athlete')}
          </Badge>
        </HStack>
        <Text fontSize="xs" color="gray.500" display={{ base: 'none', sm: 'block' }}>
          {athlete?.ftp ? `FTP: ${athlete.ftp}W` : athlete?.email}
        </Text>
      </VStack>
      {/* View toggle buttons - desktop only, full labels */}
      <ButtonGroup size="sm" isAttached variant="outline" display={{ base: 'none', lg: 'flex' }}>
        <Button
          leftIcon={<CalendarRange size={16} />}
          colorScheme={viewMode === 'multiweek' ? 'brand' : 'gray'}
          variant={viewMode === 'multiweek' ? 'solid' : 'outline'}
          onClick={() => setViewMode('multiweek')}
        >
          {t('calendar.multiWeekView')}
        </Button>
        <Button
          leftIcon={<CalendarDays size={16} />}
          colorScheme={viewMode === 'month' ? 'brand' : 'gray'}
          variant={viewMode === 'month' ? 'solid' : 'outline'}
          onClick={() => setViewMode('month')}
        >
          {t('calendar.monthView')}
        </Button>
      </ButtonGroup>
      {/* Compare button - desktop only */}
      <Button
        size="sm"
        variant="outline"
        colorScheme="purple"
        leftIcon={<CalendarRange size={16} />}
        onClick={onOpenCompareModal}
        display={{ base: 'none', lg: 'flex' }}
      >
        Compare
      </Button>
    </HStack>
  );

  // Mobile view toggle component - icons only, more compact
  const MobileViewToggle = () => (
    <ButtonGroup size="sm" isAttached variant="outline" w="full">
      <Button
        flex={1}
        leftIcon={<CalendarRange size={16} />}
        colorScheme={viewMode === 'multiweek' ? 'brand' : 'gray'}
        variant={viewMode === 'multiweek' ? 'solid' : 'outline'}
        onClick={() => setViewMode('multiweek')}
      >
        {t('calendar.multiWeek')}
      </Button>
      <Button
        flex={1}
        leftIcon={<CalendarDays size={16} />}
        colorScheme={viewMode === 'month' ? 'brand' : 'gray'}
        variant={viewMode === 'month' ? 'solid' : 'outline'}
        onClick={() => setViewMode('month')}
      >
        {t('calendar.month')}
      </Button>
    </ButtonGroup>
  );

  // Desktop layout
  if (!isMobile) {
    return (
      <Box h="100vh" bg={bgColor} display="flex" flexDirection="column" overflow="hidden">
        <AthleteHeader />

        <Box flex={1} overflow="hidden" px={6} py={6}>
          <Grid templateColumns="280px 1fr" gap={6} h="full">
            <GridItem h="full" overflow="hidden">
              <WorkoutLibrarySidebar
                apiWorkouts={apiWorkouts}
                apiCategories={apiCategories}
                isLoadingApi={isLoadingWorkouts}
              />
            </GridItem>

            <GridItem h="full" display="flex" flexDirection="column">
              {viewMode === 'multiweek' ? (
                <>
                  {/* Calendar Navigation Controls */}
                  <HStack
                    px={4}
                    py={3}
                    bg={headerBg}
                    borderBottomWidth="1px"
                    borderColor={borderColor}
                    spacing={3}
                    justify="space-between"
                  >
                    <HStack spacing={2}>
                      <Tooltip label={t('calendar.previousWeek')} placement="bottom">
                        <IconButton
                          aria-label={t('calendar.previousWeek')}
                          icon={<ChevronLeft size={20} />}
                          size="sm"
                          variant="ghost"
                          onClick={() => setWeekStart(prev => subWeeks(prev, 1))}
                        />
                      </Tooltip>
                      <Tooltip label={t('calendar.nextWeek')} placement="bottom">
                        <IconButton
                          aria-label={t('calendar.nextWeek')}
                          icon={<ChevronRight size={20} />}
                          size="sm"
                          variant="ghost"
                          onClick={() => setWeekStart(prev => addWeeks(prev, 1))}
                        />
                      </Tooltip>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}
                      >
                        {t('calendar.today')}
                      </Button>
                    </HStack>
                    <HStack spacing={2}>
                      <Calendar size={16} />
                      <Input
                        type="date"
                        size="sm"
                        w="150px"
                        value={format(weekStart, 'yyyy-MM-dd')}
                        onChange={(e) => {
                          const selectedDate = new Date(e.target.value);
                          setWeekStart(startOfWeek(selectedDate, { weekStartsOn: 1 }));
                        }}
                      />
                    </HStack>
                  </HStack>

                  {/* Multi-Week Calendar */}
                  <Box flex={1} overflow="hidden" position="relative">
                    <Box position="absolute" top={0} left={0} right={0} bottom={0} overflow="auto">
                      <MultiWeekCalendar
                        scheduledWorkouts={multiWeekWorkouts}
                        onRemoveWorkout={handleRemoveWorkout}
                        onEditWorkout={handleEditWorkout}
                        onWorkoutClick={handleWorkoutClick}
                        onScheduleWorkout={handleScheduleWorkout}
                        onMoveWorkout={handleMoveWorkout}
                        onCopyWorkout={handleCopyWorkout}
                        startWeek={weekStart}
                        weeksCount={12}
                        unavailableDays={unavailableDays}
                        dayCapacities={dayCapacities}
                        weekLoadingStates={weekLoadingStates}
                      />
                    </Box>
                  </Box>
                </>
              ) : (
                <MonthlyCalendar
                  scheduledWorkouts={monthlyWorkouts}
                  month={currentMonth}
                  onMonthChange={handleMonthChange}
                  onWeekClick={handleWeekClick}
                  unavailableDays={unavailableDays}
                />
              )}
            </GridItem>
          </Grid>
        </Box>

        {/* Workout Editor Modal */}
        {editingWorkout && (
          <ScheduledWorkoutEditor
            isOpen={!!editingWorkout}
            onClose={() => setEditingWorkout(null)}
            scheduledWorkout={editingWorkout}
            onModify={async (scheduledId, structure) => {
              await modifyWorkoutStructure(scheduledId, structure);
              refetchMultiWeek(); // Refresh multi-week data to show updated badge
            }}
            onReset={async (scheduledId) => {
              await resetWorkoutStructure(scheduledId);
              refetchMultiWeek(); // Refresh multi-week data to remove badge
            }}
            maxHours={dayCapacities.find(d => d.dayIndex === editingWorkout.dayIndex)?.maxHours}
            currentDayHours={getCurrentDayHours(editingWorkout.dayIndex, editingWorkout.id)}
          />
        )}

        {/* Compare Athletes Modal */}
        <Modal isOpen={isCompareModalOpen} onClose={onCloseCompareModal} size="md" isCentered>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Compare with Another Athlete</ModalHeader>
            <ModalBody>
              <VStack spacing={4} align="stretch">
                <Text fontSize="sm" color="gray.600">
                  Select an athlete to compare calendars side-by-side. This allows you to easily copy workouts between athletes.
                </Text>
                <FormControl>
                  <FormLabel>Select Athlete</FormLabel>
                  <Select
                    placeholder="Choose athlete to compare with"
                    value={selectedCompareAthleteId}
                    onChange={(e) => setSelectedCompareAthleteId(e.target.value)}
                  >
                    {compareAthletes
                      .sort((a, b) => (a.athlete.fullName || a.athlete.email).localeCompare(b.athlete.fullName || b.athlete.email))
                      .map((rel) => (
                        <option key={rel.athlete.id} value={rel.athlete.id}>
                          {rel.athlete.fullName || rel.athlete.email.split('@')[0]}
                          {rel.athlete.ftp && ` - FTP: ${rel.athlete.ftp}W`}
                        </option>
                      ))}
                  </Select>
                </FormControl>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onCloseCompareModal}>
                Cancel
              </Button>
              <Button
                colorScheme="purple"
                onClick={handleCompareConfirm}
                isDisabled={!selectedCompareAthleteId}
              >
                Compare
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Box>
    );
  }

  // Mobile layout with tabs
  return (
    <Box h="100vh" bg={bgColor} display="flex" flexDirection="column" overflow="hidden">
      <AthleteHeader />

      <Tabs
        index={mobileTabIndex}
        onChange={setMobileTabIndex}
        isFitted
        variant="enclosed"
        colorScheme="brand"
        display="flex"
        flexDirection="column"
        flex={1}
        overflow="hidden"
      >
        <TabList px={2} pt={2} bg={tabBg} flexShrink={0}>
          <Tab gap={2}>
            <Library size={16} />
            {t('library.title')}
          </Tab>
          <Tab gap={2}>
            <CalendarRange size={16} />
            {t('nav.calendar')}
            {selectedWorkout && (
              <Box
                as="span"
                ml={1}
                px={2}
                py={0.5}
                bg="brand.500"
                color="white"
                borderRadius="full"
                fontSize="xs"
              >
                1
              </Box>
            )}
          </Tab>
        </TabList>

        <TabPanels flex={1} overflow="hidden">
          <TabPanel p={2} h="full" overflow="hidden">
            <Box h="full">
              <WorkoutLibrarySidebar
                apiWorkouts={apiWorkouts}
                apiCategories={apiCategories}
                isLoadingApi={isLoadingWorkouts}
                onApiWorkoutTap={handleMobileWorkoutSelect}
              />
            </Box>
          </TabPanel>

          <TabPanel p={2} h="full" overflow="hidden" display="flex" flexDirection="column">
            {/* Mobile view toggle */}
            <Box pb={2} flexShrink={0}>
              <MobileViewToggle />
            </Box>

            {viewMode === 'multiweek' && (
              <HStack
                px={2}
                py={2}
                spacing={2}
                justify="space-between"
                flexShrink={0}
              >
                <HStack spacing={1}>
                  <IconButton
                    aria-label={t('calendar.previousWeek')}
                    icon={<ChevronLeft size={18} />}
                    size="xs"
                    variant="ghost"
                    onClick={() => setWeekStart(prev => subWeeks(prev, 1))}
                  />
                  <IconButton
                    aria-label={t('calendar.nextWeek')}
                    icon={<ChevronRight size={18} />}
                    size="xs"
                    variant="ghost"
                    onClick={() => setWeekStart(prev => addWeeks(prev, 1))}
                  />
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}
                  >
                    {t('calendar.today')}
                  </Button>
                </HStack>
                <Input
                  type="date"
                  size="xs"
                  w="120px"
                  value={format(weekStart, 'yyyy-MM-dd')}
                  onChange={(e) => {
                    const selectedDate = new Date(e.target.value);
                    setWeekStart(startOfWeek(selectedDate, { weekStartsOn: 1 }));
                  }}
                />
              </HStack>
            )}

            <Box flex={1} overflow="hidden" position="relative">
              {viewMode === 'multiweek' ? (
                <Box position="absolute" top={0} left={0} right={0} bottom={0} overflow="auto">
                  <Box minW="600px">
                    <MultiWeekCalendar
                      scheduledWorkouts={multiWeekWorkouts}
                      onRemoveWorkout={handleRemoveWorkout}
                      onEditWorkout={handleEditWorkout}
                      onWorkoutClick={handleWorkoutClick}
                      onScheduleWorkout={handleScheduleWorkout}
                      onMoveWorkout={handleMoveWorkout}
                      onCopyWorkout={handleCopyWorkout}
                      startWeek={weekStart}
                      weeksCount={12}
                      unavailableDays={unavailableDays}
                      dayCapacities={dayCapacities}
                      weekLoadingStates={weekLoadingStates}
                    />
                  </Box>
                </Box>
              ) : (
                <MonthlyCalendar
                  scheduledWorkouts={monthlyWorkouts}
                  month={currentMonth}
                  onMonthChange={handleMonthChange}
                  onWeekClick={handleWeekClick}
                  unavailableDays={unavailableDays}
                />
              )}
            </Box>
          </TabPanel>
        </TabPanels>
      </Tabs>

      {/* Workout Editor Modal */}
      {editingWorkout && (
        <ScheduledWorkoutEditor
          isOpen={!!editingWorkout}
          onClose={() => setEditingWorkout(null)}
          scheduledWorkout={editingWorkout}
          onModify={async (scheduledId, structure) => {
            await modifyWorkoutStructure(scheduledId, structure);
            refetchMultiWeek(); // Refresh multi-week data to show updated badge
          }}
          onReset={async (scheduledId) => {
            await resetWorkoutStructure(scheduledId);
            refetchMultiWeek(); // Refresh multi-week data to remove badge
          }}
          maxHours={dayCapacities.find(d => d.dayIndex === editingWorkout.dayIndex)?.maxHours}
          currentDayHours={getCurrentDayHours(editingWorkout.dayIndex, editingWorkout.id)}
        />
      )}

      {/* Compare Athletes Modal */}
      <Modal isOpen={isCompareModalOpen} onClose={onCloseCompareModal} size="md" isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Compare with Another Athlete</ModalHeader>
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Text fontSize="sm" color="gray.600">
                Select an athlete to compare calendars side-by-side. This allows you to easily copy workouts between athletes.
              </Text>
              <FormControl>
                <FormLabel>Select Athlete</FormLabel>
                <Select
                  placeholder="Choose athlete to compare with"
                  value={selectedCompareAthleteId}
                  onChange={(e) => setSelectedCompareAthleteId(e.target.value)}
                >
                  {compareAthletes
                    .sort((a, b) => (a.athlete.fullName || a.athlete.email).localeCompare(b.athlete.fullName || b.athlete.email))
                    .map((rel) => (
                      <option key={rel.athlete.id} value={rel.athlete.id}>
                        {rel.athlete.fullName || rel.athlete.email.split('@')[0]}
                        {rel.athlete.ftp && ` - FTP: ${rel.athlete.ftp}W`}
                      </option>
                    ))}
                </Select>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onCloseCompareModal}>
              Cancel
            </Button>
            <Button
              colorScheme="purple"
              onClick={handleCompareConfirm}
              isDisabled={!selectedCompareAthleteId}
            >
              Compare
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
