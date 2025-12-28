/**
 * CoachDashboardPage - Coach Dashboard with aggregated athlete stats
 *
 * Designed for coaches managing ~15 athletes:
 * - Overview stats (total athletes, compliance, TSS)
 * - Athletes needing attention (missed workouts, low compliance)
 * - All athletes' weekly progress
 * - Upcoming goals across all athletes
 */
import { useMemo } from 'react';
import {
  Box,
  Grid,
  GridItem,
  VStack,
  HStack,
  Text,
  Spinner,
  Progress,
  Avatar,
  Badge,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  useColorModeValue,
  useBreakpointValue,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Icon,
  Button,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { format, formatDistanceToNow } from 'date-fns';
import { Users, Target, TrendingUp, AlertTriangle, Calendar, Trophy, ChevronRight, User, Activity, Bell, Clock } from 'lucide-react';
import { Header } from '../components/organisms';
import { useUser } from '../contexts/UserContext';
import { useCoachDashboardAPI, type AthleteProgress, type CoachDashboardGoal } from '../hooks/useCalendarAPI';
import { useCoachAssessmentStatus, type AthleteAssessmentStatus } from '../hooks/useAssessments';

export function CoachDashboardPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useUser();

  // Colors
  const bgColor = useColorModeValue('gray.50', 'dark.800');
  const cardBg = useColorModeValue('white', 'dark.700');
  const cardBorder = useColorModeValue('gray.100', 'dark.500');
  const labelColor = useColorModeValue('gray.500', 'gray.400');
  const textColor = useColorModeValue('gray.900', 'white');
  const mutedColor = useColorModeValue('gray.600', 'gray.300');
  const warningBg = useColorModeValue('orange.50', 'orange.900');
  const warningBorder = useColorModeValue('orange.200', 'orange.700');
  const successBg = useColorModeValue('green.50', 'green.900');
  const successBorder = useColorModeValue('green.200', 'green.700');
  const purpleBg = useColorModeValue('purple.50', 'purple.900');
  const purpleBorder = useColorModeValue('purple.200', 'purple.700');
  const hoverBg = useColorModeValue('gray.50', 'dark.600');

  // Mobile detection
  const isMobile = useBreakpointValue({ base: true, md: false });

  // Fetch dashboard data
  const weekStart = useMemo(() => new Date(), []);
  const { overview, athleteProgress, athletesNeedingAttention, upcomingGoals, isLoading } =
    useCoachDashboardAPI({
      coachId: user?.id,
      weekStart,
    });

  // Fetch assessment status
  const {
    athletesWithNewAssessment,
    athletesNeedingAssessment,
    isLoading: _isLoadingAssessments,
  } = useCoachAssessmentStatus(user?.id);

  if (isLoading) {
    return (
      <Box minH="100vh" bg={bgColor} display="flex" flexDirection="column">
        <Header />
        <Box flex={1} display="flex" alignItems="center" justifyContent="center">
          <Spinner size="xl" color="brand.400" thickness="3px" />
        </Box>
      </Box>
    );
  }

  return (
    <Box minH="100vh" bg={bgColor} display="flex" flexDirection="column">
      <Header />

      <Box
        flex={1}
        px={{ base: 4, md: 6, lg: 8 }}
        py={{ base: 4, md: 6 }}
        maxW="1400px"
        mx="auto"
        w="full"
      >
        {/* Hero Section */}
        <Box mb={6}>
          <Text fontSize={{ base: '2xl', md: '3xl' }} fontWeight="bold" color={textColor}>
            {t('coachDashboard.title')}
          </Text>
          <Text color={mutedColor} fontSize="sm">
            {t('coachDashboard.weekOf', { date: format(weekStart, 'MMMM d, yyyy') })}
          </Text>
        </Box>

        {/* Overview Stats */}
        <Grid
          templateColumns={{ base: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }}
          gap={4}
          mb={6}
        >
          <StatCard
            icon={Users}
            label={t('coachDashboard.athletes')}
            value={overview?.totalAthletes || 0}
            helpText={t('coachDashboard.active')}
            color="brand.400"
            cardBg={cardBg}
            cardBorder={cardBorder}
            labelColor={labelColor}
            textColor={textColor}
          />
          <StatCard
            icon={Target}
            label={t('coachDashboard.compliance')}
            value={`${overview?.overallCompliance || 0}%`}
            helpText={t('coachDashboard.thisWeek')}
            color={
              (overview?.overallCompliance || 0) >= 80
                ? 'green.400'
                : (overview?.overallCompliance || 0) >= 50
                ? 'orange.400'
                : 'red.400'
            }
            cardBg={cardBg}
            cardBorder={cardBorder}
            labelColor={labelColor}
            textColor={textColor}
          />
          <StatCard
            icon={TrendingUp}
            label={t('coachDashboard.workouts')}
            value={`${overview?.totalWorkoutsCompleted || 0}/${overview?.totalWorkoutsPlanned || 0}`}
            helpText={t('coachDashboard.completed')}
            color="blue.400"
            cardBg={cardBg}
            cardBorder={cardBorder}
            labelColor={labelColor}
            textColor={textColor}
          />
          <StatCard
            icon={Trophy}
            label={t('coachDashboard.tss')}
            value={overview?.totalTSSCompleted || 0}
            helpText={t('coachDashboard.ofPlanned', { value: overview?.totalTSSPlanned || 0 })}
            color="purple.400"
            cardBg={cardBg}
            cardBorder={cardBorder}
            labelColor={labelColor}
            textColor={textColor}
          />
        </Grid>

        <Grid templateColumns={{ base: '1fr', lg: '1fr 350px' }} gap={6}>
          {/* Left Column - Athletes Progress */}
          <GridItem>
            {/* New Assessment Submissions - Needs Coach Action */}
            {athletesWithNewAssessment.length > 0 && (
              <Box
                bg={successBg}
                borderRadius="xl"
                p={4}
                borderWidth="1px"
                borderColor={successBorder}
                mb={6}
              >
                <HStack mb={3}>
                  <Icon as={Bell} color="green.500" />
                  <Text fontWeight="600" color={textColor}>
                    {t('coachDashboard.newAssessments', 'New Assessment Results')}
                  </Text>
                  <Badge colorScheme="green" fontSize="xs">
                    {athletesWithNewAssessment.length}
                  </Badge>
                </HStack>
                <Text fontSize="sm" color={mutedColor} mb={3}>
                  {t('coachDashboard.newAssessmentsDesc', { count: athletesWithNewAssessment.length })}
                </Text>
                <VStack spacing={2} align="stretch">
                  {athletesWithNewAssessment.slice(0, 5).map((athlete) => (
                    <NewAssessmentCard
                      key={athlete.athleteId}
                      athlete={athlete}
                      onClick={() => navigate(`/athlete/${athlete.athleteId}/stats`)}
                      cardBg={cardBg}
                      cardBorder={cardBorder}
                      textColor={textColor}
                      mutedColor={mutedColor}
                      t={t}
                    />
                  ))}
                </VStack>
              </Box>
            )}

            {/* Athletes Needing Assessment */}
            {athletesNeedingAssessment.length > 0 && (
              <Box
                bg={purpleBg}
                borderRadius="xl"
                p={4}
                borderWidth="1px"
                borderColor={purpleBorder}
                mb={6}
              >
                <HStack mb={3}>
                  <Icon as={Activity} color="purple.500" />
                  <Text fontWeight="600" color={textColor}>
                    {t('coachDashboard.assessmentOverdue', 'Assessment Required')}
                  </Text>
                  <Badge colorScheme="purple" fontSize="xs">
                    {athletesNeedingAssessment.length}
                  </Badge>
                </HStack>
                <Text fontSize="sm" color={mutedColor} mb={3}>
                  {t('coachDashboard.assessmentOverdueDesc', { count: athletesNeedingAssessment.length })}
                </Text>
                <VStack spacing={2} align="stretch">
                  {athletesNeedingAssessment.slice(0, 5).map((athlete) => (
                    <OverdueAssessmentCard
                      key={athlete.athleteId}
                      athlete={athlete}
                      onClick={() => navigate(`/athlete/${athlete.athleteId}/calendar`)}
                      cardBg={cardBg}
                      cardBorder={cardBorder}
                      textColor={textColor}
                      mutedColor={mutedColor}
                      t={t}
                    />
                  ))}
                </VStack>
              </Box>
            )}

            {/* Athletes Needing Attention */}
            {athletesNeedingAttention.length > 0 && (
              <Box
                bg={warningBg}
                borderRadius="xl"
                p={4}
                borderWidth="1px"
                borderColor={warningBorder}
                mb={6}
              >
                <HStack mb={3}>
                  <Icon as={AlertTriangle} color="orange.500" />
                  <Text fontWeight="600" color={textColor}>
                    {t('coachDashboard.athletesNeedingAttention')}
                  </Text>
                </HStack>
                <VStack spacing={2} align="stretch">
                  {athletesNeedingAttention.slice(0, 5).map((athlete) => (
                    <AttentionCard
                      key={athlete.athleteId}
                      athlete={athlete}
                      onClick={() => navigate(`/athlete/${athlete.athleteId}/calendar`)}
                      cardBg={cardBg}
                      cardBorder={cardBorder}
                      textColor={textColor}
                      mutedColor={mutedColor}
                      t={t}
                    />
                  ))}
                </VStack>
              </Box>
            )}

            {/* All Athletes Progress */}
            <Box
              bg={cardBg}
              borderRadius="xl"
              p={4}
              borderWidth="1px"
              borderColor={cardBorder}
            >
              <Text fontWeight="600" color={textColor} mb={4}>
                {t('coachDashboard.weeklyProgressAll')}
              </Text>

              {/* Mobile: Card layout */}
              {isMobile ? (
                <VStack spacing={3} align="stretch">
                  {athleteProgress.map((athlete) => (
                    <AthleteProgressCard
                      key={athlete.athleteId}
                      athlete={athlete}
                      onClick={() => navigate(`/athlete/${athlete.athleteId}/calendar`)}
                      cardBorder={cardBorder}
                      textColor={textColor}
                      mutedColor={mutedColor}
                      labelColor={labelColor}
                      hoverBg={hoverBg}
                      t={t}
                    />
                  ))}
                </VStack>
              ) : (
                /* Desktop: Table layout */
                <Box overflowX="auto">
                  <Table size="sm">
                    <Thead>
                      <Tr>
                        <Th>{t('coachDashboard.athlete')}</Th>
                        <Th isNumeric>{t('coachDashboard.workouts')}</Th>
                        <Th isNumeric>{t('coachDashboard.tss')}</Th>
                        <Th isNumeric>{t('coachDashboard.hours')}</Th>
                        <Th>{t('coachDashboard.compliance')}</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {athleteProgress.map((athlete) => (
                        <Tr
                          key={athlete.athleteId}
                          _hover={{ bg: hoverBg }}
                          cursor="pointer"
                          onClick={() => navigate(`/athlete/${athlete.athleteId}/calendar`)}
                        >
                          <Td>
                            <HStack spacing={2}>
                              <Avatar size="xs" name={athlete.athleteName} icon={<User size={12} />} />
                              <Text fontWeight="medium" fontSize="sm">
                                {athlete.athleteName}
                              </Text>
                            </HStack>
                          </Td>
                          <Td isNumeric>
                            <Text fontSize="sm">
                              {athlete.workoutsCompleted}/{athlete.workoutsPlanned}
                            </Text>
                          </Td>
                          <Td isNumeric>
                            <Text fontSize="sm">
                              {athlete.completedTSS}/{athlete.plannedTSS}
                            </Text>
                          </Td>
                          <Td isNumeric>
                            <Text fontSize="sm">
                              {athlete.completedHours.toFixed(1)}/{athlete.plannedHours.toFixed(1)}
                            </Text>
                          </Td>
                          <Td>
                            <HStack spacing={2}>
                              <Progress
                                value={athlete.compliance}
                                size="sm"
                                w="60px"
                                borderRadius="full"
                                colorScheme={
                                  athlete.compliance >= 80
                                    ? 'green'
                                    : athlete.compliance >= 50
                                    ? 'orange'
                                    : 'red'
                                }
                              />
                              <Text fontSize="xs" color={mutedColor} minW="35px">
                                {athlete.compliance}%
                              </Text>
                            </HStack>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </Box>
              )}

              {athleteProgress.length === 0 && (
                <Box py={8} textAlign="center">
                  <Text color={mutedColor}>{t('coachDashboard.noAthletesFound')}</Text>
                </Box>
              )}
            </Box>
          </GridItem>

          {/* Right Column - Upcoming Goals */}
          <GridItem>
            <Box
              bg={cardBg}
              borderRadius="xl"
              p={4}
              borderWidth="1px"
              borderColor={cardBorder}
            >
              <HStack justify="space-between" mb={4}>
                <HStack>
                  <Icon as={Calendar} color="brand.400" />
                  <Text fontWeight="600" color={textColor}>
                    {t('coachDashboard.upcomingGoals')}
                  </Text>
                </HStack>
              </HStack>
              <VStack spacing={3} align="stretch">
                {upcomingGoals.slice(0, 8).map((goal) => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    onClick={() => navigate(`/athlete/${goal.athleteId}/calendar`)}
                    cardBorder={cardBorder}
                    textColor={textColor}
                    mutedColor={mutedColor}
                    labelColor={labelColor}
                    hoverBg={hoverBg}
                  />
                ))}
                {upcomingGoals.length === 0 && (
                  <Box py={6} textAlign="center">
                    <Text color={mutedColor} fontSize="sm">
                      {t('coachDashboard.noUpcomingGoals')}
                    </Text>
                  </Box>
                )}
              </VStack>
            </Box>

            {/* Quick Actions */}
            <Box
              bg={cardBg}
              borderRadius="xl"
              p={4}
              borderWidth="1px"
              borderColor={cardBorder}
              mt={6}
            >
              <Text fontWeight="600" color={textColor} mb={4}>
                {t('coachDashboard.quickActions')}
              </Text>
              <VStack spacing={2} align="stretch">
                <Button
                  variant="ghost"
                  justifyContent="space-between"
                  rightIcon={<ChevronRight size={16} />}
                  onClick={() => navigate('/coach')}
                >
                  {t('coachDashboard.manageAthletes')}
                </Button>
                <Button
                  variant="ghost"
                  justifyContent="space-between"
                  rightIcon={<ChevronRight size={16} />}
                  onClick={() => navigate('/coach/compare')}
                >
                  Compare Athletes
                </Button>
                <Button
                  variant="ghost"
                  justifyContent="space-between"
                  rightIcon={<ChevronRight size={16} />}
                  onClick={() => navigate('/workout/new')}
                >
                  {t('coachDashboard.createWorkout')}
                </Button>
              </VStack>
            </Box>
          </GridItem>
        </Grid>
      </Box>
    </Box>
  );
}

// Stat Card Component
function StatCard({
  icon,
  label,
  value,
  helpText,
  color,
  cardBg,
  cardBorder,
  labelColor,
  textColor,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  helpText: string;
  color: string;
  cardBg: string;
  cardBorder: string;
  labelColor: string;
  textColor: string;
}) {
  return (
    <Box
      bg={cardBg}
      borderRadius="xl"
      p={4}
      borderWidth="1px"
      borderColor={cardBorder}
    >
      <Stat>
        <HStack spacing={2} mb={1}>
          <Icon as={icon} color={color} boxSize={4} />
          <StatLabel color={labelColor} fontSize="xs" textTransform="uppercase">
            {label}
          </StatLabel>
        </HStack>
        <StatNumber color={textColor} fontSize="2xl">
          {value}
        </StatNumber>
        <StatHelpText color={labelColor} fontSize="xs" mb={0}>
          {helpText}
        </StatHelpText>
      </Stat>
    </Box>
  );
}

// Attention Card Component
function AttentionCard({
  athlete,
  onClick,
  cardBg,
  cardBorder,
  textColor,
  mutedColor,
  t,
}: {
  athlete: AthleteProgress;
  onClick: () => void;
  cardBg: string;
  cardBorder: string;
  textColor: string;
  mutedColor: string;
  t: (key: string, options?: Record<string, unknown>) => string;
}) {
  return (
    <Box
      bg={cardBg}
      borderRadius="lg"
      p={3}
      borderWidth="1px"
      borderColor={cardBorder}
      cursor="pointer"
      onClick={onClick}
      _hover={{ transform: 'translateX(4px)' }}
      transition="transform 0.2s"
    >
      <HStack justify="space-between">
        <HStack spacing={3}>
          <Avatar size="sm" name={athlete.athleteName} icon={<User size={14} />} />
          <Box>
            <Text fontWeight="medium" fontSize="sm" color={textColor}>
              {athlete.athleteName}
            </Text>
            <HStack spacing={2} mt={0.5}>
              {athlete.missedWorkouts > 0 && (
                <Badge colorScheme="red" fontSize="9px">
                  {t('coachDashboard.missedCount', { count: athlete.missedWorkouts })}
                </Badge>
              )}
              {athlete.compliance < 50 && athlete.workoutsPlanned > 0 && (
                <Badge colorScheme="orange" fontSize="9px">
                  {t('coachDashboard.compliancePercent', { percent: athlete.compliance })}
                </Badge>
              )}
            </HStack>
          </Box>
        </HStack>
        <ChevronRight size={16} color={mutedColor} />
      </HStack>
    </Box>
  );
}

// Goal Card Component
function GoalCard({
  goal,
  onClick,
  cardBorder,
  textColor,
  mutedColor,
  labelColor,
  hoverBg,
}: {
  goal: CoachDashboardGoal;
  onClick: () => void;
  cardBorder: string;
  textColor: string;
  mutedColor: string;
  labelColor: string;
  hoverBg: string;
}) {
  const priorityColors = {
    A: 'red',
    B: 'orange',
    C: 'blue',
  };

  const eventDate = goal.eventDate ? new Date(goal.eventDate) : null;

  return (
    <Box
      p={3}
      borderRadius="lg"
      borderWidth="1px"
      borderColor={cardBorder}
      cursor="pointer"
      onClick={onClick}
      _hover={{ bg: hoverBg }}
      transition="background 0.2s"
    >
      <HStack justify="space-between" align="start">
        <Box flex={1}>
          <HStack spacing={2} mb={1}>
            <Badge colorScheme={priorityColors[goal.priority]} fontSize="9px">
              {goal.priority}
            </Badge>
            {goal.eventType && (
              <Text fontSize="xs" color={labelColor}>
                {goal.eventType}
              </Text>
            )}
          </HStack>
          <Text fontWeight="medium" fontSize="sm" color={textColor} noOfLines={1}>
            {goal.name}
          </Text>
          <HStack spacing={2} mt={1}>
            <Avatar size="2xs" name={goal.athleteName} />
            <Text fontSize="xs" color={mutedColor}>
              {goal.athleteName}
            </Text>
          </HStack>
        </Box>
        {eventDate && (
          <Box textAlign="right">
            <Text fontSize="xs" fontWeight="bold" color={textColor}>
              {format(eventDate, 'MMM d')}
            </Text>
            <Text fontSize="2xs" color={labelColor}>
              {formatDistanceToNow(eventDate, { addSuffix: true })}
            </Text>
          </Box>
        )}
      </HStack>
    </Box>
  );
}

// New Assessment Card Component (for coach notification)
function NewAssessmentCard({
  athlete,
  onClick,
  cardBg,
  cardBorder,
  textColor,
  mutedColor,
  t,
}: {
  athlete: AthleteAssessmentStatus;
  onClick: () => void;
  cardBg: string;
  cardBorder: string;
  textColor: string;
  mutedColor: string;
  t: (key: string, options?: Record<string, unknown>) => string;
}) {
  return (
    <Box
      bg={cardBg}
      borderRadius="lg"
      p={3}
      borderWidth="1px"
      borderColor={cardBorder}
      cursor="pointer"
      onClick={onClick}
      _hover={{ transform: 'translateX(4px)' }}
      transition="transform 0.2s"
    >
      <HStack justify="space-between">
        <HStack spacing={3}>
          <Avatar size="sm" name={athlete.athleteName} icon={<User size={14} />} />
          <Box>
            <Text fontWeight="medium" fontSize="sm" color={textColor}>
              {athlete.athleteName}
            </Text>
            <HStack spacing={2} mt={0.5}>
              <Badge colorScheme="green" fontSize="9px">
                {t('coachDashboard.newTest', { defaultValue: 'New Test' })}
              </Badge>
              {athlete.latestAssessment?.estimatedFTP && (
                <Text fontSize="xs" color={mutedColor}>
                  FTP: {athlete.latestAssessment.estimatedFTP}W
                </Text>
              )}
            </HStack>
          </Box>
        </HStack>
        <HStack spacing={2}>
          <Text fontSize="xs" color={mutedColor}>
            {athlete.lastTestDate && format(new Date(athlete.lastTestDate), 'MMM d')}
          </Text>
          <ChevronRight size={16} color={mutedColor} />
        </HStack>
      </HStack>
    </Box>
  );
}

// Overdue Assessment Card Component
function OverdueAssessmentCard({
  athlete,
  onClick,
  cardBg,
  cardBorder,
  textColor,
  mutedColor,
  t,
}: {
  athlete: AthleteAssessmentStatus;
  onClick: () => void;
  cardBg: string;
  cardBorder: string;
  textColor: string;
  mutedColor: string;
  t: (key: string, options?: Record<string, unknown>) => string;
}) {
  return (
    <Box
      bg={cardBg}
      borderRadius="lg"
      p={3}
      borderWidth="1px"
      borderColor={cardBorder}
      cursor="pointer"
      onClick={onClick}
      _hover={{ transform: 'translateX(4px)' }}
      transition="transform 0.2s"
    >
      <HStack justify="space-between">
        <HStack spacing={3}>
          <Avatar size="sm" name={athlete.athleteName} icon={<User size={14} />} />
          <Box>
            <Text fontWeight="medium" fontSize="sm" color={textColor}>
              {athlete.athleteName}
            </Text>
            <HStack spacing={2} mt={0.5}>
              {!athlete.hasAssessment ? (
                <Badge colorScheme="purple" fontSize="9px">
                  {t('coachDashboard.noTest', { defaultValue: 'No Test' })}
                </Badge>
              ) : (
                <Badge colorScheme="purple" fontSize="9px">
                  <HStack spacing={1}>
                    <Clock size={10} />
                    <Text>{athlete.daysSinceTest} {t('coachDashboard.daysAgo', { defaultValue: 'days ago' })}</Text>
                  </HStack>
                </Badge>
              )}
              {athlete.ftp && (
                <Text fontSize="xs" color={mutedColor}>
                  FTP: {athlete.ftp}W
                </Text>
              )}
            </HStack>
          </Box>
        </HStack>
        <ChevronRight size={16} color={mutedColor} />
      </HStack>
    </Box>
  );
}

// Athlete Progress Card Component (for mobile view)
function AthleteProgressCard({
  athlete,
  onClick,
  cardBorder,
  textColor,
  mutedColor,
  labelColor,
  hoverBg,
  t,
}: {
  athlete: AthleteProgress;
  onClick: () => void;
  cardBorder: string;
  textColor: string;
  mutedColor: string;
  labelColor: string;
  hoverBg: string;
  t: (key: string, options?: Record<string, unknown>) => string;
}) {
  return (
    <Box
      p={3}
      borderRadius="lg"
      borderWidth="1px"
      borderColor={cardBorder}
      cursor="pointer"
      onClick={onClick}
      _hover={{ bg: hoverBg }}
      transition="background 0.2s"
    >
      {/* Athlete name and avatar */}
      <HStack justify="space-between" mb={3}>
        <HStack spacing={2}>
          <Avatar size="sm" name={athlete.athleteName} icon={<User size={14} />} />
          <Text fontWeight="medium" fontSize="sm" color={textColor}>
            {athlete.athleteName}
          </Text>
        </HStack>
        <ChevronRight size={16} color={mutedColor} />
      </HStack>

      {/* Stats grid */}
      <Grid templateColumns="repeat(2, 1fr)" gap={2} mb={3}>
        <Box>
          <Text fontSize="2xs" color={labelColor} textTransform="uppercase">
            {t('coachDashboard.workouts')}
          </Text>
          <Text fontSize="sm" fontWeight="medium" color={textColor}>
            {athlete.workoutsCompleted}/{athlete.workoutsPlanned}
          </Text>
        </Box>
        <Box>
          <Text fontSize="2xs" color={labelColor} textTransform="uppercase">
            TSS
          </Text>
          <Text fontSize="sm" fontWeight="medium" color={textColor}>
            {athlete.completedTSS}/{athlete.plannedTSS}
          </Text>
        </Box>
        <Box>
          <Text fontSize="2xs" color={labelColor} textTransform="uppercase">
            {t('coachDashboard.hours')}
          </Text>
          <Text fontSize="sm" fontWeight="medium" color={textColor}>
            {athlete.completedHours.toFixed(1)}/{athlete.plannedHours.toFixed(1)}h
          </Text>
        </Box>
        <Box>
          <Text fontSize="2xs" color={labelColor} textTransform="uppercase">
            {t('coachDashboard.compliance')}
          </Text>
          <Text fontSize="sm" fontWeight="medium" color={textColor}>
            {athlete.compliance}%
          </Text>
        </Box>
      </Grid>

      {/* Progress bar */}
      <Progress
        value={athlete.compliance}
        size="sm"
        borderRadius="full"
        colorScheme={
          athlete.compliance >= 80
            ? 'green'
            : athlete.compliance >= 50
            ? 'orange'
            : 'red'
        }
      />
    </Box>
  );
}
