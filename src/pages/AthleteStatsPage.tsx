/**
 * AthleteStatsPage - Coach view of an athlete's training statistics
 *
 * Shows training load, progress, performance metrics, and assessment data for an athlete.
 *
 * @module pages/AthleteStatsPage
 */
import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Avatar,
  Badge,
  IconButton,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Spinner,
  useColorModeValue,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Divider,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  User,
  TrendingUp,
  Activity,
  Target,
  Zap,
  Clock,
  AlertTriangle,
  Scale,
  Ruler,
} from 'lucide-react';
import { useAthleteStats, useAssessments } from '../hooks/useAssessments';
import { useZones } from '../hooks/useZones';
import { format } from 'date-fns';
import { POWER_ZONE_COLORS } from '../types/zones';
import { AssessmentDetailsModal } from '../components/organisms/Assessment/AssessmentDetailsModal';
import type { Assessment } from '../types/assessment';

export function AthleteStatsPage() {
  const { athleteId } = useParams<{ athleteId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Fetch athlete stats with real data
  const { stats, isLoading, error } = useAthleteStats(athleteId);

  // Fetch full assessments data for the modal
  const { assessments } = useAssessments({ athleteId });

  // Fetch zones data
  const { zonesData, fetchZones, loading: zonesLoading } = useZones();

  // State for assessment details modal
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);

  // Fetch zones when athleteId changes
  useEffect(() => {
    if (athleteId) {
      fetchZones(athleteId);
    }
  }, [athleteId, fetchZones]);

  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const headerBg = useColorModeValue('white', 'gray.800');
  const mutedColor = useColorModeValue('gray.600', 'gray.400');
  const warningBg = useColorModeValue('orange.50', 'orange.900');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');

  if (isLoading) {
    return (
      <Box h="100vh" bg={bgColor} display="flex" alignItems="center" justifyContent="center">
        <Spinner size="xl" color="brand.500" />
      </Box>
    );
  }

  if (error || !stats) {
    return (
      <Box h="100vh" bg={bgColor} display="flex" alignItems="center" justifyContent="center">
        <Text color="red.500">{t('common.error')}</Text>
      </Box>
    );
  }

  const { athlete, assessment } = stats;

  return (
    <Box minH="100vh" bg={bgColor}>
      {/* Header */}
      <HStack
        px={4}
        py={3}
        bg={headerBg}
        borderBottomWidth="1px"
        borderColor={borderColor}
        spacing={4}
      >
        <IconButton
          aria-label={t('common.back')}
          icon={<ArrowLeft size={20} />}
          variant="ghost"
          onClick={() => navigate('/coach')}
        />
        <Avatar
          name={athlete.fullName}
          size="sm"
          icon={<User size={16} />}
        />
        <VStack align="start" spacing={0} flex={1}>
          <HStack>
            <Text fontWeight="semibold">{athlete.fullName}</Text>
            <Badge colorScheme="green" fontSize="xs">
              {t('coach.status.active')}
            </Badge>
          </HStack>
          <Text fontSize="xs" color={mutedColor}>
            {athlete.ftp ? `FTP: ${athlete.ftp}W` : athlete.email}
          </Text>
        </VStack>
      </HStack>

      <Container maxW="6xl" py={6}>
        {/* Assessment Warning */}
        {assessment.isOverdue && (
          <Alert
            status="warning"
            variant="subtle"
            borderRadius="lg"
            bg={warningBg}
            mb={6}
          >
            <AlertIcon as={AlertTriangle} />
            <Box flex="1">
              <AlertTitle fontSize="sm">
                {!assessment.hasAssessment
                  ? t('stats.noAssessment', 'No Assessment Data')
                  : t('stats.assessmentOverdue', 'Assessment Overdue')}
              </AlertTitle>
              <AlertDescription fontSize="xs">
                {!assessment.hasAssessment
                  ? t('stats.noAssessmentDesc', 'This athlete needs to complete a fitness test')
                  : t('stats.assessmentOverdueDesc', {
                      days: assessment.daysSinceTest,
                      defaultValue: `Last test was {{days}} days ago. Recommend scheduling a new assessment.`
                    })}
              </AlertDescription>
            </Box>
          </Alert>
        )}

        {/* Page Title */}
        <HStack mb={6} spacing={3}>
          <TrendingUp size={24} />
          <Heading size="lg">{t('stats.title')}</Heading>
        </HStack>

        {/* Stats Grid - Key Metrics */}
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4} mb={6}>
          <StatCard
            icon={<Zap size={20} />}
            label={t('stats.currentFTP', 'Current FTP')}
            value={athlete.ftp ? `${athlete.ftp}W` : '--'}
            helpText={assessment.hasAssessment
              ? t('stats.fromAssessment', 'From assessment')
              : t('stats.notTested', 'Not tested')}
            colorScheme="orange"
            cardBg={cardBg}
            borderColor={borderColor}
          />
          <StatCard
            icon={<Activity size={20} />}
            label={t('stats.wattsPerKg', 'W/kg')}
            value={assessment.wattsPerKg ? `${assessment.wattsPerKg}` : '--'}
            helpText={athlete.weightKg ? `${athlete.weightKg}kg` : t('stats.noWeight', 'No weight')}
            colorScheme="green"
            cardBg={cardBg}
            borderColor={borderColor}
          />
          <StatCard
            icon={<Scale size={20} />}
            label={t('stats.weight', 'Weight')}
            value={athlete.weightKg ? `${athlete.weightKg}kg` : '--'}
            helpText={t('stats.bodyMetrics', 'Body metrics')}
            colorScheme="blue"
            cardBg={cardBg}
            borderColor={borderColor}
          />
          <StatCard
            icon={<Ruler size={20} />}
            label={t('stats.height', 'Height')}
            value={athlete.heightCm ? `${athlete.heightCm}cm` : '--'}
            helpText={t('stats.bodyMetrics', 'Body metrics')}
            colorScheme="purple"
            cardBg={cardBg}
            borderColor={borderColor}
          />
        </SimpleGrid>

        {/* Detailed Stats */}
        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
          {/* Performance / FTP Progress */}
          <Box
            bg={cardBg}
            borderRadius="xl"
            borderWidth="1px"
            borderColor={borderColor}
            p={6}
          >
            <HStack mb={4}>
              <Target size={18} />
              <Heading size="sm">{t('stats.performance', 'Performance')}</Heading>
            </HStack>

            <SimpleGrid columns={2} spacing={4}>
              <Stat>
                <StatLabel>{t('stats.currentFTP', 'Current FTP')}</StatLabel>
                <StatNumber color="brand.500">{athlete.ftp || '--'}W</StatNumber>
                {assessment.ftpProgress !== 0 && (
                  <StatHelpText>
                    <StatArrow type={assessment.ftpProgress > 0 ? 'increase' : 'decrease'} />
                    {Math.abs(assessment.ftpProgress)}W {t('stats.sinceLast', 'since last test')}
                  </StatHelpText>
                )}
              </Stat>

              <Stat>
                <StatLabel>{t('stats.wattsPerKg', 'W/kg')}</StatLabel>
                <StatNumber>{assessment.wattsPerKg || '--'}</StatNumber>
                <StatHelpText>{t('stats.powerToWeight', 'Power to weight')}</StatHelpText>
              </Stat>
            </SimpleGrid>

            <Divider my={4} />

            {/* Last Assessment Info */}
            {assessment.latestAssessment && (
              <Box>
                <Text fontSize="sm" fontWeight="medium" mb={2}>
                  {t('stats.lastAssessment', 'Last Assessment')}
                </Text>
                <HStack justify="space-between" fontSize="sm">
                  <Text color={mutedColor}>
                    {assessment.latestAssessment.testType === 'SPRINT_12MIN'
                      ? t('stats.sprint12', 'Sprint + 12\' Climb')
                      : t('stats.power125', '1\'/2\'/5\' Power')}
                  </Text>
                  <Text>
                    {format(new Date(assessment.latestAssessment.testDate), 'MMM d, yyyy')}
                  </Text>
                </HStack>
                <Text fontSize="xs" color={mutedColor} mt={1}>
                  {assessment.daysSinceTest} {t('stats.daysAgo', 'days ago')}
                </Text>
              </Box>
            )}
          </Box>

          {/* Assessment History */}
          <Box
            bg={cardBg}
            borderRadius="xl"
            borderWidth="1px"
            borderColor={borderColor}
            p={6}
          >
            <HStack mb={4}>
              <Clock size={18} />
              <Heading size="sm">{t('stats.assessmentHistory', 'Assessment History')}</Heading>
            </HStack>

            {assessment.assessmentHistory.length > 0 ? (
              <Table size="sm" variant="simple">
                <Thead>
                  <Tr>
                    <Th>{t('stats.date', 'Date')}</Th>
                    <Th>{t('stats.type', 'Type')}</Th>
                    <Th isNumeric>{t('stats.ftp', 'FTP')}</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {assessment.assessmentHistory.map((test, idx) => {
                    // Find the full assessment data
                    const fullAssessment = assessments?.find(a => a.id === test.id);
                    return (
                    <Tr
                      key={test.id}
                      cursor="pointer"
                      transition="all 0.2s"
                      _hover={{ bg: hoverBg }}
                      onClick={() => fullAssessment && setSelectedAssessment(fullAssessment)}
                    >
                      <Td>
                        <Text fontSize="sm">
                          {format(new Date(test.testDate), 'MMM d, yyyy')}
                        </Text>
                      </Td>
                      <Td>
                        <Badge
                          colorScheme={test.testType === 'SPRINT_12MIN' ? 'blue' : 'purple'}
                          fontSize="xs"
                        >
                          {test.testType === 'SPRINT_12MIN' ? '15\"+12\'' : '1\'/2\'/5\''}
                        </Badge>
                      </Td>
                      <Td isNumeric>
                        <Text fontWeight={idx === 0 ? 'bold' : 'normal'}>
                          {test.estimatedFTP ? `${test.estimatedFTP}W` : '--'}
                        </Text>
                      </Td>
                    </Tr>
                    );
                  })}
                </Tbody>
              </Table>
            ) : (
              <Box py={8} textAlign="center">
                <Text color={mutedColor} fontSize="sm">
                  {t('stats.noAssessmentHistory', 'No assessment history')}
                </Text>
              </Box>
            )}
          </Box>
        </SimpleGrid>

        {/* Training Zones Section */}
        <Box mt={6}>
          <HStack mb={4} spacing={3}>
            <Activity size={24} />
            <Heading size="lg">{t('zones.trainingZones', 'Training Zones')}</Heading>
          </HStack>

          {zonesLoading ? (
            <Box py={8} textAlign="center">
              <Spinner size="lg" color="brand.500" />
            </Box>
          ) : (
            <Box
              bg={cardBg}
              borderRadius="xl"
              borderWidth="1px"
              borderColor={borderColor}
              p={6}
            >
              <HStack mb={4} justify="space-between" wrap="wrap">
                <Heading size="sm">{t('zones.trainingZones', 'Training Zones')}</Heading>
                <HStack spacing={3}>
                  {zonesData?.athlete.ftp && (
                    <Badge colorScheme="orange">
                      FTP: {zonesData.athlete.ftp}W
                    </Badge>
                  )}
                  {zonesData?.athlete.maxHR && (
                    <Badge colorScheme="red">
                      Max HR: {zonesData.athlete.maxHR} bpm
                    </Badge>
                  )}
                </HStack>
              </HStack>

              {zonesData?.power.calculatedZones || zonesData?.hr.calculatedZones ? (
                <Box overflowX="auto">
                  <Table size="sm" variant="simple">
                    <Thead>
                      <Tr>
                        <Th>{t('zones.zone', 'Zone')}</Th>
                        <Th>{t('zones.name', 'Name')}</Th>
                        <Th isNumeric>{t('zones.fcMin', 'FC Min')}</Th>
                        <Th isNumeric>{t('zones.fcMax', 'FC Max')}</Th>
                        <Th isNumeric>{t('zones.powerMin', 'Power Min')}</Th>
                        <Th isNumeric>{t('zones.powerMax', 'Power Max')}</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {[1, 2, 3, 4, 5, 6].map((zoneNum) => {
                        const powerZone = zonesData?.power.calculatedZones?.find(z => z.zone === zoneNum);
                        const hrZone = zonesData?.hr.calculatedZones?.find(z => z.zone === zoneNum);
                        const zoneName = powerZone?.name || hrZone?.name || '--';

                        return (
                          <Tr key={zoneNum}>
                            <Td>
                              <Badge
                                colorScheme={POWER_ZONE_COLORS[zoneNum - 1]?.split('.')[0] || 'gray'}
                                variant="solid"
                              >
                                Z{zoneNum}
                              </Badge>
                            </Td>
                            <Td fontSize="sm" fontWeight="medium">
                              {zoneName}
                            </Td>
                            <Td isNumeric fontSize="sm">
                              {hrZone ? `${hrZone.minBPM}` : '--'}
                            </Td>
                            <Td isNumeric fontSize="sm">
                              {hrZone ? `${hrZone.maxBPM}` : '--'}
                            </Td>
                            <Td isNumeric fontSize="sm">
                              {powerZone ? `${powerZone.minWatts}` : '--'}
                            </Td>
                            <Td isNumeric fontSize="sm">
                              {powerZone ? `${powerZone.maxWatts}` : '--'}
                            </Td>
                          </Tr>
                        );
                      })}
                    </Tbody>
                  </Table>
                </Box>
              ) : (
                <Box py={8} textAlign="center">
                  <VStack spacing={2}>
                    <Text color={mutedColor} fontSize="sm">
                      {t('zones.noData', 'No zone data available')}
                    </Text>
                    <Text color={mutedColor} fontSize="xs">
                      {t('zones.completeAssessment', 'Complete an assessment test to calculate zones')}
                    </Text>
                  </VStack>
                </Box>
              )}
            </Box>
          )}
        </Box>
      </Container>

      {/* Assessment Details Modal */}
      <AssessmentDetailsModal
        assessment={selectedAssessment}
        isOpen={!!selectedAssessment}
        onClose={() => setSelectedAssessment(null)}
      />
    </Box>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  helpText: string;
  colorScheme: string;
  cardBg: string;
  borderColor: string;
}

function StatCard({ icon, label, value, helpText, colorScheme, cardBg, borderColor }: StatCardProps) {
  return (
    <Box
      bg={cardBg}
      borderRadius="xl"
      borderWidth="1px"
      borderColor={borderColor}
      p={4}
    >
      <HStack spacing={3} mb={2}>
        <Box color={`${colorScheme}.500`}>{icon}</Box>
        <Text fontSize="sm" color="gray.500">
          {label}
        </Text>
      </HStack>
      <Text fontSize="2xl" fontWeight="bold">
        {value}
      </Text>
      <Text fontSize="xs" color="gray.500">
        {helpText}
      </Text>
    </Box>
  );
}
