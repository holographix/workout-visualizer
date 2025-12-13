import { useState, useMemo, memo, useCallback } from 'react';
import {
  Box,
  Flex,
  Heading,
  Text,
  VStack,
  HStack,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Icon,
  Spinner,
  Center,
  useColorModeValue,
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { Search, Clock, Zap, GripVertical, Library } from 'lucide-react';
import { getWorkoutTypeConfig } from '../../../utils/workoutTypes';
import { workoutLibrary, type WorkoutLibraryItem } from '../../../data/workoutLibrary';

// Moved outside component to avoid recreation
const formatDuration = (hours: number): string => {
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return m > 0 ? `${h}h${m}m` : `${h}h`;
};

// API workout type (from useWorkoutsAPI)
export interface ApiWorkoutItem {
  id: string;
  slug: string;
  name: string;
  title: string | null;
  description: string | null;
  durationSeconds: number;
  tssPlanned: number | null;
  ifPlanned: number | null;
  structure: unknown;
  workoutType?: string;
  category: {
    id: string;
    name: string;
    slug: string;
  };
}

export interface ApiCategory {
  id: string;
  name: string;
  slug: string;
}

interface WorkoutLibrarySidebarProps {
  onDragStart?: (item: WorkoutLibraryItem) => void;
  onDragEnd?: () => void;
  onWorkoutTap?: (item: WorkoutLibraryItem) => void; // For mobile tap-to-select
  // API mode props
  apiWorkouts?: ApiWorkoutItem[];
  apiCategories?: ApiCategory[];
  isLoadingApi?: boolean;
  onApiWorkoutDragStart?: (workout: ApiWorkoutItem) => void;
  onApiWorkoutTap?: (workout: ApiWorkoutItem) => void;
}

export function WorkoutLibrarySidebar({
  onDragStart,
  onDragEnd,
  onWorkoutTap,
  apiWorkouts,
  apiCategories,
  isLoadingApi,
  onApiWorkoutDragStart,
  onApiWorkoutTap,
}: WorkoutLibrarySidebarProps) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Determine if we're in API mode
  const useApiMode = apiWorkouts !== undefined;

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const headerBg = useColorModeValue('gray.50', 'gray.900');

  // Hoist color values for items to parent to avoid repeated useColorModeValue calls
  const itemBgColor = useColorModeValue('gray.50', 'gray.700');
  const itemHoverBg = useColorModeValue('gray.100', 'gray.600');
  const itemTextColor = useColorModeValue('gray.800', 'white');
  const itemMutedColor = useColorModeValue('gray.500', 'gray.400');

  // Filter API workouts
  const filteredApiWorkouts = useMemo(() => {
    if (!apiWorkouts) return [];

    let workouts = apiWorkouts;

    if (selectedCategory !== 'all') {
      workouts = workouts.filter((w) => w.category.id === selectedCategory);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      workouts = workouts.filter(
        (w) =>
          w.name.toLowerCase().includes(query) ||
          w.title?.toLowerCase().includes(query) ||
          w.description?.toLowerCase().includes(query)
      );
    }

    return workouts;
  }, [apiWorkouts, selectedCategory, searchQuery]);

  // Filter local library workouts
  const filteredWorkouts = useMemo(() => {
    let workouts: WorkoutLibraryItem[] = [];

    if (selectedCategory === 'all') {
      workouts = workoutLibrary.flatMap((c) => c.workouts);
    } else {
      const category = workoutLibrary.find((c) => c.id === selectedCategory);
      workouts = category?.workouts || [];
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      workouts = workouts.filter(
        (w) =>
          w.name.toLowerCase().includes(query) ||
          w.workout.title?.toLowerCase().includes(query) ||
          w.workout.description?.toLowerCase().includes(query)
      );
    }

    return workouts;
  }, [selectedCategory, searchQuery]);

  // Local library drag handlers
  const handleDragStart = useCallback((e: React.DragEvent, item: WorkoutLibraryItem) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ workoutId: item.id }));
    e.dataTransfer.effectAllowed = 'copy';
    onDragStart?.(item);
  }, [onDragStart]);

  const handleDragEnd = useCallback(() => {
    onDragEnd?.();
  }, [onDragEnd]);

  // API workout drag handlers
  const handleApiDragStart = useCallback((e: React.DragEvent, workout: ApiWorkoutItem) => {
    // Include duration in hours for capacity validation
    const durationHours = workout.durationSeconds / 3600;
    e.dataTransfer.setData('application/json', JSON.stringify({
      workoutId: workout.id,
      isApi: true,
      durationHours,
    }));
    e.dataTransfer.effectAllowed = 'copy';
    onApiWorkoutDragStart?.(workout);
  }, [onApiWorkoutDragStart]);

  // Determine workout count
  const workoutCount = useApiMode ? filteredApiWorkouts.length : filteredWorkouts.length;

  return (
    <Box
      bg={bgColor}
      borderRadius="xl"
      borderWidth="1px"
      borderColor={borderColor}
      overflow="hidden"
      h="full"
      display="flex"
      flexDirection="column"
    >
      {/* Header */}
      <Flex
        bg={headerBg}
        px={4}
        py={3}
        borderBottomWidth="1px"
        borderColor={borderColor}
        align="center"
        gap={2}
      >
        <Library size={18} />
        <Heading size="sm">{t('library.title')}</Heading>
      </Flex>

      {/* Filters */}
      <VStack p={3} spacing={2} borderBottomWidth="1px" borderColor={borderColor}>
        <InputGroup size="sm">
          <InputLeftElement>
            <Icon as={Search} w={4} h={4} color="gray.400" />
          </InputLeftElement>
          <Input
            placeholder={t('library.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </InputGroup>
        <Select
          size="sm"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="all">{t('library.allCategories')}</option>
          {useApiMode
            ? (apiCategories || []).map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))
            : workoutLibrary.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name} ({category.workouts.length})
                </option>
              ))}
        </Select>
      </VStack>

      {/* Workout List */}
      <Box flex={1} overflowY="auto" p={2}>
        {isLoadingApi ? (
          <Center py={8}>
            <Spinner size="md" color="brand.500" />
          </Center>
        ) : (
          <VStack spacing={2} align="stretch">
            {useApiMode ? (
              // API mode - show API workouts
              filteredApiWorkouts.length === 0 ? (
                <Text fontSize="sm" color="gray.500" textAlign="center" py={4}>
                  {t('library.noWorkoutsFound')}
                </Text>
              ) : (
                filteredApiWorkouts.map((workout) => (
                  <DraggableApiWorkoutItem
                    key={workout.id}
                    workout={workout}
                    bgColor={itemBgColor}
                    hoverBg={itemHoverBg}
                    textColor={itemTextColor}
                    mutedColor={itemMutedColor}
                    onDragStart={handleApiDragStart}
                    onDragEnd={handleDragEnd}
                    onTap={onApiWorkoutTap}
                  />
                ))
              )
            ) : (
              // Local library mode
              filteredWorkouts.length === 0 ? (
                <Text fontSize="sm" color="gray.500" textAlign="center" py={4}>
                  {t('library.noWorkoutsFound')}
                </Text>
              ) : (
                filteredWorkouts.map((item) => (
                  <DraggableWorkoutItem
                    key={item.id}
                    item={item}
                    bgColor={itemBgColor}
                    hoverBg={itemHoverBg}
                    textColor={itemTextColor}
                    mutedColor={itemMutedColor}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    onTap={onWorkoutTap}
                  />
                ))
              )
            )}
          </VStack>
        )}
      </Box>

      {/* Footer */}
      <Box px={3} py={2} borderTopWidth="1px" borderColor={borderColor}>
        <Text fontSize="xs" color="gray.500">
          {t('library.workoutsCount', { count: workoutCount })} • {t('library.dragToCalendar')}
        </Text>
      </Box>
    </Box>
  );
}

