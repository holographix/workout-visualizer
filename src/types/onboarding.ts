/**
 * Onboarding Types
 * Types for the athlete onboarding wizard
 */

// Enums matching the backend Prisma schema
export type Sex = 'MALE' | 'FEMALE';

export type AthleteCategory = 'AMATORE' | 'JUNIORES' | 'U23' | 'ELITE' | 'PRO';

export type TerrainType = 'HILLS' | 'FLAT' | 'MOUNTAINS';

export type DisciplineType = 'MTB' | 'GRAVEL_CICLOCROSS' | 'ROAD';

export type DisciplineSubType =
  // MTB
  | 'MTB_XC_90MIN'
  | 'MTB_GF_MARATHON_3H'
  | 'MTB_NO_RACE'
  // Gravel/Ciclocross
  | 'GRAVEL_RACE_1H'
  | 'GRAVEL_RACE_2H'
  | 'GRAVEL_ULTRA_6H'
  | 'GRAVEL_NO_RACE'
  // Road
  | 'ROAD_CIRCUITS_1H'
  | 'ROAD_GRAN_FONDO_2H'
  | 'ROAD_ULTRA_6H'
  | 'ROAD_NO_RACE';

export type ActivityType =
  | 'OUTDOOR_CYCLING'
  | 'INDOOR_CYCLING'
  | 'WORKOUT_HOME'
  | 'WORKOUT_GYM'
  | 'CROSS_RUNNING'
  | 'CROSS_SWIMMING'
  | 'CROSS_SKIING';

// Discipline sub-type options grouped by discipline
export const DISCIPLINE_SUBTYPES: Record<DisciplineType, { value: DisciplineSubType; labelKey: string }[]> = {
  MTB: [
    { value: 'MTB_XC_90MIN', labelKey: 'onboarding.disciplines.mtbXc90min' },
    { value: 'MTB_GF_MARATHON_3H', labelKey: 'onboarding.disciplines.mtbMarathon3h' },
    { value: 'MTB_NO_RACE', labelKey: 'onboarding.disciplines.mtbNoRace' },
  ],
  GRAVEL_CICLOCROSS: [
    { value: 'GRAVEL_RACE_1H', labelKey: 'onboarding.disciplines.gravelRace1h' },
    { value: 'GRAVEL_RACE_2H', labelKey: 'onboarding.disciplines.gravelRace2h' },
    { value: 'GRAVEL_ULTRA_6H', labelKey: 'onboarding.disciplines.gravelUltra6h' },
    { value: 'GRAVEL_NO_RACE', labelKey: 'onboarding.disciplines.gravelNoRace' },
  ],
  ROAD: [
    { value: 'ROAD_CIRCUITS_1H', labelKey: 'onboarding.disciplines.roadCircuits1h' },
    { value: 'ROAD_GRAN_FONDO_2H', labelKey: 'onboarding.disciplines.roadGranFondo2h' },
    { value: 'ROAD_ULTRA_6H', labelKey: 'onboarding.disciplines.roadUltra6h' },
    { value: 'ROAD_NO_RACE', labelKey: 'onboarding.disciplines.roadNoRace' },
  ],
};

// Onboarding status response
export interface OnboardingStatus {
  athleteId: string;
  completed: boolean;
  currentStep: number;
  hasPersonalInfo: boolean;
  hasPhysicalData: boolean;
  hasCategory: boolean;
  hasTerrain: boolean;
}

// Step data interfaces
export interface PersonalInfoStepData {
  fullName: string;
  birthday: string; // ISO date string
  sex: Sex;
  lastMenstrualDate?: string; // ISO date string, for females
}

export interface PhysicalStepData {
  heightCm: number;
  weightKg: number;
}

export interface CategoryStepData {
  athleteCategory: AthleteCategory;
}

export interface DisciplineStepData {
  disciplines: Array<{
    discipline: DisciplineType;
    subType: DisciplineSubType;
  }>;
}

export interface TerrainStepData {
  terrain: TerrainType;
}

export interface ActivityTypesStepData {
  activityTypes: ActivityType[];
}

export interface EquipmentStepData {
  hasPowerMeter: boolean;
  hasHRMonitor: boolean;
}

// Discipline record (from API)
export interface AthleteDiscipline {
  id: string;
  discipline: DisciplineType;
  subType: DisciplineSubType;
}

// Activity type record (from API)
export interface AthleteActivityType {
  id: string;
  activityType: ActivityType;
}

// Full athlete profile (from API)
export interface AthleteProfile {
  id: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  ftp: number | null;
  // Personal
  birthday: string | null;
  sex: Sex | null;
  lastMenstrualDate: string | null;
  // Physical
  heightCm: number | null;
  weightKg: number | null;
  // Profile
  athleteCategory: AthleteCategory | null;
  terrain: TerrainType | null;
  // Equipment
  hasPowerMeter: boolean;
  hasHRMonitor: boolean;
  // Status
  onboardingCompleted: boolean;
  onboardingStep: number | null;
  // Relations
  disciplines: AthleteDiscipline[];
  activityTypes: AthleteActivityType[];
  availability: Array<{
    dayIndex: number;
    available: boolean;
    maxHours: number | null;
    timeSlots: string[];
  }>;
}

// Onboarding wizard state
export interface OnboardingWizardState {
  currentStep: number;
  personalInfo: Partial<PersonalInfoStepData>;
  physical: Partial<PhysicalStepData>;
  category: Partial<CategoryStepData>;
  disciplines: DisciplineStepData['disciplines'];
  terrain: Partial<TerrainStepData>;
  activityTypes: ActivityType[];
  equipment: Partial<EquipmentStepData>;
}

// Step configuration
export const ONBOARDING_STEPS = [
  { key: 'personal', titleKey: 'onboarding.steps.personal' },
  { key: 'physical', titleKey: 'onboarding.steps.physical' },
  { key: 'category', titleKey: 'onboarding.steps.category' },
  { key: 'discipline', titleKey: 'onboarding.steps.discipline' },
  { key: 'terrain', titleKey: 'onboarding.steps.terrain' },
  { key: 'availability', titleKey: 'onboarding.steps.availability' },
  { key: 'activities', titleKey: 'onboarding.steps.activities' },
] as const;

export type OnboardingStepKey = (typeof ONBOARDING_STEPS)[number]['key'];
