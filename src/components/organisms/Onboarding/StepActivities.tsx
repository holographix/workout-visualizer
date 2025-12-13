/**
 * StepActivities
 * Onboarding step for selecting activity types and equipment
 */
import {
  VStack,
  Text,
  Heading,
  Box,
  SimpleGrid,
  Checkbox,
  CheckboxGroup,
  Divider,
  HStack,
  Switch,
  FormControl,
  FormLabel,
  useColorModeValue,
  Icon,
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import {
  Bike,
  Home,
  Dumbbell,
  Footprints,
  Waves,
  Snowflake,
  Gauge,
  Heart,
} from 'lucide-react';
import type { ActivityType, EquipmentStepData } from '../../../types/onboarding';

interface StepActivitiesProps {
  activities: ActivityType[];
  equipment: Partial<EquipmentStepData>;
  onActivitiesChange: (activities: ActivityType[]) => void;
  onEquipmentChange: (equipment: Partial<EquipmentStepData>) => void;
}

const ACTIVITIES: { value: ActivityType; labelKey: string; icon: typeof Bike }[] = [
  { value: 'OUTDOOR_CYCLING', labelKey: 'onboarding.activities.outdoorCycling', icon: Bike },
  { value: 'INDOOR_CYCLING', labelKey: 'onboarding.activities.indoorCycling', icon: Home },
  { value: 'WORKOUT_HOME', labelKey: 'onboarding.activities.workoutHome', icon: Dumbbell },
  { value: 'WORKOUT_GYM', labelKey: 'onboarding.activities.workoutGym', icon: Dumbbell },
  { value: 'CROSS_RUNNING', labelKey: 'onboarding.activities.crossRunning', icon: Footprints },
  { value: 'CROSS_SWIMMING', labelKey: 'onboarding.activities.crossSwimming', icon: Waves },
  { value: 'CROSS_SKIING', labelKey: 'onboarding.activities.crossSkiing', icon: Snowflake },
];

export function StepActivities({
  activities,
  equipment,
  onActivitiesChange,
  onEquipmentChange,
}: StepActivitiesProps) {
  const { t } = useTranslation();
  const labelColor = useColorModeValue('gray.600', 'gray.400');
  const cardBg = useColorModeValue('gray.50', 'gray.700');
  const iconColor = useColorModeValue('brand.500', 'brand.300');

  return (
    <VStack spacing={6} align="stretch">
      {/* Activities Section */}
      <Box>
        <Box textAlign="center" mb={4}>
          <Heading size="md" mb={2}>{t('onboarding.activities.title')}</Heading>
          <Text color={labelColor}>{t('onboarding.activities.description')}</Text>
        </Box>

        <CheckboxGroup
          value={activities}
          onChange={(values) => onActivitiesChange(values as ActivityType[])}
        >
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
            {ACTIVITIES.map((activity) => (
              <Box
                key={activity.value}
                bg={cardBg}
                p={3}
                borderRadius="lg"
                transition="all 0.2s"
              >
                <Checkbox value={activity.value} size="lg">
                  <HStack spacing={2}>
                    <Icon as={activity.icon} boxSize={5} color={iconColor} />
                    <Text>{t(activity.labelKey)}</Text>
                  </HStack>
                </Checkbox>
              </Box>
            ))}
          </SimpleGrid>
        </CheckboxGroup>
      </Box>

      <Divider />

      {/* Equipment Section */}
      <Box>
        <Box textAlign="center" mb={4}>
          <Heading size="md" mb={2}>{t('onboarding.equipment.title')}</Heading>
          <Text color={labelColor}>{t('onboarding.equipment.description')}</Text>
        </Box>

        <VStack spacing={4} align="stretch">
          <FormControl display="flex" alignItems="center" justifyContent="space-between">
            <HStack spacing={3}>
              <Icon as={Gauge} boxSize={6} color={iconColor} />
              <FormLabel htmlFor="power-meter" mb={0}>
                {t('onboarding.equipment.powerMeter')}
              </FormLabel>
            </HStack>
            <Switch
              id="power-meter"
              size="lg"
              isChecked={equipment.hasPowerMeter || false}
              onChange={(e) =>
                onEquipmentChange({ ...equipment, hasPowerMeter: e.target.checked })
              }
            />
          </FormControl>

          <FormControl display="flex" alignItems="center" justifyContent="space-between">
            <HStack spacing={3}>
              <Icon as={Heart} boxSize={6} color={iconColor} />
              <FormLabel htmlFor="hr-monitor" mb={0}>
                {t('onboarding.equipment.hrMonitor')}
              </FormLabel>
            </HStack>
            <Switch
              id="hr-monitor"
              size="lg"
              isChecked={equipment.hasHRMonitor || false}
              onChange={(e) =>
                onEquipmentChange({ ...equipment, hasHRMonitor: e.target.checked })
              }
            />
          </FormControl>
        </VStack>
      </Box>
    </VStack>
  );
}
