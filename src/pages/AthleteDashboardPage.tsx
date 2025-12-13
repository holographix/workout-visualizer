/**
 * AthleteDashboardPage - Bold, Responsive Athlete Dashboard
 *
 * Inspired by Nike, Strava, and WHOOP design patterns:
 * - Supports both light and dark themes
 * - Bold typography with big numbers
 * - Progress rings for at-a-glance stats
 * - Responsive grid: mobile stacked, desktop multi-column
 * - Micro-interactions and animations
 * - Guided tour for new athletes
 *
 * @module pages/AthleteDashboardPage
 */
import { useMemo, useState, useEffect } from 'react';
import { Box, Grid, GridItem, VStack, Spinner, useColorModeValue } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { startOfWeek, endOfWeek, isToday, isPast } from 'date-fns';
import { Header } from '../components/organisms';
import {
  HeroSection,
  TodayWorkoutSpotlight,
  WeeklyStats,
  UpcomingWorkouts,
} from '../components/organisms/Dashboard';
import { AssessmentCard } from '../components/organisms/Assessment';
import { SetupChecklist, DashboardTour } from '../components/organisms/Tour';
import { WorkoutCompletionModal } from '../components/organisms/Calendar';
import { useUser } from '../contexts/UserContext';
import { useAthleteCalendarAPI, useAthleteSettings } from '../hooks/useCalendarAPI';
import { useTour } from '../hooks/useTour';
import type { AthleteScheduledWorkout } from '../types/calendar';

