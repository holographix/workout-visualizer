import { Box, Flex, HStack, Text, useColorModeValue } from '@chakra-ui/react';
import { getZoneColor, type ZoneType } from '../atoms';

interface HRZoneInfo {
  zoneName: string;
  zoneNumber: number;
  bpmRange: string;
}

interface IntervalRowProps {
  name: string;
  duration: string;
  targetMin: number;
  targetMax: number;
  type: ZoneType | string;
  isHovered?: boolean;
  isSelected?: boolean;
  openDuration?: boolean;
  hrZone?: HRZoneInfo | null;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onClick?: () => void;
}

export function IntervalRow({
  name,
  duration,
  targetMin,
  targetMax,
  type,
  isHovered = false,
  isSelected = false,
  openDuration = false,
  hrZone,
  onMouseEnter,
  onMouseLeave,
  onClick,
}: IntervalRowProps) {
  const baseBg = useColorModeValue('gray.100', 'gray.700');
  const hoverBg = useColorModeValue('gray.200', 'gray.600');
  const nameColor = useColorModeValue('gray.900', 'white');
  const metaColor = useColorModeValue('gray.500', 'gray.500');
  const targetColor = useColorModeValue('gray.700', 'gray.300');
  const zoneColor = getZoneColor(type);

  const isActive = isHovered || isSelected;

  return (
    <Flex
      align="center"
      justify="space-between"
      py={2}
      px={3}
      borderRadius="lg"
      cursor="pointer"
      bg={isActive ? hoverBg : baseBg}
      opacity={isActive ? 1 : 0.8}
      borderWidth="1px"
      borderColor={isActive ? 'whiteAlpha.300' : 'transparent'}
      transition="all 0.2s"
      _hover={{ bg: hoverBg }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
    >
      <HStack spacing={3}>
        <Box
          w={isActive ? 3 : 2}
          h={8}
          borderRadius="full"
          bg={zoneColor}
          transition="all 0.2s"
        />
        <Box>
          <Text fontSize="sm" fontWeight="medium" color={nameColor}>
            {name}
          </Text>
          <Text fontSize="xs" color={metaColor}>
            {duration}
            {openDuration && ' (open)'}
          </Text>
        </Box>
      </HStack>
      <Box textAlign="right">
        <Text fontSize="sm" fontFamily="mono" color={targetColor}>
          {targetMin === targetMax
            ? `${targetMax}%`
            : `${targetMin}-${targetMax}%`
          }
        </Text>
        <Text fontSize="xs" color={metaColor}>FTP</Text>
        {hrZone && (
          <>
            <Text fontSize="sm" fontFamily="mono" color={targetColor} mt={2}>
              {hrZone.bpmRange}
            </Text>
            <Text fontSize="xs" color={metaColor}>bpm (Z{hrZone.zoneNumber})</Text>
          </>
        )}
      </Box>
    </Flex>
  );
}
