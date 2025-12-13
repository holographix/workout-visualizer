/**
 * Power125Form
 * Form for 1/2/5 minute power assessment protocol
 *
 * All efforts record AVERAGE power over the duration
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
import type { Power125MinData } from '../../../types/assessment';

interface Power125FormProps {
  onSubmit: (data: Power125MinData) => Promise<void>;
  isLoading: boolean;
  initialValues?: Power125MinData;
}

export function Power125Form({ onSubmit, isLoading, initialValues }: Power125FormProps) {
  const { t } = useTranslation();
  const [testDate, setTestDate] = useState(
    initialValues?.testDate?.split('T')[0] || new Date().toISOString().split('T')[0]
  );
  const [effort1minAvgPower, setEffort1minAvgPower] = useState<number | undefined>(initialValues?.effort1minAvgPower);
  const [effort1minMaxHR, setEffort1minMaxHR] = useState<number | undefined>(initialValues?.effort1minMaxHR);
  const [effort2minAvgPower, setEffort2minAvgPower] = useState<number | undefined>(initialValues?.effort2minAvgPower);
  const [effort2minMaxHR, setEffort2minMaxHR] = useState<number | undefined>(initialValues?.effort2minMaxHR);
  const [effort5minAvgPower, setEffort5minAvgPower] = useState<number | undefined>(initialValues?.effort5minAvgPower);
  const [effort5minMaxHR, setEffort5minMaxHR] = useState<number | undefined>(initialValues?.effort5minMaxHR);
  const [notes, setNotes] = useState(initialValues?.notes || '');

  const labelColor = useColorModeValue('gray.600', 'gray.400');
  const sectionBg = useColorModeValue('gray.50', 'gray.700');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      testDate,
      effort1minAvgPower,
      effort1minMaxHR,
      effort2minAvgPower,
      effort2minMaxHR,
      effort5minAvgPower,
      effort5minMaxHR,
      notes: notes || undefined,
    });
  };

  const isValid = testDate && (effort1minAvgPower || effort2minAvgPower || effort5minAvgPower);

  const EffortSection = ({
    duration,
    avgPower,
    setAvgPower,
    maxHR,
    setMaxHR,
    descKey,
  }: {
    duration: string;
    avgPower: number | undefined;
    setAvgPower: (val: number | undefined) => void;
    maxHR: number | undefined;
    setMaxHR: (val: number | undefined) => void;
    descKey: string;
  }) => (
    <Box bg={sectionBg} p={4} borderRadius="lg">
      <Heading size="sm" mb={1}>{duration} Effort</Heading>
      <Text fontSize="sm" color={labelColor} mb={4}>
        {t(descKey)}
      </Text>
      <HStack spacing={4}>
        <FormControl flex={1}>
          <FormLabel fontSize="sm">{t('assessment.fields.avgPower')}</FormLabel>
          <InputGroup size="sm">
            <NumberInput
              value={avgPower || ''}
              onChange={(_, val) => setAvgPower(val || undefined)}
              min={0}
              max={1500}
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
          <FormLabel fontSize="sm">{t('assessment.fields.maxHR')}</FormLabel>
          <InputGroup size="sm">
            <NumberInput
              value={maxHR || ''}
              onChange={(_, val) => setMaxHR(val || undefined)}
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
  );

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

        {/* 1 Minute Effort */}
        <EffortSection
          duration="1'"
          avgPower={effort1minAvgPower}
          setAvgPower={setEffort1minAvgPower}
          maxHR={effort1minMaxHR}
          setMaxHR={setEffort1minMaxHR}
          descKey="assessment.fields.effort1minAvgPowerDesc"
        />

        {/* 2 Minute Effort */}
        <EffortSection
          duration="2'"
          avgPower={effort2minAvgPower}
          setAvgPower={setEffort2minAvgPower}
          maxHR={effort2minMaxHR}
          setMaxHR={setEffort2minMaxHR}
          descKey="assessment.fields.effort2minAvgPowerDesc"
        />

        {/* 5 Minute Effort */}
        <EffortSection
          duration="5'"
          avgPower={effort5minAvgPower}
          setAvgPower={setEffort5minAvgPower}
          maxHR={effort5minMaxHR}
          setMaxHR={setEffort5minMaxHR}
          descKey="assessment.fields.effort5minAvgPowerDesc"
        />

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
