import { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  VStack,
  Input,
  NumberInput,
  NumberInputField,
  Select,
  IconButton,
  Text,
  Textarea,
  useColorModeValue,
  useDisclosure,
  useToast,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  FormControl,
  FormLabel,
  Link,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
} from '@chakra-ui/react';
import { Plus, Trash2, Save, Dumbbell, Folder, FolderPlus, Settings, ChevronDown, Youtube } from 'lucide-react';
import type { StrengthExercise, LoadType, DurationType } from '../../../types/strengthWorkout';
import type { WorkoutType } from '../../../types/workout';
import { WORKOUT_TYPES, getWorkoutTypeConfig } from '../../../utils/workoutTypes';
import { CategoryManagementModal } from './CategoryManagementModal';

interface StrengthBuilderExercise extends StrengthExercise {
  // No additional fields needed for now
}

interface WorkoutCategory {
  id: string;
  name: string;
  slug: string;
  coachId?: string | null;
}

interface StrengthWorkoutBuilderProps {
  initialWorkout?: any;
  onSave?: (workout: any) => void;
  onCancel?: () => void;
  categories?: WorkoutCategory[];
  isSaving?: boolean;
  workoutType: 'gymHome' | 'gymFacility';
  onCreateCategory?: (name: string) => Promise<WorkoutCategory>;
  coachId?: string;
  onCategoriesChange?: () => void;
  onWorkoutTypeChange?: (type: WorkoutType) => void;
  hideMetadata?: boolean; // Hide title, description, category, workout type inputs
  // When hideMetadata is true, these must be provided by parent:
  title?: string;
  description?: string;
  categoryId?: string;
}

const EXERCISE_CATEGORIES = {
  upperBody: 'Upper Body',
  lowerBody: 'Lower Body',
  core: 'Core',
  fullBody: 'Full Body',
  mobility: 'Mobility',
} as const;

