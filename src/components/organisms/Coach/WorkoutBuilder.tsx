import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  Box,
  Flex,
  VStack,
  HStack,
  Heading,
  Text,
  Input,
  Textarea,
  Select,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Button,
  IconButton,
  Badge,
  useColorModeValue,
  useBreakpointValue,
  Divider,
  FormControl,
  FormLabel,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  useToast,
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
import {
  Plus,
  Trash2,
  Copy,
  GripVertical,
  ChevronDown,
  ChevronRight,
  Save,
  Repeat,
  Play,
  Pause,
  Snowflake,
  FolderPlus,
  Folder,
  Settings,
} from 'lucide-react';
import { CategoryManagementModal } from './CategoryManagementModal';
import type { WorkoutStepData, Workout, WorkoutStructure, WorkoutType } from '../../../types/workout';
import { WORKOUT_TYPES, getWorkoutTypeConfig } from '../../../utils/workoutTypes';

// Builder-specific step type
interface BuilderStep {
  id: string;
  type: 'step' | 'repetition';
  name: string;
  intensityClass: 'warmUp' | 'active' | 'rest' | 'coolDown';
  durationValue: number;
  durationUnit: 'second' | 'minute';
  targetMin: number;
  targetMax: number;
  // Optional cadence and HR targets
  cadenceMin?: number;
  cadenceMax?: number;
  hrMin?: number;
  hrMax?: number;
  hrType?: 'bpm' | 'percent';
  // For repetitions
  repeatCount?: number;
  nestedSteps?: BuilderStep[];
}

interface WorkoutCategory {
  id: string;
  name: string;
  slug: string;
  coachId?: string | null;
}

interface WorkoutBuilderProps {
  initialWorkout?: Workout;
  onSave?: (workout: Workout) => void;
  onCancel?: () => void;
  onChange?: (workout: Workout) => void;
  categories?: WorkoutCategory[];
  isSaving?: boolean;
  onCreateCategory?: (name: string) => Promise<WorkoutCategory>;
  coachId?: string;
  onCategoriesChange?: () => void;
  hideMetadata?: boolean; // Hide title, description, category, workout type inputs
}

const INTENSITY_COLORS: Record<string, string> = {
  warmUp: 'green',
  active: 'red',
  rest: 'blue',
  coolDown: 'purple',
};

const INTENSITY_ICONS: Record<string, React.ElementType> = {
  warmUp: Play,
  active: Repeat,
  rest: Pause,
  coolDown: Snowflake,
};

