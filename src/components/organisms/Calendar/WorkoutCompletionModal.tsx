/**
 * WorkoutCompletionModal - Modal for athletes to view workout details and submit results
 */
import { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Button,
  VStack,
  HStack,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Select,
  Box,
  Text,
  Badge,
  Divider,
  SimpleGrid,
  useColorModeValue,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  SliderMark,
  Icon,
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { Clock, Zap, Activity, Heart, CheckCircle, Route } from 'lucide-react';
import type { AthleteScheduledWorkout, WorkoutResults, WorkoutFeeling } from '../../../types/calendar';

interface WorkoutCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  workout: AthleteScheduledWorkout | null;
  onSubmit: (results: WorkoutResults) => void;
  isSubmitting: boolean;
}

const FEELING_OPTIONS: { value: WorkoutFeeling; label: string; color: string }[] = [
  { value: 'GREAT', label: 'Great', color: 'green' },
  { value: 'GOOD', label: 'Good', color: 'teal' },
  { value: 'OK', label: 'OK', color: 'yellow' },
  { value: 'TIRED', label: 'Tired', color: 'orange' },
  { value: 'EXHAUSTED', label: 'Exhausted', color: 'red' },
];

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

function parseDurationToSeconds(hours: number, minutes: number): number {
  return hours * 3600 + minutes * 60;
}

