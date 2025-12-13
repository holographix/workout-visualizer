import { Badge } from '@chakra-ui/react';

export type ZoneType = 'warmUp' | 'active' | 'rest' | 'coolDown' | 'threshold' | 'vo2max';

interface ZoneBadgeProps {
  zone: ZoneType;
  size?: 'sm' | 'md';
}

const zoneConfig: Record<ZoneType, { label: string; color: string }> = {
  warmUp: { label: 'Warm Up', color: '#3b82f6' },
  active: { label: 'Active', color: '#ef4444' },
  rest: { label: 'Rest', color: '#22c55e' },
  coolDown: { label: 'Cool Down', color: '#8b5cf6' },
  threshold: { label: 'Threshold', color: '#f59e0b' },
  vo2max: { label: 'VO2max', color: '#ec4899' },
};

export function ZoneBadge({ zone, size = 'sm' }: ZoneBadgeProps) {
  const config = zoneConfig[zone] || { label: zone, color: '#6b7280' };

  return (
    <Badge
      bg={config.color}
      color="white"
      px={size === 'sm' ? 2 : 3}
      py={size === 'sm' ? 0.5 : 1}
      borderRadius="full"
      fontSize={size === 'sm' ? 'xs' : 'sm'}
      fontWeight="semibold"
      textTransform="capitalize"
    >
      {config.label}
    </Badge>
  );
}

// Export zone colors for use in charts
export const ZONE_COLORS: Record<ZoneType, string> = {
  warmUp: '#3b82f6',
  active: '#ef4444',
  rest: '#22c55e',
  coolDown: '#8b5cf6',
  threshold: '#f59e0b',
  vo2max: '#ec4899',
};

export function getZoneColor(zone: string): string {
  return ZONE_COLORS[zone as ZoneType] || '#6b7280';
}
