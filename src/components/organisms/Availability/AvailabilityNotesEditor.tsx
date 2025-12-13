import {
  Box,
  Flex,
  Text,
  Heading,
  HStack,
  Textarea,
  useColorModeValue,
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { MessageSquare } from 'lucide-react';

interface AvailabilityNotesEditorProps {
  notes: string;
  onChange: (notes: string) => void;
}

export function AvailabilityNotesEditor({ notes, onChange }: AvailabilityNotesEditorProps) {
  const { t } = useTranslation();

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const headerBg = useColorModeValue('gray.50', 'gray.900');
  const mutedColor = useColorModeValue('gray.600', 'gray.400');

  return (
    <Box
      bg={bgColor}
      borderRadius="xl"
      borderWidth="1px"
      borderColor={borderColor}
      overflow="hidden"
    >
      {/* Header */}
      <Flex
        bg={headerBg}
        px={4}
        py={3}
        borderBottomWidth="1px"
        borderColor={borderColor}
        justify="space-between"
        align="center"
      >
        <HStack spacing={2}>
          <MessageSquare size={18} />
          <Heading size="sm">{t('availability.notesTitle')}</Heading>
        </HStack>
      </Flex>

      {/* Content */}
      <Box p={4}>
        <Text fontSize="sm" color={mutedColor} mb={3}>
          {t('availability.notesDescription')}
        </Text>
        <Textarea
          value={notes}
          onChange={(e) => onChange(e.target.value)}
          placeholder={t('availability.notesPlaceholder')}
          minH="120px"
          resize="vertical"
        />
      </Box>
    </Box>
  );
}
