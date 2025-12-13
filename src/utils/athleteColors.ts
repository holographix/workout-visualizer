/**
 * Athlete color palette for coach calendar view
 * Provides consistent colors to distinguish different athletes at a glance
 */

// Chakra-compatible color palette (using Chakra color scheme names)
const ATHLETE_COLORS = [
  'blue',
  'green',
  'purple',
  'orange',
  'pink',
  'cyan',
  'teal',
  'red',
  'yellow',
  'linkedin', // lighter blue
] as const;

export type AthleteColorScheme = (typeof ATHLETE_COLORS)[number];

export interface AthleteColorInfo {
  colorScheme: AthleteColorScheme;
  athleteId: string;
  athleteName: string;
}

/**
 * Get a color scheme for an athlete based on their index
 * Colors are assigned consistently based on the order athletes appear
 */
export function getAthleteColorScheme(index: number): AthleteColorScheme {
  return ATHLETE_COLORS[index % ATHLETE_COLORS.length];
}

/**
 * Create a map of athlete IDs to their color schemes
 */
export function createAthleteColorMap(
  athletes: Array<{ id: string; name: string }>
): Map<string, AthleteColorInfo> {
  const colorMap = new Map<string, AthleteColorInfo>();

  athletes.forEach((athlete, index) => {
    colorMap.set(athlete.id, {
      colorScheme: getAthleteColorScheme(index),
      athleteId: athlete.id,
      athleteName: athlete.name,
    });
  });

  return colorMap;
}

/**
 * Get hex color value for a Chakra color scheme (for use in non-Chakra contexts)
 * Returns the 500 shade of each color
 */
export function getAthleteHexColor(colorScheme: AthleteColorScheme): string {
  const hexColors: Record<AthleteColorScheme, string> = {
    blue: '#3182CE',
    green: '#38A169',
    purple: '#805AD5',
    orange: '#DD6B20',
    pink: '#D53F8C',
    cyan: '#00B5D8',
    teal: '#319795',
    red: '#E53E3E',
    yellow: '#D69E2E',
    linkedin: '#0077B5',
  };
  return hexColors[colorScheme];
}
