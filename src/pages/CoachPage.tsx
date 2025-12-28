import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Box,
  Grid,
  GridItem,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Heading,
  Text,
  Button,
  ButtonGroup,
  IconButton,
  VStack,
  HStack,
  SimpleGrid,
  useColorModeValue,
  useBreakpointValue,
  useDisclosure,
  Spinner,
  Center,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useToast,
  Skeleton,
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Users, Library, Plus, Dumbbell, AlertCircle, LayoutGrid, List, UserPlus, Search, Trash2, Eye, Upload } from 'lucide-react';
import { Header } from '../components/organisms';
import { AthleteCard, AthleteListItem, InviteAthleteModal, WorkoutViewModal, WorkoutImportModal, type Athlete } from '../components/organisms/Coach';
import { useAthletes } from '../hooks';
import { useUser } from '../contexts/UserContext';
import { useWorkoutsAPI, useCoachWorkoutsAPI, deleteWorkout } from '../hooks/useCalendarAPI';
import { useCoachAssessmentStatus } from '../hooks/useAssessments';

// Mock data for development fallback
const mockAthletes: Athlete[] = [
  {
    id: '1',
    name: 'Marco Rossi',
    email: 'marco.rossi@email.com',
    weeklyTSS: 450,
    upcomingWorkouts: 3,
    status: 'active',
  },
  {
    id: '2',
    name: 'Laura Bianchi',
    email: 'laura.bianchi@email.com',
    weeklyTSS: 380,
    upcomingWorkouts: 5,
    status: 'active',
  },
  {
    id: '3',
    name: 'Giuseppe Verdi',
    email: 'giuseppe.verdi@email.com',
    weeklyTSS: 0,
    upcomingWorkouts: 0,
    status: 'new',
  },
  {
    id: '4',
    name: 'Sofia Romano',
    email: 'sofia.romano@email.com',
    weeklyTSS: 520,
    upcomingWorkouts: 4,
    status: 'active',
  },
];

// TODO: Replace with actual auth context
const MOCK_COACH_ID = null; // Set to a UUID to test with real API

