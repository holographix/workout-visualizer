import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
} from '@clerk/clerk-react';
import {
  Button,
  HStack,
  Icon,
} from '@chakra-ui/react';
import { LogIn } from 'lucide-react';

export function AuthHeader() {
  return (
    <HStack spacing={3}>
      <SignedOut>
        <SignInButton mode="modal">
          <Button
            leftIcon={<Icon as={LogIn} w={4} h={4} />}
            colorScheme="green"
            size="sm"
          >
            Sign In
          </Button>
        </SignInButton>
      </SignedOut>

      <SignedIn>
        <UserButton
          appearance={{
            elements: {
              avatarBox: 'w-9 h-9',
            },
          }}
        />
      </SignedIn>
    </HStack>
  );
}
