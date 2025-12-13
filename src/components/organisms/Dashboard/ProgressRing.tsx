import { Box, Text } from '@chakra-ui/react';
import { motion } from 'framer-motion';

interface ProgressRingProps {
  progress: number; // 0-100
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  valueColor?: string;
  labelColor?: string;
  label: string;
  value: string;
  subValue?: string;
}

const MotionCircle = motion.circle;

export function ProgressRing({
  progress,
  size = 100,
  strokeWidth = 8,
  color = 'var(--chakra-colors-brand-400)',
  trackColor = 'var(--chakra-colors-dark-600)',
  valueColor = 'white',
  labelColor = 'gray.400',
  label,
  value,
  subValue,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (Math.min(progress, 100) / 100) * circumference;

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      gap={1}
      width={`${size}px`}
      minW={`${size}px`}
      maxW={`${size}px`}
      flexShrink={0}
      flexGrow={0}
    >
      <Box
        position="relative"
        width={`${size}px`}
        height={`${size}px`}
        minW={`${size}px`}
        minH={`${size}px`}
      >
        <svg
          width={size}
          height={size}
          style={{ display: 'block', width: size, height: size }}
        >
          {/* Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={trackColor}
            strokeWidth={strokeWidth}
          />
          {/* Progress */}
          <MotionCircle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, ease: 'easeOut' }}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </svg>
        {/* Center content */}
        <Box
          position="absolute"
          top="50%"
          left="50%"
          transform="translate(-50%, -50%)"
          textAlign="center"
          width="100%"
          px={1}
        >
          <Text
            fontSize="md"
            fontWeight="bold"
            lineHeight="1"
            color={valueColor}
            whiteSpace="nowrap"
          >
            {value}
          </Text>
          {subValue && (
            <Text fontSize="2xs" color={labelColor} mt={0.5} whiteSpace="nowrap">
              {subValue}
            </Text>
          )}
        </Box>
      </Box>
      <Text
        fontSize="2xs"
        fontWeight="600"
        textTransform="uppercase"
        letterSpacing="wider"
        color={labelColor}
        whiteSpace="nowrap"
      >
        {label}
      </Text>
    </Box>
  );
}
