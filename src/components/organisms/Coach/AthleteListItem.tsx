import { memo } from 'react';
import {
  Flex,
  Text,
  Avatar,
  HStack,
  Badge,
  IconButton,
  Tooltip,
  useColorModeValue,
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { Calendar, BarChart3, Mail, AlertTriangle, ClipboardCheck } from 'lucide-react';
import type { Athlete } from './AthleteCard';

interface AthleteListItemProps {
  athlete: Athlete;
  onViewCalendar?: (athlete: Athlete) => void;
  onViewStats?: (athlete: Athlete) => void;
  onContact?: (athlete: Athlete) => void;
}

export const AthleteListItem = memo(function AthleteListItem({
  athlete,
  onViewCalendar,
  onViewStats,
  onContact,
}: AthleteListItemProps) {
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
    <Flex
      bg={bgColor}
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="lg"
      px={4}
      py={3}
      align="center"
      justify="space-between"
      _hover={{ bg: hoverBg }}
      transition="all 0.2s"
    >
      <HStack spacing={3} flex={1}>
        <Avatar
          name={athlete.name}
          src={athlete.avatar}
          size="sm"
        />
        <Text fontWeight="medium" minW="150px">
          {athlete.name}
        </Text>
        {athlete.status && (
          <Badge
            colorScheme={statusColors[athlete.status]}
            fontSize="xs"
            textTransform="capitalize"
          >
            {t(`coach.status.${athlete.status}`)}
          </Badge>
        )}
        {/* Assessment Status Badges */}
        {athlete.assessmentStatus?.isNewAssessment && (
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
        {athlete.assessmentStatus?.isOverdue && (
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
        {athlete.assessmentStatus && !athlete.assessmentStatus.hasAssessment && (
          <Tooltip label={t('coach.assessmentStatus.noTestTooltip')}>
            <Badge colorScheme="gray" fontSize="xs">
              {t('coach.assessmentStatus.noTest')}
            </Badge>
          </Tooltip>
        )}
      </HStack>

      <HStack spacing={6} color={mutedColor} fontSize="sm" flex={1} justify="center">
        {athlete.weeklyTSS !== undefined && (
          <Text>{athlete.weeklyTSS} TSS/week</Text>
        )}
        {athlete.upcomingWorkouts !== undefined && (
          <Text>
            {t('coach.upcomingWorkouts', { count: athlete.upcomingWorkouts })}
          </Text>
        )}
      </HStack>

      <HStack spacing={1}>
        <IconButton
          aria-label={t('coach.viewCalendar')}
          icon={<Calendar size={16} />}
          size="sm"
          variant="ghost"
          onClick={() => onViewCalendar?.(athlete)}
        />
        <IconButton
          aria-label={t('coach.viewStats')}
          icon={<BarChart3 size={16} />}
          size="sm"
          variant="ghost"
          onClick={() => onViewStats?.(athlete)}
        />
        <IconButton
          aria-label={t('coach.contact')}
          icon={<Mail size={16} />}
          size="sm"
          variant="ghost"
          onClick={() => onContact?.(athlete)}
        />
      </HStack>
    </Flex>
  );
});
