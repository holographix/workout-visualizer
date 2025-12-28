import { Box, Flex, Text, HStack, VStack, Icon, chakra, useColorModeValue } from '@chakra-ui/react';
import { motion, isValidMotionProp } from 'framer-motion';
import { ChevronRight, Clock, Zap, Bike, Footprints, Dumbbell, Calendar } from 'lucide-react';
import { format, isToday, isTomorrow } from 'date-fns';
import { useTranslation } from 'react-i18next';
import type { AthleteScheduledWorkout } from '../../../types/calendar';

const MotionBox = chakra(motion.div, {
  shouldForwardProp: (prop) => isValidMotionProp(prop) || prop === 'children',
});

interface UpcomingWorkoutsProps {
  workouts: AthleteScheduledWorkout[];
  onWorkoutClick: (workout: AthleteScheduledWorkout) => void;
  onViewAll?: () => void;
}

function formatWorkoutDate(dateString: string, t: (key: string) => string): string {
  const date = new Date(dateString);
  if (isToday(date)) return t('common.today');
  if (isTomorrow(date)) return t('common.tomorrow');
  return format(date, 'EEE');
}

function formatDuration(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h > 0) return `${h}h${m > 0 ? ` ${m}m` : ''}`;
  return `${m}m`;
}

function getWorkoutIcon(workoutType?: string) {
  switch (workoutType) {
    case 'indoorCycling':
    case 'cycling':
      return Bike;
    case 'running':
      return Footprints;
    case 'strength':
      return Dumbbell;
    default:
      return Bike;
  }
}

export function UpcomingWorkouts({
  workouts,
  onWorkoutClick,
  onViewAll,
}: UpcomingWorkoutsProps) {
  const { t } = useTranslation();

  // Light/dark mode colors - clean and minimal
  const cardBg = useColorModeValue('white', 'dark.700');
  const cardBorder = useColorModeValue('gray.100', 'dark.500');
  const cardItemBg = useColorModeValue('white', 'dark.600');
  const cardItemHoverBg = useColorModeValue('gray.50', 'dark.550');
  const labelColor = useColorModeValue('gray.500', 'gray.400');
  const titleColor = useColorModeValue('gray.900', 'white');
  const mutedColor = useColorModeValue('gray.400', 'gray.500');
  const dateBadgeBg = useColorModeValue('gray.100', 'dark.700');
  const dateBadgeText = useColorModeValue('gray.500', 'gray.400');
  const dateBadgeDateText = useColorModeValue('gray.900', 'white');

  if (workouts.length === 0) {
    return (
      <MotionBox
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        // @ts-expect-error framer-motion transition type conflict
        transition={{ duration: 0.4, delay: 0.3 }}
        h="full"
      >
        <Box
          bg={cardBg}
          borderRadius="xl"
          p={{ base: 5, md: 6 }}
          borderWidth="1px"
          borderColor={cardBorder}
          textAlign="center"
          h="full"
          display="flex"
          flexDir="column"
          alignItems="center"
          justifyContent="center"
          boxShadow={useColorModeValue('sm', 'none')}
        >
          <Icon as={Calendar} boxSize={10} color={mutedColor} mb={3} />
          <Text color={labelColor} fontSize="sm">
            {t('dashboard.noUpcomingWorkouts')}
          </Text>
        </Box>
      </MotionBox>
    );
  }

  return (
    <MotionBox
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      // @ts-expect-error framer-motion transition type conflict
      transition={{ duration: 0.4, delay: 0.3 }}
      h="full"
    >
      <Box
        bg={{ lg: cardBg }}
        borderRadius={{ lg: 'xl' }}
        p={{ lg: 5 }}
        borderWidth={{ lg: '1px' }}
        borderColor={{ lg: cardBorder }}
        boxShadow={{ lg: useColorModeValue('sm', 'none') }}
        h="full"
      >
        <Flex justify="space-between" align="center" mb={3}>
          <Text
            fontSize="xs"
            fontWeight="600"
            textTransform="uppercase"
            letterSpacing="wider"
            color={labelColor}
          >
            {t('dashboard.comingUp')}
          </Text>
          {onViewAll && (
            <Text
              fontSize="xs"
              fontWeight="600"
              color="brand.400"
              cursor="pointer"
              onClick={onViewAll}
              _hover={{ textDecoration: 'underline' }}
            >
              {t('dashboard.viewAll')}
            </Text>
          )}
        </Flex>

        {/* Mobile: Horizontal scroll | Desktop: Vertical stack */}
        <Flex
          display={{ base: 'flex', lg: 'none' }}
          gap={3}
          overflowX="auto"
          pb={2}
          mx={{ base: -4, md: 0 }}
          px={{ base: 4, md: 0 }}
          css={{
            '&::-webkit-scrollbar': { display: 'none' },
            scrollbarWidth: 'none',
            scrollSnapType: 'x mandatory',
          }}
        >
          {workouts.map((workout, index) => (
            <WorkoutCard
              key={workout.id}
              workout={workout}
              onClick={() => onWorkoutClick(workout)}
              index={index}
              cardBg={cardBg}
              cardBorder={cardBorder}
              titleColor={titleColor}
              labelColor={labelColor}
              t={t}
            />
          ))}
        </Flex>

        {/* Desktop: Vertical list */}
        <VStack
          display={{ base: 'none', lg: 'flex' }}
          spacing={3}
          align="stretch"
        >
          {workouts.slice(0, 4).map((workout, index) => (
            <CompactWorkoutCard
              key={workout.id}
              workout={workout}
              onClick={() => onWorkoutClick(workout)}
              index={index}
              cardItemBg={cardItemBg}
              cardItemHoverBg={cardItemHoverBg}
              cardBorder={cardBorder}
              titleColor={titleColor}
              labelColor={labelColor}
              dateBadgeBg={dateBadgeBg}
              dateBadgeText={dateBadgeText}
              dateBadgeDateText={dateBadgeDateText}
              t={t}
            />
          ))}
        </VStack>
      </Box>
    </MotionBox>
  );
}

