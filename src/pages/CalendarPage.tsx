/**
 * CalendarPage - Training calendar view
 *
 * Shows:
 * - For athletes: their own weekly calendar with scheduled workouts
 * - For coaches: aggregated view of all athletes' workouts with filtering
 *
 * @module pages/CalendarPage
 */
import { useState, useCallback, useMemo } from 'react';
import {
  Box,
  Flex,
  HStack,
  VStack,
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Checkbox,
  Text,
  Badge,
  Circle,
  Wrap,
  WrapItem,
  useColorModeValue,
  useBreakpointValue,
  useToast,
  IconButton,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerCloseButton,
  useDisclosure,
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, Users, Calendar as CalendarIcon, Grid3X3 } from 'lucide-react';
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
} from 'date-fns';
import { WeeklyCalendar, MonthlyCalendar, WorkoutViewerModal } from '../components/organisms/Calendar';
import { Header } from '../components/organisms';
import { useUser } from '../contexts/UserContext';
import { useCoachCalendarAPI, useAthleteCalendarAPI, submitWorkoutResults } from '../hooks/useCalendarAPI';
import type { ScheduledWorkout, WorkoutResults } from '../types/calendar';
import { getAthleteColorScheme, type AthleteColorScheme } from '../utils/athleteColors';

type ViewMode = 'week' | 'month';

