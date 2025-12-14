/**
 * AuthGuard
 * Route guard that redirects unauthenticated users to Clerk sign-in
 */
import { useAuth, RedirectToSignIn } from '@clerk/clerk-react';
import { Spinner, Center } from '@chakra-ui/react';
import type { ReactNode } from 'react';

interface AuthGuardProps {
  children: ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { isLoaded, isSignedIn } = useAuth();

  // Wait for Clerk to load
  if (!isLoaded) {
    return (
      <Center h="100vh">
        <Spinner size="xl" color="brand.500" />
      </Center>
    );
  }

  // Not signed in - redirect to Clerk sign-in
  if (!isSignedIn) {
    return <RedirectToSignIn />;
  }

  return <>{children}</>;
}
