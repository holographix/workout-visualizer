import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Container,
  Heading,
  Text,
  SimpleGrid,
  VStack,
  HStack,
  Button,
  ButtonGroup,
  Icon,
  IconButton,
  useColorMode,
  useColorModeValue,
  useToast,
  Spinner,
  Center,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  useBreakpointValue,
  Flex,
  Tooltip,
} from '@chakra-ui/react';
import { Save, Settings, Sun, Moon, Monitor, Palette, RefreshCw, Globe, Target, Calendar, User, Zap } from 'lucide-react';
import { supportedLanguages } from '../i18n';

// Key for storing color mode preference (light/dark/system)
const COLOR_MODE_PREFERENCE_KEY = 'ridepro-color-mode-preference';
type ColorModePreference = 'light' | 'dark' | 'system';

import { Header } from '../components/organisms';
import { WeeklyAvailabilityEditor, GoalEditor, UnavailableDatesEditor, AvailabilityNotesEditor } from '../components/organisms/Availability';
import { ProfileSettings } from '../components/organisms/Settings';
import { ZonesEditor } from '../components/organisms/Zones';
import type { WeeklyAvailability, Goal, UnavailableDate } from '../types/availability';
import { createDefaultAvailability } from '../types/availability';
import { useUser } from '../contexts/UserContext';

// Show availability tab only for athletes (users with coach relationships)
// Coaches don't need availability settings as they're for athletes
import { api } from '../services/api';

// API types
interface ApiAvailability {
  id: string;
  dayIndex: number;
  available: boolean;
  timeSlots: string[];
  maxHours: number | null;
  notes: string | null;
}

interface ApiGoal {
  id: string;
  name: string;
  eventDate: string | null;
  priority: 'A' | 'B' | 'C';
  eventType: string | null;
  targetDuration: string | null;
  notes: string | null;
}

interface ApiUnavailableDate {
  id: string;
  date: string;
  reason: string | null;
}

