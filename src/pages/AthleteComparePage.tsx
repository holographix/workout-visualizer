import { useState, useEffect, useMemo } from 'react';
import { flushSync } from 'react-dom';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  GridItem,
  Heading,
  Text,
  Button,
  Flex,
  Badge,
  useToast,
  useBreakpointValue,
  VStack,
  IconButton,
  useDisclosure,
  HStack,
  useColorModeValue,
} from '@chakra-ui/react';
import { startOfWeek, addWeeks, subWeeks, format, addDays } from 'date-fns';
import { ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useUser } from '../contexts/UserContext';
import { useCalendarMonthAPI } from '../hooks/useCalendarAPI';
import { useAthleteSettings } from '../hooks/useCalendarAPI';
import { MultiWeekCalendar } from '../components/organisms/Calendar/MultiWeekCalendar';
import { AthleteSelectModal, type AthleteOption } from '../components/organisms/Calendar/AthleteSelectModal';
import { WeekCopyModal } from '../components/organisms/Calendar/WeekCopyModal';
import { api } from '../services/api';
import { relationshipsService, type CoachAthleteListItem } from '../services/relationships';

const WEEKS_TO_SHOW = 12;

export function AthleteComparePage() {
  const { t } = useTranslation();
  const { user } = useUser();
  const navigate = useNavigate();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  // Check if mobile (hide feature on small screens)
  const isMobile = useBreakpointValue({ base: true, lg: false });

  // URL params
  const leftAthleteId = searchParams.get('left');
  const rightAthleteId = searchParams.get('right');

  // Coach's athletes
  const [athletes, setAthletes] = useState<CoachAthleteListItem[]>([]);
  const [isLoadingAthletes, setIsLoadingAthletes] = useState(true);

  // Fetch athletes on mount
  useEffect(() => {
    if (user?.id) {
      relationshipsService.getAthletesForCoach(user.id, 'ACTIVE')
        .then(setAthletes)
        .catch(console.error)
        .finally(() => setIsLoadingAthletes(false));
    }
  }, [user?.id]);

  // Modal state
  const [isSelectModalOpen, setIsSelectModalOpen] = useState(false);

  // Week copy/paste mode state
  const [copyModeData, setCopyModeData] = useState<{
    sourceAthleteId: string;
    sourceWeekISO: string;
    sourceWeekLabel: string;
    sourceWorkoutCount: number;
  } | null>(null);

  // Week copy modal state (for merge/overwrite confirmation)
  const { isOpen: isWeekCopyModalOpen, onOpen: onOpenWeekCopyModal, onClose: onCloseWeekCopyModal } = useDisclosure();
  const [weekCopyData, setWeekCopyData] = useState<{
    sourceWeekISO: string;
    sourceWeekLabel: string;
    sourceWorkoutCount: number;
    targetWeekISO: string;
    targetWeekLabel: string;
    targetAthleteId: string;
    targetAthleteName: string;
    targetWorkoutCount: number;
  } | null>(null);
  const [isLoadingWeekCopy, setIsLoadingWeekCopy] = useState(false);

  // Track paste operation in progress (athlete + week specific)
  const [pastingTarget, setPastingTarget] = useState<{ athleteId: string; weekISO: string } | null>(null);

  // Navigation state (independent for each side)
  const [leftWeekStart, setLeftWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [rightWeekStart, setRightWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );

  // Calculate date ranges for 12-week view
  const leftStartDate = leftWeekStart;
  const leftEndDate = addDays(addWeeks(leftWeekStart, WEEKS_TO_SHOW - 1), 6);

  const rightStartDate = rightWeekStart;
  const rightEndDate = addDays(addWeeks(rightWeekStart, WEEKS_TO_SHOW - 1), 6);

  // Fetch left athlete data
  const {
    scheduledWorkouts: leftWorkouts,
    weekLoadingStates: leftLoadingStates,
    refetch: refetchLeft,
  } = useCalendarMonthAPI({
    athleteId: leftAthleteId || '',
    startDate: leftStartDate,
    endDate: leftEndDate,
  });

  const { unavailableDays: leftUnavailableDays } = useAthleteSettings(leftAthleteId || '');

  // Fetch right athlete data
  const {
    scheduledWorkouts: rightWorkouts,
    weekLoadingStates: rightLoadingStates,
    refetch: refetchRight,
  } = useCalendarMonthAPI({
    athleteId: rightAthleteId || '',
    startDate: rightStartDate,
    endDate: rightEndDate,
  });

  const { unavailableDays: rightUnavailableDays } = useAthleteSettings(rightAthleteId || '');

  // Get athlete details
  const leftAthlete = useMemo(
    () => athletes.find((a) => a.athlete.id === leftAthleteId)?.athlete,
    [athletes, leftAthleteId]
  );

  const rightAthlete = useMemo(
    () => athletes.find((a) => a.athlete.id === rightAthleteId)?.athlete,
    [athletes, rightAthleteId]
  );

  // Show modal if no athletes selected or invalid selection
  useEffect(() => {
    if (!isLoadingAthletes && athletes.length > 0) {
      if (!leftAthleteId || !rightAthleteId) {
        setIsSelectModalOpen(true);
      } else if (!leftAthlete || !rightAthlete) {
        // Invalid athlete ID
        toast({
          title: t('athleteComparison.athleteNotFound'),
          description: t('athleteComparison.athleteNotFoundDescription'),
          status: 'error',
          duration: 3000,
        });
        setSearchParams({});
        setIsSelectModalOpen(true);
      }
    }
  }, [leftAthleteId, rightAthleteId, athletes, isLoadingAthletes, leftAthlete, rightAthlete]);

  // Mobile restriction message
  if (isMobile) {
    return (
      <Box minH="100vh" display="flex" alignItems="center" justifyContent="center" p={8}>
        <VStack spacing={6} textAlign="center" maxW="md">
          <Heading size="lg">{t('athleteComparison.desktopOnly')}</Heading>
          <Text color="gray.600">
            {t('athleteComparison.desktopOnlyDescription')}
          </Text>
          <Button onClick={() => navigate('/dashboard')}>
            ← {t('athleteComparison.backToDashboard')}
          </Button>
        </VStack>
      </Box>
    );
  }

  const handleAthleteSelect = (left: string, right: string) => {
    setSearchParams({ left, right });
    setIsSelectModalOpen(false);
  };

  const handleRemoveWorkout = async (scheduledId: string, athleteId: string) => {
    console.log('🗑️ handleRemoveWorkout called:', { scheduledId, athleteId });

    if (!scheduledId) {
      console.error('❌ scheduledId is missing!');
      return;
    }

    try {
      console.log('🌐 API call: DELETE /api/calendar/scheduled/' + scheduledId);
      await api.delete(`/api/calendar/scheduled/${scheduledId}`);

      // Refresh the calendar that had the workout removed
      if (athleteId === leftAthleteId) {
        console.log('🔄 Refetching left calendar');
        refetchLeft();
      } else {
        console.log('🔄 Refetching right calendar');
        refetchRight();
      }

      toast({
        title: t('calendar.workoutRemoved'),
        status: 'success',
        duration: 2000,
      });
    } catch (error) {
      console.error('❌ Failed to remove workout:', error);
      toast({
        title: t('calendar.failedToRemove'),
        description: t('common.retry'),
        status: 'error',
        duration: 3000,
      });
    }
  };

  const handleCopyWorkout = async (scheduledId: string, targetDayIndex: number, targetAthleteId: string) => {
    console.log('🔄 handleCopyWorkout called:', { scheduledId, targetDayIndex, targetAthleteId });

    if (!targetAthleteId) {
      console.error('❌ targetAthleteId is missing!');
      toast({
        title: t('athleteComparison.error'),
        description: t('athleteComparison.targetAthleteNotSelected'),
        status: 'error',
        duration: 3000,
      });
      return;
    }

    try {
      // Calculate target week from absolute day index
      const weekOffset = Math.floor(targetDayIndex / 7);
      const relativeDayIndex = targetDayIndex % 7;
      const targetWeekStart = targetAthleteId === leftAthleteId
        ? addWeeks(leftWeekStart, weekOffset)
        : addWeeks(rightWeekStart, weekOffset);

      const targetWeekISO = format(targetWeekStart, 'yyyy-MM-dd');

      console.log('📊 Copy details:', { weekOffset, relativeDayIndex, targetWeekISO });

      // Get target athlete for unavailable day check
      const targetUnavailableDays = targetAthleteId === leftAthleteId
        ? leftUnavailableDays
        : rightUnavailableDays;

      console.log('🔍 Checking unavailable days:', { targetUnavailableDays, relativeDayIndex });

      // Check if target day is unavailable
      if (targetUnavailableDays.includes(relativeDayIndex)) {
        console.log('⚠️ Day is unavailable, returning early');
        const targetName = targetAthleteId === leftAthleteId
          ? leftAthlete?.fullName
          : rightAthlete?.fullName;
        const dayNames = [
          t('days.mon'),
          t('days.tue'),
          t('days.wed'),
          t('days.thu'),
          t('days.fri'),
          t('days.sat'),
          t('days.sun')
        ];

        toast({
          title: t('calendar.dayUnavailable'),
          description: t('athleteComparison.athleteNotAvailableOnDay', {
            athlete: targetName,
            day: dayNames[relativeDayIndex]
          }),
          status: 'warning',
          duration: 3000,
        });
        return;
      }

      console.log('✅ Day is available, proceeding with API call');

      // Call API to copy workout
      console.log('🌐 Making API call to copy-cross-athlete');
      const response = await api.post('/api/calendar/scheduled/copy-cross-athlete', {
        sourceScheduledId: scheduledId,
        targetAthleteId,
        targetWeekStart: targetWeekISO,
        targetDayIndex: relativeDayIndex,
        preserveOverrides: true,
      });

      console.log('✅ API call successful:', response);

      // Refresh target calendar
      if (targetAthleteId === leftAthleteId) {
        console.log('🔄 Refetching left calendar');
        refetchLeft();
      } else {
        console.log('🔄 Refetching right calendar');
        refetchRight();
      }

      const targetName = targetAthleteId === leftAthleteId
        ? leftAthlete?.fullName
        : rightAthlete?.fullName;
      const dayNames = [
        t('days.mon'),
        t('days.tue'),
        t('days.wed'),
        t('days.thu'),
        t('days.fri'),
        t('days.sat'),
        t('days.sun')
      ];

      console.log('🎉 Showing success toast');
      toast({
        title: t('calendar.workoutCopied'),
        description: t('athleteComparison.workoutCopiedTo', {
          athlete: targetName,
          day: dayNames[relativeDayIndex]
        }),
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      console.error('❌ API call failed:', error);
      toast({
        title: t('athleteComparison.failedToCopyWorkout'),
        description: t('common.retry'),
        status: 'error',
        duration: 3000,
      });
    }
  };

  // Handle initiating week copy - enters copy mode
  const handleCopyWeek = (weekISO: string, weekLabel: string, sourceWorkoutCount: number, sourceAthleteId: string) => {
    // INSTANT FEEDBACK: Force synchronous render for immediate visual response
    flushSync(() => {
      setCopyModeData({
        sourceAthleteId,
        sourceWeekISO: weekISO,
        sourceWeekLabel: weekLabel,
        sourceWorkoutCount,
      });
    });
  };

  // Handle pasting week on target calendar
  const handlePasteWeek = (targetWeekISO: string, targetWeekLabel: string, targetWorkoutCount: number, targetAthleteId: string) => {
    if (!copyModeData) return;

    const targetAthlete = targetAthleteId === leftAthleteId ? leftAthlete : rightAthlete;
    if (!targetAthlete) return;

    // If target week is empty, copy directly
    if (targetWorkoutCount === 0) {
      // Store copy data before clearing
      const sourceCopyData = { ...copyModeData };

      // INSTANT FEEDBACK: Force immediate synchronous render
      flushSync(() => {
        setCopyModeData(null);
        setPastingTarget({ athleteId: targetAthleteId, weekISO: targetWeekISO });
      });

      executeWeekCopy(
        sourceCopyData.sourceAthleteId,
        sourceCopyData.sourceWeekISO,
        targetAthleteId,
        targetWeekISO,
        'merge'
      ).then(() => {
        toast({
          title: t('athleteComparison.weekCopied'),
          description: t('athleteComparison.weekCopiedDescription', {
            count: sourceCopyData.sourceWorkoutCount,
            week: targetWeekLabel
          }),
          status: 'success',
          duration: 3000,
        });
      }).catch(() => {
        toast({
          title: t('athleteComparison.failedToCopyWeek'),
          description: t('common.retry'),
          status: 'error',
          duration: 3000,
        });
      }).finally(() => {
        // Remove loading state
        setPastingTarget(null);
      });
      return;
    }

    // Target week has workouts - show confirmation modal (keep copyModeData for now)
    setWeekCopyData({
      sourceWeekISO: copyModeData.sourceWeekISO,
      sourceWeekLabel: copyModeData.sourceWeekLabel,
      sourceWorkoutCount: copyModeData.sourceWorkoutCount,
      targetWeekISO,
      targetWeekLabel,
      targetAthleteId,
      targetAthleteName: targetAthlete.fullName || targetAthlete.email.split('@')[0],
      targetWorkoutCount,
    });
    onOpenWeekCopyModal();
  };

  // Execute week copy with strategy
  const executeWeekCopy = async (
    sourceAthleteId: string,
    sourceWeekISO: string,
    targetAthleteId: string,
    targetWeekISO: string,
    strategy: 'merge' | 'overwrite'
  ) => {
    setIsLoadingWeekCopy(true);
    try {
      await api.post('/api/calendar/week/copy-cross-athlete', {
        sourceAthleteId,
        sourceWeekStart: sourceWeekISO,
        targetAthleteId,
        targetWeekStart: targetWeekISO,
        strategy,
      });

      // Refresh target calendar
      if (targetAthleteId === leftAthleteId) {
        refetchLeft();
      } else {
        refetchRight();
      }
    } catch (error) {
      console.error('Failed to copy week:', error);
      throw error;
    } finally {
      setIsLoadingWeekCopy(false);
    }
  };

  // Handle week copy confirmation from modal
  const handleWeekCopyConfirm = async (strategy: 'merge' | 'overwrite') => {
    if (!weekCopyData || !copyModeData) return;

    // Store data before clearing
    const sourceCopyData = { ...copyModeData };
    const targetData = { ...weekCopyData };

    // INSTANT FEEDBACK: Force immediate synchronous render
    flushSync(() => {
      onCloseWeekCopyModal();
      setCopyModeData(null);
      setPastingTarget({ athleteId: targetData.targetAthleteId, weekISO: targetData.targetWeekISO });
    });

    try {
      await executeWeekCopy(
        sourceCopyData.sourceAthleteId,
        targetData.sourceWeekISO,
        targetData.targetAthleteId,
        targetData.targetWeekISO,
        strategy
      );

      if (strategy === 'merge') {
        toast({
          title: t('athleteComparison.workoutsMerged'),
          description: t('athleteComparison.workoutsMergedDescription', {
            count: targetData.sourceWorkoutCount,
            week: targetData.targetWeekLabel
          }),
          status: 'success',
          duration: 3000,
        });
      } else {
        toast({
          title: t('athleteComparison.weekOverwritten'),
          description: t('athleteComparison.weekOverwrittenDescription', {
            targetCount: targetData.targetWorkoutCount,
            week: targetData.targetWeekLabel
          }),
          status: 'success',
          duration: 3000,
        });
      }
    } catch (error) {
      toast({
        title: t('athleteComparison.failedToCopyWeek'),
        description: t('common.retry'),
        status: 'error',
        duration: 3000,
      });
    } finally {
      // Remove loading state
      setPastingTarget(null);
    }
  };

  // Prepare athlete options for modal
  const athleteOptions: AthleteOption[] = athletes.map((rel) => ({
    id: rel.athlete.id,
    fullName: rel.athlete.fullName || rel.athlete.email.split('@')[0],
    ftp: rel.athlete.ftp,
  }));

  if (!leftAthleteId || !rightAthleteId || !leftAthlete || !rightAthlete) {
    return (
      <AthleteSelectModal
        isOpen={isSelectModalOpen}
        onClose={() => setIsSelectModalOpen(false)}
        athletes={athleteOptions}
        selectedLeft={leftAthleteId}
        selectedRight={rightAthleteId}
        onConfirm={handleAthleteSelect}
      />
    );
  }

  const headerBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  return (
    <Box minH="100vh">
      {/* Header with Back Button */}
      <Box
        bg={headerBg}
        borderBottomWidth="1px"
        borderColor={borderColor}
        px={6}
        py={4}
        position="sticky"
        top={0}
        zIndex={100}
      >
        <HStack spacing={4}>
          <IconButton
            aria-label={t('athleteComparison.backToDashboard')}
            icon={<ArrowLeft size={20} />}
            variant="ghost"
            onClick={() => navigate('/dashboard')}
          />
          <Heading size="md">{t('athleteComparison.title')}</Heading>
        </HStack>
      </Box>

      <Box p={4}>
        <Grid templateColumns="1fr 1fr" gap={4} h="calc(100vh - 7rem)">
        {/* Left Calendar Panel */}
        <GridItem
          borderWidth="0 0 0 2px"
          borderColor="blue.500"
          borderStyle="solid"
          p={4}
          overflowY="hidden"
          data-testid="left-calendar-panel"
        >
          <VStack spacing={4} align="stretch" h="full">
            {/* Left Athlete Header */}
            <Flex justify="space-between" align="center">
              <Flex align="center" gap={2}>
                <Badge colorScheme="blue" data-testid="left-athlete-badge">
                  LEFT
                </Badge>
                <Heading size="md" data-testid="left-athlete-header">
                  {leftAthlete.fullName || leftAthlete.email.split('@')[0]}
                  {leftAthlete.ftp && (
                    <Text as="span" fontSize="sm" fontWeight="normal" color="gray.600" ml={2}>
                      FTP: {leftAthlete.ftp}W
                    </Text>
                  )}
                </Heading>
              </Flex>
            </Flex>

            {/* Left Navigation */}
            <Flex gap={2}>
              <IconButton
                aria-label="Previous week"
                icon={<ChevronLeft size={20} />}
                size="sm"
                onClick={() => setLeftWeekStart(subWeeks(leftWeekStart, 1))}
                data-testid="left-calendar-prev-week"
              />
              <Button
                size="sm"
                onClick={() => setLeftWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}
              >
                Today
              </Button>
              <IconButton
                aria-label="Next week"
                icon={<ChevronRight size={20} />}
                size="sm"
                onClick={() => setLeftWeekStart(addWeeks(leftWeekStart, 1))}
                data-testid="left-calendar-next-week"
              />
            </Flex>

            {/* Left Calendar */}
            <Box flex="1" overflowY="auto" data-testid="left-calendar">
              <MultiWeekCalendar
                scheduledWorkouts={leftWorkouts}
                athleteId={leftAthleteId || undefined}
                onRemoveWorkout={(scheduledId) => handleRemoveWorkout(scheduledId, leftAthleteId!)}
                onWorkoutClick={() => {}}
                onScheduleWorkout={() => {}}
                onMoveWorkout={() => {}}
                onCopyWorkout={(scheduledId, dayIndex) => handleCopyWorkout(scheduledId, dayIndex, leftAthleteId!)}
                onCopyWeek={(weekISO, weekLabel, workoutCount) => handleCopyWeek(weekISO, weekLabel, workoutCount, leftAthleteId!)}
                onPasteWeek={copyModeData && copyModeData.sourceAthleteId === rightAthleteId
                  ? (weekISO, weekLabel, workoutCount) => handlePasteWeek(weekISO, weekLabel, workoutCount, leftAthleteId!)
                  : undefined}
                copyWeekTooltip={`Copy week to ${rightAthlete?.fullName || 'other athlete'}`}
                isPasteMode={copyModeData?.sourceAthleteId === rightAthleteId}
                pasteSourceWeekISO={copyModeData?.sourceAthleteId === leftAthleteId ? copyModeData.sourceWeekISO : undefined}
                pastingWeeks={pastingTarget?.athleteId === leftAthleteId ? new Set([pastingTarget.weekISO]) : new Set()}
                startWeek={leftWeekStart}
                weeksCount={WEEKS_TO_SHOW}
                unavailableDays={leftUnavailableDays}
                weekLoadingStates={leftLoadingStates}
              />
            </Box>
          </VStack>
        </GridItem>

        {/* Right Calendar Panel */}
        <GridItem
          borderWidth="0 2px 0 0"
          borderColor="green.500"
          borderStyle="solid"
          p={4}
          overflowY="hidden"
          data-testid="right-calendar-panel"
        >
          <VStack spacing={4} align="stretch" h="full">
            {/* Right Athlete Header */}
            <Flex justify="space-between" align="center">
              <Flex align="center" gap={2}>
                <Badge colorScheme="green" data-testid="right-athlete-badge">
                  RIGHT
                </Badge>
                <Heading size="md" data-testid="right-athlete-header">
                  {rightAthlete.fullName || rightAthlete.email.split('@')[0]}
                  {rightAthlete.ftp && (
                    <Text as="span" fontSize="sm" fontWeight="normal" color="gray.600" ml={2}>
                      FTP: {rightAthlete.ftp}W
                    </Text>
                  )}
                </Heading>
              </Flex>
            </Flex>

            {/* Right Navigation */}
            <Flex gap={2}>
              <IconButton
                aria-label="Previous week"
                icon={<ChevronLeft size={20} />}
                size="sm"
                onClick={() => setRightWeekStart(subWeeks(rightWeekStart, 1))}
              />
              <Button
                size="sm"
                onClick={() => setRightWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}
              >
                Today
              </Button>
              <IconButton
                aria-label="Next week"
                icon={<ChevronRight size={20} />}
                size="sm"
                onClick={() => setRightWeekStart(addWeeks(rightWeekStart, 1))}
              />
            </Flex>

            {/* Right Calendar */}
            <Box flex="1" overflowY="auto" data-testid="right-calendar">
              <MultiWeekCalendar
                scheduledWorkouts={rightWorkouts}
                athleteId={rightAthleteId || undefined}
                onRemoveWorkout={(scheduledId) => handleRemoveWorkout(scheduledId, rightAthleteId!)}
                onWorkoutClick={() => {}}
                onScheduleWorkout={() => {}}
                onMoveWorkout={() => {}}
                onCopyWorkout={(scheduledId, dayIndex) => handleCopyWorkout(scheduledId, dayIndex, rightAthleteId!)}
                onCopyWeek={(weekISO, weekLabel, workoutCount) => handleCopyWeek(weekISO, weekLabel, workoutCount, rightAthleteId!)}
                onPasteWeek={copyModeData && copyModeData.sourceAthleteId === leftAthleteId
                  ? (weekISO, weekLabel, workoutCount) => handlePasteWeek(weekISO, weekLabel, workoutCount, rightAthleteId!)
                  : undefined}
                copyWeekTooltip={`Copy week to ${leftAthlete?.fullName || 'other athlete'}`}
                isPasteMode={copyModeData?.sourceAthleteId === leftAthleteId}
                pasteSourceWeekISO={copyModeData?.sourceAthleteId === rightAthleteId ? copyModeData.sourceWeekISO : undefined}
                pastingWeeks={pastingTarget?.athleteId === rightAthleteId ? new Set([pastingTarget.weekISO]) : new Set()}
                startWeek={rightWeekStart}
                weeksCount={WEEKS_TO_SHOW}
                unavailableDays={rightUnavailableDays}
                weekLoadingStates={rightLoadingStates}
              />
            </Box>
          </VStack>
        </GridItem>
      </Grid>
      </Box>

      {/* Athlete Select Modal */}
      <AthleteSelectModal
        isOpen={isSelectModalOpen}
        onClose={() => setIsSelectModalOpen(false)}
        athletes={athleteOptions}
        selectedLeft={leftAthleteId}
        selectedRight={rightAthleteId}
        onConfirm={handleAthleteSelect}
      />

      {/* Week Copy Modal */}
      {weekCopyData && (
        <WeekCopyModal
          isOpen={isWeekCopyModalOpen}
          onClose={onCloseWeekCopyModal}
          sourceAthlete={{
            id: weekCopyData.targetAthleteId === leftAthleteId ? rightAthleteId! : leftAthleteId!,
            name: weekCopyData.targetAthleteId === leftAthleteId
              ? (rightAthlete?.fullName || rightAthlete?.email.split('@')[0] || '')
              : (leftAthlete?.fullName || leftAthlete?.email.split('@')[0] || ''),
          }}
          targetAthlete={{
            id: weekCopyData.targetAthleteId,
            name: weekCopyData.targetAthleteName,
          }}
          sourceWorkoutCount={weekCopyData.sourceWorkoutCount}
          targetWorkoutCount={weekCopyData.targetWorkoutCount}
          weekLabel={weekCopyData.sourceWeekLabel}
          onConfirm={handleWeekCopyConfirm}
          isLoading={isLoadingWeekCopy}
        />
      )}
    </Box>
  );
}
