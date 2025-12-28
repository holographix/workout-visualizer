/**
 * ActivityImportModal - Modal for importing completed activities from FIT files
 *
 * Features:
 * - Drag & drop or click to select FIT files (.fit, .fit.gz)
 * - Batch import support (up to 50 files)
 * - Auto-pairing with scheduled workouts
 * - Progress tracking and error handling
 */
import { useState, useCallback, useRef } from 'react';
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
  Box,
  Icon,
  Progress,
  useColorModeValue,
  List,
  ListItem,
  ListIcon,
  Badge,
  Alert,
  AlertIcon,
  AlertDescription,
  useToast,
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { Upload, FileText, CheckCircle, XCircle, Clock, Calendar } from 'lucide-react';
import { useAuthenticatedApi } from '../../../hooks/useAuthenticatedApi';
import { format, parseISO } from 'date-fns';

interface ActivityImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  athleteId: string;
  onImportComplete?: () => void;
}

interface ImportResult {
  file: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  activity?: {
    name: string;
    durationSeconds: number;
    avgPower?: number;
    startTime?: string; // ISO date string
    paired?: boolean;
    pairedWorkoutName?: string;
  };
  error?: string;
}

export function ActivityImportModal({
  isOpen,
  onClose,
  athleteId,
  onImportComplete,
}: ActivityImportModalProps) {
  const { t } = useTranslation();
  const toast = useToast();
  const api = useAuthenticatedApi();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [importResults, setImportResults] = useState<ImportResult[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const dropzoneBg = useColorModeValue('gray.50', 'gray.700');
  const dropzoneHoverBg = useColorModeValue('brand.50', 'brand.900');

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files) return;

    const fitFiles = Array.from(files).filter(file => {
      const name = file.name.toLowerCase();
      return name.endsWith('.fit') || name.endsWith('.fit.gz');
    });

    if (fitFiles.length === 0) {
      toast({
        title: t('activityImport.invalidFiles') || 'Invalid files',
        description: t('activityImport.onlyFitFiles') || 'Only .fit and .fit.gz files are supported',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    if (fitFiles.length > 50) {
      toast({
        title: t('activityImport.tooManyFiles') || 'Too many files',
        description: t('activityImport.maxFilesExceeded') || 'Maximum 50 files per batch',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    setSelectedFiles(fitFiles);
    setImportResults(
      fitFiles.map(file => ({
        file: file.name,
        status: 'pending',
      }))
    );
  }, [toast, t]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setIsUploading(true);

    try {
      if (selectedFiles.length === 1) {
        // Single file upload
        const file = selectedFiles[0];
        setImportResults([{ file: file.name, status: 'uploading' }]);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('athleteId', athleteId);
        formData.append('autoPairWithScheduled', 'true');

        try {
          const result = await api.post<{
            activity: { name: string; durationSeconds: number; avgPower?: number; startTime: string };
            paired: boolean;
            pairedWorkoutName?: string;
          }>('/api/activity-import/upload', formData);

          setImportResults([{
            file: file.name,
            status: 'success',
            activity: {
              name: result.activity.name,
              durationSeconds: result.activity.durationSeconds,
              avgPower: result.activity.avgPower,
              startTime: result.activity.startTime,
              paired: result.paired,
              pairedWorkoutName: result.pairedWorkoutName,
            },
          }]);

          toast({
            title: t('activityImport.importSuccess') || 'Activity imported!',
            description: result.paired
              ? `${t('activityImport.pairedWithWorkout') || 'Paired with'}: ${result.pairedWorkoutName}`
              : t('activityImport.notPaired') || 'Not paired with any workout',
            status: 'success',
            duration: 5000,
          });
        } catch (error: any) {
          const errorMessage = error.data?.message || error.message || t('common.error');

          setImportResults([{
            file: file.name,
            status: 'error',
            error: errorMessage,
          }]);

          toast({
            title: t('activityImport.importFailed') || 'Import failed',
            description: errorMessage,
            status: 'error',
            duration: 5000,
          });
        }
      } else {
        // Batch upload
        const formData = new FormData();
        selectedFiles.forEach(file => {
          formData.append('files', file);
        });
        formData.append('athleteId', athleteId);
        formData.append('autoPairWithScheduled', 'true');

        // Update all to uploading
        setImportResults(prev => prev.map(r => ({ ...r, status: 'uploading' as const })));

        try {
          type BatchResult = {
            activity: { name: string; durationSeconds: number; avgPower?: number; startTime: string };
            paired: boolean;
            pairedWorkoutName?: string;
          };
          const results = await api.post<BatchResult[]>('/api/activity-import/upload-batch', formData);

          // Update with results
          const newResults: ImportResult[] = results.map((result, index: number) => ({
            file: selectedFiles[index].name,
            status: 'success' as const,
            activity: {
              name: result.activity.name,
              durationSeconds: result.activity.durationSeconds,
              avgPower: result.activity.avgPower,
              startTime: result.activity.startTime,
              paired: result.paired,
              pairedWorkoutName: result.pairedWorkoutName,
            },
          }));

          setImportResults(newResults);

          const pairedCount = results.filter((r) => r.paired).length;
          const unpairedCount = results.length - pairedCount;

          toast({
            title: t('activityImport.batchSuccess') || `${results.length} activities imported!`,
            description: pairedCount > 0
              ? `${t('activityImport.pairedCount', { count: pairedCount }) || `${pairedCount} paired with workouts`}${unpairedCount > 0 ? `, ${unpairedCount} not paired` : ''}`
              : t('activityImport.nonePaired') || 'None were paired with scheduled workouts',
            status: 'success',
            duration: 5000,
          });
        } catch (error: any) {
          const errorMessage = error.data?.message || error.message || t('common.error');

          // If batch fails, mark all as error
          setImportResults(prev => prev.map(r => ({
            ...r,
            status: 'error' as const,
            error: errorMessage,
          })));

          toast({
            title: t('activityImport.importFailed') || 'Import failed',
            description: errorMessage,
            status: 'error',
            duration: 5000,
          });
        }
      }

      onImportComplete?.();
    } catch (error: any) {
      const errorMessage = error.data?.message || error.message || t('common.error');

      toast({
        title: t('activityImport.importFailed') || 'Import failed',
        description: errorMessage,
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleReset = () => {
    setSelectedFiles([]);
    setImportResults([]);
  };

  const uploadedCount = importResults.filter(r => r.status === 'success').length;
  const errorCount = importResults.filter(r => r.status === 'error').length;
  const uploadProgress = importResults.length > 0
    ? (uploadedCount + errorCount) / importResults.length * 100
    : 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <HStack spacing={2}>
            <Icon as={Upload} boxSize={5} />
            <Text>{t('activityImport.title') || 'Import Activities'}</Text>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />

        <ModalBody>
          <VStack spacing={6} align="stretch">
            {/* Info Alert */}
            <Alert status="info" borderRadius="md">
              <AlertIcon />
              <AlertDescription fontSize="sm">
                {t('activityImport.info') ||
                  'Upload completed rides from Garmin, Zwift, TrainingPeaks, or other sources. Files will be automatically paired with your scheduled workouts.'}
              </AlertDescription>
            </Alert>

            {/* File Dropzone */}
            {selectedFiles.length === 0 && (
              <Box
                bg={isDragging ? dropzoneHoverBg : dropzoneBg}
                borderWidth="2px"
                borderStyle="dashed"
                borderColor={isDragging ? 'brand.500' : borderColor}
                borderRadius="md"
                p={8}
                textAlign="center"
                cursor="pointer"
                transition="all 0.2s"
                onClick={() => fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                <VStack spacing={3}>
                  <Icon as={Upload} boxSize={12} color={isDragging ? 'brand.500' : 'gray.400'} />
                  <Text fontWeight="medium">
                    {t('activityImport.dropFiles') || 'Drop FIT files here or click to browse'}
                  </Text>
                  <Text fontSize="sm" color="gray.500">
                    {t('activityImport.supportedFormats') || 'Supports .fit and .fit.gz files'}
                  </Text>
                  <Text fontSize="sm" color="gray.500">
                    {t('activityImport.maxFiles') || 'Up to 50 files per batch'}
                  </Text>
                </VStack>
              </Box>
            )}

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".fit,.fit.gz"
              style={{ display: 'none' }}
              onChange={(e) => handleFileSelect(e.target.files)}
            />

            {/* Upload Progress */}
            {isUploading && importResults.length > 1 && (
              <Box>
                <HStack justify="space-between" mb={2}>
                  <Text fontSize="sm" fontWeight="medium">
                    {t('activityImport.uploading') || 'Uploading...'}
                  </Text>
                  <Text fontSize="sm" color="gray.500">
                    {uploadedCount + errorCount} / {importResults.length}
                  </Text>
                </HStack>
                <Progress value={uploadProgress} size="sm" colorScheme="brand" borderRadius="full" />
              </Box>
            )}

            {/* Import Results */}
            {importResults.length > 0 && (
              <Box>
                <Text fontWeight="medium" mb={3}>
                  {t('activityImport.files') || 'Files'} ({importResults.length})
                </Text>
                <List spacing={2} maxH="300px" overflowY="auto">
                  {importResults.map((result, index) => (
                    <ListItem
                      key={index}
                      p={3}
                      bg={bgColor}
                      borderWidth="1px"
                      borderColor={borderColor}
                      borderRadius="md"
                    >
                      <HStack justify="space-between">
                        <HStack spacing={3} flex={1}>
                          <ListIcon
                            as={
                              result.status === 'success'
                                ? CheckCircle
                                : result.status === 'error'
                                ? XCircle
                                : result.status === 'uploading'
                                ? Clock
                                : FileText
                            }
                            color={
                              result.status === 'success'
                                ? 'green.500'
                                : result.status === 'error'
                                ? 'red.500'
                                : 'gray.400'
                            }
                            boxSize={5}
                          />
                          <VStack align="start" spacing={0} flex={1}>
                            <Text fontSize="sm" fontWeight="medium" noOfLines={1}>
                              {result.file}
                            </Text>
                            {result.activity && (
                              <>
                                <HStack spacing={1} fontSize="xs" color="gray.500">
                                  <Icon as={Calendar} boxSize={3} />
                                  <Text>
                                    {result.activity.startTime
                                      ? format(parseISO(result.activity.startTime), 'EEE, MMM d, yyyy • h:mm a')
                                      : t('activityImport.unknownDate') || 'Unknown date'}
                                  </Text>
                                </HStack>
                                <Text fontSize="xs" color="gray.500">
                                  {result.activity.name} •{' '}
                                  {Math.round(result.activity.durationSeconds / 60)}min
                                  {result.activity.avgPower && ` • ${result.activity.avgPower}W avg`}
                                </Text>
                                {result.activity.paired && result.activity.pairedWorkoutName && (
                                  <Text fontSize="xs" color="green.600">
                                    ✓ {t('activityImport.pairedWith') || 'Paired with'}: {result.activity.pairedWorkoutName}
                                  </Text>
                                )}
                                {!result.activity.paired && (
                                  <Text fontSize="xs" color="orange.500">
                                    {t('activityImport.notPairedHint') || 'Not paired - no matching workout found'}
                                  </Text>
                                )}
                              </>
                            )}
                            {result.error && (
                              <Text fontSize="xs" color="red.500">
                                {result.error}
                              </Text>
                            )}
                          </VStack>
                        </HStack>
                        {result.activity?.paired && (
                          <Badge colorScheme="green" fontSize="xs">
                            {t('activityImport.paired') || 'Paired'}
                          </Badge>
                        )}
                        {result.activity && !result.activity.paired && (
                          <Badge colorScheme="orange" fontSize="xs">
                            {t('activityImport.unpaired') || 'Unpaired'}
                          </Badge>
                        )}
                      </HStack>
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
          </VStack>
        </ModalBody>

        <ModalFooter>
          <HStack spacing={3}>
            {selectedFiles.length > 0 && !isUploading && uploadProgress < 100 && (
              <Button variant="ghost" onClick={handleReset}>
                {t('common.cancel') || 'Cancel'}
              </Button>
            )}
            {uploadProgress === 100 && (
              <Button variant="ghost" onClick={handleReset}>
                {t('activityImport.importMore') || 'Import More'}
              </Button>
            )}
            {selectedFiles.length > 0 && uploadProgress < 100 && (
              <Button
                colorScheme="brand"
                onClick={handleUpload}
                isLoading={isUploading}
                loadingText={t('activityImport.uploading') || 'Uploading...'}
              >
                {t('activityImport.upload') || `Upload ${selectedFiles.length} ${selectedFiles.length === 1 ? 'File' : 'Files'}`}
              </Button>
            )}
            {uploadProgress === 100 && (
              <Button colorScheme="brand" onClick={onClose}>
                {t('common.close') || 'Close'}
              </Button>
            )}
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
