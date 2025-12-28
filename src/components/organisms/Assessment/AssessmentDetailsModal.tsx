/**
 * AssessmentDetailsModal
 * Read-only modal for viewing completed 2-day assessment details
 */
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  VStack,
  HStack,
  Text,
  Heading,
  Box,
  Divider,
  Badge,
  useColorModeValue,
  Icon,
} from '@chakra-ui/react';
import { Mountain } from 'lucide-react';
import { format } from 'date-fns';
import type { Assessment } from '../../../types/assessment';

interface AssessmentDetailsModalProps {
  assessment: Assessment | null;
  isOpen: boolean;
  onClose: () => void;
}

export function AssessmentDetailsModal({
  assessment,
  isOpen,
  onClose,
}: AssessmentDetailsModalProps) {
  if (!assessment) return null;

  const bgColor = useColorModeValue('gray.50', 'gray.700');

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <HStack>
            <Icon as={Mountain} boxSize={6} color="brand.500" />
            <Text>2-Day Assessment Details</Text>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <VStack align="stretch" spacing={6}>
            {/* Header Info */}
            <HStack justify="space-between">
              <Box>
                <Text fontSize="sm" color="gray.500">
                  Test Completed
                </Text>
                <Text fontWeight="semibold">
                  {assessment.day2CompletedAt
                    ? format(new Date(assessment.day2CompletedAt), 'MMMM d, yyyy')
                    : '--'}
                </Text>
              </Box>
              <Badge colorScheme="green" fontSize="sm">
                {assessment.testStatus}
              </Badge>
            </HStack>

            <Divider />

            {/* Calculated Results */}
            <Box bg={bgColor} p={4} borderRadius="lg">
              <Heading size="sm" mb={3}>
                Calculated Results
              </Heading>
              <VStack align="stretch" spacing={2}>
                <HStack justify="space-between">
                  <Text fontSize="sm">Estimated FTP</Text>
                  <Text fontWeight="bold">
                    {assessment.estimatedFTP ? `${assessment.estimatedFTP}W` : '--'}
                  </Text>
                </HStack>
                <HStack justify="space-between">
                  <Text fontSize="sm">Max HR</Text>
                  <Text fontWeight="bold">
                    {assessment.maxHR ? `${assessment.maxHR} bpm` : '--'}
                  </Text>
                </HStack>
              </VStack>
            </Box>

            {/* Day 1 Results */}
            <Box bg={bgColor} p={4} borderRadius="lg">
              <Heading size="sm" mb={3}>
                Day 1: Power Profile (1'/2'/5')
              </Heading>
              <VStack align="stretch" spacing={3}>
                {/* 1' Effort */}
                <Box>
                  <Text fontSize="xs" color="gray.500" mb={1}>
                    1 Minute Effort
                  </Text>
                  <HStack justify="space-between">
                    <Text fontSize="sm">Avg Power:</Text>
                    <Text fontWeight="semibold">
                      {assessment.effort1minAvgPower ? `${assessment.effort1minAvgPower}W` : '--'}
                    </Text>
                  </HStack>
                  <HStack justify="space-between">
                    <Text fontSize="sm">Max HR:</Text>
                    <Text fontWeight="semibold">
                      {assessment.effort1minMaxHR ? `${assessment.effort1minMaxHR} bpm` : '--'}
                    </Text>
                  </HStack>
                </Box>

                {/* 2' Effort */}
                <Box>
                  <Text fontSize="xs" color="gray.500" mb={1}>
                    2 Minute Effort
                  </Text>
                  <HStack justify="space-between">
                    <Text fontSize="sm">Avg Power:</Text>
                    <Text fontWeight="semibold">
                      {assessment.effort2minAvgPower ? `${assessment.effort2minAvgPower}W` : '--'}
                    </Text>
                  </HStack>
                  <HStack justify="space-between">
                    <Text fontSize="sm">Max HR:</Text>
                    <Text fontWeight="semibold">
                      {assessment.effort2minMaxHR ? `${assessment.effort2minMaxHR} bpm` : '--'}
                    </Text>
                  </HStack>
                </Box>

                {/* 5' Effort */}
                <Box>
                  <Text fontSize="xs" color="gray.500" mb={1}>
                    5 Minute Effort
                  </Text>
                  <HStack justify="space-between">
                    <Text fontSize="sm">Avg Power:</Text>
                    <Text fontWeight="semibold">
                      {assessment.effort5minAvgPower ? `${assessment.effort5minAvgPower}W` : '--'}
                    </Text>
                  </HStack>
                  <HStack justify="space-between">
                    <Text fontSize="sm">Max HR:</Text>
                    <Text fontWeight="semibold">
                      {assessment.effort5minMaxHR ? `${assessment.effort5minMaxHR} bpm` : '--'}
                    </Text>
                  </HStack>
                </Box>
              </VStack>
            </Box>

            {/* Day 2 Results */}
            <Box bg={bgColor} p={4} borderRadius="lg">
              <Heading size="sm" mb={3}>
                Day 2: Sprint + Endurance (5"/12')
              </Heading>
              <VStack align="stretch" spacing={3}>
                {/* 5" Sprint */}
                <Box>
                  <Text fontSize="xs" color="gray.500" mb={1}>
                    5 Second Sprint
                  </Text>
                  <HStack justify="space-between">
                    <Text fontSize="sm">Peak Power:</Text>
                    <Text fontWeight="semibold">
                      {assessment.sprint5secPeakPower ? `${assessment.sprint5secPeakPower}W` : '--'}
                    </Text>
                  </HStack>
                  <HStack justify="space-between">
                    <Text fontSize="sm">Max HR:</Text>
                    <Text fontWeight="semibold">
                      {assessment.sprint5secMaxHR ? `${assessment.sprint5secMaxHR} bpm` : '--'}
                    </Text>
                  </HStack>
                </Box>

                {/* 12' Climb */}
                <Box>
                  <Text fontSize="xs" color="gray.500" mb={1}>
                    12 Minute Climb
                  </Text>
                  <HStack justify="space-between">
                    <Text fontSize="sm">Avg Power:</Text>
                    <Text fontWeight="semibold">
                      {assessment.climb12minAvgPower ? `${assessment.climb12minAvgPower}W` : '--'}
                    </Text>
                  </HStack>
                  <HStack justify="space-between">
                    <Text fontSize="sm">Max HR:</Text>
                    <Text fontWeight="semibold">
                      {assessment.climb12minMaxHR ? `${assessment.climb12minMaxHR} bpm` : '--'}
                    </Text>
                  </HStack>
                </Box>
              </VStack>
            </Box>

            {/* Notes */}
            {assessment.notes && (
              <Box>
                <Heading size="sm" mb={2}>
                  Notes
                </Heading>
                <Text fontSize="sm" whiteSpace="pre-wrap">
                  {assessment.notes}
                </Text>
              </Box>
            )}
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
