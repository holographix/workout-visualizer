import { useState, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useToast } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import type {
  AthleteZonesResponse,
  PowerZoneConfig,
  HRZoneConfig,
  UpdatePowerZonesInput,
  UpdateHRZonesInput,
  UpdateAthleteZoneDataInput,
  CalculatedPowerZone,
  CalculatedHRZone,
} from '../types/zones';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface UseZonesReturn {
  loading: boolean;
  error: string | null;

  // Full zones data
  zonesData: AthleteZonesResponse | null;
  fetchZones: (athleteId: string) => Promise<AthleteZonesResponse | null>;

  // Power zones
  powerZones: PowerZoneConfig | null;
  fetchPowerZones: (athleteId: string) => Promise<PowerZoneConfig | null>;
  updatePowerZones: (
    athleteId: string,
    data: UpdatePowerZonesInput,
  ) => Promise<PowerZoneConfig | null>;

  // HR zones
  hrZones: HRZoneConfig | null;
  fetchHRZones: (athleteId: string) => Promise<HRZoneConfig | null>;
  updateHRZones: (
    athleteId: string,
    data: UpdateHRZonesInput,
  ) => Promise<HRZoneConfig | null>;

  // Athlete zone data (FTP, maxHR, restingHR)
  updateAthleteZoneData: (
    athleteId: string,
    data: UpdateAthleteZoneDataInput,
  ) => Promise<boolean>;

  // Calculate zones (without saving)
  calculatePowerZones: (
    ftp: number,
    zoneConfig?: UpdatePowerZonesInput,
  ) => Promise<CalculatedPowerZone[] | null>;
  calculateHRZones: (
    maxHR: number,
    restingHR?: number,
    method?: 'STANDARD' | 'KARVONEN',
    zoneConfig?: UpdateHRZonesInput,
  ) => Promise<CalculatedHRZone[] | null>;
}

export function useZones(): UseZonesReturn {
  const { getToken } = useAuth();
  const toast = useToast();
  const { t } = useTranslation();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [zonesData, setZonesData] = useState<AthleteZonesResponse | null>(null);
  const [powerZones, setPowerZones] = useState<PowerZoneConfig | null>(null);
  const [hrZones, setHRZones] = useState<HRZoneConfig | null>(null);

  const makeRequest = useCallback(
    async <T>(
      url: string,
      options: RequestInit = {},
    ): Promise<T | null> => {
      try {
        setLoading(true);
        setError(null);

        const token = await getToken();
        const response = await fetch(`${API_BASE}${url}`, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            ...options.headers,
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'An error occurred';
        setError(message);
        toast({
          title: t('common.error'),
          description: message,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        return null;
      } finally {
        setLoading(false);
      }
    },
    [getToken, toast, t],
  );

  // ============================================
  // FETCH COMBINED ZONES
  // ============================================

  const fetchZones = useCallback(
    async (athleteId: string): Promise<AthleteZonesResponse | null> => {
      const result = await makeRequest<{ success: boolean; data: AthleteZonesResponse }>(
        `/api/zones/${athleteId}`,
      );
      if (result?.success) {
        setZonesData(result.data);
        setPowerZones(result.data.power.config);
        setHRZones(result.data.hr.config);
        return result.data;
      }
      return null;
    },
    [makeRequest],
  );

  // ============================================
  // POWER ZONES
  // ============================================

  const fetchPowerZones = useCallback(
    async (athleteId: string): Promise<PowerZoneConfig | null> => {
      const result = await makeRequest<{ success: boolean; zones: PowerZoneConfig }>(
        `/api/zones/${athleteId}/power`,
      );
      if (result?.success) {
        setPowerZones(result.zones);
        return result.zones;
      }
      return null;
    },
    [makeRequest],
  );

  const updatePowerZones = useCallback(
    async (
      athleteId: string,
      data: UpdatePowerZonesInput,
    ): Promise<PowerZoneConfig | null> => {
      const result = await makeRequest<{ success: boolean; zones: PowerZoneConfig }>(
        `/api/zones/${athleteId}/power`,
        {
          method: 'PUT',
          body: JSON.stringify(data),
        },
      );
      if (result?.success) {
        setPowerZones(result.zones);
        toast({
          title: t('zones.powerZonesUpdated'),
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        return result.zones;
      }
      return null;
    },
    [makeRequest, toast, t],
  );

  // ============================================
  // HR ZONES
  // ============================================

  const fetchHRZones = useCallback(
    async (athleteId: string): Promise<HRZoneConfig | null> => {
      const result = await makeRequest<{ success: boolean; zones: HRZoneConfig }>(
        `/api/zones/${athleteId}/hr`,
      );
      if (result?.success) {
        setHRZones(result.zones);
        return result.zones;
      }
      return null;
    },
    [makeRequest],
  );

  const updateHRZones = useCallback(
    async (
      athleteId: string,
      data: UpdateHRZonesInput,
    ): Promise<HRZoneConfig | null> => {
      const result = await makeRequest<{ success: boolean; zones: HRZoneConfig }>(
        `/api/zones/${athleteId}/hr`,
        {
          method: 'PUT',
          body: JSON.stringify(data),
        },
      );
      if (result?.success) {
        setHRZones(result.zones);
        toast({
          title: t('zones.hrZonesUpdated'),
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        return result.zones;
      }
      return null;
    },
    [makeRequest, toast, t],
  );

  // ============================================
  // UPDATE ATHLETE ZONE DATA
  // ============================================

  const updateAthleteZoneData = useCallback(
    async (
      athleteId: string,
      data: UpdateAthleteZoneDataInput,
    ): Promise<boolean> => {
      const result = await makeRequest<{ success: boolean }>(
        `/api/zones/${athleteId}/data`,
        {
          method: 'PUT',
          body: JSON.stringify(data),
        },
      );
      if (result?.success) {
        toast({
          title: t('zones.athleteDataUpdated'),
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        return true;
      }
      return false;
    },
    [makeRequest, toast, t],
  );

  // ============================================
  // CALCULATE ZONES (NO SAVE)
  // ============================================

  const calculatePowerZones = useCallback(
    async (
      ftp: number,
      zoneConfig?: UpdatePowerZonesInput,
    ): Promise<CalculatedPowerZone[] | null> => {
      const result = await makeRequest<{ success: boolean; zones: CalculatedPowerZone[] }>(
        '/api/zones/calculate/power',
        {
          method: 'POST',
          body: JSON.stringify({ ftp, zoneConfig }),
        },
      );
      return result?.success ? result.zones : null;
    },
    [makeRequest],
  );

  const calculateHRZones = useCallback(
    async (
      maxHR: number,
      restingHR?: number,
      method: 'STANDARD' | 'KARVONEN' = 'STANDARD',
      zoneConfig?: UpdateHRZonesInput,
    ): Promise<CalculatedHRZone[] | null> => {
      const result = await makeRequest<{ success: boolean; zones: CalculatedHRZone[] }>(
        '/api/zones/calculate/hr',
        {
          method: 'POST',
          body: JSON.stringify({ maxHR, restingHR, method, zoneConfig }),
        },
      );
      return result?.success ? result.zones : null;
    },
    [makeRequest],
  );

  return {
    loading,
    error,
    zonesData,
    fetchZones,
    powerZones,
    fetchPowerZones,
    updatePowerZones,
    hrZones,
    fetchHRZones,
    updateHRZones,
    updateAthleteZoneData,
    calculatePowerZones,
    calculateHRZones,
  };
}