const generateId = () => `exercise-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const createDefaultExercise = (): StrengthBuilderExercise => ({
  id: generateId(),
  name: '',
  sets: 3,
  durationType: 'reps',
  repsMin: 10,
  loadType: 'bodyweight',
  restSeconds: 60,
  category: 'upperBody',
});

export function StrengthWorkoutBuilder({
  initialWorkout,
  onSave,
  onCancel,
  categories = [],
  isSaving = false,
  workoutType: initialWorkoutType,
  onCreateCategory,
  coachId,
  onCategoriesChange,
  onWorkoutTypeChange,
  hideMetadata = false,
  title: externalTitle,
  description: externalDescription,
  categoryId: externalCategoryId,
}: StrengthWorkoutBuilderProps) {
  const { t } = useTranslation();
  const toast = useToast();
  const { isOpen: isCategoryModalOpen, onOpen: openCategoryModal, onClose: closeCategoryModal } = useDisclosure();
  const { isOpen: isCategoryManageModalOpen, onOpen: openCategoryManageModal, onClose: closeCategoryManageModal } = useDisclosure();

  // Workout metadata - use external props when hideMetadata is true
  const [title, setTitle] = useState(initialWorkout?.title || '');
  const [description, setDescription] = useState(initialWorkout?.description || '');
  const [categoryId, setCategoryId] = useState(
    initialWorkout?.categoryId || categories[0]?.id || ''
  );
  const [workoutType, setWorkoutType] = useState<WorkoutType>(initialWorkoutType);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);

  // Use external values when hideMetadata is true
  const activeTitle = hideMetadata ? (externalTitle || '') : title;
  const activeDescription = hideMetadata ? (externalDescription || '') : description;
  const activeCategoryId = hideMetadata ? (externalCategoryId || '') : categoryId;

  // Exercises
  const [exercises, setExercises] = useState<StrengthBuilderExercise[]>(() => {
    if (initialWorkout?.attributes?.structure?.exercises) {
      return initialWorkout.attributes.structure.exercises;
    }
    return [createDefaultExercise()];
  });

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const headerBg = useColorModeValue('gray.50', 'gray.900');
  const menuBg = useColorModeValue('white', 'gray.800');
  const menuHoverBg = useColorModeValue('gray.100', 'gray.700');

  // Calculate estimated duration
  const estimatedDuration = useMemo(() => {
    let totalSeconds = 0;
    exercises.forEach((ex) => {
      let exerciseTime = 0;
      if (ex.durationType === 'time') {
        // Time-based: use durationSeconds directly
        exerciseTime = ex.durationSeconds || 30;
      } else {
        // Rep-based: estimate 3 seconds per rep
        exerciseTime = (ex.repsMin || 10) * 3;
      }
      const setTime = (exerciseTime + ex.restSeconds) * ex.sets;
      totalSeconds += setTime;
    });
    return Math.round(totalSeconds / 60); // Return minutes
  }, [exercises]);

  const handleAddExercise = useCallback(() => {
    setExercises((prev) => [...prev, createDefaultExercise()]);
  }, []);

  const handleUpdateExercise = useCallback((id: string, updates: Partial<StrengthBuilderExercise>) => {
    setExercises((prev) =>
      prev.map((ex) => (ex.id === id ? { ...ex, ...updates } : ex))
    );
  }, []);

  const handleDeleteExercise = useCallback((id: string) => {
    setExercises((prev) => prev.filter((ex) => ex.id !== id));
  }, []);

  const handleWorkoutTypeChange = useCallback((type: WorkoutType) => {
    setWorkoutType(type);
    onWorkoutTypeChange?.(type);
  }, [onWorkoutTypeChange]);

  const handleCreateCategory = useCallback(async () => {
    if (!newCategoryName.trim() || !onCreateCategory) return;

    setIsCreatingCategory(true);
    try {
      const newCategory = await onCreateCategory(newCategoryName.trim());
      setCategoryId(newCategory.id);
      setNewCategoryName('');
      closeCategoryModal();
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
  }, [newCategoryName, onCreateCategory, closeCategoryModal, toast, t]);

  const handleSave = useCallback(() => {
    if (isSaving) return;

    if (!activeTitle.trim()) {
      return;
    }

    const workout = {
      id: initialWorkout?.id || Date.now(),
      title: activeTitle,
      description: activeDescription,
      categoryId: activeCategoryId,
      attributes: {
        structure: {
          exercises,
        },
        totalTimePlanned: estimatedDuration / 60, // hours
        workoutTypeName: workoutType === 'gymHome' ? 'Gym (Home)' : 'Gym (Facility)',
        workoutType,
      },
    };

    onSave?.(workout);
  }, [exercises, activeTitle, activeDescription, activeCategoryId, estimatedDuration, onSave, initialWorkout, isSaving, workoutType]);

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
        justify="space-between"
        align="center"
        flexShrink={0}
      >
        <HStack>
          <Dumbbell size={20} />
          <Heading size="sm">Strength Workout Builder</Heading>
        </HStack>
        <HStack spacing={2}>
          <Button size="sm" variant="ghost" onClick={onCancel} isDisabled={isSaving}>
            {t('common.cancel')}
          </Button>
          <Button
            size="sm"
            colorScheme="brand"
            leftIcon={<Save size={16} />}
            onClick={handleSave}
            isLoading={isSaving}
            loadingText={t('common.loading')}
          >
            {t('common.save')}
          </Button>
        </HStack>
      </Flex>

      {/* Content */}
      <Box flex="1" overflowY="auto" p={6}>
        <VStack spacing={6} align="stretch">
          {/* Metadata */}
          {!hideMetadata && (
            <VStack spacing={4} align="stretch">
              <Input
                placeholder="Workout Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                fontSize="lg"
                fontWeight="semibold"
              />
              <Textarea
                placeholder="Description (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />

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
                          {categories.find((c) => c.id === activeCategoryId)?.name || t('builder.selectCategory')}
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
                    {onCreateCategory && (
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
                          onClick={() => handleWorkoutTypeChange(type.value as WorkoutType)}
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
            </VStack>
          )}

          {/* Summary */}
          <HStack spacing={4} p={3} bg={headerBg} borderRadius="md">
            <Text fontSize="sm" color="gray.600">
              <strong>{exercises.length}</strong> exercises
            </Text>
            <Text fontSize="sm" color="gray.600">
              <strong>~{estimatedDuration}</strong> minutes
            </Text>
          </HStack>

          {/* Exercises */}
          <VStack spacing={3} align="stretch">
            <Heading size="sm">Exercises</Heading>
            {exercises.map((exercise, index) => (
              <ExerciseEditor
                key={exercise.id}
                exercise={exercise}
                index={index}
                onUpdate={(updates) => handleUpdateExercise(exercise.id, updates)}
                onDelete={() => handleDeleteExercise(exercise.id)}
                borderColor={borderColor}
              />
            ))}
            <Button
              leftIcon={<Plus size={16} />}
              onClick={handleAddExercise}
              variant="outline"
              size="sm"
            >
              Add Exercise
            </Button>
          </VStack>
        </VStack>
      </Box>

      {/* Category Creation Modal */}
      {onCreateCategory && (
        <Modal isOpen={isCategoryModalOpen} onClose={closeCategoryModal}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>{t('builder.createCategory')}</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4}>
                <Input
                  placeholder={t('builder.categoryName')}
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleCreateCategory();
                    }
                  }}
                />
              </VStack>
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
                {t('common.create')}
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}

      {/* Category Management Modal */}
      {coachId && onCategoriesChange && (
        <CategoryManagementModal
          isOpen={isCategoryManageModalOpen}
          onClose={closeCategoryManageModal}
          coachId={coachId}
          onCategoriesChange={onCategoriesChange}
        />
      )}
    </Box>
  );
}

interface ExerciseEditorProps {
  exercise: StrengthBuilderExercise;
  index: number;
  onUpdate: (updates: Partial<StrengthBuilderExercise>) => void;
  onDelete: () => void;
  borderColor: string;
}

function ExerciseEditor({ exercise, index, onUpdate, onDelete, borderColor }: ExerciseEditorProps) {
  const { t } = useTranslation();
  const bgColor = useColorModeValue('gray.50', 'gray.700');
  const videoId = exercise.videoUrl ? extractYouTubeVideoId(exercise.videoUrl) : null;

  return (
    <Box
      bg={bgColor}
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="md"
      p={4}
    >
      <Flex gap={4} align="flex-start">
        {/* Left side: Exercise details */}
        <VStack spacing={3} align="stretch" flex={videoId ? 1 : undefined} minW={0}>
        {/* Exercise name */}
        <HStack>
          <Text fontSize="sm" fontWeight="semibold" minW="60px">
            #{index + 1}
          </Text>
          <Input
            placeholder="Exercise name (e.g., Squats, Push-ups)"
            value={exercise.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            size="sm"
          />
          <IconButton
            aria-label="Delete exercise"
            icon={<Trash2 size={14} />}
            size="sm"
            variant="ghost"
            colorScheme="red"
            onClick={onDelete}
          />
        </HStack>

        {/* Sets × Reps */}
        <HStack spacing={2} flexWrap="wrap">
          <HStack spacing={1}>
            <Text fontSize="sm" minW="50px">Sets:</Text>
            <NumberInput
              size="sm"
              value={exercise.sets ?? 3}
              min={1}
              max={20}
              w="60px"
              onChange={(_, val) => {
                if (!isNaN(val)) {
                  onUpdate({ sets: val });
                }
              }}
            >
              <NumberInputField />
            </NumberInput>
          </HStack>

          <HStack spacing={1}>
            <Text fontSize="sm" minW="50px">{t('builder.duration')}:</Text>
            <Select
              size="sm"
              value={exercise.durationType ?? 'reps'}
              w="100px"
              onChange={(e) => {
                const newType = e.target.value as DurationType;
                const updates: Partial<StrengthBuilderExercise> = { durationType: newType };

                // Initialize appropriate field when switching types
                if (newType === 'time' && !exercise.durationSeconds) {
                  updates.durationSeconds = 30;
                } else if (newType === 'reps' && !exercise.repsMin) {
                  updates.repsMin = 10;
                }

                onUpdate(updates);
              }}
            >
              <option value="reps">{t('builder.durationReps')}</option>
              <option value="time">{t('builder.durationTime')}</option>
            </Select>

            {exercise.durationType === 'reps' ? (
              <>
                <NumberInput
                  size="sm"
                  value={exercise.repsMin ?? 10}
                  min={1}
                  max={100}
                  w="60px"
                  onChange={(_, val) => {
                    if (!isNaN(val)) {
                      onUpdate({ repsMin: val });
                    }
                  }}
                >
                  <NumberInputField />
                </NumberInput>
                {exercise.repsMax && exercise.repsMax !== exercise.repsMin && (
                  <>
                    <Text fontSize="sm">-</Text>
                    <NumberInput
                      size="sm"
                      value={exercise.repsMax ?? 10}
                      min={exercise.repsMin ?? 1}
                      max={100}
                      w="60px"
                      onChange={(_, val) => {
                        if (!isNaN(val)) {
                          onUpdate({ repsMax: val });
                        }
                      }}
                    >
                      <NumberInputField />
                    </NumberInput>
                  </>
                )}
                <Text fontSize="sm">{t('builder.reps')}</Text>
              </>
            ) : (
              <>
                <NumberInput
                  size="sm"
                  value={exercise.durationSeconds ?? 30}
                  min={5}
                  max={600}
                  step={5}
                  w="80px"
                  onChange={(_, val) => {
                    if (!isNaN(val)) {
                      onUpdate({ durationSeconds: val });
                    }
                  }}
                >
                  <NumberInputField />
                </NumberInput>
                <Text fontSize="sm">{t('builder.seconds')}</Text>
              </>
            )}
          </HStack>

          <HStack spacing={1}>
            <Text fontSize="sm" minW="50px">Load:</Text>
            <Select
              size="sm"
              value={exercise.loadType}
              w="120px"
              onChange={(e) => onUpdate({ loadType: e.target.value as LoadType })}
            >
              <option value="bodyweight">Bodyweight</option>
              <option value="weighted">Weighted</option>
              <option value="percentage">% 1RM</option>
            </Select>
            {exercise.loadType === 'bodyweight' && (
              <Text fontSize="sm" color="gray.500" fontStyle="italic">
                (no external load)
              </Text>
            )}
            {exercise.loadType !== 'bodyweight' && (
              <>
                <NumberInput
                  size="sm"
                  value={exercise.load ?? 0}
                  min={0}
                  max={500}
                  w="80px"
                  onChange={(_, val) => {
                    if (!isNaN(val)) {
                      onUpdate({ load: val });
                    }
                  }}
                >
                  <NumberInputField />
                </NumberInput>
                {exercise.loadType === 'weighted' && <Text fontSize="sm">kg</Text>}
                {exercise.loadType === 'percentage' && <Text fontSize="sm">%</Text>}
              </>
            )}
          </HStack>

          <HStack spacing={1}>
            <Text fontSize="sm" minW="50px">Rest:</Text>
            <NumberInput
              size="sm"
              value={exercise.restSeconds ?? 60}
              min={0}
              max={300}
              step={15}
              w="80px"
              onChange={(_, val) => {
                if (!isNaN(val)) {
                  onUpdate({ restSeconds: val });
                }
              }}
            >
              <NumberInputField />
            </NumberInput>
            <Text fontSize="sm">sec</Text>
          </HStack>
        </HStack>

        {/* Category and Notes */}
        <HStack spacing={2}>
          <Select
            size="sm"
            value={exercise.category}
            onChange={(e) => onUpdate({ category: e.target.value as any })}
            maxW="200px"
          >
            {Object.entries(EXERCISE_CATEGORIES).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </Select>
          <Input
            size="sm"
            placeholder="Notes (optional)"
            value={exercise.notes || ''}
            onChange={(e) => onUpdate({ notes: e.target.value })}
          />
        </HStack>

        {/* Video URL */}
        <HStack spacing={2}>
          <HStack spacing={1} minW="100px">
            <Box as={Youtube} boxSize={4} color="red.500" />
            <Text fontSize="sm" fontWeight="medium">{t('builder.videoUrl')}:</Text>
          </HStack>
          <Input
            size="sm"
            placeholder={t('builder.videoUrlPlaceholder')}
            value={exercise.videoUrl || ''}
            onChange={(e) => onUpdate({ videoUrl: e.target.value })}
          />
        </HStack>
      </VStack>

        {/* Right side: YouTube Embed (if video URL exists) */}
        {videoId && (
          <Box
            flexShrink={0}
            w="300px"
            position="relative"
            paddingBottom="168.75px" // 300px * 9/16 = 168.75px for 16:9 ratio
            height="0"
            overflow="hidden"
            borderRadius="md"
            bg="gray.100"
            _dark={{ bg: 'gray.700' }}
          >
            <iframe
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                border: 0,
              }}
              src={`https://www.youtube.com/embed/${videoId}`}
              title="Exercise video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </Box>
        )}
      </Flex>
    </Box>
  );
}

/**
 * Extract YouTube video ID from various URL formats
 * Supports:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://m.youtube.com/watch?v=VIDEO_ID
 */
function extractYouTubeVideoId(url: string): string | null {
  if (!url) return null;

  // Match youtube.com/watch?v=VIDEO_ID
  const watchMatch = url.match(/[?&]v=([^&]+)/);
  if (watchMatch) return watchMatch[1];

  // Match youtu.be/VIDEO_ID
  const shortMatch = url.match(/youtu\.be\/([^?]+)/);
  if (shortMatch) return shortMatch[1];

  // Match youtube.com/embed/VIDEO_ID
  const embedMatch = url.match(/youtube\.com\/embed\/([^?]+)/);
  if (embedMatch) return embedMatch[1];

  return null;
}
