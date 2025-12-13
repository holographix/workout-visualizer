/**
 * WorkoutBuilderPage - Dedicated page for creating and editing workouts
 *
 * Features two view modes:
 * 1. Structure View - Step-by-step builder with intervals
 * 2. Chart View - Visual chart representation with real-time preview
 *
 * @module pages/WorkoutBuilderPage
 */
import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  Box,
  Flex,
  HStack,
  VStack,
  Heading,
  Text,
  Button,
  IconButton,
  Badge,
  useColorModeValue,
  useToast,
  ButtonGroup,
  Divider,
  useBreakpointValue,
  Spinner,
  Center,
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, List, BarChart3, Save, X } from 'lucide-react';
import { ParentSize } from '@visx/responsive';
import { Header } from '../components/organisms';
import { WorkoutBuilder } from '../components/organisms/Coach';
import { WorkoutChart } from '../components/organisms/WorkoutChart';
import { useWorkoutsAPI, useWorkoutById, type CreateWorkoutPayload, type ApiWorkoutResponse } from '../hooks/useCalendarAPI';
import { useUser } from '../contexts/UserContext';
import { useAuthenticatedApi } from '../hooks/useAuthenticatedApi';
import type { Workout, ParsedWorkout, FlatSegment } from '../types/workout';

type ViewMode = 'structure' | 'chart';

