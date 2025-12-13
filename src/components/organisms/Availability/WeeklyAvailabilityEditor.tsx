import {
  Box,
  Flex,
  Grid,
  GridItem,
  Text,
  Heading,
  Switch,
  HStack,
  VStack,
  Badge,
  Select,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  useColorModeValue,
  useBreakpointValue,
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { Clock, Sun, Bike } from 'lucide-react';
import type { WeeklyAvailability, DayAvailability } from '../../../types/availability';

interface WeeklyAvailabilityEditorProps {
  availability: WeeklyAvailability;
  onChange: (availability: WeeklyAvailability) => void;
}

export function WeeklyAvailabilityEditor({ availability, onChange }: WeeklyAvailabilityEditorProps) {
  const { t } = useTranslation();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const headerBg = useColorModeValue('gray.50', 'gray.900');
  const isMobile = useBreakpointValue({ base: true, md: false });

  const handleDayChange = (dayIndex: number, changes: Partial<DayAvailability>) => {
    const newDays = availability.days.map((day) =>
      day.dayIndex === dayIndex ? { ...day, ...changes } : day
    );

    const totalWeeklyHours = newDays.reduce(
      (sum, day) => sum + (day.isAvailable ? day.maxHours : 0),
      0
    );

    onChange({
      ...availability,
      days: newDays,
      totalWeeklyHours,
    });
  };

  const formatHours = (hours: number): string => {
    if (hours === 0) return '0h';
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    if (h === 0) return `${m}m`;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  return (
    <Box
      bg={bgColor}
      borderRadius="xl"
      borderWidth="1px"
      borderColor={borderColor}
      overflow="hidden"
    >
      {/* Header */}
      <Flex
        bg={headerBg}
        px={4}
        py={3}
        borderBottomWidth="1px"
        borderColor={borderColor}
        justify="space-between"
        align="center"
      >
        <HStack spacing={2}>
          <Clock size={18} />
          <Heading size="sm">{t('availability.title')}</Heading>
        </HStack>
        <Badge colorScheme="brand" fontSize="sm" px={2} py={1}>
          {formatHours(availability.totalWeeklyHours)} / {t('availability.week')}
        </Badge>
      </Flex>

      {/* Days List */}
      <VStack spacing={0} divider={<Box borderBottomWidth="1px" borderColor={borderColor} w="full" />}>
        {availability.days.map((day) => (
          isMobile ? (
            <MobileDayRow
              key={day.dayIndex}
              day={day}
              onChange={(changes) => handleDayChange(day.dayIndex, changes)}
              formatHours={formatHours}
            />
          ) : (
            <DesktopDayRow
              key={day.dayIndex}
              day={day}
              onChange={(changes) => handleDayChange(day.dayIndex, changes)}
              formatHours={formatHours}
            />
          )
        ))}
      </VStack>
    </Box>
  );
}

interface DayRowProps {
  day: DayAvailability;
  onChange: (changes: Partial<DayAvailability>) => void;
  formatHours: (hours: number) => string;
}

// Desktop layout - horizontal grid
function DesktopDayRow({ day, onChange, formatHours }: DayRowProps) {
  const { t } = useTranslation();
  const isWeekend = day.dayIndex >= 5;
  const activeBg = useColorModeValue('brand.50', 'brand.900');
  const inactiveBg = useColorModeValue('gray.50', 'gray.800');
  const mutedColor = useColorModeValue('gray.600', 'gray.400');

  return (
    <Box
      w="full"
      px={4}
      py={3}
      bg={day.isAvailable ? activeBg : inactiveBg}
      opacity={day.isAvailable ? 1 : 0.6}
      transition="all 0.2s"
    >
      <Grid templateColumns="120px 80px 1fr 120px" gap={4} alignItems="center">
        {/* Day Name */}
        <GridItem>
          <HStack spacing={2}>
            {isWeekend ? (
              <Sun size={14} color={mutedColor} />
            ) : (
              <Bike size={14} color={mutedColor} />
            )}
            <Text fontWeight="medium" fontSize="sm">
              {day.dayName}
            </Text>
          </HStack>
        </GridItem>

        {/* Available Toggle */}
        <GridItem>
          <Switch
            colorScheme="brand"
            isChecked={day.isAvailable}
            onChange={(e) => onChange({ isAvailable: e.target.checked })}
            size="sm"
          />
        </GridItem>

        {/* Hours Slider */}
        <GridItem>
          {day.isAvailable && (
            <HStack spacing={3}>
              <Slider
                value={day.maxHours}
                min={0}
                max={isWeekend ? 6 : 3}
                step={0.5}
                onChange={(val) => onChange({ maxHours: val })}
                colorScheme="brand"
                flex="1"
              >
                <SliderTrack>
                  <SliderFilledTrack />
                </SliderTrack>
                <SliderThumb boxSize={5} />
              </Slider>
              <Text fontSize="sm" fontWeight="medium" minW="50px" textAlign="right">
                {formatHours(day.maxHours)}
              </Text>
            </HStack>
          )}
        </GridItem>

        {/* Preferred Type */}
        <GridItem>
          {day.isAvailable && (
            <Select
              size="xs"
              value={day.preferredType || 'any'}
              onChange={(e) => onChange({ preferredType: e.target.value as DayAvailability['preferredType'] })}
            >
              <option value="any">{t('availability.any')}</option>
              <option value="indoor">{t('availability.indoor')}</option>
              <option value="outdoor">{t('availability.outdoor')}</option>
            </Select>
          )}
        </GridItem>
      </Grid>
    </Box>
  );
}

// Mobile layout - stacked card style
function MobileDayRow({ day, onChange, formatHours }: DayRowProps) {
  const { t } = useTranslation();
  const isWeekend = day.dayIndex >= 5;
  const activeBg = useColorModeValue('brand.50', 'brand.900');
  const inactiveBg = useColorModeValue('gray.50', 'gray.800');
  const mutedColor = useColorModeValue('gray.600', 'gray.400');

  return (
    <Box
      w="full"
      px={3}
      py={3}
      bg={day.isAvailable ? activeBg : inactiveBg}
      opacity={day.isAvailable ? 1 : 0.6}
      transition="all 0.2s"
    >
      {/* Top row: Day name + Toggle */}
      <Flex justify="space-between" align="center" mb={day.isAvailable ? 3 : 0}>
        <HStack spacing={2}>
          {isWeekend ? (
            <Sun size={16} color={mutedColor} />
          ) : (
            <Bike size={16} color={mutedColor} />
          )}
          <Text fontWeight="semibold" fontSize="sm">
            {day.dayName}
          </Text>
        </HStack>
        <Switch
          colorScheme="brand"
          isChecked={day.isAvailable}
          onChange={(e) => onChange({ isAvailable: e.target.checked })}
          size="md"
        />
      </Flex>

      {/* Expanded content when available */}
      {day.isAvailable && (
        <VStack spacing={3} align="stretch">
          {/* Hours slider */}
          <Box>
            <Flex justify="space-between" align="center" mb={1}>
              <Text fontSize="xs" color={mutedColor}>
                {t('availability.hoursAvailable')}
              </Text>
              <Text fontSize="sm" fontWeight="medium">
                {formatHours(day.maxHours)}
              </Text>
            </Flex>
            <Slider
              value={day.maxHours}
              min={0}
              max={isWeekend ? 6 : 3}
              step={0.5}
              onChange={(val) => onChange({ maxHours: val })}
              colorScheme="brand"
            >
              <SliderTrack>
                <SliderFilledTrack />
              </SliderTrack>
              <SliderThumb boxSize={5} />
            </Slider>
          </Box>

          {/* Preferred type */}
          <Flex justify="space-between" align="center">
            <Text fontSize="xs" color={mutedColor}>
              {t('availability.preferredType')}
            </Text>
            <Select
              size="sm"
              w="auto"
              minW="100px"
              value={day.preferredType || 'any'}
              onChange={(e) => onChange({ preferredType: e.target.value as DayAvailability['preferredType'] })}
            >
              <option value="any">{t('availability.any')}</option>
              <option value="indoor">{t('availability.indoor')}</option>
              <option value="outdoor">{t('availability.outdoor')}</option>
            </Select>
          </Flex>
        </VStack>
      )}
    </Box>
  );
}
