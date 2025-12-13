/**
 * StepCategory
 * Onboarding step for selecting athlete category
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
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import type { CategoryStepData, AthleteCategory } from '../../../types/onboarding';

interface StepCategoryProps {
  data: Partial<CategoryStepData>;
  onChange: (data: Partial<CategoryStepData>) => void;
}

const CATEGORIES: { value: AthleteCategory; titleKey: string; descKey: string }[] = [
  { value: 'AMATORE', titleKey: 'onboarding.category.amatore', descKey: 'onboarding.category.amatoreDesc' },
  { value: 'JUNIORES', titleKey: 'onboarding.category.juniores', descKey: 'onboarding.category.junioresDesc' },
  { value: 'U23', titleKey: 'onboarding.category.u23', descKey: 'onboarding.category.u23Desc' },
  { value: 'ELITE', titleKey: 'onboarding.category.elite', descKey: 'onboarding.category.eliteDesc' },
  { value: 'PRO', titleKey: 'onboarding.category.pro', descKey: 'onboarding.category.proDesc' },
];

function CategoryCard(props: any) {
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
        borderRadius="xl"
        borderColor={borderColor}
        bg={bgColor}
        p={4}
        transition="all 0.2s"
        _hover={{ bg: hoverBg }}
        _checked={{
          bg: selectedBg,
          borderColor: selectedBorder,
        }}
      >
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

export function StepCategory({ data, onChange }: StepCategoryProps) {
  const { t } = useTranslation();
  const labelColor = useColorModeValue('gray.600', 'gray.400');

  const { getRootProps, getRadioProps } = useRadioGroup({
    name: 'category',
    value: data.athleteCategory || '',
    onChange: (value) => onChange({ athleteCategory: value as AthleteCategory }),
  });

  const group = getRootProps();

  return (
    <VStack spacing={6} align="stretch">
      <Box textAlign="center" mb={4}>
        <Heading size="md" mb={2}>{t('onboarding.category.title')}</Heading>
        <Text color={labelColor}>{t('onboarding.category.description')}</Text>
      </Box>

      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} {...group}>
        {CATEGORIES.map((cat) => {
          const radio = getRadioProps({ value: cat.value });
          return (
            <CategoryCard
              key={cat.value}
              {...radio}
              titleKey={cat.titleKey}
              descKey={cat.descKey}
            />
          );
        })}
      </SimpleGrid>
    </VStack>
  );
}
