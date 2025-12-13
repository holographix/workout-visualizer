import { useState } from 'react';
import {
  Box,
  Flex,
  Text,
  Heading,
  VStack,
  HStack,
  Button,
  Input,
  Textarea,
  Badge,
  IconButton,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Select,
  useDisclosure,
  useColorModeValue,
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { Target, Plus, Trash2, Calendar, Flag } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import type { Goal, GoalType } from '../../../types/availability';

interface GoalEditorProps {
  goals: Goal[];
  onChange: (goals: Goal[]) => void;
}

const GOAL_COLORS: Record<GoalType, string> = {
  A: 'red',
  B: 'orange',
  C: 'blue',
};


export function GoalEditor({ goals, onChange }: GoalEditorProps) {
  const { t } = useTranslation();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const headerBg = useColorModeValue('gray.50', 'gray.900');
  const mutedColor = useColorModeValue('gray.600', 'gray.400');
  const cardBg = useColorModeValue('gray.50', 'gray.700');

  const handleAddGoal = () => {
    setEditingGoal({
      id: `goal-${Date.now()}`,
      name: '',
      type: 'A',
      date: new Date(),
      description: '',
    });
    onOpen();
  };

  const handleEditGoal = (goal: Goal) => {
    setEditingGoal({ ...goal });
    onOpen();
  };

  const handleSaveGoal = () => {
    if (!editingGoal || !editingGoal.name.trim()) return;

    const existingIndex = goals.findIndex((g) => g.id === editingGoal.id);
    if (existingIndex >= 0) {
      const newGoals = [...goals];
      newGoals[existingIndex] = editingGoal;
      onChange(newGoals);
    } else {
      onChange([...goals, editingGoal]);
    }

    setEditingGoal(null);
    onClose();
  };

  const handleDeleteGoal = (goalId: string) => {
    onChange(goals.filter((g) => g.id !== goalId));
  };

  const sortedGoals = [...goals].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const aGoal = sortedGoals.find((g) => g.type === 'A');

  return (
    <>
      <Box
        bg={bgColor}
        borderRadius="xl"
        borderWidth="1px"
        borderColor={borderColor}
        overflow="hidden"
      >
        {/* Header */}
        <Flex
          bg={headerBg}
          px={4}
          py={3}
          borderBottomWidth="1px"
          borderColor={borderColor}
          justify="space-between"
          align="center"
        >
          <HStack spacing={2}>
            <Target size={18} />
            <Heading size="sm">{t('goals.title')}</Heading>
          </HStack>
          <Button
            leftIcon={<Plus size={14} />}
            colorScheme="brand"
            size="xs"
            onClick={handleAddGoal}
          >
            {t('goals.addGoal')}
          </Button>
        </Flex>

        {/* Goals List */}
        <VStack spacing={3} p={4} align="stretch">
          {sortedGoals.length === 0 ? (
            <Box textAlign="center" py={6}>
              <Flag size={32} color={mutedColor} style={{ margin: '0 auto', marginBottom: '8px' }} />
              <Text color={mutedColor} fontSize="sm">
                {t('goals.noGoalsYet')}
              </Text>
            </Box>
          ) : (
            sortedGoals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onEdit={() => handleEditGoal(goal)}
                onDelete={() => handleDeleteGoal(goal.id)}
                cardBg={cardBg}
                mutedColor={mutedColor}
              />
            ))
          )}
        </VStack>

        {/* A-Goal Summary */}
        {aGoal && (
          <Box
            px={4}
            py={3}
            borderTopWidth="1px"
            borderColor={borderColor}
            bg={headerBg}
          >
            <HStack justify="space-between">
              <Text fontSize="xs" color={mutedColor}>
                {t('goals.daysUntilAGoal')}
              </Text>
              <Badge colorScheme="red" fontSize="sm">
                {t('goals.daysCount', { count: differenceInDays(new Date(aGoal.date), new Date()) })}
              </Badge>
            </HStack>
          </Box>
        )}
      </Box>

      {/* Edit Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="md" isCentered>
        <ModalOverlay backdropFilter="blur(4px)" />
        <ModalContent>
          <ModalHeader>
            {editingGoal && goals.find((g) => g.id === editingGoal.id)
              ? t('goals.editGoal')
              : t('goals.addNewGoal')}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel fontSize="sm">{t('goals.eventName')}</FormLabel>
                <Input
                  value={editingGoal?.name || ''}
                  onChange={(e) =>
                    setEditingGoal((prev) => (prev ? { ...prev, name: e.target.value } : null))
                  }
                  placeholder={t('goals.eventNamePlaceholder')}
                />
              </FormControl>

              <HStack spacing={4} w="full">
                <FormControl isRequired>
                  <FormLabel fontSize="sm">{t('goals.priority')}</FormLabel>
                  <Select
                    value={editingGoal?.type || 'A'}
                    onChange={(e) =>
                      setEditingGoal((prev) =>
                        prev ? { ...prev, type: e.target.value as GoalType } : null
                      )
                    }
                  >
                    <option value="A">{t('goals.priorityA')}</option>
                    <option value="B">{t('goals.priorityB')}</option>
                    <option value="C">{t('goals.priorityC')}</option>
                  </Select>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel fontSize="sm">{t('goals.eventDate')}</FormLabel>
                  <Input
                    type="date"
                    value={
                      editingGoal?.date
                        ? format(new Date(editingGoal.date), 'yyyy-MM-dd')
                        : ''
                    }
                    onChange={(e) =>
                      setEditingGoal((prev) =>
                        prev ? { ...prev, date: new Date(e.target.value) } : null
                      )
                    }
                  />
                </FormControl>
              </HStack>

              <FormControl>
                <FormLabel fontSize="sm">{t('goals.eventType')}</FormLabel>
                <Select
                  value={editingGoal?.eventType || ''}
                  onChange={(e) =>
                    setEditingGoal((prev) =>
                      prev ? { ...prev, eventType: e.target.value } : null
                    )
                  }
                  placeholder={t('goals.selectType')}
                >
                  <option value="road-race">{t('goals.eventTypes.roadRace')}</option>
                  <option value="gran-fondo">{t('goals.eventTypes.granFondo')}</option>
                  <option value="time-trial">{t('goals.eventTypes.timeTrial')}</option>
                  <option value="criterium">{t('goals.eventTypes.criterium')}</option>
                  <option value="sportive">{t('goals.eventTypes.sportive')}</option>
                  <option value="gravel">{t('goals.eventTypes.gravel')}</option>
                  <option value="mtb">{t('goals.eventTypes.mtb')}</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel fontSize="sm">{t('goals.notes')}</FormLabel>
                <Textarea
                  value={editingGoal?.description || ''}
                  onChange={(e) =>
                    setEditingGoal((prev) =>
                      prev ? { ...prev, description: e.target.value } : null
                    )
                  }
                  placeholder={t('goals.notesPlaceholder')}
                  rows={2}
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button
              colorScheme="brand"
              onClick={handleSaveGoal}
              isDisabled={!editingGoal?.name.trim()}
            >
              {t('goals.saveGoal')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}

interface GoalCardProps {
  goal: Goal;
  onEdit: () => void;
  onDelete: () => void;
  cardBg: string;
  mutedColor: string;
}

function GoalCard({ goal, onEdit, onDelete, cardBg, mutedColor }: GoalCardProps) {
  const { t } = useTranslation();
  const daysUntil = differenceInDays(new Date(goal.date), new Date());
  const isPast = daysUntil < 0;

  return (
    <Box
      bg={cardBg}
      borderRadius="lg"
      p={3}
      cursor="pointer"
      onClick={onEdit}
      _hover={{ transform: 'scale(1.01)' }}
      transition="all 0.2s"
      opacity={isPast ? 0.6 : 1}
    >
      <HStack justify="space-between" mb={2}>
        <HStack spacing={2}>
          <Badge colorScheme={GOAL_COLORS[goal.type]} fontSize="xs">
            {t('goals.goalLabel', { type: goal.type })}
          </Badge>
          {goal.eventType && (
            <Badge variant="outline" fontSize="xs">
              {t(`goals.eventTypes.${goal.eventType.replace('-', '')}`, { defaultValue: goal.eventType })}
            </Badge>
          )}
        </HStack>
        <IconButton
          aria-label={t('goals.deleteGoal')}
          icon={<Trash2 size={14} />}
          size="xs"
          variant="ghost"
          colorScheme="red"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        />
      </HStack>

      <Text fontWeight="semibold" fontSize="sm" mb={1}>
        {goal.name}
      </Text>

      <HStack spacing={4} fontSize="xs" color={mutedColor}>
        <HStack spacing={1}>
          <Calendar size={12} />
          <Text>{format(new Date(goal.date), 'MMM d, yyyy')}</Text>
        </HStack>
        <Text>
          {isPast
            ? t('goals.daysAgo', { count: Math.abs(daysUntil) })
            : daysUntil === 0
            ? t('goals.today')
            : t('goals.daysCount', { count: daysUntil })}
        </Text>
      </HStack>

      {goal.description && (
        <Text fontSize="xs" color={mutedColor} mt={2} noOfLines={2}>
          {goal.description}
        </Text>
      )}
    </Box>
  );
}
