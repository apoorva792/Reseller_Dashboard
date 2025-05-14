import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';

interface ApiOptions<T> {
  initialData?: T;
  deps?: any[];
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  skip?: boolean;
}

export function useApi<T>(
  apiCall: () => Promise<T>,
  options: ApiOptions<T> = {}
) {
  const { initialData, deps = [], onSuccess, onError, skip = false } = options;
  const [data, setData] = useState<T | undefined>(initialData);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(!skip);
  const { user } = useAuth();

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      if (skip) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const result = await apiCall();
        
        if (isMounted) {
          setData(result);
          setIsLoading(false);
          onSuccess?.(result);
        }
      } catch (err) {
        if (isMounted) {
          const error = err instanceof Error ? err : new Error('An unknown error occurred');
          setError(error);
          setIsLoading(false);
          onError?.(error);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [apiCall, ...deps, skip, user?.customer_id]);

  const refetch = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await apiCall();
      setData(result);
      setIsLoading(false);
      onSuccess?.(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('An unknown error occurred');
      setError(error);
      setIsLoading(false);
      onError?.(error);
      throw error;
    }
  };

  return { data, error, isLoading, refetch };
}

export default useApi; 