/**
 * WorkoutViewerModal - Modal for viewing workout details and athlete reports
 *
 * Features:
 * - Shows workout structure/visualization
 * - Displays planned vs actual metrics
 * - Coach view: read-only athlete report
 * - Athlete view: editable report
 */
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useDisclosure,
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
  Upload,
  FileCheck,
  AlertTriangle,
} from 'lucide-react';
import type { WorkoutResults, WorkoutFeeling } from '../../../types/calendar';
import type { Workout } from '../../../types/workout';
import { WorkoutChart } from '../WorkoutChart';
import { IntervalList } from '../IntervalList';
import { parseWorkout } from '../../../utils/parser';
import { api } from '../../../services/api';
import { useAuthenticatedApi } from '../../../hooks/useAuthenticatedApi';
import { useZones } from '../../../hooks/useZones';
import { useToast } from '@chakra-ui/react';
import { ActivityDetailModal } from './ActivityDetailModal';

interface ScheduledWorkoutDetails {
  id: string;
  dayIndex: number;
  sortOrder: number;
  notes: string | null;
  completed: boolean;
  completedAt: string | null;
  skipped: boolean;
  skipReason: string | null;
  skippedAt: string | null;
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
  activities?: ActivityData[];
}

interface ActivityData {
  id: string;
  name: string;
  activityType: string;
  source: string;
  fileFormat: string;
  startTime: string;
  endTime?: string;
  durationSeconds: number;
  movingTime?: number;
  distanceMeters?: number;
  elevationGain?: number;
  elevationLoss?: number;
  avgPower?: number;
  maxPower?: number;
  normalizedPower?: number;
  avgHeartRate?: number;
  maxHeartRate?: number;
  avgCadence?: number;
  maxCadence?: number;
  avgSpeed?: number;
  maxSpeed?: number;
  tss?: number;
  intensityFactor?: number;
  calories?: number;
  hasGPS: boolean;
  startLatitude?: number;
  startLongitude?: number;
  temperature?: number;
  telemetryData?: {
    records: Array<{
      timestamp: number;
      lat?: number;
      lng?: number;
      altitude?: number;
      power?: number;
      hr?: number;
      cadence?: number;
      speed?: number;
      distance?: number;
      temp?: number;
    }>;
  };
  laps?: {
    laps: Array<{
      startTime: number;
      endTime: number;
      duration: number;
      distance?: number;
      avgPower?: number;
      avgHR?: number;
      avgCadence?: number;
      avgSpeed?: number;
      totalAscent?: number;
    }>;
  };
  notes?: string;
}