export function WorkoutBuilderPage() {
  const { t } = useTranslation();
  const toast = useToast();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [viewMode, setViewMode] = useState<ViewMode>('structure');
  const [currentWorkout, setCurrentWorkout] = useState<Workout | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch workout categories from API
  const { categories, refetchCategories } = useWorkoutsAPI();

  // Get current user from context - this is the coach creating/editing workouts
  const { user } = useUser();
  const coachId = user?.id;

  // Authenticated API for workout CRUD operations
  const api = useAuthenticatedApi();

  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const isMobile = useBreakpointValue({ base: true, md: false });

  const isEditing = id && id !== 'new';

  // Fetch existing workout data when editing
  const { workout: existingWorkout, isLoading: isLoadingWorkout } = useWorkoutById(isEditing ? id : undefined);

  // Store initial workout data from API separately - this is passed to WorkoutBuilder once
  // and doesn't get overwritten by onChange callbacks
  const [initialWorkoutData, setInitialWorkoutData] = useState<Workout | null>(null);

  // Convert API workout data to frontend Workout type
  useEffect(() => {
    if (existingWorkout && !initialWorkoutData) {
      const convertedWorkout: Workout = {
        id: parseInt(existingWorkout.id, 10) || 0,
        title: existingWorkout.name,
        description: existingWorkout.description || '',
        categoryId: existingWorkout.category?.id,
        attributes: {
          structure: existingWorkout.structure as { structure: any[] } || { structure: [] },
          totalTimePlanned: existingWorkout.durationSeconds / 3600,
          tssPlanned: existingWorkout.tssPlanned || 0,
          ifPlanned: existingWorkout.ifPlanned || 0,
          workoutTypeName: existingWorkout.category?.name || 'Workout',
          workoutType: existingWorkout.workoutType as 'outdoorCycling' | 'indoorCycling' | 'gymHome' | 'gymFacility' | 'crossTraining' | 'other' | undefined,
        },
      };
      setInitialWorkoutData(convertedWorkout);
      setCurrentWorkout(convertedWorkout);
    }
  }, [existingWorkout, initialWorkoutData]);

  // Convert current workout to ParsedWorkout for chart
  const parsedWorkout = useMemo((): ParsedWorkout | null => {
    if (!currentWorkout?.attributes?.structure) return null;

    const segments: FlatSegment[] = [];
    let currentTime = 0;

    const processStep = (step: any, groupId?: number) => {
      const durationSeconds =
        step.length?.unit === 'minute'
          ? step.length.value * 60
          : step.length?.value || 0;

      const target = step.targets?.[0] || { minValue: 50, maxValue: 75 };

      segments.push({
        startTime: currentTime,
        endTime: currentTime + durationSeconds,
        duration: durationSeconds,
        targetMin: target.minValue,
        targetMax: target.maxValue,
        type: step.intensityClass || 'active',
        name: step.name || '',
        openDuration: step.openDuration || false,
        group: groupId,
      });

      currentTime += durationSeconds;
    };

    const processStructureItem = (item: any, groupId?: number) => {
      if (item.type === 'repetition') {
        const repeatCount = item.length?.value || 1;
        for (let i = 0; i < repeatCount; i++) {
          item.steps?.forEach((step: any) => {
            if (step.type === 'repetition') {
              processStructureItem(step, groupId);
            } else {
              processStep(step, groupId);
            }
          });
        }
      } else if (item.type === 'step') {
        item.steps?.forEach((step: any) => processStep(step, groupId));
      }
    };

    currentWorkout.attributes.structure.structure.forEach((item, idx) => {
      processStructureItem(item, idx);
    });

    return {
      segments,
      totalDuration: currentTime,
      metadata: {
        title: currentWorkout.title,
        description: currentWorkout.description || '',
        tss: currentWorkout.attributes.tssPlanned,
        if: currentWorkout.attributes.ifPlanned,
      },
    };
  }, [currentWorkout]);

  // Generate a URL-friendly slug from title
  const generateSlug = (title: string): string => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 50) + '-' + Date.now().toString(36);
  };

  // Determine duration category based on duration
  const getDurationCategory = (durationSeconds: number): 'SHORT' | 'MEDIUM' | 'LONG' => {
    if (durationSeconds <= 3600) return 'SHORT'; // <= 1 hour
    if (durationSeconds <= 7200) return 'MEDIUM'; // <= 2 hours
    return 'LONG'; // > 2 hours
  };

  const handleSave = useCallback(async (workout: Workout) => {
    if (isSaving) return;

    // Validate required fields
    if (!workout.title?.trim()) {
      toast({
        title: t('builder.titleRequired'),
        status: 'error',
        duration: 3000,
      });
      return;
    }

    if (!workout.categoryId) {
      toast({
        title: t('builder.selectCategory'),
        status: 'error',
        duration: 3000,
      });
      return;
    }

    setIsSaving(true);
    setCurrentWorkout(workout);

    try {
      const durationSeconds = Math.round((workout.attributes?.totalTimePlanned || 0) * 3600);

      const payload: CreateWorkoutPayload = {
        slug: generateSlug(workout.title),
        name: workout.title,
        description: workout.description || undefined,
        durationSeconds,
        durationCategory: getDurationCategory(durationSeconds),
        tssPlanned: workout.attributes?.tssPlanned || undefined,
        ifPlanned: workout.attributes?.ifPlanned || undefined,
        structure: workout.attributes?.structure || { structure: [] },
        categoryId: workout.categoryId,
        workoutType: workout.attributes?.workoutType || 'outdoorCycling',
        coachId,
      };

      let savedWorkout: ApiWorkoutResponse;
      if (isEditing && id) {
        // Update existing workout
        savedWorkout = await api.put<ApiWorkoutResponse>(`/api/workouts/${id}`, payload);
      } else {
        // Create new workout
        savedWorkout = await api.post<ApiWorkoutResponse>('/api/workouts', payload);
      }

      toast({
        title: t('builder.workoutSaved'),
        description: workout.title,
        status: 'success',
        duration: 2000,
      });

      // Navigate to the edit page for the newly created/updated workout
      navigate(`/workout/${savedWorkout.id}`, { replace: true });
    } catch (error) {
      console.error('Failed to save workout:', error);
      toast({
        title: t('settings.failedToSave'),
        description: error instanceof Error ? error.message : t('settings.couldNotSave'),
        status: 'error',
        duration: 4000,
      });
    } finally {
      setIsSaving(false);
    }
  }, [isSaving, toast, t, navigate, isEditing, id, api]);

  const handleCancel = useCallback(() => {
    navigate('/coach');
  }, [navigate]);

  // Real-time workout updates between structure and chart views
  const handleWorkoutChange = useCallback((workout: Workout) => {
    setCurrentWorkout(workout);
  }, []);

  // Show loading state while fetching workout data for editing
  if (isEditing && isLoadingWorkout) {
    return (
      <Box h="100vh" bg={bgColor} display="flex" flexDirection="column" overflow="hidden">
        <Header />
        <Center flex={1}>
          <VStack spacing={4}>
            <Spinner size="xl" color="brand.500" />
            <Text color="gray.500">{t('common.loading')}</Text>
          </VStack>
        </Center>
      </Box>
    );
  }

  return (
    <Box h="100vh" bg={bgColor} display="flex" flexDirection="column" overflow="hidden">
      <Header />

      {/* Page Header */}
      <Box
        px={{ base: 3, md: 6 }}
        py={{ base: 2, md: 3 }}
        bg={cardBg}
        borderBottomWidth="1px"
        borderColor={borderColor}
        flexShrink={0}
      >
        {/* Top row: Back button, title, view toggle */}
        <Flex align="center" justify="space-between" mb={{ base: 2, md: 0 }}>
          <HStack spacing={{ base: 2, md: 4 }}>
            <IconButton
              aria-label={t('common.back')}
              icon={<ArrowLeft size={isMobile ? 18 : 20} />}
              variant="ghost"
              size={isMobile ? 'sm' : 'md'}
              onClick={handleCancel}
            />
            <VStack align="start" spacing={0}>
              <Heading size={isMobile ? 'sm' : 'md'}>
                {isEditing ? t('builder.editWorkout') : t('builder.newWorkout')}
              </Heading>
              {currentWorkout && !isMobile && (
                <Text fontSize="sm" color="gray.500">
                  {currentWorkout.title}
                </Text>
              )}
            </VStack>
          </HStack>

          {/* View Mode Toggle - icons only on mobile */}
          <ButtonGroup size="sm" isAttached variant="outline">
            {isMobile ? (
              <>
                <IconButton
                  aria-label={t('builder.structureView')}
                  icon={<List size={16} />}
                  onClick={() => setViewMode('structure')}
                  colorScheme={viewMode === 'structure' ? 'brand' : undefined}
                  variant={viewMode === 'structure' ? 'solid' : 'outline'}
                />
                <IconButton
                  aria-label={t('builder.chartView')}
                  icon={<BarChart3 size={16} />}
                  onClick={() => setViewMode('chart')}
                  colorScheme={viewMode === 'chart' ? 'brand' : undefined}
                  variant={viewMode === 'chart' ? 'solid' : 'outline'}
                />
              </>
            ) : (
              <>
                <Button
                  leftIcon={<List size={16} />}
                  onClick={() => setViewMode('structure')}
                  colorScheme={viewMode === 'structure' ? 'brand' : undefined}
                  variant={viewMode === 'structure' ? 'solid' : 'outline'}
                >
                  {t('builder.structureView')}
                </Button>
                <Button
                  leftIcon={<BarChart3 size={16} />}
                  onClick={() => setViewMode('chart')}
                  colorScheme={viewMode === 'chart' ? 'brand' : undefined}
                  variant={viewMode === 'chart' ? 'solid' : 'outline'}
                >
                  {t('builder.chartView')}
                </Button>
              </>
            )}
          </ButtonGroup>
        </Flex>

        {/* Metrics row - shown below on mobile */}
        {currentWorkout && (
          <HStack spacing={2} justify={{ base: 'center', md: 'flex-end' }}>
            <Badge colorScheme="blue" fontSize="xs" px={2} py={1}>
              {Math.round((currentWorkout.attributes?.totalTimePlanned || 0) * 60)}m
            </Badge>
            <Badge colorScheme="orange" fontSize="xs" px={2} py={1}>
              {currentWorkout.attributes?.tssPlanned || 0} TSS
            </Badge>
            <Badge colorScheme="purple" fontSize="xs" px={2} py={1}>
              IF {(currentWorkout.attributes?.ifPlanned || 0).toFixed(2)}
            </Badge>
          </HStack>
        )}
      </Box>

      {/* Content */}
      <Box flex={1} overflow="hidden" p={{ base: 2, md: 6 }}>
        {viewMode === 'structure' ? (
          // Structure View - Full WorkoutBuilder
          <Box h="full">
            <WorkoutBuilder
              initialWorkout={initialWorkoutData || undefined}
              onSave={handleSave}
              onCancel={handleCancel}
              onChange={handleWorkoutChange}
              categories={categories}
              isSaving={isSaving}
              coachId={coachId}
              onCategoriesChange={refetchCategories}
            />
          </Box>
        ) : (
          // Chart View - Visual Preview with live updates
          <Flex h="full" gap={{ base: 3, md: 6 }} direction={{ base: 'column', lg: 'row' }}>
            {/* Chart Panel */}
            <Box
              flex={{ base: 'none', lg: 2 }}
              h={{ base: '250px', lg: 'full' }}
              bg={cardBg}
              borderRadius="xl"
              borderWidth="1px"
              borderColor={borderColor}
              overflow="hidden"
              display="flex"
              flexDirection="column"
            >
              <HStack px={{ base: 3, md: 4 }} py={2} borderBottomWidth="1px" borderColor={borderColor}>
                <BarChart3 size={16} />
                <Heading size="xs">{t('builder.workoutPreview')}</Heading>
              </HStack>

              <Box flex={1} p={{ base: 2, md: 4 }}>
                {parsedWorkout && parsedWorkout.segments.length > 0 ? (
                  <ParentSize>
                    {({ width, height }) => (
                      <WorkoutChart
                        workout={parsedWorkout}
                        width={width}
                        height={height}
                        hoveredIndex={hoveredIndex}
                        onSegmentHover={setHoveredIndex}
                        onSegmentClick={setSelectedIndex}
                        selectedIndex={selectedIndex}
                      />
                    )}
                  </ParentSize>
                ) : (
                  <Flex h="full" align="center" justify="center">
                    <VStack spacing={2}>
                      <BarChart3 size={32} color="gray" />
                      <Text color="gray.500" textAlign="center" fontSize="sm">
                        {t('builder.noPreviewYet')}
                      </Text>
                      <Text color="gray.400" fontSize="xs" textAlign="center">
                        {t('builder.addStepsToPreview')}
                      </Text>
                    </VStack>
                  </Flex>
                )}
              </Box>
            </Box>

            {/* Segment Details Panel */}
            <Box
              flex={1}
              bg={cardBg}
              borderRadius="xl"
              borderWidth="1px"
              borderColor={borderColor}
              overflow="hidden"
              display="flex"
              flexDirection="column"
              minH={{ base: '200px', lg: 'auto' }}
            >
              <HStack px={{ base: 3, md: 4 }} py={2} borderBottomWidth="1px" borderColor={borderColor}>
                <List size={16} />
                <Heading size="xs">{t('builder.segments')}</Heading>
              </HStack>

              <Box flex={1} overflowY="auto" p={{ base: 2, md: 4 }}>
                {parsedWorkout && parsedWorkout.segments.length > 0 ? (
                  <VStack spacing={2} align="stretch">
                    {parsedWorkout.segments.map((segment, index) => (
                      <SegmentItem
                        key={index}
                        segment={segment}
                        index={index}
                        isHovered={hoveredIndex === index}
                        isSelected={selectedIndex === index}
                        onHover={() => setHoveredIndex(index)}
                        onLeave={() => setHoveredIndex(null)}
                        onClick={() => setSelectedIndex(index === selectedIndex ? null : index)}
                        borderColor={borderColor}
                      />
                    ))}
                  </VStack>
                ) : (
                  <Text color="gray.500" textAlign="center" py={4} fontSize="sm">
                    {t('builder.noSegments')}
                  </Text>
                )}
              </Box>

              {/* Actions */}
              <Divider />
              <HStack p={{ base: 2, md: 4 }} spacing={2}>
                <Button
                  flex={1}
                  variant="outline"
                  size={isMobile ? 'sm' : 'md'}
                  leftIcon={<X size={14} />}
                  onClick={handleCancel}
                  isDisabled={isSaving}
                >
                  {t('common.cancel')}
                </Button>
                <Button
                  flex={1}
                  colorScheme="brand"
                  size={isMobile ? 'sm' : 'md'}
                  leftIcon={isSaving ? <Spinner size="xs" /> : <Save size={14} />}
                  onClick={() => currentWorkout && handleSave(currentWorkout)}
                  isDisabled={!currentWorkout || isSaving}
                  isLoading={isSaving}
                  loadingText={t('common.loading')}
                >
                  {t('common.save')}
                </Button>
              </HStack>
            </Box>
          </Flex>
        )}
      </Box>
    </Box>
  );
}

