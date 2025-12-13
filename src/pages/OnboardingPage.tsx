/**
 * OnboardingPage
 * Page component for the onboarding wizard
 */
import { useNavigate } from 'react-router-dom';
import { Box, Container, useColorModeValue } from '@chakra-ui/react';
import { useUser } from '../contexts/UserContext';
import { OnboardingWizard } from '../components/organisms/Onboarding';
import { Logo } from '../components/atoms/Logo';

export function OnboardingPage() {
  const navigate = useNavigate();
  const { user } = useUser();
  const bgColor = useColorModeValue('gray.50', 'gray.900');

  const handleComplete = () => {
    navigate('/dashboard', { replace: true });
  };

  if (!user) {
    return null;
  }

  return (
    <Box minH="100vh" bg={bgColor}>
      <Container maxW="container.sm" pt={6}>
        <Box textAlign="center" mb={4}>
          <Logo />
        </Box>
      </Container>
      <OnboardingWizard athleteId={user.id} onComplete={handleComplete} />
    </Box>
  );
}
