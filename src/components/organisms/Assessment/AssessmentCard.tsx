/**
 * AssessmentCard
 * Dashboard card for starting fitness assessments
 * Shows monthly reminder when last assessment is > 30 days old
 *
 * Business Rule: Assessments can only be edited/deleted on the day they were created
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
  StatHelpText,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Divider,
  IconButton,
  Tooltip,
  useToast,
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { Activity, Zap, Clock, TrendingUp, AlertTriangle, History, Pencil, Trash2 } from 'lucide-react';
import { differenceInDays, isToday } from 'date-fns';
import { useRef } from 'react';
import { useAssessments } from '../../../hooks/useAssessments';
import { AssessmentModal } from './AssessmentModal';
import type { Assessment } from '../../../types/assessment';

/**
 * Check if an assessment can be edited/deleted
 * Business Rule: Only assessments created today can be modified
 */
function canModifyAssessment(assessment: Assessment): boolean {
  return isToday(new Date(assessment.createdAt));
}

interface AssessmentCardProps {
  athleteId: string;
}

export function AssessmentCard({ athleteId }: AssessmentCardProps) {
  const { t } = useTranslation();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    assessments,
    latestAssessment,
    isLoading,
    isSaving,
    fetchAssessments,
    fetchLatestAssessment,
    deleteAssessment,
  } = useAssessments({ athleteId });

  // Edit/delete state
  const [editingAssessment, setEditingAssessment] = useState<Assessment | null>(null);
  const [deletingAssessment, setDeletingAssessment] = useState<Assessment | null>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  const handleSave = () => {
    fetchAssessments();
    fetchLatestAssessment();
    setEditingAssessment(null);
  };

  const handleEdit = (assessment: Assessment) => {
    setEditingAssessment(assessment);
    onOpen();
  };

  const handleNewAssessment = () => {
    setEditingAssessment(null);
    onOpen();
  };

  const handleDelete = async () => {
    if (!deletingAssessment) return;

    try {
      await deleteAssessment(deletingAssessment.id);
      toast({
        title: t('assessment.deleted', 'Assessment deleted'),
        status: 'success',
        duration: 3000,
      });
      setDeletingAssessment(null);
    } catch (error) {
      toast({
        title: t('common.error'),
        description: error instanceof Error ? error.message : 'Failed to delete',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const iconColor = useColorModeValue('brand.500', 'brand.300');
  const mutedColor = useColorModeValue('gray.500', 'gray.400');
  const warningBg = useColorModeValue('orange.50', 'orange.900');

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString();
  };

  // Check if assessment is due (no assessment or > 30 days old)
  const assessmentDueInfo = useMemo(() => {
    if (!latestAssessment) {
      return { isDue: true, daysOverdue: null, message: 'first' };
    }

    const daysSinceLastTest = differenceInDays(new Date(), new Date(latestAssessment.testDate));
    const MONTHLY_THRESHOLD = 30;

    if (daysSinceLastTest > MONTHLY_THRESHOLD) {
      return {
        isDue: true,
        daysOverdue: daysSinceLastTest - MONTHLY_THRESHOLD,
        daysSinceLast: daysSinceLastTest,
        message: 'overdue',
      };
    }

    return { isDue: false, daysOverdue: null, daysSinceLast: daysSinceLastTest };
  }, [latestAssessment]);

  return (
    <>
      <Box
        bg={bgColor}
        borderRadius="xl"
        borderWidth="1px"
        borderColor={assessmentDueInfo.isDue ? 'orange.300' : borderColor}
        p={5}
        h="full"
      >
        <VStack align="stretch" spacing={4}>
          {/* Monthly Reminder Banner */}
          {assessmentDueInfo.isDue && (
            <Alert
              status="warning"
              variant="subtle"
              borderRadius="lg"
              bg={warningBg}
            >
              <AlertIcon as={AlertTriangle} />
              <Box flex="1">
                <AlertTitle fontSize="sm">
                  {assessmentDueInfo.message === 'first'
                    ? t('assessment.reminder.firstTest', 'Complete your first assessment')
                    : t('assessment.reminder.monthly', 'Time for your monthly assessment')}
                </AlertTitle>
                <AlertDescription fontSize="xs">
                  {assessmentDueInfo.message === 'first'
                    ? t('assessment.reminder.firstTestDesc', 'Your coach needs this data to create your training plan')
                    : t('assessment.reminder.monthlyDesc', {
                        days: assessmentDueInfo.daysSinceLast,
                        defaultValue: `Last test was {{days}} days ago. Fresh data helps your coach optimize your training.`
                      })}
                </AlertDescription>
              </Box>
              <Button
                size="sm"
                colorScheme="orange"
                onClick={handleNewAssessment}
              >
                {t('assessment.startNow', 'Start Now')}
              </Button>
            </Alert>
          )}

          {/* Header */}
          <HStack justify="space-between">
            <HStack spacing={2}>
              <Icon as={Activity} boxSize={5} color={iconColor} />
              <Heading size="sm">{t('assessment.title')}</Heading>
            </HStack>
            <Button
              size="sm"
              colorScheme="brand"
              leftIcon={<Zap size={16} />}
              onClick={handleNewAssessment}
            >
              {t('assessment.newAssessment')}
            </Button>
          </HStack>

          {/* Latest Result */}
          {latestAssessment ? (
            <LatestAssessmentDisplay
              assessment={latestAssessment}
              onEdit={() => handleEdit(latestAssessment)}
              onDelete={() => setDeletingAssessment(latestAssessment)}
            />
          ) : (
            <Box
              bg={useColorModeValue('gray.50', 'gray.700')}
              borderRadius="lg"
              p={4}
              textAlign="center"
            >
              <Text color={mutedColor} fontSize="sm">
                {t('assessment.noAssessments')}
              </Text>
            </Box>
          )}

          {/* Assessment History */}
          {assessments.length > 1 && (
            <>
              <Divider />
              <Box>
                <HStack spacing={2} mb={3}>
                  <Icon as={History} boxSize={4} color={mutedColor} />
                  <Text fontSize="sm" fontWeight="medium" color={mutedColor}>
                    {t('assessment.history', 'Previous Assessments')}
                  </Text>
                </HStack>
                <VStack spacing={2} align="stretch">
                  {assessments.slice(1, 4).map((assessment) => (
                    <AssessmentHistoryItem
                      key={assessment.id}
                      assessment={assessment}
                      onEdit={() => handleEdit(assessment)}
                      onDelete={() => setDeletingAssessment(assessment)}
                    />
                  ))}
                  {assessments.length > 4 && (
                    <Text fontSize="xs" color={mutedColor} textAlign="center">
                      {t('assessment.moreHistory', '+ {{count}} more', { count: assessments.length - 4 })}
                    </Text>
                  )}
                </VStack>
              </Box>
            </>
          )}
        </VStack>
      </Box>

      <AssessmentModal
        athleteId={athleteId}
        isOpen={isOpen}
        onClose={onClose}
        onSave={handleSave}
        editingAssessment={editingAssessment}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        isOpen={!!deletingAssessment}
        leastDestructiveRef={cancelRef}
        onClose={() => setDeletingAssessment(null)}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              {t('assessment.deleteConfirm.title', 'Delete Assessment')}
            </AlertDialogHeader>
            <AlertDialogBody>
              {t('assessment.deleteConfirm.message', 'Are you sure you want to delete this assessment? This action cannot be undone.')}
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={() => setDeletingAssessment(null)}>
                {t('common.cancel', 'Cancel')}
              </Button>
              <Button colorScheme="red" onClick={handleDelete} ml={3} isLoading={isSaving}>
                {t('common.delete', 'Delete')}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  );
}

interface AssessmentDisplayProps {
  assessment: Assessment;
  onEdit: () => void;
  onDelete: () => void;
}

function LatestAssessmentDisplay({ assessment, onEdit, onDelete }: AssessmentDisplayProps) {
  const { t } = useTranslation();
  const mutedColor = useColorModeValue('gray.500', 'gray.400');
  const bgColor = useColorModeValue('gray.50', 'gray.700');

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString();
  };

  const isSprint12 = assessment.testType === 'SPRINT_12MIN';
  const canModify = canModifyAssessment(assessment);

  return (
    <Box bg={bgColor} borderRadius="lg" p={4}>
      <HStack justify="space-between" mb={3}>
        <Badge colorScheme="brand">
          {isSprint12
            ? t('assessment.protocols.sprint12min.title')
            : t('assessment.protocols.power125min.title')}
        </Badge>
        <HStack spacing={2}>
          <HStack spacing={1} color={mutedColor} fontSize="sm">
            <Clock size={14} />
            <Text>{formatDate(assessment.testDate)}</Text>
          </HStack>
          {canModify && (
            <HStack spacing={1}>
              <Tooltip label={t('common.edit', 'Edit')}>
                <IconButton
                  aria-label={t('common.edit', 'Edit')}
                  icon={<Pencil size={14} />}
                  size="xs"
                  variant="ghost"
                  onClick={onEdit}
                />
              </Tooltip>
              <Tooltip label={t('common.delete', 'Delete')}>
                <IconButton
                  aria-label={t('common.delete', 'Delete')}
                  icon={<Trash2 size={14} />}
                  size="xs"
                  variant="ghost"
                  colorScheme="red"
                  onClick={onDelete}
                />
              </Tooltip>
            </HStack>
          )}
        </HStack>
      </HStack>

      <HStack spacing={6} justify="space-around">
        {assessment.estimatedFTP && (
          <Stat textAlign="center">
            <StatLabel fontSize="xs" color={mutedColor}>
              {t('assessment.estimatedFTP')}
            </StatLabel>
            <StatNumber fontSize="2xl" color="brand.500">
              {assessment.estimatedFTP}
              <Text as="span" fontSize="sm" fontWeight="normal">
                W
              </Text>
            </StatNumber>
          </Stat>
        )}

        {isSprint12 ? (
          <>
            {assessment.sprintPeakPower && (
              <Stat textAlign="center">
                <StatLabel fontSize="xs" color={mutedColor}>
                  {t('assessment.fields.peakPower')}
                </StatLabel>
                <StatNumber fontSize="lg">
                  {assessment.sprintPeakPower}
                  <Text as="span" fontSize="xs" fontWeight="normal">
                    W
                  </Text>
                </StatNumber>
              </Stat>
            )}
            {assessment.climb12AvgPower && (
              <Stat textAlign="center">
                <StatLabel fontSize="xs" color={mutedColor}>
                  12' {t('assessment.fields.avgPower')}
                </StatLabel>
                <StatNumber fontSize="lg">
                  {assessment.climb12AvgPower}
                  <Text as="span" fontSize="xs" fontWeight="normal">
                    W
                  </Text>
                </StatNumber>
              </Stat>
            )}
          </>
        ) : (
          <>
            {assessment.effort5minAvgPower && (
              <Stat textAlign="center">
                <StatLabel fontSize="xs" color={mutedColor}>
                  5' {t('assessment.fields.avgPower')}
                </StatLabel>
                <StatNumber fontSize="lg">
                  {assessment.effort5minAvgPower}
                  <Text as="span" fontSize="xs" fontWeight="normal">
                    W
                  </Text>
                </StatNumber>
              </Stat>
            )}
          </>
        )}
      </HStack>
    </Box>
  );
}

function AssessmentHistoryItem({ assessment, onEdit, onDelete }: AssessmentDisplayProps) {
  const { t } = useTranslation();
  const bgColor = useColorModeValue('gray.50', 'gray.700');
  const mutedColor = useColorModeValue('gray.500', 'gray.400');

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString();
  };

  const isSprint12 = assessment.testType === 'SPRINT_12MIN';
  const canModify = canModifyAssessment(assessment);

  return (
    <HStack
      bg={bgColor}
      borderRadius="md"
      p={3}
      justify="space-between"
      fontSize="sm"
    >
      <HStack spacing={3}>
        <Text color={mutedColor} fontSize="xs">
          {formatDate(assessment.testDate)}
        </Text>
        <Text fontWeight="medium">
          {isSprint12
            ? t('assessment.protocols.sprint12min.short', 'Sprint+12\'')
            : t('assessment.protocols.power125min.short', '1\'/2\'/5\'')}
        </Text>
      </HStack>
      <HStack spacing={2}>
        {assessment.estimatedFTP && (
          <HStack spacing={1}>
            <Text color="brand.500" fontWeight="semibold">
              {assessment.estimatedFTP}
            </Text>
            <Text color={mutedColor} fontSize="xs">
              W FTP
            </Text>
          </HStack>
        )}
        {canModify && (
          <HStack spacing={0}>
            <Tooltip label={t('common.edit', 'Edit')}>
              <IconButton
                aria-label={t('common.edit', 'Edit')}
                icon={<Pencil size={12} />}
                size="xs"
                variant="ghost"
                onClick={onEdit}
              />
            </Tooltip>
            <Tooltip label={t('common.delete', 'Delete')}>
              <IconButton
                aria-label={t('common.delete', 'Delete')}
                icon={<Trash2 size={12} />}
                size="xs"
                variant="ghost"
                colorScheme="red"
                onClick={onDelete}
              />
            </Tooltip>
          </HStack>
        )}
      </HStack>
    </HStack>
  );
}
