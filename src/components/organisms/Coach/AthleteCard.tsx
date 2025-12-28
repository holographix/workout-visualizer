import { memo } from 'react';
import {
  Box,
  Flex,
  Text,
  Avatar,
  HStack,
  VStack,
  Badge,
  IconButton,
  Tooltip,
  useColorModeValue,
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { Calendar, BarChart3, Mail, MoreVertical, AlertTriangle, ClipboardCheck } from 'lucide-react';

export interface AssessmentStatus {
  hasAssessment: boolean;
  isOverdue: boolean;
  isNewAssessment: boolean;
  daysSinceTest: number | null;
}

export interface Athlete {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  lastActivity?: Date;
  weeklyTSS?: number;
  upcomingWorkouts?: number;
  status?: 'active' | 'inactive' | 'new';
  assessmentStatus?: AssessmentStatus;
}

interface AthleteCardProps {
  athlete: Athlete;
  onViewCalendar?: (athlete: Athlete) => void;
  onViewStats?: (athlete: Athlete) => void;
  onContact?: (athlete: Athlete) => void;
}

export const AthleteCard = memo(function AthleteCard({
  athlete,
  onViewCalendar,
  onViewStats,
  onContact,
}: AthleteCardProps) {
  const { t } = useTranslation();

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');
  const mutedColor = useColorModeValue('gray.500', 'gray.400');

  const statusColors: Record<string, string> = {
    active: 'green',
    inactive: 'gray',
    new: 'blue',
  };

  return (
    <Box
      data-testid="athlete-card"
      bg={bgColor}
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="lg"
      p={4}
      _hover={{ bg: hoverBg, shadow: 'sm' }}
      transition="all 0.2s"
    >
      <Flex justify="space-between" align="start">
        <HStack spacing={3}>
          <Avatar
            name={athlete.name}
            src={athlete.avatar}
            size="md"
          />
          <VStack align="start" spacing={0}>
            <HStack>
              <Text fontWeight="semibold">{athlete.name}</Text>
              {athlete.status && (
                <Badge
                  colorScheme={statusColors[athlete.status]}
                  fontSize="xs"
                  textTransform="capitalize"
                >
                  {t(`coach.status.${athlete.status}`)}
                </Badge>
              )}
            </HStack>
            <Text fontSize="sm" color={mutedColor}>
              {athlete.email}
            </Text>
            {/* Assessment Status Badges */}
            {athlete.assessmentStatus && (
              <HStack spacing={1} mt={1}>
                {athlete.assessmentStatus.isNewAssessment && (
                  <Tooltip label={t('coach.assessmentStatus.newTestTooltip')}>
                    <Badge
                      colorScheme="cyan"
                      fontSize="xs"
                      display="flex"
                      alignItems="center"
                      gap={1}
                    >
                      <ClipboardCheck size={10} />
                      {t('coach.assessmentStatus.newTest')}
                    </Badge>
                  </Tooltip>
                )}
                {athlete.assessmentStatus.isOverdue && (
                  <Tooltip label={t('coach.assessmentStatus.overdueTooltip', { days: athlete.assessmentStatus.daysSinceTest })}>
                    <Badge
                      colorScheme="orange"
                      fontSize="xs"
                      display="flex"
                      alignItems="center"
                      gap={1}
                    >
                      <AlertTriangle size={10} />
                      {t('coach.assessmentStatus.overdue')}
                    </Badge>
                  </Tooltip>
                )}
                {!athlete.assessmentStatus.hasAssessment && (
                  <Tooltip label={t('coach.assessmentStatus.noTestTooltip')}>
                    <Badge
                      colorScheme="gray"
                      fontSize="xs"
                    >
                      {t('coach.assessmentStatus.noTest')}
                    </Badge>
                  </Tooltip>
                )}
              </HStack>
            )}
          </VStack>
        </HStack>

        <IconButton
          aria-label={t('common.more')}
          icon={<MoreVertical size={16} />}
          variant="ghost"
          size="sm"
        />
      </Flex>

      <HStack mt={4} spacing={4} fontSize="sm" color={mutedColor}>
        {athlete.weeklyTSS !== undefined && (
          <HStack spacing={1}>
            <BarChart3 size={14} />
            <Text>{athlete.weeklyTSS} TSS/week</Text>
          </HStack>
        )}
        {athlete.upcomingWorkouts !== undefined && (
          <HStack spacing={1}>
            <Calendar size={14} />
            <Text>
              {t('coach.upcomingWorkouts', { count: athlete.upcomingWorkouts })}
            </Text>
          </HStack>
        )}
      </HStack>

      <HStack mt={4} spacing={2}>
        <IconButton
          aria-label={t('coach.viewCalendar')}
          icon={<Calendar size={16} />}
          size="sm"
          variant="outline"
          onClick={() => onViewCalendar?.(athlete)}
        />
        <IconButton
          aria-label={t('coach.viewStats')}
          icon={<BarChart3 size={16} />}
          size="sm"
          variant="outline"
          onClick={() => onViewStats?.(athlete)}
        />
        <IconButton
          aria-label={t('coach.contact')}
          icon={<Mail size={16} />}
          size="sm"
          variant="outline"
          onClick={() => onContact?.(athlete)}
        />
      </HStack>
    </Box>
  );
});
