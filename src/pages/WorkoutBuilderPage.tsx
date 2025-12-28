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
  Input,
  Textarea,
  FormControl,
  FormLabel,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  Link,
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, List, BarChart3, Save, X, Folder, FolderPlus, Settings, ChevronDown, Paperclip, Upload, File as FileIcon, Trash2 } from 'lucide-react';
import { ParentSize } from '@visx/responsive';
import { Header } from '../components/organisms';
import { WorkoutBuilder } from '../components/organisms/Coach';
import { StrengthWorkoutBuilder } from '../components/organisms/Coach/StrengthWorkoutBuilder';
import { CategoryManagementModal } from '../components/organisms/Coach/CategoryManagementModal';
import { WorkoutChart } from '../components/organisms/WorkoutChart';
import { useWorkoutsAPI, useWorkoutById, type CreateWorkoutPayload, type ApiWorkoutResponse } from '../hooks/useCalendarAPI';
import { useUser } from '../contexts/UserContext';
import { useAuthenticatedApi } from '../hooks/useAuthenticatedApi';
import type { Workout, ParsedWorkout, FlatSegment, WorkoutType } from '../types/workout';
import { WORKOUT_TYPES, getWorkoutTypeConfig } from '../utils/workoutTypes';

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

  // Workout metadata state (shared between cycling and strength builders)
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [workoutType, setWorkoutType] = useState<WorkoutType>('outdoorCycling');
  const [existingAttachments, setExistingAttachments] = useState<string[]>([]); // URLs from API
  const [newAttachments, setNewAttachments] = useState<File[]>([]); // New files to upload

  // Category modal state
  const { isOpen: isCategoryModalOpen, onOpen: openCategoryModal, onClose: closeCategoryModal } = useDisclosure();
  const { isOpen: isCategoryManageModalOpen, onOpen: openCategoryManageModal, onClose: closeCategoryManageModal } = useDisclosure();
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);

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
  const menuBg = useColorModeValue('white', 'gray.800');
  const menuHoverBg = useColorModeValue('gray.100', 'gray.700');
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

      // Initialize common metadata state
      setTitle(convertedWorkout.title);
      setDescription(convertedWorkout.description);
      setCategoryId(convertedWorkout.categoryId || categories[0]?.id || '');
      setWorkoutType(convertedWorkout.attributes?.workoutType || 'outdoorCycling');

      // Load existing attachments
      setExistingAttachments(existingWorkout.attachments || []);
    }
  }, [existingWorkout, initialWorkoutData, categories]);

  // Determine if this is a strength workout (gym-based)
  const isStrengthWorkout = useMemo(() => {
    return workoutType === 'gymHome' || workoutType === 'gymFacility';
  }, [workoutType]);

  // Convert current workout to ParsedWorkout for chart
  const parsedWorkout = useMemo((): ParsedWorkout | null => {
    if (!currentWorkout?.attributes?.structure) return null;

    // Strength workouts have a different structure (exercises), not for chart visualization
    if (isStrengthWorkout) return null;

    // Only process cycling workouts that have structure.structure
    if (!currentWorkout.attributes.structure.structure) return null;

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
        // Include cadence and HR if present
        ...(target.cadenceMin !== undefined && { cadenceMin: target.cadenceMin }),
        ...(target.cadenceMax !== undefined && { cadenceMax: target.cadenceMax }),
        ...(target.hrMin !== undefined && { hrMin: target.hrMin }),
        ...(target.hrMax !== undefined && { hrMax: target.hrMax }),
        ...(target.hrType && { hrType: target.hrType }),
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
  }, [currentWorkout, isStrengthWorkout]);

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

  const handleCreateCategory = useCallback(async () => {
    if (!newCategoryName.trim()) return;

    setIsCreatingCategory(true);
    try {
      const newCategory = await api.post<{ id: string; name: string; slug: string }>('/api/workouts/categories', { name: newCategoryName.trim(), coachId });
      setCategoryId(newCategory.id);
      setNewCategoryName('');
      closeCategoryModal();
      refetchCategories();
      toast({
        title: t('builder.categoryCreated'),
        status: 'success',
        duration: 2000,
      });
    } catch {
      toast({
        title: t('common.error'),
        status: 'error',
        duration: 2000,
      });
    } finally {
      setIsCreatingCategory(false);
    }
  }, [newCategoryName, coachId, api, closeCategoryModal, refetchCategories, toast, t]);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const filesArray = Array.from(files);
      console.log('Files selected:', filesArray.map(f => f.name));
      setNewAttachments((prev) => [...prev, ...filesArray]);
      // Reset input value to allow selecting the same file again
      event.target.value = '';
    }
  }, []);

  const handleRemoveExistingAttachment = useCallback((index: number) => {
    setExistingAttachments((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleRemoveNewAttachment = useCallback((index: number) => {
    setNewAttachments((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleSave = useCallback(async (workout: Workout) => {
    if (isSaving) return;

    // Validate required fields
    if (!title.trim()) {
      toast({
        title: t('builder.titleRequired'),
        status: 'error',
        duration: 3000,
      });
      return;
    }

    if (!categoryId) {
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

      // Upload new attachments to VPS storage
      let newlyUploadedURLs: string[] = [];
      console.log('About to upload files. New attachments count:', newAttachments.length);
      console.log('New attachments:', newAttachments.map(f => f.name));

      if (newAttachments.length > 0) {
        console.log('Starting file upload...');
        try {
          const formData = new FormData();
          newAttachments.forEach((file) => {
            console.log('Appending file to FormData:', file.name, file.size, 'bytes');
            formData.append('files', file);
          });

          console.log('Calling upload API...');
          const uploadResponse = await api.post<{ files: Array<{ filename: string; path: string; url: string }> }>(
            '/api/workouts/upload-attachments',
            formData
          );

          newlyUploadedURLs = uploadResponse.files.map(f => f.url);
          console.log('Files uploaded successfully:', newlyUploadedURLs);
        } catch (uploadError) {
          console.error('File upload failed:', uploadError);
          toast({
            title: t('builder.fileUploadFailed'),
            description: t('builder.workoutSavedWithoutAttachments'),
            status: 'warning',
            duration: 4000,
          });
        }
      } else {
        console.log('No new files to upload');
      }

      // Merge existing attachments with newly uploaded ones
      const allAttachments = [...existingAttachments, ...newlyUploadedURLs];

      const payload: CreateWorkoutPayload = {
        slug: generateSlug(title),
        name: title,
        description: description || undefined,
        durationSeconds,
        durationCategory: getDurationCategory(durationSeconds),
        tssPlanned: workout.attributes?.tssPlanned || undefined,
        ifPlanned: workout.attributes?.ifPlanned || undefined,
        structure: workout.attributes?.structure || { structure: [] },
        categoryId: categoryId,
        workoutType: workoutType,
        coachId,
        attachments: allAttachments.length > 0 ? allAttachments : undefined,
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
        description: title,
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
  }, [isSaving, toast, t, navigate, isEditing, id, api, title, description, categoryId, workoutType, coachId, newAttachments, existingAttachments]);

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

          {/* View Mode Toggle - hide for strength workouts (no chart view) */}
          {!isStrengthWorkout && (
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
          )}
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
        <Box
          bg={cardBg}
          borderRadius="xl"
          borderWidth="1px"
          borderColor={borderColor}
          overflow="hidden"
          h="full"
          display="flex"
          flexDirection="column"
        >
          {/* Common Workout Metadata */}
          <VStack spacing={4} p={6} align="stretch" flexShrink={0}>
            {/* Title */}
            <FormControl isRequired>
              <FormLabel fontSize="sm">{t('builder.workoutTitle')}</FormLabel>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('builder.titlePlaceholder')}
              />
            </FormControl>

            {/* Category dropdown */}
            <FormControl isRequired>
              <Flex align="center" justify="space-between" mb={1}>
                <FormLabel fontSize="sm" mb={0}>{t('builder.category')}</FormLabel>
                {coachId && (
                  <Link
                    as="button"
                    fontSize="xs"
                    color="brand.500"
                    _hover={{ textDecoration: 'underline' }}
                    onClick={openCategoryManageModal}
                    display="flex"
                    alignItems="center"
                    gap={1}
                  >
                    <Settings size={12} />
                    {t('categories.manage')}
                  </Link>
                )}
              </Flex>
              <Menu matchWidth>
                <MenuButton
                  as={Button}
                  variant="unstyled"
                  maxW="340px"
                  w="full"
                  textAlign="left"
                  fontWeight="normal"
                  bg="gray.100"
                  px={3}
                  h="40px"
                  borderRadius="15px"
                  _dark={{ bg: 'navy.800' }}
                  _hover={{ bg: 'gray.200', _dark: { bg: 'navy.700' } }}
                >
                  <Flex align="center" justify="space-between" w="full">
                    <HStack spacing={2}>
                      <Box as={Folder} boxSize={4} color="purple.500" />
                      <Text>
                        {categories.find((c) => c.id === categoryId)?.name || t('builder.selectCategory')}
                      </Text>
                    </HStack>
                    <ChevronDown size={14} />
                  </Flex>
                </MenuButton>
                <MenuList maxH="300px" overflowY="auto" bg={menuBg}>
                  {categories.map((category) => (
                    <MenuItem
                      key={category.id}
                      icon={<Box as={Folder} boxSize={4} color="purple.500" />}
                      onClick={() => setCategoryId(category.id)}
                      bg={categoryId === category.id ? 'gray.100' : undefined}
                      _dark={{ bg: categoryId === category.id ? 'gray.600' : undefined }}
                      _hover={{ bg: menuHoverBg }}
                    >
                      {category.name}
                    </MenuItem>
                  ))}
                  {coachId && (
                    <>
                      <MenuDivider />
                      <MenuItem
                        icon={<Box as={FolderPlus} boxSize={4} color="green.500" />}
                        onClick={openCategoryModal}
                        fontWeight="medium"
                        color="green.600"
                        _dark={{ color: 'green.300' }}
                        _hover={{ bg: menuHoverBg }}
                      >
                        {t('builder.createCategory')}
                      </MenuItem>
                    </>
                  )}
                </MenuList>
              </Menu>
            </FormControl>

            {/* Workout Type */}
            <FormControl isRequired>
              <FormLabel fontSize="sm">{t('builder.workoutType')}</FormLabel>
              <Menu matchWidth>
                <MenuButton
                  as={Button}
                  variant="unstyled"
                  maxW="340px"
                  w="full"
                  textAlign="left"
                  fontWeight="normal"
                  bg="gray.100"
                  px={3}
                  h="40px"
                  borderRadius="15px"
                  _dark={{ bg: 'navy.800' }}
                  _hover={{ bg: 'gray.200', _dark: { bg: 'navy.700' } }}
                >
                  <Flex align="center" justify="space-between" w="full">
                    <HStack spacing={2}>
                      {(() => {
                        const config = getWorkoutTypeConfig(workoutType);
                        const Icon = config.icon;
                        return (
                          <>
                            <Box as={Icon} boxSize={4} color={`${config.color}.500`} />
                            <Text>{t(`builder.${config.label}`)}</Text>
                          </>
                        );
                      })()}
                    </HStack>
                    <ChevronDown size={14} />
                  </Flex>
                </MenuButton>
                <MenuList bg={menuBg}>
                  {WORKOUT_TYPES.map((type) => {
                    const Icon = type.icon;
                    return (
                      <MenuItem
                        key={type.value}
                        icon={<Box as={Icon} boxSize={4} color={`${type.color}.500`} />}
                        onClick={() => setWorkoutType(type.value as WorkoutType)}
                        bg={workoutType === type.value ? 'gray.100' : undefined}
                        _dark={{ bg: workoutType === type.value ? 'gray.600' : undefined }}
                        _hover={{ bg: menuHoverBg }}
                      >
                        {t(`builder.${type.label}`)}
                      </MenuItem>
                    );
                  })}
                </MenuList>
              </Menu>
            </FormControl>

            {/* Description */}
            <FormControl>
              <FormLabel fontSize="sm">{t('builder.description')}</FormLabel>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('builder.descriptionPlaceholder')}
                rows={2}
              />
            </FormControl>

            {/* Attachments */}
            <FormControl>
              <FormLabel fontSize="sm" display="flex" alignItems="center" gap={1}>
                <Paperclip size={14} />
                {t('builder.attachments')}
              </FormLabel>

              {/* File Upload Button */}
              <Button
                as="label"
                size="sm"
                variant="outline"
                leftIcon={<Upload size={14} />}
                cursor="pointer"
              >
                {t('builder.uploadFile')}
                <input
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png,.gif,.mp4,.mov,.avi,.doc,.docx"
                  style={{ display: 'none' }}
                  onChange={handleFileUpload}
                />
              </Button>

              {/* Attached Files List */}
              {(existingAttachments.length > 0 || newAttachments.length > 0) && (
                <VStack spacing={2} align="stretch" mt={3}>
                  {/* Existing attachments (URLs from API) */}
                  {existingAttachments.map((url, index) => {
                    const filename = url.split('/').pop() || 'file';
                    return (
                      <Flex
                        key={`existing-${index}`}
                        align="center"
                        justify="space-between"
                        p={2}
                        bg="gray.50"
                        _dark={{ bg: 'gray.700' }}
                        borderRadius="md"
                        borderWidth="1px"
                        borderColor={borderColor}
                      >
                        <HStack spacing={2} flex={1} minW={0}>
                          <Box as={FileIcon} boxSize={4} color="blue.500" flexShrink={0} />
                          <VStack spacing={0} align="start" flex={1} minW={0}>
                            <Text fontSize="sm" fontWeight="medium" isTruncated maxW="full">
                              {filename}
                            </Text>
                            <Text fontSize="xs" color="gray.500">
                              {t('builder.existingFile')}
                            </Text>
                          </VStack>
                        </HStack>
                        <IconButton
                          aria-label={t('builder.removeAttachment')}
                          icon={<Trash2 size={14} />}
                          size="xs"
                          variant="ghost"
                          colorScheme="red"
                          onClick={() => handleRemoveExistingAttachment(index)}
                        />
                      </Flex>
                    );
                  })}
                  {/* New attachments (File objects to be uploaded) */}
                  {newAttachments.map((file, index) => (
                    <Flex
                      key={`new-${index}`}
                      align="center"
                      justify="space-between"
                      p={2}
                      bg="gray.50"
                      _dark={{ bg: 'gray.700' }}
                      borderRadius="md"
                      borderWidth="1px"
                      borderColor={borderColor}
                    >
                      <HStack spacing={2} flex={1} minW={0}>
                        <Box as={FileIcon} boxSize={4} color="green.500" flexShrink={0} />
                        <VStack spacing={0} align="start" flex={1} minW={0}>
                          <Text fontSize="sm" fontWeight="medium" isTruncated maxW="full">
                            {file.name}
                          </Text>
                          <Text fontSize="xs" color="gray.500">
                            {formatFileSize(file.size)} • {t('builder.newFile')}
                          </Text>
                        </VStack>
                      </HStack>
                      <IconButton
                        aria-label={t('builder.removeAttachment')}
                        icon={<Trash2 size={14} />}
                        size="xs"
                        variant="ghost"
                        colorScheme="red"
                        onClick={() => handleRemoveNewAttachment(index)}
                      />
                    </Flex>
                  ))}
                </VStack>
              )}
            </FormControl>
          </VStack>

          <Divider />

          {/* Workout Structure Builder */}
          <Box flex={1} overflowY="auto">
            {isStrengthWorkout ? (
              // Strength Workout Builder - for gym workouts
              <StrengthWorkoutBuilder
                initialWorkout={initialWorkoutData || undefined}
                onSave={handleSave}
                onCancel={handleCancel}
                categories={categories}
                isSaving={isSaving}
                workoutType={workoutType as 'gymHome' | 'gymFacility'}
                onCreateCategory={async (name: string) => {
                  const newCategory = await api.post<{ id: string; name: string; slug: string; coachId?: string | null }>('/api/workouts/categories', { name, coachId });
                  refetchCategories();
                  return newCategory;
                }}
                coachId={coachId}
                onCategoriesChange={refetchCategories}
                onWorkoutTypeChange={(type) => setWorkoutType(type)}
                hideMetadata={true}
                title={title}
                description={description}
                categoryId={categoryId}
              />
            ) : viewMode === 'structure' ? (
              // Structure View - Cycling WorkoutBuilder
              <WorkoutBuilder
                initialWorkout={initialWorkoutData || undefined}
                onSave={handleSave}
                onCancel={handleCancel}
                onChange={handleWorkoutChange}
                categories={categories}
                isSaving={isSaving}
                coachId={coachId}
                onCategoriesChange={refetchCategories}
                hideMetadata={true}
              />
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

        {/* Category Creation Modal */}
        <Modal isOpen={isCategoryModalOpen} onClose={closeCategoryModal}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>{t('builder.newCategory')}</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <FormControl>
                <FormLabel>{t('builder.categoryName')}</FormLabel>
                <Input
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder={t('builder.categoryNamePlaceholder')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newCategoryName.trim()) {
                      handleCreateCategory();
                    }
                  }}
                />
              </FormControl>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={closeCategoryModal}>
                {t('common.cancel')}
              </Button>
              <Button
                colorScheme="brand"
                onClick={handleCreateCategory}
                isLoading={isCreatingCategory}
                isDisabled={!newCategoryName.trim()}
              >
                {t('builder.createCategory')}
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Category Management Modal */}
        {coachId && (
          <CategoryManagementModal
            isOpen={isCategoryManageModalOpen}
            onClose={closeCategoryManageModal}
            coachId={coachId}
            onCategoriesChange={refetchCategories}
          />
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

      <HStack fontSize="xs" color="gray.500" spacing={4} flexWrap="wrap">
        <Text>{formatDuration(segment.duration)}</Text>
        <Text>
          {segment.targetMin}-{segment.targetMax}% FTP
        </Text>
        {(segment.cadenceMin !== undefined || segment.cadenceMax !== undefined) && (
          <Text>
            {segment.cadenceMin === segment.cadenceMax
              ? `${segment.cadenceMax} RPM`
              : `${segment.cadenceMin ?? ''}-${segment.cadenceMax ?? ''} RPM`
            }
          </Text>
        )}
        {(segment.hrMin !== undefined || segment.hrMax !== undefined) && (
          <Text>
            {segment.hrMin === segment.hrMax
              ? `${segment.hrMax}`
              : `${segment.hrMin ?? ''}-${segment.hrMax ?? ''}`
            }
            {segment.hrType === 'percent' ? '% HR' : ' BPM'}
          </Text>
        )}
      </HStack>
    </Box>
  );
}
