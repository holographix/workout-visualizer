import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  Box,
  Flex,
  Text,
  IconButton,
  HStack,
  useColorModeValue,
  useBreakpointValue,
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
  format,
  isToday,
  addDays,
} from 'date-fns';
import { DayColumn } from './DayColumn';
import { DatePickerPopover } from '../../molecules/DatePickerPopover';
import type { ScheduledWorkout, DayColumn as DayColumnType } from '../../../types/calendar';
import type { AthleteColorScheme } from '../../../utils/athleteColors';

// Day capacity info (maxHours from athlete settings)
export interface DayCapacity {
  dayIndex: number;
  maxHours: number;
}

interface WeeklyCalendarProps {
  scheduledWorkouts: ScheduledWorkout[];
  onRemoveWorkout: (scheduledId: string) => void;
  onWorkoutClick: (scheduled: ScheduledWorkout) => void;
  onScheduleWorkout: (workoutId: string, dayIndex: number) => void;
  onDayTap?: (dayIndex: number) => void; // Mobile tap-to-place
  selectedWorkoutName?: string; // Show which workout is selected on mobile
  // Controlled week props (optional - if not provided, uses internal state)
  weekStart?: Date;
  onWeekChange?: (newWeekStart: Date) => void;
  // Unavailable days (array of day indices 0-6 where 0=Monday)
  unavailableDays?: number[];
  // Day capacities (max hours per day from athlete settings)
  dayCapacities?: DayCapacity[];
  // Loading state (show skeletons in day columns)
  isLoading?: boolean;
  // Athlete color map for coach view (maps athleteId to color scheme)
  athleteColorMap?: Map<string, AthleteColorScheme>;
  // Athlete view mode (hides drag-drop, shows completion status)
  isAthleteView?: boolean;
}

const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;

// Mobile carousel constants - Apple Watch style magnification
// Using fixed widths + CSS transform for GPU-accelerated smoothness (no layout reflow)
const MOBILE_COLUMN_WIDTH = 200; // Fixed column width - wide enough for full card content
const MOBILE_EDGE_PADDING = 100; // Padding so edge days can be centered
const SCALE_MIN = 0.5; // Scale for distant columns (smaller to fit more on screen)
const SCALE_MAX = 1.0; // Scale for focused column