interface SegmentItemProps {
  segment: FlatSegment;
  index: number;
  isHovered: boolean;
  isSelected: boolean;
  onHover: () => void;
  onLeave: () => void;
  onClick: () => void;
  borderColor: string;
}

function SegmentItem({
  segment,
  index,
  isHovered,
  isSelected,
  onHover,
  onLeave,
  onClick,
  borderColor,
}: SegmentItemProps) {
  const bgColor = useColorModeValue('white', 'gray.700');
  const hoverBg = useColorModeValue('gray.50', 'gray.600');
  const selectedBg = useColorModeValue('brand.50', 'brand.900');

  const typeColors: Record<string, string> = {
    warmUp: 'green',
    active: 'red',
    rest: 'blue',
    coolDown: 'purple',
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs}s`;
    if (secs === 0) return `${mins}m`;
    return `${mins}m ${secs}s`;
  };

  return (
    <Box
      p={3}
      bg={isSelected ? selectedBg : isHovered ? hoverBg : bgColor}
      borderWidth="1px"
      borderColor={isSelected ? 'brand.500' : borderColor}
      borderRadius="md"
      cursor="pointer"
      transition="all 0.15s"
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onClick={onClick}
    >
      <HStack justify="space-between" mb={1}>
        <HStack>
          <Badge colorScheme={typeColors[segment.type]} size="sm">
            {segment.type}
          </Badge>
          {segment.name && (
            <Text fontWeight="medium" fontSize="sm">
              {segment.name}
            </Text>
          )}
        </HStack>
        <Text fontSize="xs" color="gray.500">
          #{index + 1}
        </Text>
      </HStack>

      <HStack fontSize="xs" color="gray.500" spacing={4}>
        <Text>{formatDuration(segment.duration)}</Text>
        <Text>
          {segment.targetMin}-{segment.targetMax}% FTP
        </Text>
      </HStack>
    </Box>
  );
}
