import { Box, VStack, Text, useColorModeValue } from '@chakra-ui/react';
import { IntervalRow } from '../molecules';
import type { FlatSegment } from '../../types/workout';

export interface HRZoneInfo {
  zoneName: string;
  zoneNumber: number;
  bpmRange: string;
}

interface IntervalListProps {
  segments: FlatSegment[];
  hoveredIndex: number | null;
  selectedIndex: number | null;
  onSegmentHover: (index: number | null) => void;
  onSegmentClick: (index: number | null) => void;
  formatDuration: (seconds: number) => string;
  getHRZoneForPowerPercent?: ((powerPercent: number) => HRZoneInfo | null) | null;
}

export function IntervalList({
  segments,
  hoveredIndex,
  selectedIndex,
  onSegmentHover,
  onSegmentClick,
  formatDuration,
  getHRZoneForPowerPercent,
}: IntervalListProps) {
  const labelColor = useColorModeValue('gray.600', 'gray.400');

  return (
    <Box>
      <Text
        fontSize="sm"
        fontWeight="medium"
        color={labelColor}
        textTransform="uppercase"
        letterSpacing="wider"
        mb={4}
      >
        Interval Structure
      </Text>
      <VStack spacing={2} maxH="250px" overflowY="auto" pr={2} align="stretch">
        {segments.map((segment, i) => {
          // Calculate HR zone for this segment's average power
          const avgPower = (segment.targetMin + segment.targetMax) / 2;
          const hrZone = getHRZoneForPowerPercent ? getHRZoneForPowerPercent(avgPower) : null;

          return (
            <IntervalRow
              key={i}
              name={segment.name}
              duration={formatDuration(segment.duration)}
              targetMin={segment.targetMin}
              targetMax={segment.targetMax}
              type={segment.type}
              isHovered={hoveredIndex === i}
              isSelected={selectedIndex === i}
              openDuration={segment.openDuration}
              hrZone={hrZone}
              onMouseEnter={() => onSegmentHover(i)}
              onMouseLeave={() => onSegmentHover(null)}
              onClick={() => onSegmentClick(selectedIndex === i ? null : i)}
            />
          );
        })}
      </VStack>
    </Box>
  );
}