interface DraggableWorkoutItemProps {
  item: WorkoutLibraryItem;
  bgColor: string;
  hoverBg: string;
  textColor: string;
  mutedColor: string;
  onDragStart: (e: React.DragEvent, item: WorkoutLibraryItem) => void;
  onDragEnd: () => void;
  onTap?: (item: WorkoutLibraryItem) => void;
}

const DraggableWorkoutItem = memo(function DraggableWorkoutItem({
  item,
  bgColor,
  hoverBg,
  textColor,
  mutedColor,
  onDragStart,
  onDragEnd,
  onTap,
}: DraggableWorkoutItemProps) {
  const workout = item.workout;
  const duration = workout.attributes?.totalTimePlanned || 1;
  const tss = workout.attributes?.tssPlanned || 0;
  const workoutTypeConfig = getWorkoutTypeConfig(workout.attributes?.workoutType);
  const WorkoutTypeIcon = workoutTypeConfig.icon;

  const handleClick = useCallback(() => {
    onTap?.(item);
  }, [onTap, item]);

  return (
    <Box
      draggable={!onTap} // Disable drag on mobile (when onTap is provided)
      onDragStart={(e) => onDragStart(e, item)}
      onDragEnd={onDragEnd}
      onClick={handleClick}
      bg={bgColor}
      _hover={{ bg: hoverBg }}
      _active={{ bg: hoverBg, transform: 'scale(0.98)' }}
      borderRadius="md"
      p={2}
      cursor={onTap ? 'pointer' : 'grab'}
      transition="transform 0.1s"
      userSelect="none"
    >
      <HStack spacing={2} mb={1}>
        <GripVertical size={12} color={mutedColor} />
        <Icon as={WorkoutTypeIcon} w={3} h={3} color={`${workoutTypeConfig.color}.500`} />
        <Text fontSize="xs" fontWeight="semibold" color={textColor} noOfLines={1} flex={1}>
          {item.name}
        </Text>
      </HStack>
      <HStack spacing={3} fontSize="2xs" color={mutedColor} pl={5}>
        <HStack spacing={0.5}>
          <Clock size={10} />
          <Text>{formatDuration(duration)}</Text>
        </HStack>
        {tss > 0 && (
          <HStack spacing={0.5}>
            <Zap size={10} />
            <Text>{Math.round(tss)} TSS</Text>
          </HStack>
        )}
      </HStack>
    </Box>
  );
});

