import {
  IconButton,
  useColorMode,
  useColorModeValue,
  Tooltip,
} from '@chakra-ui/react';
import { Sun, Moon } from 'lucide-react';

export function ColorModeToggle() {
  const { toggleColorMode } = useColorMode();
  const SwitchIcon = useColorModeValue(Moon, Sun);
  const label = useColorModeValue('Switch to dark mode', 'Switch to light mode');

  return (
    <Tooltip label={label} hasArrow>
      <IconButton
        aria-label={label}
        icon={<SwitchIcon size={18} />}
        onClick={toggleColorMode}
        variant="ghost"
        size="sm"
        color={useColorModeValue('gray.600', 'gray.400')}
        _hover={{
          bg: useColorModeValue('gray.100', 'whiteAlpha.100'),
        }}
      />
    </Tooltip>
  );
}
