/**
 * StepTerrain
 * Onboarding step for selecting preferred terrain
 */
import {
  VStack,
  Text,
  Heading,
  Box,
  SimpleGrid,
  useColorModeValue,
  useRadioGroup,
  useRadio,
  chakra,
  Icon,
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { Mountain, Waves, TriangleRight } from 'lucide-react';
import type { TerrainStepData, TerrainType } from '../../../types/onboarding';

interface StepTerrainProps {
  data: Partial<TerrainStepData>;
  onChange: (data: Partial<TerrainStepData>) => void;
}

const TERRAINS: { value: TerrainType; titleKey: string; descKey: string; icon: typeof Mountain }[] = [
  { value: 'HILLS', titleKey: 'onboarding.terrain.hills', descKey: 'onboarding.terrain.hillsDesc', icon: TriangleRight },
  { value: 'FLAT', titleKey: 'onboarding.terrain.flat', descKey: 'onboarding.terrain.flatDesc', icon: Waves },
  { value: 'MOUNTAINS', titleKey: 'onboarding.terrain.mountains', descKey: 'onboarding.terrain.mountainsDesc', icon: Mountain },
];

function TerrainCard(props: any) {
  const { getInputProps, getRadioProps } = useRadio(props);
  const { t } = useTranslation();

  const input = getInputProps();
  const checkbox = getRadioProps();

  const bgColor = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const selectedBg = useColorModeValue('brand.50', 'brand.900');
  const selectedBorder = useColorModeValue('brand.500', 'brand.400');
  const hoverBg = useColorModeValue('gray.50', 'gray.600');
  const iconColor = useColorModeValue('brand.500', 'brand.300');

  return (
    <chakra.label cursor="pointer" h="full">
      <input {...input} />
      <Box
        {...checkbox}
        borderWidth="2px"
        borderRadius="xl"
        borderColor={borderColor}
        bg={bgColor}
        p={6}
        textAlign="center"
        transition="all 0.2s"
        h="full"
        minH="180px"
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        _hover={{ bg: hoverBg }}
        _checked={{
          bg: selectedBg,
          borderColor: selectedBorder,
        }}
      >
        <Icon as={props.icon} boxSize={10} color={iconColor} mb={3} />
        <Text fontWeight="bold" mb={1}>
          {t(props.titleKey)}
        </Text>
        <Text fontSize="sm" color="gray.500">
          {t(props.descKey)}
        </Text>
      </Box>
    </chakra.label>
  );
}

export function StepTerrain({ data, onChange }: StepTerrainProps) {
  const { t } = useTranslation();
  const labelColor = useColorModeValue('gray.600', 'gray.400');

  const { getRootProps, getRadioProps } = useRadioGroup({
    name: 'terrain',
    value: data.terrain || '',
    onChange: (value) => onChange({ terrain: value as TerrainType }),
  });

  const group = getRootProps();

  return (
    <VStack spacing={6} align="stretch">
      <Box textAlign="center" mb={4}>
        <Heading size="md" mb={2}>{t('onboarding.terrain.title')}</Heading>
        <Text color={labelColor}>{t('onboarding.terrain.description')}</Text>
      </Box>

      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} {...group}>
        {TERRAINS.map((terrain) => {
          const radio = getRadioProps({ value: terrain.value });
          return (
            <TerrainCard
              key={terrain.value}
              {...radio}
              titleKey={terrain.titleKey}
              descKey={terrain.descKey}
              icon={terrain.icon}
            />
          );
        })}
      </SimpleGrid>
    </VStack>
  );
}
