/**
 * AssessmentModal
 * Modal for recording or editing fitness assessment results
 */
import { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  VStack,
  HStack,
  Text,
  Heading,
  Button,
  useColorModeValue,
  useToast,
  Box,
  Icon,
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, Mountain, Timer } from 'lucide-react';
import { useAssessments } from '../../../hooks/useAssessments';
import { Sprint12Form } from './Sprint12Form';
import { Power125Form } from './Power125Form';
import type { Assessment, AssessmentType, Sprint12MinData, Power125MinData } from '../../../types/assessment';

interface AssessmentModalProps {
  athleteId: string;
  isOpen: boolean;
  onClose: () => void;
  onSave?: () => void;
  editingAssessment?: Assessment | null;
}

export function AssessmentModal({ athleteId, isOpen, onClose, onSave, editingAssessment }: AssessmentModalProps) {
  const { t } = useTranslation();
  const toast = useToast();
  const [selectedProtocol, setSelectedProtocol] = useState<AssessmentType | null>(null);
  const {
    createSprint12MinAssessment,
    createPower125MinAssessment,
    updateAssessment,
    isSaving,
  } = useAssessments({ athleteId });

  const isEditMode = !!editingAssessment;

  // Set protocol when editing
  useEffect(() => {
    if (editingAssessment) {
      setSelectedProtocol(editingAssessment.testType);
    }
  }, [editingAssessment]);

  const bgColor = useColorModeValue('gray.50', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const hoverBg = useColorModeValue('brand.50', 'brand.900');

  const handleBack = () => {
    setSelectedProtocol(null);
  };

  const handleClose = () => {
    setSelectedProtocol(null);
    onClose();
  };

  const handleSprint12Submit = async (data: Sprint12MinData) => {
    try {
      if (isEditMode && editingAssessment) {
        await updateAssessment(editingAssessment.id, data);
        toast({
          title: t('assessment.updated', 'Assessment updated'),
          status: 'success',
          duration: 3000,
        });
      } else {
        await createSprint12MinAssessment(data);
        toast({
          title: t('assessment.saved'),
          status: 'success',
          duration: 3000,
        });
      }
      onSave?.();
      handleClose();
    } catch (error) {
      toast({
        title: t('common.error'),
        description: error instanceof Error ? error.message : 'Failed to save',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const handlePower125Submit = async (data: Power125MinData) => {
    try {
      if (isEditMode && editingAssessment) {
        await updateAssessment(editingAssessment.id, data);
        toast({
          title: t('assessment.updated', 'Assessment updated'),
          status: 'success',
          duration: 3000,
        });
      } else {
        await createPower125MinAssessment(data);
        toast({
          title: t('assessment.saved'),
          status: 'success',
          duration: 3000,
        });
      }
      onSave?.();
      handleClose();
    } catch (error) {
      toast({
        title: t('common.error'),
        description: error instanceof Error ? error.message : 'Failed to save',
        status: 'error',
        duration: 3000,
      });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <HStack>
            {selectedProtocol && !isEditMode && (
              <Button variant="ghost" size="sm" onClick={handleBack} mr={2}>
                <ChevronLeft size={20} />
              </Button>
            )}
            <Text>
              {isEditMode
                ? t('assessment.editAssessment', 'Edit Assessment')
                : selectedProtocol
                  ? t(`assessment.protocols.${selectedProtocol === 'SPRINT_12MIN' ? 'sprint12min' : 'power125min'}.title`)
                  : t('assessment.selectProtocol')}
            </Text>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          {!selectedProtocol ? (
            <VStack spacing={4}>
              {/* Sprint + 12min Protocol */}
              <Box
                as="button"
                w="full"
                bg={bgColor}
                borderWidth="2px"
                borderColor={borderColor}
                borderRadius="xl"
                p={5}
                textAlign="left"
                transition="all 0.2s"
                _hover={{ bg: hoverBg, borderColor: 'brand.500' }}
                onClick={() => setSelectedProtocol('SPRINT_12MIN')}
              >
                <HStack spacing={4}>
                  <Box
                    bg="brand.500"
                    color="white"
                    p={3}
                    borderRadius="lg"
                  >
                    <Icon as={Mountain} boxSize={6} />
                  </Box>
                  <VStack align="start" spacing={1} flex={1}>
                    <Heading size="sm">
                      {t('assessment.protocols.sprint12min.title')}
                    </Heading>
                    <Text fontSize="sm" color="gray.500">
                      {t('assessment.protocols.sprint12min.description')}
                    </Text>
                  </VStack>
                </HStack>
              </Box>

              {/* 1/2/5min Protocol */}
              <Box
                as="button"
                w="full"
                bg={bgColor}
                borderWidth="2px"
                borderColor={borderColor}
                borderRadius="xl"
                p={5}
                textAlign="left"
                transition="all 0.2s"
                _hover={{ bg: hoverBg, borderColor: 'brand.500' }}
                onClick={() => setSelectedProtocol('POWER_1_2_5MIN')}
              >
                <HStack spacing={4}>
                  <Box
                    bg="orange.500"
                    color="white"
                    p={3}
                    borderRadius="lg"
                  >
                    <Icon as={Timer} boxSize={6} />
                  </Box>
                  <VStack align="start" spacing={1} flex={1}>
                    <Heading size="sm">
                      {t('assessment.protocols.power125min.title')}
                    </Heading>
                    <Text fontSize="sm" color="gray.500">
                      {t('assessment.protocols.power125min.description')}
                    </Text>
                  </VStack>
                </HStack>
              </Box>
            </VStack>
          ) : selectedProtocol === 'SPRINT_12MIN' ? (
            <Sprint12Form
              onSubmit={handleSprint12Submit}
              isLoading={isSaving}
              initialValues={editingAssessment && editingAssessment.testType === 'SPRINT_12MIN' ? {
                testDate: editingAssessment.testDate,
                sprintPeakPower: editingAssessment.sprintPeakPower ?? undefined,
                sprintMaxHR: editingAssessment.sprintMaxHR ?? undefined,
                climb12AvgPower: editingAssessment.climb12AvgPower ?? undefined,
                climb12MaxHR: editingAssessment.climb12MaxHR ?? undefined,
                notes: editingAssessment.notes ?? undefined,
              } : undefined}
            />
          ) : (
            <Power125Form
              onSubmit={handlePower125Submit}
              isLoading={isSaving}
              initialValues={editingAssessment && editingAssessment.testType === 'POWER_1_2_5MIN' ? {
                testDate: editingAssessment.testDate,
                effort1minAvgPower: editingAssessment.effort1minAvgPower ?? undefined,
                effort1minMaxHR: editingAssessment.effort1minMaxHR ?? undefined,
                effort2minAvgPower: editingAssessment.effort2minAvgPower ?? undefined,
                effort2minMaxHR: editingAssessment.effort2minMaxHR ?? undefined,
                effort5minAvgPower: editingAssessment.effort5minAvgPower ?? undefined,
                effort5minMaxHR: editingAssessment.effort5minMaxHR ?? undefined,
                notes: editingAssessment.notes ?? undefined,
              } : undefined}
            />
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
