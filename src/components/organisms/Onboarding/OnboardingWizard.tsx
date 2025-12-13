/**
 * OnboardingWizard
 * Main container for the onboarding flow with progress indicator
 */
import { useState, useCallback } from 'react';
import {
  Box,
  VStack,
  HStack,
  Button,
  Progress,
  Text,
  Heading,
  Container,
  useColorModeValue,
  Flex,
  Circle,
  useToast,
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { useOnboarding } from '../../../hooks/useOnboarding';
import type {
  PersonalInfoStepData,
  PhysicalStepData,
  CategoryStepData,
  DisciplineStepData,
  TerrainStepData,
  ActivityTypesStepData,
  EquipmentStepData,
  OnboardingWizardState,
  Sex,
  AthleteCategory,
  TerrainType,
  ActivityType,
} from '../../../types/onboarding';
import { createDefaultAvailability } from '../../../types/availability';
import type { WeeklyAvailability } from '../../../types/availability';
import { StepPersonalInfo } from './StepPersonalInfo';
import { StepPhysical } from './StepPhysical';
import { StepCategory } from './StepCategory';
import { StepDiscipline } from './StepDiscipline';
import { StepTerrain } from './StepTerrain';
import { StepAvailability } from './StepAvailability';
import { StepActivities } from './StepActivities';

interface OnboardingWizardProps {
  athleteId: string;
  onComplete: () => void;
}

const TOTAL_STEPS = 7;

interface ExtendedWizardState extends OnboardingWizardState {
  availability: WeeklyAvailability;
}

const initialState: ExtendedWizardState = {
  currentStep: 1,
  personalInfo: {},
  physical: {},
  category: {},
  disciplines: [],
  terrain: {},
  activityTypes: [],
  equipment: { hasPowerMeter: false, hasHRMonitor: false },
  availability: createDefaultAvailability(),
};

export function OnboardingWizard({ athleteId, onComplete }: OnboardingWizardProps) {
  const { t } = useTranslation();
  const toast = useToast();
  const [state, setState] = useState<ExtendedWizardState>(initialState);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    savePersonalInfo,
    savePhysical,
    saveCategory,
    saveDisciplines,
    saveTerrain,
    saveAvailability,
    saveActivityTypes,
    saveEquipment,
    completeOnboarding,
    isSaving,
  } = useOnboarding({ athleteId });

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const stepBgActive = useColorModeValue('brand.500', 'brand.400');
  const stepBgCompleted = useColorModeValue('brand.500', 'brand.400');
  const stepBgPending = useColorModeValue('gray.200', 'gray.600');

  const progressPercent = ((state.currentStep - 1) / (TOTAL_STEPS - 1)) * 100;

  const updateState = useCallback(<K extends keyof OnboardingWizardState>(
    key: K,
    value: OnboardingWizardState[K]
  ) => {
    setState((prev) => ({ ...prev, [key]: value }));
  }, []);

  const goNext = async () => {
    if (isSubmitting || isSaving) return;
    setIsSubmitting(true);

    try {
      // Save current step data to API before advancing
      switch (state.currentStep) {
        case 1:
          if (state.personalInfo.fullName && state.personalInfo.birthday && state.personalInfo.sex) {
            await savePersonalInfo({
              fullName: state.personalInfo.fullName,
              birthday: state.personalInfo.birthday,
              sex: state.personalInfo.sex as Sex,
              lastMenstrualDate: state.personalInfo.lastMenstrualDate,
            });
          }
          break;
        case 2:
          if (state.physical.heightCm && state.physical.weightKg) {
            await savePhysical({
              heightCm: state.physical.heightCm,
              weightKg: state.physical.weightKg,
            });
          }
          break;
        case 3:
          if (state.category.athleteCategory) {
            await saveCategory({
              athleteCategory: state.category.athleteCategory as AthleteCategory,
            });
          }
          break;
        case 4:
          if (state.disciplines.length > 0) {
            await saveDisciplines({ disciplines: state.disciplines });
          }
          break;
        case 5:
          if (state.terrain.terrain) {
            await saveTerrain({ terrain: state.terrain.terrain as TerrainType });
          }
          break;
        case 6:
          // Save availability when clicking Next
          await saveAvailability(state.availability);
          break;
        case 7:
          // Save activities and equipment together
          if (state.activityTypes.length > 0) {
            await saveActivityTypes({ activityTypes: state.activityTypes as ActivityType[] });
          }
          await saveEquipment({
            hasPowerMeter: state.equipment.hasPowerMeter ?? false,
            hasHRMonitor: state.equipment.hasHRMonitor ?? false,
          });
          // Complete onboarding
          await completeOnboarding();
          onComplete();
          return;
      }

      setState((prev) => ({ ...prev, currentStep: Math.min(prev.currentStep + 1, TOTAL_STEPS) }));
    } catch (error) {
      toast({
        title: t('common.error'),
        description: error instanceof Error ? error.message : 'Failed to save',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const goPrev = () => {
    setState((prev) => ({ ...prev, currentStep: Math.max(prev.currentStep - 1, 1) }));
  };

  const canProceed = (): boolean => {
    switch (state.currentStep) {
      case 1:
        return !!(state.personalInfo.fullName && state.personalInfo.birthday && state.personalInfo.sex);
      case 2:
        return !!(state.physical.heightCm && state.physical.weightKg);
      case 3:
        return !!state.category.athleteCategory;
      case 4:
        return state.disciplines.length > 0;
      case 5:
        return !!state.terrain.terrain;
      case 6:
        return true; // Availability is optional
      case 7:
        return true; // Activities and equipment are optional
      default:
        return false;
    }
  };

  const renderStep = () => {
    switch (state.currentStep) {
      case 1:
        return (
          <StepPersonalInfo
            data={state.personalInfo}
            onChange={(data) => updateState('personalInfo', data)}
          />
        );
      case 2:
        return (
          <StepPhysical
            data={state.physical}
            onChange={(data) => updateState('physical', data)}
          />
        );
      case 3:
        return (
          <StepCategory
            data={state.category}
            onChange={(data) => updateState('category', data)}
          />
        );
      case 4:
        return (
          <StepDiscipline
            data={state.disciplines}
            onChange={(data) => updateState('disciplines', data)}
          />
        );
      case 5:
        return (
          <StepTerrain
            data={state.terrain}
            onChange={(data) => updateState('terrain', data)}
          />
        );
      case 6:
        return (
          <StepAvailability
            availability={state.availability}
            onChange={(availability) => setState((prev) => ({ ...prev, availability }))}
          />
        );
      case 7:
        return (
          <StepActivities
            activities={state.activityTypes}
            equipment={state.equipment}
            onActivitiesChange={(data) => updateState('activityTypes', data)}
            onEquipmentChange={(data) => updateState('equipment', data)}
          />
        );
      default:
        return null;
    }
  };

  const stepKeys = ['personal', 'physical', 'category', 'discipline', 'terrain', 'availability', 'activities'];

  return (
    <Container maxW="container.md" py={8}>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Box textAlign="center">
          <Heading size="lg" mb={2}>{t('onboarding.title')}</Heading>
          <Text color="gray.500">{t('onboarding.subtitle')}</Text>
        </Box>

        {/* Progress */}
        <Box>
          <HStack justify="space-between" mb={2}>
            <Text fontSize="sm" color="gray.500">
              {t('onboarding.progress', { current: state.currentStep, total: TOTAL_STEPS })}
            </Text>
            <Text fontSize="sm" fontWeight="medium">
              {t(`onboarding.steps.${stepKeys[state.currentStep - 1]}`)}
            </Text>
          </HStack>
          <Progress
            value={progressPercent}
            size="sm"
            colorScheme="brand"
            borderRadius="full"
            bg={stepBgPending}
          />
          {/* Step indicators */}
          <HStack justify="space-between" mt={4}>
            {stepKeys.map((key, index) => {
              const stepNum = index + 1;
              const isActive = stepNum === state.currentStep;
              const isCompleted = stepNum < state.currentStep;
              return (
                <Flex key={key} direction="column" align="center" flex={1}>
                  <Circle
                    size="8"
                    bg={isCompleted ? stepBgCompleted : isActive ? stepBgActive : stepBgPending}
                    color={isCompleted || isActive ? 'white' : 'gray.500'}
                    fontSize="sm"
                    fontWeight="bold"
                  >
                    {isCompleted ? <Check size={16} /> : stepNum}
                  </Circle>
                </Flex>
              );
            })}
          </HStack>
        </Box>

        {/* Step Content */}
        <Box
          bg={bgColor}
          borderRadius="xl"
          borderWidth="1px"
          borderColor={borderColor}
          p={6}
          minH="400px"
        >
          {renderStep()}
        </Box>

        {/* Navigation */}
        <HStack justify="space-between">
          <Button
            variant="ghost"
            leftIcon={<ChevronLeft size={20} />}
            onClick={goPrev}
            isDisabled={state.currentStep === 1 || isSubmitting}
          >
            {t('onboarding.previous')}
          </Button>
          <Button
            colorScheme="brand"
            rightIcon={state.currentStep === TOTAL_STEPS ? <Check size={20} /> : <ChevronRight size={20} />}
            onClick={goNext}
            isLoading={isSubmitting || isSaving}
            isDisabled={!canProceed()}
          >
            {state.currentStep === TOTAL_STEPS ? t('onboarding.finish') : t('onboarding.next')}
          </Button>
        </HStack>
      </VStack>
    </Container>
  );
}
