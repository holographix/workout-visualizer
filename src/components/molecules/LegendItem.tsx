import { Box, HStack, Text, useColorModeValue } from '@chakra-ui/react';

interface LegendItemProps {
  color: string;
  label: string;
  size?: 'sm' | 'md';
}

export function LegendItem({ color, label, size = 'sm' }: LegendItemProps) {
  const textColor = useColorModeValue('gray.600', 'gray.400');
  const boxSize = size === 'sm' ? 3 : 4;
  const fontSize = size === 'sm' ? 'xs' : 'sm';

  return (
    <HStack spacing={2}>
      <Box
        w={boxSize}
        h={boxSize}
        borderRadius="sm"
        bgGradient={`linear(to-b, ${color}88, ${color})`}
        flexShrink={0}
      />
      <Text fontSize={fontSize} color={textColor}>
        {label}
      </Text>
    </HStack>
  );
}
