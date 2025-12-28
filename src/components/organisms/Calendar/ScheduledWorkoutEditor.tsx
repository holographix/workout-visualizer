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
  Text,
  Badge,
  useToast,
  Box,
  Divider,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { Edit2, RotateCcw } from 'lucide-react';
import type { ScheduledWorkout } from '../../../types/calendar';
import { CompactWorkoutEditor } from './CompactWorkoutEditor';
import type { WorkoutStructure } from '../../../types/workout';

interface ScheduledWorkoutEditorProps {
  isOpen: boolean;
  onClose: () => void;
  scheduledWorkout: ScheduledWorkout;
  onModify: (scheduledId: string, structure: any) => Promise<void>;
  onReset: (scheduledId: string) => Promise<void>;
  maxHours?: number; // Max hours available for this day
  currentDayHours?: number; // Current allocated hours for this day (excluding this workout)
}

export function ScheduledWorkoutEditor({
  isOpen,
  onClose,
  scheduledWorkout,
  onModify,
  onReset,
  maxHours,
  currentDayHours = 0,
}: ScheduledWorkoutEditorProps) {
  const { t } = useTranslation();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [modifiedStructure, setModifiedStructure] = useState<WorkoutStructure>({ structure: [] });

  // Initialize structure from scheduled workout
  useEffect(() => {
    if (isOpen && scheduledWorkout) {
      const baseWorkout = scheduledWorkout.workout;
      // Use structureOverride if available, otherwise use baseWorkout.attributes.structure
      const structure = scheduledWorkout.structureOverride || baseWorkout.attributes?.structure;

      console.log('📊 Loading workout structure:', {
        hasOverride: !!scheduledWorkout.structureOverride,
        hasBaseStructure: !!baseWorkout.attributes?.structure,
        structure,
        baseWorkout,
      });

      setModifiedStructure(structure || { structure: [] });
    }
  }, [isOpen, scheduledWorkout]);

  // Calculate stats from structure
  const calculateStats = (structure: WorkoutStructure) => {
    let totalSeconds = 0;
    let weightedTSS = 0;

    structure.structure.forEach((item: any) => {
      const step = item.steps?.[0];
      if (!step) return;

      const seconds = step.length?.unit === 'minute'
        ? step.length.value * 60
        : step.length.value;
      totalSeconds += seconds;

      const target = step.targets?.[0] || {};
      const avgIntensity = ((target.minValue || 50) + (target.maxValue || 75)) / 2 / 100;
      weightedTSS += (seconds / 3600) * avgIntensity * avgIntensity * 100;
    });

    const avgIF = totalSeconds > 0
      ? Math.sqrt(weightedTSS / (totalSeconds / 3600) / 100)
      : 0;

    return {
      totalSeconds,
      totalHours: totalSeconds / 3600,
      tss: Math.round(weightedTSS),
      if: parseFloat(avgIF.toFixed(2)),
    };
  };

  const handleSave = async () => {
    if (!modifiedStructure) return;

    const stats = calculateStats(modifiedStructure);

    // Validate day capacity if maxHours is set
    if (maxHours !== undefined) {
      const totalHours = currentDayHours + stats.totalHours;

      if (totalHours > maxHours) {
        toast({
          title: t('calendar.capacityExceeded'),
          description: t('calendar.capacityExceededDescription', {
            available: maxHours.toFixed(1),
            required: stats.totalHours.toFixed(1),
            total: totalHours.toFixed(1),
          }),
          status: 'error',
          duration: 5000,
        });
        return;
      }
    }

    setIsLoading(true);
    try {
      await onModify(scheduledWorkout.id, modifiedStructure);
      toast({
        title: t('calendar.workoutModified'),
        description: t('calendar.workoutModifiedDescription'),
        status: 'success',
        duration: 3000,
      });
      onClose();
    } catch (error) {
      console.error('Failed to modify workout:', error);
      toast({
        title: t('common.error'),
        description: t('calendar.workoutModifyError'),
        status: 'error',
        duration: 4000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async () => {
    setIsLoading(true);
    try {
      await onReset(scheduledWorkout.id);
      toast({
        title: t('calendar.workoutReset'),
        description: t('calendar.workoutResetDescription'),
        status: 'success',
        duration: 3000,
      });
      onClose();
    } catch (error) {
      console.error('Failed to reset workout:', error);
      toast({
        title: t('common.error'),
        description: t('calendar.workoutResetError'),
        status: 'error',
        duration: 4000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const hasChanges = scheduledWorkout.isModified || false;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <HStack>
            <Edit2 size={20} />
            <Text>{t('calendar.editWorkoutDuration')}</Text>
          </HStack>
          <Text fontSize="sm" fontWeight="normal" color="gray.500" mt={1}>
            {scheduledWorkout.workout.title}
          </Text>
        </ModalHeader>
        <ModalCloseButton />

        <ModalBody>
          {hasChanges && (
            <Alert status="info" mb={4} borderRadius="md">
              <AlertIcon />
              <VStack align="start" spacing={0} flex={1}>
                <Text fontSize="sm" fontWeight="medium">
                  {t('calendar.workoutAlreadyModified')}
                </Text>
                <Text fontSize="xs" color="gray.600">
                  {t('calendar.workoutAlreadyModifiedDescription')}
                </Text>
              </VStack>
            </Alert>
          )}

          {/* Compact Workout Editor */}
          <CompactWorkoutEditor
            structure={modifiedStructure}
            onChange={setModifiedStructure}
          />
        </ModalBody>

        <ModalFooter>
          <HStack spacing={2}>
            {hasChanges && (
              <Button
                leftIcon={<RotateCcw size={16} />}
                variant="ghost"
                colorScheme="orange"
                onClick={handleReset}
                isLoading={isLoading}
              >
                {t('calendar.resetToOriginal')}
              </Button>
            )}
            <Button variant="ghost" onClick={onClose} isDisabled={isLoading}>
              {t('common.cancel')}
            </Button>
            <Button
              colorScheme="brand"
              onClick={handleSave}
              isLoading={isLoading}
              leftIcon={<Edit2 size={16} />}
            >
              {t('common.save')}
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
