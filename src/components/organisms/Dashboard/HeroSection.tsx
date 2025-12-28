import { Box, Flex, Text, VStack, HStack, Badge, chakra, useColorModeValue } from '@chakra-ui/react';
import { motion, isValidMotionProp } from 'framer-motion';
import { Trophy, Target } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { useTranslation } from 'react-i18next';

const MotionBox = chakra(motion.div, {
  shouldForwardProp: (prop) => isValidMotionProp(prop) || prop === 'children',
});
const MotionText = chakra(motion.p, {
  shouldForwardProp: (prop) => isValidMotionProp(prop) || prop === 'children',
});

interface Goal {
  id: string;
  name: string;
  type: string;
  date: Date;
  eventType?: string;
}

interface HeroSectionProps {
  userName: string;
  nextGoal?: Goal;
}

export function HeroSection({ userName, nextGoal }: HeroSectionProps) {
  const { t } = useTranslation();
  const firstName = userName?.split(' ')[0] || 'Athlete';
  const daysUntilGoal = nextGoal ? differenceInDays(new Date(nextGoal.date), new Date()) : null;
  const greeting = getGreeting(t);

  // Light/dark mode colors - clean white for light mode
  const bgColor = useColorModeValue('white', undefined);
  const bgGradient = useColorModeValue(
    undefined,
    'linear(135deg, dark.800 0%, dark.600 50%, dark.700 100%)'
  );
  const dateColor = useColorModeValue('gray.500', 'gray.400');
  const headingColor = useColorModeValue('gray.900', 'white');
  const cardBg = useColorModeValue('gray.50', 'whiteAlpha.50');
  const cardBorder = useColorModeValue('gray.100', 'whiteAlpha.100');
  const goalNameColor = useColorModeValue('gray.900', 'white');
  const mutedText = useColorModeValue('gray.600', 'gray.400');
  const overlayOpacity = useColorModeValue(0.03, 0.08);

  return (
    <Box
      bg={bgColor}
      bgGradient={bgGradient}
      borderRadius={{ base: '0', md: '2xl' }}
      overflow="hidden"
      position="relative"
      mx={{ base: -4, md: 0 }}
      mt={{ base: -4, md: 0 }}
      boxShadow={useColorModeValue('sm', 'none')}
      borderWidth={{ base: 0, md: useColorModeValue('1px', '0') }}
      borderColor="gray.100"
    >
      {/* Gradient overlay accent - very subtle in light mode */}
      <Box
        position="absolute"
        top="-50%"
        right="-20%"
        width="60%"
        height="200%"
        bgGradient="linear(to-br, brand.400, gold.400)"
        opacity={overlayOpacity}
        borderRadius="full"
        filter="blur(60px)"
      />

      <Box px={{ base: 5, md: 8 }} py={{ base: 6, md: 8 }} position="relative">
        {/* Greeting */}
        <VStack align="start" spacing={1} mb={nextGoal ? 6 : 0}>
          <Text
            fontSize="sm"
            color={dateColor}
            textTransform="uppercase"
            letterSpacing="wider"
            fontWeight="500"
          >
            {format(new Date(), 'EEEE, MMMM d')}
          </Text>
          <MotionText
            fontSize={{ base: '2xl', md: '3xl' }}
            fontWeight="bold"
            color={headingColor}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            // @ts-expect-error framer-motion transition type conflict
            transition={{ duration: 0.4 }}
          >
            {greeting}, {firstName}
          </MotionText>
        </VStack>

        {/* Goal Countdown - The Big Number */}
        {nextGoal && daysUntilGoal !== null && (
          <MotionBox
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            // @ts-expect-error framer-motion transition type conflict
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Flex
              direction={{ base: 'column', sm: 'row' }}
              align={{ base: 'start', sm: 'center' }}
              justify="space-between"
              gap={4}
              bg={cardBg}
              backdropFilter="blur(10px)"
              borderRadius="xl"
              p={{ base: 4, md: 5 }}
              borderWidth="1px"
              borderColor={cardBorder}
              boxShadow={useColorModeValue('sm', 'none')}
            >
              <VStack align="start" spacing={1} flex={1}>
                <HStack spacing={2}>
                  <Trophy size={18} color="var(--chakra-colors-brand-400)" />
                  <Text fontSize="xs" color="brand.400" fontWeight="600" textTransform="uppercase" letterSpacing="wide">
                    {t('dashboard.nextGoal')}
                  </Text>
                  <Badge
                    bg={nextGoal.type === 'A' ? 'red.500' : nextGoal.type === 'B' ? 'orange.500' : 'blue.500'}
                    color="white"
                    fontSize="xs"
                    px={2}
                    borderRadius="full"
                  >
                    {nextGoal.type}
                  </Badge>
                </HStack>
                <Text fontSize={{ base: 'lg', md: 'xl' }} fontWeight="bold" color={goalNameColor} noOfLines={1}>
                  {nextGoal.name}
                </Text>
                <Text fontSize="sm" color={mutedText}>
                  {format(new Date(nextGoal.date), 'MMM d, yyyy')}
                  {nextGoal.eventType && ` • ${nextGoal.eventType}`}
                </Text>
              </VStack>

              {/* Big countdown number */}
              <VStack spacing={0} align={{ base: 'start', sm: 'end' }} minW="100px">
                <MotionText
                  fontSize={{ base: '4xl', md: '5xl' }}
                  fontWeight="bold"
                  bgGradient="linear(to-r, brand.400, gold.400)"
                  bgClip="text"
                  lineHeight="1"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  // @ts-expect-error framer-motion transition type conflict
                  transition={{ duration: 0.5, delay: 0.4, type: 'spring' }}
                >
                  {daysUntilGoal}
                </MotionText>
                <Text fontSize="sm" color={mutedText} fontWeight="500">
                  {t('dashboard.daysToGo')}
                </Text>
              </VStack>
            </Flex>
          </MotionBox>
        )}

        {/* No goals placeholder */}
        {!nextGoal && (
          <MotionBox
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            // @ts-expect-error framer-motion transition type conflict
            transition={{ delay: 0.3 }}
          >
            <Flex
              align="center"
              gap={3}
              bg={cardBg}
              borderRadius="xl"
              p={4}
              mt={4}
              borderWidth="1px"
              borderColor={cardBorder}
              boxShadow={useColorModeValue('sm', 'none')}
            >
              <Target size={20} color="var(--chakra-colors-gray-500)" />
              <Text fontSize="sm" color={mutedText}>
                {t('dashboard.setGoalPrompt')}
              </Text>
            </Flex>
          </MotionBox>
        )}
      </Box>
    </Box>
  );
}

function getGreeting(t: (key: string) => string): string {
  const hour = new Date().getHours();
  if (hour < 12) return t('dashboard.goodMorning');
  if (hour < 17) return t('dashboard.goodAfternoon');
  return t('dashboard.goodEvening');
}
