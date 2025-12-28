import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Icon,
  Input,
  InputGroup,
  InputRightAddon,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Select,
  SimpleGrid,
  Spinner,
  Text,
  VStack,
  useColorModeValue,
  Divider,
  Badge,
  Progress,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
} from '@chakra-ui/react';
import { Activity, Heart, Zap, RefreshCw } from 'lucide-react';
import { useZones } from '../../../hooks/useZones';
import type {
  CalculatedPowerZone,
  CalculatedHRZone,
  PowerZoneSystem,
  HRZoneSystem,
} from '../../../types/zones';
import {
  POWER_ZONE_COLORS,
  HR_ZONE_COLORS,
  COGGAN_ZONE_NAMES,
  HR_ZONE_NAMES,
} from '../../../types/zones';

interface ZonesEditorProps {
  athleteId: string;
  onSave?: () => void;
}

export function ZonesEditor({ athleteId, onSave }: ZonesEditorProps) {
  const { t } = useTranslation();
  const {
    loading,
    zonesData,
    fetchZones,
    updatePowerZones,
    updateHRZones,
    updateAthleteZoneData,
  } = useZones();

  // Local state for form
  const [ftp, setFtp] = useState<number | undefined>(undefined);
  const [maxHR, setMaxHR] = useState<number | undefined>(undefined);
  const [restingHR, setRestingHR] = useState<number | undefined>(undefined);
  const [powerSystem, setPowerSystem] = useState<PowerZoneSystem>('COGGAN');
  const [hrSystem, setHRSystem] = useState<HRZoneSystem>('STANDARD');
  const [isSaving, setIsSaving] = useState(false);

  // Colors
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const mutedColor = useColorModeValue('gray.500', 'gray.400');
  const tableBg = useColorModeValue('gray.50', 'gray.900');

  // Load zones on mount
  useEffect(() => {
    fetchZones(athleteId);
  }, [athleteId, fetchZones]);

  // Update local state when zonesData changes
  useEffect(() => {
    if (zonesData) {
      setFtp(zonesData.athlete.ftp ?? undefined);
      setMaxHR(zonesData.athlete.maxHR ?? undefined);
      setRestingHR(zonesData.athlete.restingHR ?? undefined);
      setPowerSystem((zonesData.power.config.zoneSystem as PowerZoneSystem) || 'COGGAN');
      setHRSystem((zonesData.hr.config.zoneSystem as HRZoneSystem) || 'STANDARD');
    }
  }, [zonesData]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Update athlete data (FTP, maxHR, restingHR)
      await updateAthleteZoneData(athleteId, {
        ftp,
        maxHR,
        restingHR,
      });

      // Update zone configurations
      await updatePowerZones(athleteId, {
        zoneSystem: powerSystem,
      });

      await updateHRZones(athleteId, {
        zoneSystem: hrSystem,
      });

      // Reload data
      await fetchZones(athleteId);
      onSave?.();
    } finally {
      setIsSaving(false);
    }
  };

  if (loading && !zonesData) {
    return (
      <VStack py={8}>
        <Spinner size="lg" color="brand.500" />
        <Text color={mutedColor}>{t('zones.loading')}</Text>
      </VStack>
    );
  }

  const powerZones = zonesData?.power.calculatedZones;
  const hrZones = zonesData?.hr.calculatedZones;

  return (
    <VStack spacing={6} align="stretch">
      {/* Athlete Metrics Card */}
      <Box p={6} borderRadius="xl" bg={cardBg} borderWidth="1px" borderColor={borderColor}>
        <HStack spacing={3} mb={4}>
          <Icon as={Activity} boxSize={5} color="brand.500" />
          <Heading size="sm">{t('zones.athleteMetrics')}</Heading>
        </HStack>

        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
          <FormControl>
            <FormLabel fontSize="sm">{t('zones.ftp')}</FormLabel>
            <InputGroup size="sm">
              <NumberInput
                value={ftp ?? ''}
                onChange={(_, val) => setFtp(isNaN(val) ? undefined : val)}
                min={50}
                max={600}
                flex={1}
              >
                <NumberInputField borderRightRadius={0} />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
              <InputRightAddon>W</InputRightAddon>
            </InputGroup>
            <Text fontSize="xs" color={mutedColor} mt={1}>
              {t('zones.ftpDescription')}
            </Text>
          </FormControl>

          <FormControl>
            <FormLabel fontSize="sm">{t('zones.maxHR')}</FormLabel>
            <InputGroup size="sm">
              <NumberInput
                value={maxHR ?? ''}
                onChange={(_, val) => setMaxHR(isNaN(val) ? undefined : val)}
                min={100}
                max={250}
                flex={1}
              >
                <NumberInputField borderRightRadius={0} />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
              <InputRightAddon>BPM</InputRightAddon>
            </InputGroup>
            <Text fontSize="xs" color={mutedColor} mt={1}>
              {t('zones.maxHRDescription')}
            </Text>
          </FormControl>

          <FormControl>
            <FormLabel fontSize="sm">{t('zones.restingHR')}</FormLabel>
            <InputGroup size="sm">
              <NumberInput
                value={restingHR ?? ''}
                onChange={(_, val) => setRestingHR(isNaN(val) ? undefined : val)}
                min={30}
                max={100}
                flex={1}
              >
                <NumberInputField borderRightRadius={0} />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
              <InputRightAddon>BPM</InputRightAddon>
            </InputGroup>
            <Text fontSize="xs" color={mutedColor} mt={1}>
              {t('zones.restingHRDescription')}
            </Text>
          </FormControl>
        </SimpleGrid>

        <HStack justify="flex-end" mt={4}>
          <Button
            leftIcon={<RefreshCw size={16} />}
            size="sm"
            variant="outline"
            onClick={() => fetchZones(athleteId)}
            isLoading={loading}
          >
            {t('common.refresh')}
          </Button>
          <Button
            colorScheme="brand"
            size="sm"
            onClick={handleSave}
            isLoading={isSaving}
          >
            {t('common.save')}
          </Button>
        </HStack>
      </Box>

      {/* Power Zones Card */}
      <Box p={6} borderRadius="xl" bg={cardBg} borderWidth="1px" borderColor={borderColor}>
        <HStack spacing={3} mb={4} justify="space-between">
          <HStack spacing={3}>
            <Icon as={Zap} boxSize={5} color="yellow.500" />
            <Heading size="sm">{t('zones.powerZones')}</Heading>
          </HStack>
          <Select
            size="sm"
            w="auto"
            value={powerSystem}
            onChange={(e) => setPowerSystem(e.target.value as PowerZoneSystem)}
          >
            <option value="COGGAN">Coggan (7 zones)</option>
            <option value="POLARIZED">Polarized (3 zones)</option>
            <option value="CUSTOM">Custom</option>
          </Select>
        </HStack>

        {ftp ? (
          <PowerZonesTable zones={powerZones ?? null} ftp={ftp} />
        ) : (
          <Text color={mutedColor} fontSize="sm" textAlign="center" py={4}>
            {t('zones.enterFTPToSeeZones')}
          </Text>
        )}
      </Box>

      {/* HR Zones Card */}
      <Box p={6} borderRadius="xl" bg={cardBg} borderWidth="1px" borderColor={borderColor}>
        <HStack spacing={3} mb={4} justify="space-between">
          <HStack spacing={3}>
            <Icon as={Heart} boxSize={5} color="red.500" />
            <Heading size="sm">{t('zones.hrZones')}</Heading>
          </HStack>
          <Select
            size="sm"
            w="auto"
            value={hrSystem}
            onChange={(e) => setHRSystem(e.target.value as HRZoneSystem)}
          >
            <option value="STANDARD">Standard (% Max HR)</option>
            <option value="KARVONEN">Karvonen (HRR)</option>
            <option value="CUSTOM">Custom</option>
          </Select>
        </HStack>

        {maxHR ? (
          <HRZonesTable zones={hrZones ?? null} maxHR={maxHR} />
        ) : (
          <Text color={mutedColor} fontSize="sm" textAlign="center" py={4}>
            {t('zones.enterMaxHRToSeeZones')}
          </Text>
        )}
      </Box>
    </VStack>
  );
}

