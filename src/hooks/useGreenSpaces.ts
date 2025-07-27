import { useState, useCallback, useRef, useEffect } from 'react';
import { GreenSpace, MapBounds } from '../types/map';
import { osmService } from '../services/osmService';

interface UseGreenSpacesReturn {
  greenSpaces: GreenSpace[];
  isLoading: boolean;
  error: string | null;
  fetchGreenSpaces: (bounds: MapBounds) => Promise<void>;
  clearError: () => void;
  retryFetch: () => Promise<void>;
}

export const useGreenSpaces = (): UseGreenSpacesReturn => {
  const [greenSpaces, setGreenSpaces] = useState<GreenSpace[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastBoundsRef = useRef<MapBounds | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchGreenSpaces = useCallback(async (bounds: MapBounds) => {
    // Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    setError(null);
    lastBoundsRef.current = bounds;

    try {
      const spaces = await osmService.fetchGreenSpaces(bounds);
      
      // Check if request was aborted
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      setGreenSpaces(spaces);
      
      // Log successful data fetch for analytics
      console.log('Green spaces loaded:', {
        count: spaces.length,
        bounds,
        timestamp: new Date().toISOString()
      });
      
    } catch (err) {
      // Check if request was aborted
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      const errorMessage = err instanceof Error ? err.message : 'Failed to load green spaces';
      setError(errorMessage);
      
      // Log error for analytics
      console.error('Green spaces fetch error:', {
        error: errorMessage,
        bounds,
        timestamp: new Date().toISOString()
      });
      
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, []);

  const retryFetch = useCallback(async () => {
    if (lastBoundsRef.current) {
      await fetchGreenSpaces(lastBoundsRef.current);
    }
  }, [fetchGreenSpaces]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    greenSpaces,
    isLoading,
    error,
    fetchGreenSpaces,
    clearError,
    retryFetch
  };
};