import { Box, HStack, Text, Icon, useColorModeValue } from '@chakra-ui/react';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  icon?: LucideIcon;
  iconColor?: string;
}

export function StatCard({
  label,
  value,
  unit,
  icon: IconComponent,
  iconColor = 'brand.500',
}: StatCardProps) {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const labelColor = useColorModeValue('gray.600', 'gray.400');
  const valueColor = useColorModeValue('gray.900', 'white');
  const unitColor = useColorModeValue('gray.500', 'gray.400');

  return (
    <Box
      bg={bgColor}
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="xl"
      p={4}
      transition="all 0.2s"
      _hover={{ borderColor: 'brand.500', transform: 'translateY(-1px)' }}
    >
      <HStack spacing={2} mb={2}>
        {IconComponent && (
          <Icon as={IconComponent} w={4} h={4} color={iconColor} />
        )}
        <Text
          fontSize="xs"
          color={labelColor}
          textTransform="uppercase"
          letterSpacing="wider"
          fontWeight="medium"
        >
          {label}
        </Text>
      </HStack>
      <HStack spacing={1} align="baseline">
        <Text
          fontSize="2xl"
          fontWeight="bold"
          color={valueColor}
          fontFamily="mono"
        >
          {value}
        </Text>
        {unit && (
          <Text fontSize="sm" color={unitColor}>
            {unit}
          </Text>
        )}
      </HStack>
    </Box>
  );
}