export function WorkoutCompletionModal({
  isOpen,
  onClose,
  workout,
  onSubmit,
  isSubmitting,
}: WorkoutCompletionModalProps) {
  const { t } = useTranslation();
  const bgColor = useColorModeValue('white', 'gray.800');
  const cardBg = useColorModeValue('gray.50', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // Form state
  const [durationHours, setDurationHours] = useState(0);
  const [durationMinutes, setDurationMinutes] = useState(0);
  const [distance, setDistance] = useState<string>('');
  const [actualTSS, setActualTSS] = useState<string>('');
  const [actualIF, setActualIF] = useState<string>('');
  const [avgPower, setAvgPower] = useState<string>('');
  const [avgHeartRate, setAvgHeartRate] = useState<string>('');
  const [rpe, setRpe] = useState(5);
  const [feeling, setFeeling] = useState<WorkoutFeeling | ''>('');
  const [resultNotes, setResultNotes] = useState('');

  // Reset form when workout changes
  useEffect(() => {
    if (workout) {
      // Pre-fill with planned values if available
      const plannedSeconds = workout.workout.attributes.totalTimePlanned * 3600;
      setDurationHours(Math.floor(plannedSeconds / 3600));
      setDurationMinutes(Math.floor((plannedSeconds % 3600) / 60));
      setDistance('');
      setActualTSS(workout.workout.attributes.tssPlanned?.toString() || '');
      setActualIF(workout.workout.attributes.ifPlanned?.toString() || '');
      setAvgPower('');
      setAvgHeartRate('');
      setRpe(5);
      setFeeling('');
      setResultNotes('');

      // If already completed, show actual values
      if (workout.completed) {
        if (workout.actualDurationSeconds) {
          setDurationHours(Math.floor(workout.actualDurationSeconds / 3600));
          setDurationMinutes(Math.floor((workout.actualDurationSeconds % 3600) / 60));
        }
        if (workout.actualDistanceKm) setDistance(workout.actualDistanceKm.toString());
        if (workout.actualTSS) setActualTSS(workout.actualTSS.toString());
        if (workout.actualIF) setActualIF(workout.actualIF.toString());
        if (workout.avgPower) setAvgPower(workout.avgPower.toString());
        if (workout.avgHeartRate) setAvgHeartRate(workout.avgHeartRate.toString());
        if (workout.rpe) setRpe(workout.rpe);
        if (workout.feeling) setFeeling(workout.feeling);
        if (workout.resultNotes) setResultNotes(workout.resultNotes);
      }
    }
  }, [workout]);

  const handleSubmit = () => {
    const results: WorkoutResults = {
      actualDurationSeconds: parseDurationToSeconds(durationHours, durationMinutes),
      actualDistanceKm: distance ? parseFloat(distance) : undefined,
      actualTSS: actualTSS ? parseFloat(actualTSS) : undefined,
      actualIF: actualIF ? parseFloat(actualIF) : undefined,
      avgPower: avgPower ? parseInt(avgPower) : undefined,
      avgHeartRate: avgHeartRate ? parseInt(avgHeartRate) : undefined,
      rpe,
      feeling: feeling || undefined,
      resultNotes: resultNotes || undefined,
    };
    onSubmit(results);
  };

  if (!workout) return null;

  const plannedDuration = workout.workout.attributes.totalTimePlanned * 3600;
  const plannedTSS = workout.workout.attributes.tssPlanned;
  const plannedIF = workout.workout.attributes.ifPlanned;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent bg={bgColor}>
        <ModalHeader>
          <VStack align="start" spacing={1}>
            <HStack>
              <Text>{workout.workout.title}</Text>
              {workout.completed && (
                <Badge colorScheme="green" display="flex" alignItems="center" gap={1}>
                  <Icon as={CheckCircle} boxSize={3} />
                  {t('calendar.completed') || 'Completed'}
                </Badge>
              )}
            </HStack>
            <Text fontSize="sm" fontWeight="normal" color="gray.500">
              {workout.workout.attributes.workoutTypeName}
            </Text>
          </VStack>
        </ModalHeader>
        <ModalCloseButton />

        <ModalBody>
          <VStack spacing={6} align="stretch">
            {/* Planned workout info */}
            <Box bg={cardBg} p={4} borderRadius="md" borderWidth="1px" borderColor={borderColor}>
              <Text fontWeight="medium" mb={3}>
                {t('calendar.plannedWorkout') || 'Planned Workout'}
              </Text>
              <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
                <HStack>
                  <Icon as={Clock} color="gray.500" />
                  <Box>
                    <Text fontSize="xs" color="gray.500">{t('workout.duration') || 'Duration'}</Text>
                    <Text fontWeight="medium">{formatDuration(plannedDuration)}</Text>
                  </Box>
                </HStack>
                {plannedTSS && (
                  <HStack>
                    <Icon as={Zap} color="orange.500" />
                    <Box>
                      <Text fontSize="xs" color="gray.500">TSS</Text>
                      <Text fontWeight="medium">{plannedTSS}</Text>
                    </Box>
                  </HStack>
                )}
                {plannedIF && (
                  <HStack>
                    <Icon as={Activity} color="purple.500" />
                    <Box>
                      <Text fontSize="xs" color="gray.500">IF</Text>
                      <Text fontWeight="medium">{plannedIF.toFixed(2)}</Text>
                    </Box>
                  </HStack>
                )}
              </SimpleGrid>
              {workout.notes && (
                <Box mt={3} pt={3} borderTopWidth="1px" borderColor={borderColor}>
                  <Text fontSize="sm" color="gray.500" mb={1}>
                    {t('calendar.coachNotes') || 'Coach Notes'}
                  </Text>
                  <Text fontSize="sm">{workout.notes}</Text>
                </Box>
              )}
            </Box>

            <Divider />

            {/* Result entry form */}
            <Text fontWeight="medium">
              {workout.completed
                ? (t('calendar.yourResults') || 'Your Results')
                : (t('calendar.logResults') || 'Log Your Results')
              }
            </Text>

            {/* Duration and Distance */}
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              <FormControl>
                <FormLabel fontSize="sm">{t('workout.actualDuration') || 'Actual Duration'}</FormLabel>
                <HStack>
                  <Input
                    type="number"
                    value={durationHours}
                    onChange={(e) => setDurationHours(parseInt(e.target.value) || 0)}
                    min={0}
                    max={24}
                    w="70px"
                  />
                  <Text>h</Text>
                  <Input
                    type="number"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 0)}
                    min={0}
                    max={59}
                    w="70px"
                  />
                  <Text>m</Text>
                </HStack>
              </FormControl>
              <FormControl>
                <FormLabel fontSize="sm">
                  <HStack spacing={1}>
                    <Icon as={Route} boxSize={4} />
                    <Text>{t('workout.distance') || 'Distance (km)'}</Text>
                  </HStack>
                </FormLabel>
                <Input
                  type="number"
                  step="0.1"
                  value={distance}
                  onChange={(e) => setDistance(e.target.value)}
                  placeholder={t('workout.distancePlaceholder') || 'e.g. 45.5'}
                />
              </FormControl>
            </SimpleGrid>

            {/* TSS and IF */}
            <SimpleGrid columns={2} spacing={4}>
              <FormControl>
                <FormLabel fontSize="sm">TSS</FormLabel>
                <Input
                  type="number"
                  value={actualTSS}
                  onChange={(e) => setActualTSS(e.target.value)}
                  placeholder="e.g. 85"
                />
              </FormControl>
              <FormControl>
                <FormLabel fontSize="sm">IF</FormLabel>
                <Input
                  type="number"
                  step="0.01"
                  value={actualIF}
                  onChange={(e) => setActualIF(e.target.value)}
                  placeholder="e.g. 0.75"
                />
              </FormControl>
            </SimpleGrid>

            {/* Power and HR */}
            <SimpleGrid columns={2} spacing={4}>
              <FormControl>
                <FormLabel fontSize="sm">
                  <HStack spacing={1}>
                    <Icon as={Zap} boxSize={4} />
                    <Text>{t('workout.avgPower') || 'Avg Power (W)'}</Text>
                  </HStack>
                </FormLabel>
                <Input
                  type="number"
                  value={avgPower}
                  onChange={(e) => setAvgPower(e.target.value)}
                  placeholder="e.g. 200"
                />
              </FormControl>
              <FormControl>
                <FormLabel fontSize="sm">
                  <HStack spacing={1}>
                    <Icon as={Heart} boxSize={4} />
                    <Text>{t('workout.avgHeartRate') || 'Avg HR (bpm)'}</Text>
                  </HStack>
                </FormLabel>
                <Input
                  type="number"
                  value={avgHeartRate}
                  onChange={(e) => setAvgHeartRate(e.target.value)}
                  placeholder="e.g. 145"
                />
              </FormControl>
            </SimpleGrid>

            {/* RPE Slider */}
            <FormControl>
              <FormLabel fontSize="sm">{t('workout.rpe') || 'Rate of Perceived Exertion (1-10)'}</FormLabel>
              <Box pt={6} pb={2} px={2}>
                <Slider
                  value={rpe}
                  onChange={setRpe}
                  min={1}
                  max={10}
                  step={1}
                >
                  <SliderMark value={1} mt={2} ml={-1} fontSize="xs">1</SliderMark>
                  <SliderMark value={5} mt={2} ml={-1} fontSize="xs">5</SliderMark>
                  <SliderMark value={10} mt={2} ml={-2} fontSize="xs">10</SliderMark>
                  <SliderMark
                    value={rpe}
                    textAlign="center"
                    bg="brand.500"
                    color="white"
                    mt={-10}
                    ml={-3}
                    w={6}
                    borderRadius="md"
                    fontSize="sm"
                  >
                    {rpe}
                  </SliderMark>
                  <SliderTrack>
                    <SliderFilledTrack bg="brand.500" />
                  </SliderTrack>
                  <SliderThumb boxSize={5} />
                </Slider>
              </Box>
            </FormControl>

            {/* How did you feel? */}
            <FormControl>
              <FormLabel fontSize="sm">{t('workout.howDidYouFeel') || 'How did you feel?'}</FormLabel>
              <Select
                value={feeling}
                onChange={(e) => setFeeling(e.target.value as WorkoutFeeling)}
                placeholder={t('common.select') || 'Select...'}
              >
                {FEELING_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {t(`workout.feeling.${option.value.toLowerCase()}`) || option.label}
                  </option>
                ))}
              </Select>
            </FormControl>

            {/* Notes */}
            <FormControl>
              <FormLabel fontSize="sm">{t('workout.notes') || 'Notes'}</FormLabel>
              <Textarea
                value={resultNotes}
                onChange={(e) => setResultNotes(e.target.value)}
                placeholder={t('workout.notesPlaceholder') || 'How did the workout go? Any issues or observations?'}
                rows={3}
              />
            </FormControl>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            {t('common.cancel') || 'Cancel'}
          </Button>
          <Button
            colorScheme="brand"
            onClick={handleSubmit}
            isLoading={isSubmitting}
            leftIcon={<Icon as={CheckCircle} />}
          >
            {workout.completed
              ? (t('calendar.updateResults') || 'Update Results')
              : (t('calendar.markComplete') || 'Mark Complete')
            }
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
