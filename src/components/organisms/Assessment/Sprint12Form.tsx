/**
 * Sprint12Form
 * Form for Sprint + 12min climb assessment protocol
 *
 * Sprint: 15-second all-out effort - record PEAK power
 * Climb: 12-minute sustained effort - record AVERAGE power
 */
import {
  VStack,
  FormControl,
  FormLabel,
  Input,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  InputGroup,
  InputRightAddon,
  Textarea,
  Button,
  HStack,
  Box,
  Heading,
  Text,
  useColorModeValue,
} from '@chakra-ui/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Sprint12MinData } from '../../../types/assessment';

interface Sprint12FormProps {
  onSubmit: (data: Sprint12MinData) => Promise<void>;
  isLoading: boolean;
  initialValues?: Sprint12MinData;
}

export function Sprint12Form({ onSubmit, isLoading, initialValues }: Sprint12FormProps) {
  const { t } = useTranslation();
  const [testDate, setTestDate] = useState(
    initialValues?.testDate?.split('T')[0] || new Date().toISOString().split('T')[0]
  );
  const [sprintPeakPower, setSprintPeakPower] = useState<number | undefined>(initialValues?.sprintPeakPower);
  const [sprintMaxHR, setSprintMaxHR] = useState<number | undefined>(initialValues?.sprintMaxHR);
  const [climb12AvgPower, setClimb12AvgPower] = useState<number | undefined>(initialValues?.climb12AvgPower);
  const [climb12MaxHR, setClimb12MaxHR] = useState<number | undefined>(initialValues?.climb12MaxHR);
  const [notes, setNotes] = useState(initialValues?.notes || '');

  const labelColor = useColorModeValue('gray.600', 'gray.400');
  const sectionBg = useColorModeValue('gray.50', 'gray.700');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      testDate,
      sprintPeakPower,
      sprintMaxHR,
      climb12AvgPower,
      climb12MaxHR,
      notes: notes || undefined,
    });
  };

  const isValid = testDate && (sprintPeakPower || climb12AvgPower);

  return (
    <form onSubmit={handleSubmit}>
      <VStack spacing={6} align="stretch">
        {/* Test Date */}
        <FormControl isRequired>
          <FormLabel>{t('assessment.testDate')}</FormLabel>
          <Input
            type="date"
            value={testDate}
            onChange={(e) => setTestDate(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
          />
        </FormControl>

        {/* Sprint Section */}
        <Box bg={sectionBg} p={4} borderRadius="lg">
          <Heading size="sm" mb={1}>15" Sprint</Heading>
          <Text fontSize="sm" color={labelColor} mb={4}>
            {t('assessment.fields.sprintPeakPowerDesc')}
          </Text>
          <HStack spacing={4}>
            <FormControl flex={1}>
              <FormLabel fontSize="sm">{t('assessment.fields.sprintPeakPower')}</FormLabel>
              <InputGroup size="sm">
                <NumberInput
                  value={sprintPeakPower || ''}
                  onChange={(_, val) => setSprintPeakPower(val || undefined)}
                  min={0}
                  max={2500}
                  flex={1}
                >
                  <NumberInputField borderRightRadius={0} />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
                <InputRightAddon>{t('assessment.units.watts')}</InputRightAddon>
              </InputGroup>
            </FormControl>
            <FormControl flex={1}>
              <FormLabel fontSize="sm">{t('assessment.fields.sprintMaxHR')}</FormLabel>
              <InputGroup size="sm">
                <NumberInput
                  value={sprintMaxHR || ''}
                  onChange={(_, val) => setSprintMaxHR(val || undefined)}
                  min={0}
                  max={250}
                  flex={1}
                >
                  <NumberInputField borderRightRadius={0} />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
                <InputRightAddon>{t('assessment.units.bpm')}</InputRightAddon>
              </InputGroup>
            </FormControl>
          </HStack>
        </Box>

        {/* 12min Climb Section */}
        <Box bg={sectionBg} p={4} borderRadius="lg">
          <Heading size="sm" mb={1}>12' Climb</Heading>
          <Text fontSize="sm" color={labelColor} mb={4}>
            {t('assessment.fields.climb12AvgPowerDesc')}
          </Text>
          <HStack spacing={4}>
            <FormControl flex={1}>
              <FormLabel fontSize="sm">{t('assessment.fields.climb12AvgPower')}</FormLabel>
              <InputGroup size="sm">
                <NumberInput
                  value={climb12AvgPower || ''}
                  onChange={(_, val) => setClimb12AvgPower(val || undefined)}
                  min={0}
                  max={1000}
                  flex={1}
                >
                  <NumberInputField borderRightRadius={0} />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
                <InputRightAddon>{t('assessment.units.watts')}</InputRightAddon>
              </InputGroup>
            </FormControl>
            <FormControl flex={1}>
              <FormLabel fontSize="sm">{t('assessment.fields.climb12MaxHR')}</FormLabel>
              <InputGroup size="sm">
                <NumberInput
                  value={climb12MaxHR || ''}
                  onChange={(_, val) => setClimb12MaxHR(val || undefined)}
                  min={0}
                  max={250}
                  flex={1}
                >
                  <NumberInputField borderRightRadius={0} />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
                <InputRightAddon>{t('assessment.units.bpm')}</InputRightAddon>
              </InputGroup>
            </FormControl>
          </HStack>
        </Box>

        {/* Notes */}
        <FormControl>
          <FormLabel>{t('assessment.notes')}</FormLabel>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t('assessment.notesPlaceholder')}
            rows={2}
          />
        </FormControl>

        {/* Submit */}
        <Button
          type="submit"
          colorScheme="brand"
          size="lg"
          isLoading={isLoading}
          isDisabled={!isValid}
        >
          {t('assessment.save')}
        </Button>
      </VStack>
    </form>
  );
}
