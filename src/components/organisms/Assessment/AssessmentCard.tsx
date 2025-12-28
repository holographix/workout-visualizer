/**
 * AssessmentCard
 * Dashboard card for 2-day assessment protocol
 * Shows ongoing test status or latest completed assessment
 */
import { useMemo, useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Heading,
  Button,
  Badge,
  useColorModeValue,
  useDisclosure,
  Icon,
  Stat,
  StatLabel,
  StatNumber,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Divider,
  useToast,
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
  Progress,
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { Activity, Mountain, Calendar, AlertTriangle, Trash2 } from 'lucide-react';
import { differenceInDays, format } from 'date-fns';
import { useRef } from 'react';
import { useAssessments } from '../../../hooks/useAssessments';
import { AssessmentModal } from './AssessmentModal';

interface AssessmentCardProps {
  athleteId: string;
}

export function AssessmentCard({ athleteId }: AssessmentCardProps) {
  const { t } = useTranslation();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    latestAssessment,
    ongoingTest,
    deleteAssessment,
    fetchAssessments,
    fetchOngoingTest,
  } = useAssessments({ athleteId });

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // Calculate days since last test
  const daysSinceTest = latestAssessment?.day2CompletedAt
    ? differenceInDays(new Date(), new Date(latestAssessment.day2CompletedAt))
    : null;

  const isOverdue = daysSinceTest !== null && daysSinceTest > 30;

  // Calculate days remaining for ongoing test
  const daysRemaining = ongoingTest?.expiresAt
    ? Math.ceil((new Date(ongoingTest.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  const isExpiringSoon = daysRemaining !== null && daysRemaining <= 3;

  const handleDelete = async () => {
    if (!deletingId) return;

    try {
      await deleteAssessment(deletingId);
      toast({
        title: t('assessment.testCancelled'),
        status: 'info',
        duration: 3000,
      });
      setDeletingId(null);
      fetchAssessments();
      fetchOngoingTest();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to cancel test',
        status: 'error',
        duration: 3000,
      });
    }
  };

  return (
    <>
      <Box bg={bgColor} borderWidth="1px" borderColor={borderColor} borderRadius="xl" p={6}>
        <VStack align="stretch" spacing={4}>
          <HStack justify="space-between">
            <HStack spacing={2}>
              <Icon as={Mountain} boxSize={6} color="brand.500" />
              <Heading size="md">{t('assessment.assessmentTest')}</Heading>
            </HStack>
          </HStack>

          {/* Ongoing Test Status */}
          {ongoingTest && (
            <Alert
              status={
                ongoingTest.testStatus === 'DAY1_PENDING'
                  ? 'info'
                  : ongoingTest.testStatus === 'DAY1_COMPLETED' && isExpiringSoon
                    ? 'warning'
                    : 'success'
              }
              borderRadius="lg"
            >
              <AlertIcon />
              <VStack align="start" spacing={1} flex={1}>
                <AlertTitle>
                  {ongoingTest.testStatus === 'DAY1_PENDING' && t('assessment.status.day1InProgress')}
                  {ongoingTest.testStatus === 'DAY1_COMPLETED' && t('assessment.status.day1Complete')}
                  {ongoingTest.testStatus === 'DAY2_PENDING' && t('assessment.status.day2InProgress')}
                </AlertTitle>
                <AlertDescription fontSize="sm">
                  {ongoingTest.testStatus === 'DAY1_PENDING' && t('assessment.messages.completeDay1Efforts')}
                  {ongoingTest.testStatus === 'DAY1_COMPLETED' &&
                    t('assessment.messages.daysLeftToCompleteDay2', {
                      days: daysRemaining,
                      dayLabel: daysRemaining === 1 ? t('assessment.day') : t('assessment.days')
                    })}
                  {ongoingTest.testStatus === 'DAY2_PENDING' && t('assessment.messages.completeSprintAndClimb')}
                </AlertDescription>
              </VStack>
            </Alert>
          )}

          {/* Monthly Assessment Reminder */}
          {!ongoingTest && isOverdue && (
            <Alert status="warning" borderRadius="lg">
              <AlertIcon as={AlertTriangle} />
              <VStack align="start" spacing={1} flex={1}>
                <AlertTitle>{t('assessment.reminder.timeForNewTest')}</AlertTitle>
                <AlertDescription fontSize="sm">
                  {t('assessment.reminder.lastTestDaysAgo', { days: daysSinceTest })}
                </AlertDescription>
              </VStack>
            </Alert>
          )}

          {/* Latest Results */}
          {latestAssessment && (
            <>
              <Divider />
              <VStack align="stretch" spacing={3}>
                <Text fontSize="sm" color="gray.500">
                  {t('assessment.latestResults')}
                </Text>
                <HStack spacing={6}>
                  <Stat>
                    <StatLabel fontSize="xs">{t('assessment.estimatedFTP')}</StatLabel>
                    <StatNumber fontSize="2xl">
                      {latestAssessment.estimatedFTP ? `${latestAssessment.estimatedFTP}W` : '--'}
                    </StatNumber>
                  </Stat>
                  <Stat>
                    <StatLabel fontSize="xs">{t('assessment.maxHR')}</StatLabel>
                    <StatNumber fontSize="2xl">
                      {latestAssessment.maxHR ? `${latestAssessment.maxHR}` : '--'}
                    </StatNumber>
                  </Stat>
                </HStack>
                {latestAssessment.day2CompletedAt && (
                  <Text fontSize="xs" color="gray.500">
                    {t('assessment.testCompleted')}: {format(new Date(latestAssessment.day2CompletedAt), 'MMM d, yyyy')} ({t('assessment.daysAgo', { days: daysSinceTest })})
                  </Text>
                )}
              </VStack>
            </>
          )}

          <Button colorScheme="brand" onClick={onOpen} leftIcon={<Icon as={Activity} />}>
            {ongoingTest ? t('assessment.continueTest') : t('assessment.startNewTest')}
          </Button>

          {ongoingTest && (
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<Icon as={Trash2} />}
              onClick={() => setDeletingId(ongoingTest.id)}
              colorScheme="red"
            >
              {t('assessment.cancelTest')}
            </Button>
          )}
        </VStack>
      </Box>

      <AssessmentModal
        athleteId={athleteId}
        isOpen={isOpen}
        onClose={onClose}
        onSave={() => {
          fetchAssessments();
          fetchOngoingTest();
        }}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        isOpen={!!deletingId}
        leastDestructiveRef={cancelRef}
        onClose={() => setDeletingId(null)}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader>{t('assessment.cancelTest')}</AlertDialogHeader>
            <AlertDialogBody>
              {t('assessment.cancelTestConfirm')}
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={() => setDeletingId(null)}>
                {t('assessment.keepTest')}
              </Button>
              <Button colorScheme="red" onClick={handleDelete} ml={3}>
                {t('assessment.cancelTest')}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  );
}
