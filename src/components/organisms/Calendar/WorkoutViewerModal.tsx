/**
 * WorkoutViewerModal - Modal for viewing workout details and athlete reports
 *
 * Features:
 * - Shows workout structure/visualization
 * - Displays planned vs actual metrics
 * - Coach view: read-only athlete report
 * - Athlete view: editable report
 */
import { useState, useEffect, useMemo, useCallback } from 'react';
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
  Box,
  Text,
  Badge,
  Divider,
  SimpleGrid,
  useColorModeValue,
  Icon,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Select,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  SliderMark,
  Card,
  CardBody,
  Spinner,
  Center,
} from '@chakra-ui/react';
import { ParentSize } from '@visx/responsive';
import { useTranslation } from 'react-i18next';
import {
  Clock,
  Zap,
  Activity,
  Heart,
  CheckCircle,
  Route,
  User,
  Calendar as CalendarIcon,
  Edit2,
  BarChart3,
  FileText,
} from 'lucide-react';
import type { ScheduledWorkout, WorkoutResults, WorkoutFeeling } from '../../../types/calendar';
import type { Workout } from '../../../types/workout';
import { WorkoutChart } from '../WorkoutChart';
import { IntervalList } from '../IntervalList';
import { parseWorkout } from '../../../utils/parser';
import { api } from '../../../services/api';

interface ScheduledWorkoutDetails {
  id: string;
  dayIndex: number;
  sortOrder: number;
  notes: string | null;
  completed: boolean;
  completedAt: string | null;
  actualDurationSeconds: number | null;
  actualTSS: number | null;
  actualIF: number | null;
  avgPower: number | null;
  avgHeartRate: number | null;
  rpe: number | null;
  feeling: string | null;
  resultNotes: string | null;
  workout: {
    id: string;
    name: string;
    title: string | null;
    description: string | null;
    durationSeconds: number;
    tssPlanned: number | null;
    ifPlanned: number | null;
    structure: unknown;
    workoutType: string;
    category: {
      id: string;
      name: string;
      slug: string;
    };
  };
  trainingWeek: {
    weekStart: string;
    athleteId: string;
    athlete: {
      id: string;
      fullName: string | null;
      ftp: number | null;
    };
    coach: {
      id: string;
      fullName: string | null;
    } | null;
  };
}

interface WorkoutViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  scheduledWorkoutId: string | null;
  isCoachView: boolean;
  onResultsSubmit?: (results: WorkoutResults) => Promise<void>;
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

