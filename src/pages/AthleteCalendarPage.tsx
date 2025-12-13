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
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { startOfWeek, startOfMonth, endOfMonth, startOfWeek as getWeekStart, endOfWeek } from 'date-fns';
import { ArrowLeft, Calendar, Library, User, CalendarDays } from 'lucide-react';
import { WeeklyCalendar, MonthlyCalendar, WorkoutLibrarySidebar } from '../components/organisms/Calendar';
import type { ScheduledWorkout } from '../types/calendar';
import type { ApiWorkoutItem } from '../components/organisms/Calendar/WorkoutLibrarySidebar';
import { useCalendarAPI, useCalendarMonthAPI, useWorkoutsAPI, useAthleteSettings } from '../hooks';
import { useUser } from '../contexts/UserContext';
import { api } from '../services/api';

type CalendarView = 'week' | 'month';

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
  const [mobileTabIndex, setMobileTabIndex] = useState(0);
  const toast = useToast();

  // View mode toggle (week vs month)
  const [viewMode, setViewMode] = useState<CalendarView>('week');

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
  const handleScheduleWorkout = useCallback(async (workoutId: string, dayIndex: number) => {
    // Check if day is available
    if (unavailableDays.includes(dayIndex)) {
      toast({
        title: t('calendar.dayUnavailable'),
        description: t('calendar.cannotScheduleUnavailable'),
        status: 'warning',
        duration: 2000,
      });
      return;
    }

    try {
      const scheduled = await addWorkout(workoutId, dayIndex);
      if (scheduled) {
        const workout = apiWorkouts.find(w => w.id === workoutId);
        toast({
          title: t('calendar.workoutScheduled'),
          description: t('calendar.addedToCalendar', { name: workout?.name || 'Workout' }),
          status: 'success',
          duration: 2000,
          isClosable: true,
        });
      }
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
  }, [addWorkout, apiWorkouts, unavailableDays, toast, isMobile, t]);

  // Handle removing a workout
  const handleRemoveWorkout = useCallback(async (scheduledId: string) => {
    try {
      await removeWorkout(scheduledId);
      toast({
        title: t('calendar.workoutRemoved'),
        status: 'info',
        duration: 1500,
        isClosable: true,
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
  }, [removeWorkout, toast, t]);

  const handleWorkoutClick = useCallback((scheduled: ScheduledWorkout) => {
    console.log('Workout clicked:', scheduled);
    // TODO: Open workout detail modal
  }, []);

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

  // Handle clicking a week in monthly view to switch to weekly view
  const handleWeekClick = useCallback((weekStartDate: Date) => {
    setWeekStart(weekStartDate);
    setViewMode('week');
  }, []);

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
          leftIcon={<Calendar size={16} />}
          colorScheme={viewMode === 'week' ? 'brand' : 'gray'}
          variant={viewMode === 'week' ? 'solid' : 'outline'}
          onClick={() => setViewMode('week')}
        >
          {t('calendar.weekView')}
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
    </HStack>
  );

  // Mobile view toggle component - icons only, more compact
  const MobileViewToggle = () => (
    <ButtonGroup size="sm" isAttached variant="outline" w="full">
      <Button
        flex={1}
        leftIcon={<Calendar size={16} />}
        colorScheme={viewMode === 'week' ? 'brand' : 'gray'}
        variant={viewMode === 'week' ? 'solid' : 'outline'}
        onClick={() => setViewMode('week')}
      >
        {t('calendar.weekView')}
      </Button>
      <Button
        flex={1}
        leftIcon={<CalendarDays size={16} />}
        colorScheme={viewMode === 'month' ? 'brand' : 'gray'}
        variant={viewMode === 'month' ? 'solid' : 'outline'}
        onClick={() => setViewMode('month')}
      >
        {t('calendar.monthView')}
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

            <GridItem h="full" overflow="auto">
              {viewMode === 'week' ? (
                <WeeklyCalendar
                  scheduledWorkouts={scheduledWorkouts}
                  onRemoveWorkout={handleRemoveWorkout}
                  onWorkoutClick={handleWorkoutClick}
                  onScheduleWorkout={handleScheduleWorkout}
                  weekStart={weekStart}
                  onWeekChange={handleWeekChange}
                  unavailableDays={unavailableDays}
                  dayCapacities={dayCapacities}
                  isLoading={isFetchingCalendar}
                />
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
            <Calendar size={16} />
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

            <Box flex={1} overflow="auto">
              {viewMode === 'week' ? (
                <Box minW="600px" h="full">
                  <WeeklyCalendar
                    scheduledWorkouts={scheduledWorkouts}
                    onRemoveWorkout={handleRemoveWorkout}
                    onWorkoutClick={handleWorkoutClick}
                    onScheduleWorkout={handleScheduleWorkout}
                    onDayTap={selectedWorkout ? handleMobileDayTap : undefined}
                    selectedWorkoutName={selectedWorkout?.name}
                    weekStart={weekStart}
                    onWeekChange={handleWeekChange}
                    unavailableDays={unavailableDays}
                    dayCapacities={dayCapacities}
                    isLoading={isFetchingCalendar}
                  />
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
    </Box>
  );
}