// API workout item component
interface DraggableApiWorkoutItemProps {
  workout: ApiWorkoutItem;
  bgColor: string;
  hoverBg: string;
  textColor: string;
  mutedColor: string;
  onDragStart: (e: React.DragEvent, workout: ApiWorkoutItem) => void;
  onDragEnd: () => void;
  onTap?: (workout: ApiWorkoutItem) => void;
}

const DraggableApiWorkoutItem = memo(function DraggableApiWorkoutItem({
  workout,
  bgColor,
  hoverBg,
  textColor,
  mutedColor,
  onDragStart,
  onDragEnd,
  onTap,
}: DraggableApiWorkoutItemProps) {
  const durationHours = workout.durationSeconds / 3600;
  const tss = workout.tssPlanned || 0;
  const workoutTypeConfig = getWorkoutTypeConfig(workout.workoutType);
  const WorkoutTypeIcon = workoutTypeConfig.icon;

  const handleClick = useCallback(() => {
    onTap?.(workout);
  }, [onTap, workout]);

  return (
    <Box
      draggable={!onTap}
      onDragStart={(e) => onDragStart(e, workout)}
      onDragEnd={onDragEnd}
      onClick={handleClick}
      bg={bgColor}
      _hover={{ bg: hoverBg }}
      _active={{ bg: hoverBg, transform: 'scale(0.98)' }}
      borderRadius="md"
      p={2}
      cursor={onTap ? 'pointer' : 'grab'}
      transition="transform 0.1s"
      userSelect="none"
    >
      <HStack spacing={2} mb={1}>
        <GripVertical size={12} color={mutedColor} />
        <Icon as={WorkoutTypeIcon} w={3} h={3} color={`${workoutTypeConfig.color}.500`} />
        <Text fontSize="xs" fontWeight="semibold" color={textColor} noOfLines={1} flex={1}>
          {workout.name}
        </Text>
      </HStack>
      <HStack spacing={3} fontSize="2xs" color={mutedColor} pl={5}>
        <HStack spacing={0.5}>
          <Clock size={10} />
          <Text>{formatDuration(durationHours)}</Text>
        </HStack>
        {tss > 0 && (
          <HStack spacing={0.5}>
            <Zap size={10} />
            <Text>{Math.round(tss)} TSS</Text>
          </HStack>
        )}
      </HStack>
    </Box>
  );
});
