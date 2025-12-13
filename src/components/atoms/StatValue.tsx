import { Box, Text, HStack, Icon, useColorModeValue } from '@chakra-ui/react';
import type { LucideIcon } from 'lucide-react';

interface StatValueProps {
  label: string;
  value: string | number;
  unit?: string;
  icon?: LucideIcon;
  iconColor?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizes = {
  sm: { value: 'lg', label: 'xs', icon: 3 },
  md: { value: '2xl', label: 'xs', icon: 4 },
  lg: { value: '3xl', label: 'sm', icon: 5 },
};

export function StatValue({
  label,
  value,
  unit,
  icon: IconComponent,
  iconColor = 'brand.500',
  size = 'md'
}: StatValueProps) {
  const { value: valueSize, label: labelSize, icon: iconSize } = sizes[size];
  const labelColor = useColorModeValue('gray.600', 'gray.400');
  const valueColor = useColorModeValue('gray.900', 'white');
  const unitColor = useColorModeValue('gray.500', 'gray.400');

  return (
    <Box>
      <HStack spacing={2} mb={1}>
        {IconComponent && (
          <Icon as={IconComponent} w={iconSize} h={iconSize} color={iconColor} />
        )}
        <Text
          fontSize={labelSize}
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
          fontSize={valueSize}
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