interface WorkoutViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  scheduledWorkoutId: string | null;
  isCoachView: boolean;
  onResultsSubmit?: (results: WorkoutResults) => Promise<void>;
  onSkipWorkout?: (skipReason?: string) => Promise<void>;
  onActivityImport?: () => void;
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
  onSkipWorkout,
  onActivityImport,
}: WorkoutViewerModalProps) {
  const { t } = useTranslation();
  const toast = useToast();
  const authenticatedApi = useAuthenticatedApi();
  const { fetchZones, zonesData } = useZones();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  const bgColor = useColorModeValue('white', 'gray.800');
  const cardBg = useColorModeValue('gray.50', 'gray.700');
  const mutedColor = useColorModeValue('gray.600', 'gray.400');
  const skipReasonBg = useColorModeValue('orange.50', 'orange.900');
  const activityCardBg = useColorModeValue('white', 'gray.600');
  const activityCardBorder = useColorModeValue('gray.200', 'gray.500');

  // Fetch state
  const [workoutDetails, setWorkoutDetails] = useState<ScheduledWorkoutDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Skip workout state
  const { isOpen: isSkipDialogOpen, onOpen: onSkipDialogOpen, onClose: onSkipDialogClose } = useDisclosure();

  // Activity detail modal state
  const { isOpen: isActivityDetailOpen, onOpen: onActivityDetailOpen, onClose: onActivityDetailClose } = useDisclosure();
  const [selectedActivity, setSelectedActivity] = useState<ActivityData | null>(null);
  const [skipReason, setSkipReason] = useState<string>('');
  const [isSkipping, setIsSkipping] = useState(false);

  // Chart interaction state
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // Edit mode state (for athletes)
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // FIT import state
  const [isUploading, setIsUploading] = useState(false);

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

  // Fetch workout details function (extracted so it can be called on demand)
  const fetchWorkoutDetails = useCallback(async () => {
    if (!scheduledWorkoutId) return;

    console.log('[fetchWorkoutDetails] Fetching workout details for:', scheduledWorkoutId);
    setIsLoading(true);
    setError(null);

    try {
      const data = await api.get<ScheduledWorkoutDetails>(`/api/calendar/scheduled/${scheduledWorkoutId}`);
      console.log('[fetchWorkoutDetails] Received data:', data);
      console.log('[fetchWorkoutDetails] Skipped?', data.skipped);
      console.log('[fetchWorkoutDetails] Skip reason?', data.skipReason);
      console.log('[fetchWorkoutDetails] Completed?', data.completed);
      console.log('[fetchWorkoutDetails] Activities?', data.activities);
      console.log('[fetchWorkoutDetails] Activities count:', data.activities?.length || 0);
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
  }, [scheduledWorkoutId, t]);

  // Fetch workout details on open
  useEffect(() => {
    if (!isOpen || !scheduledWorkoutId) {
      setWorkoutDetails(null);
      return;
    }

    fetchWorkoutDetails();
  }, [isOpen, scheduledWorkoutId, fetchWorkoutDetails]);

  // Fetch athlete zones when workout details load
  useEffect(() => {
    if (workoutDetails?.trainingWeek.athleteId) {
      fetchZones(workoutDetails.trainingWeek.athleteId);
    }
  }, [workoutDetails, fetchZones]);

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

  // Map power % to HR zone and BPM range
  const getHRZoneForPowerPercent = useMemo(() => {
    if (!zonesData?.athlete.ftp || !zonesData?.hr.calculatedZones || !zonesData?.power.calculatedZones) {
      return null;
    }

    return (powerPercent: number) => {
      // Calculate watts from percentage
      const watts = (powerPercent / 100) * zonesData.athlete.ftp!;

      // Find corresponding power zone
      const powerZone = zonesData.power.calculatedZones!.find(z =>
        watts >= z.minWatts && (z.maxWatts === null || watts <= z.maxWatts)
      );

      if (!powerZone) return null;

      // Return corresponding HR zone (same zone number)
      const hrZone = zonesData.hr.calculatedZones![powerZone.zone - 1];

      if (!hrZone) return null;

      // Format BPM range
      const bpmRange = hrZone.maxBPM
        ? `${hrZone.minBPM}-${hrZone.maxBPM}`
        : `>${hrZone.minBPM}`;

      return {
        zoneName: hrZone.name,
        zoneNumber: hrZone.zone,
        bpmRange,
      };
    };
  }, [zonesData]);

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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    console.log('[handleFileUpload] File selected:', file?.name);
    if (!file || !workoutDetails) {
      console.log('[handleFileUpload] No file or workout details, returning');
      return;
    }

    // Validate file type
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.fit') && !fileName.endsWith('.fit.gz') && !fileName.endsWith('.gz')) {
      console.log('[handleFileUpload] Invalid file type:', fileName);
      toast({
        title: t('activityImport.invalidFiles') || 'Invalid file',
        description: t('activityImport.onlyFitFiles') || 'Only .fit and .fit.gz files are supported',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    setIsUploading(true);
    console.log('[handleFileUpload] Starting upload...');

    try {
      // Create FormData and upload file with direct pairing to this scheduled workout
      const formData = new FormData();
      formData.append('file', file);
      formData.append('athleteId', workoutDetails.trainingWeek.athleteId);
      formData.append('scheduledWorkoutId', workoutDetails.id); // Direct pairing!

      console.log('[handleFileUpload] Calling API with athleteId:', workoutDetails.trainingWeek.athleteId, 'scheduledWorkoutId:', workoutDetails.id);
      const result = await authenticatedApi.post('/api/activity-import/upload', formData) as { activity: { name: string; durationSeconds: number } };
      console.log('[handleFileUpload] Upload successful, result:', result);

      toast({
        title: t('activityImport.importSuccess') || 'Activity imported!',
        description: `${result.activity.name} • ${Math.round(result.activity.durationSeconds / 60)}min`,
        status: 'success',
        duration: 3000,
      });

      // Refetch workout details to show the new activity data
      console.log('[handleFileUpload] Refetching workout details...');
      await fetchWorkoutDetails();
      console.log('[handleFileUpload] Refetch complete');

      // Notify parent to refetch calendar data
      if (onActivityImport) {
        console.log('[handleFileUpload] Calling onActivityImport callback');
        onActivityImport();
      }

      // Exit edit mode if in it
      setIsEditing(false);
    } catch (error: any) {
      const errorMessage = error.data?.message || error.message || t('common.error');
      toast({
        title: t('activityImport.importFailed') || 'Import failed',
        description: errorMessage,
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsUploading(false);
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSkipWorkout = async () => {
    if (!onSkipWorkout || !workoutDetails) return;

    setIsSkipping(true);
    try {
      await onSkipWorkout(skipReason || undefined);
      toast({
        title: t('calendar.workoutSkipped') || 'Workout skipped',
        description: skipReason || undefined,
        status: 'info',
        duration: 3000,
      });
      onSkipDialogClose();
      setSkipReason('');
      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('common.error');
      toast({
        title: t('common.error') || 'Error',
        description: errorMessage,
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsSkipping(false);
    }
  };

  const handleViewActivityDetails = useCallback((activity: ActivityData) => {
    setSelectedActivity(activity);
    onActivityDetailOpen();
  }, [onActivityDetailOpen]);

  const handleActivityDelete = useCallback(async (activityId: string) => {
    // Refetch workout details after activity deletion
    console.log('[handleActivityDelete] Activity deleted:', activityId);
    await fetchWorkoutDetails();
    onActivityDetailClose();
  }, [fetchWorkoutDetails, onActivityDetailClose]);

  const handleClose = () => {
    setIsEditing(false);
    setHoveredIndex(null);
    setSelectedIndex(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <Modal isOpen={isOpen} onClose={handleClose} size="4xl" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent bg={bgColor} maxH="90vh">
        {/* Hidden file input for FIT file upload */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".fit,.fit.gz,.gz"
          style={{ display: 'none' }}
          onChange={handleFileUpload}
        />
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
                          <CardBody>
                            <IntervalList
                              segments={parsedWorkout.segments}
                              hoveredIndex={hoveredIndex}
                              selectedIndex={selectedIndex}
                              onSegmentHover={handleSegmentHover}
                              onSegmentClick={handleSegmentClick}
                              formatDuration={formatDuration}
                              getHRZoneForPowerPercent={getHRZoneForPowerPercent}
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
                      {/* Show skipped status if workout was skipped */}
                      {workoutDetails.skipped ? (
                        <Box bg={cardBg} p={6} borderRadius="md" borderWidth="2px" borderColor="orange.300">
                          <VStack spacing={4}>
                            <Icon as={AlertTriangle} boxSize={12} color="orange.500" />
                            <VStack spacing={2}>
                              <Text fontWeight="bold" fontSize="lg">
                                {t('calendar.workoutSkipped') || 'Workout Skipped'}
                              </Text>
                              {workoutDetails.skipReason && (
                                <Box bg={skipReasonBg} p={3} borderRadius="md" w="full">
                                  <Text fontSize="sm" fontWeight="medium" mb={1} color="orange.700" _dark={{ color: 'orange.300' }}>
                                    {t('calendar.skipReason') || 'Reason'}
                                  </Text>
                                  <Text fontSize="sm" color={mutedColor}>
                                    {workoutDetails.skipReason}
                                  </Text>
                                </Box>
                              )}
                              {workoutDetails.skippedAt && (
                                <Text fontSize="sm" color={mutedColor}>
                                  {t('calendar.skippedOn') || 'Skipped on'}: {new Date(workoutDetails.skippedAt).toLocaleDateString()}
                                </Text>
                              )}
                            </VStack>
                            {!isCoachView && (
                              <Text fontSize="sm" color={mutedColor} textAlign="center" mt={2}>
                                {t('calendar.skippedDescription') || 'This workout was marked as skipped. Your coach has been notified.'}
                              </Text>
                            )}
                          </VStack>
                        </Box>
                      ) : workoutDetails.completed ? (
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

                          {/* Import FIT file option for completed workouts with no FIT data */}
                          {!isCoachView && !isEditing && (!workoutDetails.activities || workoutDetails.activities.length === 0) && (
                            <Box bg={cardBg} p={6} borderRadius="md" borderWidth="2px" borderStyle="dashed" borderColor="blue.300">
                              <VStack spacing={3}>
                                <Icon as={Upload} boxSize={8} color="blue.500" />
                                <Text fontWeight="medium" textAlign="center">
                                  {t('workoutViewer.addDeviceData') || 'Add Device Data'}
                                </Text>
                                <Text fontSize="sm" color={mutedColor} textAlign="center">
                                  {t('workoutViewer.addDeviceDataDescription') || 'Import your FIT file to add power, heart rate, GPS, and detailed analytics to this workout.'}
                                </Text>
                                <Button
                                  leftIcon={<Icon as={Upload} />}
                                  colorScheme="blue"
                                  onClick={() => fileInputRef.current?.click()}
                                  isLoading={isUploading}
                                  loadingText={t('activityImport.uploading') || 'Uploading...'}
                                  mt={2}
                                >
                                  {t('workoutViewer.importFromDevice') || 'Import from Device'}
                                </Button>
                              </VStack>
                            </Box>
                          )}

                          {/* Rich data visualization for FIT-imported activities */}
                          {workoutDetails.activities && workoutDetails.activities.length > 0 && !isEditing && (
                            <Box bg={cardBg} p={4} borderRadius="md">
                              <HStack justify="space-between" mb={4}>
                                <HStack spacing={2}>
                                  <Icon as={FileCheck} color="blue.500" boxSize={5} />
                                  <Text fontWeight="medium">
                                    {t('workoutViewer.importedData') || 'Imported Activity Data'}
                                  </Text>
                                </HStack>
                                <Badge colorScheme="blue" fontSize="sm">
                                  {workoutDetails.activities.length} {workoutDetails.activities.length === 1 ? 'file' : 'files'}
                                </Badge>
                              </HStack>

                              <VStack spacing={3} align="stretch">
                                {workoutDetails.activities.map((activity, index) => (
                                  <Box
                                    key={activity.id}
                                    p={3}
                                    bg={activityCardBg}
                                    borderRadius="md"
                                    borderWidth="1px"
                                    borderColor={activityCardBorder}
                                  >
                                    <HStack justify="space-between" mb={2}>
                                      <Text fontSize="sm" fontWeight="medium">{activity.name}</Text>
                                      <Text fontSize="xs" color={mutedColor}>
                                        {new Date(activity.startTime).toLocaleDateString()} {new Date(activity.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                      </Text>
                                    </HStack>
                                    <SimpleGrid columns={{ base: 2, md: 4 }} spacing={2}>
                                      <Box>
                                        <Text fontSize="xs" color={mutedColor}>{t('workout.duration') || 'Duration'}</Text>
                                        <Text fontSize="sm" fontWeight="medium">
                                          {Math.floor(activity.durationSeconds / 3600)}h {Math.floor((activity.durationSeconds % 3600) / 60)}m
                                        </Text>
                                      </Box>
                                      {activity.avgPower && (
                                        <Box>
                                          <Text fontSize="xs" color={mutedColor}>{t('workout.avgPower') || 'Avg Power'}</Text>
                                          <Text fontSize="sm" fontWeight="medium">{activity.avgPower}W</Text>
                                        </Box>
                                      )}
                                      {activity.avgHeartRate && (
                                        <Box>
                                          <Text fontSize="xs" color={mutedColor}>{t('workout.avgHeartRate') || 'Avg HR'}</Text>
                                          <Text fontSize="sm" fontWeight="medium">{activity.avgHeartRate} bpm</Text>
                                        </Box>
                                      )}
                                      <Box>
                                        <Button
                                          size="xs"
                                          variant="ghost"
                                          colorScheme="blue"
                                          rightIcon={<Icon as={Activity} boxSize={3} />}
                                          onClick={() => handleViewActivityDetails(activity)}
                                        >
                                          {t('workoutViewer.viewDetails') || 'View Details'}
                                        </Button>
                                      </Box>
                                    </SimpleGrid>
                                  </Box>
                                ))}
                              </VStack>

                              {!isCoachView && (
                                <HStack justify="flex-end" mt={3}>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    colorScheme="blue"
                                    leftIcon={<Icon as={Upload} />}
                                    onClick={() => fileInputRef.current?.click()}
                                    isLoading={isUploading}
                                  >
                                    {t('workoutViewer.addAnotherFile') || 'Add Another File'}
                                  </Button>
                                </HStack>
                              )}
                            </Box>
                          )}
                        </>
                      ) : (
                        /* Not completed yet - Athlete can enter data or import FIT file */
                        <>
                          {!isCoachView && (
                            <>
                              <Box bg={cardBg} p={6} borderRadius="md">
                                <VStack spacing={4}>
                                  <Icon as={FileCheck} boxSize={10} color="blue.500" />
                                  <Text fontWeight="medium" fontSize="lg">
                                    {t('workoutViewer.completeWorkout') || 'Complete This Workout'}
                                  </Text>
                                  <Text color={mutedColor} textAlign="center">
                                    {t('workoutViewer.completeOptions') || 'Import your ride data from your device for detailed analytics, or enter basic information manually.'}
                                  </Text>

                                  <VStack spacing={3} pt={2} w="full">
                                    <HStack spacing={3} w="full" justify="center">
                                      <Button
                                        leftIcon={<Icon as={Upload} />}
                                        colorScheme="blue"
                                        onClick={() => fileInputRef.current?.click()}
                                        isLoading={isUploading}
                                        loadingText={t('activityImport.uploading') || 'Uploading...'}
                                      >
                                        {t('workoutViewer.importFromDevice') || 'Import from Device'}
                                      </Button>
                                      <Button
                                        leftIcon={<Icon as={Edit2} />}
                                        variant="outline"
                                        onClick={() => setIsEditing(true)}
                                      >
                                        {t('workoutViewer.enterManually') || 'Enter Manually'}
                                      </Button>
                                    </HStack>
                                    <Button
                                      leftIcon={<Icon as={AlertTriangle} />}
                                      variant="ghost"
                                      colorScheme="orange"
                                      size="sm"
                                      onClick={onSkipDialogOpen}
                                    >
                                      {t('calendar.skipWorkout') || 'Skip Workout'}
                                    </Button>
                                  </VStack>
                                </VStack>
                              </Box>

                              {/* Manual entry form (shown when editing) */}
                              {isEditing && (
                                <Box bg={cardBg} p={4} borderRadius="md">
                                  <VStack spacing={4} align="stretch">
                                    <Text fontWeight="medium">{t('workoutViewer.enterResults') || 'Enter Your Results'}</Text>

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
                                    </SimpleGrid>

                                    <SimpleGrid columns={2} spacing={4}>
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
                                      <FormControl>
                                        <FormLabel fontSize="sm">{t('workout.rpe') || 'RPE (1-10)'}</FormLabel>
                                        <Input
                                          type="number"
                                          min={1}
                                          max={10}
                                          value={rpe}
                                          onChange={(e) => setRpe(parseInt(e.target.value) || 5)}
                                        />
                                      </FormControl>
                                    </SimpleGrid>

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

                                    <HStack justify="flex-end" spacing={3}>
                                      <Button
                                        variant="ghost"
                                        onClick={() => setIsEditing(false)}
                                        isDisabled={isSubmitting}
                                      >
                                        {t('common.cancel') || 'Cancel'}
                                      </Button>
                                      <Button
                                        colorScheme="brand"
                                        onClick={handleSubmit}
                                        isLoading={isSubmitting}
                                      >
                                        {t('common.save') || 'Save'}
                                      </Button>
                                    </HStack>
                                  </VStack>
                                </Box>
                              )}
                            </>
                          )}

                          {/* Coach view - just show message */}
                          {isCoachView && (
                            <Box bg={cardBg} p={6} borderRadius="md" textAlign="center">
                              <Icon as={CalendarIcon} boxSize={8} color={mutedColor} mb={3} />
                              <Text color={mutedColor}>
                                {t('workoutViewer.notCompletedCoach') || 'This workout has not been completed yet.'}
                              </Text>
                            </Box>
                          )}
                        </>
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

    {/* Skip Workout Confirmation Dialog */}
    <AlertDialog
      isOpen={isSkipDialogOpen}
      leastDestructiveRef={cancelRef}
      onClose={onSkipDialogClose}
    >
      <AlertDialogOverlay>
        <AlertDialogContent>
          <AlertDialogHeader fontSize="lg" fontWeight="bold">
            {t('calendar.skipWorkoutConfirm') || 'Skip this workout?'}
          </AlertDialogHeader>

          <AlertDialogBody>
            <VStack spacing={4} align="stretch">
              <Text>
                {t('calendar.skipWorkoutDescription') || 'Mark this workout as skipped and let your coach know you couldn\'t complete it.'}
              </Text>

              <FormControl>
                <FormLabel>{t('calendar.skipReason') || 'Reason (optional)'}</FormLabel>
                <Select
                  placeholder={t('calendar.skipReasons.other') || 'Select a reason...'}
                  value={skipReason}
                  onChange={(e) => setSkipReason(e.target.value)}
                >
                  <option value={t('calendar.skipReasons.sick') || 'Sick'}>
                    {t('calendar.skipReasons.sick') || 'Sick'}
                  </option>
                  <option value={t('calendar.skipReasons.injury') || 'Injury'}>
                    {t('calendar.skipReasons.injury') || 'Injury'}
                  </option>
                  <option value={t('calendar.skipReasons.noTime') || 'No time'}>
                    {t('calendar.skipReasons.noTime') || 'No time'}
                  </option>
                  <option value={t('calendar.skipReasons.travel') || 'Travel'}>
                    {t('calendar.skipReasons.travel') || 'Travel'}
                  </option>
                  <option value={t('calendar.skipReasons.weather') || 'Bad weather'}>
                    {t('calendar.skipReasons.weather') || 'Bad weather'}
                  </option>
                  <option value={t('calendar.skipReasons.restDay') || 'Rest day'}>
                    {t('calendar.skipReasons.restDay') || 'Rest day'}
                  </option>
                </Select>
              </FormControl>
            </VStack>
          </AlertDialogBody>

          <AlertDialogFooter>
            <Button ref={cancelRef} onClick={onSkipDialogClose}>
              {t('common.cancel') || 'Cancel'}
            </Button>
            <Button
              colorScheme="orange"
              onClick={handleSkipWorkout}
              ml={3}
              isLoading={isSkipping}
            >
              {t('calendar.skipWorkout') || 'Skip Workout'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialogOverlay>
    </AlertDialog>

    {/* Activity Detail Modal */}
    {selectedActivity && (
      <ActivityDetailModal
        isOpen={isActivityDetailOpen}
        onClose={onActivityDetailClose}
        activity={selectedActivity}
        onDelete={!isCoachView ? handleActivityDelete : undefined}
      />
    )}
    </>
  );
}
