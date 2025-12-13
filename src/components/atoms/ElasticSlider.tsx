/**
 * ElasticSlider - Animated slider with spring physics
 *
 * Inspired by reactbits.dev elastic slider component.
 * Uses framer-motion for smooth spring animations.
 */
import { useRef, useState, useEffect } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { Box, Flex, Text, useColorModeValue } from '@chakra-ui/react';

interface ElasticSliderProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  formatValue?: (value: number) => string;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  trackColor?: string;
  fillColor?: string;
  thumbColor?: string;
}

export function ElasticSlider({
  value,
  min,
  max,
  step = 0.5,
  onChange,
  formatValue = (v) => `${v}`,
  startIcon,
  endIcon,
  trackColor,
  fillColor,
  thumbColor,
}: ElasticSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Color tokens - using high-contrast colors that avoid tone-on-tone
  const defaultTrackColor = useColorModeValue('gray.200', 'gray.700');
  const defaultFillColor = useColorModeValue('brand.400', 'brand.300');
  const defaultThumbColor = useColorModeValue('white', 'gray.100');
  const borderColor = useColorModeValue('gray.300', 'gray.600');
  const labelBg = useColorModeValue('gray.800', 'gray.700');
  // Value text uses a contrasting color - dark text on light bg, light text on dark bg
  // This avoids the tone-on-tone issue where brand color text sits on brand background
  const valueTextColor = useColorModeValue('gray.700', 'gray.100');

  // Direct motion value - no spring for immediate response during drag
  const progress = useMotionValue((value - min) / (max - min));

  // Transform for thumb position percentage - direct from progress, no spring lag
  const thumbPosition = useTransform(progress, [0, 1], ['0%', '100%']);
  const fillWidth = useTransform(progress, [0, 1], ['0%', '100%']);

  // Only apply spring to visual feedback effects (scale), not position
  const thumbScale = useMotionValue(1);

  // Update progress immediately when value changes (controlled externally)
  useEffect(() => {
    progress.set((value - min) / (max - min));
  }, [value, min, max, progress]);

  const getValueFromPosition = (clientX: number) => {
    if (!trackRef.current) return value;

    const rect = trackRef.current.getBoundingClientRect();
    const percentage = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const rawValue = min + percentage * (max - min);

    // Snap to step
    const steppedValue = Math.round(rawValue / step) * step;
    return Math.max(min, Math.min(max, steppedValue));
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    setIsDragging(true);
    thumbScale.set(1.15);

    const newValue = getValueFromPosition(e.clientX);
    onChange(newValue);

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const newValue = getValueFromPosition(moveEvent.clientX);
      onChange(newValue);
    };

    const handlePointerUp = () => {
      setIsDragging(false);
      thumbScale.set(1);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  return (
    <Flex position="relative" w="full" align="center" gap={3}>
      {/* Icons at start */}
      {startIcon && (
        <Box opacity={0.5} flexShrink={0}>{startIcon}</Box>
      )}

      {/* Track container - takes remaining space */}
      <Box flex="1" py={2}>
        <Box
          ref={trackRef}
          position="relative"
          h="8px"
          bg={trackColor || defaultTrackColor}
          borderRadius="full"
          cursor="pointer"
          onPointerDown={handlePointerDown}
        >
          {/* Filled track */}
          <motion.div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              height: '100%',
              width: fillWidth,
              backgroundColor: fillColor || 'var(--chakra-colors-brand-400)',
              borderRadius: '9999px',
            }}
          />

          {/* Thumb */}
          <motion.div
            style={{
              position: 'absolute',
              left: thumbPosition,
              top: '50%',
              translateX: '-50%',
              translateY: '-50%',
              scale: thumbScale,
            }}
          >
            <Box
              w="22px"
              h="22px"
              bg={thumbColor || defaultThumbColor}
              borderRadius="full"
              boxShadow="0 2px 6px rgba(0,0,0,0.15)"
              borderWidth="2px"
              borderColor={borderColor}
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              {/* Inner dot */}
              <Box
                w="6px"
                h="6px"
                bg={fillColor || defaultFillColor}
                borderRadius="full"
              />
            </Box>

            {/* Value label on drag */}
            {isDragging && (
              <Box
                position="absolute"
                bottom="100%"
                left="50%"
                transform="translateX(-50%)"
                mb={2}
                bg={labelBg}
                color="white"
                px={2}
                py={1}
                borderRadius="md"
                fontSize="xs"
                fontWeight="bold"
                whiteSpace="nowrap"
              >
                {formatValue(value)}
              </Box>
            )}
          </motion.div>
        </Box>
      </Box>

      {/* Icons at end */}
      {endIcon && (
        <Box opacity={0.5} flexShrink={0}>{endIcon}</Box>
      )}

      {/* Current value display - inline, using contrasting color for readability */}
      <Text
        fontSize="sm"
        fontWeight="semibold"
        color={valueTextColor}
        minW="50px"
        textAlign="right"
        flexShrink={0}
      >
        {formatValue(value)}
      </Text>
    </Flex>
  );
}

export default ElasticSlider;
