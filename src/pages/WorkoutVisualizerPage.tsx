import { useState, useMemo, useCallback } from 'react';
import { ParentSize } from '@visx/responsive';
import {
  Box,
  Container,
  Heading,
  Text,
  SimpleGrid,
  Card,
  CardHeader,
  CardBody,
  HStack,
  useColorModeValue,
} from '@chakra-ui/react';
import { parseWorkout } from '../utils/parser';
import { sampleWorkout } from '../data/sample';
import {
  Header,
  WorkoutChart,
  IntervalList,
  ChartLegend,
  StatsGrid,
} from '../components';
import { WorkoutTypeBadge } from '../components/molecules';
import type { Workout } from '../types/workout';

// Format duration from seconds to readable string
const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
  return `${mins}m`;
};

export function WorkoutVisualizerPage() {
  const [workoutData] = useState<Workout>(sampleWorkout);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // Color mode values
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const textColor = useColorModeValue('gray.800', 'white');
  const mutedColor = useColorModeValue('gray.600', 'gray.400');
  const footerBorderColor = useColorModeValue('gray.200', 'gray.800');

  const parsedWorkout = useMemo(() => parseWorkout(workoutData), [workoutData]);

  const handleSegmentHover = useCallback((index: number | null) => {
    setHoveredIndex(index);
  }, []);

  const handleSegmentClick = useCallback((index: number | null) => {
    setSelectedIndex(index);
  }, []);

  return (
    <Box minH="100vh" bg={bgColor}>
      {/* Header */}
      <Header />

      {/* Main Content */}
      <Container maxW="7xl" py={8}>
        {/* Workout Title */}
        <Box mb={6}>
          <HStack spacing={3} mb={2}>
            <WorkoutTypeBadge type={workoutData.attributes.workoutTypeName} />
          </HStack>
          <Heading size="xl" color={textColor} mb={1}>
            {parsedWorkout.metadata.title}
          </Heading>
        </Box>

        {/* Stats Grid */}
        <Box mb={8}>
          <StatsGrid
            duration={formatDuration(parsedWorkout.totalDuration)}
            tss={parsedWorkout.metadata.tss}
            intensityFactor={parsedWorkout.metadata.if}
            intervals={parsedWorkout.segments.length}
          />
        </Box>

        {/* Chart Card */}
        <Card variant="elevated" mb={8}>
          <CardHeader pb={0}>
            <ChartLegend />
          </CardHeader>
          <CardBody>
            <Box h={{ base: '350px', md: '400px' }} w="full">
              <ParentSize>
                {({ width, height }) => (
                  <WorkoutChart
                    workout={parsedWorkout}
                    width={width}
                    height={height}
                    hoveredIndex={hoveredIndex}
                    selectedIndex={selectedIndex}
                    onSegmentHover={handleSegmentHover}
                    onSegmentClick={handleSegmentClick}
                  />
                )}
              </ParentSize>
            </Box>
          </CardBody>
        </Card>

        {/* Description & Intervals */}
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
          {/* Description */}
          <Card variant="elevated">
            <CardHeader>
              <Text
                fontSize="sm"
                fontWeight="medium"
                color={mutedColor}
                textTransform="uppercase"
                letterSpacing="wider"
              >
                Description
              </Text>
            </CardHeader>
            <CardBody pt={0}>
              <Text color={mutedColor} whiteSpace="pre-wrap" lineHeight="tall">
                {parsedWorkout.metadata.description || 'No description provided.'}
              </Text>
            </CardBody>
          </Card>

          {/* Interval Structure */}
          <Card variant="elevated">
            <CardBody>
              <IntervalList
                segments={parsedWorkout.segments}
                hoveredIndex={hoveredIndex}
                selectedIndex={selectedIndex}
                onSegmentHover={handleSegmentHover}
                onSegmentClick={handleSegmentClick}
                formatDuration={formatDuration}
              />
            </CardBody>
          </Card>
        </SimpleGrid>
      </Container>

      {/* Footer */}
      <Box borderTopWidth="1px" borderColor={footerBorderColor} mt={12}>
        <Container maxW="7xl" py={4}>
          <Text fontSize="xs" color={mutedColor} textAlign="center">
            RidePro - Structured workout visualization
          </Text>
        </Container>
      </Box>
    </Box>
  );
}
