import { Box, Flex, Text, VStack, HStack, Button, Icon, chakra, SimpleGrid, useColorModeValue } from '@chakra-ui/react';
import { motion, isValidMotionProp } from 'framer-motion';
import { Play, Clock, Zap, CheckCircle, Bike, Footprints, Dumbbell, Target, TrendingUp } from 'lucide-react';
import type { AthleteScheduledWorkout } from '../../../types/calendar';

const MotionBox = chakra(motion.div, {
  shouldForwardProp: (prop) => isValidMotionProp(prop) || prop === 'children',
});

interface TodayWorkoutSpotlightProps {
  workout?: AthleteScheduledWorkout;
  onStartWorkout?: (workout: AthleteScheduledWorkout) => void;
  onViewWorkout?: (workout: AthleteScheduledWorkout) => void;
}

function formatDuration(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h > 0) return `${h}h ${m}m`;
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

function getIntensityLabel(tss: number): { label: string; color: string } {
  if (tss >= 150) return { label: 'Very Hard', color: 'red.400' };
  if (tss >= 100) return { label: 'Hard', color: 'orange.400' };
  if (tss >= 50) return { label: 'Moderate', color: 'yellow.400' };
  return { label: 'Easy', color: 'green.400' };
}

export function TodayWorkoutSpotlight({
  workout,
  onStartWorkout,
  onViewWorkout,
}: TodayWorkoutSpotlightProps) {
  // Light/dark mode colors - clean and minimal
  const restDayBg = useColorModeValue('white', 'dark.700');
  const restDayBorder = useColorModeValue('gray.100', 'dark.500');
  const restDayTitle = useColorModeValue('gray.900', 'white');
  const restDaySubtitle = useColorModeValue('gray.500', 'gray.400');

  if (!workout) {
    return (
      <MotionBox
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        // @ts-expect-error framer-motion transition type conflict
        transition={{ duration: 0.4, delay: 0.1 }}
        h="full"
      >
        <Box
          bg={restDayBg}
          borderRadius="xl"
          p={{ base: 5, md: 6, lg: 8 }}
          borderWidth="1px"
          borderColor={restDayBorder}
          h="full"
          display="flex"
          flexDir="column"
          justifyContent="center"
          boxShadow={useColorModeValue('sm', 'none')}
        >
          <Flex align="center" gap={4}>
            <Flex
              align="center"
              justify="center"
              w={{ base: 12, lg: 16 }}
              h={{ base: 12, lg: 16 }}
              borderRadius="full"
              bg="green.500"
              color="white"
            >
              <CheckCircle size={28} />
            </Flex>
            <VStack align="start" spacing={1}>
              <Text fontSize={{ base: 'lg', lg: '2xl' }} fontWeight="bold" color={restDayTitle}>
                Rest Day
              </Text>
              <Text fontSize={{ base: 'sm', lg: 'md' }} color={restDaySubtitle}>
                No workout scheduled for today. Recover strong!
              </Text>
            </VStack>
          </Flex>
        </Box>
      </MotionBox>
    );
  }

  const WorkoutIcon = getWorkoutIcon(workout.workout.attributes.workoutType);
  const duration = workout.workout.attributes.totalTimePlanned || 0;
  const tss = workout.workout.attributes.tssPlanned || 0;
  const isCompleted = workout.completed;
  const intensity = getIntensityLabel(tss);
  const ifScore = workout.workout.attributes.ifPlanned;

  return (
    <MotionBox
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      // @ts-expect-error framer-motion transition type conflict
      transition={{ duration: 0.4, delay: 0.1 }}
      h="full"
    >
      <Box
        bgGradient={isCompleted
          ? 'linear(135deg, green.900 0%, green.800 100%)'
          : 'linear(135deg, brand.400 0%, gold.400 100%)'
        }
        borderRadius="xl"
        overflow="hidden"
        position="relative"
        h="full"
      >
        {/* Background pattern */}
        <Box
          position="absolute"
          top="-30%"
          right="-15%"
          width="50%"
          height="160%"
          bg="whiteAlpha.100"
          borderRadius="full"
          filter="blur(40px)"
        />

        <Flex
          direction={{ base: 'column', lg: 'row' }}
          p={{ base: 5, md: 6, lg: 8 }}
          position="relative"
          h="full"
          gap={{ base: 4, lg: 8 }}
        >
          {/* Main content - left side on desktop */}
          <Flex direction="column" flex={1} justify="space-between">
            {/* Header */}
            <Box>
              <HStack spacing={2} mb={4}>
                <Box
                  p={2}
                  borderRadius="lg"
                  bg={isCompleted ? 'whiteAlpha.200' : 'blackAlpha.200'}
                >
                  <Icon
                    as={isCompleted ? CheckCircle : WorkoutIcon}
                    boxSize={{ base: 5, lg: 6 }}
                    color={isCompleted ? 'white' : 'dark.800'}
                  />
                </Box>
                <Text
                  fontSize="xs"
                  fontWeight="600"
                  textTransform="uppercase"
                  letterSpacing="wider"
                  color={isCompleted ? 'whiteAlpha.800' : 'blackAlpha.700'}
                >
                  {isCompleted ? 'Completed' : "Today's Workout"}
                </Text>
              </HStack>

              {/* Workout title */}
              <Text
                fontSize={{ base: 'xl', md: '2xl', lg: '3xl' }}
                fontWeight="bold"
                color={isCompleted ? 'white' : 'dark.800'}
                mb={3}
                noOfLines={2}
              >
                {workout.workout.title}
              </Text>

              {/* Description on desktop */}
              {workout.workout.description && (
                <Text
                  display={{ base: 'none', lg: 'block' }}
                  fontSize="sm"
                  color={isCompleted ? 'whiteAlpha.800' : 'blackAlpha.700'}
                  noOfLines={2}
                  mb={4}
                >
                  {workout.workout.description}
                </Text>
              )}
            </Box>

            {/* CTA Button - at bottom on mobile/desktop */}
            <Button
              size="lg"
              width={{ base: 'full', lg: 'auto' }}
              maxW={{ lg: '240px' }}
              bg={isCompleted ? 'whiteAlpha.200' : 'dark.800'}
              color="white"
              _hover={{
                bg: isCompleted ? 'whiteAlpha.300' : 'dark.700',
                transform: 'translateY(-2px)',
              }}
              _active={{
                transform: 'translateY(0)',
              }}
              leftIcon={isCompleted ? <CheckCircle size={18} /> : <Play size={18} />}
              onClick={() => isCompleted
                ? onViewWorkout?.(workout)
                : onStartWorkout?.(workout)
              }
              fontWeight="600"
              h={12}
              fontSize="md"
              mt={{ base: 4, lg: 6 }}
            >
              {isCompleted ? 'View Results' : 'Start Workout'}
            </Button>
          </Flex>

          {/* Stats - right side on desktop */}
          <Flex
            direction="column"
            justify="center"
            borderLeft={{ lg: '1px' }}
            borderColor={{ lg: isCompleted ? 'whiteAlpha.200' : 'blackAlpha.200' }}
            pl={{ lg: 8 }}
            minW={{ lg: '200px' }}
          >
            {/* Mobile stats - horizontal */}
            <HStack display={{ base: 'flex', lg: 'none' }} spacing={6}>
              <HStack spacing={2}>
                <Icon as={Clock} boxSize={4} color={isCompleted ? 'whiteAlpha.700' : 'blackAlpha.600'} />
                <Text fontSize="sm" fontWeight="600" color={isCompleted ? 'whiteAlpha.900' : 'blackAlpha.800'}>
                  {formatDuration(duration)}
                </Text>
              </HStack>
              {tss > 0 && (
                <HStack spacing={2}>
                  <Icon as={Zap} boxSize={4} color={isCompleted ? 'whiteAlpha.700' : 'blackAlpha.600'} />
                  <Text fontSize="sm" fontWeight="600" color={isCompleted ? 'whiteAlpha.900' : 'blackAlpha.800'}>
                    {tss} TSS
                  </Text>
                </HStack>
              )}
            </HStack>

            {/* Desktop stats - vertical with more detail */}
            <SimpleGrid display={{ base: 'none', lg: 'grid' }} columns={1} spacing={5}>
              <VStack align="start" spacing={1}>
                <HStack spacing={2}>
                  <Icon as={Clock} boxSize={5} color={isCompleted ? 'whiteAlpha.600' : 'blackAlpha.500'} />
                  <Text fontSize="xs" color={isCompleted ? 'whiteAlpha.700' : 'blackAlpha.600'} textTransform="uppercase" letterSpacing="wide">
                    Duration
                  </Text>
                </HStack>
                <Text fontSize="2xl" fontWeight="bold" color={isCompleted ? 'white' : 'dark.800'}>
                  {formatDuration(duration)}
                </Text>
              </VStack>

              {tss > 0 && (
                <VStack align="start" spacing={1}>
                  <HStack spacing={2}>
                    <Icon as={Zap} boxSize={5} color={isCompleted ? 'whiteAlpha.600' : 'blackAlpha.500'} />
                    <Text fontSize="xs" color={isCompleted ? 'whiteAlpha.700' : 'blackAlpha.600'} textTransform="uppercase" letterSpacing="wide">
                      Training Load
                    </Text>
                  </HStack>
                  <Text fontSize="2xl" fontWeight="bold" color={isCompleted ? 'white' : 'dark.800'}>
                    {tss} <Text as="span" fontSize="sm" fontWeight="normal">TSS</Text>
                  </Text>
                </VStack>
              )}

              <VStack align="start" spacing={1}>
                <HStack spacing={2}>
                  <Icon as={Target} boxSize={5} color={isCompleted ? 'whiteAlpha.600' : 'blackAlpha.500'} />
                  <Text fontSize="xs" color={isCompleted ? 'whiteAlpha.700' : 'blackAlpha.600'} textTransform="uppercase" letterSpacing="wide">
                    Intensity
                  </Text>
                </HStack>
                <HStack spacing={2}>
                  <Box w={2} h={2} borderRadius="full" bg={intensity.color} />
                  <Text fontSize="lg" fontWeight="600" color={isCompleted ? 'white' : 'dark.800'}>
                    {intensity.label}
                  </Text>
                </HStack>
              </VStack>

              {ifScore && ifScore > 0 && (
                <VStack align="start" spacing={1}>
                  <HStack spacing={2}>
                    <Icon as={TrendingUp} boxSize={5} color={isCompleted ? 'whiteAlpha.600' : 'blackAlpha.500'} />
                    <Text fontSize="xs" color={isCompleted ? 'whiteAlpha.700' : 'blackAlpha.600'} textTransform="uppercase" letterSpacing="wide">
                      IF
                    </Text>
                  </HStack>
                  <Text fontSize="lg" fontWeight="600" color={isCompleted ? 'white' : 'dark.800'}>
                    {ifScore.toFixed(2)}
                  </Text>
                </VStack>
              )}
            </SimpleGrid>
          </Flex>
        </Flex>
      </Box>
    </MotionBox>
  );
}
