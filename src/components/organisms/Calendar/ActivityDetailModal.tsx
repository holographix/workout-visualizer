/**
 * ActivityDetailModal - Rich visualization of imported FIT activity data
 *
 * Features:
 * - Power/HR/Cadence time series charts
 * - GPS route map (OpenStreetMap via Leaflet)
 * - Lap/segment breakdown
 * - Delete activity functionality
 */
import React, { useCallback, useMemo, useState } from 'react';
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
  SimpleGrid,
  useColorModeValue,
  useToast,
  useBreakpointValue,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Icon,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Alert,
  AlertIcon,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useDisclosure,
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { Trash2, Activity as ActivityIcon, MapPin, Zap, Heart, Gauge } from 'lucide-react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import { AxisBottom, AxisLeft } from '@visx/axis';
import { Group } from '@visx/group';
import { LinePath } from '@visx/shape';
import { scaleLinear, scaleTime } from '@visx/scale';
import { ParentSize } from '@visx/responsive';
import { localPoint } from '@visx/event';
import { useAuthenticatedApi } from '../../../hooks/useAuthenticatedApi';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon issue with Vite
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

// Component to fix map sizing when tab becomes visible
function MapUpdater({ trigger }: { trigger: number }) {
  const map = useMap();

  React.useEffect(() => {
    // Multiple attempts to ensure map gets proper dimensions
    const timers = [
      setTimeout(() => map.invalidateSize(), 50),
      setTimeout(() => map.invalidateSize(), 150),
      setTimeout(() => map.invalidateSize(), 300),
    ];

    return () => timers.forEach(t => clearTimeout(t));
  }, [map, trigger]);

  return null;
}

interface Activity {
  id: string;
  name: string;
  activityType: string;
  source: string;
  fileFormat: string;
  startTime: string;
  endTime?: string;
  durationSeconds: number;
  movingTime?: number;
  distanceMeters?: number;
  elevationGain?: number;
  elevationLoss?: number;
  avgPower?: number;
  maxPower?: number;
  normalizedPower?: number;
  avgHeartRate?: number;
  maxHeartRate?: number;
  avgCadence?: number;
  maxCadence?: number;
  avgSpeed?: number;
  maxSpeed?: number;
  tss?: number;
  intensityFactor?: number;
  calories?: number;
  hasGPS: boolean;
  startLatitude?: number;
  startLongitude?: number;
  temperature?: number;
  telemetryData?: {
    records: Array<{
      timestamp: number;
      lat?: number;
      lng?: number;
      altitude?: number;
      power?: number;
      hr?: number;
      cadence?: number;
      speed?: number;
      distance?: number;
      temp?: number;
    }>;
  };
  laps?: {
    laps: Array<{
      startTime: number;
      endTime: number;
      duration: number;
      distance?: number;
      avgPower?: number;
      avgHR?: number;
      avgCadence?: number;
      avgSpeed?: number;
      totalAscent?: number;
    }>;
  };
  notes?: string;
}

interface ActivityDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  activity: Activity;
  onDelete?: (activityId: string) => void;
}

interface TimeSeriesDataPoint {
  timestamp: number;
  value: number;
}

