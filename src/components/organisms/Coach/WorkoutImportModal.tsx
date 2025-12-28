/**
 * WorkoutImportModal - Modal for importing workouts from TrainingPeaks or JSON
 *
 * Features:
 * - Import planned workouts from TrainingPeaks FIT files
 * - Paste JSON directly from TrainingPeaks export
 * - Preview workout before importing
 */
import { useState, useRef, useCallback } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Button,
  VStack,
  HStack,
  Text,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Textarea,
  Box,
  useColorModeValue,
  useToast,
  FormControl,
  FormLabel,
  Input,
  Select,
  Icon,
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { Upload, FileJson } from 'lucide-react';
import { api } from '../../../services/api';

interface WorkoutImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  coachId: string;
  categories: Array<{ id: string; name: string }>;
  onImportSuccess: () => void;
}

interface ParsedWorkout {
  name: string;
  description?: string;
  durationSeconds: number;
  tssPlanned: number;
  ifPlanned: number;
  structure: unknown;
  rawJson: unknown;
  workoutType?: string;
}

export function WorkoutImportModal({
  isOpen,
  onClose,
  coachId,
  categories,
  onImportSuccess,
}: WorkoutImportModalProps) {
  const { t } = useTranslation();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [parsedWorkout, setParsedWorkout] = useState<ParsedWorkout | null>(null);
  const [jsonInput, setJsonInput] = useState('');
  const [customName, setCustomName] = useState('');
  const [customDescription, setCustomDescription] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.fit') && !fileName.endsWith('.fit.gz') && !fileName.endsWith('.gz')) {
      toast({
        title: t('workoutImport.invalidFileType') || 'Invalid file type',
        description: t('workoutImport.fitFilesOnly') || 'Please select a FIT file from TrainingPeaks (.fit or .fit.gz)',
        status: 'error',
        duration: 5000,
      });
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post<ParsedWorkout>('/api/activity-import/trainingpeaks-workout', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setParsedWorkout(response.data);
      setCustomName(response.data.name);
      setCustomDescription(response.data.description || '');

      toast({
        title: t('workoutImport.parsed') || 'Workout parsed successfully',
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      console.error('Failed to parse FIT file:', error);
      toast({
        title: t('workoutImport.parseFailed') || 'Failed to parse FIT file',
        description: error instanceof Error ? error.message : t('common.error'),
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleParseJson = useCallback(() => {
    try {
      const parsed = JSON.parse(jsonInput);

      // Validate that it has the expected structure
      if (!parsed.structure || !parsed.workout_steps) {
        throw new Error('Invalid workout JSON structure');
      }

      setParsedWorkout({
        name: parsed.name || parsed.workout_name || 'Imported Workout',
        description: parsed.description || parsed.workout_description || '',
        durationSeconds: parsed.planned_duration_in_secs || 3600,
        tssPlanned: parsed.tss_planned || 0,
        ifPlanned: parsed.if_planned || 0,
        structure: parsed.structure,
        rawJson: parsed,
        workoutType: parsed.workout_type_name || 'BIKE',
      });

      setCustomName(parsed.name || parsed.workout_name || 'Imported Workout');
      setCustomDescription(parsed.description || parsed.workout_description || '');

      toast({
        title: t('workoutImport.jsonParsed') || 'JSON parsed successfully',
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      console.error('Failed to parse JSON:', error);
      toast({
        title: t('workoutImport.invalidJson') || 'Invalid JSON',
        description: error instanceof Error ? error.message : t('common.error'),
        status: 'error',
        duration: 5000,
      });
    }
  }, [jsonInput, toast, t]);

  const handleImport = useCallback(async () => {
    if (!parsedWorkout || !selectedCategoryId) {
      toast({
        title: t('workoutImport.selectCategory') || 'Please select a category',
        status: 'warning',
        duration: 3000,
      });
      return;
    }

    setIsUploading(true);
    try {
      // Generate slug from name
      const slug = customName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      const payload = {
        slug: `${slug}-${Date.now()}`,
        name: customName,
        description: customDescription || undefined,
        durationSeconds: parsedWorkout.durationSeconds,
        tssPlanned: parsedWorkout.tssPlanned,
        ifPlanned: parsedWorkout.ifPlanned,
        structure: parsedWorkout.structure,
        rawJson: parsedWorkout.rawJson,
        categoryId: selectedCategoryId,
        coachId,
        workoutType: parsedWorkout.workoutType || 'BIKE',
      };

      await api.post('/api/workouts', payload);

      toast({
        title: t('workoutImport.success') || 'Workout imported successfully',
        status: 'success',
        duration: 3000,
      });

      onImportSuccess();
      handleClose();
    } catch (error) {
      console.error('Failed to import workout:', error);
      toast({
        title: t('workoutImport.failed') || 'Failed to import workout',
        description: error instanceof Error ? error.message : t('common.error'),
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsUploading(false);
    }
  }, [parsedWorkout, selectedCategoryId, customName, customDescription, coachId, toast, t, onImportSuccess]);

  const handleClose = useCallback(() => {
    setParsedWorkout(null);
    setJsonInput('');
    setCustomName('');
    setCustomDescription('');
    setSelectedCategoryId('');
    onClose();
  }, [onClose]);

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".fit,.fit.gz,.gz"
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />

      <Modal isOpen={isOpen} onClose={handleClose} size="2xl">
        <ModalOverlay />
        <ModalContent bg={bgColor}>
          <ModalHeader>{t('workoutImport.title') || 'Import Workout'}</ModalHeader>
          <ModalCloseButton />

          <ModalBody>
            <Tabs variant="soft-rounded" colorScheme="brand">
              <TabList>
                <Tab>
                  <HStack spacing={2}>
                    <Icon as={Upload} boxSize={4} />
                    <Text>{t('workoutImport.uploadFit') || 'Upload FIT File'}</Text>
                  </HStack>
                </Tab>
                <Tab>
                  <HStack spacing={2}>
                    <Icon as={FileJson} boxSize={4} />
                    <Text>{t('workoutImport.pasteJson') || 'Paste JSON'}</Text>
                  </HStack>
                </Tab>
              </TabList>

              <TabPanels>
                {/* Upload FIT File Tab */}
                <TabPanel>
                  <VStack spacing={4} align="stretch">
                    <Text fontSize="sm" color="gray.500">
                      {t('workoutImport.fitDescription') || 'Upload a planned workout FIT file exported from TrainingPeaks'}
                    </Text>

                    <Button
                      leftIcon={<Upload size={16} />}
                      onClick={() => fileInputRef.current?.click()}
                      isLoading={isUploading}
                      loadingText={t('workoutImport.parsing') || 'Parsing...'}
                      colorScheme="brand"
                      variant="outline"
                    >
                      {t('workoutImport.selectFile') || 'Select FIT File'}
                    </Button>

                    {parsedWorkout && (
                      <Box
                        p={4}
                        borderWidth="1px"
                        borderColor={borderColor}
                        borderRadius="md"
                        bg={useColorModeValue('gray.50', 'gray.700')}
                      >
                        <VStack spacing={3} align="stretch">
                          <FormControl isRequired>
                            <FormLabel fontSize="sm">{t('workout.name')}</FormLabel>
                            <Input
                              value={customName}
                              onChange={(e) => setCustomName(e.target.value)}
                              placeholder={t('workout.namePlaceholder')}
                            />
                          </FormControl>

                          <FormControl>
                            <FormLabel fontSize="sm">{t('workout.description')}</FormLabel>
                            <Textarea
                              value={customDescription}
                              onChange={(e) => setCustomDescription(e.target.value)}
                              placeholder={t('workout.descriptionPlaceholder')}
                              rows={3}
                            />
                          </FormControl>

                          <FormControl isRequired>
                            <FormLabel fontSize="sm">{t('workout.category')}</FormLabel>
                            <Select
                              value={selectedCategoryId}
                              onChange={(e) => setSelectedCategoryId(e.target.value)}
                              placeholder={t('workout.selectCategory')}
                            >
                              {categories.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                  {cat.name}
                                </option>
                              ))}
                            </Select>
                          </FormControl>

                          <HStack fontSize="sm" color="gray.500" justify="space-between">
                            <Text>{Math.round(parsedWorkout.durationSeconds / 60)} min</Text>
                            <Text>{parsedWorkout.tssPlanned} TSS</Text>
                            <Text>IF: {parsedWorkout.ifPlanned.toFixed(2)}</Text>
                          </HStack>
                        </VStack>
                      </Box>
                    )}
                  </VStack>
                </TabPanel>

                {/* Paste JSON Tab */}
                <TabPanel>
                  <VStack spacing={4} align="stretch">
                    <Text fontSize="sm" color="gray.500">
                      {t('workoutImport.jsonDescription') || 'Paste the raw JSON from TrainingPeaks workout export'}
                    </Text>

                    <Textarea
                      value={jsonInput}
                      onChange={(e) => setJsonInput(e.target.value)}
                      placeholder={t('workoutImport.jsonPlaceholder') || 'Paste JSON here...'}
                      rows={10}
                      fontFamily="mono"
                      fontSize="sm"
                    />

                    <Button
                      onClick={handleParseJson}
                      isDisabled={!jsonInput.trim()}
                      colorScheme="brand"
                      variant="outline"
                    >
                      {t('workoutImport.parseJson') || 'Parse JSON'}
                    </Button>

                    {parsedWorkout && (
                      <Box
                        p={4}
                        borderWidth="1px"
                        borderColor={borderColor}
                        borderRadius="md"
                        bg={useColorModeValue('gray.50', 'gray.700')}
                      >
                        <VStack spacing={3} align="stretch">
                          <FormControl isRequired>
                            <FormLabel fontSize="sm">{t('workout.name')}</FormLabel>
                            <Input
                              value={customName}
                              onChange={(e) => setCustomName(e.target.value)}
                              placeholder={t('workout.namePlaceholder')}
                            />
                          </FormControl>

                          <FormControl>
                            <FormLabel fontSize="sm">{t('workout.description')}</FormLabel>
                            <Textarea
                              value={customDescription}
                              onChange={(e) => setCustomDescription(e.target.value)}
                              placeholder={t('workout.descriptionPlaceholder')}
                              rows={3}
                            />
                          </FormControl>

                          <FormControl isRequired>
                            <FormLabel fontSize="sm">{t('workout.category')}</FormLabel>
                            <Select
                              value={selectedCategoryId}
                              onChange={(e) => setSelectedCategoryId(e.target.value)}
                              placeholder={t('workout.selectCategory')}
                            >
                              {categories.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                  {cat.name}
                                </option>
                              ))}
                            </Select>
                          </FormControl>

                          <HStack fontSize="sm" color="gray.500" justify="space-between">
                            <Text>{Math.round(parsedWorkout.durationSeconds / 60)} min</Text>
                            <Text>{parsedWorkout.tssPlanned} TSS</Text>
                            <Text>IF: {parsedWorkout.ifPlanned.toFixed(2)}</Text>
                          </HStack>
                        </VStack>
                      </Box>
                    )}
                  </VStack>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={handleClose}>
              {t('common.cancel')}
            </Button>
            <Button
              colorScheme="brand"
              onClick={handleImport}
              isDisabled={!parsedWorkout || !selectedCategoryId}
              isLoading={isUploading}
            >
              {t('workoutImport.import') || 'Import Workout'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
