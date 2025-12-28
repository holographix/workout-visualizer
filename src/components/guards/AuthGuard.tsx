/**
 * AuthGuard
 * Route guard that shows Clerk sign-in for unauthenticated users
 */
import { useAuth, SignIn } from '@clerk/clerk-react';
import { Spinner, Center, Box } from '@chakra-ui/react';
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

  // Not signed in - show embedded Clerk sign-in
  if (!isSignedIn) {
    return (
      <Center h="100vh" bg="gray.50" _dark={{ bg: 'gray.900' }}>
        <Box>
          <SignIn
            appearance={{
              elements: {
                rootBox: {
                  boxShadow: 'lg',
                  borderRadius: 'xl',
                },
              },
            }}
          />
        </Box>
      </Center>
    );
  }

  return <>{children}</>;
}