interface PowerZonesTableProps {
  zones: CalculatedPowerZone[] | null;
  ftp: number;
}

function PowerZonesTable({ zones, ftp }: PowerZonesTableProps) {
  const mutedColor = useColorModeValue('gray.500', 'gray.400');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  if (!zones) {
    return null;
  }

  return (
    <TableContainer>
      <Table size="sm" variant="simple">
        <Thead>
          <Tr>
            <Th>Zone</Th>
            <Th>Name</Th>
            <Th isNumeric>% FTP</Th>
            <Th isNumeric>Watts</Th>
          </Tr>
        </Thead>
        <Tbody>
          {zones.map((zone, idx) => (
            <Tr key={zone.zone}>
              <Td>
                <Badge colorScheme={POWER_ZONE_COLORS[idx]?.replace('.400', '')} size="sm">
                  Z{zone.zone}
                </Badge>
              </Td>
              <Td fontWeight="medium">{zone.name}</Td>
              <Td isNumeric color={mutedColor}>
                {zone.minPercent}% - {zone.maxPercent ? `${zone.maxPercent}%` : '...'}
              </Td>
              <Td isNumeric fontWeight="semibold">
                {zone.minWatts} - {zone.maxWatts ?? '...'} W
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </TableContainer>
  );
}

interface HRZonesTableProps {
  zones: CalculatedHRZone[] | null;
  maxHR: number;
}

function HRZonesTable({ zones, maxHR }: HRZonesTableProps) {
  const mutedColor = useColorModeValue('gray.500', 'gray.400');

  if (!zones) {
    return null;
  }

  return (
    <TableContainer>
      <Table size="sm" variant="simple">
        <Thead>
          <Tr>
            <Th>Zone</Th>
            <Th>Name</Th>
            <Th isNumeric>% Max HR</Th>
            <Th isNumeric>BPM</Th>
          </Tr>
        </Thead>
        <Tbody>
          {zones.map((zone, idx) => (
            <Tr key={zone.zone}>
              <Td>
                <Badge colorScheme={HR_ZONE_COLORS[idx]?.replace('.400', '')} size="sm">
                  Z{zone.zone}
                </Badge>
              </Td>
              <Td fontWeight="medium">{zone.name}</Td>
              <Td isNumeric color={mutedColor}>
                {zone.minPercent}% - {zone.maxPercent ? `${zone.maxPercent}%` : '100%'}
              </Td>
              <Td isNumeric fontWeight="semibold">
                {zone.minBPM} - {zone.maxBPM ?? maxHR} BPM
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </TableContainer>
  );
}
