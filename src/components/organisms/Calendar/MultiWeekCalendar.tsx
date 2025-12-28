import { useMemo } from 'react';
import {
  Box,
  VStack,
  Text,
  useColorModeValue,
  HStack,
  IconButton,
  Tooltip,
  Badge,
  Spinner,
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import {
  startOfWeek,
  addWeeks,
  format,
  isToday,
  addDays,
} from 'date-fns';
import { Copy } from 'lucide-react';
import { DayColumn } from './DayColumn';
import type { ScheduledWorkout, DayColumn as DayColumnType } from '../../../types/calendar';
import type { DayCapacity } from './WeeklyCalendar';
import type { AthleteColorScheme } from '../../../utils/athleteColors';

interface MultiWeekCalendarProps {
  scheduledWorkouts: ScheduledWorkout[];
  athleteId?: string; // ID of the athlete this calendar belongs to (for cross-calendar copy detection)
  onRemoveWorkout: (scheduledId: string) => void;
  onEditWorkout?: (scheduled: ScheduledWorkout) => void;
  onWorkoutClick: (scheduled: ScheduledWorkout) => void;
  onScheduleWorkout: (workoutId: string, dayIndex: number) => void;
  onMoveWorkout?: (scheduledId: string, targetDayIndex: number) => void;
  onCopyWorkout?: (scheduledId: string, targetDayIndex: number) => void;
  onCopyWeek?: (weekStartISO: string, weekLabel: string, workoutCount: number) => void; // Initiate week copy (source)
  onPasteWeek?: (targetWeekISO: string, targetWeekLabel: string, targetWorkoutCount: number) => void; // Paste week (target)
  copyWeekTooltip?: string; // Tooltip text for the copy week button
  isPasteMode?: boolean; // Whether this calendar is in paste mode (ready to receive a week)
  pasteSourceWeekISO?: string; // The source week being copied (for highlighting)
  pastingWeeks?: Set<string>; // Set of week ISO dates currently being pasted (loading state)
  startWeek: Date; // The first week to show
  weeksCount?: number; // Number of weeks to display (default: 3)
  unavailableDays?: number[];
  dayCapacities?: DayCapacity[];
  weekLoadingStates?: Map<string, boolean>; // Map of week ISO date -> is loading
  athleteColorMap?: Map<string, AthleteColorScheme>;
}

export function MultiWeekCalendar({
  scheduledWorkouts,
  athleteId,
  onRemoveWorkout,
  onEditWorkout,
  onWorkoutClick,
  onScheduleWorkout,
  onMoveWorkout,
  onCopyWorkout,
  onCopyWeek,
  onPasteWeek,
  copyWeekTooltip,
  isPasteMode = false,
  pasteSourceWeekISO,
  pastingWeeks,
  startWeek,
  weeksCount = 3,
  unavailableDays = [],
  dayCapacities = [],
  weekLoadingStates,
  athleteColorMap,
}: MultiWeekCalendarProps) {
  const { t } = useTranslation();
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const weekHeaderBg = useColorModeValue('gray.100', 'gray.800');
  const pasteModeBg = useColorModeValue('blue.50', 'blue.900');
  const pasteModeBorder = useColorModeValue('blue.300', 'blue.600');
  const sourceWeekBg = useColorModeValue('green.50', 'green.900');
  const sourceWeekBorder = useColorModeValue('green.300', 'green.600');

  // Generate array of weeks to display
  const weeks = useMemo(() => {
    const result = [];
    for (let i = 0; i < weeksCount; i++) {
      const weekStart = startOfWeek(addWeeks(startWeek, i), { weekStartsOn: 1 });
      result.push(weekStart);
    }
    return result;
  }, [startWeek, weeksCount]);

  // Group scheduled workouts by date instead of by index
  const workoutsByDate = useMemo(() => {
    const map = new Map<string, ScheduledWorkout[]>();

    scheduledWorkouts.forEach(workout => {
      // Use the workout's actual date if available
      const workoutDate = (workout as any).date;
      if (workoutDate) {
        const dateKey = format(workoutDate, 'yyyy-MM-dd');
        if (!map.has(dateKey)) {
          map.set(dateKey, []);
        }
        map.get(dateKey)!.push(workout);
      }
    });

    return map;
  }, [scheduledWorkouts, weeks]);

  // Create days for a specific week
  const createDaysForWeek = (weekStart: Date): DayColumnType[] => {
    const days: DayColumnType[] = [];

    for (let i = 0; i < 7; i++) {
      const date = addDays(weekStart, i);
      const dateKey = format(date, 'yyyy-MM-dd');
      const dayWorkouts = workoutsByDate.get(dateKey) || [];

      days.push({
        dayIndex: i,
        date,
        dayName: format(date, 'EEE'),
        isToday: isToday(date),
        workouts: dayWorkouts,
      });
    }
    return days;
  };

  return (
    <VStack spacing={0} align="stretch" h="full" overflowY="auto">
      {weeks.map((weekStart, weekIndex) => {
        const days = createDaysForWeek(weekStart);
        const weekLabel = `${format(weekStart, 'MMM d')} - ${format(addDays(weekStart, 6), 'MMM d, yyyy')}`;
        const weekISO = format(weekStart, 'yyyy-MM-dd');

        // Check if this specific week is loading
        const isWeekLoading = weekLoadingStates?.get(weekISO) ?? false;

        // Check if this week is being pasted (copy operation in progress)
        const isPasting = pastingWeeks?.has(weekISO) ?? false;

        // Check if this is the source week or if in paste mode
        const isSourceWeek = weekISO === pasteSourceWeekISO;
        const canPasteHere = isPasteMode && !isSourceWeek;

        return (
          <Box key={weekISO} borderBottomWidth="2px" borderColor={borderColor}>
            {/* Week header */}
            <Box
              bg={isSourceWeek ? sourceWeekBg : weekHeaderBg}
              borderWidth={isSourceWeek ? "2px" : "0"}
              borderColor={isSourceWeek ? sourceWeekBorder : "transparent"}
              px={4}
              py={2}
              borderBottomWidth="1px"
              borderBottomColor={borderColor}
              position="sticky"
              top={0}
              zIndex={10}
              cursor={canPasteHere && !isPasting ? 'pointer' : 'default'}
              _hover={canPasteHere && !isPasting ? {
                bg: pasteModeBg,
                borderWidth: "2px",
                borderColor: pasteModeBorder,
              } : undefined}
              onClick={canPasteHere && !isPasting && onPasteWeek ? () => {
                const weekWorkouts = days.flatMap(day => day.workouts);
                onPasteWeek(weekISO, weekLabel, weekWorkouts.length);
              } : undefined}
            >
              <HStack justify="space-between">
                <HStack spacing={2}>
                  <Text fontSize="sm" fontWeight="semibold">
                    {weekLabel}
                  </Text>
                  {isPasting && (
                    <HStack spacing={1}>
                      <Spinner size="xs" color="blue.500" />
                      <Badge colorScheme="blue" fontSize="xs">
                        {t('athleteComparison.weekActions.pasting')}
                      </Badge>
                    </HStack>
                  )}
                  {!isPasting && isSourceWeek && (
                    <Badge colorScheme="green" fontSize="xs">
                      {t('athleteComparison.weekActions.copying')}
                    </Badge>
                  )}
                  {!isPasting && canPasteHere && (
                    <Text fontSize="xs" color="blue.600" fontWeight="medium">
                      {t('athleteComparison.weekActions.clickToPaste')}
                    </Text>
                  )}
                </HStack>
                {onCopyWeek && !isPasteMode && (
                  <Tooltip label={copyWeekTooltip || t('athleteComparison.weekActions.copyWeek')} placement="top">
                    <IconButton
                      aria-label={t('athleteComparison.weekActions.copyWeek')}
                      icon={<Copy size={16} />}
                      size="xs"
                      variant="ghost"
                      onClick={() => {
                        // Count workouts in this week
                        const weekWorkouts = days.flatMap(day => day.workouts);
                        onCopyWeek(weekISO, weekLabel, weekWorkouts.length);
                      }}
                    />
                  </Tooltip>
                )}
              </HStack>
            </Box>

            {/* Days grid - horizontally scrollable with hidden scrollbar */}
            <Box
              display="flex"
              minH="350px"
              overflowX="auto"
              sx={{
                // Hide scrollbar but allow scrolling
                '&::-webkit-scrollbar': {
                  display: 'none',
                },
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
              }}
            >
              {days.map((day) => {
                // Calculate absolute dayIndex for API calls (relative to first week)
                const absoluteDayIndex = weekIndex * 7 + day.dayIndex;

                return (
                  <Box
                    key={day.dayIndex}
                    flex="1 1 0"
                    minW="140px"
                    borderRightWidth={day.dayIndex < 6 ? '1px' : 0}
                    borderColor={borderColor}
                  >
                    <DayColumn
                      day={day}
                      athleteId={athleteId}
                      onWorkoutClick={onWorkoutClick}
                      onRemoveWorkout={onRemoveWorkout}
                      onEditWorkout={onEditWorkout}
                      onDrop={(workoutId) => onScheduleWorkout(workoutId, absoluteDayIndex)}
                      onMoveWorkout={(scheduledId) => onMoveWorkout?.(scheduledId, absoluteDayIndex)}
                      onCopyWorkout={(scheduledId) => onCopyWorkout?.(scheduledId, absoluteDayIndex)}
                      isUnavailable={unavailableDays.includes(day.dayIndex)}
                      maxHours={dayCapacities.find(c => c.dayIndex === day.dayIndex)?.maxHours}
                      isLoading={isWeekLoading}
                      athleteColorMap={athleteColorMap}
                    />
                  </Box>
                );
              })}
            </Box>
          </Box>
        );
      })}
    </VStack>
  );
}
