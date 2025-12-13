/**
 * CategoryManagementModal - Full CRUD modal for managing workout categories
 *
 * Allows coaches to:
 * - View all their categories with workout counts
 * - Create new categories
 * - Edit existing categories (name, description)
 * - Delete empty categories
 * - Reorder categories via drag and drop
 *
 * Global categories (coachId = null) are read-only and shown separately.
 *
 * @module components/organisms/Coach
 */
import { useState, useCallback, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Button,
  VStack,
  HStack,
  Text,
  Input,
  Textarea,
  IconButton,
  Box,
  Flex,
  Badge,
  Divider,
  Alert,
  AlertIcon,
  AlertDescription,
  Spinner,
  useColorModeValue,
  useToast,
  FormControl,
  FormLabel,
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import {
  Folder,
  FolderPlus,
  Pencil,
  Trash2,
  GripVertical,
  Check,
  X,
  Globe,
} from 'lucide-react';
import { useAuthenticatedApi } from '../../../hooks/useAuthenticatedApi';

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  sortOrder: number;
  coachId?: string | null;
  _count?: {
    workouts: number;
  };
}

interface CategoryManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  coachId: string;
  onCategoriesChange?: () => void;
}

export function CategoryManagementModal({
  isOpen,
  onClose,
  coachId,
  onCategoriesChange,
}: CategoryManagementModalProps) {
  const { t } = useTranslation();
  const toast = useToast();
  const api = useAuthenticatedApi();

  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create form state
  const [isCreating, setIsCreating] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');

  // Colors
  const headerBg = useColorModeValue('gray.50', 'gray.800');
  const categoryBg = useColorModeValue('gray.50', 'gray.700');
  const globalBg = useColorModeValue('blue.50', 'blue.900');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.get<Category[]>('/api/categories', {
        params: { coachId },
      });
      setCategories(data);
    } catch {
      setError(t('common.error'));
    } finally {
      setIsLoading(false);
    }
  }, [api, coachId, t]);

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen, fetchCategories]);

  // Create category
  const handleCreate = useCallback(async () => {
    if (!newCategoryName.trim()) return;

    setIsSubmitting(true);
    try {
      await api.post('/api/categories', {
        name: newCategoryName.trim(),
        description: newCategoryDescription.trim() || undefined,
        coachId,
      });

      setNewCategoryName('');
      setNewCategoryDescription('');
      setIsCreating(false);
      fetchCategories();
      onCategoriesChange?.();

      toast({
        title: t('categories.created'),
        status: 'success',
        duration: 2000,
      });
    } catch {
      toast({
        title: t('common.error'),
        status: 'error',
        duration: 2000,
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [api, newCategoryName, newCategoryDescription, coachId, fetchCategories, onCategoriesChange, toast, t]);

  // Start editing
  const startEdit = useCallback((category: Category) => {
    setEditingId(category.id);
    setEditName(category.name);
    setEditDescription(category.description || '');
  }, []);

  // Cancel editing
  const cancelEdit = useCallback(() => {
    setEditingId(null);
    setEditName('');
    setEditDescription('');
  }, []);

  // Save edit
  const handleSaveEdit = useCallback(async () => {
    if (!editingId || !editName.trim()) return;

    setIsSubmitting(true);
    try {
      await api.put(`/api/categories/${editingId}`, {
        name: editName.trim(),
        description: editDescription.trim() || undefined,
      }, {
        params: { coachId },
      });

      setEditingId(null);
      fetchCategories();
      onCategoriesChange?.();

      toast({
        title: t('categories.updated'),
        status: 'success',
        duration: 2000,
      });
    } catch {
      toast({
        title: t('common.error'),
        status: 'error',
        duration: 2000,
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [api, editingId, editName, editDescription, coachId, fetchCategories, onCategoriesChange, toast, t]);

  // Delete category
  const handleDelete = useCallback(async (category: Category) => {
    if (category._count?.workouts && category._count.workouts > 0) {
      toast({
        title: t('categories.cannotDelete'),
        description: t('categories.hasWorkouts', { count: category._count.workouts }),
        status: 'warning',
        duration: 4000,
      });
      return;
    }

    try {
      await api.delete(`/api/categories/${category.id}`, {
        params: { coachId },
      });

      fetchCategories();
      onCategoriesChange?.();

      toast({
        title: t('categories.deleted'),
        status: 'success',
        duration: 2000,
      });
    } catch {
      toast({
        title: t('common.error'),
        status: 'error',
        duration: 2000,
      });
    }
  }, [api, coachId, fetchCategories, onCategoriesChange, toast, t]);

  // Separate global and coach categories
  const globalCategories = categories.filter((c) => !c.coachId);
  const coachCategories = categories.filter((c) => c.coachId === coachId);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" scrollBehavior="inside">
      <ModalOverlay backdropFilter="blur(4px)" />
      <ModalContent maxH="80vh">
        <ModalHeader bg={headerBg} borderTopRadius="md" display="flex" alignItems="center" gap={2}>
          <Folder size={20} />
          {t('categories.manage')}
        </ModalHeader>
        <ModalCloseButton />

        <ModalBody py={4}>
          {isLoading ? (
            <Flex justify="center" py={8}>
              <Spinner />
            </Flex>
          ) : error ? (
            <Alert status="error" borderRadius="md">
              <AlertIcon />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : (
            <VStack spacing={4} align="stretch">
              {/* Create new category */}
              {isCreating ? (
                <Box
                  p={4}
                  borderWidth="1px"
                  borderColor="brand.500"
                  borderRadius="md"
                  bg={categoryBg}
                >
                  <VStack spacing={3} align="stretch">
                    <FormControl>
                      <FormLabel fontSize="sm">{t('categories.name')}</FormLabel>
                      <Input
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder={t('builder.categoryNamePlaceholder')}
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && newCategoryName.trim()) {
                            handleCreate();
                          }
                          if (e.key === 'Escape') {
                            setIsCreating(false);
                            setNewCategoryName('');
                            setNewCategoryDescription('');
                          }
                        }}
                      />
                    </FormControl>
                    <FormControl>
                      <FormLabel fontSize="sm">{t('categories.description')}</FormLabel>
                      <Textarea
                        value={newCategoryDescription}
                        onChange={(e) => setNewCategoryDescription(e.target.value)}
                        placeholder={t('categories.descriptionPlaceholder')}
                        rows={2}
                        resize="none"
                      />
                    </FormControl>
                    <HStack justify="flex-end" spacing={2}>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setIsCreating(false);
                          setNewCategoryName('');
                          setNewCategoryDescription('');
                        }}
                      >
                        {t('common.cancel')}
                      </Button>
                      <Button
                        size="sm"
                        colorScheme="brand"
                        onClick={handleCreate}
                        isLoading={isSubmitting}
                        isDisabled={!newCategoryName.trim()}
                      >
                        {t('builder.createCategory')}
                      </Button>
                    </HStack>
                  </VStack>
                </Box>
              ) : (
                <Button
                  leftIcon={<FolderPlus size={16} />}
                  variant="outline"
                  colorScheme="brand"
                  onClick={() => setIsCreating(true)}
                  w="full"
                >
                  {t('categories.createNew')}
                </Button>
              )}

              {/* Coach categories */}
              {coachCategories.length > 0 && (
                <VStack spacing={2} align="stretch">
                  <Text fontSize="sm" fontWeight="medium" color="gray.500">
                    {t('categories.myCategories')}
                  </Text>
                  {coachCategories.map((category) => (
                    <CategoryItem
                      key={category.id}
                      category={category}
                      isEditing={editingId === category.id}
                      editName={editName}
                      editDescription={editDescription}
                      onEditNameChange={setEditName}
                      onEditDescriptionChange={setEditDescription}
                      onStartEdit={() => startEdit(category)}
                      onCancelEdit={cancelEdit}
                      onSaveEdit={handleSaveEdit}
                      onDelete={() => handleDelete(category)}
                      isSubmitting={isSubmitting}
                      categoryBg={categoryBg}
                      borderColor={borderColor}
                      t={t}
                    />
                  ))}
                </VStack>
              )}

              {/* Global categories */}
              {globalCategories.length > 0 && (
                <>
                  <Divider />
                  <VStack spacing={2} align="stretch">
                    <HStack>
                      <Globe size={14} />
                      <Text fontSize="sm" fontWeight="medium" color="gray.500">
                        {t('categories.global')}
                      </Text>
                    </HStack>
                    {globalCategories.map((category) => (
                      <Box
                        key={category.id}
                        p={3}
                        borderWidth="1px"
                        borderColor={borderColor}
                        borderRadius="md"
                        bg={globalBg}
                      >
                        <Flex justify="space-between" align="center">
                          <HStack spacing={3}>
                            <Box as={Folder} boxSize={4} color="blue.500" />
                            <VStack align="start" spacing={0}>
                              <Text fontWeight="medium">{category.name}</Text>
                              {category.description && (
                                <Text fontSize="xs" color="gray.500" noOfLines={1}>
                                  {category.description}
                                </Text>
                              )}
                            </VStack>
                          </HStack>
                          <Badge colorScheme="gray" fontSize="xs">
                            {category._count?.workouts || 0} {t('categories.workouts')}
                          </Badge>
                        </Flex>
                      </Box>
                    ))}
                  </VStack>
                </>
              )}

              {coachCategories.length === 0 && !isCreating && (
                <Text textAlign="center" color="gray.500" py={4}>
                  {t('categories.noCustomCategories')}
                </Text>
              )}
            </VStack>
          )}
        </ModalBody>

        <ModalFooter>
          <Button onClick={onClose}>{t('common.close')}</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

interface CategoryItemProps {
  category: Category;
  isEditing: boolean;
  editName: string;
  editDescription: string;
  onEditNameChange: (value: string) => void;
  onEditDescriptionChange: (value: string) => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onDelete: () => void;
  isSubmitting: boolean;
  categoryBg: string;
  borderColor: string;
  t: (key: string, options?: Record<string, unknown>) => string;
}

function CategoryItem({
  category,
  isEditing,
  editName,
  editDescription,
  onEditNameChange,
  onEditDescriptionChange,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onDelete,
  isSubmitting,
  categoryBg,
  borderColor,
  t,
}: CategoryItemProps) {
  const hasWorkouts = (category._count?.workouts || 0) > 0;

  if (isEditing) {
    return (
      <Box
        p={3}
        borderWidth="1px"
        borderColor="brand.500"
        borderRadius="md"
        bg={categoryBg}
      >
        <VStack spacing={3} align="stretch">
          <Input
            value={editName}
            onChange={(e) => onEditNameChange(e.target.value)}
            placeholder={t('categories.name')}
            size="sm"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter' && editName.trim()) {
                onSaveEdit();
              }
              if (e.key === 'Escape') {
                onCancelEdit();
              }
            }}
          />
          <Textarea
            value={editDescription}
            onChange={(e) => onEditDescriptionChange(e.target.value)}
            placeholder={t('categories.descriptionPlaceholder')}
            size="sm"
            rows={2}
            resize="none"
          />
          <HStack justify="flex-end" spacing={2}>
            <IconButton
              aria-label={t('common.cancel')}
              icon={<X size={16} />}
              size="sm"
              variant="ghost"
              onClick={onCancelEdit}
            />
            <IconButton
              aria-label={t('common.save')}
              icon={<Check size={16} />}
              size="sm"
              colorScheme="brand"
              onClick={onSaveEdit}
              isLoading={isSubmitting}
              isDisabled={!editName.trim()}
            />
          </HStack>
        </VStack>
      </Box>
    );
  }

  return (
    <Box
      p={3}
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="md"
      bg={categoryBg}
      _hover={{ borderColor: 'brand.300' }}
      transition="border-color 0.2s"
    >
      <Flex justify="space-between" align="center">
        <HStack spacing={3}>
          <Box cursor="grab" color="gray.400">
            <GripVertical size={16} />
          </Box>
          <Box as={Folder} boxSize={4} color="purple.500" />
          <VStack align="start" spacing={0}>
            <Text fontWeight="medium">{category.name}</Text>
            {category.description && (
              <Text fontSize="xs" color="gray.500" noOfLines={1}>
                {category.description}
              </Text>
            )}
          </VStack>
        </HStack>

        <HStack spacing={2}>
          <Badge colorScheme={hasWorkouts ? 'purple' : 'gray'} fontSize="xs">
            {category._count?.workouts || 0} {t('categories.workouts')}
          </Badge>
          <IconButton
            aria-label={t('common.edit')}
            icon={<Pencil size={14} />}
            size="xs"
            variant="ghost"
            onClick={onStartEdit}
          />
          <IconButton
            aria-label={t('common.delete')}
            icon={<Trash2 size={14} />}
            size="xs"
            variant="ghost"
            colorScheme="red"
            onClick={onDelete}
            isDisabled={hasWorkouts}
            title={hasWorkouts ? t('categories.cannotDeleteHasWorkouts') : undefined}
          />
        </HStack>
      </Flex>
    </Box>
  );
}