export function WeeklyCalendar({
  scheduledWorkouts,
  onRemoveWorkout,
  onWorkoutClick,
  onScheduleWorkout,
  onDayTap,
  selectedWorkoutName,
  weekStart: controlledWeekStart,
  onWeekChange,
  unavailableDays = [],
  dayCapacities = [],
  isLoading = false,
  athleteColorMap,
  isAthleteView: _isAthleteView = false,
}: WeeklyCalendarProps) {
  // Note: isAthleteView can be used later to customize display
  void _isAthleteView;
  const { t } = useTranslation();
  const isMobile = useBreakpointValue({ base: true, md: false });

  // Support both controlled and uncontrolled modes
  const [internalWeekStart, setInternalWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );

  // Use controlled value if provided, otherwise use internal state
  const currentWeekStart = controlledWeekStart ?? internalWeekStart;
  const setCurrentWeekStart = onWeekChange ?? setInternalWeekStart;

  // Track navigation direction for slide animation
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right');
  const prevWeekRef = useRef<Date | null>(null);

  // Mobile carousel - CSS transforms for 60fps smoothness (no layout reflow)
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const columnRefs = useRef<(HTMLDivElement | null)[]>([]);
  const rafRef = useRef<number | null>(null);
  // Track focused day for compact mode (only update when focus changes)
  const [focusedDayIndex, setFocusedDayIndex] = useState(0);
  const lastFocusedRef = useRef(0);

  // Fixed total width - layout never changes, only transforms
  const totalColumnsWidth = MOBILE_EDGE_PADDING * 2 + MOBILE_COLUMN_WIDTH * 7;

  // Apply transform scale directly to DOM - GPU accelerated, no layout reflow
  const updateMagnification = useCallback(() => {
    if (!scrollContainerRef.current || !isMobile) return;

    const container = scrollContainerRef.current;
    const scrollLeft = container.scrollLeft;
    const containerWidth = container.clientWidth;
    const viewportCenter = scrollLeft + containerWidth / 2;

    let closestDayIndex = 0;
    let closestDistance = Infinity;

    // Apply transforms directly to DOM - pure compositor work
    for (let i = 0; i < 7; i++) {
      const columnCenter = MOBILE_EDGE_PADDING + (i + 0.5) * MOBILE_COLUMN_WIDTH;
      const distanceFromCenter = Math.abs(columnCenter - viewportCenter);

      // Track closest day for compact mode
      if (distanceFromCenter < closestDistance) {
        closestDistance = distanceFromCenter;
        closestDayIndex = i;
      }

      // Normalize distance (0 = center, 1 = far)
      const normalizedDistance = Math.min(distanceFromCenter / (containerWidth * 0.5), 1);

      // Smooth cosine interpolation
      const t = Math.cos(normalizedDistance * Math.PI / 2);

      // Calculate scale and opacity
      const scale = SCALE_MIN + (SCALE_MAX - SCALE_MIN) * t;
      const opacity = 0.5 + 0.5 * t;

      // Apply transform directly - GPU accelerated
      const column = columnRefs.current[i];
      if (column) {
        column.style.transform = `scale(${scale})`;
        column.style.opacity = `${opacity}`;
      }
    }

    // Only trigger React re-render when focused day changes
    if (closestDayIndex !== lastFocusedRef.current) {
      lastFocusedRef.current = closestDayIndex;
      setFocusedDayIndex(closestDayIndex);
    }
  }, [isMobile]);

  // Smooth scroll handler using requestAnimationFrame
  const handleScroll = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
    rafRef.current = requestAnimationFrame(updateMagnification);
  }, [updateMagnification]);

  // Initialize on mount and cleanup
  useEffect(() => {
    if (isMobile) {
      // Initial calculation after a brief delay to ensure refs are set
      requestAnimationFrame(updateMagnification);
    }
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [isMobile, updateMagnification, currentWeekStart]);

  // Detect direction from controlled week changes
  useEffect(() => {
    if (prevWeekRef.current && currentWeekStart) {
      const direction = currentWeekStart > prevWeekRef.current ? 'right' : 'left';
      setSlideDirection(direction);
    }
    prevWeekRef.current = currentWeekStart;
  }, [currentWeekStart]);

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const headerBg = useColorModeValue('gray.50', 'gray.900');

  const days: DayColumnType[] = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = addDays(currentWeekStart, i);
      return {
        dayIndex: i,
        date,
        dayName: t(`days.${DAY_KEYS[i]}`),
        isToday: isToday(date),
        workouts: scheduledWorkouts
          .filter((sw) => sw.dayIndex === i)
          .sort((a, b) => a.sortOrder - b.sortOrder),
      };
    });
  }, [currentWeekStart, scheduledWorkouts, t]);

  const handlePrevWeek = () => {
    setCurrentWeekStart(subWeeks(currentWeekStart, 1));
  };

  const handleNextWeek = () => {
    setCurrentWeekStart(addWeeks(currentWeekStart, 1));
  };

  // Handle date picker selection
  const handleDateSelect = (date: Date) => {
    setCurrentWeekStart(date);
  };

  const weekRange = `${format(currentWeekStart, 'MMM d')} - ${format(
    endOfWeek(currentWeekStart, { weekStartsOn: 1 }),
    'MMM d, yyyy'
  )}`;

  return (
    <Box
      bg={bgColor}
      borderRadius={{ base: 'none', md: 'xl' }}
      borderWidth={{ base: 0, md: '1px' }}
      borderColor={borderColor}
      overflow="hidden"
      display="flex"
      flexDirection="column"
      h="full"
    >
      {/* Header - Sticky */}
      <Flex
        bg={headerBg}
        px={{ base: 2, md: 4 }}
        py={3}
        borderBottomWidth="1px"
        borderColor={borderColor}
        justify="space-between"
        align="center"
        flexShrink={0}
        position="sticky"
        top={0}
        zIndex={10}
      >
        <HStack spacing={2} display={{ base: 'none', md: 'flex' }}>
          <Calendar size={20} />
          <Text fontWeight="semibold">{t('calendar.title')}</Text>
        </HStack>

        <HStack spacing={{ base: 1, md: 2 }} flex={{ base: 1, md: 'none' }} justify={{ base: 'center', md: 'flex-start' }}>
          <IconButton
            aria-label={t('calendar.previousWeek')}
            icon={<ChevronLeft size={18} />}
            size="sm"
            variant="ghost"
            onClick={handlePrevWeek}
            flexShrink={0}
          />
          <DatePickerPopover
            selectedDate={currentWeekStart}
            onDateSelect={handleDateSelect}
            mode="week"
          >
            <Text
              fontSize={{ base: 'xs', md: 'sm' }}
              fontWeight="medium"
              minW={{ base: 'auto', md: '180px' }}
              textAlign="center"
              cursor="pointer"
              _hover={{ color: 'brand.500' }}
              whiteSpace="nowrap"
            >
              {weekRange}
            </Text>
          </DatePickerPopover>
          <IconButton
            aria-label={t('calendar.nextWeek')}
            icon={<ChevronRight size={18} />}
            size="sm"
            variant="ghost"
            onClick={handleNextWeek}
            flexShrink={0}
          />
        </HStack>
      </Flex>

      {/* Calendar Grid */}
      <Box
        ref={scrollContainerRef}
        flex={1}
        overflowY="auto"
        overflowX={{ base: 'auto', md: 'hidden' }}
        position="relative"
        onScroll={isMobile ? handleScroll : undefined}
        sx={{
          // Hide scrollbar but allow scrolling on mobile
          '&::-webkit-scrollbar': { display: 'none' },
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch',
          // Scroll snap - snaps to day centers on mobile
          scrollSnapType: isMobile ? 'x mandatory' : 'none',
        }}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={format(currentWeekStart, 'yyyy-MM-dd')}
            initial={{
              x: slideDirection === 'right' ? 50 : -50,
              opacity: 0,
            }}
            animate={{
              x: 0,
              opacity: 1,
            }}
            exit={{
              x: slideDirection === 'right' ? -50 : 50,
              opacity: 0,
            }}
            transition={{
              duration: 0.2,
              ease: 'easeOut',
            }}
          >
            {/* Mobile: Fixed-width carousel with snap-to-day */}
            {isMobile ? (
              <Flex
                minH="450px"
                w={`${totalColumnsWidth}px`}
                align="stretch"
              >
                {/* Left spacer - allows Monday to be centered */}
                <Box w={`${MOBILE_EDGE_PADDING}px`} flexShrink={0} />

                {days.map((day, index) => {
                  // Compact mode based on focused day (only changes when focus changes)
                  const isCompact = index !== focusedDayIndex;
                  return (
                    <Box
                      key={day.dayIndex}
                      ref={(el) => { columnRefs.current[index] = el; }}
                      flexShrink={0}
                      borderColor={borderColor}
                      sx={{
                        // Fixed width - layout never changes
                        width: `${MOBILE_COLUMN_WIDTH}px`,
                        scrollSnapAlign: 'center',
                        // Transform from center for natural scaling
                        transformOrigin: 'center top',
                        // GPU acceleration - compositor-only properties
                        willChange: 'transform, opacity',
                      }}
                    >
                      <DayColumn
                        day={day}
                        onWorkoutClick={onWorkoutClick}
                        onRemoveWorkout={onRemoveWorkout}
                        onDrop={onScheduleWorkout}
                        onTap={onDayTap}
                        showTapHint={!!selectedWorkoutName}
                        isUnavailable={unavailableDays.includes(day.dayIndex)}
                        maxHours={dayCapacities.find(c => c.dayIndex === day.dayIndex)?.maxHours}
                        isLoading={isLoading}
                        athleteColorMap={athleteColorMap}
                        isCompact={isCompact}
                      />
                    </Box>
                  );
                })}

                {/* Right spacer - allows Sunday to be centered */}
                <Box w={`${MOBILE_EDGE_PADDING}px`} flexShrink={0} />
              </Flex>
            ) : (
              /* Desktop: Standard grid layout */
              <Flex minH="400px">
                {days.map((day) => (
                  <Box
                    key={day.dayIndex}
                    flex={1}
                    borderRightWidth={day.dayIndex < 6 ? '1px' : 0}
                    borderColor={borderColor}
                  >
                    <DayColumn
                      day={day}
                      onWorkoutClick={onWorkoutClick}
                      onRemoveWorkout={onRemoveWorkout}
                      onDrop={onScheduleWorkout}
                      onTap={onDayTap}
                      showTapHint={!!selectedWorkoutName}
                      isUnavailable={unavailableDays.includes(day.dayIndex)}
                      maxHours={dayCapacities.find(c => c.dayIndex === day.dayIndex)?.maxHours}
                      isLoading={isLoading}
                      athleteColorMap={athleteColorMap}
                    />
                  </Box>
                ))}
              </Flex>
            )}
          </motion.div>
        </AnimatePresence>
      </Box>
    </Box>
  );
}
