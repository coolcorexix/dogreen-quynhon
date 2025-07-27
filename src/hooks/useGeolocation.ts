import { useState, useCallback, useRef } from 'react';
import { UserLocation } from '../types/map';
import { geolocationService } from '../services/geolocationService';

interface UseGeolocationReturn {
  location: UserLocation | null;
  error: string | null;
  isLoading: boolean;
  getCurrentLocation: () => Promise<void>;
  clearError: () => void;
  isSupported: boolean;
}

export const useGeolocation = (): UseGeolocationReturn => {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const getCurrentLocation = useCallback(async () => {
    // Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    setError(null);

    try {
      const userLocation = await geolocationService.getCurrentLocation();
      
      // Check if request was aborted
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      setLocation(userLocation);
    } catch (err) {
      // Check if request was aborted
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      const errorMessage = err instanceof Error ? err.message : 'Failed to get location';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const isSupported = geolocationService.isSupported();

  return {
    location,
    error,
    isLoading,
    getCurrentLocation,
    clearError,
    isSupported
  };
};