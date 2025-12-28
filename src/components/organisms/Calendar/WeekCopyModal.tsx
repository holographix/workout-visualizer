import { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  VStack,
  Text,
  RadioGroup,
  Radio,
  Stack,
  Badge,
  Box,
  Flex,
  useColorModeValue,
  Spinner,
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';

interface WeekCopyModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceAthlete: {
    id: string;
    name: string;
  };
  targetAthlete: {
    id: string;
    name: string;
  };
  sourceWorkoutCount: number;
  targetWorkoutCount: number;
  weekLabel: string; // e.g., "March 18-24, 2024"
  onConfirm: (strategy: 'merge' | 'overwrite') => Promise<void>;
  isLoading?: boolean;
}

export function WeekCopyModal({
  isOpen,
  onClose,
  sourceAthlete,
  targetAthlete,
  sourceWorkoutCount,
  targetWorkoutCount,
  weekLabel,
  onConfirm,
  isLoading = false,
}: WeekCopyModalProps) {
  const { t } = useTranslation();
  const [strategy, setStrategy] = useState<'merge' | 'overwrite'>('merge');

  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const warningBg = useColorModeValue('orange.50', 'orange.900');

  const handleConfirm = async () => {
    await onConfirm(strategy);
  };

  const mergeTotal = targetWorkoutCount + sourceWorkoutCount;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" isCentered closeOnOverlayClick={!isLoading}>
      <ModalOverlay />
      <ModalContent data-testid="week-copy-modal">
        <ModalHeader>{t('athleteComparison.weekCopyModal.title', { athlete: targetAthlete.name })}</ModalHeader>
        <ModalBody>
          <VStack spacing={4} align="stretch">
            {/* Source info */}
            <Box>
              <Text fontSize="sm" fontWeight="semibold" mb={1}>
                {t('athleteComparison.weekCopyModal.copyingFrom')}
              </Text>
              <Flex align="center" gap={2}>
                <Badge colorScheme="blue">🔵</Badge>
                <Text>{sourceAthlete.name}</Text>
              </Flex>
              <Text fontSize="sm" color="gray.600">
                {t('athleteComparison.weekCopyModal.weekWithWorkouts', {
                  week: weekLabel,
                  count: sourceWorkoutCount
                })}
              </Text>
            </Box>

            {/* Target info */}
            <Box>
              <Text fontSize="sm" fontWeight="semibold" mb={1}>
                {t('athleteComparison.weekCopyModal.to')}
              </Text>
              <Flex align="center" gap={2}>
                <Badge colorScheme="green">🟢</Badge>
                <Text>{targetAthlete.name}</Text>
              </Flex>
              <Text fontSize="sm" color="gray.600">
                {t('athleteComparison.weekCopyModal.week', { week: weekLabel })}
              </Text>
            </Box>

            {/* Warning */}
            <Box
              p={3}
              borderWidth="1px"
              borderColor={borderColor}
              borderRadius="md"
              bg={warningBg}
            >
              <Flex align="center" gap={2}>
                <Text fontSize="md">⚠️</Text>
                <Text fontSize="sm" fontWeight="semibold">
                  {t('athleteComparison.weekCopyModal.targetHasWorkouts', { count: targetWorkoutCount })}
                </Text>
              </Flex>
            </Box>

            {/* Strategy selection */}
            <Box>
              <Text fontSize="sm" fontWeight="semibold" mb={3}>
                {t('athleteComparison.weekCopyModal.howToProceed')}
              </Text>
              <RadioGroup value={strategy} onChange={(val) => setStrategy(val as 'merge' | 'overwrite')}>
                <Stack spacing={3}>
                  <Radio value="merge" data-testid="merge-radio">
                    <VStack align="start" spacing={0}>
                      <Text fontWeight="medium">{t('athleteComparison.weekCopyModal.merge')}</Text>
                      <Text fontSize="sm" color="gray.600">
                        {t('athleteComparison.weekCopyModal.mergeDescription', {
                          count: sourceWorkoutCount,
                          total: mergeTotal
                        })}
                      </Text>
                    </VStack>
                  </Radio>
                  <Radio value="overwrite" data-testid="overwrite-radio">
                    <VStack align="start" spacing={0}>
                      <Text fontWeight="medium">{t('athleteComparison.weekCopyModal.overwrite')}</Text>
                      <Text fontSize="sm" color="gray.600">
                        {t('athleteComparison.weekCopyModal.overwriteDescription', {
                          count: sourceWorkoutCount,
                          existing: targetWorkoutCount
                        })}
                      </Text>
                    </VStack>
                  </Radio>
                </Stack>
              </RadioGroup>
            </Box>

            {/* Loading state */}
            {isLoading && (
              <Flex align="center" gap={2} justify="center" p={4}>
                <Spinner size="sm" />
                <Text fontSize="sm" color="gray.600">
                  {t('athleteComparison.weekCopyModal.copyingWorkouts', { count: sourceWorkoutCount })}
                </Text>
              </Flex>
            )}
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button
            variant="ghost"
            mr={3}
            onClick={onClose}
            data-testid="cancel-copy-button"
            isDisabled={isLoading}
          >
            {t('common.cancel')}
          </Button>
          <Button
            colorScheme="blue"
            onClick={handleConfirm}
            data-testid="confirm-copy-button"
            isLoading={isLoading}
            loadingText={t('athleteComparison.weekCopyModal.copying')}
          >
            {t('athleteComparison.weekCopyModal.confirmCopy')}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