const generateId = () => `step-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const createDefaultStep = (type: BuilderStep['intensityClass'] = 'active'): BuilderStep => ({
  id: generateId(),
  type: 'step',
  name: '',
  intensityClass: type,
  durationValue: type === 'warmUp' || type === 'coolDown' ? 10 : 5,
  durationUnit: 'minute',
  targetMin: type === 'rest' ? 40 : type === 'warmUp' || type === 'coolDown' ? 55 : 80,
  targetMax: type === 'rest' ? 50 : type === 'warmUp' || type === 'coolDown' ? 75 : 95,
});

export function WorkoutBuilder({ initialWorkout, onSave, onCancel, onChange, categories = [], isSaving = false, onCreateCategory, coachId, onCategoriesChange, hideMetadata = false }: WorkoutBuilderProps) {
  const { t } = useTranslation();
  const toast = useToast();
  const { isOpen: isCategoryModalOpen, onOpen: openCategoryModal, onClose: closeCategoryModal } = useDisclosure();
  const { isOpen: isCategoryManageModalOpen, onOpen: openCategoryManageModal, onClose: closeCategoryManageModal } = useDisclosure();

  // Workout metadata
  const [title, setTitle] = useState(initialWorkout?.title || '');
  const [description, setDescription] = useState(initialWorkout?.description || '');
  const [categoryId, setCategoryId] = useState(
    initialWorkout?.categoryId || categories[0]?.id || ''
  );
  const [workoutType, setWorkoutType] = useState<WorkoutType>(
    initialWorkout?.attributes?.workoutType || 'outdoorCycling'
  );

  // Category modal state
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);

  // Convert structure item to BuilderStep
  const convertStructureToSteps = useCallback((structure: { structure: any[] }): BuilderStep[] => {
    if (!structure?.structure?.length) {
      return [createDefaultStep('warmUp'), createDefaultStep('active'), createDefaultStep('coolDown')];
    }

    return structure.structure.map((item: any) => {
      // Each item has a type and steps array with a single step inside
      const step = item.steps?.[0];
      if (!step) return createDefaultStep('active');

      const durationValue = step.length?.value || 5;
      const durationUnit = step.length?.unit || 'minute';
      const target = step.targets?.[0] || { minValue: 50, maxValue: 75 };

      return {
        id: generateId(),
        type: 'step' as const,
        name: step.name || '',
        intensityClass: step.intensityClass || 'active',
        durationValue,
        durationUnit,
        targetMin: target.minValue || 50,
        targetMax: target.maxValue || 75,
        // Extract cadence and HR if present
        cadenceMin: target.cadenceMin,
        cadenceMax: target.cadenceMax,
        hrMin: target.hrMin,
        hrMax: target.hrMax,
        hrType: target.hrType,
        openDuration: step.openDuration || false,
      };
    });
  }, []);

  // Steps
  const [steps, setSteps] = useState<BuilderStep[]>(() => {
    if (initialWorkout?.attributes?.structure) {
      return convertStructureToSteps(initialWorkout.attributes.structure);
    }
    return [createDefaultStep('warmUp'), createDefaultStep('active'), createDefaultStep('coolDown')];
  });

  // Track if we've loaded from initialWorkout to prevent re-loading from onChange feedback
  const [hasInitialized, setHasInitialized] = useState(false);

  // Update state when initialWorkout changes (e.g., after API fetch)
  // Only run once when we get real data (with a valid title), then never again
  useEffect(() => {
    if (initialWorkout && initialWorkout.title && !hasInitialized) {
      setTitle(initialWorkout.title || '');
      setDescription(initialWorkout.description || '');
      if (initialWorkout.categoryId) {
        setCategoryId(initialWorkout.categoryId);
      }
      if (initialWorkout.attributes?.workoutType) {
        setWorkoutType(initialWorkout.attributes.workoutType);
      }
      if (initialWorkout.attributes?.structure) {
        const convertedSteps = convertStructureToSteps(initialWorkout.attributes.structure);
        setSteps(convertedSteps);
      }
      setHasInitialized(true);
    }
  }, [initialWorkout, hasInitialized, convertStructureToSteps]);

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const headerBg = useColorModeValue('gray.50', 'gray.900');
  const stepBg = useColorModeValue('gray.50', 'gray.700');
  const menuBg = useColorModeValue('white', 'gray.800');
  const menuHoverBg = useColorModeValue('gray.100', 'gray.700');
  const isMobile = useBreakpointValue({ base: true, md: false });

  // Calculate totals
  const totals = useMemo(() => {
    let totalSeconds = 0;
    let weightedTSS = 0;

    const calculateStep = (step: BuilderStep, multiplier = 1) => {
      if (step.type === 'repetition' && step.nestedSteps) {
        step.nestedSteps.forEach((nested) =>
          calculateStep(nested, multiplier * (step.repeatCount || 1))
        );
      } else {
        const seconds =
          step.durationUnit === 'minute'
            ? step.durationValue * 60
            : step.durationValue;
        totalSeconds += seconds * multiplier;
        // Simplified TSS calculation: (duration in hours) * IF^2 * 100
        const avgIntensity = (step.targetMin + step.targetMax) / 2 / 100;
        weightedTSS += (seconds / 3600) * avgIntensity * avgIntensity * 100 * multiplier;
      }
    };

    steps.forEach((step) => calculateStep(step));

    return {
      duration: totalSeconds,
      tss: Math.round(weightedTSS),
      if: totalSeconds > 0 ? Math.sqrt(weightedTSS / (totalSeconds / 3600) / 100) : 0,
    };
  }, [steps]);

  const handleAddStep = useCallback((type: BuilderStep['intensityClass']) => {
    setSteps((prev) => [...prev, createDefaultStep(type)]);
  }, []);

  const handleAddRepetition = useCallback(() => {
    const repStep: BuilderStep = {
      id: generateId(),
      type: 'repetition',
      name: '',
      intensityClass: 'active',
      durationValue: 0,
      durationUnit: 'minute',
      targetMin: 0,
      targetMax: 0,
      repeatCount: 3,
      nestedSteps: [createDefaultStep('active'), createDefaultStep('rest')],
    };
    setSteps((prev) => [...prev, repStep]);
  }, []);

  const handleUpdateStep = useCallback((id: string, updates: Partial<BuilderStep>) => {
    setSteps((prev) =>
      prev.map((step) => (step.id === id ? { ...step, ...updates } : step))
    );
  }, []);

  const handleDeleteStep = useCallback((id: string) => {
    setSteps((prev) => prev.filter((step) => step.id !== id));
  }, []);

  const handleDuplicateStep = useCallback((step: BuilderStep) => {
    const duplicate: BuilderStep = {
      ...step,
      id: generateId(),
      nestedSteps: step.nestedSteps?.map((nested) => ({
        ...nested,
        id: generateId(),
      })),
    };
    setSteps((prev) => {
      const idx = prev.findIndex((s) => s.id === step.id);
      return [...prev.slice(0, idx + 1), duplicate, ...prev.slice(idx + 1)];
    });
  }, []);

  // Drag and drop state
  const draggedStepId = useRef<string | null>(null);
  const [dragOverStepId, setDragOverStepId] = useState<string | null>(null);

  const handleDragStart = useCallback((stepId: string) => {
    draggedStepId.current = stepId;
  }, []);

  const handleDragOver = useCallback((stepId: string) => {
    if (draggedStepId.current && draggedStepId.current !== stepId) {
      setDragOverStepId(stepId);
    }
  }, []);

  const handleDragEnd = useCallback(() => {
    if (draggedStepId.current && dragOverStepId) {
      setSteps((prev) => {
        const draggedIndex = prev.findIndex((s) => s.id === draggedStepId.current);
        const targetIndex = prev.findIndex((s) => s.id === dragOverStepId);
        if (draggedIndex === -1 || targetIndex === -1) return prev;

        const newSteps = [...prev];
        const [draggedItem] = newSteps.splice(draggedIndex, 1);
        newSteps.splice(targetIndex, 0, draggedItem);
        return newSteps;
      });
    }
    draggedStepId.current = null;
    setDragOverStepId(null);
  }, [dragOverStepId]);

  const handleUpdateNestedStep = useCallback(
    (parentId: string, nestedId: string, updates: Partial<BuilderStep>) => {
      setSteps((prev) =>
        prev.map((step) => {
          if (step.id === parentId && step.nestedSteps) {
            return {
              ...step,
              nestedSteps: step.nestedSteps.map((nested) =>
                nested.id === nestedId ? { ...nested, ...updates } : nested
              ),
            };
          }
          return step;
        })
      );
    },
    []
  );

  const handleAddNestedStep = useCallback((parentId: string) => {
    setSteps((prev) =>
      prev.map((step) => {
        if (step.id === parentId) {
          return {
            ...step,
            nestedSteps: [...(step.nestedSteps || []), createDefaultStep('active')],
          };
        }
        return step;
      })
    );
  }, []);

  const handleDeleteNestedStep = useCallback((parentId: string, nestedId: string) => {
    setSteps((prev) =>
      prev.map((step) => {
        if (step.id === parentId && step.nestedSteps) {
          return {
            ...step,
            nestedSteps: step.nestedSteps.filter((nested) => nested.id !== nestedId),
          };
        }
        return step;
      })
    );
  }, []);

  const convertToWorkout = useCallback((): Workout => {
    const convertStep = (step: BuilderStep): WorkoutStepData => ({
      type: 'step',
      name: step.name || undefined,
      length: {
        value: step.durationUnit === 'minute' ? step.durationValue : step.durationValue,
        unit: step.durationUnit,
      },
      targets: [{
        minValue: step.targetMin,
        maxValue: step.targetMax,
        ...(step.cadenceMin !== undefined && { cadenceMin: step.cadenceMin }),
        ...(step.cadenceMax !== undefined && { cadenceMax: step.cadenceMax }),
        ...(step.hrMin !== undefined && { hrMin: step.hrMin }),
        ...(step.hrMax !== undefined && { hrMax: step.hrMax }),
        ...(step.hrType !== undefined && { hrType: step.hrType }),
      }],
      intensityClass: step.intensityClass,
      openDuration: false,
    });

    const structure: WorkoutStructure = {
      structure: steps.map((step) => {
        if (step.type === 'repetition') {
          return {
            type: 'repetition' as const,
            length: { value: step.repeatCount || 1, unit: 'repetition' as const },
            steps: step.nestedSteps?.map(convertStep) || [],
          };
        }
        return {
          type: 'step' as const,
          length: { value: 1, unit: 'repetition' as const },
          steps: [convertStep(step)],
        };
      }),
    };

    const selectedCategory = categories.find(c => c.id === categoryId);

    return {
      id: initialWorkout?.id || Date.now(),
      title,
      description,
      categoryId,
      attributes: {
        structure,
        tssPlanned: totals.tss,
        ifPlanned: totals.if,
        totalTimePlanned: totals.duration / 3600,
        workoutTypeName: selectedCategory?.name || 'Workout',
        workoutType,
      },
    };
  }, [steps, title, description, categoryId, categories, totals, initialWorkout, workoutType]);

  // Notify parent of workout changes for real-time preview
  useEffect(() => {
    if (onChange) {
      const workout = convertToWorkout();
      onChange(workout);
    }
  }, [convertToWorkout, onChange]);

  const handleSave = useCallback(() => {
    if (isSaving) return;

    if (!title.trim()) {
      toast({
        title: t('builder.titleRequired'),
        status: 'error',
        duration: 2000,
      });
      return;
    }

    const workout = convertToWorkout();
    onSave?.(workout);
    // Note: Success/error toasts are handled by parent component (WorkoutBuilderPage)
  }, [convertToWorkout, onSave, title, toast, t, isSaving]);

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
        <Heading size="sm">{t('builder.title')}</Heading>
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
      <Box flex={1} overflowY="auto" p={4}>
        <VStack spacing={6} align="stretch">
          {/* Workout Info */}
          {!hideMetadata && (
            <>
              <VStack spacing={3} align="stretch">
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

                <FormControl>
                  <FormLabel fontSize="sm">{t('builder.description')}</FormLabel>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={t('builder.descriptionPlaceholder')}
                    rows={2}
                  />
                </FormControl>
              </VStack>

              <Divider />
            </>
          )}

          {/* Steps */}
          <Box>
            <Flex justify="space-between" align="center" mb={3}>
              <Text fontWeight="semibold">{t('builder.structure')}</Text>
              <Menu>
                <MenuButton as={Button} size="sm" leftIcon={<Plus size={14} />} rightIcon={<ChevronDown size={14} />}>
                  {t('builder.addStep')}
                </MenuButton>
                <MenuList>
                  <MenuItem icon={<Play size={14} />} onClick={() => handleAddStep('warmUp')}>
                    {t('builder.stepTypes.warmUp')}
                  </MenuItem>
                  <MenuItem icon={<Repeat size={14} />} onClick={() => handleAddStep('active')}>
                    {t('builder.stepTypes.active')}
                  </MenuItem>
                  <MenuItem icon={<Pause size={14} />} onClick={() => handleAddStep('rest')}>
                    {t('builder.stepTypes.rest')}
                  </MenuItem>
                  <MenuItem icon={<Snowflake size={14} />} onClick={() => handleAddStep('coolDown')}>
                    {t('builder.stepTypes.coolDown')}
                  </MenuItem>
                  <Divider />
                  <MenuItem icon={<Repeat size={14} />} onClick={handleAddRepetition}>
                    {t('builder.stepTypes.repetition')}
                  </MenuItem>
                </MenuList>
              </Menu>
            </Flex>

            <VStack spacing={2} align="stretch">
              {steps.map((step) => (
                <StepEditor
                  key={step.id}
                  step={step}
                  bgColor={stepBg}
                  borderColor={borderColor}
                  onUpdate={(updates) => handleUpdateStep(step.id, updates)}
                  onDelete={() => handleDeleteStep(step.id)}
                  onDuplicate={() => handleDuplicateStep(step)}
                  onUpdateNested={(nestedId, updates) =>
                    handleUpdateNestedStep(step.id, nestedId, updates)
                  }
                  onAddNested={() => handleAddNestedStep(step.id)}
                  onDeleteNested={(nestedId) => handleDeleteNestedStep(step.id, nestedId)}
                  onDragStart={() => handleDragStart(step.id)}
                  onDragOver={() => handleDragOver(step.id)}
                  onDragEnd={handleDragEnd}
                  isDragOver={dragOverStepId === step.id}
                  isMobile={isMobile}
                  t={t}
                />
              ))}
            </VStack>
          </Box>
        </VStack>
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
          onCategoriesChange={onCategoriesChange}
        />
      )}
    </Box>
  );
}

interface StepEditorProps {
  step: BuilderStep;
  bgColor: string;
  borderColor: string;
  onUpdate: (updates: Partial<BuilderStep>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onUpdateNested: (nestedId: string, updates: Partial<BuilderStep>) => void;
  onAddNested: () => void;
  onDeleteNested: (nestedId: string) => void;
  onDragStart: () => void;
  onDragOver: () => void;
  onDragEnd: () => void;
  isDragOver: boolean;
  isMobile?: boolean;
  t: (key: string) => string;
}

function StepEditor({
  step,
  bgColor,
  borderColor,
  onUpdate,
  onDelete,
  onDuplicate,
  onUpdateNested,
  onAddNested,
  onDeleteNested,
  onDragStart,
  onDragOver,
  onDragEnd,
  isDragOver,
  isMobile,
  t,
}: StepEditorProps) {
  const IntensityIcon = INTENSITY_ICONS[step.intensityClass];
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', step.id);
    onDragStart();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    onDragOver();
  };

  const handleDragEnd = () => {
    onDragEnd();
  };

  if (step.type === 'repetition') {

    return (
      <Box
        bg={bgColor}
        borderWidth={isDragOver ? '2px' : '1px'}
        borderColor={isDragOver ? 'brand.500' : borderColor}
        borderRadius="md"
        p={3}
        onDragOver={handleDragOver}
        opacity={isDragOver ? 0.7 : 1}
        transition="all 0.15s"
        position="relative"
      >
        {/* Left bracket/border visual indicator */}
        <Box
          position="absolute"
          left={2}
          top={12}
          bottom={12}
          width="3px"
          bg="purple.400"
          borderRadius="full"
          opacity={0.6}
        />

        <Flex justify="space-between" align="center" mb={3}>
          <HStack>
            <Box
              cursor="grab"
              _active={{ cursor: 'grabbing' }}
              draggable
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <GripVertical size={14} />
            </Box>
            <IconButton
              aria-label={isCollapsed ? "Expand" : "Collapse"}
              icon={isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
              size="xs"
              variant="ghost"
              onClick={() => setIsCollapsed(!isCollapsed)}
            />
            <Badge colorScheme="purple">
              <HStack spacing={1}>
                <Repeat size={12} />
                <Text>{t('builder.repeat')}</Text>
              </HStack>
            </Badge>
            <NumberInput
              size="xs"
              value={step.repeatCount}
              min={1}
              max={20}
              w="60px"
              onChange={(_, val) => onUpdate({ repeatCount: val })}
            >
              <NumberInputField />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
            <Text fontSize="xs" color="gray.500">
              {t('builder.times')}
            </Text>
          </HStack>

          <HStack spacing={1}>
            <IconButton
              aria-label={t('common.duplicate')}
              icon={<Copy size={14} />}
              size="xs"
              variant="ghost"
              onClick={onDuplicate}
            />
            <IconButton
              aria-label={t('common.delete')}
              icon={<Trash2 size={14} />}
              size="xs"
              variant="ghost"
              colorScheme="red"
              onClick={onDelete}
            />
          </HStack>
        </Flex>

        {!isCollapsed && (
          <VStack spacing={2} align="stretch" pl={6}>
            {step.nestedSteps?.map((nested) => (
              <NestedStepEditor
                key={nested.id}
                step={nested}
                borderColor={borderColor}
                onUpdate={(updates) => onUpdateNested(nested.id, updates)}
                onDelete={() => onDeleteNested(nested.id)}
                t={t}
              />
            ))}
            <Button
              size="xs"
              variant="ghost"
              leftIcon={<Plus size={12} />}
              onClick={onAddNested}
            >
              {t('builder.addIntervalStep')}
            </Button>
          </VStack>
        )}

        {isCollapsed && (
          <Text fontSize="xs" color="gray.500" pl={6}>
            {step.nestedSteps?.length || 0} step(s) • Click to expand
          </Text>
        )}
      </Box>
    );
  }

  // Mobile layout - stacked
  if (isMobile) {
    return (
      <Box
        bg={bgColor}
        borderWidth={isDragOver ? '2px' : '1px'}
        borderColor={isDragOver ? 'brand.500' : borderColor}
        borderRadius="md"
        p={3}
        onDragOver={handleDragOver}
        opacity={isDragOver ? 0.7 : 1}
        transition="all 0.15s"
      >
        <VStack spacing={2} align="stretch">
          {/* Top row: Drag handle, Type badge, Actions */}
          <Flex justify="space-between" align="center">
            <HStack spacing={2}>
              <Box
                cursor="grab"
                _active={{ cursor: 'grabbing' }}
                draggable
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <GripVertical size={14} />
              </Box>
              <Badge
                colorScheme={INTENSITY_COLORS[step.intensityClass]}
                textAlign="center"
                py={1}
              >
                <HStack spacing={1} justify="center">
                  <IntensityIcon size={12} />
                  <Text fontSize="xs">{t(`builder.stepTypes.${step.intensityClass}`)}</Text>
                </HStack>
              </Badge>
            </HStack>
            <HStack spacing={1}>
              <IconButton
                aria-label={t('common.duplicate')}
                icon={<Copy size={14} />}
                size="xs"
                variant="ghost"
                onClick={onDuplicate}
              />
              <IconButton
                aria-label={t('common.delete')}
                icon={<Trash2 size={14} />}
                size="xs"
                variant="ghost"
                colorScheme="red"
                onClick={onDelete}
              />
            </HStack>
          </Flex>

          {/* Name input */}
          <Input
            size="sm"
            placeholder={t('builder.stepName')}
            value={step.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
          />

          {/* Duration and Target row */}
          <Flex gap={2} wrap="wrap">
            {/* Duration */}
            <HStack spacing={1} flex="1" minW="140px">
              <NumberInput
                size="sm"
                value={step.durationValue}
                min={1}
                max={999}
                w="65px"
                onChange={(_, val) => onUpdate({ durationValue: val })}
              >
                <NumberInputField />
              </NumberInput>
              <Select
                size="sm"
                value={step.durationUnit}
                w="75px"
                onChange={(e) => onUpdate({ durationUnit: e.target.value as 'minute' | 'second' })}
              >
                <option value="minute">{t('builder.units.min')}</option>
                <option value="second">{t('builder.units.sec')}</option>
              </Select>
            </HStack>

            {/* Target FTP range */}
            <HStack spacing={1} flex="1" minW="160px">
              <Input
                size="sm"
                type="number"
                defaultValue={step.targetMin}
                min={0}
                max={200}
                w="55px"
                textAlign="center"
                onBlur={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (!isNaN(val) && val !== step.targetMin) {
                    onUpdate({ targetMin: Math.max(0, Math.min(200, val)) });
                  }
                }}
              />
              <Text fontSize="xs">-</Text>
              <Input
                size="sm"
                type="number"
                defaultValue={step.targetMax}
                min={0}
                max={200}
                w="55px"
                textAlign="center"
                onBlur={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (!isNaN(val) && val !== step.targetMax) {
                    onUpdate({ targetMax: Math.max(0, Math.min(200, val)) });
                  }
                }}
              />
              <Text fontSize="xs" color="gray.500" whiteSpace="nowrap">
                % FTP
              </Text>
            </HStack>

            {/* Optional Cadence range */}
            <HStack spacing={1} flex="1" minW="160px" opacity={step.cadenceMin || step.cadenceMax ? 1 : 0.5}>
              <Input
                size="sm"
                type="number"
                placeholder="Min"
                value={step.cadenceMin || ''}
                min={30}
                max={200}
                w="55px"
                textAlign="center"
                onChange={(e) => {
                  const val = e.target.value ? parseInt(e.target.value, 10) : undefined;
                  if (val === undefined || (!isNaN(val) && val >= 30 && val <= 200)) {
                    onUpdate({ cadenceMin: val });
                  }
                }}
              />
              <Text fontSize="xs">-</Text>
              <Input
                size="sm"
                type="number"
                placeholder="Max"
                value={step.cadenceMax || ''}
                min={30}
                max={200}
                w="55px"
                textAlign="center"
                onChange={(e) => {
                  const val = e.target.value ? parseInt(e.target.value, 10) : undefined;
                  if (val === undefined || (!isNaN(val) && val >= 30 && val <= 200)) {
                    onUpdate({ cadenceMax: val });
                  }
                }}
              />
              <Text fontSize="xs" color="gray.500" whiteSpace="nowrap">
                RPM
              </Text>
            </HStack>

            {/* Optional HR range */}
            <HStack spacing={1} flex="1" minW="160px" opacity={step.hrMin || step.hrMax ? 1 : 0.5}>
              <Input
                size="sm"
                type="number"
                placeholder="Min"
                value={step.hrMin || ''}
                min={step.hrType === 'percent' ? 50 : 50}
                max={step.hrType === 'percent' ? 100 : 220}
                w="55px"
                textAlign="center"
                onChange={(e) => {
                  const val = e.target.value ? parseInt(e.target.value, 10) : undefined;
                  const max = step.hrType === 'percent' ? 100 : 220;
                  if (val === undefined || (!isNaN(val) && val >= 50 && val <= max)) {
                    onUpdate({ hrMin: val });
                  }
                }}
              />
              <Text fontSize="xs">-</Text>
              <Input
                size="sm"
                type="number"
                placeholder="Max"
                value={step.hrMax || ''}
                min={step.hrType === 'percent' ? 50 : 50}
                max={step.hrType === 'percent' ? 100 : 220}
                w="55px"
                textAlign="center"
                onChange={(e) => {
                  const val = e.target.value ? parseInt(e.target.value, 10) : undefined;
                  const max = step.hrType === 'percent' ? 100 : 220;
                  if (val === undefined || (!isNaN(val) && val >= 50 && val <= max)) {
                    onUpdate({ hrMax: val });
                  }
                }}
              />
              <Select
                size="sm"
                value={step.hrType || 'bpm'}
                w="60px"
                onChange={(e) => onUpdate({ hrType: e.target.value as 'bpm' | 'percent' })}
              >
                <option value="bpm">BPM</option>
                <option value="percent">%</option>
              </Select>
            </HStack>
          </Flex>
        </VStack>
      </Box>
    );
  }

  // Desktop layout - grid
  return (
    <Box
      bg={bgColor}
      borderWidth={isDragOver ? '2px' : '1px'}
      borderColor={isDragOver ? 'brand.500' : borderColor}
      borderRadius="md"
      p={3}
      onDragOver={handleDragOver}
      opacity={isDragOver ? 0.7 : 1}
      transition="all 0.15s"
    >
      {/* Grid layout for consistent alignment */}
      <Box
        display="grid"
        gridTemplateColumns="20px 130px 180px 160px 210px 210px 210px auto"
        gap={3}
        alignItems="center"
      >
        {/* Drag handle */}
        <Box
          cursor="grab"
          _active={{ cursor: 'grabbing' }}
          draggable
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <GripVertical size={14} />
        </Box>

        {/* Type badge - fixed width */}
        <Badge
          colorScheme={INTENSITY_COLORS[step.intensityClass]}
          textAlign="center"
          py={1}
        >
          <HStack spacing={1} justify="center">
            <IntensityIcon size={12} />
            <Text fontSize="xs">{t(`builder.stepTypes.${step.intensityClass}`)}</Text>
          </HStack>
        </Badge>

        {/* Name input - flexible */}
        <Input
          size="sm"
          placeholder={t('builder.stepName')}
          value={step.name}
          maxW="200px"
          onChange={(e) => onUpdate({ name: e.target.value })}
        />

        {/* Duration inputs */}
        <HStack spacing={1}>
          <NumberInput
            size="sm"
            value={step.durationValue}
            min={1}
            max={999}
            w="70px"
            onChange={(_, val) => onUpdate({ durationValue: val })}
          >
            <NumberInputField />
          </NumberInput>
          <Select
            size="sm"
            value={step.durationUnit}
            w="80px"
            onChange={(e) => onUpdate({ durationUnit: e.target.value as 'minute' | 'second' })}
          >
            <option value="minute">{t('builder.units.min')}</option>
            <option value="second">{t('builder.units.sec')}</option>
          </Select>
        </HStack>

        {/* Target FTP range */}
        <HStack spacing={1}>
          <Input
            size="sm"
            type="number"
            defaultValue={step.targetMin}
            min={0}
            max={200}
            w="65px"
            textAlign="center"
            onBlur={(e) => {
              const val = parseInt(e.target.value, 10);
              if (!isNaN(val) && val !== step.targetMin) {
                onUpdate({ targetMin: Math.max(0, Math.min(200, val)) });
              }
            }}
          />
          <Text fontSize="xs">-</Text>
          <Input
            size="sm"
            type="number"
            defaultValue={step.targetMax}
            min={0}
            max={200}
            w="65px"
            textAlign="center"
            onBlur={(e) => {
              const val = parseInt(e.target.value, 10);
              if (!isNaN(val) && val !== step.targetMax) {
                onUpdate({ targetMax: Math.max(0, Math.min(200, val)) });
              }
            }}
          />
          <Text fontSize="xs" color="gray.500" whiteSpace="nowrap">
            % FTP
          </Text>
        </HStack>

        {/* Optional Cadence range */}
        <HStack spacing={1} opacity={step.cadenceMin || step.cadenceMax ? 1 : 0.5}>
          <Input
            size="sm"
            type="number"
            placeholder="Min"
            value={step.cadenceMin || ''}
            min={30}
            max={200}
            w="65px"
            textAlign="center"
            onChange={(e) => {
              const val = e.target.value ? parseInt(e.target.value, 10) : undefined;
              if (val === undefined || (!isNaN(val) && val >= 30 && val <= 200)) {
                onUpdate({ cadenceMin: val });
              }
            }}
          />
          <Text fontSize="xs">-</Text>
          <Input
            size="sm"
            type="number"
            placeholder="Max"
            value={step.cadenceMax || ''}
            min={30}
            max={200}
            w="65px"
            textAlign="center"
            onChange={(e) => {
              const val = e.target.value ? parseInt(e.target.value, 10) : undefined;
              if (val === undefined || (!isNaN(val) && val >= 30 && val <= 200)) {
                onUpdate({ cadenceMax: val });
              }
            }}
          />
          <Text fontSize="xs" color="gray.500" whiteSpace="nowrap">
            RPM
          </Text>
        </HStack>

        {/* Optional HR range */}
        <HStack spacing={1} opacity={step.hrMin || step.hrMax ? 1 : 0.5}>
          <Input
            size="sm"
            type="number"
            placeholder="Min"
            value={step.hrMin || ''}
            min={step.hrType === 'percent' ? 50 : 50}
            max={step.hrType === 'percent' ? 100 : 220}
            w="65px"
            textAlign="center"
            onChange={(e) => {
              const val = e.target.value ? parseInt(e.target.value, 10) : undefined;
              const max = step.hrType === 'percent' ? 100 : 220;
              if (val === undefined || (!isNaN(val) && val >= 50 && val <= max)) {
                onUpdate({ hrMin: val });
              }
            }}
          />
          <Text fontSize="xs">-</Text>
          <Input
            size="sm"
            type="number"
            placeholder="Max"
            value={step.hrMax || ''}
            min={step.hrType === 'percent' ? 50 : 50}
            max={step.hrType === 'percent' ? 100 : 220}
            w="65px"
            textAlign="center"
            onChange={(e) => {
              const val = e.target.value ? parseInt(e.target.value, 10) : undefined;
              const max = step.hrType === 'percent' ? 100 : 220;
              if (val === undefined || (!isNaN(val) && val >= 50 && val <= max)) {
                onUpdate({ hrMax: val });
              }
            }}
          />
          <Select
            size="sm"
            value={step.hrType || 'bpm'}
            w="65px"
            onChange={(e) => onUpdate({ hrType: e.target.value as 'bpm' | 'percent' })}
          >
            <option value="bpm">BPM</option>
            <option value="percent">%</option>
          </Select>
        </HStack>

        {/* Action buttons */}
        <HStack spacing={1} justify="flex-end">
          <IconButton
            aria-label={t('common.duplicate')}
            icon={<Copy size={14} />}
            size="xs"
            variant="ghost"
            onClick={onDuplicate}
          />
          <IconButton
            aria-label={t('common.delete')}
            icon={<Trash2 size={14} />}
            size="xs"
            variant="ghost"
            colorScheme="red"
            onClick={onDelete}
          />
        </HStack>
      </Box>
    </Box>
  );
}

interface NestedStepEditorProps {
  step: BuilderStep;
  borderColor: string;
  onUpdate: (updates: Partial<BuilderStep>) => void;
  onDelete: () => void;
  t: (key: string) => string;
}

function NestedStepEditor({ step, borderColor, onUpdate, onDelete, t }: NestedStepEditorProps) {

  return (
    <Flex
      gap={2}
      align="center"
      bg="transparent"
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="md"
      p={2}
      wrap="wrap"
    >
      <Select
        size="xs"
        value={step.intensityClass}
        w="90px"
        onChange={(e) =>
          onUpdate({ intensityClass: e.target.value as BuilderStep['intensityClass'] })
        }
      >
        <option value="active">{t('builder.stepTypes.active')}</option>
        <option value="rest">{t('builder.stepTypes.rest')}</option>
      </Select>

      <HStack spacing={1}>
        <NumberInput
          size="xs"
          value={step.durationValue}
          min={1}
          max={999}
          w="55px"
          onChange={(_, val) => onUpdate({ durationValue: val })}
        >
          <NumberInputField />
        </NumberInput>
        <Select
          size="xs"
          value={step.durationUnit}
          w="70px"
          onChange={(e) => onUpdate({ durationUnit: e.target.value as 'minute' | 'second' })}
        >
          <option value="minute">{t('builder.units.min')}</option>
          <option value="second">{t('builder.units.sec')}</option>
        </Select>
      </HStack>

      <HStack spacing={1}>
        <Input
          size="xs"
          type="number"
          defaultValue={step.targetMin}
          min={0}
          max={200}
          w="55px"
          textAlign="center"
          onBlur={(e) => {
            const val = parseInt(e.target.value, 10);
            if (!isNaN(val) && val !== step.targetMin) {
              onUpdate({ targetMin: Math.max(0, Math.min(200, val)) });
            }
          }}
        />
        <Text fontSize="xs">-</Text>
        <Input
          size="xs"
          type="number"
          defaultValue={step.targetMax}
          min={0}
          max={200}
          w="55px"
          textAlign="center"
          onBlur={(e) => {
            const val = parseInt(e.target.value, 10);
            if (!isNaN(val) && val !== step.targetMax) {
              onUpdate({ targetMax: Math.max(0, Math.min(200, val)) });
            }
          }}
        />
        <Text fontSize="2xs" color="gray.500">
          %
        </Text>
      </HStack>

      {/* Optional Cadence range (compact) */}
      {(step.cadenceMin || step.cadenceMax) && (
        <HStack spacing={1}>
          <Input
            size="xs"
            type="number"
            placeholder="Min"
            value={step.cadenceMin || ''}
            min={30}
            max={200}
            w="45px"
            textAlign="center"
            onChange={(e) => {
              const val = e.target.value ? parseInt(e.target.value, 10) : undefined;
              if (val === undefined || (!isNaN(val) && val >= 30 && val <= 200)) {
                onUpdate({ cadenceMin: val });
              }
            }}
          />
          <Text fontSize="xs">-</Text>
          <Input
            size="xs"
            type="number"
            placeholder="Max"
            value={step.cadenceMax || ''}
            min={30}
            max={200}
            w="45px"
            textAlign="center"
            onChange={(e) => {
              const val = e.target.value ? parseInt(e.target.value, 10) : undefined;
              if (val === undefined || (!isNaN(val) && val >= 30 && val <= 200)) {
                onUpdate({ cadenceMax: val });
              }
            }}
          />
          <Text fontSize="2xs" color="gray.500">
            RPM
          </Text>
        </HStack>
      )}

      {/* Optional HR range (compact) */}
      {(step.hrMin || step.hrMax) && (
        <HStack spacing={1}>
          <Input
            size="xs"
            type="number"
            placeholder="Min"
            value={step.hrMin || ''}
            min={step.hrType === 'percent' ? 50 : 50}
            max={step.hrType === 'percent' ? 100 : 220}
            w="45px"
            textAlign="center"
            onChange={(e) => {
              const val = e.target.value ? parseInt(e.target.value, 10) : undefined;
              const max = step.hrType === 'percent' ? 100 : 220;
              if (val === undefined || (!isNaN(val) && val >= 50 && val <= max)) {
                onUpdate({ hrMin: val });
              }
            }}
          />
          <Text fontSize="xs">-</Text>
          <Input
            size="xs"
            type="number"
            placeholder="Max"
            value={step.hrMax || ''}
            min={step.hrType === 'percent' ? 50 : 50}
            max={step.hrType === 'percent' ? 100 : 220}
            w="45px"
            textAlign="center"
            onChange={(e) => {
              const val = e.target.value ? parseInt(e.target.value, 10) : undefined;
              const max = step.hrType === 'percent' ? 100 : 220;
              if (val === undefined || (!isNaN(val) && val >= 50 && val <= max)) {
                onUpdate({ hrMax: val });
              }
            }}
          />
          <Select
            size="xs"
            value={step.hrType || 'bpm'}
            w="55px"
            onChange={(e) => onUpdate({ hrType: e.target.value as 'bpm' | 'percent' })}
          >
            <option value="bpm">BPM</option>
            <option value="percent">%</option>
          </Select>
        </HStack>
      )}

      <IconButton
        aria-label={t('common.delete')}
        icon={<Trash2 size={12} />}
        size="xs"
        variant="ghost"
        colorScheme="red"
        onClick={onDelete}
        ml="auto"
      />
    </Flex>
  );
}