export function WorkoutViewerModal({
  isOpen,
  onClose,
  scheduledWorkoutId,
  isCoachView,
  onResultsSubmit,
}: WorkoutViewerModalProps) {
  const { t } = useTranslation();
  const bgColor = useColorModeValue('white', 'gray.800');
  const cardBg = useColorModeValue('gray.50', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const mutedColor = useColorModeValue('gray.600', 'gray.400');

  // Fetch state
  const [workoutDetails, setWorkoutDetails] = useState<ScheduledWorkoutDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Chart interaction state
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // Edit mode state (for athletes)
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [durationHours, setDurationHours] = useState(0);
  const [durationMinutes, setDurationMinutes] = useState(0);
  const [distance, setDistance] = useState('');
  const [actualTSS, setActualTSS] = useState('');
  const [actualIF, setActualIF] = useState('');
  const [avgPower, setAvgPower] = useState('');
  const [avgHeartRate, setAvgHeartRate] = useState('');
  const [rpe, setRpe] = useState(5);
  const [feeling, setFeeling] = useState<WorkoutFeeling | ''>('');
  const [resultNotes, setResultNotes] = useState('');

  // Fetch workout details
  useEffect(() => {
    if (!isOpen || !scheduledWorkoutId) {
      setWorkoutDetails(null);
      return;
    }

    const fetchDetails = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await api.get<ScheduledWorkoutDetails>(`/api/calendar/scheduled/${scheduledWorkoutId}`);
        setWorkoutDetails(data);

        // Initialize form with existing values
        if (data) {
          const plannedSeconds = data.workout.durationSeconds;
          if (data.actualDurationSeconds) {
            setDurationHours(Math.floor(data.actualDurationSeconds / 3600));
            setDurationMinutes(Math.floor((data.actualDurationSeconds % 3600) / 60));
          } else {
            setDurationHours(Math.floor(plannedSeconds / 3600));
            setDurationMinutes(Math.floor((plannedSeconds % 3600) / 60));
          }
          setDistance('');
          setActualTSS(data.actualTSS?.toString() || data.workout.tssPlanned?.toString() || '');
          setActualIF(data.actualIF?.toString() || data.workout.ifPlanned?.toString() || '');
          setAvgPower(data.avgPower?.toString() || '');
          setAvgHeartRate(data.avgHeartRate?.toString() || '');
          setRpe(data.rpe || 5);
          setFeeling((data.feeling as WorkoutFeeling) || '');
          setResultNotes(data.resultNotes || '');
        }
      } catch (err) {
        console.error('Failed to fetch workout details:', err);
        setError(t('calendar.fetchError') || 'Failed to load workout details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetails();
  }, [isOpen, scheduledWorkoutId, t]);

  // Parse workout for visualization
  const parsedWorkout = useMemo(() => {
    if (!workoutDetails?.workout.structure) return null;

    // Create a Workout object compatible with the parser
    const workoutForParser: Workout = {
      id: parseInt(workoutDetails.workout.id, 10) || 0,
      title: workoutDetails.workout.name,
      description: workoutDetails.workout.description || '',
      attributes: {
        structure: workoutDetails.workout.structure as Workout['attributes']['structure'],
        totalTimePlanned: workoutDetails.workout.durationSeconds / 3600,
        tssPlanned: workoutDetails.workout.tssPlanned || 0,
        ifPlanned: workoutDetails.workout.ifPlanned || 0,
        workoutTypeName: workoutDetails.workout.category?.name || 'Workout',
        workoutType: workoutDetails.workout.workoutType as Workout['attributes']['workoutType'],
      },
    };

    try {
      return parseWorkout(workoutForParser);
    } catch {
      return null;
    }
  }, [workoutDetails]);

  const handleSegmentHover = useCallback((index: number | null) => {
    setHoveredIndex(index);
  }, []);

  const handleSegmentClick = useCallback((index: number | null) => {
    setSelectedIndex(index);
  }, []);

  const handleSubmit = async () => {
    if (!onResultsSubmit || !workoutDetails) return;

    setIsSubmitting(true);
    try {
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
      await onResultsSubmit(results);
      setIsEditing(false);
      onClose();
    } catch (err) {
      console.error('Failed to submit results:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsEditing(false);
    setHoveredIndex(null);
    setSelectedIndex(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="4xl" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent bg={bgColor} maxH="90vh">
        {isLoading ? (
          <Center py={20}>
            <Spinner size="xl" color="brand.500" />
          </Center>
        ) : error ? (
          <Center py={20}>
            <Text color="red.500">{error}</Text>
          </Center>
        ) : workoutDetails ? (
          <>
            <ModalHeader pb={2}>
              <VStack align="start" spacing={1}>
                <HStack>
                  <Text fontSize="lg">{workoutDetails.workout.name}</Text>
                  {workoutDetails.completed && (
                    <Badge colorScheme="green" display="flex" alignItems="center" gap={1}>
                      <Icon as={CheckCircle} boxSize={3} />
                      {t('calendar.completed') || 'Completed'}
                    </Badge>
                  )}
                </HStack>
                <HStack fontSize="sm" color={mutedColor} spacing={3}>
                  <HStack>
                    <Icon as={User} boxSize={3} />
                    <Text>{workoutDetails.trainingWeek.athlete.fullName || 'Athlete'}</Text>
                  </HStack>
                  {workoutDetails.trainingWeek.athlete.ftp && (
                    <HStack>
                      <Icon as={Zap} boxSize={3} />
                      <Text>FTP: {workoutDetails.trainingWeek.athlete.ftp}W</Text>
                    </HStack>
                  )}
                </HStack>
              </VStack>
            </ModalHeader>
            <ModalCloseButton />

            <ModalBody>
              <Tabs variant="enclosed" colorScheme="brand">
                <TabList>
                  <Tab>
                    <HStack spacing={2}>
                      <Icon as={BarChart3} boxSize={4} />
                      <Text>{t('workoutViewer.structure') || 'Structure'}</Text>
                    </HStack>
                  </Tab>
                  <Tab>
                    <HStack spacing={2}>
                      <Icon as={FileText} boxSize={4} />
                      <Text>{t('workoutViewer.report') || 'Report'}</Text>
                    </HStack>
                  </Tab>
                </TabList>

                <TabPanels>
                  {/* Structure Tab */}
                  <TabPanel px={0}>
                    <VStack spacing={4} align="stretch">
                      {/* Planned metrics */}
                      <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
                        <HStack>
                          <Icon as={Clock} color="blue.500" />
                          <Box>
                            <Text fontSize="xs" color={mutedColor}>
                              {t('workout.duration') || 'Duration'}
                            </Text>
                            <Text fontWeight="medium">
                              {formatDuration(workoutDetails.workout.durationSeconds)}
                            </Text>
                          </Box>
                        </HStack>
                        {workoutDetails.workout.tssPlanned && (
                          <HStack>
                            <Icon as={Zap} color="orange.500" />
                            <Box>
                              <Text fontSize="xs" color={mutedColor}>TSS</Text>
                              <Text fontWeight="medium">{workoutDetails.workout.tssPlanned}</Text>
                            </Box>
                          </HStack>
                        )}
                        {workoutDetails.workout.ifPlanned && (
                          <HStack>
                            <Icon as={Activity} color="purple.500" />
                            <Box>
                              <Text fontSize="xs" color={mutedColor}>IF</Text>
                              <Text fontWeight="medium">{workoutDetails.workout.ifPlanned.toFixed(2)}</Text>
                            </Box>
                          </HStack>
                        )}
                        <HStack>
                          <Icon as={CalendarIcon} color="teal.500" />
                          <Box>
                            <Text fontSize="xs" color={mutedColor}>
                              {t('workout.category') || 'Category'}
                            </Text>
                            <Text fontWeight="medium">{workoutDetails.workout.category?.name}</Text>
                          </Box>
                        </HStack>
                      </SimpleGrid>

                      {/* Workout chart */}
                      {parsedWorkout && parsedWorkout.segments.length > 0 && (
                        <Card variant="outline">
                          <CardBody>
                            <Box h="250px" w="full">
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
                      )}

                      {/* Interval list */}
                      {parsedWorkout && parsedWorkout.segments.length > 0 && (
                        <Card variant="outline">
                          <CardBody maxH="200px" overflowY="auto">
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
                      )}

                      {/* Description */}
                      {workoutDetails.workout.description && (
                        <Box bg={cardBg} p={4} borderRadius="md">
                          <Text fontSize="sm" fontWeight="medium" mb={2}>
                            {t('workout.description') || 'Description'}
                          </Text>
                          <Text fontSize="sm" color={mutedColor} whiteSpace="pre-wrap">
                            {workoutDetails.workout.description}
                          </Text>
                        </Box>
                      )}

                      {/* Coach notes */}
                      {workoutDetails.notes && (
                        <Box bg={cardBg} p={4} borderRadius="md">
                          <Text fontSize="sm" fontWeight="medium" mb={2}>
                            {t('calendar.coachNotes') || 'Coach Notes'}
                          </Text>
                          <Text fontSize="sm" color={mutedColor}>{workoutDetails.notes}</Text>
                        </Box>
                      )}
                    </VStack>
                  </TabPanel>

                  {/* Report Tab */}
                  <TabPanel px={0}>
                    <VStack spacing={6} align="stretch">
                      {/* Show results if completed */}
                      {workoutDetails.completed ? (
                        <>
                          {/* Results comparison */}
                          <Box bg={cardBg} p={4} borderRadius="md">
                            <HStack justify="space-between" mb={3}>
                              <Text fontWeight="medium">
                                {t('workoutViewer.results') || 'Results'}
                              </Text>
                              {!isCoachView && !isEditing && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  leftIcon={<Icon as={Edit2} boxSize={4} />}
                                  onClick={() => setIsEditing(true)}
                                >
                                  {t('common.edit') || 'Edit'}
                                </Button>
                              )}
                            </HStack>

                            {isEditing ? (
                              /* Edit form */
                              <VStack spacing={4} align="stretch">
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
                                      placeholder="e.g. 45.5"
                                    />
                                  </FormControl>
                                </SimpleGrid>

                                <SimpleGrid columns={2} spacing={4}>
                                  <FormControl>
                                    <FormLabel fontSize="sm">TSS</FormLabel>
                                    <Input
                                      type="number"
                                      value={actualTSS}
                                      onChange={(e) => setActualTSS(e.target.value)}
                                    />
                                  </FormControl>
                                  <FormControl>
                                    <FormLabel fontSize="sm">IF</FormLabel>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      value={actualIF}
                                      onChange={(e) => setActualIF(e.target.value)}
                                    />
                                  </FormControl>
                                </SimpleGrid>

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
                                    />
                                  </FormControl>
                                </SimpleGrid>

                                <FormControl>
                                  <FormLabel fontSize="sm">{t('workout.rpe') || 'RPE (1-10)'}</FormLabel>
                                  <Box pt={6} pb={2} px={2}>
                                    <Slider value={rpe} onChange={setRpe} min={1} max={10} step={1}>
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

                                <FormControl>
                                  <FormLabel fontSize="sm">{t('workout.notes') || 'Notes'}</FormLabel>
                                  <Textarea
                                    value={resultNotes}
                                    onChange={(e) => setResultNotes(e.target.value)}
                                    rows={3}
                                  />
                                </FormControl>
                              </VStack>
                            ) : (
                              /* Read-only results display */
                              <SimpleGrid columns={{ base: 2, md: 3 }} spacing={4}>
                                <Box>
                                  <Text fontSize="xs" color={mutedColor}>{t('workout.duration') || 'Duration'}</Text>
                                  <HStack>
                                    <Text fontWeight="medium">
                                      {workoutDetails.actualDurationSeconds
                                        ? formatDuration(workoutDetails.actualDurationSeconds)
                                        : '-'}
                                    </Text>
                                    <Text fontSize="xs" color={mutedColor}>
                                      / {formatDuration(workoutDetails.workout.durationSeconds)}
                                    </Text>
                                  </HStack>
                                </Box>
                                <Box>
                                  <Text fontSize="xs" color={mutedColor}>TSS</Text>
                                  <HStack>
                                    <Text fontWeight="medium">{workoutDetails.actualTSS || '-'}</Text>
                                    <Text fontSize="xs" color={mutedColor}>
                                      / {workoutDetails.workout.tssPlanned || '-'}
                                    </Text>
                                  </HStack>
                                </Box>
                                <Box>
                                  <Text fontSize="xs" color={mutedColor}>IF</Text>
                                  <HStack>
                                    <Text fontWeight="medium">{workoutDetails.actualIF?.toFixed(2) || '-'}</Text>
                                    <Text fontSize="xs" color={mutedColor}>
                                      / {workoutDetails.workout.ifPlanned?.toFixed(2) || '-'}
                                    </Text>
                                  </HStack>
                                </Box>
                                {workoutDetails.avgPower && (
                                  <Box>
                                    <Text fontSize="xs" color={mutedColor}>{t('workout.avgPower') || 'Avg Power'}</Text>
                                    <Text fontWeight="medium">{workoutDetails.avgPower}W</Text>
                                  </Box>
                                )}
                                {workoutDetails.avgHeartRate && (
                                  <Box>
                                    <Text fontSize="xs" color={mutedColor}>{t('workout.avgHeartRate') || 'Avg HR'}</Text>
                                    <Text fontWeight="medium">{workoutDetails.avgHeartRate} bpm</Text>
                                  </Box>
                                )}
                                {workoutDetails.rpe && (
                                  <Box>
                                    <Text fontSize="xs" color={mutedColor}>RPE</Text>
                                    <Text fontWeight="medium">{workoutDetails.rpe}/10</Text>
                                  </Box>
                                )}
                                {workoutDetails.feeling && (
                                  <Box>
                                    <Text fontSize="xs" color={mutedColor}>{t('workout.feeling.label') || 'Feeling'}</Text>
                                    <Badge
                                      colorScheme={
                                        FEELING_OPTIONS.find((f) => f.value === workoutDetails.feeling)?.color || 'gray'
                                      }
                                    >
                                      {t(`workout.feeling.${workoutDetails.feeling.toLowerCase()}`) ||
                                        workoutDetails.feeling}
                                    </Badge>
                                  </Box>
                                )}
                              </SimpleGrid>
                            )}
                          </Box>

                          {/* Athlete notes (read-only for coach) */}
                          {workoutDetails.resultNotes && !isEditing && (
                            <Box bg={cardBg} p={4} borderRadius="md">
                              <Text fontSize="sm" fontWeight="medium" mb={2}>
                                {t('workoutViewer.athleteNotes') || 'Athlete Notes'}
                              </Text>
                              <Text fontSize="sm" color={mutedColor} whiteSpace="pre-wrap">
                                {workoutDetails.resultNotes}
                              </Text>
                            </Box>
                          )}
                        </>
                      ) : (
                        /* Not completed yet */
                        <Box bg={cardBg} p={6} borderRadius="md" textAlign="center">
                          <Icon as={CalendarIcon} boxSize={8} color={mutedColor} mb={3} />
                          <Text color={mutedColor}>
                            {isCoachView
                              ? (t('workoutViewer.notCompletedCoach') || 'This workout has not been completed yet.')
                              : (t('workoutViewer.notCompletedAthlete') || 'Complete this workout to log your results.')}
                          </Text>
                        </Box>
                      )}
                    </VStack>
                  </TabPanel>
                </TabPanels>
              </Tabs>
            </ModalBody>

            <ModalFooter>
              {isEditing ? (
                <>
                  <Button
                    variant="ghost"
                    mr={3}
                    onClick={() => setIsEditing(false)}
                    isDisabled={isSubmitting}
                  >
                    {t('common.cancel') || 'Cancel'}
                  </Button>
                  <Button
                    colorScheme="brand"
                    onClick={handleSubmit}
                    isLoading={isSubmitting}
                    leftIcon={<Icon as={CheckCircle} />}
                  >
                    {t('calendar.updateResults') || 'Update Results'}
                  </Button>
                </>
              ) : (
                <Button variant="ghost" onClick={handleClose}>
                  {t('common.close') || 'Close'}
                </Button>
              )}
            </ModalFooter>
          </>
        ) : null}
      </ModalContent>
    </Modal>
  );
}
