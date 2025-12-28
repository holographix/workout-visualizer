import { Box, Text, chakra, useColorModeValue } from '@chakra-ui/react';
import { motion, isValidMotionProp } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ProgressRing } from './ProgressRing';

const MotionBox = chakra(motion.div, {
  shouldForwardProp: (prop) => isValidMotionProp(prop) || prop === 'children',
});

interface WeeklyStatsProps {
  completedWorkouts: number;
  totalWorkouts: number;
  completedTSS: number;
  plannedTSS: number;
  completedHours: number;
  plannedHours: number;
}

export function WeeklyStats({
  completedWorkouts,
  totalWorkouts,
  completedTSS,
  plannedTSS,
  completedHours,
  plannedHours,
}: WeeklyStatsProps) {
  const { t } = useTranslation();

  const workoutProgress = totalWorkouts > 0 ? (completedWorkouts / totalWorkouts) * 100 : 0;
  const tssProgress = plannedTSS > 0 ? (completedTSS / plannedTSS) * 100 : 0;
  const hoursProgress = plannedHours > 0 ? (completedHours / plannedHours) * 100 : 0;

  // Light/dark mode colors - clean and minimal
  const cardBg = useColorModeValue('white', 'dark.700');
  const cardBorder = useColorModeValue('gray.100', 'dark.500');
  const labelColor = useColorModeValue('gray.500', 'gray.400');
  const trackColor = useColorModeValue('var(--chakra-colors-gray-100)', 'var(--chakra-colors-dark-600)');
  const valueColor = useColorModeValue('gray.900', 'white');

  return (
    <MotionBox
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      // @ts-expect-error framer-motion transition type conflict
      transition={{ duration: 0.4, delay: 0.2 }}
    >
      <Box
        bg={cardBg}
        borderRadius="xl"
        p={{ base: 4, md: 4 }}
        borderWidth="1px"
        borderColor={cardBorder}
        boxShadow={useColorModeValue('sm', 'none')}
        overflow="hidden"
      >
        <Text
          fontSize="xs"
          fontWeight="600"
          textTransform="uppercase"
          letterSpacing="wider"
          color={labelColor}
          mb={3}
        >
          {t('dashboard.thisWeek')}
        </Text>

        <Box
          display="flex"
          flexDirection="row"
          justifyContent="space-around"
          alignItems="flex-start"
          gap={2}
          width="100%"
        >
          <ProgressRing
            progress={workoutProgress}
            size={80}
            strokeWidth={5}
            color="var(--chakra-colors-green-400)"
            trackColor={trackColor}
            valueColor={valueColor}
            labelColor={labelColor}
            label={t('dashboard.workouts')}
            value={`${completedWorkouts}/${totalWorkouts}`}
          />
          <ProgressRing
            progress={tssProgress}
            size={80}
            strokeWidth={5}
            color="var(--chakra-colors-orange-400)"
            trackColor={trackColor}
            valueColor={valueColor}
            labelColor={labelColor}
            label="TSS"
            value={String(completedTSS)}
            subValue={`of ${plannedTSS}`}
          />
          <ProgressRing
            progress={hoursProgress}
            size={80}
            strokeWidth={5}
            color="var(--chakra-colors-blue-400)"
            trackColor={trackColor}
            valueColor={valueColor}
            labelColor={labelColor}
            label={t('dashboard.hours')}
            value={completedHours.toFixed(1)}
            subValue={`of ${plannedHours.toFixed(1)}`}
          />
        </Box>

        {/* Progress summary text */}
        <Box mt={4} textAlign="center">
          <Text fontSize="sm" color={labelColor}>
            {workoutProgress >= 100 ? (
              <Text as="span" color="green.400" fontWeight="600">
                {t('dashboard.weekComplete')}
              </Text>
            ) : workoutProgress >= 50 ? (
              t('dashboard.weekProgress', { percent: Math.round(workoutProgress) })
            ) : (
              t('dashboard.workoutsRemaining', { count: totalWorkouts - completedWorkouts })
            )}
          </Text>
        </Box>
      </Box>
    </MotionBox>
  );
}
