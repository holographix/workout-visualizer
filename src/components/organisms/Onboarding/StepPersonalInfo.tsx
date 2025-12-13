/**
 * StepPersonalInfo
 * Onboarding step for collecting personal information
 */
import {
  VStack,
  FormControl,
  FormLabel,
  Input,
  RadioGroup,
  Radio,
  HStack,
  Text,
  Heading,
  Box,
  useColorModeValue,
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import type { PersonalInfoStepData, Sex } from '../../../types/onboarding';

interface StepPersonalInfoProps {
  data: Partial<PersonalInfoStepData>;
  onChange: (data: Partial<PersonalInfoStepData>) => void;
}

export function StepPersonalInfo({ data, onChange }: StepPersonalInfoProps) {
  const { t } = useTranslation();
  const labelColor = useColorModeValue('gray.600', 'gray.400');

  return (
    <VStack spacing={6} align="stretch">
      <Box textAlign="center" mb={4}>
        <Heading size="md" mb={2}>{t('onboarding.personal.title')}</Heading>
        <Text color={labelColor}>{t('onboarding.personal.description')}</Text>
      </Box>

      <FormControl isRequired>
        <FormLabel>{t('onboarding.personal.fullName')}</FormLabel>
        <Input
          value={data.fullName || ''}
          onChange={(e) => onChange({ ...data, fullName: e.target.value })}
          placeholder={t('onboarding.personal.fullNamePlaceholder')}
          size="lg"
        />
      </FormControl>

      <FormControl isRequired>
        <FormLabel>{t('onboarding.personal.birthday')}</FormLabel>
        <Input
          type="date"
          value={data.birthday || ''}
          onChange={(e) => onChange({ ...data, birthday: e.target.value })}
          size="lg"
        />
      </FormControl>

      <FormControl isRequired>
        <FormLabel>{t('onboarding.personal.sex')}</FormLabel>
        <RadioGroup
          value={data.sex || ''}
          onChange={(value) => onChange({ ...data, sex: value as Sex })}
        >
          <HStack spacing={8}>
            <Radio value="MALE" size="lg">
              {t('onboarding.personal.male')}
            </Radio>
            <Radio value="FEMALE" size="lg">
              {t('onboarding.personal.female')}
            </Radio>
          </HStack>
        </RadioGroup>
      </FormControl>

      {data.sex === 'FEMALE' && (
        <FormControl>
          <FormLabel>{t('onboarding.personal.menstrualDate')}</FormLabel>
          <Input
            type="date"
            value={data.lastMenstrualDate || ''}
            onChange={(e) => onChange({ ...data, lastMenstrualDate: e.target.value })}
            size="lg"
          />
          <Text fontSize="sm" color={labelColor} mt={1}>
            {t('onboarding.personal.menstrualDateDescription')}
          </Text>
        </FormControl>
      )}
    </VStack>
  );
}
