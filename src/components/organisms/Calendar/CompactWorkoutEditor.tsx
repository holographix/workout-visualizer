import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Select,
  Badge,
  SimpleGrid,
  Divider,
  useColorModeValue,
  Icon,
  IconButton,
  Button,
  Tooltip,
  Switch,
  FormControl,
  FormLabel,
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { Activity, Clock, Zap, Trash2, Plus, Edit3 } from 'lucide-react';
import type { WorkoutStructure } from '../../../types/workout';

interface CompactWorkoutEditorProps {
  structure: WorkoutStructure;
  onChange: (structure: WorkoutStructure) => void;
}

interface Step {
  id: number;
  name: string;
  intensityClass: string;
  durationValue: number;
  durationUnit: string;
  targetMin: number;
  targetMax: number;
  cadenceMin?: number;
  cadenceMax?: number;
  hrMin?: number;
  hrMax?: number;
  hrType?: 'bpm' | 'percent';
}

const INTENSITY_CONFIG = {
  warmUp: { color: 'green', label: 'Warm Up' },
  active: { color: 'red', label: 'Active' },
  rest: { color: 'blue', label: 'Rest' },
  coolDown: { color: 'purple', label: 'Cool Down' },
};

export function CompactWorkoutEditor({ structure, onChange }: CompactWorkoutEditorProps) {
  const { t } = useTranslation();
  const bgColor = useColorModeValue('gray.50', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const [isFullEditMode, setIsFullEditMode] = useState(false);

  // Parse structure into editable steps
  const [steps, setSteps] = useState<Step[]>(() => {
    if (!structure?.structure?.length) {
      // Return default structure if empty
      return [
        {
          id: 0,
          name: '',
          intensityClass: 'warmUp',
          durationValue: 10,
          durationUnit: 'minute',
          targetMin: 55,
          targetMax: 75,
        },
        {
          id: 1,
          name: '',
          intensityClass: 'active',
          durationValue: 20,
          durationUnit: 'minute',
          targetMin: 80,
          targetMax: 95,
        },
        {
          id: 2,
          name: '',
          intensityClass: 'coolDown',
          durationValue: 10,
          durationUnit: 'minute',
          targetMin: 55,
          targetMax: 75,
        },
      ];
    }
    return structure.structure.map((item: any, index: number) => {
      const step = item.steps?.[0] || {};
      const target = step.targets?.[0] || {};
      return {
        id: index,
        name: step.name || '',
        intensityClass: step.intensityClass || 'active',
        durationValue: step.length?.value || 5,
        durationUnit: step.length?.unit || 'minute',
        targetMin: target.minValue || 50,
        targetMax: target.maxValue || 75,
        cadenceMin: target.cadenceMin,
        cadenceMax: target.cadenceMax,
        hrMin: target.hrMin,
        hrMax: target.hrMax,
        hrType: target.hrType,
      };
    });
  });

  // Update steps when structure changes
  useEffect(() => {
    console.log('🔧 CompactWorkoutEditor received structure:', {
      structure,
      hasStructure: !!structure?.structure,
      structureLength: structure?.structure?.length,
    });

    if (structure?.structure?.length) {
      const newSteps = structure.structure.map((item: any, index: number) => {
        const step = item.steps?.[0] || {};
        const target = step.targets?.[0] || {};
        return {
          id: index,
          name: step.name || '',
          intensityClass: step.intensityClass || 'active',
          durationValue: step.length?.value || 5,
          durationUnit: step.length?.unit || 'minute',
          targetMin: target.minValue || 50,
          targetMax: target.maxValue || 75,
          cadenceMin: target.cadenceMin,
          cadenceMax: target.cadenceMax,
          hrMin: target.hrMin,
          hrMax: target.hrMax,
          hrType: target.hrType,
        };
      });
      console.log('🔧 Parsed steps:', newSteps);
      setSteps(newSteps);
    }
  }, [structure]);

  // Calculate totals
  const stats = useMemo(() => {
    let totalSeconds = 0;
    let weightedTSS = 0;

    steps.forEach(step => {
      const seconds = step.durationUnit === 'minute'
        ? step.durationValue * 60
        : step.durationValue;
      totalSeconds += seconds;

      const avgIntensity = (step.targetMin + step.targetMax) / 2 / 100;
      weightedTSS += (seconds / 3600) * avgIntensity * avgIntensity * 100;
    });

    const avgIF = steps.length > 0
      ? Math.sqrt(weightedTSS / (totalSeconds / 3600) / 100)
      : 0;

    return {
      duration: totalSeconds,
      tss: Math.round(weightedTSS),
      if: avgIF.toFixed(2),
    };
  }, [steps]);

  // Convert steps to workout structure
  const stepsToStructure = useCallback((stepsArray: Step[]): WorkoutStructure => {
    return {
      structure: stepsArray.map(step => {
        const targets: any = {
          targetType: 'power',
          minValue: step.targetMin,
          maxValue: step.targetMax,
        };

        // Add optional fields if they exist
        if (step.cadenceMin !== undefined) targets.cadenceMin = step.cadenceMin;
        if (step.cadenceMax !== undefined) targets.cadenceMax = step.cadenceMax;
        if (step.hrMin !== undefined) targets.hrMin = step.hrMin;
        if (step.hrMax !== undefined) targets.hrMax = step.hrMax;
        if (step.hrType) targets.hrType = step.hrType;

        return {
          type: 'step',
          steps: [{
            name: step.name,
            intensityClass: step.intensityClass,
            length: {
              value: step.durationValue,
              unit: step.durationUnit,
            },
            targets: [targets],
          }],
        };
      }),
    };
  }, []);

  // Update step and notify parent
  const updateStep = useCallback((index: number, field: keyof Step, value: any) => {
    const newSteps = [...steps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setSteps(newSteps);
    onChange(stepsToStructure(newSteps));
  }, [steps, onChange, stepsToStructure]);

  // Remove step
  const removeStep = useCallback((index: number) => {
    const newSteps = steps.filter((_, i) => i !== index);
    setSteps(newSteps);
    onChange(stepsToStructure(newSteps));
  }, [steps, onChange, stepsToStructure]);

  // Add new step
  const addStep = useCallback(() => {
    const newStep: Step = {
      id: Date.now(),
      name: '',
      intensityClass: 'active',
      durationValue: 5,
      durationUnit: 'minute',
      targetMin: 80,
      targetMax: 95,
    };
    const newSteps = [...steps, newStep];
    setSteps(newSteps);
    onChange(stepsToStructure(newSteps));
  }, [steps, onChange, stepsToStructure]);

  return (
    <VStack spacing={4} align="stretch">
      {/* Stats Overview */}
      <SimpleGrid columns={3} spacing={3}>
        <Box
          p={3}
          bg={bgColor}
          borderRadius="md"
          borderWidth="1px"
          borderColor={borderColor}
        >
          <HStack spacing={2}>
            <Icon as={Clock} boxSize={4} color="blue.500" />
            <VStack align="start" spacing={0}>
              <Text fontSize="xs" color="gray.500">
                {t('builder.duration')}
              </Text>
              <Text fontSize="lg" fontWeight="bold">
                {Math.round(stats.duration / 60)} min
              </Text>
            </VStack>
          </HStack>
        </Box>

        <Box
          p={3}
          bg={bgColor}
          borderRadius="md"
          borderWidth="1px"
          borderColor={borderColor}
        >
          <HStack spacing={2}>
            <Icon as={Activity} boxSize={4} color="orange.500" />
            <VStack align="start" spacing={0}>
              <Text fontSize="xs" color="gray.500">
                TSS
              </Text>
              <Text fontSize="lg" fontWeight="bold">
                {stats.tss}
              </Text>
            </VStack>
          </HStack>
        </Box>

        <Box
          p={3}
          bg={bgColor}
          borderRadius="md"
          borderWidth="1px"
          borderColor={borderColor}
        >
          <HStack spacing={2}>
            <Icon as={Zap} boxSize={4} color="purple.500" />
            <VStack align="start" spacing={0}>
              <Text fontSize="xs" color="gray.500">
                IF
              </Text>
              <Text fontSize="lg" fontWeight="bold">
                {stats.if}
              </Text>
            </VStack>
          </HStack>
        </Box>
      </SimpleGrid>

      <Divider />

      {/* Mode Toggle */}
      <HStack justify="space-between" align="center">
        <Text fontSize="sm" fontWeight="semibold" color="gray.600">
          {t('builder.workoutSteps')}
        </Text>
        <FormControl display="flex" alignItems="center" w="auto">
          <FormLabel htmlFor="full-edit-mode" mb="0" fontSize="xs" mr={2}>
            <HStack spacing={1}>
              <Icon as={Edit3} boxSize={3} />
              <Text>{t('calendar.fullEditMode')}</Text>
            </HStack>
          </FormLabel>
          <Switch
            id="full-edit-mode"
            size="sm"
            colorScheme="brand"
            isChecked={isFullEditMode}
            onChange={(e) => setIsFullEditMode(e.target.checked)}
          />
        </FormControl>
      </HStack>

      {/* Steps List */}
      <VStack spacing={2} align="stretch">
        {steps.map((step, index) => {
          const config = INTENSITY_CONFIG[step.intensityClass as keyof typeof INTENSITY_CONFIG] || INTENSITY_CONFIG.active;

          return (
            <Box
              key={step.id}
              p={3}
              bg={bgColor}
              borderRadius="md"
              borderWidth="1px"
              borderColor={borderColor}
            >
              <VStack spacing={3} align="stretch">
                {/* Step header */}
                <HStack justify="space-between">
                  <HStack>
                    <Text fontSize="sm" fontWeight="medium">
                      {index + 1}.
                    </Text>
                    <Badge colorScheme={config.color} fontSize="xs">
                      {t(`builder.${step.intensityClass}`) || config.label}
                    </Badge>
                  </HStack>

                  {/* Delete button (always visible for trimming) */}
                  <Tooltip label={t('common.delete')}>
                    <IconButton
                      size="xs"
                      variant="ghost"
                      colorScheme="red"
                      icon={<Trash2 size={14} />}
                      aria-label={t('common.delete')}
                      onClick={() => removeStep(index)}
                    />
                  </Tooltip>
                </HStack>

                {/* SIMPLE MODE: Only duration editable, rest read-only */}
                {!isFullEditMode && (
                  <VStack spacing={2} align="stretch">
                    {/* Duration - Editable */}
                    <Box>
                      <Text fontSize="xs" mb={1} color="gray.500">
                        {t('builder.duration')}
                      </Text>
                      <HStack spacing={1}>
                        <NumberInput
                          size="sm"
                          value={step.durationValue}
                          onChange={(_, val) => !isNaN(val) && updateStep(index, 'durationValue', val)}
                          min={1}
                          max={step.durationUnit === 'minute' ? 180 : 10800}
                          flex={1}
                        >
                          <NumberInputField />
                          <NumberInputStepper>
                            <NumberIncrementStepper />
                            <NumberDecrementStepper />
                          </NumberInputStepper>
                        </NumberInput>
                        <Select
                          size="sm"
                          value={step.durationUnit}
                          onChange={(e) => updateStep(index, 'durationUnit', e.target.value)}
                          maxW="80px"
                        >
                          <option value="minute">{t('builder.min')}</option>
                          <option value="second">{t('builder.sec')}</option>
                        </Select>
                      </HStack>
                    </Box>

                    {/* Intensity - Read-only badges */}
                    <HStack spacing={2} wrap="wrap">
                      <Badge colorScheme="purple" fontSize="xs">
                        {step.targetMin}-{step.targetMax}% FTP
                      </Badge>
                      {step.cadenceMin && step.cadenceMax && (
                        <Badge colorScheme="blue" fontSize="xs">
                          {step.cadenceMin}-{step.cadenceMax} RPM
                        </Badge>
                      )}
                      {step.hrMin && step.hrMax && (
                        <Badge colorScheme="red" fontSize="xs">
                          {step.hrMin}-{step.hrMax} {step.hrType === 'bpm' ? 'BPM' : '% Max HR'}
                        </Badge>
                      )}
                    </HStack>
                  </VStack>
                )}

                {/* FULL EDIT MODE: All fields editable */}
                {isFullEditMode && (
                  <VStack spacing={2} align="stretch">
                    {/* Duration */}
                    <Box>
                      <Text fontSize="xs" mb={1} color="gray.500">
                        {t('builder.duration')}
                      </Text>
                      <HStack spacing={1}>
                        <NumberInput
                          size="sm"
                          value={step.durationValue}
                          onChange={(_, val) => !isNaN(val) && updateStep(index, 'durationValue', val)}
                          min={1}
                          max={step.durationUnit === 'minute' ? 180 : 10800}
                          flex={1}
                        >
                          <NumberInputField />
                          <NumberInputStepper>
                            <NumberIncrementStepper />
                            <NumberDecrementStepper />
                          </NumberInputStepper>
                        </NumberInput>
                        <Select
                          size="sm"
                          value={step.durationUnit}
                          onChange={(e) => updateStep(index, 'durationUnit', e.target.value)}
                          maxW="80px"
                        >
                          <option value="minute">{t('builder.min')}</option>
                          <option value="second">{t('builder.sec')}</option>
                        </Select>
                      </HStack>
                    </Box>

                    {/* Intensity */}
                    <Box>
                      <Text fontSize="xs" mb={1} color="gray.500">
                        {t('builder.intensity')} (% FTP)
                      </Text>
                      <HStack spacing={1}>
                        <NumberInput
                          size="sm"
                          value={step.targetMin}
                          onChange={(_, val) => !isNaN(val) && updateStep(index, 'targetMin', val)}
                          min={0}
                          max={200}
                          flex={1}
                        >
                          <NumberInputField />
                          <NumberInputStepper>
                            <NumberIncrementStepper />
                            <NumberDecrementStepper />
                          </NumberInputStepper>
                        </NumberInput>
                        <Text fontSize="xs" color="gray.500">-</Text>
                        <NumberInput
                          size="sm"
                          value={step.targetMax}
                          onChange={(_, val) => !isNaN(val) && updateStep(index, 'targetMax', val)}
                          min={0}
                          max={200}
                          flex={1}
                        >
                          <NumberInputField />
                          <NumberInputStepper>
                            <NumberIncrementStepper />
                            <NumberDecrementStepper />
                          </NumberInputStepper>
                        </NumberInput>
                      </HStack>
                    </Box>

                    {/* Cadence (optional) */}
                    <Box>
                      <Text fontSize="xs" mb={1} color="gray.500">
                        {t('builder.cadence')} (RPM) - {t('common.optional')}
                      </Text>
                      <HStack spacing={1}>
                        <NumberInput
                          size="sm"
                          value={step.cadenceMin || ''}
                          onChange={(_, val) => !isNaN(val) && updateStep(index, 'cadenceMin', val || undefined)}
                          min={0}
                          max={200}
                          flex={1}
                        >
                          <NumberInputField placeholder="Min" />
                          <NumberInputStepper>
                            <NumberIncrementStepper />
                            <NumberDecrementStepper />
                          </NumberInputStepper>
                        </NumberInput>
                        <Text fontSize="xs" color="gray.500">-</Text>
                        <NumberInput
                          size="sm"
                          value={step.cadenceMax || ''}
                          onChange={(_, val) => !isNaN(val) && updateStep(index, 'cadenceMax', val || undefined)}
                          min={0}
                          max={200}
                          flex={1}
                        >
                          <NumberInputField placeholder="Max" />
                          <NumberInputStepper>
                            <NumberIncrementStepper />
                            <NumberDecrementStepper />
                          </NumberInputStepper>
                        </NumberInput>
                      </HStack>
                    </Box>

                    {/* Heart Rate (optional) */}
                    <Box>
                      <Text fontSize="xs" mb={1} color="gray.500">
                        {t('builder.heartRate')} - {t('common.optional')}
                      </Text>
                      <HStack spacing={1}>
                        <NumberInput
                          size="sm"
                          value={step.hrMin || ''}
                          onChange={(_, val) => !isNaN(val) && updateStep(index, 'hrMin', val || undefined)}
                          min={0}
                          max={220}
                          flex={1}
                        >
                          <NumberInputField placeholder="Min" />
                          <NumberInputStepper>
                            <NumberIncrementStepper />
                            <NumberDecrementStepper />
                          </NumberInputStepper>
                        </NumberInput>
                        <Text fontSize="xs" color="gray.500">-</Text>
                        <NumberInput
                          size="sm"
                          value={step.hrMax || ''}
                          onChange={(_, val) => !isNaN(val) && updateStep(index, 'hrMax', val || undefined)}
                          min={0}
                          max={220}
                          flex={1}
                        >
                          <NumberInputField placeholder="Max" />
                          <NumberInputStepper>
                            <NumberIncrementStepper />
                            <NumberDecrementStepper />
                          </NumberInputStepper>
                        </NumberInput>
                        <Select
                          size="sm"
                          value={step.hrType || 'bpm'}
                          onChange={(e) => updateStep(index, 'hrType', e.target.value as 'bpm' | 'percent')}
                          maxW="90px"
                        >
                          <option value="bpm">BPM</option>
                          <option value="percent">% Max</option>
                        </Select>
                      </HStack>
                    </Box>
                  </VStack>
                )}
              </VStack>
            </Box>
          );
        })}

        {/* Add step button (only in full edit mode) */}
        {isFullEditMode && (
          <Button
            size="sm"
            leftIcon={<Plus size={16} />}
            variant="outline"
            onClick={addStep}
          >
            {t('builder.addStep')}
          </Button>
        )}
      </VStack>
    </VStack>
  );
}
