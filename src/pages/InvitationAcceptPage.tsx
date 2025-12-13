/**
 * InvitationAcceptPage - Page for athletes to accept coach invitations
 *
 * This page handles the invitation acceptance flow with Clerk integration:
 * 1. Checks for Clerk __clerk_ticket query param (from Clerk invitation email)
 * 2. Validates the invitation token from the URL
 * 3. Shows invitation details (coach name, message)
 * 4. Handles sign-up via Clerk ticket strategy for new users
 * 5. Creates coach-athlete relationship after successful signup
 *
 * Clerk Flow:
 * - User clicks invitation link in email
 * - Redirected to this page with __clerk_ticket param
 * - signUp.create({ strategy: 'ticket', ticket }) creates account with verified email
 * - publicMetadata from invitation includes coachId for relationship
 *
 * @module pages
 */
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Container,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  FormControl,
  FormLabel,
  Input,
  Alert,
  AlertIcon,
  AlertDescription,
  Spinner,
  Card,
  CardBody,
  Divider,
  useColorModeValue,
  Icon,
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { useSignUp, useAuth } from '@clerk/clerk-react';
import { Users, Mail, Calendar, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { api } from '../services/api';
import { useUser } from '../contexts/UserContext';

interface InvitationDetails {
  id: string;
  coachId: string;
  coachName: string;
  athleteEmail: string;
  athleteName?: string;
  personalMessage?: string;
  expiresAt: string;
  isExistingUser: boolean;
}

type PageState = 'loading' | 'valid' | 'expired' | 'not_found' | 'error' | 'accepted' | 'signing_up';

export function InvitationAcceptPage() {
  const { token } = useParams<{ token: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, refetch } = useUser();

  // Clerk hooks
  const { signUp, isLoaded: signUpLoaded, setActive } = useSignUp();
  const { isSignedIn } = useAuth();

  // Get __clerk_ticket from URL (appended by Clerk when user clicks invitation link)
  const clerkTicket = searchParams.get('__clerk_ticket');

  const [pageState, setPageState] = useState<PageState>('loading');
  const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAccepting, setIsAccepting] = useState(false);
  const [name, setName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');

  const bgColor = useColorModeValue('light.400', 'dark.800');
  const cardBg = useColorModeValue('white', 'dark.600');
  const borderColor = useColorModeValue('light.700', 'dark.400');
  const mutedColor = useColorModeValue('dark.200', 'light.800');

  // Validate invitation on mount
  useEffect(() => {
    async function validateInvitation() {
      if (!token) {
        setPageState('not_found');
        return;
      }

      try {
        interface ValidationResponse {
          valid: boolean;
          expired?: boolean;
          invitation?: InvitationDetails;
        }
        const data = await api.get<ValidationResponse>(`/api/email-invitations/validate/${token}`);

        if (!data.valid) {
          setPageState(data.expired ? 'expired' : 'not_found');
          return;
        }

        if (data.invitation) {
          setInvitation(data.invitation);
          setPageState('valid');

          // Pre-fill name if provided
          if (data.invitation.athleteName) {
            setName(data.invitation.athleteName);
          }
        }
      } catch (err: unknown) {
        console.error('Failed to validate invitation:', err);
        const apiErr = err as { status?: number; data?: { message?: string } };
        if (apiErr.status === 404) {
          setPageState('not_found');
        } else {
          setPageState('error');
          setError(apiErr.data?.message || t('common.error'));
        }
      }
    }

    validateInvitation();
  }, [token, t]);

  // Handle Clerk ticket sign-up when user arrives from invitation email
  const handleClerkSignUp = useCallback(async () => {
    if (!signUpLoaded || !signUp || !clerkTicket || !invitation) return;

    setPageState('signing_up');
    setError(null);

    try {
      // Create sign-up using the Clerk ticket (auto-verifies email)
      const signUpAttempt = await signUp.create({
        strategy: 'ticket',
        ticket: clerkTicket,
        firstName: firstName || invitation.athleteName?.split(' ')[0] || '',
        lastName: lastName || invitation.athleteName?.split(' ').slice(1).join(' ') || '',
        password,
      });

      if (signUpAttempt.status === 'complete') {
        // Set the new session as active
        await setActive({ session: signUpAttempt.createdSessionId });

        // Now accept the invitation via our API
        await api.post('/api/email-invitations/accept', {
          token,
          name: `${firstName} ${lastName}`.trim() || invitation.athleteName,
        });

        // Refresh user data after invitation accepted
        await refetch();

        setPageState('accepted');

        // Redirect to calendar after a short delay
        setTimeout(() => {
          navigate('/calendar');
        }, 2000);
      } else {
        // Need additional verification steps
        console.log('Sign-up requires additional steps:', signUpAttempt.status);
        setError(t('invitation.signUpIncomplete'));
        setPageState('valid');
      }
    } catch (err: unknown) {
      console.error('Failed to sign up with Clerk ticket:', err);
      const clerkErr = err as { errors?: Array<{ message?: string }>; message?: string };
      setError(clerkErr.errors?.[0]?.message || clerkErr.message || t('invitation.signUpFailed'));
      setPageState('valid');
    }
  }, [signUpLoaded, signUp, clerkTicket, invitation, firstName, lastName, password, setActive, token, refetch, navigate, t]);

  const handleAccept = useCallback(async () => {
    if (!token || !invitation) return;

    // Validate name for new users
    if (!invitation.isExistingUser && !name.trim()) {
      setError(t('invite.nameRequired'));
      return;
    }

    setIsAccepting(true);
    setError(null);

    try {
      await api.post('/api/email-invitations/accept', {
        token,
        name: name.trim() || undefined,
        // If logged in, use current user ID
        userId: user?.id,
      });

      // Refresh user context after invitation accepted
      await refetch();

      setPageState('accepted');

      // Redirect to calendar after a short delay
      setTimeout(() => {
        navigate('/calendar');
      }, 2000);
    } catch (err: unknown) {
      console.error('Failed to accept invitation:', err);
      const apiErr = err as { data?: { message?: string } };
      setError(apiErr.data?.message || t('invite.sendFailed'));
    } finally {
      setIsAccepting(false);
    }
  }, [token, invitation, name, user, refetch, navigate, t]);

  const formatExpiryDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Loading state
  if (pageState === 'loading') {
    return (
      <Box minH="100vh" bg={bgColor} display="flex" alignItems="center" justifyContent="center">
        <VStack spacing={4}>
          <Spinner size="xl" color="brand.400" thickness="4px" />
          <Text color={mutedColor}>{t('common.loading')}</Text>
        </VStack>
      </Box>
    );
  }

  // Signing up state (Clerk ticket processing)
  if (pageState === 'signing_up') {
    return (
      <Box minH="100vh" bg={bgColor} display="flex" alignItems="center" justifyContent="center">
        <VStack spacing={4}>
          <Spinner size="xl" color="brand.400" thickness="4px" />
          <Text color={mutedColor}>{t('invitation.creatingAccount')}</Text>
        </VStack>
      </Box>
    );
  }

  // Expired state
  if (pageState === 'expired') {
    return (
      <Box minH="100vh" bg={bgColor} display="flex" alignItems="center" justifyContent="center">
        <Container maxW="md">
          <Card bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="xl">
            <CardBody>
              <VStack spacing={6} textAlign="center" py={8}>
                <Icon as={Clock} boxSize={16} color="orange.400" />
                <Heading size="lg">{t('invitation.expired')}</Heading>
                <Text color={mutedColor}>
                  {t('invitation.expiredDescription')}
                </Text>
                <Button colorScheme="brand" onClick={() => navigate('/')}>
                  {t('common.back')}
                </Button>
              </VStack>
            </CardBody>
          </Card>
        </Container>
      </Box>
    );
  }

  // Not found state
  if (pageState === 'not_found') {
    return (
      <Box minH="100vh" bg={bgColor} display="flex" alignItems="center" justifyContent="center">
        <Container maxW="md">
          <Card bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="xl">
            <CardBody>
              <VStack spacing={6} textAlign="center" py={8}>
                <Icon as={AlertCircle} boxSize={16} color="red.400" />
                <Heading size="lg">{t('invitation.notFound')}</Heading>
                <Text color={mutedColor}>
                  {t('invitation.notFoundDescription')}
                </Text>
                <Button colorScheme="brand" onClick={() => navigate('/')}>
                  {t('common.back')}
                </Button>
              </VStack>
            </CardBody>
          </Card>
        </Container>
      </Box>
    );
  }

  // Error state
  if (pageState === 'error') {
    return (
      <Box minH="100vh" bg={bgColor} display="flex" alignItems="center" justifyContent="center">
        <Container maxW="md">
          <Card bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="xl">
            <CardBody>
              <VStack spacing={6} textAlign="center" py={8}>
                <Icon as={AlertCircle} boxSize={16} color="red.400" />
                <Heading size="lg">{t('common.error')}</Heading>
                <Text color={mutedColor}>{error}</Text>
                <Button colorScheme="brand" onClick={() => window.location.reload()}>
                  {t('common.retry')}
                </Button>
              </VStack>
            </CardBody>
          </Card>
        </Container>
      </Box>
    );
  }

  // Accepted state
  if (pageState === 'accepted') {
    return (
      <Box minH="100vh" bg={bgColor} display="flex" alignItems="center" justifyContent="center">
        <Container maxW="md">
          <Card bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="xl">
            <CardBody>
              <VStack spacing={6} textAlign="center" py={8}>
                <Icon as={CheckCircle} boxSize={16} color="green.400" />
                <Heading size="lg">{t('invitation.accepted')}</Heading>
                <Text color={mutedColor}>
                  {t('invitation.acceptedDescription', { coach: invitation?.coachName })}
                </Text>
                <Spinner size="sm" color="brand.400" />
              </VStack>
            </CardBody>
          </Card>
        </Container>
      </Box>
    );
  }

  // Valid invitation state
  return (
    <Box minH="100vh" bg={bgColor} py={12}>
      <Container maxW="md">
        <VStack spacing={6}>
          {/* Header */}
          <VStack spacing={2} textAlign="center">
            <Icon as={Users} boxSize={12} color="brand.400" />
            <Heading size="xl">{t('invitation.title')}</Heading>
          </VStack>

          {/* Invitation Card */}
          <Card bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="xl" w="full">
            <CardBody>
              <VStack spacing={6} align="stretch">
                {/* Coach info */}
                <VStack spacing={2}>
                  <Text fontSize="lg" fontWeight="medium" textAlign="center">
                    {t('invitation.coachInvites', { coach: invitation?.coachName })}
                  </Text>
                  <HStack justify="center" color={mutedColor} fontSize="sm">
                    <Mail size={14} />
                    <Text>{invitation?.athleteEmail}</Text>
                  </HStack>
                </VStack>

                {/* Personal message */}
                {invitation?.personalMessage && (
                  <>
                    <Divider />
                    <Box>
                      <Text fontSize="sm" color={mutedColor} mb={2}>
                        {t('invitation.personalMessage')}
                      </Text>
                      <Box
                        p={4}
                        bg={useColorModeValue('light.500', 'dark.700')}
                        borderRadius="lg"
                        fontStyle="italic"
                      >
                        "{invitation.personalMessage}"
                      </Box>
                    </Box>
                  </>
                )}

                {/* Expiry date */}
                <HStack justify="center" color={mutedColor} fontSize="sm">
                  <Calendar size={14} />
                  <Text>
                    {t('invitation.expiresOn', { date: formatExpiryDate(invitation?.expiresAt || '') })}
                  </Text>
                </HStack>

                <Divider />

                {/* Error alert */}
                {error && (
                  <Alert status="error" borderRadius="md">
                    <AlertIcon />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {/* Clerk sign-up form for new users with ticket */}
                {clerkTicket && !isSignedIn && !invitation?.isExistingUser && (
                  <Box>
                    <Text fontSize="sm" color={mutedColor} mb={3}>
                      {t('invitation.completeSignup')}
                    </Text>
                    <VStack spacing={4} align="stretch">
                      <HStack spacing={4}>
                        <FormControl isRequired>
                          <FormLabel>{t('invitation.firstName')}</FormLabel>
                          <Input
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            placeholder={t('invitation.firstNamePlaceholder')}
                          />
                        </FormControl>
                        <FormControl isRequired>
                          <FormLabel>{t('invitation.lastName')}</FormLabel>
                          <Input
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            placeholder={t('invitation.lastNamePlaceholder')}
                          />
                        </FormControl>
                      </HStack>
                      <FormControl isRequired>
                        <FormLabel>{t('invitation.password')}</FormLabel>
                        <Input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder={t('invitation.passwordPlaceholder')}
                        />
                      </FormControl>
                    </VStack>
                  </Box>
                )}

                {/* Fallback name input for non-Clerk flow */}
                {!clerkTicket && !invitation?.isExistingUser && !user && !isSignedIn && (
                  <Box>
                    <Text fontSize="sm" color={mutedColor} mb={3}>
                      {t('invitation.enterName')}
                    </Text>
                    <FormControl isRequired>
                      <FormLabel>{t('invitation.yourName')}</FormLabel>
                      <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={t('invitation.namePlaceholder')}
                      />
                    </FormControl>
                  </Box>
                )}

                {/* Existing account prompt */}
                {!invitation?.isExistingUser && !user && !isSignedIn && !clerkTicket && (
                  <HStack justify="center" fontSize="sm" color={mutedColor}>
                    <Text>{t('invitation.existingAccount')}</Text>
                    <Button variant="link" colorScheme="brand" size="sm">
                      {t('invitation.signInFirst')}
                    </Button>
                  </HStack>
                )}

                {/* Accept button - different handlers for Clerk vs fallback */}
                <Button
                  colorScheme="brand"
                  size="lg"
                  onClick={clerkTicket && !isSignedIn ? handleClerkSignUp : handleAccept}
                  isLoading={isAccepting}
                  loadingText={t('invitation.accepting')}
                >
                  {invitation?.isExistingUser || user
                    ? t('invitation.acceptInvite')
                    : t('invitation.createAccount')}
                </Button>
              </VStack>
            </CardBody>
          </Card>
        </VStack>
      </Container>
    </Box>
  );
}
