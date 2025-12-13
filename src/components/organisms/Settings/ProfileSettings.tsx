/**
 * ProfileSettings
 * Settings tab for editing athlete profile data (post-onboarding)
 */
import { useState, useEffect, useCallback } from 'react';
import {
  VStack,
  HStack,
  Box,
  SimpleGrid,
  FormControl,
  FormLabel,
  Input,
  RadioGroup,
  Radio,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Checkbox,
  CheckboxGroup,
  Button,
  Heading,
  Text,
  useColorModeValue,
  useToast,
  Spinner,
  Center,
  Divider,
  Badge,
  Wrap,
  WrapItem,
  useRadioGroup,
  useRadio,
  chakra,
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { Save, User, Ruler, Award, Bike, Mountain, Activity, Gauge } from 'lucide-react';
import { useAthleteProfile, useOnboarding } from '../../../hooks/useOnboarding';
import type {
  Sex,
  AthleteCategory,
  TerrainType,
  DisciplineType,
  DisciplineSubType,
  ActivityType,
  DISCIPLINE_SUBTYPES,
} from '../../../types/onboarding';

interface ProfileSettingsProps {
  athleteId: string;
  onSave?: () => void;
}

// Category options
const CATEGORIES: { value: AthleteCategory; titleKey: string }[] = [
  { value: 'AMATORE', titleKey: 'onboarding.category.amatore' },
  { value: 'JUNIORES', titleKey: 'onboarding.category.juniores' },
  { value: 'U23', titleKey: 'onboarding.category.u23' },
  { value: 'ELITE', titleKey: 'onboarding.category.elite' },
  { value: 'PRO', titleKey: 'onboarding.category.pro' },
];

// Terrain options
const TERRAINS: { value: TerrainType; titleKey: string }[] = [
  { value: 'HILLS', titleKey: 'onboarding.terrain.hills' },
  { value: 'FLAT', titleKey: 'onboarding.terrain.flat' },
  { value: 'MOUNTAINS', titleKey: 'onboarding.terrain.mountains' },
];

// Activity options
const ACTIVITIES: { value: ActivityType; titleKey: string }[] = [
  { value: 'OUTDOOR_CYCLING', titleKey: 'onboarding.activities.outdoorCycling' },
  { value: 'INDOOR_CYCLING', titleKey: 'onboarding.activities.indoorCycling' },
  { value: 'WORKOUT_HOME', titleKey: 'onboarding.activities.workoutHome' },
  { value: 'WORKOUT_GYM', titleKey: 'onboarding.activities.workoutGym' },
  { value: 'CROSS_RUNNING', titleKey: 'onboarding.activities.crossRunning' },
  { value: 'CROSS_SWIMMING', titleKey: 'onboarding.activities.crossSwimming' },
  { value: 'CROSS_SKIING', titleKey: 'onboarding.activities.crossSkiing' },
];

// Discipline options
const DISCIPLINES: { value: DisciplineType; titleKey: string }[] = [
  { value: 'MTB', titleKey: 'onboarding.disciplines.mtb' },
  { value: 'GRAVEL_CICLOCROSS', titleKey: 'onboarding.disciplines.gravel' },
  { value: 'ROAD', titleKey: 'onboarding.disciplines.road' },
];

// Discipline sub-type options grouped by discipline
const DISCIPLINE_SUBTYPES_MAP: Record<DisciplineType, { value: DisciplineSubType; labelKey: string }[]> = {
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

// Radio card component for selection
function SelectionCard(props: any) {
  const { getInputProps, getRadioProps } = useRadio(props);
  const { t } = useTranslation();

  const input = getInputProps();
  const checkbox = getRadioProps();

  const bgColor = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const selectedBg = useColorModeValue('brand.50', 'brand.900');
  const selectedBorder = useColorModeValue('brand.500', 'brand.400');
  const hoverBg = useColorModeValue('gray.50', 'gray.600');

  return (
    <chakra.label cursor="pointer">
      <input {...input} />
      <Box
        {...checkbox}
        borderWidth="2px"
        borderRadius="lg"
        borderColor={borderColor}
        bg={bgColor}
        px={4}
        py={2}
        transition="all 0.2s"
        _hover={{ bg: hoverBg }}
        _checked={{
          bg: selectedBg,
          borderColor: selectedBorder,
        }}
      >
        <Text fontWeight="medium" fontSize="sm">
          {t(props.labelKey)}
        </Text>
      </Box>
    </chakra.label>
  );
}

export function ProfileSettings({ athleteId, onSave }: ProfileSettingsProps) {
  const { t } = useTranslation();
  const toast = useToast();
  const { profile, isLoading: isProfileLoading, error: profileError } = useAthleteProfile(athleteId);
  const {
    savePersonalInfo,
    savePhysical,
    saveCategory,
    saveDisciplines,
    saveTerrain,
    saveActivityTypes,
    saveEquipment,
    isSaving,
  } = useOnboarding({ athleteId });

  // Form state
  const [fullName, setFullName] = useState('');
  const [birthday, setBirthday] = useState('');
  const [sex, setSex] = useState<Sex | ''>('');
  const [lastMenstrualDate, setLastMenstrualDate] = useState('');
  const [heightCm, setHeightCm] = useState<number | undefined>();
  const [weightKg, setWeightKg] = useState<number | undefined>();
  const [athleteCategory, setAthleteCategory] = useState<AthleteCategory | ''>('');
  const [terrain, setTerrain] = useState<TerrainType | ''>('');
  const [disciplines, setDisciplines] = useState<Array<{ discipline: DisciplineType; subType: DisciplineSubType }>>([]);
  const [activityTypes, setActivityTypes] = useState<ActivityType[]>([]);
  const [hasPowerMeter, setHasPowerMeter] = useState(false);
  const [hasHRMonitor, setHasHRMonitor] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Colors
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const labelColor = useColorModeValue('gray.600', 'gray.400');
  const sectionBg = useColorModeValue('gray.50', 'gray.700');

  // Load profile data into form
  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName || '');
      setBirthday(profile.birthday ? profile.birthday.split('T')[0] : '');
      setSex(profile.sex || '');
      setLastMenstrualDate(profile.lastMenstrualDate ? profile.lastMenstrualDate.split('T')[0] : '');
      setHeightCm(profile.heightCm ?? undefined);
      setWeightKg(profile.weightKg ?? undefined);
      setAthleteCategory(profile.athleteCategory || '');
      setTerrain(profile.terrain || '');
      setDisciplines(
        profile.disciplines?.map((d) => ({
          discipline: d.discipline,
          subType: d.subType,
        })) || []
      );
      setActivityTypes(profile.activityTypes?.map((a) => a.activityType) || []);
      setHasPowerMeter(profile.hasPowerMeter);
      setHasHRMonitor(profile.hasHRMonitor);
      setHasChanges(false);
    }
  }, [profile]);

  // Mark changes
  const handleChange = useCallback(() => {
    setHasChanges(true);
  }, []);

  // Category radio group
  const categoryRadio = useRadioGroup({
    name: 'category',
    value: athleteCategory,
    onChange: (value) => {
      setAthleteCategory(value as AthleteCategory);
      handleChange();
    },
  });

  // Terrain radio group
  const terrainRadio = useRadioGroup({
    name: 'terrain',
    value: terrain,
    onChange: (value) => {
      setTerrain(value as TerrainType);
      handleChange();
    },
  });

  // Handle discipline toggle
  const toggleDiscipline = (disciplineType: DisciplineType, subType: DisciplineSubType) => {
    const existing = disciplines.find((d) => d.discipline === disciplineType);
    if (existing) {
      if (existing.subType === subType) {
        // Remove if same subtype clicked
        setDisciplines(disciplines.filter((d) => d.discipline !== disciplineType));
      } else {
        // Update subtype
        setDisciplines(disciplines.map((d) => (d.discipline === disciplineType ? { ...d, subType } : d)));
      }
    } else {
      // Add new discipline
      setDisciplines([...disciplines, { discipline: disciplineType, subType }]);
    }
    handleChange();
  };

  // Handle activity toggle
  const toggleActivity = (activity: ActivityType) => {
    if (activityTypes.includes(activity)) {
      setActivityTypes(activityTypes.filter((a) => a !== activity));
    } else {
      setActivityTypes([...activityTypes, activity]);
    }
    handleChange();
  };

  // Save all changes
  const handleSaveAll = async () => {
    try {
      // Save personal info
      if (fullName && birthday && sex) {
        await savePersonalInfo({
          fullName,
          birthday,
          sex: sex as Sex,
          lastMenstrualDate: lastMenstrualDate || undefined,
        });
      }

      // Save physical data
      if (heightCm && weightKg) {
        await savePhysical({ heightCm, weightKg });
      }

      // Save category
      if (athleteCategory) {
        await saveCategory({ athleteCategory: athleteCategory as AthleteCategory });
      }

      // Save disciplines
      if (disciplines.length > 0) {
        await saveDisciplines({ disciplines });
      }

      // Save terrain
      if (terrain) {
        await saveTerrain({ terrain: terrain as TerrainType });
      }

      // Save activities
      if (activityTypes.length > 0) {
        await saveActivityTypes({ activityTypes });
      }

      // Save equipment
      await saveEquipment({ hasPowerMeter, hasHRMonitor });

      toast({
        title: t('settings.profileSaved'),
        status: 'success',
        duration: 3000,
      });
      setHasChanges(false);
      onSave?.();
    } catch (error) {
      toast({
        title: t('common.error'),
        description: error instanceof Error ? error.message : 'Failed to save',
        status: 'error',
        duration: 3000,
      });
    }
  };

  if (isProfileLoading) {
    return (
      <Center py={10}>
        <VStack spacing={4}>
          <Spinner size="xl" color="brand.500" />
          <Text color={labelColor}>{t('settings.loadingProfile')}</Text>
        </VStack>
      </Center>
    );
  }

  if (profileError) {
    return (
      <Center py={10}>
        <Text color="red.500">{t('settings.profileLoadError')}</Text>
      </Center>
    );
  }

  return (
    <VStack spacing={6} align="stretch">
      {/* Personal Information */}
      <Box p={6} borderRadius="xl" bg={cardBg} borderWidth="1px" borderColor={borderColor}>
        <HStack spacing={3} mb={4}>
          <User size={20} />
          <Heading size="sm">{t('settings.profile.personalInfo')}</Heading>
        </HStack>

        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
          <FormControl isRequired>
            <FormLabel fontSize="sm">{t('onboarding.personal.fullName')}</FormLabel>
            <Input
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                handleChange();
              }}
              placeholder={t('onboarding.personal.fullNamePlaceholder')}
            />
          </FormControl>

          <FormControl isRequired>
            <FormLabel fontSize="sm">{t('onboarding.personal.birthday')}</FormLabel>
            <Input
              type="date"
              value={birthday}
              onChange={(e) => {
                setBirthday(e.target.value);
                handleChange();
              }}
            />
          </FormControl>

          <FormControl isRequired>
            <FormLabel fontSize="sm">{t('onboarding.personal.sex')}</FormLabel>
            <RadioGroup
              value={sex}
              onChange={(value) => {
                setSex(value as Sex);
                handleChange();
              }}
            >
              <HStack spacing={6}>
                <Radio value="MALE">{t('onboarding.personal.male')}</Radio>
                <Radio value="FEMALE">{t('onboarding.personal.female')}</Radio>
              </HStack>
            </RadioGroup>
          </FormControl>

          {sex === 'FEMALE' && (
            <FormControl>
              <FormLabel fontSize="sm">{t('onboarding.personal.menstrualDate')}</FormLabel>
              <Input
                type="date"
                value={lastMenstrualDate}
                onChange={(e) => {
                  setLastMenstrualDate(e.target.value);
                  handleChange();
                }}
              />
            </FormControl>
          )}
        </SimpleGrid>
      </Box>

      {/* Physical Data */}
      <Box p={6} borderRadius="xl" bg={cardBg} borderWidth="1px" borderColor={borderColor}>
        <HStack spacing={3} mb={4}>
          <Ruler size={20} />
          <Heading size="sm">{t('settings.profile.physicalData')}</Heading>
        </HStack>

        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
          <FormControl isRequired>
            <FormLabel fontSize="sm">{t('onboarding.physical.height')} (cm)</FormLabel>
            <NumberInput
              value={heightCm ?? ''}
              onChange={(_, val) => {
                setHeightCm(val || undefined);
                handleChange();
              }}
              min={100}
              max={250}
            >
              <NumberInputField placeholder="175" />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
          </FormControl>

          <FormControl isRequired>
            <FormLabel fontSize="sm">{t('onboarding.physical.weight')} (kg)</FormLabel>
            <NumberInput
              value={weightKg ?? ''}
              onChange={(_, val) => {
                setWeightKg(val || undefined);
                handleChange();
              }}
              min={30}
              max={200}
              precision={1}
              step={0.5}
            >
              <NumberInputField placeholder="70" />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
          </FormControl>
        </SimpleGrid>
      </Box>

      {/* Athlete Category */}
      <Box p={6} borderRadius="xl" bg={cardBg} borderWidth="1px" borderColor={borderColor}>
        <HStack spacing={3} mb={4}>
          <Award size={20} />
          <Heading size="sm">{t('settings.profile.category')}</Heading>
        </HStack>

        <Wrap spacing={3} {...categoryRadio.getRootProps()}>
          {CATEGORIES.map((cat) => (
            <WrapItem key={cat.value}>
              <SelectionCard {...categoryRadio.getRadioProps({ value: cat.value })} labelKey={cat.titleKey} />
            </WrapItem>
          ))}
        </Wrap>
      </Box>

      {/* Disciplines */}
      <Box p={6} borderRadius="xl" bg={cardBg} borderWidth="1px" borderColor={borderColor}>
        <HStack spacing={3} mb={4}>
          <Bike size={20} />
          <Heading size="sm">{t('settings.profile.disciplines')}</Heading>
        </HStack>

        <VStack spacing={4} align="stretch">
          {DISCIPLINES.map((disc) => {
            const selected = disciplines.find((d) => d.discipline === disc.value);
            return (
              <Box key={disc.value} p={4} borderRadius="lg" bg={sectionBg}>
                <HStack justify="space-between" mb={2}>
                  <Text fontWeight="medium">{t(disc.titleKey)}</Text>
                  {selected && <Badge colorScheme="brand">{t('common.selected')}</Badge>}
                </HStack>
                <Wrap spacing={2}>
                  {DISCIPLINE_SUBTYPES_MAP[disc.value].map((sub) => (
                    <WrapItem key={sub.value}>
                      <Button
                        size="sm"
                        variant={selected?.subType === sub.value ? 'solid' : 'outline'}
                        colorScheme={selected?.subType === sub.value ? 'brand' : 'gray'}
                        onClick={() => toggleDiscipline(disc.value, sub.value)}
                      >
                        {t(sub.labelKey)}
                      </Button>
                    </WrapItem>
                  ))}
                </Wrap>
              </Box>
            );
          })}
        </VStack>
      </Box>

      {/* Terrain */}
      <Box p={6} borderRadius="xl" bg={cardBg} borderWidth="1px" borderColor={borderColor}>
        <HStack spacing={3} mb={4}>
          <Mountain size={20} />
          <Heading size="sm">{t('settings.profile.terrain')}</Heading>
        </HStack>

        <Wrap spacing={3} {...terrainRadio.getRootProps()}>
          {TERRAINS.map((ter) => (
            <WrapItem key={ter.value}>
              <SelectionCard {...terrainRadio.getRadioProps({ value: ter.value })} labelKey={ter.titleKey} />
            </WrapItem>
          ))}
        </Wrap>
      </Box>

      {/* Activity Types */}
      <Box p={6} borderRadius="xl" bg={cardBg} borderWidth="1px" borderColor={borderColor}>
        <HStack spacing={3} mb={4}>
          <Activity size={20} />
          <Heading size="sm">{t('settings.profile.activities')}</Heading>
        </HStack>

        <Wrap spacing={3}>
          {ACTIVITIES.map((act) => (
            <WrapItem key={act.value}>
              <Checkbox
                isChecked={activityTypes.includes(act.value)}
                onChange={() => toggleActivity(act.value)}
                colorScheme="brand"
              >
                {t(act.titleKey)}
              </Checkbox>
            </WrapItem>
          ))}
        </Wrap>
      </Box>

      {/* Equipment */}
      <Box p={6} borderRadius="xl" bg={cardBg} borderWidth="1px" borderColor={borderColor}>
        <HStack spacing={3} mb={4}>
          <Gauge size={20} />
          <Heading size="sm">{t('settings.profile.equipment')}</Heading>
        </HStack>

        <VStack align="start" spacing={3}>
          <Checkbox
            isChecked={hasPowerMeter}
            onChange={(e) => {
              setHasPowerMeter(e.target.checked);
              handleChange();
            }}
            colorScheme="brand"
          >
            {t('onboarding.equipment.powerMeter')}
          </Checkbox>
          <Checkbox
            isChecked={hasHRMonitor}
            onChange={(e) => {
              setHasHRMonitor(e.target.checked);
              handleChange();
            }}
            colorScheme="brand"
          >
            {t('onboarding.equipment.hrMonitor')}
          </Checkbox>
        </VStack>
      </Box>

      {/* Save Button */}
      <Button
        leftIcon={<Save size={18} />}
        colorScheme="brand"
        size="lg"
        onClick={handleSaveAll}
        isLoading={isSaving}
        isDisabled={!hasChanges}
      >
        {t('settings.saveProfile')}
      </Button>
    </VStack>
  );
}