export function AthleteDashboardPage() {
  const navigate = useNavigate();
  const { user } = useUser();

  // Adaptive background - light in light mode, dark in dark mode
  const bgColor = useColorModeValue('gray.50', 'dark.800');

  // Tour state
  const {
    tourState,
    shouldShowTour,
    shouldShowChecklist,
    completeTour,
    dismissTour,
    completeChecklistItem,
    isLoading: tourLoading,
  } = useTour();

  // Only run tour if:
  // 1. User has completed onboarding
  // 2. Tour has not been completed or dismissed
  const [runTour, setRunTour] = useState(false);

  useEffect(() => {
    // Start tour after a short delay to let page render
    if (user?.onboardingCompleted && shouldShowTour && !tourLoading) {
      const timer = setTimeout(() => setRunTour(true), 500);
      return () => clearTimeout(timer);
    }
  }, [user?.onboardingCompleted, shouldShowTour, tourLoading]);

  // Get current week date range
  const weekStart = useMemo(() => startOfWeek(new Date(), { weekStartsOn: 1 }), []);
  const weekEnd = useMemo(() => endOfWeek(new Date(), { weekStartsOn: 1 }), []);

  // Fetch workouts for current week
  const { scheduledWorkouts, isLoading: workoutsLoading, refetch } = useAthleteCalendarAPI({
    athleteId: user?.id,
    startDate: weekStart,
    endDate: weekEnd,
  });

  // Fetch goals
  const { goals, isLoading: settingsLoading } = useAthleteSettings(user?.id);

  // Workout completion modal state
  const [selectedWorkout, setSelectedWorkout] = useState<AthleteScheduledWorkout | null>(null);
  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate stats from workouts
  const stats = useMemo(() => {
    const completed = scheduledWorkouts.filter(w => w.completed);
    const totalPlannedTSS = scheduledWorkouts.reduce((sum, w) => sum + (w.workout.attributes.tssPlanned || 0), 0);
    const completedTSS = completed.reduce((sum, w) => sum + (w.actualTSS || w.workout.attributes.tssPlanned || 0), 0);
    const totalPlannedHours = scheduledWorkouts.reduce((sum, w) => sum + (w.workout.attributes.totalTimePlanned || 0), 0);
    const completedHours = completed.reduce((sum, w) => {
      if (w.actualDurationSeconds) return sum + w.actualDurationSeconds / 3600;
      return sum + (w.workout.attributes.totalTimePlanned || 0);
    }, 0);

    return {
      completedCount: completed.length,
      totalCount: scheduledWorkouts.length,
      completedTSS: Math.round(completedTSS),
      totalPlannedTSS: Math.round(totalPlannedTSS),
      completedHours,
      totalPlannedHours,
    };
  }, [scheduledWorkouts]);

  // Get today's workout
  const todayWorkout = useMemo(() => {
    return scheduledWorkouts.find(w => isToday(new Date(w.date)));
  }, [scheduledWorkouts]);

  // Get upcoming workouts (not today, not completed, not past)
  const upcomingWorkouts = useMemo(() => {
    return scheduledWorkouts
      .filter(w => !w.completed && !isToday(new Date(w.date)) && !isPast(new Date(w.date)))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 5);
  }, [scheduledWorkouts]);

  // Get next goal
  const nextGoal = useMemo(() => {
    const now = new Date();
    return goals
      .filter(g => g.date && new Date(g.date) > now)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
  }, [goals]);

  // Handle workout click - open completion modal
  const handleWorkoutClick = (workout: AthleteScheduledWorkout) => {
    setSelectedWorkout(workout);
    setIsCompletionModalOpen(true);
  };

  // Handle workout completion submission
  const handleWorkoutComplete = async () => {
    setIsSubmitting(true);
    try {
      // The modal handles the actual submission via the onSubmit callback
      setIsCompletionModalOpen(false);
      setSelectedWorkout(null);
      refetch();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle tour completion
  const handleTourComplete = async () => {
    setRunTour(false);
    await completeTour();
  };

  // Handle tour skip
  const handleTourSkip = async () => {
    setRunTour(false);
    await dismissTour();
  };

  // Handle checklist dismiss
  const handleChecklistDismiss = async () => {
    await dismissTour();
  };

  const isLoading = workoutsLoading || settingsLoading;

  if (isLoading) {
    return (
      <Box minH="100vh" bg={bgColor} display="flex" flexDirection="column">
        <Header />
        <Box flex={1} display="flex" alignItems="center" justifyContent="center">
          <Spinner size="xl" color="brand.400" thickness="3px" />
        </Box>
      </Box>
    );
  }

  return (
    <Box minH="100vh" bg={bgColor} display="flex" flexDirection="column">
      <Header />

      {/* Dashboard Tour */}
      <DashboardTour
        run={runTour}
        onComplete={handleTourComplete}
        onSkip={handleTourSkip}
      />

      {/* Main Content - Responsive Layout */}
      <Box
        flex={1}
        px={{ base: 4, md: 6, lg: 8 }}
        py={{ base: 4, md: 6 }}
        maxW="1400px"
        mx="auto"
        w="full"
      >
        {/* Mobile: Stacked layout */}
        <VStack
          spacing={{ base: 4, md: 5 }}
          align="stretch"
          display={{ base: 'flex', lg: 'none' }}
        >
          <HeroSection
            userName={user?.fullName || 'Athlete'}
            nextGoal={nextGoal}
          />

          {/* Setup Checklist - show for new athletes */}
          {shouldShowChecklist && tourState && (
            <Box data-tour="setup-checklist">
              <SetupChecklist
                completedItems={tourState.setupChecklistCompleted || []}
                onDismiss={handleChecklistDismiss}
                onItemComplete={completeChecklistItem}
              />
            </Box>
          )}

          <Box data-tour="today-workout">
            <TodayWorkoutSpotlight
              workout={todayWorkout}
              onStartWorkout={handleWorkoutClick}
              onViewWorkout={handleWorkoutClick}
            />
          </Box>

          <Box data-tour="weekly-stats">
            <WeeklyStats
              completedWorkouts={stats.completedCount}
              totalWorkouts={stats.totalCount}
              completedTSS={stats.completedTSS}
              plannedTSS={stats.totalPlannedTSS}
              completedHours={stats.completedHours}
              plannedHours={stats.totalPlannedHours}
            />
          </Box>

          <Box data-tour="upcoming-workouts">
            <UpcomingWorkouts
              workouts={upcomingWorkouts}
              onWorkoutClick={handleWorkoutClick}
              onViewAll={() => navigate('/calendar')}
            />
          </Box>

          {user && <AssessmentCard athleteId={user.id} />}
        </VStack>

        {/* Desktop: Grid layout with 3 columns */}
        <Grid
          display={{ base: 'none', lg: 'grid' }}
          templateColumns="1fr 1fr 320px"
          templateRows="auto auto 1fr"
          gap={5}
          h="full"
        >
          {/* Hero spans full width */}
          <GridItem colSpan={3}>
            <HeroSection
              userName={user?.fullName || 'Athlete'}
              nextGoal={nextGoal}
            />
          </GridItem>

          {/* Today's Workout - larger on desktop */}
          <GridItem colSpan={2} rowSpan={2} data-tour="today-workout">
            <TodayWorkoutSpotlight
              workout={todayWorkout}
              onStartWorkout={handleWorkoutClick}
              onViewWorkout={handleWorkoutClick}
            />
          </GridItem>

          {/* Setup Checklist + Weekly Stats - right sidebar */}
          <GridItem>
            <VStack spacing={4} align="stretch">
              {/* Setup Checklist - show for new athletes */}
              {shouldShowChecklist && tourState && (
                <Box data-tour="setup-checklist">
                  <SetupChecklist
                    completedItems={tourState.setupChecklistCompleted || []}
                    onDismiss={handleChecklistDismiss}
                    onItemComplete={completeChecklistItem}
                  />
                </Box>
              )}

              <Box data-tour="weekly-stats">
                <WeeklyStats
                  completedWorkouts={stats.completedCount}
                  totalWorkouts={stats.totalCount}
                  completedTSS={stats.completedTSS}
                  plannedTSS={stats.totalPlannedTSS}
                  completedHours={stats.completedHours}
                  plannedHours={stats.totalPlannedHours}
                />
              </Box>
            </VStack>
          </GridItem>

          {/* Upcoming Workouts - right sidebar below stats */}
          <GridItem data-tour="upcoming-workouts">
            <UpcomingWorkouts
              workouts={upcomingWorkouts}
              onWorkoutClick={handleWorkoutClick}
              onViewAll={() => navigate('/calendar')}
            />
          </GridItem>

          {/* Assessment Card - full width below other content */}
          <GridItem colSpan={3}>
            {user && <AssessmentCard athleteId={user.id} />}
          </GridItem>
        </Grid>
      </Box>

      {/* Workout Completion Modal */}
      {selectedWorkout && (
        <WorkoutCompletionModal
          isOpen={isCompletionModalOpen}
          onClose={() => {
            setIsCompletionModalOpen(false);
            setSelectedWorkout(null);
          }}
          workout={selectedWorkout}
          onSubmit={handleWorkoutComplete}
          isSubmitting={isSubmitting}
        />
      )}
    </Box>
  );
}
