/**
 * AssessmentModal
 * Wizard for 2-day assessment protocol
 *
 * Day 1: 1'/2'/5' efforts on 6-7% gradient
 * Day 2: 5" sprint + 12' climb on 6-7% gradient
 * Athletes have 15 days to complete Day 2 after Day 1
 */
import { useState, useEffect } from 'react';
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
  Button,
  useColorModeValue,
  useToast,
  Box,
  Icon,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Badge,
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { Mountain, Calendar, AlertTriangle } from 'lucide-react';
import { useAssessments } from '../../../hooks/useAssessments';
import { Day1Form } from './Day1Form';
import { Day2Form } from './Day2Form';
import type { Day1Data, Day2Data } from '../../../types/assessment';
import { formatDistanceToNow } from 'date-fns';

interface AssessmentModalProps {
  athleteId: string;
  isOpen: boolean;
  onClose: () => void;
  onSave?: () => void;
}

export function AssessmentModal({ athleteId, isOpen, onClose, onSave }: AssessmentModalProps) {
  const { t } = useTranslation();
  const toast = useToast();
  const {
    ongoingTest,
    startTest,
    completeDay1,
    startDay2,
    completeDay2,
    deleteAssessment,
    fetchOngoingTest,
    isSaving,
  } = useAssessments({ athleteId });

  const [isStarting, setIsStarting] = useState(false);

  const bgColor = useColorModeValue('gray.50', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // Refresh ongoing test when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchOngoingTest();
    }
  }, [isOpen, fetchOngoingTest]);

  const handleStartTest = async () => {
    try {
      setIsStarting(true);
      await startTest();
      toast({
        title: t('assessment.messages.testStarted'),
        description: t('assessment.messages.testStartedDesc'),
        status: 'success',
        duration: 5000,
      });
      fetchOngoingTest();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to start test',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsStarting(false);
    }
  };

  const handleDay1Submit = async (data: Day1Data) => {
    if (!ongoingTest) return;

    try {
      await completeDay1(ongoingTest.id, data);
      toast({
        title: t('assessment.messages.day1Complete'),
        description: t('assessment.messages.day1CompleteDesc'),
        status: 'success',
        duration: 5000,
      });
      fetchOngoingTest();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save Day 1',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const handleStartDay2 = async () => {
    if (!ongoingTest) return;

    try {
      setIsStarting(true);
      await startDay2(ongoingTest.id);
      toast({
        title: t('assessment.messages.day2Started'),
        description: t('assessment.messages.day2StartedDesc'),
        status: 'success',
        duration: 5000,
      });
      fetchOngoingTest();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to start Day 2',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsStarting(false);
    }
  };

  const handleDay2Submit = async (data: Day2Data) => {
    if (!ongoingTest) return;

    try {
      await completeDay2(ongoingTest.id, data);
      toast({
        title: t('assessment.messages.testComplete'),
        description: t('assessment.messages.testCompleteDesc'),
        status: 'success',
        duration: 5000,
      });
      onSave?.();
      onClose();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to complete Day 2',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const handleCancelTest = async () => {
    if (!ongoingTest) return;

    if (confirm(t('assessment.cancelTestConfirm'))) {
      try {
        await deleteAssessment(ongoingTest.id);
        toast({
          title: t('assessment.testCancelled'),
          status: 'info',
          duration: 3000,
        });
        fetchOngoingTest();
      } catch (error) {
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Failed to cancel test',
          status: 'error',
          duration: 3000,
        });
      }
    }
  };

  // Calculate days remaining
  const daysRemaining = ongoingTest?.expiresAt
    ? Math.ceil((new Date(ongoingTest.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  const isExpiringSoon = daysRemaining !== null && daysRemaining <= 3;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" closeOnOverlayClick={false}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <HStack>
            <Icon as={Mountain} boxSize={6} color="brand.500" />
            <Text>{t('assessment.protocol.title')}</Text>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <VStack spacing={6} align="stretch">
            {/* Protocol Description */}
            <Box bg={bgColor} p={4} borderRadius="lg">
              <Text fontSize="sm" color="gray.600">
                {t('assessment.protocol.description')}
              </Text>
              <Text fontSize="sm" color="gray.600" mt={2}>
                <strong>{t('assessment.protocol.gradient')}</strong>
              </Text>
              <Text fontSize="sm" color="gray.600" mt={1}>
                {t('assessment.protocol.expirationDays')}
              </Text>
            </Box>

            {/* No Ongoing Test - Show Start Button */}
            {!ongoingTest && (
              <VStack spacing={4}>
                <Heading size="md">{t('assessment.protocol.readyToStart')}</Heading>
                <Text fontSize="sm" color="gray.600" textAlign="center">
                  {t('assessment.protocol.day1Consists')}
                </Text>
                <Button
                  colorScheme="brand"
                  size="lg"
                  leftIcon={<Icon as={Mountain} />}
                  onClick={handleStartTest}
                  isLoading={isStarting}
                  w="full"
                >
                  {t('assessment.startNewTest')}
                </Button>
              </VStack>
            )}

            {/* Day 1 Pending - Show Form */}
            {ongoingTest?.testStatus === 'DAY1_PENDING' && (
              <VStack spacing={4} align="stretch">
                <Alert status="info" borderRadius="lg">
                  <AlertIcon />
                  <VStack align="start" spacing={1}>
                    <AlertTitle>{t('assessment.day1.title')}</AlertTitle>
                    <AlertDescription fontSize="sm">
                      {t('assessment.day1.description')}
                    </AlertDescription>
                  </VStack>
                </Alert>
                <Day1Form
                  onSubmit={handleDay1Submit}
                  isLoading={isSaving}
                  initialValues={{
                    effort1minAvgPower: ongoingTest.effort1minAvgPower ?? undefined,
                    effort1minMaxHR: ongoingTest.effort1minMaxHR ?? undefined,
                    effort2minAvgPower: ongoingTest.effort2minAvgPower ?? undefined,
                    effort2minMaxHR: ongoingTest.effort2minMaxHR ?? undefined,
                    effort5minAvgPower: ongoingTest.effort5minAvgPower ?? undefined,
                    effort5minMaxHR: ongoingTest.effort5minMaxHR ?? undefined,
                    notes: ongoingTest.notes ?? undefined,
                  }}
                />
                <Button variant="ghost" onClick={handleCancelTest} size="sm">
                  {t('assessment.cancelTest')}
                </Button>
              </VStack>
            )}

            {/* Day 1 Complete - Show Start Day 2 Button */}
            {ongoingTest?.testStatus === 'DAY1_COMPLETED' && (
              <VStack spacing={4} align="stretch">
                <Alert status="success" borderRadius="lg">
                  <AlertIcon />
                  <VStack align="start" spacing={1} flex={1}>
                    <AlertTitle>{t('assessment.messages.day1Complete')}</AlertTitle>
                    <AlertDescription fontSize="sm">
                      {ongoingTest.day1CompletedAt ? formatDistanceToNow(new Date(ongoingTest.day1CompletedAt), { addSuffix: true }) : ''}
                    </AlertDescription>
                  </VStack>
                </Alert>

                {isExpiringSoon && (
                  <Alert status="warning" borderRadius="lg">
                    <AlertIcon as={AlertTriangle} />
                    <VStack align="start" spacing={1}>
                      <AlertTitle>{t('assessment.messages.expiringSoon')}</AlertTitle>
                      <AlertDescription fontSize="sm">
                        {t('assessment.messages.onlyDaysRemaining', {
                          days: daysRemaining,
                          dayLabel: daysRemaining === 1 ? t('assessment.day') : t('assessment.days')
                        })}
                      </AlertDescription>
                    </VStack>
                  </Alert>
                )}

                <Box bg={bgColor} p={4} borderRadius="lg">
                  <HStack justify="space-between" mb={3}>
                    <Text fontSize="sm" fontWeight="semibold">{t('assessment.day2.title')}</Text>
                    {daysRemaining !== null && (
                      <Badge colorScheme={isExpiringSoon ? 'orange' : 'green'}>
                        {daysRemaining} {t(daysRemaining === 1 ? 'assessment.day' : 'assessment.days')}
                      </Badge>
                    )}
                  </HStack>
                  <Text fontSize="sm" color="gray.600" mb={4}>
                    {t('assessment.day2.description')}
                  </Text>
                  <Button
                    colorScheme="brand"
                    size="lg"
                    leftIcon={<Icon as={Calendar} />}
                    onClick={handleStartDay2}
                    isLoading={isStarting}
                    w="full"
                  >
                    {t('assessment.day2.startDay2')}
                  </Button>
                </Box>

                <Button variant="ghost" onClick={handleCancelTest} size="sm">
                  {t('assessment.cancelTest')}
                </Button>
              </VStack>
            )}

            {/* Day 2 Pending - Show Form */}
            {ongoingTest?.testStatus === 'DAY2_PENDING' && (
              <VStack spacing={4} align="stretch">
                <Alert status="info" borderRadius="lg">
                  <AlertIcon />
                  <VStack align="start" spacing={1}>
                    <AlertTitle>{t('assessment.day2.title')}</AlertTitle>
                    <AlertDescription fontSize="sm">
                      {t('assessment.day2.description')}
                    </AlertDescription>
                  </VStack>
                </Alert>
                <Day2Form
                  onSubmit={handleDay2Submit}
                  isLoading={isSaving}
                  initialValues={{
                    sprint5secPeakPower: ongoingTest.sprint5secPeakPower ?? undefined,
                    sprint5secMaxHR: ongoingTest.sprint5secMaxHR ?? undefined,
                    climb12minAvgPower: ongoingTest.climb12minAvgPower ?? undefined,
                    climb12minMaxHR: ongoingTest.climb12minMaxHR ?? undefined,
                    notes: ongoingTest.notes ?? undefined,
                  }}
                />
                <Button variant="ghost" onClick={handleCancelTest} size="sm">
                  {t('assessment.cancelTest')}
                </Button>
              </VStack>
            )}

            {/* Expired Test */}
            {ongoingTest?.testStatus === 'EXPIRED' && (
              <Alert status="error" borderRadius="lg">
                <AlertIcon />
                <VStack align="start" spacing={1}>
                  <AlertTitle>{t('assessment.messages.testExpired')}</AlertTitle>
                  <AlertDescription fontSize="sm">
                    {t('assessment.messages.testExpiredDesc')}
                  </AlertDescription>
                </VStack>
              </Alert>
            )}
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
