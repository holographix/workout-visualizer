import { Badge } from '@chakra-ui/react';

interface WorkoutTypeBadgeProps {
  type: string;
  size?: 'sm' | 'md';
}

const typeColors: Record<string, string> = {
  'Bike': 'blue',
  'Run': 'green',
  'Swim': 'cyan',
  'Strength': 'orange',
  'Recovery': 'purple',
  'Workout': 'gray',
};

export function WorkoutTypeBadge({ type, size = 'sm' }: WorkoutTypeBadgeProps) {
  const colorScheme = typeColors[type] || 'gray';

  return (
    <Badge
      colorScheme={colorScheme}
      variant="subtle"
      px={size === 'sm' ? 2 : 3}
      py={size === 'sm' ? 0.5 : 1}
      borderRadius="full"
      fontSize={size === 'sm' ? 'xs' : 'sm'}
      fontWeight="semibold"
    >
      {type}
    </Badge>
  );
}
