/**
 * StepAvailability
 * Onboarding step for setting weekly availability
 * Reuses the existing WeeklyAvailabilityEditor component
 * Note: Does NOT auto-save - the wizard saves when clicking Next
 */
import { VStack, Text, Heading, Box, useColorModeValue } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { WeeklyAvailabilityEditor } from '../Availability/WeeklyAvailabilityEditor';
import type { WeeklyAvailability } from '../../../types/availability';

interface StepAvailabilityProps {
  availability: WeeklyAvailability;
  onChange: (availability: WeeklyAvailability) => void;
}

export function StepAvailability({ availability, onChange }: StepAvailabilityProps) {
  const { t } = useTranslation();
  const labelColor = useColorModeValue('gray.600', 'gray.400');

  return (
    <VStack spacing={6} align="stretch">
      <Box textAlign="center" mb={4}>
        <Heading size="md" mb={2}>{t('onboarding.steps.availability')}</Heading>
        <Text color={labelColor}>{t('availability.title')}</Text>
      </Box>

      <WeeklyAvailabilityEditor
        availability={availability}
        onChange={onChange}
      />
    </VStack>
  );
}
