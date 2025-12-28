/**
 * useAuthenticatedApi - Hook for making authenticated API calls with Clerk token
 *
 * Provides API methods (get, post, put, delete) that automatically include
 * the Clerk authentication token in the Authorization header.
 *
 * @module hooks/useAuthenticatedApi
 */
import { useCallback, useMemo } from 'react';
import { useAuth } from '@clerk/clerk-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export class ApiError extends Error {
  status: number;
  data?: unknown;

  constructor(status: number, message: string, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

interface RequestOptions extends Omit<RequestInit, 'headers'> {
  params?: Record<string, string>;
  headers?: Record<string, string>;
}

export function useAuthenticatedApi() {
  const { getToken } = useAuth();

  const request = useCallback(
    async <T>(endpoint: string, options: RequestOptions = {}): Promise<T> => {
      const { params, headers: customHeaders, ...fetchOptions } = options;

      let url = `${API_BASE_URL}${endpoint}`;

      if (params) {
        const searchParams = new URLSearchParams(params);
        url += `?${searchParams.toString()}`;
      }

      // Get auth token from Clerk
      const token = await getToken();

      const headers: HeadersInit = {
        ...customHeaders,
      };

      // Only set Content-Type to application/json if not already set and body is not FormData
      // For FormData, browser will automatically set multipart/form-data with boundary
      if (!customHeaders?.['Content-Type'] && !(fetchOptions.body instanceof FormData)) {
        (headers as Record<string, string>)['Content-Type'] = 'application/json';
      }

      if (token) {
        (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(url, {
        ...fetchOptions,
        headers,
      });

      if (!response.ok) {
        let errorData: unknown;
        try {
          errorData = await response.json();
        } catch {
          errorData = await response.text();
        }
        throw new ApiError(response.status, `API Error: ${response.statusText}`, errorData);
      }

      // Handle empty responses
      const text = await response.text();
      if (!text) {
        return {} as T;
      }

      return JSON.parse(text) as T;
    },
    [getToken]
  );

  const get = useCallback(
    <T>(endpoint: string, options?: RequestOptions): Promise<T> => {
      return request<T>(endpoint, { ...options, method: 'GET' });
    },
    [request]
  );

  const post = useCallback(
    <T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> => {
      return request<T>(endpoint, {
        ...options,
        method: 'POST',
        body: body instanceof FormData ? body : (body ? JSON.stringify(body) : undefined),
      });
    },
    [request]
  );

  const put = useCallback(
    <T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> => {
      return request<T>(endpoint, {
        ...options,
        method: 'PUT',
        body: body instanceof FormData ? body : (body ? JSON.stringify(body) : undefined),
      });
    },
    [request]
  );

  const del = useCallback(
    <T>(endpoint: string, options?: RequestOptions): Promise<T> => {
      return request<T>(endpoint, { ...options, method: 'DELETE' });
    },
    [request]
  );

  return useMemo(() => ({ get, post, put, delete: del }), [get, post, put, del]);
}