export function AvailabilityPage() {
  const { t, i18n } = useTranslation();
  const { user, isCoach } = useUser();
  const [availability, setAvailability] = useState<WeeklyAvailability>(createDefaultAvailability());
  const [goals, setGoals] = useState<Goal[]>([]);
  const [originalGoalIds, setOriginalGoalIds] = useState<Set<string>>(new Set());
  const [unavailableDates, setUnavailableDates] = useState<UnavailableDate[]>([]);
  const [originalUnavailableDateIds, setOriginalUnavailableDateIds] = useState<Set<string>>(new Set());
  const originalUnavailableDatesRef = useRef<UnavailableDate[]>([]);
  const [availabilityNotes, setAvailabilityNotes] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const toast = useToast();
  const { setColorMode } = useColorMode();

  const handleLanguageChange = (langCode: string) => {
    i18n.changeLanguage(langCode);
  };

  // Track user's preference (light/dark/system) separately from resolved colorMode
  const [colorModePreference, setColorModePreference] = useState<ColorModePreference>(() => {
    const stored = localStorage.getItem(COLOR_MODE_PREFERENCE_KEY);
    return (stored as ColorModePreference) || 'system';
  });

  // Handle color mode changes with system preference support
  const handleColorModeChange = (preference: ColorModePreference) => {
    setColorModePreference(preference);
    localStorage.setItem(COLOR_MODE_PREFERENCE_KEY, preference);

    if (preference === 'system') {
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setColorMode(systemPrefersDark ? 'dark' : 'light');
    } else {
      setColorMode(preference);
    }
  };

  // Listen to system color scheme changes when in 'system' mode
  useEffect(() => {
    if (colorModePreference !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setColorMode(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [colorModePreference, setColorMode]);

  // Load availability and goals from API
  const loadData = useCallback(async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const [availabilityData, goalsData, unavailableDatesData, notesData] = await Promise.all([
        api.get<ApiAvailability[]>(`/api/availability/${user.id}`).catch(() => []),
        api.get<ApiGoal[]>(`/api/goals/athlete/${user.id}`).catch(() => []),
        api.get<ApiUnavailableDate[]>(`/api/availability/${user.id}/unavailable-dates`).catch(() => []),
        api.get<{ notes: string | null }>(`/api/availability/${user.id}/notes`).catch(() => ({ notes: null })),
      ]);

      // Convert API availability to frontend format
      if (availabilityData.length > 0) {
        const newAvailability = createDefaultAvailability();
        let totalHours = 0;

        availabilityData.forEach((apiDay) => {
          const day = newAvailability.days[apiDay.dayIndex];
          if (day) {
            day.isAvailable = apiDay.available;
            day.maxHours = apiDay.maxHours ?? day.maxHours;
            if (apiDay.available) {
              totalHours += day.maxHours;
            }
          }
        });

        newAvailability.totalWeeklyHours = totalHours;
        setAvailability(newAvailability);
      }

      // Convert API goals to frontend format
      if (goalsData.length > 0) {
        const convertedGoals: Goal[] = goalsData.map((apiGoal) => ({
          id: apiGoal.id,
          name: apiGoal.name,
          date: apiGoal.eventDate ? new Date(apiGoal.eventDate) : new Date(),
          type: apiGoal.priority,
          eventType: apiGoal.eventType || undefined,
          targetDuration: apiGoal.targetDuration ? parseInt(apiGoal.targetDuration, 10) : undefined,
          description: apiGoal.notes || undefined,
        }));
        setGoals(convertedGoals);
        // Track original goal IDs to detect deletions on save
        setOriginalGoalIds(new Set(goalsData.map((g) => g.id)));
      } else {
        setGoals([]);
        setOriginalGoalIds(new Set());
      }

      // Convert API unavailable dates to frontend format
      if (unavailableDatesData.length > 0) {
        const convertedDates: UnavailableDate[] = unavailableDatesData.map((apiDate) => ({
          id: apiDate.id,
          date: new Date(apiDate.date),
          reason: apiDate.reason || undefined,
        }));
        setUnavailableDates(convertedDates);
        setOriginalUnavailableDateIds(new Set(unavailableDatesData.map((d) => d.id)));
        originalUnavailableDatesRef.current = convertedDates;
      } else {
        setUnavailableDates([]);
        setOriginalUnavailableDateIds(new Set());
        originalUnavailableDatesRef.current = [];
      }

      // Set availability notes
      setAvailabilityNotes(notesData.notes || '');
    } catch (error) {
      console.error('Failed to load settings:', error);
      toast({
        title: t('settings.failedToLoad'),
        description: t('settings.couldNotLoad'),
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, toast, t]);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const textColor = useColorModeValue('gray.800', 'white');
  const mutedColor = useColorModeValue('gray.600', 'gray.400');
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const summaryCardBg = useColorModeValue('white', 'gray.800');
  const summaryCardBorder = useColorModeValue('gray.200', 'gray.700');

  // Mobile detection
  const isMobile = useBreakpointValue({ base: true, md: false });

  const handleAvailabilityChange = (newAvailability: WeeklyAvailability) => {
    setAvailability(newAvailability);
    setHasChanges(true);
  };

  const handleGoalsChange = (newGoals: Goal[]) => {
    setGoals(newGoals);
    setHasChanges(true);
  };

  const handleUnavailableDatesChange = (newDates: UnavailableDate[]) => {
    setUnavailableDates(newDates);
    setHasChanges(true);
  };

  const handleAvailabilityNotesChange = (newNotes: string) => {
    setAvailabilityNotes(newNotes);
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!user?.id) {
      toast({
        title: t('settings.notLoggedIn'),
        description: t('settings.selectUserToSave'),
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsSaving(true);
    try {
      // Save availability
      const availabilityPayload = availability.days.map((day, index) => ({
        dayIndex: index,
        available: day.isAvailable,
        timeSlots: [] as string[],
        maxHours: day.maxHours || null,
        notes: null,
      }));

      await api.put(`/api/availability/${user.id}`, { availability: availabilityPayload });

      // Handle goal deletions - find goals that existed before but are now removed
      const currentGoalIds = new Set(goals.map((g) => g.id));
      const deletedGoalIds = Array.from(originalGoalIds).filter(
        (id) => !currentGoalIds.has(id)
      );

      // Delete removed goals
      for (const deletedId of deletedGoalIds) {
        await api.delete(`/api/goals/${deletedId}`);
      }

      // Save remaining goals (create new or update existing)
      for (const goal of goals) {
        // New goals have 'goal-' prefix (generated by GoalEditor)
        const isNewGoal = goal.id.startsWith('goal-') || goal.id.startsWith('temp-');
        if (isNewGoal) {
          // Create new goal
          await api.post('/api/goals', {
            athleteId: user.id,
            name: goal.name,
            eventDate: goal.date?.toISOString() || null,
            priority: goal.type,
            eventType: goal.eventType || null,
            targetDuration: goal.targetDuration?.toString() || null,
            notes: goal.description || null,
          });
        } else {
          // Update existing goal
          await api.put(`/api/goals/${goal.id}`, {
            name: goal.name,
            eventDate: goal.date?.toISOString() || null,
            priority: goal.type,
            eventType: goal.eventType || null,
            targetDuration: goal.targetDuration?.toString() || null,
            notes: goal.description || null,
          });
        }
      }

      // Save unavailable dates - add new ones
      const newDates = unavailableDates.filter(d => d.id.startsWith('unavail-'));
      if (newDates.length > 0) {
        await api.post(`/api/availability/${user.id}/unavailable-dates/bulk`, {
          dates: newDates.map(d => ({
            date: d.date.toISOString().split('T')[0],
            reason: d.reason || null,
          })),
        });
      }

      // Delete dates that were removed (by date string)
      const currentDateIds = new Set(unavailableDates.map((d) => d.id));
      for (const originalId of Array.from(originalUnavailableDateIds)) {
        if (!currentDateIds.has(originalId)) {
          // Find the date for this ID from the original loaded data
          const dateToDelete = originalUnavailableDatesRef.current.find(d => d.id === originalId);
          if (dateToDelete) {
            const dateStr = dateToDelete.date.toISOString().split('T')[0];
            await api.delete(`/api/availability/${user.id}/unavailable-dates/${dateStr}`);
          }
        }
      }

      // Save availability notes
      await api.put(`/api/availability/${user.id}/notes`, {
        notes: availabilityNotes || null,
      });

      toast({
        title: t('settings.settingsSaved'),
        description: t('settings.settingsSavedDescription'),
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      setHasChanges(false);

      // Reload to get server-generated IDs
      await loadData();
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast({
        title: t('settings.failedToSave'),
        description: t('settings.couldNotSave'),
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Box minH="100vh" bg={bgColor}>
        <Header />
        <Center py={20}>
          <VStack spacing={4}>
            <Spinner size="xl" color="brand.500" />
            <Text color={mutedColor}>{t('settings.loadingSettings')}</Text>
          </VStack>
        </Center>
      </Box>
    );
  }

  return (
    <Box minH="100vh" bg={bgColor}>
      <Header />

      <Container maxW="6xl" py={8}>
        {/* Page Header */}
        <Flex
          direction={{ base: 'column', md: 'row' }}
          justify="space-between"
          align={{ base: 'stretch', md: 'center' }}
          gap={{ base: 4, md: 0 }}
          mb={6}
        >
          <VStack align="start" spacing={1}>
            <HStack spacing={3}>
              <Settings size={24} />
              <Heading size={{ base: 'md', md: 'lg' }} color={textColor}>
                {t('settings.title')}
              </Heading>
            </HStack>
            <Text color={mutedColor} fontSize="sm">
              {t('settings.subtitle')}
            </Text>
          </VStack>

          <HStack spacing={2} justify={{ base: 'flex-end', md: 'flex-start' }}>
            {isMobile ? (
              <>
                <Tooltip label={t('settings.refresh')}>
                  <IconButton
                    aria-label={t('settings.refresh')}
                    icon={<RefreshCw size={16} />}
                    variant="outline"
                    onClick={loadData}
                    isDisabled={isSaving}
                    size="sm"
                  />
                </Tooltip>
                <Tooltip label={t('settings.saveChanges')}>
                  <IconButton
                    aria-label={t('settings.saveChanges')}
                    icon={<Save size={16} />}
                    colorScheme="brand"
                    onClick={handleSave}
                    isDisabled={!hasChanges}
                    isLoading={isSaving}
                    size="sm"
                  />
                </Tooltip>
              </>
            ) : (
              <>
                <Button
                  leftIcon={<RefreshCw size={16} />}
                  variant="outline"
                  onClick={loadData}
                  isDisabled={isSaving}
                >
                  {t('settings.refresh')}
                </Button>
                <Button
                  leftIcon={<Save size={16} />}
                  colorScheme="brand"
                  onClick={handleSave}
                  isDisabled={!hasChanges}
                  isLoading={isSaving}
                >
                  {t('settings.saveChanges')}
                </Button>
              </>
            )}
          </HStack>
        </Flex>

        {/* Tabs */}
        <Tabs variant="soft-rounded" colorScheme="brand">
          <Box
            overflowX="auto"
            mx={{ base: -4, md: 0 }}
            px={{ base: 4, md: 0 }}
            sx={{
              '&::-webkit-scrollbar': { display: 'none' },
              scrollbarWidth: 'none',
            }}
          >
            <TabList mb={6} gap={2} flexWrap="nowrap" minW="max-content">
              <Tab px={{ base: 3, md: 4 }} py={2}>
                {isMobile ? (
                  <Tooltip label={t('settings.tabs.general')}>
                    <Icon as={Settings} boxSize={4} />
                  </Tooltip>
                ) : (
                  <HStack spacing={2}>
                    <Icon as={Settings} boxSize={4} />
                    <Text>{t('settings.tabs.general')}</Text>
                  </HStack>
                )}
              </Tab>
              {!isCoach && (
                <Tab px={{ base: 3, md: 4 }} py={2}>
                  {isMobile ? (
                    <Tooltip label={t('settings.tabs.profile')}>
                      <Icon as={User} boxSize={4} />
                    </Tooltip>
                  ) : (
                    <HStack spacing={2}>
                      <Icon as={User} boxSize={4} />
                      <Text>{t('settings.tabs.profile')}</Text>
                    </HStack>
                  )}
                </Tab>
              )}
              {!isCoach && (
                <Tab px={{ base: 3, md: 4 }} py={2}>
                  {isMobile ? (
                    <Tooltip label={t('settings.tabs.objectives')}>
                      <Icon as={Target} boxSize={4} />
                    </Tooltip>
                  ) : (
                    <HStack spacing={2}>
                      <Icon as={Target} boxSize={4} />
                      <Text>{t('settings.tabs.objectives')}</Text>
                    </HStack>
                  )}
                </Tab>
              )}
              {!isCoach && (
                <Tab px={{ base: 3, md: 4 }} py={2}>
                  {isMobile ? (
                    <Tooltip label={t('settings.tabs.availability')}>
                      <Icon as={Calendar} boxSize={4} />
                    </Tooltip>
                  ) : (
                    <HStack spacing={2}>
                      <Icon as={Calendar} boxSize={4} />
                      <Text>{t('settings.tabs.availability')}</Text>
                    </HStack>
                  )}
                </Tab>
              )}
              {!isCoach && (
                <Tab px={{ base: 3, md: 4 }} py={2}>
                  {isMobile ? (
                    <Tooltip label={t('settings.tabs.zones')}>
                      <Icon as={Zap} boxSize={4} />
                    </Tooltip>
                  ) : (
                    <HStack spacing={2}>
                      <Icon as={Zap} boxSize={4} />
                      <Text>{t('settings.tabs.zones')}</Text>
                    </HStack>
                  )}
                </Tab>
              )}
            </TabList>
          </Box>

          <TabPanels>
            {/* General Tab */}
            <TabPanel p={0}>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                {/* Language Settings */}
                <Box
                  p={6}
                  borderRadius="xl"
                  bg={cardBg}
                  borderWidth="1px"
                  borderColor={borderColor}
                >
                  <HStack spacing={3} mb={4}>
                    <Icon as={Globe} boxSize={5} />
                    <Heading size="sm">{t('settings.language')}</Heading>
                  </HStack>
                  <VStack spacing={4} align="start">
                    <Box>
                      <ButtonGroup size="sm" isAttached>
                        {supportedLanguages.map((lang) => (
                          <Button
                            key={lang.code}
                            variant={i18n.language === lang.code ? 'solid' : 'outline'}
                            onClick={() => handleLanguageChange(lang.code)}
                          >
                            {lang.flag} {lang.name}
                          </Button>
                        ))}
                      </ButtonGroup>
                      <Text fontSize="xs" color={mutedColor} mt={2}>
                        {t('settings.languageDescription')}
                      </Text>
                    </Box>
                  </VStack>
                </Box>

                {/* Theme Settings */}
                <Box
                  p={6}
                  borderRadius="xl"
                  bg={cardBg}
                  borderWidth="1px"
                  borderColor={borderColor}
                >
                  <HStack spacing={3} mb={4}>
                    <Icon as={Palette} boxSize={5} />
                    <Heading size="sm">{t('settings.theme')}</Heading>
                  </HStack>
                  <VStack spacing={4} align="start">
                    <Box>
                      <Text fontSize="sm" fontWeight="medium" mb={2}>
                        {t('settings.colorMode')}
                      </Text>
                      <ButtonGroup size="sm" isAttached>
                        <Button
                          leftIcon={<Icon as={Sun} boxSize={4} />}
                          variant={colorModePreference === 'light' ? 'solid' : 'outline'}
                          onClick={() => handleColorModeChange('light')}
                        >
                          {t('settings.light')}
                        </Button>
                        <Button
                          leftIcon={<Icon as={Moon} boxSize={4} />}
                          variant={colorModePreference === 'dark' ? 'solid' : 'outline'}
                          onClick={() => handleColorModeChange('dark')}
                        >
                          {t('settings.dark')}
                        </Button>
                        <Button
                          leftIcon={<Icon as={Monitor} boxSize={4} />}
                          variant={colorModePreference === 'system' ? 'solid' : 'outline'}
                          onClick={() => handleColorModeChange('system')}
                        >
                          {t('settings.system')}
                        </Button>
                      </ButtonGroup>
                      <Text fontSize="xs" color={mutedColor} mt={2}>
                        {t('settings.colorModeDescription')}
                      </Text>
                    </Box>
                  </VStack>
                </Box>
              </SimpleGrid>
            </TabPanel>

            {/* Profile Tab - only shown for athletes */}
            {!isCoach && (
              <TabPanel p={0}>
                {user?.id && <ProfileSettings athleteId={user.id} onSave={loadData} />}
              </TabPanel>
            )}

            {/* Objectives Tab - only shown for athletes */}
            {!isCoach && (
              <TabPanel p={0}>
                <VStack spacing={6} align="stretch">
                  <GoalEditor goals={goals} onChange={handleGoalsChange} />

                  {/* Summary Card */}
                  <Box
                    p={6}
                    borderRadius="xl"
                    bg={summaryCardBg}
                    borderWidth="1px"
                    borderColor={summaryCardBorder}
                  >
                    <Heading size="sm" mb={4}>
                      {t('settings.trainingSummary')}
                    </Heading>
                    <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
                      <SummaryItem
                        label={t('settings.weeklyHours')}
                        value={formatHours(availability.totalWeeklyHours)}
                      />
                      <SummaryItem
                        label={t('settings.trainingDays')}
                        value={`${availability.days.filter((d) => d.isAvailable).length} / 7`}
                      />
                      <SummaryItem
                        label={t('settings.outdoorDays')}
                        value={`${availability.days.filter((d) => d.isAvailable && d.preferredType === 'outdoor').length}`}
                      />
                      <SummaryItem
                        label={t('settings.goalsSet')}
                        value={`${goals.length} (${goals.filter((g) => g.type === 'A').length} ${t('settings.aGoal')})`}
                      />
                    </SimpleGrid>
                  </Box>
                </VStack>
              </TabPanel>
            )}

            {/* Availability Tab - only shown for athletes */}
            {!isCoach && (
              <TabPanel p={0}>
                <VStack spacing={6} align="stretch">
                  {/* Weekly Availability */}
                  <WeeklyAvailabilityEditor
                    availability={availability}
                    onChange={handleAvailabilityChange}
                  />

                  {/* Unavailable Dates & Notes */}
                  <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
                    <UnavailableDatesEditor
                      dates={unavailableDates}
                      onChange={handleUnavailableDatesChange}
                    />
                    <AvailabilityNotesEditor
                      notes={availabilityNotes}
                      onChange={handleAvailabilityNotesChange}
                    />
                  </SimpleGrid>
                </VStack>
              </TabPanel>
            )}

            {/* Zones Tab - only shown for athletes */}
            {!isCoach && (
              <TabPanel p={0}>
                {user?.id && <ZonesEditor athleteId={user.id} onSave={loadData} />}
              </TabPanel>
            )}
          </TabPanels>
        </Tabs>
      </Container>
    </Box>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  const mutedColor = useColorModeValue('gray.600', 'gray.400');

  return (
    <VStack align="start" spacing={0}>
      <Text fontSize="xs" color={mutedColor} textTransform="uppercase" letterSpacing="wide">
        {label}
      </Text>
      <Text fontSize="lg" fontWeight="semibold">
        {value}
      </Text>
    </VStack>
  );
}

function formatHours(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h === 0) return `${m}m`;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}
