import { useMemo } from 'react';
import {
  Box,
  Flex,
  Grid,
  GridItem,
  Heading,
  Text,
  IconButton,
  HStack,
  Circle,
  Tooltip,
  useColorModeValue,
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  format,
  isToday,
  isSameMonth,
  isSameDay,
  getISOWeek,
} from 'date-fns';
import { DatePickerPopover } from '../../molecules/DatePickerPopover';
import type { ScheduledWorkout } from '../../../types/calendar';
import type { AthleteColorScheme } from '../../../utils/athleteColors';

// Extended scheduled workout with date for monthly view
interface ScheduledWorkoutWithDate extends ScheduledWorkout {
  date?: Date;
}

interface MonthlyCalendarProps {
  scheduledWorkouts: ScheduledWorkoutWithDate[]; // Workouts for the entire month (multiple weeks)
  month: Date;
  onMonthChange: (newMonth: Date) => void;
  onWeekClick: (weekStart: Date) => void;
  onDayClick?: (date: Date) => void;
  unavailableDays?: number[]; // Day indices that are unavailable (0-6, 0=Monday)
  weekStartsOnMonday?: boolean;
  athleteColorMap?: Map<string, AthleteColorScheme>; // Map of athleteId to color scheme for coach view
}

interface MonthDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  workoutCount: number;
  totalTSS: number;
  totalHours: number;
  workouts: ScheduledWorkout[];
}

interface MonthWeek {
  weekStart: Date;
  weekNumber: number;
  days: MonthDay[];
  totalWorkouts: number;
  totalTSS: number;
  totalHours: number;
}

