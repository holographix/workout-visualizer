/**
 * Day1Form
 * Form for Day 1 of 2-day assessment protocol
 *
 * Day 1: 1'/2'/5' efforts on 6-7% gradient
 * All efforts record AVERAGE power over the duration
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
import type { Day1Data } from '../../../types/assessment';

interface Day1FormProps {
  onSubmit: (data: Day1Data) => Promise<void>;
  isLoading: boolean;
  initialValues?: Day1Data;
}

export function Day1Form({ onSubmit, isLoading, initialValues }: Day1FormProps) {
  const { t } = useTranslation();
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
      effort1minAvgPower,
      effort1minMaxHR,
      effort2minAvgPower,
      effort2minMaxHR,
      effort5minAvgPower,
      effort5minMaxHR,
      notes: notes || undefined,
    });
  };

  const isValid = effort1minAvgPower || effort2minAvgPower || effort5minAvgPower;

  return (
    <form onSubmit={handleSubmit}>
      <VStack spacing={6} align="stretch">
        {/* 1 Minute Effort */}
        <Box bg={sectionBg} p={4} borderRadius="lg">
          <Heading size="sm" mb={1}>1' Effort</Heading>
          <Text fontSize="sm" color={labelColor} mb={4}>
            Maximum sustainable effort for 1 minute
          </Text>
          <HStack spacing={4}>
            <FormControl flex={1}>
              <FormLabel fontSize="sm">Avg Power</FormLabel>
              <InputGroup size="sm">
                <NumberInput
                  value={effort1minAvgPower || ''}
                  onChange={(_, val) => setEffort1minAvgPower(val || undefined)}
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
                  value={effort1minMaxHR || ''}
                  onChange={(_, val) => setEffort1minMaxHR(val || undefined)}
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

        {/* 2 Minute Effort */}
        <Box bg={sectionBg} p={4} borderRadius="lg">
          <Heading size="sm" mb={1}>2' Effort</Heading>
          <Text fontSize="sm" color={labelColor} mb={4}>
            Maximum sustainable effort for 2 minutes
          </Text>
          <HStack spacing={4}>
            <FormControl flex={1}>
              <FormLabel fontSize="sm">Avg Power</FormLabel>
              <InputGroup size="sm">
                <NumberInput
                  value={effort2minAvgPower || ''}
                  onChange={(_, val) => setEffort2minAvgPower(val || undefined)}
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
                  value={effort2minMaxHR || ''}
                  onChange={(_, val) => setEffort2minMaxHR(val || undefined)}
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

        {/* 5 Minute Effort */}
        <Box bg={sectionBg} p={4} borderRadius="lg">
          <Heading size="sm" mb={1}>5' Effort</Heading>
          <Text fontSize="sm" color={labelColor} mb={4}>
            Maximum sustainable effort for 5 minutes
          </Text>
          <HStack spacing={4}>
            <FormControl flex={1}>
              <FormLabel fontSize="sm">Avg Power</FormLabel>
              <InputGroup size="sm">
                <NumberInput
                  value={effort5minAvgPower || ''}
                  onChange={(_, val) => setEffort5minAvgPower(val || undefined)}
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
                  value={effort5minMaxHR || ''}
                  onChange={(_, val) => setEffort5minMaxHR(val || undefined)}
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
          Complete Day 1
        </Button>
      </VStack>
    </form>
  );
}