interface WorkoutCardProps {
  workout: AthleteScheduledWorkout;
  onClick: () => void;
  index: number;
  cardBg?: string;
  cardBorder?: string;
  titleColor?: string;
  labelColor?: string;
  t: (key: string) => string;
}

interface CompactWorkoutCardProps extends WorkoutCardProps {
  cardItemBg?: string;
  cardItemHoverBg?: string;
  dateBadgeBg?: string;
  dateBadgeText?: string;
  dateBadgeDateText?: string;
}

// Compact card for desktop vertical list
function CompactWorkoutCard({
  workout,
  onClick,
  index,
  cardItemBg = 'dark.600',
  cardItemHoverBg = 'dark.550',
  cardBorder = 'dark.500',
  titleColor = 'white',
  labelColor = 'gray.400',
  dateBadgeBg = 'dark.700',
  dateBadgeText = 'gray.400',
  dateBadgeDateText = 'white',
  t,
}: CompactWorkoutCardProps) {
  const WorkoutIcon = getWorkoutIcon(workout.workout.attributes.workoutType);
  const duration = workout.workout.attributes.totalTimePlanned || 0;
  const tss = workout.workout.attributes.tssPlanned || 0;
  const dateLabel = formatWorkoutDate(workout.date, t);
  const today = t('common.today');
  const tomorrow = t('common.tomorrow');
  const isHighlight = dateLabel === today || dateLabel === tomorrow;

  return (
    <MotionBox
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      // @ts-expect-error framer-motion transition type conflict
      transition={{ duration: 0.3, delay: 0.05 * index }}
      onClick={onClick}
      cursor="pointer"
      bg={cardItemBg}
      borderRadius="lg"
      p={3}
      borderWidth="1px"
      borderColor={isHighlight ? 'brand.400' : cardBorder}
      _hover={{
        borderColor: 'brand.400',
        bg: cardItemHoverBg,
      }}
    >
      <Flex align="center" gap={3}>
        {/* Date badge */}
        <Flex
          align="center"
          justify="center"
          minW="50px"
          h="50px"
          borderRadius="lg"
          bg={isHighlight ? 'brand.400' : dateBadgeBg}
          flexDir="column"
        >
          <Text
            fontSize="xs"
            fontWeight="bold"
            color={isHighlight ? 'dark.800' : dateBadgeText}
            textTransform="uppercase"
          >
            {dateLabel === today || dateLabel === tomorrow
              ? dateLabel.slice(0, 3)
              : format(new Date(workout.date), 'EEE')}
          </Text>
          <Text
            fontSize="lg"
            fontWeight="bold"
            color={isHighlight ? 'dark.800' : dateBadgeDateText}
            lineHeight="1"
          >
            {format(new Date(workout.date), 'd')}
          </Text>
        </Flex>

        {/* Workout info */}
        <VStack align="start" spacing={0} flex={1} overflow="hidden">
          <Text
            fontSize="sm"
            fontWeight="600"
            color={titleColor}
            noOfLines={1}
          >
            {workout.workout.title}
          </Text>
          <HStack spacing={3} fontSize="xs" color={labelColor}>
            <HStack spacing={1}>
              <Icon as={Clock} boxSize={3} />
              <Text>{formatDuration(duration)}</Text>
            </HStack>
            {tss > 0 && (
              <HStack spacing={1}>
                <Icon as={Zap} boxSize={3} />
                <Text>{tss}</Text>
              </HStack>
            )}
          </HStack>
        </VStack>

        {/* Icon */}
        <Icon as={WorkoutIcon} boxSize={4} color={labelColor} />
      </Flex>
    </MotionBox>
  );
}