export function CalendarPage() {
  const { t } = useTranslation();
  const { user, isCoach } = useUser();
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [month, setMonth] = useState(() => new Date());
  const [selectedAthleteIds, setSelectedAthleteIds] = useState<string[]>([]);
  const toast = useToast();

  // Mobile detection and drawer for athlete filter
  const isMobile = useBreakpointValue({ base: true, md: false });
  const { isOpen: isFilterDrawerOpen, onOpen: onFilterDrawerOpen, onClose: onFilterDrawerClose } = useDisclosure();

  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const headerBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  // Calculate date range based on view mode
  const { startDate, endDate } = useMemo(() => {
    if (viewMode === 'week') {
      return {
        startDate: weekStart,
        endDate: endOfWeek(weekStart, { weekStartsOn: 1 }),
      };
    } else {
      // For month view, get the full range including partial weeks
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      return {
        startDate: startOfWeek(monthStart, { weekStartsOn: 1 }),
        endDate: endOfWeek(monthEnd, { weekStartsOn: 1 }),
      };
    }
  }, [viewMode, weekStart, month]);

  // Fetch coach calendar data
  const {
    athletes,
    scheduledWorkouts: coachWorkouts,
    isLoading,
  } = useCoachCalendarAPI({
    coachId: isCoach ? user?.id : undefined,
    startDate,
    endDate,
    filterAthleteIds: selectedAthleteIds.length > 0 ? selectedAthleteIds : undefined,
  });

  // Filter workouts for weekly view (by dayIndex)
  const weeklyWorkouts = useMemo(() => {
    if (!isCoach) return [];
    return coachWorkouts.map((w) => ({
      ...w,
      // Add athlete name to title for display
      workout: {
        ...w.workout,
        title: `${w.athleteName}: ${w.workout.title}`,
      },
    })) as ScheduledWorkout[];
  }, [coachWorkouts, isCoach]);

  // Convert to monthly format (with date property)
  const monthlyWorkouts = useMemo(() => {
    if (!isCoach) return [];
    return coachWorkouts.map((w) => ({
      ...w,
      workout: {
        ...w.workout,
        title: `${w.athleteName}: ${w.workout.title}`,
      },
    })) as (ScheduledWorkout & { date: Date })[];
  }, [coachWorkouts, isCoach]);

  // Create athlete color map for coach view
  const athleteColorMap = useMemo(() => {
    if (!isCoach || athletes.length === 0) return undefined;
    const colorMap = new Map<string, AthleteColorScheme>();
    athletes.forEach((athlete, index) => {
      colorMap.set(athlete.id, getAthleteColorScheme(index));
    });
    return colorMap;
  }, [athletes, isCoach]);

  const handleWeekChange = useCallback((newWeekStart: Date) => {
    setWeekStart(newWeekStart);
  }, []);

  const handleMonthChange = useCallback((newMonth: Date) => {
    setMonth(newMonth);
  }, []);

  const handleWeekClick = useCallback((clickedWeekStart: Date) => {
    setWeekStart(clickedWeekStart);
    setViewMode('week');
  }, []);

  const handleAthleteToggle = useCallback((athleteId: string) => {
    setSelectedAthleteIds((prev) => {
      if (prev.includes(athleteId)) {
        return prev.filter((id) => id !== athleteId);
      }
      return [...prev, athleteId];
    });
  }, []);

  const handleSelectAllAthletes = useCallback(() => {
    if (selectedAthleteIds.length === athletes.length) {
      setSelectedAthleteIds([]);
    } else {
      setSelectedAthleteIds(athletes.map((a) => a.id));
    }
  }, [athletes, selectedAthleteIds.length]);

  const handleClearFilter = useCallback(() => {
    setSelectedAthleteIds([]);
  }, []);

  // Athlete calendar API
  const {
    scheduledWorkouts: athleteWorkouts,
    isLoading: athleteLoading,
    refetch: refetchAthleteWorkouts,
  } = useAthleteCalendarAPI({
    athleteId: !isCoach ? user?.id : undefined,
    startDate,
    endDate,
  });

  // State for workout viewer modal
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string | null>(null);
  const [isViewerModalOpen, setIsViewerModalOpen] = useState(false);

  // Handle workout click for athlete view
  const handleAthleteWorkoutClick = useCallback((scheduled: ScheduledWorkout) => {
    setSelectedWorkoutId(scheduled.id);
    setIsViewerModalOpen(true);
  }, []);

  // Handle workout result submission (for athlete)
  const handleSubmitResults = useCallback(async (results: WorkoutResults) => {
    if (!selectedWorkoutId) return;

    try {
      await submitWorkoutResults(selectedWorkoutId, results);
      toast({
        title: t('calendar.workoutCompleted') || 'Workout updated!',
        status: 'success',
        duration: 3000,
      });
      refetchAthleteWorkouts();
    } catch (error) {
      console.error('Failed to submit workout results:', error);
      toast({
        title: t('common.error') || 'Error',
        description: t('calendar.submitError') || 'Failed to submit workout results',
        status: 'error',
        duration: 3000,
      });
      throw error;
    }
  }, [selectedWorkoutId, toast, t, refetchAthleteWorkouts]);

  // Convert athlete workouts to ScheduledWorkout format for calendar
  const athleteWeeklyWorkouts = useMemo(() => {
    if (isCoach) return [];
    return athleteWorkouts as ScheduledWorkout[];
  }, [athleteWorkouts, isCoach]);

  // Athlete-only view (non-coach)
  if (!isCoach) {
    return (
      <Box h="100vh" bg={bgColor} display="flex" flexDirection="column" overflow="hidden">
        <Header />

        {/* Toolbar for view mode toggle */}
        <Flex
          bg={headerBg}
          px={6}
          py={3}
          borderBottomWidth="1px"
          borderColor={borderColor}
          justify="space-between"
          align="center"
          flexShrink={0}
        >
          <HStack spacing={2}>
            <Button
              size="sm"
              variant={viewMode === 'week' ? 'solid' : 'ghost'}
              colorScheme={viewMode === 'week' ? 'brand' : undefined}
              leftIcon={<CalendarIcon size={16} />}
              onClick={() => setViewMode('week')}
            >
              {t('calendar.weekView')}
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'month' ? 'solid' : 'ghost'}
              colorScheme={viewMode === 'month' ? 'brand' : undefined}
              leftIcon={<Grid3X3 size={16} />}
              onClick={() => setViewMode('month')}
            >
              {t('calendar.monthView')}
            </Button>
          </HStack>
          <Text fontSize="sm" color="gray.500">
            {t('calendar.myWorkouts') || 'My Workouts'}
          </Text>
        </Flex>

        <Box flex={1} overflow="auto" px={{ base: 0, md: 6 }} py={{ base: 2, md: 6 }}>
          {viewMode === 'week' ? (
            <WeeklyCalendar
              scheduledWorkouts={athleteWeeklyWorkouts}
              weekStart={weekStart}
              onWeekChange={handleWeekChange}
              onRemoveWorkout={() => {}}
              onWorkoutClick={handleAthleteWorkoutClick}
              onScheduleWorkout={() => {}}
              isLoading={athleteLoading}
              isAthleteView={true}
            />
          ) : (
            <MonthlyCalendar
              scheduledWorkouts={athleteWorkouts.map(w => ({
                ...w,
                date: new Date(w.date),
              })) as (ScheduledWorkout & { date: Date })[]}
              month={month}
              onMonthChange={handleMonthChange}
              onWeekClick={handleWeekClick}
            />
          )}
        </Box>

        {/* Workout Viewer Modal (Athlete) */}
        <WorkoutViewerModal
          isOpen={isViewerModalOpen}
          onClose={() => {
            setIsViewerModalOpen(false);
            setSelectedWorkoutId(null);
          }}
          scheduledWorkoutId={selectedWorkoutId}
          isCoachView={false}
          onResultsSubmit={handleSubmitResults}
        />
      </Box>
    );
  }

  // Coach view with filters
  return (
    <Box h="100vh" bg={bgColor} display="flex" flexDirection="column" overflow="hidden">
      <Header />

      {/* Toolbar */}
      <Flex
        bg={headerBg}
        px={{ base: 3, md: 6 }}
        py={3}
        borderBottomWidth="1px"
        borderColor={borderColor}
        justify="space-between"
        align="center"
        flexShrink={0}
        gap={2}
      >
        {/* View Mode Toggle */}
        <HStack spacing={{ base: 1, md: 2 }}>
          <Button
            size="sm"
            variant={viewMode === 'week' ? 'solid' : 'ghost'}
            colorScheme={viewMode === 'week' ? 'brand' : undefined}
            leftIcon={isMobile ? undefined : <CalendarIcon size={16} />}
            onClick={() => setViewMode('week')}
            px={{ base: 2, md: 3 }}
          >
            {isMobile ? <CalendarIcon size={16} /> : t('calendar.weekView')}
          </Button>
          <Button
            size="sm"
            variant={viewMode === 'month' ? 'solid' : 'ghost'}
            colorScheme={viewMode === 'month' ? 'brand' : undefined}
            leftIcon={isMobile ? undefined : <Grid3X3 size={16} />}
            onClick={() => setViewMode('month')}
            px={{ base: 2, md: 3 }}
          >
            {isMobile ? <Grid3X3 size={16} /> : t('calendar.monthView')}
          </Button>
        </HStack>

        {/* Athlete Legend & Filter */}
        <HStack spacing={{ base: 2, md: 4 }}>
          {/* Color Legend - Hidden on mobile */}
          {!isMobile && athletes.length > 0 && (
            <Wrap spacing={2} maxW="400px">
              {athletes.slice(0, 6).map((athlete, index) => (
                <WrapItem key={athlete.id}>
                  <HStack spacing={1}>
                    <Circle size="10px" bg={`${getAthleteColorScheme(index)}.500`} />
                    <Text fontSize="xs" color="gray.600" noOfLines={1} maxW="80px">
                      {athlete.name.split(' ')[0]}
                    </Text>
                  </HStack>
                </WrapItem>
              ))}
              {athletes.length > 6 && (
                <WrapItem>
                  <Text fontSize="xs" color="gray.500">+{athletes.length - 6}</Text>
                </WrapItem>
              )}
            </Wrap>
          )}

          {/* Desktop: Menu dropdown */}
          {!isMobile && (
            <>
              {selectedAthleteIds.length > 0 && (
                <Badge colorScheme="brand" fontSize="sm" px={2} py={1}>
                  {selectedAthleteIds.length} {t('coach.athletes').toLowerCase()}
                </Badge>
              )}
              <Menu closeOnSelect={false}>
                <MenuButton
                  as={Button}
                  size="sm"
                  variant="outline"
                  leftIcon={<Users size={16} />}
                  rightIcon={<ChevronDown size={14} />}
                >
                  {t('coach.athletes')}
                </MenuButton>
                <MenuList maxH="300px" overflowY="auto">
                  <MenuItem onClick={handleSelectAllAthletes}>
                    <Checkbox
                      isChecked={selectedAthleteIds.length === athletes.length && athletes.length > 0}
                      isIndeterminate={selectedAthleteIds.length > 0 && selectedAthleteIds.length < athletes.length}
                      mr={2}
                      onChange={handleSelectAllAthletes}
                    />
                    <Text fontWeight="medium">
                      {selectedAthleteIds.length === athletes.length ? t('common.deselectAll') || 'Deselect All' : t('common.selectAll') || 'Select All'}
                    </Text>
                  </MenuItem>
                  {selectedAthleteIds.length > 0 && (
                    <>
                      <MenuDivider />
                      <MenuItem onClick={handleClearFilter} color="red.500">
                        {t('common.clearFilter') || 'Clear Filter'}
                      </MenuItem>
                    </>
                  )}
                  <MenuDivider />
                  {athletes.map((athlete) => (
                    <MenuItem key={athlete.id} onClick={() => handleAthleteToggle(athlete.id)}>
                      <Checkbox
                        isChecked={selectedAthleteIds.includes(athlete.id)}
                        mr={2}
                        onChange={() => handleAthleteToggle(athlete.id)}
                      />
                      {athlete.name}
                    </MenuItem>
                  ))}
                  {athletes.length === 0 && (
                    <MenuItem isDisabled>
                      <Text color="gray.500" fontSize="sm">
                        {t('coach.noAthletes')}
                      </Text>
                    </MenuItem>
                  )}
                </MenuList>
              </Menu>
            </>
          )}

          {/* Mobile: Filter icon button with badge */}
          {isMobile && (
            <Box position="relative">
              <IconButton
                aria-label={t('coach.filterAthletes') || 'Filter athletes'}
                icon={<Users size={18} />}
                size="sm"
                variant="outline"
                onClick={onFilterDrawerOpen}
              />
              {selectedAthleteIds.length > 0 && (
                <Badge
                  colorScheme="brand"
                  position="absolute"
                  top="-1"
                  right="-1"
                  fontSize="2xs"
                  borderRadius="full"
                  minW="18px"
                  h="18px"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  {selectedAthleteIds.length}
                </Badge>
              )}
            </Box>
          )}
        </HStack>
      </Flex>

      {/* Mobile Filter Drawer */}
      <Drawer isOpen={isFilterDrawerOpen} placement="right" onClose={onFilterDrawerClose}>
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth="1px">
            {t('coach.filterAthletes') || 'Filter Athletes'}
          </DrawerHeader>
          <DrawerBody p={0}>
            <VStack align="stretch" spacing={0}>
              {/* Select All / Clear */}
              <Box
                px={4}
                py={3}
                borderBottomWidth="1px"
                borderColor={borderColor}
                cursor="pointer"
                _hover={{ bg: 'gray.50' }}
                onClick={handleSelectAllAthletes}
              >
                <HStack>
                  <Checkbox
                    isChecked={selectedAthleteIds.length === athletes.length && athletes.length > 0}
                    isIndeterminate={selectedAthleteIds.length > 0 && selectedAthleteIds.length < athletes.length}
                    onChange={handleSelectAllAthletes}
                  />
                  <Text fontWeight="medium">
                    {selectedAthleteIds.length === athletes.length
                      ? t('common.deselectAll') || 'Deselect All'
                      : t('common.selectAll') || 'Select All'}
                  </Text>
                </HStack>
              </Box>

              {selectedAthleteIds.length > 0 && (
                <Box
                  px={4}
                  py={3}
                  borderBottomWidth="1px"
                  borderColor={borderColor}
                  cursor="pointer"
                  _hover={{ bg: 'red.50' }}
                  onClick={handleClearFilter}
                >
                  <Text color="red.500" fontWeight="medium">
                    {t('common.clearFilter') || 'Clear Filter'}
                  </Text>
                </Box>
              )}

              {/* Athlete List */}
              {athletes.map((athlete, index) => (
                <Box
                  key={athlete.id}
                  px={4}
                  py={3}
                  borderBottomWidth="1px"
                  borderColor={borderColor}
                  cursor="pointer"
                  _hover={{ bg: 'gray.50' }}
                  onClick={() => handleAthleteToggle(athlete.id)}
                >
                  <HStack>
                    <Checkbox
                      isChecked={selectedAthleteIds.includes(athlete.id)}
                      onChange={() => handleAthleteToggle(athlete.id)}
                    />
                    <Circle size="10px" bg={`${getAthleteColorScheme(index)}.500`} />
                    <Text>{athlete.name}</Text>
                  </HStack>
                </Box>
              ))}

              {athletes.length === 0 && (
                <Box px={4} py={6} textAlign="center">
                  <Text color="gray.500" fontSize="sm">
                    {t('coach.noAthletes')}
                  </Text>
                </Box>
              )}
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      {/* Calendar View */}
      <Box flex={1} overflow="auto" px={{ base: 0, md: 6 }} py={{ base: 2, md: 6 }}>
        {viewMode === 'week' ? (
          <WeeklyCalendar
            scheduledWorkouts={weeklyWorkouts}
            weekStart={weekStart}
            onWeekChange={handleWeekChange}
            onRemoveWorkout={() => {}}
            onWorkoutClick={(scheduled) => {
              setSelectedWorkoutId(scheduled.id);
              setIsViewerModalOpen(true);
            }}
            onScheduleWorkout={() => {}}
            isLoading={isLoading}
            athleteColorMap={athleteColorMap}
          />
        ) : (
          <MonthlyCalendar
            scheduledWorkouts={monthlyWorkouts}
            month={month}
            onMonthChange={handleMonthChange}
            onWeekClick={handleWeekClick}
            athleteColorMap={athleteColorMap}
          />
        )}
      </Box>

      {/* Workout Viewer Modal (Coach - read-only) */}
      <WorkoutViewerModal
        isOpen={isViewerModalOpen}
        onClose={() => {
          setIsViewerModalOpen(false);
          setSelectedWorkoutId(null);
        }}
        scheduledWorkoutId={selectedWorkoutId}
        isCoachView={true}
      />
    </Box>
  );
}
