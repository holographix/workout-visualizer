import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Icon,
  Input,
  InputGroup,
  InputLeftElement,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Text,
  VStack,
  useColorModeValue,
  useDisclosure,
  Tooltip,
} from '@chakra-ui/react';
import { FolderOpen, Zap, Search, Clock, TrendingUp, Upload } from 'lucide-react';
import { WorkoutUploadModal } from './WorkoutUpload';
import { workoutLibrary, type WorkoutCategory, type WorkoutLibraryItem } from '../../data/workoutLibrary';
import type { Workout } from '../../types/workout';
import type { ConvertedWorkout } from '../../types/workoutUpload';
import { getWorkoutTypeConfig } from '../../utils/workoutTypes';

interface WorkoutLibraryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectWorkout: (workout: Workout) => void;
  onImportWorkout?: (workout: ConvertedWorkout) => Promise<void>;
  categories?: Array<{ id: string; name: string }>;
}

const formatDuration = (hours: number): string => {
  if (hours < 1) return `${Math.round(hours * 60)}min`;
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
};

export function WorkoutLibrary({
  isOpen,
  onClose,
  onSelectWorkout,
  onImportWorkout,
  categories = [],
}: WorkoutLibraryProps) {
  const { t } = useTranslation();
  const [selectedCategory, setSelectedCategory] = useState<string>(workoutLibrary[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState('');
  const {
    isOpen: isUploadOpen,
    onOpen: onUploadOpen,
    onClose: onUploadClose,
  } = useDisclosure();

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const sidebarBg = useColorModeValue('gray.50', 'gray.900');
  const inputBg = useColorModeValue('white', 'gray.900');
  const cardBg = useColorModeValue('gray.50', 'gray.700');
  const cardHoverBg = useColorModeValue('gray.100', 'gray.600');
  const textColor = useColorModeValue('gray.800', 'white');
  const mutedColor = useColorModeValue('gray.500', 'gray.400');

  const currentCategory = useMemo(() => {
    return workoutLibrary.find(c => c.id === selectedCategory);
  }, [selectedCategory]);

  const filteredWorkouts = useMemo(() => {
    if (!currentCategory) return [];
    if (!searchQuery.trim()) return currentCategory.workouts;

    const query = searchQuery.toLowerCase();
    return currentCategory.workouts.filter(w =>
      w.name.toLowerCase().includes(query) ||
      w.workout.title.toLowerCase().includes(query) ||
      w.workout.description?.toLowerCase().includes(query)
    );
  }, [currentCategory, searchQuery]);

  const handleSelectWorkout = (item: WorkoutLibraryItem) => {
    onSelectWorkout(item.workout);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="4xl" isCentered scrollBehavior="inside">
      <ModalOverlay backdropFilter="blur(4px)" />
      <ModalContent bg={bgColor} maxH="85vh">
        <ModalHeader borderBottomWidth="1px" borderColor={borderColor}>
          <HStack justify="space-between" w="full" pr={8}>
            <HStack spacing={3}>
              <Flex
                w={10}
                h={10}
                borderRadius="xl"
                bgGradient="linear(to-br, purple.500, blue.600)"
                align="center"
                justify="center"
              >
                <Icon as={FolderOpen} w={5} h={5} color="white" />
              </Flex>
              <Box>
                <Heading size="md">{t('library.title')}</Heading>
                <Text fontSize="xs" color={mutedColor} fontWeight="normal">
                  {t('library.selectToVisualize')}
                </Text>
              </Box>
            </HStack>
            {onImportWorkout && (
              <Tooltip label={t('workoutUpload.title', 'Import Workout')}>
                <Button
                  leftIcon={<Upload size={16} />}
                  size="sm"
                  colorScheme="brand"
                  variant="outline"
                  onClick={onUploadOpen}
                >
                  {t('workoutUpload.import', 'Import')}
                </Button>
              </Tooltip>
            )}
          </HStack>
        </ModalHeader>
        <ModalCloseButton />

        <ModalBody p={0}>
          <Flex h="60vh">
            {/* Category Sidebar */}
            <VStack
              w="220px"
              bg={sidebarBg}
              borderRightWidth="1px"
              borderColor={borderColor}
              p={3}
              spacing={1}
              align="stretch"
              flexShrink={0}
            >
              {workoutLibrary.map((category) => (
                <CategoryButton
                  key={category.id}
                  category={category}
                  isSelected={selectedCategory === category.id}
                  onClick={() => {
                    setSelectedCategory(category.id);
                    setSearchQuery('');
                  }}
                />
              ))}
            </VStack>

            {/* Workout List */}
            <Flex flex={1} direction="column" overflow="hidden">
              {/* Search */}
              <Box p={3} borderBottomWidth="1px" borderColor={borderColor}>
                <InputGroup size="sm">
                  <InputLeftElement>
                    <Icon as={Search} w={4} h={4} color={mutedColor} />
                  </InputLeftElement>
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('library.searchPlaceholder')}
                    bg={inputBg}
                  />
                </InputGroup>
              </Box>

              {/* Category Description */}
              {currentCategory && (
                <Box px={4} py={2} bg={sidebarBg}>
                  <Text fontSize="xs" color={mutedColor}>
                    {currentCategory.description}
                  </Text>
                </Box>
              )}

              {/* Workouts Grid */}
              <Box flex={1} overflowY="auto" p={3}>
                {filteredWorkouts.length === 0 ? (
                  <Flex align="center" justify="center" h="full">
                    <Text color={mutedColor} fontSize="sm">
                      {t('library.noWorkoutsFound')}
                    </Text>
                  </Flex>
                ) : (
                  <VStack spacing={3} align="stretch">
                    {filteredWorkouts.map((item) => (
                      <WorkoutCard
                        key={item.id}
                        item={item}
                        onClick={() => handleSelectWorkout(item)}
                        cardBg={cardBg}
                        cardHoverBg={cardHoverBg}
                        textColor={textColor}
                        mutedColor={mutedColor}
                        borderColor={borderColor}
                      />
                    ))}
                  </VStack>
                )}
              </Box>
            </Flex>
          </Flex>
        </ModalBody>
      </ModalContent>

      {/* Upload Modal */}
      {onImportWorkout && (
        <WorkoutUploadModal
          isOpen={isUploadOpen}
          onClose={onUploadClose}
          onImport={onImportWorkout}
          categories={categories}
        />
      )}
    </Modal>
  );
}

interface CategoryButtonProps {
  category: WorkoutCategory;
  isSelected: boolean;
  onClick: () => void;
}

function CategoryButton({ category, isSelected, onClick }: CategoryButtonProps) {
  const selectedBg = useColorModeValue('blue.500', 'blue.600');
  const hoverBg = useColorModeValue('gray.200', 'gray.700');
  const countBg = useColorModeValue('gray.200', 'gray.700');
  const selectedCountBg = useColorModeValue('blue.400', 'blue.500');

  return (
    <Button
      onClick={onClick}
      variant="ghost"
      justifyContent="space-between"
      bg={isSelected ? selectedBg : 'transparent'}
      color={isSelected ? 'white' : undefined}
      _hover={{ bg: isSelected ? selectedBg : hoverBg }}
      size="sm"
      px={3}
      py={5}
    >
      <Text fontSize="sm" fontWeight="medium">
        {category.name}
      </Text>
      <Box
        px={1.5}
        py={0.5}
        borderRadius="md"
        bg={isSelected ? selectedCountBg : countBg}
        fontSize="xs"
      >
        {category.workouts.length}
      </Box>
    </Button>
  );
}

interface WorkoutCardProps {
  item: WorkoutLibraryItem;
  onClick: () => void;
  cardBg: string;
  cardHoverBg: string;
  textColor: string;
  mutedColor: string;
  borderColor: string;
}

function WorkoutCard({
  item,
  onClick,
  cardBg,
  cardHoverBg,
  textColor,
  mutedColor,
  borderColor,
}: WorkoutCardProps) {
  const { workout } = item;
  const duration = workout.attributes.totalTimePlanned;
  const tss = workout.attributes.tssPlanned;
  const intensity = workout.attributes.ifPlanned;
  const workoutTypeConfig = getWorkoutTypeConfig(workout.attributes?.workoutType);
  const WorkoutTypeIcon = workoutTypeConfig.icon;

  return (
    <Box
      as="button"
      onClick={onClick}
      w="full"
      textAlign="left"
      p={4}
      bg={cardBg}
      _hover={{ bg: cardHoverBg }}
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="xl"
      transition="all 0.2s"
      role="group"
    >
      <HStack justify="space-between" mb={2}>
        <HStack spacing={2}>
          <Icon as={WorkoutTypeIcon} w={4} h={4} color={`${workoutTypeConfig.color}.500`} />
          <Text fontWeight="medium" color={textColor} _groupHover={{ color: 'blue.400' }}>
            {item.name}
          </Text>
        </HStack>
        <Icon
          as={Zap}
          w={4}
          h={4}
          color="yellow.500"
          opacity={0}
          _groupHover={{ opacity: 1 }}
          transition="opacity 0.2s"
        />
      </HStack>

      {workout.description && (
        <Text fontSize="xs" color={mutedColor} mb={3} noOfLines={2}>
          {workout.description}
        </Text>
      )}

      <HStack spacing={4} fontSize="xs" color={mutedColor}>
        <HStack spacing={1}>
          <Icon as={Clock} w={3.5} h={3.5} />
          <Text>{formatDuration(duration)}</Text>
        </HStack>
        <HStack spacing={1}>
          <Icon as={Zap} w={3.5} h={3.5} color="yellow.500" />
          <Text>{Math.round(tss)} TSS</Text>
        </HStack>
        <HStack spacing={1}>
          <Icon as={TrendingUp} w={3.5} h={3.5} color="green.500" />
          <Text>IF {intensity.toFixed(2)}</Text>
        </HStack>
      </HStack>
    </Box>
  );
}
