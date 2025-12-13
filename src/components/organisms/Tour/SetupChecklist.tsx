/**
 * SetupChecklist - Persistent checklist for new athletes to complete setup
 *
 * Shows a list of tasks:
 * - Complete profile in settings
 * - Set availability
 * - Set training goals
 * - Complete fitness assessment
 *
 * Can be dismissed and tracks completion state via API.
 */
import {
  Box,
  VStack,
  HStack,
  Text,
  Icon,
  IconButton,
  Progress,
  Link as ChakraLink,
  useColorModeValue,
  chakra,
  Collapse,
} from '@chakra-ui/react';
import { motion, isValidMotionProp } from 'framer-motion';
import { Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { User, Calendar, Target, Activity, Check, X, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { CHECKLIST_ITEMS, type ChecklistItemId } from '../../../types/tour';

const MotionBox = chakra(motion.div, {
  shouldForwardProp: (prop) => isValidMotionProp(prop) || prop === 'children',
});

const iconMap = {
  user: User,
  calendar: Calendar,
  target: Target,
  activity: Activity,
};

interface SetupChecklistProps {
  completedItems: string[];
  onDismiss?: () => void;
  onItemComplete?: (itemId: ChecklistItemId) => void;
}

export function SetupChecklist({
  completedItems,
  onDismiss,
  onItemComplete,
}: SetupChecklistProps) {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(true);

  const totalItems = CHECKLIST_ITEMS.length;
  const completedCount = completedItems.length;
  const progress = (completedCount / totalItems) * 100;

  // Colors
  const cardBg = useColorModeValue('white', 'dark.700');
  const cardBorder = useColorModeValue('gray.100', 'dark.500');
  const headerBg = useColorModeValue('brand.50', 'brand.900');
  const labelColor = useColorModeValue('gray.500', 'gray.400');
  const textColor = useColorModeValue('gray.900', 'white');
  const completedBg = useColorModeValue('green.50', 'green.900');
  const completedBorder = useColorModeValue('green.200', 'green.700');
  const itemBg = useColorModeValue('gray.50', 'dark.600');
  const itemBorder = useColorModeValue('gray.100', 'dark.500');
  const hoverBg = useColorModeValue('brand.50', 'brand.900');

  // All items completed - show completion message
  if (completedCount === totalItems) {
    return (
      <MotionBox
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        // @ts-expect-error framer-motion transition type conflict
        transition={{ duration: 0.4 }}
      >
        <Box
          bg={completedBg}
          borderRadius="xl"
          p={4}
          borderWidth="1px"
          borderColor={completedBorder}
        >
          <HStack spacing={3}>
            <Box
              bg="green.400"
              borderRadius="full"
              p={2}
              color="white"
            >
              <Check size={20} />
            </Box>
            <VStack align="start" spacing={0}>
              <Text fontWeight="600" color={textColor}>
                {t('tour.checklist.allComplete.title', 'Setup Complete!')}
              </Text>
              <Text fontSize="sm" color={labelColor}>
                {t('tour.checklist.allComplete.description', 'You\'re all set to start training')}
              </Text>
            </VStack>
          </HStack>
        </Box>
      </MotionBox>
    );
  }

  return (
    <MotionBox
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      // @ts-expect-error framer-motion transition type conflict
      transition={{ duration: 0.4 }}
    >
      <Box
        bg={cardBg}
        borderRadius="xl"
        borderWidth="1px"
        borderColor={cardBorder}
        boxShadow={useColorModeValue('sm', 'none')}
        overflow="hidden"
      >
        {/* Header */}
        <Box bg={headerBg} px={4} py={3}>
          <HStack justify="space-between">
            <HStack spacing={3}>
              <Text fontWeight="600" color={textColor}>
                {t('tour.checklist.title', 'Get Started')}
              </Text>
              <Text fontSize="sm" color={labelColor}>
                {completedCount}/{totalItems}
              </Text>
            </HStack>
            <HStack spacing={1}>
              <IconButton
                aria-label={isExpanded ? 'Collapse' : 'Expand'}
                icon={isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                size="sm"
                variant="ghost"
                onClick={() => setIsExpanded(!isExpanded)}
              />
              {onDismiss && (
                <IconButton
                  aria-label={t('tour.checklist.dismiss', 'Dismiss')}
                  icon={<X size={18} />}
                  size="sm"
                  variant="ghost"
                  onClick={onDismiss}
                />
              )}
            </HStack>
          </HStack>
          <Progress
            value={progress}
            size="sm"
            colorScheme="brand"
            borderRadius="full"
            mt={2}
            bg={useColorModeValue('brand.100', 'brand.800')}
          />
        </Box>

        {/* Checklist items */}
        <Collapse in={isExpanded} animateOpacity>
          <VStack spacing={0} p={2}>
            {CHECKLIST_ITEMS.map((item) => {
              const isCompleted = completedItems.includes(item.id);
              const IconComponent = iconMap[item.icon as keyof typeof iconMap];

              return (
                <ChakraLink
                  key={item.id}
                  as={RouterLink}
                  to={item.linkTo}
                  _hover={{ textDecoration: 'none' }}
                  width="100%"
                  onClick={() => {
                    if (!isCompleted && onItemComplete) {
                      onItemComplete(item.id);
                    }
                  }}
                >
                  <HStack
                    spacing={3}
                    p={3}
                    borderRadius="lg"
                    bg={isCompleted ? completedBg : itemBg}
                    borderWidth="1px"
                    borderColor={isCompleted ? completedBorder : itemBorder}
                    _hover={{ bg: isCompleted ? completedBg : hoverBg }}
                    cursor="pointer"
                    transition="all 0.2s"
                    mb={1}
                  >
                    <Box
                      borderRadius="full"
                      p={2}
                      bg={isCompleted ? 'green.400' : useColorModeValue('gray.200', 'dark.500')}
                      color={isCompleted ? 'white' : labelColor}
                    >
                      {isCompleted ? (
                        <Check size={16} />
                      ) : (
                        <Icon as={IconComponent} boxSize={4} />
                      )}
                    </Box>
                    <VStack align="start" spacing={0} flex={1}>
                      <Text
                        fontSize="sm"
                        fontWeight="500"
                        color={isCompleted ? labelColor : textColor}
                        textDecoration={isCompleted ? 'line-through' : 'none'}
                      >
                        {t(item.titleKey, item.id)}
                      </Text>
                      <Text fontSize="xs" color={labelColor}>
                        {t(item.descriptionKey, '')}
                      </Text>
                    </VStack>
                  </HStack>
                </ChakraLink>
              );
            })}
          </VStack>
        </Collapse>
      </Box>
    </MotionBox>
  );
}
