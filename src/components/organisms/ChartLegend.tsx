import { HStack, Text, useColorModeValue } from '@chakra-ui/react';
import { LegendItem } from '../molecules';
import { ZONE_COLORS } from '../atoms';

interface ChartLegendProps {
  title?: string;
}

export function ChartLegend({ title = 'Workout Profile' }: ChartLegendProps) {
  const labelColor = useColorModeValue('gray.600', 'gray.400');

  return (
    <HStack justify="space-between" align="center" w="full">
      <Text
        fontSize="sm"
        fontWeight="medium"
        color={labelColor}
        textTransform="uppercase"
        letterSpacing="wider"
      >
        {title}
      </Text>
      <HStack spacing={4}>
        <LegendItem color={ZONE_COLORS.warmUp} label="Warm Up" />
        <LegendItem color={ZONE_COLORS.active} label="Active" />
        <LegendItem color={ZONE_COLORS.rest} label="Rest" />
        <LegendItem color={ZONE_COLORS.coolDown} label="Cool Down" />
      </HStack>
    </HStack>
  );
}
