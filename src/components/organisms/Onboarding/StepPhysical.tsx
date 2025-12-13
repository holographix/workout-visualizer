/**
 * StepPhysical
 * Onboarding step for collecting physical data (height, weight)
 */
import {
  VStack,
  FormControl,
  FormLabel,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  InputGroup,
  InputRightAddon,
  Text,
  Heading,
  Box,
  HStack,
  useColorModeValue,
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import type { PhysicalStepData } from '../../../types/onboarding';

interface StepPhysicalProps {
  data: Partial<PhysicalStepData>;
  onChange: (data: Partial<PhysicalStepData>) => void;
}

export function StepPhysical({ data, onChange }: StepPhysicalProps) {
  const { t } = useTranslation();
  const labelColor = useColorModeValue('gray.600', 'gray.400');

  return (
    <VStack spacing={6} align="stretch">
      <Box textAlign="center" mb={4}>
        <Heading size="md" mb={2}>{t('onboarding.physical.title')}</Heading>
        <Text color={labelColor}>{t('onboarding.physical.description')}</Text>
      </Box>

      <HStack spacing={6} align="flex-start">
        <FormControl isRequired flex={1}>
          <FormLabel>{t('onboarding.physical.height')}</FormLabel>
          <InputGroup size="lg">
            <NumberInput
              value={data.heightCm || ''}
              onChange={(_, value) => onChange({ ...data, heightCm: value || undefined })}
              min={100}
              max={250}
              flex={1}
            >
              <NumberInputField borderRightRadius={0} />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
            <InputRightAddon>{t('onboarding.physical.heightUnit')}</InputRightAddon>
          </InputGroup>
        </FormControl>

        <FormControl isRequired flex={1}>
          <FormLabel>{t('onboarding.physical.weight')}</FormLabel>
          <InputGroup size="lg">
            <NumberInput
              value={data.weightKg || ''}
              onChange={(_, value) => onChange({ ...data, weightKg: value || undefined })}
              min={30}
              max={200}
              precision={1}
              step={0.5}
              flex={1}
            >
              <NumberInputField borderRightRadius={0} />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
            <InputRightAddon>{t('onboarding.physical.weightUnit')}</InputRightAddon>
          </InputGroup>
        </FormControl>
      </HStack>
    </VStack>
  );
}
