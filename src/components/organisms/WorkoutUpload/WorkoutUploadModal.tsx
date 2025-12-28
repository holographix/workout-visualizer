/**
 * WorkoutUploadModal
 * Modal for uploading and importing workout files (.zwo, .erg, .mrc)
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
  VStack,
  HStack,
  Text,
  Button,
  useColorModeValue,
  useToast,
  Box,
  Icon,
  Input,
  FormControl,
  FormLabel,
  Textarea,
  Progress,
  Badge,
  Divider,
  Alert,
  AlertIcon,
  Select,
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { Upload, FileText, CheckCircle, Clock, Zap } from 'lucide-react';
import { useWorkoutUpload } from '../../../hooks/useWorkoutUpload';
import type { ConvertedWorkout, ParsedWorkoutResult } from '../../../types/workoutUpload';

interface WorkoutUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (workout: ConvertedWorkout) => Promise<void>;
  categories?: Array<{ id: string; name: string }>;
}

type UploadStep = 'upload' | 'preview' | 'customize';

export function WorkoutUploadModal({
  isOpen,
  onClose,
  onImport,
  categories = [],
}: WorkoutUploadModalProps) {
  const { t } = useTranslation();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<UploadStep>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedWorkout, setParsedWorkout] = useState<ParsedWorkoutResult | null>(null);
  const [convertedWorkout, setConvertedWorkout] = useState<ConvertedWorkout | null>(null);
  const [customName, setCustomName] = useState('');
  const [customDescription, setCustomDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  const {
    uploadAndParse,
    uploadAndConvert,
    isUploading,
    isParsing,
    isConverting,
    error,
    supportedFormats,
    reset: resetUpload,
  } = useWorkoutUpload();

  const bgColor = useColorModeValue('gray.50', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const dropzoneHoverBg = useColorModeValue('brand.50', 'brand.900');

  const handleReset = useCallback(() => {
    setStep('upload');
    setSelectedFile(null);
    setParsedWorkout(null);
    setConvertedWorkout(null);
    setCustomName('');
    setCustomDescription('');
    setSelectedCategory('');
    resetUpload();
  }, [resetUpload]);

  const handleClose = useCallback(() => {
    handleReset();
    onClose();
  }, [handleReset, onClose]);

  const handleFileSelect = useCallback(async (file: File) => {
    setSelectedFile(file);
    try {
      const parsed = await uploadAndParse(file);
      setParsedWorkout(parsed);
      setCustomName(parsed.name);
      setCustomDescription(parsed.description || '');
      setStep('preview');
    } catch (err) {
      toast({
        title: t('workoutUpload.parseError', 'Failed to parse file'),
        description: err instanceof Error ? err.message : 'Unknown error',
        status: 'error',
        duration: 5000,
      });
    }
  }, [uploadAndParse, toast, t]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleProceedToCustomize = useCallback(() => {
    setStep('customize');
  }, []);

  const handleImport = useCallback(async () => {
    if (!selectedFile) return;

    setIsImporting(true);
    try {
      const converted = await uploadAndConvert(selectedFile, {
        name: customName,
        description: customDescription,
        categoryId: selectedCategory || undefined,
      });
      setConvertedWorkout(converted);

      await onImport(converted);

      toast({
        title: t('workoutUpload.importSuccess', 'Workout imported'),
        description: t('workoutUpload.importSuccessDesc', '{{name}} has been added to your library', { name: customName }),
        status: 'success',
        duration: 3000,
      });

      handleClose();
    } catch (err) {
      toast({
        title: t('workoutUpload.importError', 'Failed to import workout'),
        description: err instanceof Error ? err.message : 'Unknown error',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsImporting(false);
    }
  }, [selectedFile, customName, customDescription, selectedCategory, uploadAndConvert, onImport, toast, t, handleClose]);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const isLoading = isUploading || isParsing || isConverting || isImporting;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          {step === 'upload' && t('workoutUpload.title', 'Import Workout')}
          {step === 'preview' && t('workoutUpload.preview', 'Preview Workout')}
          {step === 'customize' && t('workoutUpload.customize', 'Customize Workout')}
        </ModalHeader>
        <ModalCloseButton />

        <ModalBody pb={6}>
          {/* Step 1: Upload */}
          {step === 'upload' && (
            <VStack spacing={4}>
              <Box
                w="full"
                bg={bgColor}
                borderWidth="2px"
                borderStyle="dashed"
                borderColor={borderColor}
                borderRadius="xl"
                p={8}
                textAlign="center"
                transition="all 0.2s"
                cursor="pointer"
                _hover={{ bg: dropzoneHoverBg, borderColor: 'brand.500' }}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => fileInputRef.current?.click()}
              >
                <VStack spacing={3}>
                  <Icon as={Upload} boxSize={10} color="brand.500" />
                  <Text fontWeight="medium">
                    {t('workoutUpload.dropzone', 'Drag & drop a workout file here')}
                  </Text>
                  <Text fontSize="sm" color="gray.500">
                    {t('workoutUpload.orClick', 'or click to select a file')}
                  </Text>
                  <HStack spacing={2} mt={2}>
                    {supportedFormats.map((format) => (
                      <Badge key={format} colorScheme="brand" variant="subtle">
                        {format}
                      </Badge>
                    ))}
                  </HStack>
                </VStack>
              </Box>

              <Input
                ref={fileInputRef}
                type="file"
                accept={supportedFormats.join(',')}
                display="none"
                onChange={handleFileInputChange}
              />

              {isLoading && (
                <VStack w="full" spacing={2}>
                  <Progress size="sm" isIndeterminate w="full" colorScheme="brand" />
                  <Text fontSize="sm" color="gray.500">
                    {t('workoutUpload.parsing', 'Parsing workout file...')}
                  </Text>
                </VStack>
              )}

              {error && (
                <Alert status="error" borderRadius="md">
                  <AlertIcon />
                  {error.message}
                </Alert>
              )}

              <Text fontSize="xs" color="gray.500" textAlign="center">
                {t('workoutUpload.supportedFormats', 'Supported formats: Zwift (.zwo), ERG (.erg), MRC (.mrc)')}
              </Text>
            </VStack>
          )}

          {/* Step 2: Preview */}
          {step === 'preview' && parsedWorkout && (
            <VStack spacing={4} align="stretch">
              <HStack spacing={3} p={4} bg={bgColor} borderRadius="lg">
                <Icon as={FileText} boxSize={6} color="brand.500" />
                <VStack align="start" spacing={0} flex={1}>
                  <Text fontWeight="medium">{parsedWorkout.name}</Text>
                  <Text fontSize="sm" color="gray.500">
                    {selectedFile?.name}
                  </Text>
                </VStack>
                <Badge colorScheme="green" variant="subtle">
                  <HStack spacing={1}>
                    <CheckCircle size={12} />
                    <Text>{t('workoutUpload.parsed', 'Parsed')}</Text>
                  </HStack>
                </Badge>
              </HStack>

              <Divider />

              <VStack align="stretch" spacing={3}>
                <HStack justify="space-between">
                  <HStack spacing={2}>
                    <Icon as={Clock} size={16} color="gray.500" />
                    <Text fontSize="sm" color="gray.600">
                      {t('workoutUpload.duration', 'Duration')}
                    </Text>
                  </HStack>
                  <Text fontWeight="medium">
                    {formatDuration(parsedWorkout.totalDuration)}
                  </Text>
                </HStack>

                <HStack justify="space-between">
                  <HStack spacing={2}>
                    <Icon as={Zap} size={16} color="gray.500" />
                    <Text fontSize="sm" color="gray.600">
                      {t('workoutUpload.segments', 'Segments')}
                    </Text>
                  </HStack>
                  <Text fontWeight="medium">{parsedWorkout.segments.length}</Text>
                </HStack>

                <HStack justify="space-between">
                  <Text fontSize="sm" color="gray.600">
                    {t('workoutUpload.format', 'Format')}
                  </Text>
                  <Badge colorScheme="brand" textTransform="uppercase">
                    {parsedWorkout.sourceFormat}
                  </Badge>
                </HStack>

                {parsedWorkout.author && (
                  <HStack justify="space-between">
                    <Text fontSize="sm" color="gray.600">
                      {t('workoutUpload.author', 'Author')}
                    </Text>
                    <Text fontSize="sm">{parsedWorkout.author}</Text>
                  </HStack>
                )}
              </VStack>

              {parsedWorkout.description && (
                <>
                  <Divider />
                  <Box>
                    <Text fontSize="sm" fontWeight="medium" mb={1}>
                      {t('workoutUpload.description', 'Description')}
                    </Text>
                    <Text fontSize="sm" color="gray.600">
                      {parsedWorkout.description}
                    </Text>
                  </Box>
                </>
              )}
            </VStack>
          )}

          {/* Step 3: Customize */}
          {step === 'customize' && (
            <VStack spacing={4} align="stretch">
              <FormControl>
                <FormLabel>{t('workoutUpload.workoutName', 'Workout Name')}</FormLabel>
                <Input
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder={t('workoutUpload.namePlaceholder', 'Enter workout name')}
                />
              </FormControl>

              <FormControl>
                <FormLabel>{t('workoutUpload.workoutDescription', 'Description')}</FormLabel>
                <Textarea
                  value={customDescription}
                  onChange={(e) => setCustomDescription(e.target.value)}
                  placeholder={t('workoutUpload.descriptionPlaceholder', 'Enter description (optional)')}
                  rows={3}
                />
              </FormControl>

              {categories.length > 0 && (
                <FormControl>
                  <FormLabel>{t('workoutUpload.category', 'Category')}</FormLabel>
                  <Select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    placeholder={t('workoutUpload.selectCategory', 'Select a category')}
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </Select>
                </FormControl>
              )}

              {isLoading && (
                <VStack w="full" spacing={2}>
                  <Progress size="sm" isIndeterminate w="full" colorScheme="brand" />
                  <Text fontSize="sm" color="gray.500">
                    {t('workoutUpload.importing', 'Importing workout...')}
                  </Text>
                </VStack>
              )}
            </VStack>
          )}
        </ModalBody>

        <ModalFooter>
          {step === 'upload' && (
            <Button variant="ghost" onClick={handleClose}>
              {t('common.cancel')}
            </Button>
          )}

          {step === 'preview' && (
            <HStack spacing={3}>
              <Button variant="ghost" onClick={handleReset}>
                {t('workoutUpload.uploadAnother', 'Upload Another')}
              </Button>
              <Button colorScheme="brand" onClick={handleProceedToCustomize}>
                {t('workoutUpload.continue', 'Continue')}
              </Button>
            </HStack>
          )}

          {step === 'customize' && (
            <HStack spacing={3}>
              <Button variant="ghost" onClick={() => setStep('preview')} isDisabled={isLoading}>
                {t('common.back')}
              </Button>
              <Button
                colorScheme="brand"
                onClick={handleImport}
                isLoading={isLoading}
                isDisabled={!customName.trim()}
              >
                {t('workoutUpload.import', 'Import Workout')}
              </Button>
            </HStack>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
