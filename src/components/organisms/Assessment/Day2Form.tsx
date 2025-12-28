/**
 * Day2Form
 * Form for Day 2 of 2-day assessment protocol
 *
 * Day 2: 5" sprint + 12' climb on 6-7% gradient
 * Sprint: PEAK power, Climb: AVERAGE power
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
import type { Day2Data } from '../../../types/assessment';

interface Day2FormProps {
  onSubmit: (data: Day2Data) => Promise<void>;
  isLoading: boolean;
  initialValues?: Day2Data;
}

export function Day2Form({ onSubmit, isLoading, initialValues }: Day2FormProps) {
  const { t } = useTranslation();
  const [sprint5secPeakPower, setSprint5secPeakPower] = useState<number | undefined>(initialValues?.sprint5secPeakPower);
  const [sprint5secMaxHR, setSprint5secMaxHR] = useState<number | undefined>(initialValues?.sprint5secMaxHR);
  const [climb12minAvgPower, setClimb12minAvgPower] = useState<number | undefined>(initialValues?.climb12minAvgPower);
  const [climb12minMaxHR, setClimb12minMaxHR] = useState<number | undefined>(initialValues?.climb12minMaxHR);
  const [notes, setNotes] = useState(initialValues?.notes || '');

  const labelColor = useColorModeValue('gray.600', 'gray.400');
  const sectionBg = useColorModeValue('gray.50', 'gray.700');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      sprint5secPeakPower,
      sprint5secMaxHR,
      climb12minAvgPower,
      climb12minMaxHR,
      notes: notes || undefined,
    });
  };

  const isValid = sprint5secPeakPower || climb12minAvgPower;

  return (
    <form onSubmit={handleSubmit}>
      <VStack spacing={6} align="stretch">
        {/* 5" Sprint Section */}
        <Box bg={sectionBg} p={4} borderRadius="lg">
          <Heading size="sm" mb={1}>5" Sprint</Heading>
          <Text fontSize="sm" color={labelColor} mb={4}>
            All-out maximum effort sprint - record PEAK power
          </Text>
          <HStack spacing={4}>
            <FormControl flex={1}>
              <FormLabel fontSize="sm">Peak Power</FormLabel>
              <InputGroup size="sm">
                <NumberInput
                  value={sprint5secPeakPower || ''}
                  onChange={(_, val) => setSprint5secPeakPower(val || undefined)}
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
                <InputRightAddon>W</InputRightAddon>
              </InputGroup>
            </FormControl>
            <FormControl flex={1}>
              <FormLabel fontSize="sm">Max HR</FormLabel>
              <InputGroup size="sm">
                <NumberInput
                  value={sprint5secMaxHR || ''}
                  onChange={(_, val) => setSprint5secMaxHR(val || undefined)}
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
                <InputRightAddon>bpm</InputRightAddon>
              </InputGroup>
            </FormControl>
          </HStack>
        </Box>

        {/* 12' Climb Section */}
        <Box bg={sectionBg} p={4} borderRadius="lg">
          <Heading size="sm" mb={1}>12' Climb</Heading>
          <Text fontSize="sm" color={labelColor} mb={4}>
            Sustained threshold effort climb - record AVERAGE power
          </Text>
          <HStack spacing={4}>
            <FormControl flex={1}>
              <FormLabel fontSize="sm">Avg Power</FormLabel>
              <InputGroup size="sm">
                <NumberInput
                  value={climb12minAvgPower || ''}
                  onChange={(_, val) => setClimb12minAvgPower(val || undefined)}
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
                <InputRightAddon>W</InputRightAddon>
              </InputGroup>
            </FormControl>
            <FormControl flex={1}>
              <FormLabel fontSize="sm">Max HR</FormLabel>
              <InputGroup size="sm">
                <NumberInput
                  value={climb12minMaxHR || ''}
                  onChange={(_, val) => setClimb12minMaxHR(val || undefined)}
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
                <InputRightAddon>bpm</InputRightAddon>
              </InputGroup>
            </FormControl>
          </HStack>
        </Box>

        {/* Notes */}
        <FormControl>
          <FormLabel>Notes</FormLabel>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional notes about the test..."
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
          Complete Day 2 & Finish Test
        </Button>
      </VStack>
    </form>
  );
}