function WorkoutCard({
  workout,
  onClick,
  index,
  cardBg = 'dark.700',
  cardBorder = 'dark.500',
  titleColor = 'white',
  labelColor = 'gray.400',
  t,
}: WorkoutCardProps) {
  const WorkoutIcon = getWorkoutIcon(workout.workout.attributes.workoutType);
  const duration = workout.workout.attributes.totalTimePlanned || 0;
  const tss = workout.workout.attributes.tssPlanned || 0;
  const dateLabel = formatWorkoutDate(workout.date, t);
  const today = t('common.today');
  const tomorrow = t('common.tomorrow');
  const isHighlight = dateLabel === today || dateLabel === tomorrow;

  return (
    <MotionBox
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      // @ts-expect-error framer-motion transition type conflict
      transition={{ duration: 0.3, delay: 0.1 * index }}
      minW={{ base: '260px', md: '280px' }}
      scrollSnapAlign="start"
      onClick={onClick}
      cursor="pointer"
      bg={cardBg}
      borderRadius="xl"
      borderWidth="1px"
      borderColor={isHighlight ? 'brand.400' : cardBorder}
      overflow="hidden"
      _hover={{
        borderColor: 'brand.400',
        transform: 'translateY(-2px)',
      }}
      display="flex"
      flexDir="column"
    >
      {/* Date header */}
      <Box
        px={4}
        py={2}
        bg={isHighlight ? 'brand.400' : cardBorder}
      >
        <Text
          fontSize="xs"
          fontWeight="bold"
          textTransform="uppercase"
          letterSpacing="wider"
          color={isHighlight ? 'dark.800' : labelColor}
        >
          {dateLabel}
          {!isHighlight && (
            <Text as="span" ml={2} fontWeight="normal" textTransform="none">
              {format(new Date(workout.date), 'MMM d')}
            </Text>
          )}
        </Text>
      </Box>

      {/* Workout content */}
      <Box p={4} flex={1}>
        <HStack spacing={3} mb={3}>
          <Flex
            align="center"
            justify="center"
            w={10}
            h={10}
            borderRadius="lg"
            bg={cardBorder}
          >
            <Icon as={WorkoutIcon} boxSize={5} color="brand.400" />
          </Flex>
          <VStack align="start" spacing={0} flex={1}>
            <Text
              fontSize="sm"
              fontWeight="bold"
              color={titleColor}
              noOfLines={1}
            >
              {workout.workout.title}
            </Text>
            <HStack spacing={3} fontSize="xs" color={labelColor}>
              <HStack spacing={1}>
                <Icon as={Clock} boxSize={3} />
                <Text>{formatDuration(duration)}</Text>
              </HStack>
              {tss > 0 && (
                <HStack spacing={1}>
                  <Icon as={Zap} boxSize={3} />
                  <Text>{tss}</Text>
                </HStack>
              )}
            </HStack>
          </VStack>
          <Icon as={ChevronRight} color={labelColor} boxSize={5} />
        </HStack>
      </Box>
    </MotionBox>
  );
}