export function CoachPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useUser();

  // Fetch athletes from API using current user as coach
  const { athletes: apiAthletes, isLoading, error, refetch } = useAthletes({
    coachId: user?.id || null,
  });

  // Fetch assessment status for all athletes
  const { athletes: assessmentStatusData } = useCoachAssessmentStatus(user?.id);

  // Use API data if available, fallback to mock
  const [athletes, setAthletes] = useState<Athlete[]>(mockAthletes);
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');

  // Merge athlete data with assessment status
  useEffect(() => {
    if (apiAthletes.length > 0) {
      // Create a map of assessment status by athlete ID
      const assessmentMap = new Map(
        assessmentStatusData.map((a) => [a.athleteId, a])
      );

      // Merge assessment status into athlete objects
      const athletesWithStatus = apiAthletes.map((athlete) => {
        const status = assessmentMap.get(athlete.id);
        return {
          ...athlete,
          assessmentStatus: status
            ? {
                hasAssessment: status.hasAssessment,
                isOverdue: status.isOverdue,
                isNewAssessment: status.isNewAssessment,
                daysSinceTest: status.daysSinceTest,
              }
            : undefined,
        };
      });

      setAthletes(athletesWithStatus);
    } else if (!isLoading && !error && user?.id) {
      // API returned empty but no error - coach has no athletes yet
      setAthletes([]);
    }
    // If error or no user ID, keep mock data
  }, [apiAthletes, isLoading, error, user?.id, assessmentStatusData]);

  const [mobileTabIndex, setMobileTabIndex] = useState(0);
  const [libraryTabIndex, setLibraryTabIndex] = useState(0); // 0 = My Workouts, 1 = System Library

  // Fetch coach's own workouts
  const { workouts: coachWorkoutsData, isLoading: isLoadingCoachWorkouts, refetch: refetchCoachWorkouts } = useCoachWorkoutsAPI(user?.id);
  const toast = useToast();

  // Fetch system library workouts
  const { workouts: systemWorkouts, categories: systemCategories, isLoading: isLoadingWorkouts } = useWorkoutsAPI();

  // System library filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  // Filter system workouts by search query and category
  const filteredSystemWorkouts = useMemo(() => {
    return systemWorkouts.filter((workout) => {
      const matchesSearch = searchQuery === '' ||
        workout.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (workout.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
      const matchesCategory = selectedCategory === '' || workout.category.id === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [systemWorkouts, searchQuery, selectedCategory]);

  const isMobile = useBreakpointValue({ base: true, lg: false });
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  // Invite modal state
  const { isOpen: isInviteOpen, onOpen: onInviteOpen, onClose: onInviteClose } = useDisclosure();

  // Import workout modal state
  const { isOpen: isImportOpen, onOpen: onImportOpen, onClose: onImportClose } = useDisclosure();

  // Delete confirmation dialog state
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const [workoutToDelete, setWorkoutToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const cancelRef = useRef<HTMLButtonElement>(null);

  // View workout modal state
  const { isOpen: isViewOpen, onOpen: onViewOpen, onClose: onViewClose } = useDisclosure();
  const [workoutToView, setWorkoutToView] = useState<{
    id: string;
    name: string;
    description?: string | null;
    durationSeconds: number;
    tssPlanned: number | null;
    ifPlanned?: number | null;
    structure?: unknown;
    workoutType?: string;
    category: { name: string };
  } | null>(null);

  const handleViewAthleteCalendar = useCallback((athlete: Athlete) => {
    navigate(`/athlete/${athlete.id}/calendar`);
  }, [navigate]);

  const handleViewAthleteStats = useCallback((athlete: Athlete) => {
    navigate(`/athlete/${athlete.id}/stats`);
  }, [navigate]);

  const handleContactAthlete = useCallback((athlete: Athlete) => {
    window.location.href = `mailto:${athlete.email}`;
  }, []);

  const handleCreateWorkout = useCallback(() => {
    navigate('/workout/new');
  }, [navigate]);

  const handleDeleteClick = useCallback((id: string, name: string) => {
    setWorkoutToDelete({ id, name });
    onDeleteOpen();
  }, [onDeleteOpen]);

  const handleDeleteConfirm = useCallback(async () => {
    if (!workoutToDelete) return;

    setIsDeleting(true);
    try {
      await deleteWorkout(workoutToDelete.id);
      toast({
        title: t('workout.deleted'),
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      refetchCoachWorkouts();
    } catch (error) {
      console.error('Failed to delete workout:', error);
      toast({
        title: t('workout.deleteFailed'),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsDeleting(false);
      onDeleteClose();
      setWorkoutToDelete(null);
    }
  }, [workoutToDelete, toast, t, refetchCoachWorkouts, onDeleteClose]);

  const handleViewWorkout = useCallback((workout: {
    id: string;
    name: string;
    description?: string | null;
    durationSeconds: number;
    tssPlanned: number | null;
    ifPlanned?: number | null;
    structure?: unknown;
    workoutType?: string;
    category: { name: string };
  }) => {
    setWorkoutToView(workout);
    onViewOpen();
  }, [onViewOpen]);

  // Loading state
  if (isLoading && MOCK_COACH_ID) {
    return (
      <Box h="100vh" bg={bgColor} display="flex" flexDirection="column" overflow="hidden">
        <Header />
        <Center flex={1}>
          <VStack spacing={4}>
            <Spinner size="xl" color="brand.500" />
            <Text color="gray.500">{t('common.loading')}</Text>
          </VStack>
        </Center>
      </Box>
    );
  }

  // Error state with retry
  if (error && MOCK_COACH_ID) {
    return (
      <Box h="100vh" bg={bgColor} display="flex" flexDirection="column" overflow="hidden">
        <Header />
        <Center flex={1}>
          <VStack spacing={4}>
            <AlertCircle size={48} color="orange" />
            <Text color="gray.500">{t('common.error')}</Text>
            <Button onClick={refetch}>{t('common.retry')}</Button>
          </VStack>
        </Center>
      </Box>
    );
  }

  // Desktop layout
  if (!isMobile) {
    return (
      <Box h="100vh" bg={bgColor} display="flex" flexDirection="column" overflow="hidden">
        <Header />

        <Box flex={1} overflow="hidden" px={6} py={6}>
          <Grid templateColumns="1fr 350px" gap={6} h="full">
            {/* Main Content - Athletes */}
            <GridItem h="full" overflow="auto">
              <Box
                bg={cardBg}
                borderRadius="xl"
                borderWidth="1px"
                borderColor={borderColor}
                p={6}
              >
                <HStack justify="space-between" mb={6}>
                  <HStack>
                    <Users size={24} />
                    <Heading size="md">{t('coach.myAthletes')}</Heading>
                    <Text color="gray.500" fontSize="sm">
                      ({athletes.length})
                    </Text>
                  </HStack>
                  <HStack spacing={3}>
                    <Button
                      size="sm"
                      colorScheme="brand"
                      leftIcon={<UserPlus size={16} />}
                      onClick={onInviteOpen}
                    >
                      {t('invite.inviteAthlete')}
                    </Button>
                    <ButtonGroup size="sm" isAttached variant="outline">
                    <IconButton
                      aria-label={t('coach.cardView')}
                      icon={<LayoutGrid size={16} />}
                      isActive={viewMode === 'cards'}
                      onClick={() => setViewMode('cards')}
                    />
                    <IconButton
                      aria-label={t('coach.listView')}
                      icon={<List size={16} />}
                      isActive={viewMode === 'list'}
                      onClick={() => setViewMode('list')}
                    />
                  </ButtonGroup>
                  </HStack>
                </HStack>

                {isLoading ? (
                  <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing={4}>
                    {[1, 2, 3].map((i) => (
                      <AthleteCardSkeleton key={i} />
                    ))}
                  </SimpleGrid>
                ) : athletes.length === 0 ? (
                  <Center py={12}>
                    <VStack spacing={4}>
                      <Users size={48} color="gray" />
                      <Text color="gray.500">{t('coach.noAthletes')}</Text>
                    </VStack>
                  </Center>
                ) : viewMode === 'cards' ? (
                  <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing={4}>
                    {athletes.map((athlete) => (
                      <AthleteCard
                        key={athlete.id}
                        athlete={athlete}
                        onViewCalendar={handleViewAthleteCalendar}
                        onViewStats={handleViewAthleteStats}
                        onContact={handleContactAthlete}
                      />
                    ))}
                  </SimpleGrid>
                ) : (
                  <VStack spacing={2} align="stretch">
                    {athletes.map((athlete) => (
                      <AthleteListItem
                        key={athlete.id}
                        athlete={athlete}
                        onViewCalendar={handleViewAthleteCalendar}
                        onViewStats={handleViewAthleteStats}
                        onContact={handleContactAthlete}
                      />
                    ))}
                  </VStack>
                )}
              </Box>
            </GridItem>

            {/* Sidebar - Workout Library with Tabs */}
            <GridItem h="full" overflow="hidden">
              <Box
                bg={cardBg}
                borderRadius="xl"
                borderWidth="1px"
                borderColor={borderColor}
                h="full"
                display="flex"
                flexDirection="column"
              >
                <Tabs
                  index={libraryTabIndex}
                  onChange={setLibraryTabIndex}
                  size="sm"
                  variant="soft-rounded"
                  colorScheme="brand"
                  display="flex"
                  flexDirection="column"
                  flex={1}
                  overflow="hidden"
                >
                  <HStack px={4} pt={4} pb={2} justify="space-between" align="center">
                    <TabList bg="gray.100" _dark={{ bg: 'gray.700' }} p={1} borderRadius="lg" flex={1}>
                      <Tab
                        fontSize="sm"
                        py={2}
                        px={4}
                        borderRadius="md"
                        color="gray.600"
                        _dark={{ color: 'gray.300' }}
                        _selected={{ bg: 'white', shadow: 'sm', color: 'gray.800', _dark: { bg: 'gray.600', color: 'white' } }}
                      >
                        <HStack spacing={2}>
                          <Dumbbell size={14} />
                          <Text>{t('library.myLibrary')}</Text>
                        </HStack>
                      </Tab>
                      <Tab
                        fontSize="sm"
                        py={2}
                        px={4}
                        borderRadius="md"
                        color="gray.600"
                        _dark={{ color: 'gray.300' }}
                        _selected={{ bg: 'white', shadow: 'sm', color: 'gray.800', _dark: { bg: 'gray.600', color: 'white' } }}
                      >
                        <HStack spacing={2}>
                          <Library size={14} />
                          <Text>{t('library.systemLibrary')}</Text>
                        </HStack>
                      </Tab>
                    </TabList>
                    {libraryTabIndex === 0 && (
                      <HStack spacing={2}>
                        <IconButton
                          aria-label={t('workoutImport.import') || 'Import Workout'}
                          icon={<Upload size={16} />}
                          colorScheme="blue"
                          variant="outline"
                          size="sm"
                          onClick={onImportOpen}
                        />
                        <IconButton
                          aria-label={t('coach.createWorkout')}
                          icon={<Plus size={16} />}
                          colorScheme="brand"
                          size="sm"
                          onClick={handleCreateWorkout}
                        />
                      </HStack>
                    )}
                  </HStack>

                  <TabPanels flex={1} overflow="hidden">
                    {/* My Workouts Tab */}
                    <TabPanel p={3} h="full" overflow="auto">
                      {isLoadingCoachWorkouts ? (
                        <VStack spacing={2} align="stretch">
                          {[1, 2, 3].map((i) => (
                            <WorkoutItemSkeleton key={i} />
                          ))}
                        </VStack>
                      ) : coachWorkoutsData.length === 0 ? (
                        <VStack py={8} spacing={4}>
                          <Dumbbell size={48} color="gray" />
                          <Text color="gray.500" textAlign="center" fontSize="sm">
                            {t('coach.noWorkoutsYet')}
                          </Text>
                          <Button
                            size="sm"
                            variant="outline"
                            leftIcon={<Plus size={14} />}
                            onClick={handleCreateWorkout}
                          >
                            {t('coach.createFirstWorkout')}
                          </Button>
                        </VStack>
                      ) : (
                        <VStack spacing={2} align="stretch">
                          {coachWorkoutsData.map((workout) => (
                            <CoachWorkoutItem key={workout.id} workout={workout} onEdit={navigate} onDelete={handleDeleteClick} onView={handleViewWorkout} />
                          ))}
                        </VStack>
                      )}
                    </TabPanel>

                    {/* System Library Tab */}
                    <TabPanel p={0} h="full" display="flex" flexDirection="column" overflow="hidden">
                      {/* Filters */}
                      <VStack spacing={2} p={3} pb={2} flexShrink={0}>
                        <InputGroup size="sm">
                          <InputLeftElement pointerEvents="none">
                            <Search size={14} color="gray" />
                          </InputLeftElement>
                          <Input
                            placeholder={t('library.searchPlaceholder')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            borderRadius="md"
                          />
                        </InputGroup>
                        <Select
                          size="sm"
                          value={selectedCategory}
                          onChange={(e) => setSelectedCategory(e.target.value)}
                          borderRadius="md"
                        >
                          <option value="">{t('library.allCategories')}</option>
                          {systemCategories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.name}
                            </option>
                          ))}
                        </Select>
                      </VStack>

                      {/* Results */}
                      <Box flex={1} overflow="auto" px={3} pb={3}>
                        {isLoadingWorkouts ? (
                          <Center py={8}>
                            <Spinner size="lg" color="brand.500" />
                          </Center>
                        ) : filteredSystemWorkouts.length === 0 ? (
                          <VStack py={8} spacing={4}>
                            <Library size={48} color="gray" />
                            <Text color="gray.500" textAlign="center" fontSize="sm">
                              {t('library.noWorkoutsFound')}
                            </Text>
                          </VStack>
                        ) : (
                          <VStack spacing={2} align="stretch">
                            <Text fontSize="xs" color="gray.500" px={1}>
                              {t('library.workoutsCount', { count: filteredSystemWorkouts.length })}
                            </Text>
                            {filteredSystemWorkouts.map((workout) => (
                              <SystemWorkoutItem
                                key={workout.id}
                                workout={workout}
                                onView={handleViewWorkout}
                              />
                            ))}
                          </VStack>
                        )}
                      </Box>
                    </TabPanel>
                  </TabPanels>
                </Tabs>
              </Box>
            </GridItem>
          </Grid>
        </Box>

        {/* Invite Athlete Modal */}
        {user?.id && (
          <InviteAthleteModal
            isOpen={isInviteOpen}
            onClose={onInviteClose}
            coachId={user.id}
            onInviteSent={refetch}
          />
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog
          isOpen={isDeleteOpen}
          leastDestructiveRef={cancelRef}
          onClose={onDeleteClose}
        >
          <AlertDialogOverlay>
            <AlertDialogContent>
              <AlertDialogHeader fontSize="lg" fontWeight="bold">
                {t('workout.deleteTitle')}
              </AlertDialogHeader>

              <AlertDialogBody>
                {t('workout.deleteConfirmation', { name: workoutToDelete?.name })}
              </AlertDialogBody>

              <AlertDialogFooter>
                <Button ref={cancelRef} onClick={onDeleteClose}>
                  {t('common.cancel')}
                </Button>
                <Button colorScheme="red" onClick={handleDeleteConfirm} ml={3} isLoading={isDeleting}>
                  {t('common.delete')}
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialogOverlay>
        </AlertDialog>

        {/* View Workout Modal */}
        <WorkoutViewModal
          isOpen={isViewOpen}
          onClose={onViewClose}
          workout={workoutToView}
        />

        {/* Import Workout Modal */}
        {user?.id && (
          <WorkoutImportModal
            isOpen={isImportOpen}
            onClose={onImportClose}
            coachId={user.id}
            categories={systemCategories}
            onImportSuccess={refetchCoachWorkouts}
          />
        )}
      </Box>
    );
  }

  // Mobile layout with tabs
  const tabBg = useColorModeValue('white', 'gray.800');

  return (
    <Box h="100vh" bg={bgColor} display="flex" flexDirection="column" overflow="hidden">
      <Header />

      <Tabs
        index={mobileTabIndex}
        onChange={setMobileTabIndex}
        isFitted
        variant="enclosed"
        colorScheme="brand"
        display="flex"
        flexDirection="column"
        flex={1}
        overflow="hidden"
      >
        <TabList px={2} pt={2} bg={tabBg} flexShrink={0}>
          <Tab gap={2}>
            <Users size={16} />
            {t('coach.athletes')}
          </Tab>
          <Tab gap={2}>
            <Library size={16} />
            {t('coach.workouts')}
          </Tab>
          <IconButton
            aria-label={t('invite.inviteAthlete')}
            icon={<UserPlus size={18} />}
            colorScheme="brand"
            size="sm"
            onClick={onInviteOpen}
            ml={2}
          />
        </TabList>

        <TabPanels flex={1} overflow="hidden">
          {/* Athletes Tab */}
          <TabPanel p={2} h="full" overflow="auto">
            {isLoading ? (
              <VStack spacing={3} align="stretch">
                {[1, 2, 3].map((i) => (
                  <AthleteCardSkeleton key={i} />
                ))}
              </VStack>
            ) : athletes.length === 0 ? (
              <Center py={12}>
                <VStack spacing={4}>
                  <Users size={48} color="gray" />
                  <Text color="gray.500">{t('coach.noAthletes')}</Text>
                </VStack>
              </Center>
            ) : (
              <VStack spacing={3} align="stretch">
                {athletes.map((athlete) => (
                  <AthleteCard
                    key={athlete.id}
                    athlete={athlete}
                    onViewCalendar={handleViewAthleteCalendar}
                    onViewStats={handleViewAthleteStats}
                    onContact={handleContactAthlete}
                  />
                ))}
              </VStack>
            )}
          </TabPanel>

          {/* Workouts Tab - with nested tabs for My Workouts and System Library */}
          <TabPanel p={0} h="full" overflow="hidden">
            <Tabs
              index={libraryTabIndex}
              onChange={setLibraryTabIndex}
              size="sm"
              variant="soft-rounded"
              colorScheme="brand"
              display="flex"
              flexDirection="column"
              h="full"
            >
              <HStack px={2} py={2} justify="space-between" align="center">
                <TabList>
                  <Tab
                    fontSize="xs"
                    py={1}
                    px={2}
                    color="gray.600"
                    _dark={{ color: 'gray.300' }}
                    _selected={{ color: 'brand.600', _dark: { color: 'brand.200' } }}
                  >
                    <HStack spacing={1}>
                      <Dumbbell size={12} />
                      <Text>{t('library.myLibrary')}</Text>
                    </HStack>
                  </Tab>
                  <Tab
                    fontSize="xs"
                    py={1}
                    px={2}
                    color="gray.600"
                    _dark={{ color: 'gray.300' }}
                    _selected={{ color: 'brand.600', _dark: { color: 'brand.200' } }}
                  >
                    <HStack spacing={1}>
                      <Library size={12} />
                      <Text>{t('library.systemLibrary')}</Text>
                    </HStack>
                  </Tab>
                </TabList>
                {libraryTabIndex === 0 && (
                  <HStack spacing={2}>
                    <IconButton
                      aria-label={t('workoutImport.import') || 'Import Workout'}
                      icon={<Upload size={16} />}
                      colorScheme="blue"
                      variant="outline"
                      size="sm"
                      onClick={onImportOpen}
                    />
                    <IconButton
                      aria-label={t('coach.createWorkout')}
                      icon={<Plus size={16} />}
                      colorScheme="brand"
                      size="sm"
                      onClick={handleCreateWorkout}
                    />
                  </HStack>
                )}
              </HStack>

              <TabPanels flex={1} overflow="auto">
                {/* My Workouts Tab */}
                <TabPanel p={2}>
                  {isLoadingCoachWorkouts ? (
                    <VStack spacing={2} align="stretch">
                      {[1, 2, 3].map((i) => (
                        <WorkoutItemSkeleton key={i} />
                      ))}
                    </VStack>
                  ) : coachWorkoutsData.length === 0 ? (
                    <VStack py={8} spacing={4}>
                      <Dumbbell size={48} color="gray" />
                      <Text color="gray.500" textAlign="center">
                        {t('coach.noWorkoutsYet')}
                      </Text>
                      <Button
                        size="sm"
                        variant="outline"
                        leftIcon={<Plus size={14} />}
                        onClick={handleCreateWorkout}
                      >
                        {t('coach.createFirstWorkout')}
                      </Button>
                    </VStack>
                  ) : (
                    <VStack spacing={2} align="stretch">
                      {coachWorkoutsData.map((workout) => (
                        <CoachWorkoutItem key={workout.id} workout={workout} onEdit={navigate} onDelete={handleDeleteClick} onView={handleViewWorkout} />
                      ))}
                    </VStack>
                  )}
                </TabPanel>

                {/* System Library Tab */}
                <TabPanel p={2}>
                  {/* Filters */}
                  <VStack spacing={2} mb={3}>
                    <InputGroup size="sm">
                      <InputLeftElement pointerEvents="none">
                        <Search size={14} color="gray" />
                      </InputLeftElement>
                      <Input
                        placeholder={t('library.searchPlaceholder')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        borderRadius="md"
                      />
                    </InputGroup>
                    <Select
                      size="sm"
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      borderRadius="md"
                    >
                      <option value="">{t('library.allCategories')}</option>
                      {systemCategories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </Select>
                  </VStack>

                  {/* Results */}
                  {isLoadingWorkouts ? (
                    <Center py={8}>
                      <Spinner size="lg" color="brand.500" />
                    </Center>
                  ) : filteredSystemWorkouts.length === 0 ? (
                    <VStack py={8} spacing={4}>
                      <Library size={48} color="gray" />
                      <Text color="gray.500" textAlign="center">
                        {t('library.noWorkoutsFound')}
                      </Text>
                    </VStack>
                  ) : (
                    <VStack spacing={2} align="stretch">
                      <Text fontSize="xs" color="gray.500">
                        {t('library.workoutsCount', { count: filteredSystemWorkouts.length })}
                      </Text>
                      {filteredSystemWorkouts.map((workout) => (
                        <SystemWorkoutItem
                          key={workout.id}
                          workout={workout}
                          onView={handleViewWorkout}
                        />
                      ))}
                    </VStack>
                  )}
                </TabPanel>
              </TabPanels>
            </Tabs>
          </TabPanel>
        </TabPanels>
      </Tabs>

      {/* Invite Athlete Modal */}
      {user?.id && (
        <InviteAthleteModal
          isOpen={isInviteOpen}
          onClose={onInviteClose}
          coachId={user.id}
          onInviteSent={refetch}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        isOpen={isDeleteOpen}
        leastDestructiveRef={cancelRef}
        onClose={onDeleteClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              {t('workout.deleteTitle')}
            </AlertDialogHeader>

            <AlertDialogBody>
              {t('workout.deleteConfirmation', { name: workoutToDelete?.name })}
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onDeleteClose}>
                {t('common.cancel')}
              </Button>
              <Button colorScheme="red" onClick={handleDeleteConfirm} ml={3} isLoading={isDeleting}>
                {t('common.delete')}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>

      {/* View Workout Modal */}
      <WorkoutViewModal
        isOpen={isViewOpen}
        onClose={onViewClose}
        workout={workoutToView}
      />

      {/* Import Workout Modal */}
      {user?.id && (
        <WorkoutImportModal
          isOpen={isImportOpen}
          onClose={onImportClose}
          coachId={user.id}
          categories={systemCategories}
          onImportSuccess={refetchCoachWorkouts}
        />
      )}
    </Box>
  );
}

interface CoachWorkoutItemProps {
  workout: {
    id: string;
    name: string;
    description?: string | null;
    durationSeconds: number;
    tssPlanned: number | null;
    ifPlanned?: number | null;
    structure?: unknown;
    workoutType?: string;
    category: {
      name: string;
    };
  };
  onEdit: (path: string) => void;
  onDelete: (id: string, name: string) => void;
  onView: (workout: CoachWorkoutItemProps['workout']) => void;
}

function CoachWorkoutItem({ workout, onEdit, onDelete, onView }: CoachWorkoutItemProps) {
  const { t } = useTranslation();
  const defaultBg = useColorModeValue('gray.50', 'gray.700');
  const hoverBg = useColorModeValue('gray.100', 'gray.600');
  const categoryColor = useColorModeValue('brand.600', 'brand.300');

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(workout.id, workout.name);
  };

  const handleView = (e: React.MouseEvent) => {
    e.stopPropagation();
    onView(workout);
  };

  return (
    <Box
      p={3}
      bg={defaultBg}
      borderRadius="md"
      cursor="pointer"
      _hover={{ bg: hoverBg }}
      onClick={() => onEdit(`/workout/${workout.id}`)}
      position="relative"
      role="group"
    >
      <HStack justify="space-between" align="start">
        <Box flex={1}>
          <Text fontWeight="semibold" fontSize="sm" noOfLines={1}>
            {workout.name}
          </Text>
          <HStack fontSize="xs" color="gray.500" mt={1} justify="space-between">
            <HStack>
              <Text>
                {Math.round(workout.durationSeconds / 60)}m
              </Text>
              <Text>-</Text>
              <Text>{workout.tssPlanned || 0} TSS</Text>
            </HStack>
            <Text color={categoryColor} fontWeight="medium">
              {workout.category.name}
            </Text>
          </HStack>
        </Box>
        <HStack spacing={0} opacity={0} _groupHover={{ opacity: 1 }}>
          <IconButton
            aria-label={t('library.viewWorkout')}
            icon={<Eye size={14} />}
            size="xs"
            variant="ghost"
            onClick={handleView}
          />
          <IconButton
            aria-label={t('common.delete')}
            icon={<Trash2 size={14} />}
            size="xs"
            variant="ghost"
            colorScheme="red"
            onClick={handleDelete}
          />
        </HStack>
      </HStack>
    </Box>
  );
}

interface SystemWorkoutItemProps {
  workout: {
    id: string;
    name: string;
    description?: string | null;
    durationSeconds: number;
    tssPlanned: number | null;
    ifPlanned?: number | null;
    structure?: unknown;
    workoutType?: string;
    category: {
      name: string;
    };
  };
  onView: (workout: SystemWorkoutItemProps['workout']) => void;
}

function SystemWorkoutItem({ workout, onView }: SystemWorkoutItemProps) {
  const { t } = useTranslation();
  const defaultBg = useColorModeValue('gray.50', 'gray.700');
  const hoverBg = useColorModeValue('gray.100', 'gray.600');
  const categoryColor = useColorModeValue('brand.600', 'brand.300');

  return (
    <Box
      p={3}
      bg={defaultBg}
      borderRadius="md"
      cursor="pointer"
      _hover={{ bg: hoverBg }}
      onClick={() => onView(workout)}
      role="group"
    >
      <HStack justify="space-between" align="start">
        <Box flex={1}>
          <Text fontWeight="semibold" fontSize="sm" noOfLines={1}>
            {workout.name}
          </Text>
          <HStack fontSize="xs" color="gray.500" mt={1} justify="space-between">
            <HStack>
              <Text>
                {Math.round(workout.durationSeconds / 60)}m
              </Text>
              <Text>-</Text>
              <Text>{workout.tssPlanned || 0} TSS</Text>
            </HStack>
            <Text color={categoryColor} fontWeight="medium">
              {workout.category.name}
            </Text>
          </HStack>
        </Box>
        <IconButton
          aria-label={t('library.viewWorkout')}
          icon={<Eye size={14} />}
          size="xs"
          variant="ghost"
          opacity={0}
          _groupHover={{ opacity: 1 }}
          onClick={(e) => {
            e.stopPropagation();
            onView(workout);
          }}
        />
      </HStack>
    </Box>
  );
}

// Skeleton for workout item
function WorkoutItemSkeleton() {
  const defaultBg = useColorModeValue('gray.50', 'gray.700');

  return (
    <Box p={3} bg={defaultBg} borderRadius="md">
      <Skeleton height="16px" width="70%" mb={2} />
      <HStack justify="space-between">
        <Skeleton height="12px" width="80px" />
        <Skeleton height="12px" width="60px" />
      </HStack>
    </Box>
  );
}

// Skeleton for athlete card
function AthleteCardSkeleton() {
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  return (
    <Box
      bg={cardBg}
      borderRadius="lg"
      borderWidth="1px"
      borderColor={borderColor}
      p={4}
    >
      <HStack spacing={3} mb={3}>
        <Skeleton borderRadius="full" boxSize="48px" />
        <VStack align="start" spacing={1} flex={1}>
          <Skeleton height="16px" width="120px" />
          <Skeleton height="12px" width="160px" />
        </VStack>
      </HStack>
      <HStack justify="space-between" mb={3}>
        <VStack align="start" spacing={1}>
          <Skeleton height="10px" width="60px" />
          <Skeleton height="16px" width="40px" />
        </VStack>
        <VStack align="start" spacing={1}>
          <Skeleton height="10px" width="60px" />
          <Skeleton height="16px" width="40px" />
        </VStack>
      </HStack>
      <HStack spacing={2}>
        <Skeleton height="32px" flex={1} borderRadius="md" />
        <Skeleton height="32px" flex={1} borderRadius="md" />
        <Skeleton height="32px" width="32px" borderRadius="md" />
      </HStack>
    </Box>
  );
}
