/**
 * StepDiscipline
 * Onboarding step for selecting cycling disciplines
 */
import {
  VStack,
  Text,
  Heading,
  Box,
  HStack,
  Button,
  Select,
  IconButton,
  useColorModeValue,
  Flex,
  Badge,
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { Plus, X, Mountain, Bike } from 'lucide-react';
import type { DisciplineStepData, DisciplineType, DisciplineSubType } from '../../../types/onboarding';
import { DISCIPLINE_SUBTYPES } from '../../../types/onboarding';

interface StepDisciplineProps {
  data: DisciplineStepData['disciplines'];
  onChange: (data: DisciplineStepData['disciplines']) => void;
}

const DISCIPLINES: { value: DisciplineType; labelKey: string; icon: typeof Bike }[] = [
  { value: 'MTB', labelKey: 'onboarding.discipline.mtb', icon: Mountain },
  { value: 'GRAVEL_CICLOCROSS', labelKey: 'onboarding.discipline.gravel', icon: Bike },
  { value: 'ROAD', labelKey: 'onboarding.discipline.road', icon: Bike },
];

export function StepDiscipline({ data, onChange }: StepDisciplineProps) {
  const { t } = useTranslation();
  const labelColor = useColorModeValue('gray.600', 'gray.400');
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const addDiscipline = () => {
    // Find a discipline not yet added
    const usedDisciplines = data.map((d) => d.discipline);
    const available = DISCIPLINES.find((d) => !usedDisciplines.includes(d.value));
    if (available) {
      const defaultSubtype = DISCIPLINE_SUBTYPES[available.value][0].value;
      onChange([...data, { discipline: available.value, subType: defaultSubtype }]);
    }
  };

  const removeDiscipline = (index: number) => {
    onChange(data.filter((_, i) => i !== index));
  };

  const updateDiscipline = (index: number, discipline: DisciplineType) => {
    const defaultSubtype = DISCIPLINE_SUBTYPES[discipline][0].value;
    onChange(
      data.map((d, i) => (i === index ? { discipline, subType: defaultSubtype } : d))
    );
  };

  const updateSubType = (index: number, subType: DisciplineSubType) => {
    onChange(data.map((d, i) => (i === index ? { ...d, subType } : d)));
  };

  const usedDisciplines = data.map((d) => d.discipline);
  const canAddMore = data.length < DISCIPLINES.length;

  return (
    <VStack spacing={6} align="stretch">
      <Box textAlign="center" mb={4}>
        <Heading size="md" mb={2}>{t('onboarding.discipline.title')}</Heading>
        <Text color={labelColor}>{t('onboarding.discipline.description')}</Text>
      </Box>

      <VStack spacing={4} align="stretch">
        {data.map((item, index) => (
          <Box
            key={index}
            bg={cardBg}
            borderWidth="1px"
            borderColor={borderColor}
            borderRadius="lg"
            p={4}
          >
            <Flex justify="space-between" align="center" mb={3}>
              <HStack>
                <Badge colorScheme="brand" fontSize="sm">
                  #{index + 1}
                </Badge>
                <Select
                  value={item.discipline}
                  onChange={(e) => updateDiscipline(index, e.target.value as DisciplineType)}
                  size="sm"
                  w="auto"
                  fontWeight="bold"
                >
                  {DISCIPLINES.map((d) => (
                    <option
                      key={d.value}
                      value={d.value}
                      disabled={usedDisciplines.includes(d.value) && item.discipline !== d.value}
                    >
                      {t(d.labelKey)}
                    </option>
                  ))}
                </Select>
              </HStack>
              {data.length > 1 && (
                <IconButton
                  aria-label="Remove discipline"
                  icon={<X size={16} />}
                  size="sm"
                  variant="ghost"
                  colorScheme="red"
                  onClick={() => removeDiscipline(index)}
                />
              )}
            </Flex>
            <Box>
              <Text fontSize="sm" color={labelColor} mb={2}>
                {t('onboarding.discipline.selectSubtype')}
              </Text>
              <Select
                value={item.subType}
                onChange={(e) => updateSubType(index, e.target.value as DisciplineSubType)}
              >
                {DISCIPLINE_SUBTYPES[item.discipline].map((sub) => (
                  <option key={sub.value} value={sub.value}>
                    {t(sub.labelKey)}
                  </option>
                ))}
              </Select>
            </Box>
          </Box>
        ))}

        {canAddMore && (
          <Button
            variant="outline"
            leftIcon={<Plus size={20} />}
            onClick={addDiscipline}
            size="lg"
          >
            {t('onboarding.discipline.addAnother')}
          </Button>
        )}
      </VStack>
    </VStack>
  );
}
