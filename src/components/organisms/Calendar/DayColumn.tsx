import { useState, useCallback, useMemo } from 'react';
import {
  Box,
  Flex,
  Text,
  VStack,
  Progress,
  Tooltip,
  Skeleton,
  useColorModeValue,
  useToast,
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { WorkoutCard } from './WorkoutCard';
import type { DayColumn as DayColumnType, ScheduledWorkout } from '../../../types/calendar';
import type { AthleteColorScheme } from '../../../utils/athleteColors';

// Skeleton workout card component
function WorkoutCardSkeleton() {
  const bg = useColorModeValue('gray.100', 'gray.700');
  return (
    <Box p={2} bg={bg} borderRadius="md">
      <Skeleton height="12px" width="80%" mb={2} />
      <Skeleton height="10px" width="50%" />
    </Box>
  );
}

interface DayColumnProps {
  day: DayColumnType;
  athleteId?: string; // ID of the athlete this day column belongs to (for cross-calendar drag-drop)
  onWorkoutClick: (scheduled: ScheduledWorkout) => void;
  onRemoveWorkout?: (scheduledId: string) => void; // Optional - only for coach views
  onEditWorkout?: (scheduled: ScheduledWorkout) => void;
  onDrop: (workoutId: string, dayIndex: number) => void;
  onMoveWorkout?: (scheduledId: string) => void; // Parent handles dayIndex calculation
  onCopyWorkout?: (scheduledId: string) => void; // Parent handles dayIndex calculation
  onWorkoutDragStart?: (scheduled: ScheduledWorkout) => void;
  onWorkoutDragEnd?: () => void;
  onTap?: (dayIndex: number) => void;
  showTapHint?: boolean;
  isUnavailable?: boolean; // When true, day is greyed out and no workouts can be assigned
  maxHours?: number; // Max training hours for this day from athlete settings
  isLoading?: boolean; // When true, show skeleton loaders instead of empty state
  athleteColorMap?: Map<string, AthleteColorScheme>; // Map of athleteId to color scheme for coach view
  isCompact?: boolean; // Mobile: show compact cards when column is not in focus
}

export function DayColumn({ day, athleteId, onWorkoutClick, onRemoveWorkout, onEditWorkout, onDrop, onMoveWorkout, onCopyWorkout, onWorkoutDragStart, onWorkoutDragEnd, onTap, showTapHint, isUnavailable, maxHours, isLoading, athleteColorMap, isCompact }: DayColumnProps) {
  const { t } = useTranslation();
  const toast = useToast();
  const [isOver, setIsOver] = useState(false);

  const headerBg = useColorModeValue('gray.50', 'gray.900');
  const todayBg = useColorModeValue('brand.50', 'brand.900');
  const todayColor = useColorModeValue('brand.600', 'brand.200');
  const dayColor = useColorModeValue('gray.600', 'gray.400');
  const dateColor = useColorModeValue('gray.800', 'white');
  const dropBg = useColorModeValue('brand.50', 'brand.900');
  const emptyColor = useColorModeValue('gray.400', 'gray.600');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const tapHintBorder = useColorModeValue('brand.300', 'brand.500');
  // Unavailable day styling
  const unavailableBg = useColorModeValue('gray.100', 'gray.800');
  const unavailableHeaderBg = useColorModeValue('gray.200', 'gray.700');
  const unavailableTextColor = useColorModeValue('gray.400', 'gray.600');
  // Progress bar background
  const progressBg = useColorModeValue('gray.200', 'gray.700');

  // Calculate allocated hours from workouts
  const allocatedHours = useMemo(() => {
    return day.workouts.reduce((total, sw) => {
      // Use durationOverride (in seconds) if available, otherwise use base workout duration (in hours)
      const durationHours = sw.durationOverride
        ? sw.durationOverride / 3600
        : (sw.workout?.attributes?.totalTimePlanned || 0);
      return total + durationHours;
    }, 0);
  }, [day.workouts]);

  // Calculate capacity percentage and status
  const capacityPercentage = maxHours && maxHours > 0 ? Math.min((allocatedHours / maxHours) * 100, 100) : 0;
  const isFull = maxHours !== undefined && allocatedHours >= maxHours;
  const hasCapacityInfo = maxHours !== undefined && maxHours > 0;

  // Determine progress bar color based on fill level
  const getProgressColorScheme = () => {
    if (capacityPercentage >= 100) return 'red';
    if (capacityPercentage >= 80) return 'orange';
    if (capacityPercentage >= 50) return 'yellow';
    return 'green';
  };

  // Format hours for display (e.g., 1.5 -> "1h 30m")
  const formatHours = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    if (isUnavailable || isFull) {
      e.dataTransfer.dropEffect = 'none';
      return;
    }
    e.preventDefault();

    // Determine drop effect based on source and Alt key
    const effectAllowed = e.dataTransfer.effectAllowed;

    if (effectAllowed === 'copyMove') {
      // Card drag - allow both move (default) and copy (with Alt)
      e.dataTransfer.dropEffect = e.altKey ? 'copy' : 'move';
    } else if (effectAllowed === 'copy') {
      // Library workout drag - always copy
      e.dataTransfer.dropEffect = 'copy';
    } else {
      // Fallback
      e.dataTransfer.dropEffect = 'move';
    }

    setIsOver(true);
  }, [isUnavailable, isFull]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    // Only set isOver to false if we're leaving the container entirely
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setIsOver(false);
    }
  }, []);

  // Calculate remaining capacity
  const remainingCapacity = maxHours !== undefined ? maxHours - allocatedHours : Infinity;

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsOver(false);

    if (isUnavailable) return;

    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      const isCopyingWithAlt = e.altKey && data.isMoving;
      const isCrossAthleteMove = data.sourceAthleteId && athleteId && data.sourceAthleteId !== athleteId;

      console.log('🎯 DayColumn drop:', {
        data,
        athleteId,
        isCrossAthleteMove,
        onCopyWorkout: !!onCopyWorkout,
        onMoveWorkout: !!onMoveWorkout
      });

      if (data.isMoving && data.scheduledId) {
        // If dragging between different athletes, always copy
        if (isCrossAthleteMove) {
          console.log('➡️ Cross-athlete copy detected, calling onCopyWorkout');
          onCopyWorkout?.(data.scheduledId);
        } else if (isCopyingWithAlt) {
          // Alt key held - copy workout to new day (same athlete)
          console.log('➡️ Alt-copy detected, calling onCopyWorkout');
          onCopyWorkout?.(data.scheduledId);
        } else {
          // Move workout between days (same athlete)
          console.log('➡️ Same-athlete move detected, calling onMoveWorkout');
          onMoveWorkout?.(data.scheduledId);
        }
      } else if (data.workoutId) {
        // Adding new workout from library
        // Check if workout duration would exceed remaining capacity
        const workoutDuration = data.durationHours || 0;
        if (maxHours !== undefined && workoutDuration > remainingCapacity) {
          toast({
            title: t('calendar.dayFull'),
            description: t('calendar.cannotScheduleFull'),
            status: 'warning',
            duration: 3000,
            isClosable: true,
          });
          return;
        }
        onDrop(data.workoutId, day.dayIndex);
      }
    } catch (err) {
      console.warn('Invalid drop data', err);
    }
  }, [day.dayIndex, onDrop, onMoveWorkout, onCopyWorkout, isUnavailable, maxHours, remainingCapacity, toast, t, athleteId]);

  const handleTap = useCallback(() => {
    if (isUnavailable || isFull) return;
    onTap?.(day.dayIndex);
  }, [onTap, day.dayIndex, isUnavailable, isFull]);

  // Determine background colors based on unavailable state
  const effectiveHeaderBg = isUnavailable
    ? unavailableHeaderBg
    : day.isToday
    ? todayBg
    : headerBg;

  const effectiveTextColor = isUnavailable
    ? unavailableTextColor
    : day.isToday
    ? todayColor
    : dayColor;

  const effectiveDateColor = isUnavailable
    ? unavailableTextColor
    : day.isToday
    ? todayColor
    : dateColor;

  return (
    <Box h="full" display="flex" flexDirection="column" opacity={isUnavailable ? 0.6 : 1}>
      {/* Day Header */}
      <Flex
        direction="column"
        align="center"
        py={2}
        bg={effectiveHeaderBg}
        borderBottomWidth="1px"
        borderColor={borderColor}
      >
        <Text
          fontSize="xs"
          fontWeight="medium"
          textTransform="uppercase"
          color={effectiveTextColor}
        >
          {day.dayName}
        </Text>
        <Text
          fontSize="lg"
          fontWeight={day.isToday && !isUnavailable ? 'bold' : 'semibold'}
          color={effectiveDateColor}
        >
          {format(day.date, 'd')}
        </Text>
        {isUnavailable && (
          <Text fontSize="2xs" color={unavailableTextColor}>
            {t('availability.unavailable')}
          </Text>
        )}
      </Flex>

      {/* Capacity Load Bar - only shown for available days with capacity info */}
      {!isUnavailable && hasCapacityInfo && (
        <Tooltip
          label={`${formatHours(allocatedHours)} / ${formatHours(maxHours!)} ${isFull ? `(${t('calendar.full')})` : ''}`}
          placement="top"
          hasArrow
        >
          <Box px={2} py={1} bg={effectiveHeaderBg}>
            <Progress
              value={capacityPercentage}
              size="xs"
              colorScheme={getProgressColorScheme()}
              borderRadius="full"
              bg={progressBg}
            />
            <Text fontSize="2xs" textAlign="center" color={isFull ? 'red.500' : emptyColor} mt={0.5}>
              {formatHours(allocatedHours)} / {formatHours(maxHours!)}
            </Text>
          </Box>
        </Tooltip>
      )}

      {/* Droppable Area */}
      <Box
        flex={1}
        p={2}
        bg={isUnavailable ? unavailableBg : isOver || showTapHint ? dropBg : 'transparent'}
        transition="background 0.15s"
        minH="300px"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={onTap && !isUnavailable ? handleTap : undefined}
        cursor={isUnavailable || isFull ? 'not-allowed' : onTap ? 'pointer' : 'default'}
      >
        {isLoading ? (
          // Show skeleton loaders when fetching new week data
          <VStack spacing={2} align="stretch">
            <WorkoutCardSkeleton />
            <WorkoutCardSkeleton />
          </VStack>
        ) : day.workouts.length === 0 ? (
          <Flex
            h="full"
            align="center"
            justify="center"
            borderWidth="2px"
            borderStyle="dashed"
            borderColor={isUnavailable ? 'transparent' : isOver ? 'brand.400' : showTapHint ? tapHintBorder : 'transparent'}
            borderRadius="md"
            transition="all 0.15s"
          >
            {!isUnavailable && (isOver || showTapHint) && (
              <Text fontSize="xs" color={emptyColor}>
                {isOver ? t('calendar.dropHere') : t('calendar.tapToAdd')}
              </Text>
            )}
          </Flex>
        ) : (
          <VStack spacing={2} align="stretch">
            {day.workouts.map((scheduled) => {
              // Get athlete color if available (coach view)
              const workoutAthleteId = (scheduled as { athleteId?: string }).athleteId;
              const athleteColor = workoutAthleteId && athleteColorMap ? athleteColorMap.get(workoutAthleteId) : undefined;

              // Drag handlers for moving workouts between days (only if drag is enabled)
              const handleCardDragStart = onWorkoutDragStart ? (e: React.DragEvent) => {
                e.dataTransfer.setData('application/json', JSON.stringify({
                  scheduledId: scheduled.id,
                  isMoving: true,
                  sourceAthleteId: athleteId, // Include athlete ID for cross-calendar detection
                }));
                e.dataTransfer.effectAllowed = 'copyMove';
                onWorkoutDragStart(scheduled);
              } : undefined;

              return (
                <WorkoutCard
                  key={scheduled.id}
                  scheduled={scheduled}
                  onClick={() => onWorkoutClick(scheduled)}
                  onRemove={onRemoveWorkout ? () => onRemoveWorkout(scheduled.id) : undefined}
                  onEdit={onEditWorkout ? () => onEditWorkout(scheduled) : undefined}
                  onDragStart={handleCardDragStart}
                  onDragEnd={onWorkoutDragEnd}
                  athleteColor={athleteColor}
                  isCompact={isCompact}
                />
              );
            })}
          </VStack>
        )}
      </Box>
    </Box>
  );
}
