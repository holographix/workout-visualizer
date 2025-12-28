/**
 * useWorkoutUpload Hook
 * Handles workout file uploads and parsing
 */
import { useState, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import type {
  ParsedWorkoutResult,
  ConvertedWorkout,
  SupportedFormatsResponse,
  WorkoutImportOptions,
} from '../types/workoutUpload';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface UseWorkoutUploadResult {
  // State
  isUploading: boolean;
  isParsing: boolean;
  isConverting: boolean;
  error: Error | null;
  parsedWorkout: ParsedWorkoutResult | null;
  convertedWorkout: ConvertedWorkout | null;
  supportedFormats: string[];

  // Actions
  uploadAndParse: (file: File) => Promise<ParsedWorkoutResult>;
  uploadAndConvert: (file: File, options?: WorkoutImportOptions) => Promise<ConvertedWorkout>;
  parseContent: (content: string, filename: string) => Promise<ParsedWorkoutResult>;
  convertContent: (content: string, filename: string, options?: WorkoutImportOptions) => Promise<ConvertedWorkout>;
  getSupportedFormats: () => Promise<string[]>;
  reset: () => void;
}

export function useWorkoutUpload(): UseWorkoutUploadResult {
  const { getToken } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [parsedWorkout, setParsedWorkout] = useState<ParsedWorkoutResult | null>(null);
  const [convertedWorkout, setConvertedWorkout] = useState<ConvertedWorkout | null>(null);
  const [supportedFormats, setSupportedFormats] = useState<string[]>(['.zwo', '.erg', '.mrc']);

  const getAuthHeaders = useCallback(async (): Promise<HeadersInit> => {
    const token = await getToken();
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }, [getToken]);

  const getSupportedFormats = useCallback(async (): Promise<string[]> => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/api/workout-parsers/formats`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error('Failed to fetch supported formats');
      }

      const data: SupportedFormatsResponse = await response.json();
      setSupportedFormats(data.formats);
      return data.formats;
    } catch (err) {
      console.error('Error fetching supported formats:', err);
      return supportedFormats;
    }
  }, [getAuthHeaders, supportedFormats]);

  const uploadAndParse = useCallback(async (file: File): Promise<ParsedWorkoutResult> => {
    setIsUploading(true);
    setIsParsing(true);
    setError(null);
    setParsedWorkout(null);

    try {
      const headers = await getAuthHeaders();
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_BASE_URL}/api/workout-parsers/upload`, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to parse workout file');
      }

      const data = await response.json();
      setParsedWorkout(data.parsed);
      return data.parsed;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      throw error;
    } finally {
      setIsUploading(false);
      setIsParsing(false);
    }
  }, [getAuthHeaders]);

  const uploadAndConvert = useCallback(async (
    file: File,
    options?: WorkoutImportOptions
  ): Promise<ConvertedWorkout> => {
    setIsUploading(true);
    setIsConverting(true);
    setError(null);
    setConvertedWorkout(null);

    try {
      const headers = await getAuthHeaders();
      const formData = new FormData();
      formData.append('file', file);
      if (options?.name) formData.append('name', options.name);
      if (options?.description) formData.append('description', options.description);
      if (options?.categoryId) formData.append('categoryId', options.categoryId);

      const response = await fetch(`${API_BASE_URL}/api/workout-parsers/upload-and-convert`, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to convert workout file');
      }

      const data = await response.json();
      setConvertedWorkout(data.workout);
      return data.workout;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      throw error;
    } finally {
      setIsUploading(false);
      setIsConverting(false);
    }
  }, [getAuthHeaders]);

  const parseContent = useCallback(async (
    content: string,
    filename: string
  ): Promise<ParsedWorkoutResult> => {
    setIsParsing(true);
    setError(null);
    setParsedWorkout(null);

    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/api/workout-parsers/parse`, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content, filename }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to parse workout content');
      }

      const data = await response.json();
      setParsedWorkout(data.parsed);
      return data.parsed;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      throw error;
    } finally {
      setIsParsing(false);
    }
  }, [getAuthHeaders]);

  const convertContent = useCallback(async (
    content: string,
    filename: string,
    options?: WorkoutImportOptions
  ): Promise<ConvertedWorkout> => {
    setIsConverting(true);
    setError(null);
    setConvertedWorkout(null);

    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/api/workout-parsers/convert`, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          filename,
          ...options,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to convert workout content');
      }

      const data = await response.json();
      setConvertedWorkout(data.workout);
      return data.workout;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      throw error;
    } finally {
      setIsConverting(false);
    }
  }, [getAuthHeaders]);

  const reset = useCallback(() => {
    setError(null);
    setParsedWorkout(null);
    setConvertedWorkout(null);
    setIsUploading(false);
    setIsParsing(false);
    setIsConverting(false);
  }, []);

  return {
    isUploading,
    isParsing,
    isConverting,
    error,
    parsedWorkout,
    convertedWorkout,
    supportedFormats,
    uploadAndParse,
    uploadAndConvert,
    parseContent,
    convertContent,
    getSupportedFormats,
    reset,
  };
}