const DAY_HEADERS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function MonthlyCalendar({
  scheduledWorkouts,
  month,
  onMonthChange,
  onWeekClick,
  onDayClick,
  unavailableDays = [],
  athleteColorMap,
}: MonthlyCalendarProps) {
  const { t } = useTranslation();

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const headerBg = useColorModeValue('gray.50', 'gray.900');
  const todayBg = useColorModeValue('brand.500', 'brand.400');
  const todayColor = useColorModeValue('white', 'gray.900');
  const dayColor = useColorModeValue('gray.800', 'white');
  const outsideMonthColor = useColorModeValue('gray.400', 'gray.600');
  const weekRowHover = useColorModeValue('gray.50', 'gray.750');
  const weekSummaryBg = useColorModeValue('gray.100', 'gray.700');
  const workoutDotColor = useColorModeValue('brand.500', 'brand.400');
  const unavailableBg = useColorModeValue('gray.100', 'gray.800');
  const unavailableColor = useColorModeValue('gray.400', 'gray.600');

  // Generate weeks for the month view
  const weeks: MonthWeek[] = useMemo(() => {
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const result: MonthWeek[] = [];
    let currentDate = calendarStart;

    while (currentDate <= calendarEnd) {
      const weekStart = currentDate;
      const days: MonthDay[] = [];
      let weekTotalWorkouts = 0;
      let weekTotalTSS = 0;
      let weekTotalHours = 0;

      for (let i = 0; i < 7; i++) {
        const date = addDays(weekStart, i);
        const dayWorkouts = scheduledWorkouts.filter((sw) => {
          // Match by actual date if available, otherwise fall back to dayIndex within same week
          if (sw.date) {
            return isSameDay(sw.date, date);
          }
          return false;
        });

        const dayTSS = dayWorkouts.reduce(
          (sum, w) => sum + (w.workout?.attributes?.tssPlanned || 0),
          0
        );
        const dayHours = dayWorkouts.reduce(
          (sum, w) => sum + (w.workout?.attributes?.totalTimePlanned || 0),
          0
        );

        days.push({
          date,
          isCurrentMonth: isSameMonth(date, month),
          isToday: isToday(date),
          workoutCount: dayWorkouts.length,
          totalTSS: dayTSS,
          totalHours: dayHours,
          workouts: dayWorkouts,
        });

        weekTotalWorkouts += dayWorkouts.length;
        weekTotalTSS += dayTSS;
        weekTotalHours += dayHours;
      }

      result.push({
        weekStart,
        weekNumber: getISOWeek(weekStart),
        days,
        totalWorkouts: weekTotalWorkouts,
        totalTSS: weekTotalTSS,
        totalHours: weekTotalHours,
      });

      currentDate = addDays(currentDate, 7);
    }

    return result;
  }, [month, scheduledWorkouts]);

  const handlePrevMonth = () => onMonthChange(subMonths(month, 1));
  const handleNextMonth = () => onMonthChange(addMonths(month, 1));

  // Handle date picker selection
  const handleDateSelect = (date: Date) => {
    onMonthChange(date);
  };

  return (
    <Box
      bg={bgColor}
      borderRadius="xl"
      borderWidth="1px"
      borderColor={borderColor}
      overflow="hidden"
      display="flex"
      flexDirection="column"
      h="full"
    >
      {/* Header */}
      <Flex
        bg={headerBg}
        px={4}
        py={3}
        borderBottomWidth="1px"
        borderColor={borderColor}
        justify="space-between"
        align="center"
        flexShrink={0}
      >
        <HStack spacing={2}>
          <Calendar size={20} />
          <Heading size="sm">{t('calendar.monthView')}</Heading>
        </HStack>

        <HStack spacing={2}>
          <IconButton
            aria-label={t('calendar.previousMonth')}
            icon={<ChevronLeft size={18} />}
            size="sm"
            variant="ghost"
            onClick={handlePrevMonth}
          />
          <DatePickerPopover
            selectedDate={month}
            onDateSelect={handleDateSelect}
            mode="month"
          >
            <Text
              fontSize="sm"
              fontWeight="medium"
              minW="140px"
              textAlign="center"
              cursor="pointer"
              _hover={{ color: 'brand.500' }}
            >
              {format(month, 'MMMM yyyy')}
            </Text>
          </DatePickerPopover>
          <IconButton
            aria-label={t('calendar.nextMonth')}
            icon={<ChevronRight size={18} />}
            size="sm"
            variant="ghost"
            onClick={handleNextMonth}
          />
        </HStack>
      </Flex>

      {/* Day Headers */}
      <Grid
        templateColumns="60px repeat(7, 1fr)"
        borderBottomWidth="1px"
        borderColor={borderColor}
        bg={headerBg}
      >
        <GridItem p={2} textAlign="center">
          <Text fontSize="xs" fontWeight="medium" color="gray.500">
            {t('calendar.week')}
          </Text>
        </GridItem>
        {DAY_HEADERS.map((day, i) => (
          <GridItem
            key={day}
            p={2}
            textAlign="center"
            borderLeftWidth="1px"
            borderColor={borderColor}
          >
            <Text
              fontSize="xs"
              fontWeight="medium"
              textTransform="uppercase"
              color={unavailableDays.includes(i) ? unavailableColor : 'gray.500'}
            >
              {t(`days.${day.toLowerCase()}`)}
            </Text>
          </GridItem>
        ))}
      </Grid>

      {/* Calendar Grid */}
      <Box flex={1} overflowY="auto">
        {weeks.map((week) => (
          <Grid
            key={week.weekStart.toISOString()}
            templateColumns="60px repeat(7, 1fr)"
            borderBottomWidth="1px"
            borderColor={borderColor}
            cursor="pointer"
            _hover={{ bg: weekRowHover }}
            onClick={() => onWeekClick(week.weekStart)}
            transition="background 0.15s"
          >
            {/* Week Number & Summary */}
            <GridItem
              p={2}
              bg={weekSummaryBg}
              display="flex"
              flexDirection="column"
              justifyContent="center"
              alignItems="center"
            >
              <Text fontSize="xs" fontWeight="bold" color="gray.500">
                W{week.weekNumber}
              </Text>
              {week.totalWorkouts > 0 && (
                <Tooltip
                  label={`${week.totalWorkouts} workouts, ${Math.round(week.totalTSS)} TSS, ${week.totalHours.toFixed(1)}h`}
                  placement="right"
                  hasArrow
                >
                  <Text fontSize="2xs" color="gray.500">
                    {week.totalWorkouts}w
                  </Text>
                </Tooltip>
              )}
            </GridItem>

            {/* Days */}
            {week.days.map((day, dayIndex) => {
              const isUnavailable = unavailableDays.includes(dayIndex);
              return (
                <GridItem
                  key={day.date.toISOString()}
                  p={2}
                  borderLeftWidth="1px"
                  borderColor={borderColor}
                  minH="60px"
                  bg={isUnavailable ? unavailableBg : 'transparent'}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDayClick?.(day.date);
                  }}
                  _hover={!isUnavailable ? { bg: weekRowHover } : undefined}
                >
                  <Flex direction="column" align="center" gap={1}>
                    {/* Date Number */}
                    <Circle
                      size="24px"
                      bg={day.isToday ? todayBg : 'transparent'}
                      color={
                        day.isToday
                          ? todayColor
                          : day.isCurrentMonth
                          ? isUnavailable
                            ? unavailableColor
                            : dayColor
                          : outsideMonthColor
                      }
                    >
                      <Text fontSize="xs" fontWeight={day.isToday ? 'bold' : 'medium'}>
                        {format(day.date, 'd')}
                      </Text>
                    </Circle>

                    {/* Workout Indicators */}
                    {day.workoutCount > 0 && (
                      <Tooltip
                        label={`${day.workoutCount} workout${day.workoutCount > 1 ? 's' : ''}, ${Math.round(day.totalTSS)} TSS`}
                        placement="top"
                        hasArrow
                      >
                        <HStack spacing={0.5}>
                          {athleteColorMap && day.workouts.length > 0 ? (
                            // Show colored dots per athlete (max 4)
                            <>
                              {day.workouts.slice(0, 4).map((workout, i) => {
                                const athleteId = (workout as { athleteId?: string }).athleteId;
                                const colorScheme = athleteId ? athleteColorMap.get(athleteId) : undefined;
                                return (
                                  <Circle
                                    key={i}
                                    size="6px"
                                    bg={colorScheme ? `${colorScheme}.500` : workoutDotColor}
                                  />
                                );
                              })}
                              {day.workoutCount > 4 && (
                                <Text fontSize="2xs" color={workoutDotColor}>
                                  +{day.workoutCount - 4}
                                </Text>
                              )}
                            </>
                          ) : (
                            // Default: brand-colored dots
                            <>
                              {Array.from({ length: Math.min(day.workoutCount, 3) }).map(
                                (_, i) => (
                                  <Circle
                                    key={i}
                                    size="6px"
                                    bg={workoutDotColor}
                                  />
                                )
                              )}
                              {day.workoutCount > 3 && (
                                <Text fontSize="2xs" color={workoutDotColor}>
                                  +{day.workoutCount - 3}
                                </Text>
                              )}
                            </>
                          )}
                        </HStack>
                      </Tooltip>
                    )}
                  </Flex>
                </GridItem>
              );
            })}
          </Grid>
        ))}
      </Box>
    </Box>
  );
}
