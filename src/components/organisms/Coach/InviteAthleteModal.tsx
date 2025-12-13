/**
 * InviteAthleteModal - Modal for coaches to invite athletes via email
 *
 * Allows coaches to send email invitations to potential athletes with
 * an optional personal message.
 *
 * @module components/organisms/Coach
 */
import { useState, useCallback } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Button,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Input,
  Textarea,
  VStack,
  Text,
  Alert,
  AlertIcon,
  AlertDescription,
  useColorModeValue,
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { Mail, Send } from 'lucide-react';
import { api } from '../../../services/api';

interface InviteAthleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  coachId: string;
  onInviteSent?: () => void;
}

export function InviteAthleteModal({
  isOpen,
  onClose,
  coachId,
  onInviteSent,
}: InviteAthleteModalProps) {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const headerBg = useColorModeValue('gray.50', 'gray.800');

  const resetForm = useCallback(() => {
    setEmail('');
    setName('');
    setMessage('');
    setError(null);
    setSuccess(false);
  }, []);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = useCallback(async () => {
    setError(null);

    // Validate email
    if (!email.trim()) {
      setError(t('invite.emailRequired'));
      return;
    }
    if (!validateEmail(email)) {
      setError(t('invite.invalidEmail'));
      return;
    }

    setIsLoading(true);

    try {
      await api.post('/api/email-invitations', {
        coachId,
        athleteEmail: email.trim().toLowerCase(),
        athleteName: name.trim() || undefined,
        personalMessage: message.trim() || undefined,
      });

      setSuccess(true);
      onInviteSent?.();

      // Auto-close after success
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || t('invite.sendFailed');
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [email, name, message, coachId, t, onInviteSent, handleClose]);

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="md" isCentered>
      <ModalOverlay backdropFilter="blur(4px)" />
      <ModalContent>
        <ModalHeader bg={headerBg} borderTopRadius="md" display="flex" alignItems="center" gap={2}>
          <Mail size={20} />
          {t('invite.title')}
        </ModalHeader>
        <ModalCloseButton />

        <ModalBody py={6}>
          {success ? (
            <Alert status="success" borderRadius="md">
              <AlertIcon />
              <AlertDescription>{t('invite.sentSuccess')}</AlertDescription>
            </Alert>
          ) : (
            <VStack spacing={4}>
              <Text fontSize="sm" color="gray.500">
                {t('invite.description')}
              </Text>

              {error && (
                <Alert status="error" borderRadius="md">
                  <AlertIcon />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <FormControl isRequired isInvalid={!!error && !email}>
                <FormLabel>{t('invite.athleteEmail')}</FormLabel>
                <Input
                  type="email"
                  placeholder="athlete@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoFocus
                />
                <FormErrorMessage>{t('invite.emailRequired')}</FormErrorMessage>
              </FormControl>

              <FormControl>
                <FormLabel>{t('invite.athleteName')}</FormLabel>
                <Input
                  placeholder={t('invite.nameOptional')}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </FormControl>

              <FormControl>
                <FormLabel>{t('invite.personalMessage')}</FormLabel>
                <Textarea
                  placeholder={t('invite.messagePlaceholder')}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  resize="none"
                />
              </FormControl>
            </VStack>
          )}
        </ModalBody>

        {!success && (
          <ModalFooter gap={3}>
            <Button variant="ghost" onClick={handleClose}>
              {t('common.cancel')}
            </Button>
            <Button
              colorScheme="brand"
              leftIcon={<Send size={16} />}
              onClick={handleSubmit}
              isLoading={isLoading}
              loadingText={t('invite.sending')}
            >
              {t('invite.sendInvite')}
            </Button>
          </ModalFooter>
        )}
      </ModalContent>
    </Modal>
  );
}
