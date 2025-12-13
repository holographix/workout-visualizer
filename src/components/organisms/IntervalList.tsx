import { Box, VStack, Text, useColorModeValue } from '@chakra-ui/react';
import { IntervalRow } from '../molecules';
import type { FlatSegment } from '../../types/workout';

interface IntervalListProps {
  segments: FlatSegment[];
  hoveredIndex: number | null;
  selectedIndex: number | null;
  onSegmentHover: (index: number | null) => void;
  onSegmentClick: (index: number | null) => void;
  formatDuration: (seconds: number) => string;
}

export function IntervalList({
  segments,
  hoveredIndex,
  selectedIndex,
  onSegmentHover,
  onSegmentClick,
  formatDuration,
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
        {segments.map((segment, i) => (
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
            onMouseEnter={() => onSegmentHover(i)}
            onMouseLeave={() => onSegmentHover(null)}
            onClick={() => onSegmentClick(selectedIndex === i ? null : i)}
          />
        ))}
      </VStack>
    </Box>
  );
}
