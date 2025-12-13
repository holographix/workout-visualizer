import {
  Box,
  Center,
  Flex,
  Text,
  IconButton,
  HStack,
  Icon,
  useColorModeValue,
  Tooltip,
} from '@chakra-ui/react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Clock, Zap, X, GripVertical, CheckCircle } from 'lucide-react';
import type { ScheduledWorkout } from '../../../types/calendar';
import { getWorkoutTypeConfig } from '../../../utils/workoutTypes';
import type { AthleteColorScheme } from '../../../utils/athleteColors';

interface WorkoutCardProps {
  scheduled: ScheduledWorkout;
  onClick?: () => void;
  onRemove?: () => void;
  isDragging?: boolean;
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
  isDragging = false,
  athleteColor,
  isCompact = false,
}: WorkoutCardProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: scheduled.id,
  });

  const bgColor = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const hoverBg = useColorModeValue('gray.50', 'gray.600');
  const textColor = useColorModeValue('gray.800', 'white');
  const mutedColor = useColorModeValue('gray.500', 'gray.400');
  const completedBg = useColorModeValue('green.50', 'green.900');
  const completedBorder = useColorModeValue('green.200', 'green.700');

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  const workout = scheduled.workout;
  const duration = workout?.attributes?.totalTimePlanned
    ? workout.attributes.totalTimePlanned * 3600
    : 3600;
  const tss = workout?.attributes?.tssPlanned || 0;
  const workoutTypeConfig = getWorkoutTypeConfig(workout?.attributes?.workoutType);
  const title = workout?.title || 'Workout';

  // Compact mobile card - high contrast pill for quick scanning
  if (isCompact) {
    return (
      <Tooltip label={title} placement="top" hasArrow openDelay={500}>
        <Box
          ref={setNodeRef}
          style={style}
          bg={`${workoutTypeConfig.color}.500`}
          borderRadius="lg"
          px={2}
          py={1.5}
          cursor="pointer"
          opacity={isDragging ? 0.8 : 1}
          transition="all 0.15s"
          position="relative"
          minH="32px"
          display="flex"
          alignItems="center"
          justifyContent="center"
          onClick={onClick}
          shadow="sm"
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

  // Full card layout (focused/desktop) - mobile-optimized
  return (
    <Box
      ref={setNodeRef}
      style={style}
      bg={scheduled.completed ? completedBg : bgColor}
      borderWidth="1px"
      borderColor={scheduled.completed ? completedBorder : borderColor}
      borderRadius="xl"
      borderLeftWidth={athleteColor ? '4px' : '1px'}
      borderLeftColor={athleteColor ? `${athleteColor}.500` : undefined}
      p={3}
      cursor={isDragging ? 'grabbing' : 'pointer'}
      opacity={isDragging ? 0.8 : 1}
      shadow={isDragging ? 'lg' : 'sm'}
      transition="all 0.2s"
      _hover={{ bg: hoverBg, shadow: 'md' }}
      _active={{ transform: 'scale(0.98)' }}
      role="group"
      onClick={onClick}
      minH="70px"
    >
      {/* Top row: Type icon + Title + Remove */}
      <Flex justify="space-between" align="center" mb={2}>
        <HStack spacing={2} flex={1} minW={0}>
          <Center
            w={8}
            h={8}
            borderRadius="lg"
            bg={`${workoutTypeConfig.color}.100`}
            flexShrink={0}
            _dark={{ bg: `${workoutTypeConfig.color}.900` }}
          >
            <Icon
              as={workoutTypeConfig.icon}
              w={4}
              h={4}
              color={`${workoutTypeConfig.color}.600`}
              _dark={{ color: `${workoutTypeConfig.color}.300` }}
            />
          </Center>
          <Text
            fontSize="sm"
            fontWeight="semibold"
            color={textColor}
            noOfLines={2}
            lineHeight="tight"
          >
            {title}
          </Text>
        </HStack>
        {onRemove && (
          <IconButton
            aria-label="Remove workout"
            icon={<X size={14} />}
            size="xs"
            variant="ghost"
            opacity={0}
            _groupHover={{ opacity: 1 }}
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            ml={1}
          />
        )}
      </Flex>

      {/* Bottom row: Metrics as pills */}
      <Flex gap={2} flexWrap="wrap">
        <HStack
          spacing={1}
          bg="gray.100"
          _dark={{ bg: 'gray.600' }}
          px={2}
          py={0.5}
          borderRadius="full"
          fontSize="xs"
          color={mutedColor}
        >
          <Clock size={12} />
          <Text fontWeight="medium">{formatDuration(duration)}</Text>
        </HStack>
        {tss > 0 && (
          <HStack
            spacing={1}
            bg="orange.100"
            px={2}
            py={0.5}
            borderRadius="full"
            fontSize="xs"
            color="orange.600"
            _dark={{ bg: 'orange.900', color: 'orange.300' }}
          >
            <Zap size={12} />
            <Text fontWeight="medium">{Math.round(tss)}</Text>
          </HStack>
        )}
        {scheduled.completed && (
          <HStack
            spacing={1}
            bg="green.100"
            px={2}
            py={0.5}
            borderRadius="full"
            fontSize="xs"
            color="green.600"
            _dark={{ bg: 'green.900', color: 'green.300' }}
          >
            <CheckCircle size={12} />
            <Text fontWeight="medium">Done</Text>
          </HStack>
        )}
        {/* Drag handle - only show on desktop */}
        <Box
          {...attributes}
          {...listeners}
          cursor="grab"
          p={1}
          ml="auto"
          opacity={0}
          _groupHover={{ opacity: 0.5 }}
          display={{ base: 'none', md: 'block' }}
        >
          <GripVertical size={14} color={mutedColor} />
        </Box>
      </Flex>
    </Box>
  );
}