export function ActivityDetailModal({
  isOpen,
  onClose,
  activity,
  onDelete,
}: ActivityDetailModalProps) {
  const { t } = useTranslation();
  const toast = useToast();
  const authenticatedApi = useAuthenticatedApi();
  const { isOpen: isDeleteAlertOpen, onOpen: onDeleteAlertOpen, onClose: onDeleteAlertClose } = useDisclosure();
  const [isDeleting, setIsDeleting] = useState(false);
  const cancelRef = useState(null);

  // Mobile detection
  const isMobile = useBreakpointValue({ base: true, md: false });

  // Shared cursor state for synchronized charts
  const [cursorTime, setCursorTime] = useState<number | null>(null);

  // Track selected tab to trigger map resize
  const [selectedTab, setSelectedTab] = useState(0);

  // Shared zoom state for synchronized charts
  const [zoomTransform, setZoomTransform] = useState({ k: 1, x: 0, y: 0 });
  const resetZoom = () => setZoomTransform({ k: 1, x: 0, y: 0 });

  const bgColor = useColorModeValue('white', 'gray.800');
  const cardBg = useColorModeValue('gray.50', 'gray.700');
  const mutedColor = useColorModeValue('gray.600', 'gray.400');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // Process telemetry data for charts
  const { powerData, hrData, cadenceData, gpsRoute } = useMemo(() => {
    if (!activity.telemetryData?.records || activity.telemetryData.records.length === 0) {
      return { powerData: [], hrData: [], cadenceData: [], gpsRoute: [] };
    }

    const records = activity.telemetryData.records;
    const power: TimeSeriesDataPoint[] = [];
    const hr: TimeSeriesDataPoint[] = [];
    const cadence: TimeSeriesDataPoint[] = [];
    const gps: Array<[number, number]> = [];

    // Get first timestamp - parse ISO string to milliseconds, then convert to seconds
    const firstRecord = records[0];
    if (!firstRecord) {
      return { powerData: [], hrData: [], cadenceData: [], gpsRoute: [] };
    }

    // Parse ISO timestamp string to Unix timestamp (milliseconds)
    const startTimestampMs = typeof firstRecord.timestamp === 'string'
      ? new Date(firstRecord.timestamp).getTime()
      : firstRecord.timestamp;

    records.forEach((record) => {
      // Parse timestamp to milliseconds
      const timestampMs = typeof record.timestamp === 'string'
        ? new Date(record.timestamp).getTime()
        : record.timestamp;

      // Normalize timestamp to relative seconds from start
      const relativeTimeSeconds = (timestampMs - startTimestampMs) / 1000;

      // Ensure we have valid timestamp
      if (!isFinite(relativeTimeSeconds) || relativeTimeSeconds < 0) {
        return;
      }

      // Power - include 0 values (coasting is valid)
      if (record.power !== undefined && record.power !== null && isFinite(record.power)) {
        power.push({ timestamp: relativeTimeSeconds, value: record.power });
      }
      // Heart rate - must be > 0
      if (record.hr !== undefined && record.hr > 0 && isFinite(record.hr)) {
        hr.push({ timestamp: relativeTimeSeconds, value: record.hr });
      }
      // Cadence - include 0 values (coasting is valid)
      if (record.cadence !== undefined && record.cadence !== null && isFinite(record.cadence)) {
        cadence.push({ timestamp: relativeTimeSeconds, value: record.cadence });
      }
      // GPS coordinates
      if (record.lat !== undefined && record.lng !== undefined &&
          isFinite(record.lat) && isFinite(record.lng)) {
        gps.push([record.lat, record.lng]);
      }
    });

    return {
      powerData: power,
      hrData: hr,
      cadenceData: cadence,
      gpsRoute: gps,
    };
  }, [activity]);

  const handleDelete = useCallback(async () => {
    setIsDeleting(true);
    try {
      await authenticatedApi.delete(`/api/activity-import/${activity.id}`);
      toast({
        title: t('activityDetail.deleted') || 'Activity deleted',
        status: 'success',
        duration: 3000,
      });
      onDeleteAlertClose();
      onClose();
      if (onDelete) {
        onDelete(activity.id);
      }
    } catch (error) {
      console.error('Failed to delete activity:', error);
      toast({
        title: t('activityDetail.deleteFailed') || 'Failed to delete activity',
        description: error instanceof Error ? error.message : t('common.error'),
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsDeleting(false);
    }
  }, [activity.id, onDelete, onClose, onDeleteAlertClose, toast, t, authenticatedApi]);

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m ${secs}s`;
    }
    return `${mins}m ${secs}s`;
  };

  const formatDistance = (meters?: number): string => {
    if (!meters) return 'N/A';
    const km = meters / 1000;
    return `${km.toFixed(2)} km`;
  };

  const formatSpeed = (metersPerSecond?: number): string => {
    if (!metersPerSecond) return 'N/A';
    const kmh = metersPerSecond * 3.6;
    return `${kmh.toFixed(1)} km/h`;
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} size="6xl">
        <ModalOverlay />
        <ModalContent maxH="90vh" display="flex" flexDirection="column">
          <ModalHeader flexShrink={0}>
            <HStack justify="space-between">
              <HStack spacing={3}>
                <Icon as={ActivityIcon} boxSize={6} color="blue.500" />
                <VStack align="start" spacing={0}>
                  <Text>{activity.name}</Text>
                  <Text fontSize="sm" fontWeight="normal" color={mutedColor}>
                    {new Date(activity.startTime).toLocaleDateString()} •{' '}
                    {new Date(activity.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </VStack>
              </HStack>
              <Button
                leftIcon={<Icon as={Trash2} />}
                colorScheme="red"
                variant="ghost"
                size="sm"
                onClick={onDeleteAlertOpen}
              >
                {t('common.delete') || 'Delete'}
              </Button>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody flex="1" overflowY="auto">
            <VStack spacing={6} align="stretch">
              {/* Summary stats */}
              <SimpleGrid columns={{ base: 2, md: 4, lg: 6 }} spacing={4}>
                <Stat size="sm" bg={cardBg} p={3} borderRadius="md">
                  <StatLabel>{t('workout.duration') || 'Duration'}</StatLabel>
                  <StatNumber fontSize="lg">{formatDuration(activity.durationSeconds)}</StatNumber>
                  {activity.movingTime && activity.movingTime !== activity.durationSeconds && (
                    <StatHelpText>{formatDuration(activity.movingTime)} moving</StatHelpText>
                  )}
                </Stat>

                {activity.distanceMeters && (
                  <Stat size="sm" bg={cardBg} p={3} borderRadius="md">
                    <StatLabel>{t('workout.distance') || 'Distance'}</StatLabel>
                    <StatNumber fontSize="lg">{formatDistance(activity.distanceMeters)}</StatNumber>
                  </Stat>
                )}

                {activity.avgPower && (
                  <Stat size="sm" bg={cardBg} p={3} borderRadius="md">
                    <StatLabel>{t('workout.avgPower') || 'Avg Power'}</StatLabel>
                    <StatNumber fontSize="lg">{activity.avgPower}W</StatNumber>
                    {activity.normalizedPower && (
                      <StatHelpText>NP: {activity.normalizedPower}W</StatHelpText>
                    )}
                  </Stat>
                )}

                {activity.avgHeartRate && (
                  <Stat size="sm" bg={cardBg} p={3} borderRadius="md">
                    <StatLabel>{t('workout.avgHeartRate') || 'Avg HR'}</StatLabel>
                    <StatNumber fontSize="lg">{activity.avgHeartRate} bpm</StatNumber>
                    {activity.maxHeartRate && (
                      <StatHelpText>Max: {activity.maxHeartRate} bpm</StatHelpText>
                    )}
                  </Stat>
                )}

                {activity.tss && (
                  <Stat size="sm" bg={cardBg} p={3} borderRadius="md">
                    <StatLabel>TSS</StatLabel>
                    <StatNumber fontSize="lg">{Math.round(activity.tss)}</StatNumber>
                    {activity.intensityFactor && (
                      <StatHelpText>IF: {activity.intensityFactor.toFixed(2)}</StatHelpText>
                    )}
                  </Stat>
                )}

                {activity.avgCadence && (
                  <Stat size="sm" bg={cardBg} p={3} borderRadius="md">
                    <StatLabel>{t('workout.avgCadence') || 'Avg Cadence'}</StatLabel>
                    <StatNumber fontSize="lg">{activity.avgCadence} rpm</StatNumber>
                  </Stat>
                )}
              </SimpleGrid>

              {/* Tabs for different views */}
              <Tabs variant="enclosed" colorScheme="blue" onChange={setSelectedTab}>
                <TabList>
                  <Tab>
                    <Icon as={Zap} mr={2} />
                    {t('activityDetail.charts') || 'Charts'}
                  </Tab>
                  {activity.hasGPS && gpsRoute.length > 0 && (
                    <Tab>
                      <Icon as={MapPin} mr={2} />
                      {t('activityDetail.map') || 'Map'}
                    </Tab>
                  )}
                  {activity.laps && activity.laps.laps.length > 0 && (
                    <Tab>
                      <Icon as={Gauge} mr={2} />
                      {t('activityDetail.laps') || 'Laps'}
                    </Tab>
                  )}
                </TabList>

                <TabPanels>
                  {/* Charts Tab */}
                  <TabPanel>
                    <VStack spacing={6} align="stretch">
                      {/* Zoom controls */}
                      {(powerData.length > 0 || hrData.length > 0 || cadenceData.length > 0) && (
                        <HStack justify="space-between" align="center">
                          <Text fontSize="sm" color={mutedColor}>
                            💡 Drag to pan
                          </Text>
                          <HStack spacing={2}>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const newK = Math.min(20, zoomTransform.k * 1.5);
                                setZoomTransform(prev => ({ ...prev, k: newK }));
                              }}
                            >
                              Zoom In
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const newK = Math.max(1, zoomTransform.k / 1.5);
                                setZoomTransform(prev => ({ ...prev, k: newK }));
                              }}
                            >
                              Zoom Out
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={resetZoom}
                              isDisabled={zoomTransform.k === 1 && zoomTransform.x === 0}
                            >
                              Reset
                            </Button>
                          </HStack>
                        </HStack>
                      )}

                      {/* Mobile: Combined chart / Desktop: Separate charts */}
                      {isMobile ? (
                        // Mobile - Single combined chart
                        (powerData.length > 0 || hrData.length > 0 || cadenceData.length > 0) && (
                          <Box>
                            <Text fontWeight="medium" mb={2}>
                              {t('activityDetail.activityData') || 'Activity Data'}
                            </Text>
                            <Box h="300px" bg={cardBg} borderRadius="md" p={4} borderWidth="1px" borderColor={borderColor}>
                              <CombinedTimeSeriesChart
                                powerData={powerData}
                                hrData={hrData}
                                cadenceData={cadenceData}
                                height={280}
                                cursorTime={cursorTime}
                                onCursorChange={setCursorTime}
                                zoomTransform={zoomTransform}
                                onZoomChange={setZoomTransform}
                              />
                            </Box>
                          </Box>
                        )
                      ) : (
                        // Desktop - Separate charts
                        <>
                          {powerData.length > 0 && (
                            <Box>
                              <Text fontWeight="medium" mb={2}>
                                {t('activityDetail.powerChart') || 'Power'}
                              </Text>
                              <Box h="200px" bg={cardBg} borderRadius="md" p={4} borderWidth="1px" borderColor={borderColor}>
                                <TimeSeriesChart
                                  data={powerData}
                                  color="#3182ce"
                                  unit="W"
                                  height={180}
                                  cursorTime={cursorTime}
                                  onCursorChange={setCursorTime}
                                  zoomTransform={zoomTransform}
                                  onZoomChange={setZoomTransform}
                                />
                              </Box>
                            </Box>
                          )}

                          {hrData.length > 0 && (
                            <Box>
                              <Text fontWeight="medium" mb={2}>
                                {t('activityDetail.heartRateChart') || 'Heart Rate'}
                              </Text>
                              <Box h="200px" bg={cardBg} borderRadius="md" p={4} borderWidth="1px" borderColor={borderColor}>
                                <TimeSeriesChart
                                  data={hrData}
                                  color="#E53E3E"
                                  unit="bpm"
                                  height={180}
                                  cursorTime={cursorTime}
                                  onCursorChange={setCursorTime}
                                  zoomTransform={zoomTransform}
                                  onZoomChange={setZoomTransform}
                                />
                              </Box>
                            </Box>
                          )}

                          {cadenceData.length > 0 && (
                            <Box>
                              <Text fontWeight="medium" mb={2}>
                                {t('activityDetail.cadenceChart') || 'Cadence'}
                              </Text>
                              <Box h="200px" bg={cardBg} borderRadius="md" p={4} borderWidth="1px" borderColor={borderColor}>
                                <TimeSeriesChart
                                  data={cadenceData}
                                  color="#38A169"
                                  unit="rpm"
                                  height={180}
                                  cursorTime={cursorTime}
                                  onCursorChange={setCursorTime}
                                  zoomTransform={zoomTransform}
                                  onZoomChange={setZoomTransform}
                                />
                              </Box>
                            </Box>
                          )}
                        </>
                      )}

                      {powerData.length === 0 && hrData.length === 0 && cadenceData.length === 0 && (
                        <Alert status="info">
                          <AlertIcon />
                          {t('activityDetail.noChartData') || 'No time series data available for this activity'}
                        </Alert>
                      )}
                    </VStack>
                  </TabPanel>

                  {/* Map Tab */}
                  {activity.hasGPS && gpsRoute.length > 0 && (
                    <TabPanel>
                      <Box h="500px" borderRadius="md" overflow="hidden" borderWidth="1px" borderColor={borderColor}>
                        {(() => {
                          // Calculate proper bounds for the map
                          const latitudes = gpsRoute.map(coord => coord[0]);
                          const longitudes = gpsRoute.map(coord => coord[1]);
                          const bounds = [
                            [Math.min(...latitudes), Math.min(...longitudes)], // Southwest corner
                            [Math.max(...latitudes), Math.max(...longitudes)]  // Northeast corner
                          ] as [[number, number], [number, number]];

                          // Calculate center as fallback
                          const centerLat = (Math.min(...latitudes) + Math.max(...latitudes)) / 2;
                          const centerLng = (Math.min(...longitudes) + Math.max(...longitudes)) / 2;
                          const center = [centerLat, centerLng] as [number, number];

                          return (
                            <MapContainer
                              bounds={bounds}
                              boundsOptions={{ padding: [30, 30] }}
                              style={{ height: '100%', width: '100%' }}
                              scrollWheelZoom={true}
                              key={`map-${activity.id}`} // Force remount on activity change
                            >
                              <MapUpdater trigger={selectedTab} />
                              <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                maxZoom={19}
                              />
                              <Polyline
                                positions={gpsRoute}
                                color="#3182ce"
                                weight={3}
                                opacity={0.9}
                                smoothFactor={1}
                              />
                              {/* Start marker */}
                              <Marker position={gpsRoute[0]}>
                                <Popup>
                                  <strong>{t('activityDetail.start') || 'Start'}</strong><br />
                                  {new Date(activity.startTime).toLocaleTimeString()}
                                </Popup>
                              </Marker>
                              {/* End marker */}
                              <Marker position={gpsRoute[gpsRoute.length - 1]}>
                                <Popup>
                                  <strong>{t('activityDetail.finish') || 'Finish'}</strong><br />
                                  {activity.endTime ? new Date(activity.endTime).toLocaleTimeString() : 'N/A'}
                                </Popup>
                              </Marker>
                            </MapContainer>
                          );
                        })()}
                      </Box>
                      {activity.elevationGain !== undefined && (
                        <SimpleGrid columns={2} spacing={4} mt={4}>
                          <Stat size="sm" bg={cardBg} p={3} borderRadius="md">
                            <StatLabel>{t('activityDetail.elevationGain') || 'Elevation Gain'}</StatLabel>
                            <StatNumber>{Math.round(activity.elevationGain)} m</StatNumber>
                          </Stat>
                          {activity.elevationLoss !== undefined && (
                            <Stat size="sm" bg={cardBg} p={3} borderRadius="md">
                              <StatLabel>{t('activityDetail.elevationLoss') || 'Elevation Loss'}</StatLabel>
                              <StatNumber>{Math.round(activity.elevationLoss)} m</StatNumber>
                            </Stat>
                          )}
                        </SimpleGrid>
                      )}
                    </TabPanel>
                  )}

                  {/* Laps Tab */}
                  {activity.laps && activity.laps.laps.length > 0 && (
                    <TabPanel>
                      <Box overflowX="auto">
                        <Table variant="simple" size="sm">
                          <Thead>
                            <Tr>
                              <Th>{t('activityDetail.lap') || 'Lap'}</Th>
                              <Th isNumeric>{t('workout.duration') || 'Duration'}</Th>
                              {activity.laps.laps.some(l => l.distance) && <Th isNumeric>{t('workout.distance') || 'Distance'}</Th>}
                              {activity.laps.laps.some(l => l.avgPower) && <Th isNumeric>{t('workout.avgPower') || 'Avg Power'}</Th>}
                              {activity.laps.laps.some(l => l.avgHR) && <Th isNumeric>{t('workout.avgHeartRate') || 'Avg HR'}</Th>}
                              {activity.laps.laps.some(l => l.avgCadence) && <Th isNumeric>{t('workout.avgCadence') || 'Avg Cadence'}</Th>}
                              {activity.laps.laps.some(l => l.avgSpeed) && <Th isNumeric>{t('activityDetail.avgSpeed') || 'Avg Speed'}</Th>}
                            </Tr>
                          </Thead>
                          <Tbody>
                            {activity.laps.laps.map((lap, index) => (
                              <Tr key={index}>
                                <Td>
                                  <Badge colorScheme="blue">Lap {index + 1}</Badge>
                                </Td>
                                <Td isNumeric>{formatDuration(lap.duration)}</Td>
                                {activity.laps!.laps.some(l => l.distance) && (
                                  <Td isNumeric>{formatDistance(lap.distance)}</Td>
                                )}
                                {activity.laps!.laps.some(l => l.avgPower) && (
                                  <Td isNumeric>{lap.avgPower ? `${lap.avgPower}W` : '-'}</Td>
                                )}
                                {activity.laps!.laps.some(l => l.avgHR) && (
                                  <Td isNumeric>{lap.avgHR ? `${lap.avgHR} bpm` : '-'}</Td>
                                )}
                                {activity.laps!.laps.some(l => l.avgCadence) && (
                                  <Td isNumeric>{lap.avgCadence ? `${lap.avgCadence} rpm` : '-'}</Td>
                                )}
                                {activity.laps!.laps.some(l => l.avgSpeed) && (
                                  <Td isNumeric>{formatSpeed(lap.avgSpeed)}</Td>
                                )}
                              </Tr>
                            ))}
                          </Tbody>
                        </Table>
                      </Box>
                    </TabPanel>
                  )}
                </TabPanels>
              </Tabs>

              {/* Notes */}
              {activity.notes && (
                <Box bg={cardBg} p={4} borderRadius="md">
                  <Text fontWeight="medium" mb={2}>
                    {t('activityDetail.notes') || 'Notes'}
                  </Text>
                  <Text fontSize="sm" color={mutedColor} whiteSpace="pre-wrap">
                    {activity.notes}
                  </Text>
                </Box>
              )}
            </VStack>
          </ModalBody>
          <ModalFooter flexShrink={0}>
            <Button onClick={onClose}>{t('common.close') || 'Close'}</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete confirmation dialog */}
      <AlertDialog
        isOpen={isDeleteAlertOpen}
        leastDestructiveRef={cancelRef as any}
        onClose={onDeleteAlertClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              {t('activityDetail.deleteConfirm') || 'Delete Activity'}
            </AlertDialogHeader>

            <AlertDialogBody>
              {t('activityDetail.deleteWarning') || 'Are you sure? This will permanently delete this activity data. This action cannot be undone.'}
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef as any} onClick={onDeleteAlertClose}>
                {t('common.cancel') || 'Cancel'}
              </Button>
              <Button
                colorScheme="red"
                onClick={handleDelete}
                ml={3}
                isLoading={isDeleting}
                loadingText={t('common.deleting') || 'Deleting...'}
              >
                {t('common.delete') || 'Delete'}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  );
}

// Combined time series chart for mobile (all three data series on one chart)
interface CombinedTimeSeriesChartProps {
  powerData: TimeSeriesDataPoint[];
  hrData: TimeSeriesDataPoint[];
  cadenceData: TimeSeriesDataPoint[];
  height: number;
  cursorTime: number | null;
  onCursorChange: (time: number | null) => void;
  zoomTransform: { k: number; x: number; y: number };
  onZoomChange: (transform: { k: number; x: number; y: number }) => void;
}

function CombinedTimeSeriesChart({
  powerData,
  hrData,
  cadenceData,
  height,
  cursorTime,
  onCursorChange,
  zoomTransform,
  onZoomChange,
}: CombinedTimeSeriesChartProps) {
  const svgRef = React.useRef<SVGSVGElement>(null);
  const isDraggingRef = React.useRef(false);
  const dragStartRef = React.useRef({ x: 0, transformX: 0 });

  // Determine which datasets we have
  const hasPower = powerData.length > 0;
  const hasHR = hrData.length > 0;
  const hasCadence = cadenceData.length > 0;

  if (!hasPower && !hasHR && !hasCadence) return null;

  return (
    <ParentSize>
      {({ width }) => {
        const margin = { top: 30, right: 60, bottom: 30, left: 60 };
        const xMax = Math.max(0, width - margin.left - margin.right);
        const yMax = Math.max(0, height - margin.top - margin.bottom);

        if (width === 0 || xMax <= 0 || yMax <= 0) {
          return null;
        }

        // Combine all timestamps to get full time range
        const allTimestamps = [
          ...powerData.map(d => d.timestamp),
          ...hrData.map(d => d.timestamp),
          ...cadenceData.map(d => d.timestamp),
        ].filter(isFinite);

        if (allTimestamps.length === 0) return null;

        const minTime = Math.min(...allTimestamps);
        const maxTime = Math.max(...allTimestamps);

        // Base time scale
        const baseXScale = scaleLinear({
          domain: [minTime, maxTime],
          range: [0, xMax],
        });

        // Apply zoom transform
        const xScale = baseXScale.copy();
        const newDomain = baseXScale.domain().map((val) => {
          const rangeVal = baseXScale(val);
          return baseXScale.invert((rangeVal - zoomTransform.x) / zoomTransform.k);
        });
        xScale.domain(newDomain as [number, number]);

        // Create separate Y scales for each data type (normalized to same visual range)
        const powerValues = powerData.map(d => d.value).filter(isFinite);
        const hrValues = hrData.map(d => d.value).filter(isFinite);
        const cadenceValues = cadenceData.map(d => d.value).filter(isFinite);

        const powerScale = powerValues.length > 0 ? scaleLinear({
          domain: [Math.min(...powerValues) * 0.95, Math.max(...powerValues) * 1.05],
          range: [yMax, 0],
        }) : null;

        const hrScale = hrValues.length > 0 ? scaleLinear({
          domain: [Math.min(...hrValues) * 0.95, Math.max(...hrValues) * 1.05],
          range: [yMax, 0],
        }) : null;

        const cadenceScale = cadenceValues.length > 0 ? scaleLinear({
          domain: [Math.min(...cadenceValues) * 0.95, Math.max(...cadenceValues) * 1.05],
          range: [yMax, 0],
        }) : null;

        // Find cursor values
        let cursorPower: number | null = null;
        let cursorHR: number | null = null;
        let cursorCadence: number | null = null;

        if (cursorTime !== null) {
          if (hasPower && powerData.length > 0) {
            const nearest = powerData.reduce((prev, curr) =>
              Math.abs(curr.timestamp - cursorTime) < Math.abs(prev.timestamp - cursorTime) ? curr : prev
            );
            cursorPower = nearest.value;
          }
          if (hasHR && hrData.length > 0) {
            const nearest = hrData.reduce((prev, curr) =>
              Math.abs(curr.timestamp - cursorTime) < Math.abs(prev.timestamp - cursorTime) ? curr : prev
            );
            cursorHR = nearest.value;
          }
          if (hasCadence && cadenceData.length > 0) {
            const nearest = cadenceData.reduce((prev, curr) =>
              Math.abs(curr.timestamp - cursorTime) < Math.abs(prev.timestamp - cursorTime) ? curr : prev
            );
            cursorCadence = nearest.value;
          }
        }

        const handleMouseMove = (event: React.MouseEvent<SVGSVGElement>) => {
          if (!svgRef.current) return;
          const svgRect = svgRef.current.getBoundingClientRect();
          const x = event.clientX - svgRect.left - margin.left;
          if (x >= 0 && x <= xMax) {
            const time = xScale.invert(x);
            onCursorChange(time);
          }
        };

        const handleMouseLeave = () => {
          onCursorChange(null);
        };

        const handleMouseDown = (event: React.MouseEvent<SVGSVGElement>) => {
          isDraggingRef.current = true;
          dragStartRef.current = { x: event.clientX, transformX: zoomTransform.x };
        };

        const handleMouseMoveWhileDragging = (event: React.MouseEvent<SVGSVGElement>) => {
          if (!isDraggingRef.current) return handleMouseMove(event);
          const deltaX = event.clientX - dragStartRef.current.x;
          const newX = dragStartRef.current.transformX + deltaX;
          const maxPan = 0;
          const minPan = xMax - (xMax * zoomTransform.k);
          const constrainedX = Math.max(minPan, Math.min(maxPan, newX));
          onZoomChange({ ...zoomTransform, x: constrainedX });
        };

        const handleMouseUp = () => {
          isDraggingRef.current = false;
        };

        return (
          <svg
            ref={svgRef}
            width={width}
            height={height}
            onMouseMove={handleMouseMoveWhileDragging}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={(e) => { handleMouseUp(); handleMouseLeave(); }}
            style={{ cursor: isDraggingRef.current ? 'grabbing' : zoomTransform.k > 1 ? 'grab' : 'crosshair' }}
          >
            <defs>
              <clipPath id="clip-combined">
                <rect x={0} y={0} width={xMax} height={yMax} />
              </clipPath>
            </defs>

            <Group left={margin.left} top={margin.top}>
              {/* Legend */}
              <g>
                <text x={0} y={-15} fontSize={11} fontWeight="bold">
                  {hasPower && (
                    <tspan fill="#3182ce">Power (W) </tspan>
                  )}
                  {hasHR && (
                    <tspan fill="#E53E3E">HR (bpm) </tspan>
                  )}
                  {hasCadence && (
                    <tspan fill="#38A169">Cadence (rpm)</tspan>
                  )}
                </text>
              </g>

              {/* Chart area */}
              <rect x={0} y={0} width={xMax} height={yMax} fill="transparent" />

              <g clipPath="url(#clip-combined)">
                {/* Power line */}
                {hasPower && powerScale && (
                  <LinePath
                    data={powerData}
                    x={(d) => xScale(d.timestamp)}
                    y={(d) => powerScale(d.value)}
                    stroke="#3182ce"
                    strokeWidth={2}
                  />
                )}

                {/* HR line */}
                {hasHR && hrScale && (
                  <LinePath
                    data={hrData}
                    x={(d) => xScale(d.timestamp)}
                    y={(d) => hrScale(d.value)}
                    stroke="#E53E3E"
                    strokeWidth={2}
                  />
                )}

                {/* Cadence line */}
                {hasCadence && cadenceScale && (
                  <LinePath
                    data={cadenceData}
                    x={(d) => xScale(d.timestamp)}
                    y={(d) => cadenceScale(d.value)}
                    stroke="#38A169"
                    strokeWidth={2}
                  />
                )}

                {/* Cursor line */}
                {cursorTime !== null && (
                  <line
                    x1={xScale(cursorTime)}
                    x2={xScale(cursorTime)}
                    y1={0}
                    y2={yMax}
                    stroke="#666"
                    strokeWidth={1}
                    strokeDasharray="4,4"
                    pointerEvents="none"
                  />
                )}
              </g>

              {/* Cursor value tooltips */}
              {cursorTime !== null && (
                <g>
                  {/* Power value */}
                  {cursorPower !== null && powerScale && (
                    <g transform={`translate(${xScale(cursorTime)}, ${powerScale(cursorPower)})`}>
                      <circle r={3} fill="#3182ce" stroke="white" strokeWidth={1.5} />
                      <rect x={8} y={-18} width={55} height={18} rx={4} fill="white" stroke="#3182ce" strokeWidth={1} opacity={0.95} />
                      <text x={14} y={-5} fontSize={10} fontWeight="bold" fill="#3182ce">
                        {Math.round(cursorPower)}W
                      </text>
                    </g>
                  )}

                  {/* HR value */}
                  {cursorHR !== null && hrScale && (
                    <g transform={`translate(${xScale(cursorTime)}, ${hrScale(cursorHR)})`}>
                      <circle r={3} fill="#E53E3E" stroke="white" strokeWidth={1.5} />
                      <rect x={8} y={-18} width={65} height={18} rx={4} fill="white" stroke="#E53E3E" strokeWidth={1} opacity={0.95} />
                      <text x={14} y={-5} fontSize={10} fontWeight="bold" fill="#E53E3E">
                        {Math.round(cursorHR)}bpm
                      </text>
                    </g>
                  )}

                  {/* Cadence value */}
                  {cursorCadence !== null && cadenceScale && (
                    <g transform={`translate(${xScale(cursorTime)}, ${cadenceScale(cursorCadence)})`}>
                      <circle r={3} fill="#38A169" stroke="white" strokeWidth={1.5} />
                      <rect x={8} y={-18} width={65} height={18} rx={4} fill="white" stroke="#38A169" strokeWidth={1} opacity={0.95} />
                      <text x={14} y={-5} fontSize={10} fontWeight="bold" fill="#38A169">
                        {Math.round(cursorCadence)}rpm
                      </text>
                    </g>
                  )}
                </g>
              )}

              {/* X-axis */}
              <AxisBottom
                top={yMax}
                scale={xScale}
                numTicks={5}
                tickFormat={(v) => {
                  const secs = Math.round(v as number);
                  const mins = Math.floor(secs / 60);
                  return `${mins}m`;
                }}
                stroke="#888"
                tickStroke="#888"
              />
            </Group>
          </svg>
        );
      }}
    </ParentSize>
  );
}

// Time series chart component using visx
interface TimeSeriesChartProps {
  data: TimeSeriesDataPoint[];
  color: string;
  unit: string;
  height: number;
  cursorTime: number | null;
  onCursorChange: (time: number | null) => void;
  zoomTransform: { k: number; x: number; y: number };
  onZoomChange: (transform: { k: number; x: number; y: number }) => void;
}

function TimeSeriesChart({ data, color, unit, height, cursorTime, onCursorChange, zoomTransform, onZoomChange }: TimeSeriesChartProps) {
  if (data.length === 0) return null;

  const svgRef = React.useRef<SVGSVGElement>(null);
  const isDraggingRef = React.useRef(false);
  const dragStartRef = React.useRef({ x: 0, transformX: 0 });

  return (
    <ParentSize>
      {({ width }) => {
        const margin = { top: 10, right: 40, bottom: 30, left: 50 };
        const xMax = Math.max(0, width - margin.left - margin.right);
        const yMax = Math.max(0, height - margin.top - margin.bottom);

        // Don't render if container not ready
        if (width === 0 || xMax <= 0 || yMax <= 0) {
          return null;
        }

        // Get time domain with validation
        const timestamps = data.map(d => d.timestamp).filter(isFinite);
        const values = data.map(d => d.value).filter(isFinite);

        if (timestamps.length === 0 || values.length === 0) {
          return null;
        }

        const minTime = Math.min(...timestamps);
        const maxTime = Math.max(...timestamps);
        const minValue = Math.min(...values);
        const maxValue = Math.max(...values);

        // Base scales
        const baseXScale = scaleLinear({
          domain: [minTime, maxTime],
          range: [0, xMax],
        });

        const yScale = scaleLinear({
          domain: [minValue * 0.95, maxValue * 1.05],
          range: [yMax, 0],
        });

        // Apply zoom transform to x scale only (pan/zoom horizontally)
        const xScale = baseXScale.copy();
        const newDomain = baseXScale.domain().map((val) => {
          const rangeVal = baseXScale(val);
          return baseXScale.invert((rangeVal - zoomTransform.x) / zoomTransform.k);
        });
        xScale.domain(newDomain as [number, number]);

        // Find nearest data point to cursor
        let cursorValue: number | null = null;
        if (cursorTime !== null) {
          const nearest = data.reduce((prev, curr) => {
            return Math.abs(curr.timestamp - cursorTime) < Math.abs(prev.timestamp - cursorTime) ? curr : prev;
          });
          cursorValue = nearest.value;
        }

        const handleMouseMove = (event: React.MouseEvent<SVGSVGElement>) => {
          if (!svgRef.current) return;

          const svgRect = svgRef.current.getBoundingClientRect();
          const x = event.clientX - svgRect.left - margin.left;

          if (x >= 0 && x <= xMax) {
            const time = xScale.invert(x);
            onCursorChange(time);
          }
        };

        const handleMouseLeave = () => {
          onCursorChange(null);
        };

        const handleMouseDown = (event: React.MouseEvent<SVGSVGElement>) => {
          isDraggingRef.current = true;
          dragStartRef.current = { x: event.clientX, transformX: zoomTransform.x };
        };

        const handleMouseMoveWhileDragging = (event: React.MouseEvent<SVGSVGElement>) => {
          if (!isDraggingRef.current) return handleMouseMove(event);

          const deltaX = event.clientX - dragStartRef.current.x;
          const newX = dragStartRef.current.transformX + deltaX;

          // Calculate pan boundaries
          const maxPan = 0; // Can't pan right past the start
          const minPan = xMax - (xMax * zoomTransform.k); // Can't pan left past the end

          // Constrain pan within boundaries
          const constrainedX = Math.max(minPan, Math.min(maxPan, newX));

          onZoomChange({ ...zoomTransform, x: constrainedX });
        };

        const handleMouseUp = () => {
          isDraggingRef.current = false;
        };

        return (
          <svg
            ref={svgRef}
            width={width}
            height={height}
            onMouseMove={handleMouseMoveWhileDragging}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={(e) => { handleMouseUp(); handleMouseLeave(); }}
            style={{ cursor: isDraggingRef.current ? 'grabbing' : zoomTransform.k > 1 ? 'grab' : 'crosshair' }}
          >
            {/* Define clip path to prevent overflow into Y-axis */}
            <defs>
              <clipPath id={`clip-${color}`}>
                <rect x={0} y={0} width={xMax} height={yMax} />
              </clipPath>
            </defs>

            <Group left={margin.left} top={margin.top}>
              {/* Chart area background */}
              <rect
                x={0}
                y={0}
                width={xMax}
                height={yMax}
                fill="transparent"
              />

              {/* Chart content with clipping */}
              <g clipPath={`url(#clip-${color})`}>
                {/* Line chart */}
                <LinePath
                  data={data}
                  x={(d) => xScale(d.timestamp)}
                  y={(d) => yScale(d.value)}
                  stroke={color}
                  strokeWidth={2}
                />

                {/* Cursor line */}
                {cursorTime !== null && (
                  <line
                    x1={xScale(cursorTime)}
                    x2={xScale(cursorTime)}
                    y1={0}
                    y2={yMax}
                    stroke="#666"
                    strokeWidth={1}
                    strokeDasharray="4,4"
                    pointerEvents="none"
                  />
                )}
              </g>

              {/* Cursor value tooltip (outside clip path so it's always visible) */}
              {cursorTime !== null && cursorValue !== null && (
                <g transform={`translate(${xScale(cursorTime)}, ${yScale(cursorValue)})`}>
                  <circle r={4} fill={color} stroke="white" strokeWidth={2} />
                  {/* Background bubble for value label */}
                  <rect
                    x={8}
                    y={-24}
                    width={`${(Math.round(cursorValue).toString() + unit).length * 7.5 + 16}px`}
                    height={22}
                    rx={5}
                    fill="white"
                    stroke={color}
                    strokeWidth={1.5}
                    opacity={0.95}
                    style={{ pointerEvents: 'none' }}
                  />
                  <text
                    x={16}
                    y={-8}
                    fontSize={12}
                    fontWeight="bold"
                    fill={color}
                    style={{ pointerEvents: 'none', userSelect: 'none' }}
                  >
                    {Math.round(cursorValue)}{unit}
                  </text>
                </g>
              )}

              <AxisBottom
                top={yMax}
                scale={xScale}
                numTicks={5}
                tickFormat={(v) => {
                  const secs = Math.round(v as number);
                  const mins = Math.floor(secs / 60);
                  return `${mins}m`;
                }}
                stroke="#888"
                tickStroke="#888"
              />
              <AxisLeft
                scale={yScale}
                numTicks={5}
                tickFormat={(v) => `${Math.round(v as number)}${unit}`}
                stroke="#888"
                tickStroke="#888"
              />
            </Group>
          </svg>
        );
      }}
    </ParentSize>
  );
}
