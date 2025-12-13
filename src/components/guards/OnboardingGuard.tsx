/**
 * OnboardingGuard
 * Route guard that redirects athletes to onboarding if not completed
 */
import { Navigate } from 'react-router-dom';
import { Spinner, Center } from '@chakra-ui/react';
import { useUser } from '../../contexts/UserContext';
import { useOnboarding } from '../../hooks/useOnboarding';
import type { ReactNode } from 'react';

interface OnboardingGuardProps {
  children: ReactNode;
}

export function OnboardingGuard({ children }: OnboardingGuardProps) {
  const { user, isCoach, isLoading: userLoading } = useUser();
  const { status, isLoading: statusLoading } = useOnboarding({ athleteId: user?.id });

  // Wait for both user and onboarding status to load
  if (userLoading || statusLoading) {
    return (
      <Center h="100vh">
        <Spinner size="xl" color="brand.500" />
      </Center>
    );
  }

  // No user, let other auth handle this
  if (!user) {
    return <>{children}</>;
  }

  // Coaches don't need onboarding (for now)
  if (isCoach) {
    return <>{children}</>;
  }

  // Athlete needs to complete onboarding
  if (status && !status.completed) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}
