import {
  Box,
  Center,
  Flex,
  Text,
  IconButton,
  HStack,
  VStack,
  Icon,
  useColorModeValue,
  Tooltip,
  Skeleton,
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { Clock, Zap, X, CheckCircle, Edit2, Edit3 } from 'lucide-react';
import type { ScheduledWorkout } from '../../../types/calendar';
import { getWorkoutTypeConfig } from '../../../utils/workoutTypes';
import type { AthleteColorScheme } from '../../../utils/athleteColors';

interface WorkoutCardProps {
  scheduled: ScheduledWorkout;
  onClick?: () => void;
  onRemove?: () => void;
  onEdit?: () => void;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: () => void;
  athleteColor?: AthleteColorScheme;
  isCompact?: boolean; // Mobile: show minimal info when column is not focused
}

const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return mins > 0 ? `${hours}h${mins}m` : `${hours}h`;
  }
  return `${mins}m`;
};

const formatDurationShort = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h`;
  }
  return `${mins}m`;
};

export function WorkoutCard({
  scheduled,
  onClick,
  onRemove,
  onEdit,
  onDragStart,
  onDragEnd,
  athleteColor,
  isCompact = false,
}: WorkoutCardProps) {
  const { t } = useTranslation();

  const handleDragStart = (e: React.DragEvent) => {
    onDragStart?.(e);
  };

  const handleClick = (e: React.MouseEvent) => {
    onClick?.();
  };

  const bgColor = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const hoverBg = useColorModeValue('gray.50', 'gray.600');
  const textColor = useColorModeValue('gray.800', 'white');
  const mutedColor = useColorModeValue('gray.500', 'gray.400');
  const completedBg = useColorModeValue('green.50', 'green.900');
  const completedBorder = useColorModeValue('green.200', 'green.700');

  const workout = scheduled.workout;
  const isOptimistic = !workout; // Loading placeholder if workout data not yet loaded

  // Use override values if available (workout was modified), otherwise use base workout values
  const duration = scheduled.durationOverride
    ?? (workout?.attributes?.totalTimePlanned ? workout.attributes.totalTimePlanned * 3600 : 3600);
  const tss = scheduled.tssOverride ?? workout?.attributes?.tssPlanned ?? 0;
  const workoutTypeConfig = getWorkoutTypeConfig(workout?.attributes?.workoutType);
  const title = workout?.title || t('workout.fallbackTitle');

  // Loading skeleton for optimistic updates
  if (isOptimistic) {
    return (
      <Box
        bg={bgColor}
        borderWidth="1px"
        borderColor={borderColor}
        borderRadius="xl"
        p={3}
        minH="70px"
        opacity={0.6}
      >
        <HStack spacing={2} mb={2}>
          <Skeleton height="32px" width="32px" borderRadius="lg" />
          <Skeleton height="16px" flex={1} />
        </HStack>
        <HStack spacing={2}>
          <Skeleton height="20px" width="60px" borderRadius="full" />
          <Skeleton height="20px" width="50px" borderRadius="full" />
        </HStack>
      </Box>
    );
  }

  // Compact mobile card - high contrast pill for quick scanning
  if (isCompact) {
    return (
      <Tooltip label={title} placement="top" hasArrow openDelay={500}>
        <Box
          draggable={!!onDragStart}
          onDragStart={handleDragStart}
          onDragEnd={onDragEnd}
          bg={`${workoutTypeConfig.color}.500`}
          borderRadius="lg"
          px={2}
          py={1.5}
          cursor="pointer"
          transition="all 0.15s"
          position="relative"
          minH="32px"
          display="flex"
          alignItems="center"
          justifyContent="center"
          onClick={handleClick}
          shadow="sm"
          userSelect="none"
          _dark={{
            bg: `${workoutTypeConfig.color}.600`,
          }}
        >
          {/* Athlete color indicator dot */}
          {athleteColor && (
            <Box
              position="absolute"
              top="-3px"
              right="-3px"
              w="10px"
              h="10px"
              borderRadius="full"
              bg={`${athleteColor}.400`}
              borderWidth="2px"
              borderColor="white"
              _dark={{ borderColor: 'gray.800' }}
            />
          )}
          {/* Completion checkmark overlay */}
          {scheduled.completed && (
            <Icon
              as={CheckCircle}
              w={3.5}
              h={3.5}
              color="white"
              position="absolute"
              bottom="-3px"
              right="-3px"
              bg="green.500"
              borderRadius="full"
              p={0.5}
            />
          )}
          {/* Content: Icon + duration - white text on colored bg */}
          <HStack spacing={1.5}>
            <Icon
              as={workoutTypeConfig.icon}
              w={4}
              h={4}
              color="white"
            />
            <Text
              fontSize="xs"
              fontWeight="bold"
              color="white"
            >
              {formatDurationShort(duration)}
            </Text>
          </HStack>
        </Box>
      </Tooltip>
    );
  }

  // Compact engineered card - optimized for 140px columns
  return (
    <Box
      draggable={!!onDragStart}
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
      bg={scheduled.completed ? completedBg : bgColor}
      borderWidth="1px"
      borderColor={scheduled.completed ? completedBorder : borderColor}
      borderRadius="lg"
      borderLeftWidth={athleteColor ? '3px' : '1px'}
      borderLeftColor={athleteColor ? `${athleteColor}.500` : undefined}
      p={2}
      cursor={onDragStart ? 'grab' : 'pointer'}
      shadow="sm"
      transition="all 0.15s"
      _hover={{ bg: hoverBg, shadow: 'md' }}
      _active={{ transform: 'scale(0.98)' }}
      role="group"
      onClick={handleClick}
      userSelect="none"
      position="relative"
      overflow="hidden"
    >
      {/* Workout type icon badge - top right */}
      <Flex
        position="absolute"
        top={1}
        right={1}
        w="24px"
        h="24px"
        borderRadius="md"
        bg={`${workoutTypeConfig.color}.100`}
        _dark={{ bg: `${workoutTypeConfig.color}.900` }}
        align="center"
        justify="center"
      >
        <Icon
          as={workoutTypeConfig.icon}
          w={3.5}
          h={3.5}
          color={`${workoutTypeConfig.color}.600`}
          _dark={{ color: `${workoutTypeConfig.color}.400` }}
        />
      </Flex>

      {/* Status badges - bottom right, stacked */}
      <VStack position="absolute" bottom={1} right={1} spacing={0.5} align="flex-end">
        {scheduled.isModified && (
          <Flex
            w="16px"
            h="16px"
            borderRadius="full"
            bg="blue.500"
            align="center"
            justify="center"
          >
            <Icon as={Edit3} w={2.5} h={2.5} color="white" />
          </Flex>
        )}
        {scheduled.completed && (
          <Flex
            w="16px"
            h="16px"
            borderRadius="full"
            bg="green.500"
            align="center"
            justify="center"
          >
            <Icon as={CheckCircle} w={2.5} h={2.5} color="white" />
          </Flex>
        )}
      </VStack>

      {/* Remove button - show on hover, top left */}
      {onRemove && (
        <IconButton
          aria-label={t('workout.removeWorkout')}
          icon={<X size={12} />}
          size="xs"
          variant="solid"
          colorScheme="red"
          position="absolute"
          top={1}
          left={1}
          opacity={0}
          _groupHover={{ opacity: 1 }}
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          w="20px"
          h="20px"
          minW="20px"
          borderRadius="md"
        />
      )}

      {/* Edit button - show on hover, bottom left */}
      {onEdit && (
        <IconButton
          aria-label={t('calendar.editWorkout')}
          icon={<Edit2 size={12} />}
          size="xs"
          variant="ghost"
          colorScheme="blue"
          position="absolute"
          bottom={1}
          left={1}
          opacity={0}
          _groupHover={{ opacity: 1 }}
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          w="20px"
          h="20px"
          minW="20px"
          borderRadius="md"
        />
      )}

      {/* Title - 2 lines max, compact */}
      <Text
        fontSize="xs"
        fontWeight="600"
        color={textColor}
        lineHeight="1.2"
        noOfLines={2}
        mb={2}
        pr={7}
      >
        {title}
      </Text>

      {/* Metrics - ultra compact */}
      <VStack spacing={0.5} align="stretch" fontSize="2xs" color={mutedColor}>
        <HStack spacing={1}>
          <Clock size={9} />
          <Text fontWeight="500">{formatDuration(duration)}</Text>
        </HStack>
        {tss > 0 && (
          <HStack spacing={1}>
            <Zap size={9} />
            <Text fontWeight="500" color="orange.600" _dark={{ color: 'orange.400' }}>
              {Math.round(tss)} TSS
            </Text>
          </HStack>
        )}
      </VStack>
    </Box>
  );
}
