/**
 * WorkoutViewModal - Read-only modal for viewing workout details
 *
 * Displays workout information including name, description, metrics,
 * and a visual chart preview of the workout structure.
 */
import { useMemo } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  Box,
  Text,
  HStack,
  VStack,
  Badge,
  Divider,
  useColorModeValue,
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { Clock, Zap, Activity } from 'lucide-react';
import { WorkoutChart } from '../WorkoutChart';
import { parseWorkout } from '../../../utils/parser';
import type { Workout, ParsedWorkout, WorkoutStructure } from '../../../types/workout';

interface WorkoutData {
  id: string;
  name: string;
  description?: string | null;
  durationSeconds: number;
  tssPlanned: number | null;
  ifPlanned?: number | null;
  structure?: unknown;
  workoutType?: string;
  category: {
    name: string;
  };
}

interface WorkoutViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  workout: WorkoutData | null;
}

export function WorkoutViewModal({ isOpen, onClose, workout }: WorkoutViewModalProps) {
  const { t } = useTranslation();
  const headerBg = useColorModeValue('gray.50', 'gray.800');
  const metricBg = useColorModeValue('gray.100', 'gray.700');
  const descriptionBg = useColorModeValue('gray.50', 'gray.750');
  const chartBorderColor = useColorModeValue('gray.200', 'gray.600');

  // Parse workout structure for chart display
  const parsedWorkout: ParsedWorkout | null = useMemo(() => {
    if (!workout?.structure) return null;

    try {
      // Convert API structure to Workout type for parser
      const workoutForParser: Workout = {
        id: parseInt(workout.id, 10) || 0,
        title: workout.name,
        description: workout.description || '',
        attributes: {
          structure: (workout.structure || { structure: [] }) as WorkoutStructure,
          totalTimePlanned: workout.durationSeconds / 3600,
          tssPlanned: workout.tssPlanned || 0,
          ifPlanned: workout.ifPlanned || 0,
          workoutTypeName: workout.category?.name || 'Workout',
        },
      };
      return parseWorkout(workoutForParser);
    } catch (e) {
      console.warn('Failed to parse workout structure for preview:', e);
      return null;
    }
  }, [workout]);

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    }
    return `${minutes}m`;
  };

  if (!workout) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader bg={headerBg} borderTopRadius="md">
          <VStack align="start" spacing={1}>
            <Text fontSize="lg" fontWeight="bold">
              {workout.name}
            </Text>
            <HStack spacing={2}>
              <Badge colorScheme="brand" fontSize="xs">
                {workout.category.name}
              </Badge>
              {workout.workoutType && (
                <Badge variant="outline" fontSize="xs">
                  {t(`builder.workoutTypes.${workout.workoutType}`, workout.workoutType)}
                </Badge>
              )}
            </HStack>
          </VStack>
        </ModalHeader>
        <ModalCloseButton />

        <ModalBody pb={6}>
          <VStack spacing={4} align="stretch">
            {/* Metrics Row */}
            <HStack spacing={3} justify="center" py={2}>
              <MetricCard
                icon={<Clock size={16} />}
                label={t('workout.duration')}
                value={formatDuration(workout.durationSeconds)}
                bg={metricBg}
              />
              <MetricCard
                icon={<Zap size={16} />}
                label={t('workout.tss')}
                value={workout.tssPlanned?.toString() || '-'}
                bg={metricBg}
              />
              <MetricCard
                icon={<Activity size={16} />}
                label={t('workout.intensityFactor')}
                value={workout.ifPlanned?.toFixed(2) || '-'}
                bg={metricBg}
              />
            </HStack>

            {/* Chart Preview */}
            {parsedWorkout && parsedWorkout.segments.length > 0 && (
              <>
                <Divider />
                <Box>
                  <Text fontSize="sm" fontWeight="medium" mb={2}>
                    {t('builder.workoutPreview')}
                  </Text>
                  <Box
                    borderRadius="md"
                    overflow="hidden"
                    border="1px solid"
                    borderColor={chartBorderColor}
                  >
                    <WorkoutChart
                      workout={parsedWorkout}
                      width={480}
                      height={200}
                      hoveredIndex={null}
                      onSegmentHover={() => {}}
                      onSegmentClick={() => {}}
                      selectedIndex={null}
                    />
                  </Box>
                </Box>
              </>
            )}

            {/* Description */}
            {workout.description && (
              <>
                <Divider />
                <Box>
                  <Text fontSize="sm" fontWeight="medium" mb={2}>
                    {t('workout.description')}
                  </Text>
                  <Box
                    bg={descriptionBg}
                    p={3}
                    borderRadius="md"
                    fontSize="sm"
                    whiteSpace="pre-wrap"
                  >
                    {workout.description}
                  </Box>
                </Box>
              </>
            )}
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  bg: string;
}

function MetricCard({ icon, label, value, bg }: MetricCardProps) {
  const textColor = useColorModeValue('gray.600', 'gray.400');

  return (
    <VStack
      bg={bg}
      px={4}
      py={3}
      borderRadius="md"
      spacing={1}
      minW="90px"
      align="center"
    >
      <HStack spacing={1} color={textColor}>
        {icon}
        <Text fontSize="xs" textTransform="uppercase">
          {label}
        </Text>
      </HStack>
      <Text fontSize="lg" fontWeight="bold">
        {value}
      </Text>
    </VStack>
  );
}
