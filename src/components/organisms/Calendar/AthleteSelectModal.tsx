import { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  FormControl,
  FormLabel,
  Select,
  VStack,
  Text,
  useToast,
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';

export interface AthleteOption {
  id: string;
  fullName: string;
  ftp?: number | null;
}

interface AthleteSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  athletes: AthleteOption[];
  selectedLeft?: string | null;
  selectedRight?: string | null;
  onConfirm: (leftAthleteId: string, rightAthleteId: string) => void;
}

export function AthleteSelectModal({
  isOpen,
  onClose,
  athletes,
  selectedLeft,
  selectedRight,
  onConfirm,
}: AthleteSelectModalProps) {
  const { t } = useTranslation();
  const toast = useToast();

  const [leftAthleteId, setLeftAthleteId] = useState<string>(selectedLeft || '');
  const [rightAthleteId, setRightAthleteId] = useState<string>(selectedRight || '');

  // Update local state when props change
  useEffect(() => {
    if (selectedLeft) setLeftAthleteId(selectedLeft);
    if (selectedRight) setRightAthleteId(selectedRight);
  }, [selectedLeft, selectedRight]);

  const handleConfirm = () => {
    // Validation: Both athletes must be selected
    if (!leftAthleteId || !rightAthleteId) {
      toast({
        title: t('athleteComparison.selectModal.selectionRequired'),
        description: t('athleteComparison.selectModal.selectBothAthletes'),
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // Validation: Cannot select same athlete twice
    if (leftAthleteId === rightAthleteId) {
      toast({
        title: t('athleteComparison.selectModal.invalidSelection'),
        description: t('athleteComparison.selectModal.cannotCompareSameAthlete'),
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    onConfirm(leftAthleteId, rightAthleteId);
    onClose();
  };

  const handleLeftChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setLeftAthleteId(value);

    // Prevent same athlete selection
    if (value === rightAthleteId) {
      toast({
        title: t('athleteComparison.selectModal.invalidSelection'),
        description: t('athleteComparison.selectModal.selectDifferentAthlete'),
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      setLeftAthleteId(selectedLeft || '');
    }
  };

  const handleRightChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setRightAthleteId(value);

    // Prevent same athlete selection
    if (value === leftAthleteId) {
      toast({
        title: t('athleteComparison.selectModal.invalidSelection'),
        description: t('athleteComparison.selectModal.selectDifferentAthlete'),
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      setRightAthleteId(selectedRight || '');
    }
  };

  // Sort athletes alphabetically
  const sortedAthletes = [...athletes].sort((a, b) =>
    a.fullName.localeCompare(b.fullName)
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" isCentered>
      <ModalOverlay />
      <ModalContent data-testid="athlete-select-modal">
        <ModalHeader>{t('athleteComparison.selectModal.title')}</ModalHeader>
        <ModalBody>
          <VStack spacing={6} align="stretch">
            <Text fontSize="sm" color="gray.600">
              {t('athleteComparison.selectModal.description')}
            </Text>

            <FormControl>
              <FormLabel>{t('athleteComparison.selectModal.leftCalendar')}</FormLabel>
              <Select
                data-testid="left-athlete-dropdown"
                placeholder={t('athleteComparison.selectModal.selectAthlete')}
                value={leftAthleteId}
                onChange={handleLeftChange}
              >
                {sortedAthletes.map((athlete) => (
                  <option key={athlete.id} value={athlete.id}>
                    {athlete.fullName}
                    {athlete.ftp && ` - FTP: ${athlete.ftp}W`}
                  </option>
                ))}
              </Select>
            </FormControl>

            <FormControl>
              <FormLabel>{t('athleteComparison.selectModal.rightCalendar')}</FormLabel>
              <Select
                data-testid="right-athlete-dropdown"
                placeholder={t('athleteComparison.selectModal.selectAthlete')}
                value={rightAthleteId}
                onChange={handleRightChange}
              >
                {sortedAthletes.map((athlete) => (
                  <option key={athlete.id} value={athlete.id}>
                    {athlete.fullName}
                    {athlete.ftp && ` - FTP: ${athlete.ftp}W`}
                  </option>
                ))}
              </Select>
            </FormControl>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button
            colorScheme="blue"
            onClick={handleConfirm}
            data-testid="compare-athletes-button"
            isDisabled={!leftAthleteId || !rightAthleteId}
          >
            {t('athleteComparison.selectModal.compare')}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
