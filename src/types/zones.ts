/**
 * Power & HR Zones Types
 * Based on Coach's formulas from "Calcolo zone.xlsx"
 *
 * Power Zones (6 zones, % of FTP):
 * - Z1: Recupero Attivo (0-55%)
 * - Z2: Resistenza (55-75%)
 * - Z3: Tempo/Medio (75-90%)
 * - Z4: Soglia Lattacida (90-105%)
 * - Z5: VO2MAX (105-120%)
 * - Z6: Capacità Anaerobica (120-150%)
 *
 * HR Zones (5 zones, % of FC Soglia where FC Soglia = 93% of Max HR):
 * - Z1: Recupero Attivo (<68% FC Soglia)
 * - Z2: Resistenza (68-83% FC Soglia)
 * - Z3: Tempo/Medio (83-94% FC Soglia)
 * - Z4: Soglia Lattacida (94-105% FC Soglia)
 * - Z5: VO2MAX (>105% FC Soglia)
 */

// ============================================
// ZONE SYSTEMS
// ============================================

export type PowerZoneSystem = 'COGGAN' | 'POLARIZED' | 'CUSTOM';
export type HRZoneSystem = 'STANDARD' | 'KARVONEN' | 'CUSTOM';

// ============================================
// ZONE CONFIGURATIONS
// ============================================

export interface PowerZoneConfig {
  id?: string;
  athleteId: string;
  zoneSystem: PowerZoneSystem;
  zone1Max: number;  // Default: 55
  zone2Max: number;  // Default: 75
  zone3Max: number;  // Default: 90
  zone4Max: number;  // Default: 105
  zone5Max: number;  // Default: 120
  zone6Max: number;  // Default: 150
}

export interface HRZoneConfig {
  id?: string;
  athleteId: string;
  zoneSystem: HRZoneSystem;
  zone1Max: number;  // Default: 68 (<68%)
  zone2Max: number;  // Default: 83 (68-83%)
  zone3Max: number;  // Default: 94 (83-94%)
  zone4Max: number;  // Default: 105 (94-105%)
  zone5Max: number;  // Default: 999 (>105%, open-ended)
}

// ============================================
// CALCULATED ZONES
// ============================================

export interface CalculatedPowerZone {
  zone: number;
  name: string;
  minWatts: number;
  maxWatts: number | null;
  minPercent: number;
  maxPercent: number | null;
}

export interface CalculatedHRZone {
  zone: number;
  name: string;
  minBPM: number;
  maxBPM: number | null;
  minPercent: number;
  maxPercent: number | null;
}

// ============================================
// COMBINED ATHLETE ZONES DATA
// ============================================

export interface AthleteZoneData {
  id: string;
  fullName: string;
  ftp: number | null;
  maxHR: number | null;
  restingHR: number | null;
}

export interface AthleteZonesResponse {
  athlete: AthleteZoneData;
  power: {
    config: PowerZoneConfig;
    calculatedZones: CalculatedPowerZone[] | null;
  };
  hr: {
    config: HRZoneConfig;
    calculatedZones: CalculatedHRZone[] | null;
  };
}

// ============================================
// UPDATE DTOs
// ============================================

export interface UpdatePowerZonesInput {
  zoneSystem?: PowerZoneSystem;
  zone1Max?: number;
  zone2Max?: number;
  zone3Max?: number;
  zone4Max?: number;
  zone5Max?: number;
  zone6Max?: number;
}

export interface UpdateHRZonesInput {
  zoneSystem?: HRZoneSystem;
  zone1Max?: number;
  zone2Max?: number;
  zone3Max?: number;
  zone4Max?: number;
  zone5Max?: number;
}

export interface UpdateAthleteZoneDataInput {
  ftp?: number;
  maxHR?: number;
  restingHR?: number;
}

// ============================================
// ZONE COLORS AND DISPLAY
// ============================================

// 6 power zones (coach's formula)
export const POWER_ZONE_COLORS = [
  'gray.400',    // Z1 - Recupero Attivo
  'blue.400',    // Z2 - Resistenza
  'green.400',   // Z3 - Tempo (Medio)
  'yellow.400',  // Z4 - Soglia Lattacida
  'orange.400',  // Z5 - VO2MAX
  'red.400',     // Z6 - Capacità Anaerobica
] as const;

// 5 HR zones (coach's formula, based on % FC Soglia)
export const HR_ZONE_COLORS = [
  'gray.400',    // Z1 - Recupero Attivo
  'blue.400',    // Z2 - Resistenza
  'green.400',   // Z3 - Tempo (Medio)
  'yellow.400',  // Z4 - Soglia Lattacida
  'orange.400',  // Z5 - VO2MAX
] as const;

export const COGGAN_ZONE_NAMES = [
  'Recupero Attivo',
  'Resistenza',
  'Tempo (Medio)',
  'Soglia Lattacida',
  'VO2MAX',
  'Capacità Anaerobica',
] as const;

export const HR_ZONE_NAMES = [
  'Recupero Attivo',
  'Resistenza',
  'Tempo (Medio)',
  'Soglia Lattacida',
  'VO2MAX',
] as const;

// Default zone configurations (coach's formula)
export const DEFAULT_COGGAN_ZONES: Omit<PowerZoneConfig, 'athleteId' | 'id'> = {
  zoneSystem: 'COGGAN',
  zone1Max: 55,   // Z1: 0-55%
  zone2Max: 75,   // Z2: 55-75%
  zone3Max: 90,   // Z3: 75-90%
  zone4Max: 105,  // Z4: 90-105%
  zone5Max: 120,  // Z5: 105-120%
  zone6Max: 150,  // Z6: 120-150%
};

// HR zones based on % of FC Soglia (threshold HR = 93% of Max HR)
export const DEFAULT_HR_ZONES: Omit<HRZoneConfig, 'athleteId' | 'id'> = {
  zoneSystem: 'STANDARD',
  zone1Max: 68,   // Z1: <68% FC Soglia
  zone2Max: 83,   // Z2: 68-83% FC Soglia
  zone3Max: 94,   // Z3: 83-94% FC Soglia
  zone4Max: 105,  // Z4: 94-105% FC Soglia
  zone5Max: 999,  // Z5: >105% FC Soglia (no upper limit)
};
