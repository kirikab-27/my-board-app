'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type { LoadingStateHook, LoadingMetrics } from '@/types/loading';

/**
 * ローディング状態管理フック
 * 複数の非同期処理のローディング状態を統合管理
 */
export const useLoadingState = (initialLoading: boolean = false): LoadingStateHook & {
  metrics: LoadingMetrics | null;
} => {
  const [isLoading, setIsLoading] = useState(initialLoading);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<LoadingMetrics | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const startLoading = useCallback((reason?: string) => {
    setIsLoading(true);
    setError(null);
    startTimeRef.current = Date.now();
    setMetrics({
      startTime: startTimeRef.current,
      reason
    });
  }, []);

  const stopLoading = useCallback(() => {
    const endTime = Date.now();
    if (startTimeRef.current) {
      setMetrics(prev => prev ? {
        ...prev,
        endTime,
        duration: endTime - prev.startTime
      } : null);
    }
    setIsLoading(false);
  }, []);

  const reset = useCallback(() => {
    setIsLoading(false);
    setError(null);
    setMetrics(null);
    startTimeRef.current = null;
  }, []);

  return {
    isLoading,
    error,
    startLoading,
    stopLoading,
    setError,
    reset,
    metrics
  };
};

/**
 * 複数のローディング状態を管理するフック
 */
export const useMultipleLoadingState = () => {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const setLoading = useCallback((key: string, loading: boolean) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: loading
    }));

    // ローディング開始時はエラーをクリア
    if (loading) {
      setErrors(prev => {
        const { [key]: __, ...rest } = prev;
        return rest;
      });
    }
  }, []);

  const setError = useCallback((key: string, error: string | null) => {
    if (error) {
      setErrors(prev => ({
        ...prev,
        [key]: error
      }));
    } else {
      setErrors(prev => {
        const { [key]: __, ...rest } = prev;
        return rest;
      });
    }
    
    // エラー設定時はローディングを停止
    if (error) {
      setLoading(key, false);
    }
  }, [setLoading]);

  const isAnyLoading = Object.values(loadingStates).some(Boolean);
  const hasAnyError = Object.keys(errors).length > 0;
  const allErrors = Object.values(errors);

  const reset = useCallback((key?: string) => {
    if (key) {
      setLoadingStates(prev => {
        const { [key]: __, ...rest } = prev;
        return rest;
      });
      setErrors(prev => {
        const { [key]: __, ...rest } = prev;
        return rest;
      });
    } else {
      setLoadingStates({});
      setErrors({});
    }
  }, []);

  return {
    loadingStates,
    errors,
    setLoading,
    setError,
    reset,
    isAnyLoading,
    hasAnyError,
    allErrors
  };
};

/**
 * 非同期処理をラップしてローディング状態を管理するフック
 */
export const useAsyncOperation = () => {
  const { isLoading, error, startLoading, stopLoading, setError, reset, metrics } = useLoadingState();

  const execute = useCallback(async <T>(
    operation: () => Promise<T>,
    options?: {
      onSuccess?: (result: T) => void;
      onError?: (error: Error) => void;
      reason?: string;
    }
  ): Promise<T | null> => {
    try {
      startLoading(options?.reason);
      const result = await operation();
      stopLoading();
      options?.onSuccess?.(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error.message);
      options?.onError?.(error);
      return null;
    }
  }, [startLoading, stopLoading, setError]);

  return {
    execute,
    isLoading,
    error,
    reset,
    metrics
  };
};

/**
 * タイムアウト付きローディングフック
 */
export const useLoadingWithTimeout = (
  timeoutMs: number = 10000,
  onTimeout?: () => void
) => {
  const { isLoading, error, startLoading, stopLoading, setError, reset, metrics } = useLoadingState();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const startLoadingWithTimeout = useCallback((reason?: string) => {
    startLoading(reason);
    
    // タイムアウトを設定
    timeoutRef.current = setTimeout(() => {
      setError('処理がタイムアウトしました');
      onTimeout?.();
    }, timeoutMs);
  }, [startLoading, setError, timeoutMs, onTimeout]);

  const stopLoadingWithTimeout = useCallback(() => {
    // タイムアウトをクリア
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    stopLoading();
  }, [stopLoading]);

  const resetWithTimeout = useCallback(() => {
    // タイムアウトをクリア
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    reset();
  }, [reset]);

  // コンポーネントアンマウント時にタイムアウトをクリア
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    isLoading,
    error,
    startLoading: startLoadingWithTimeout,
    stopLoading: stopLoadingWithTimeout,
    setError,
    reset: resetWithTimeout,
    metrics
  };
};

/**
 * デバウンス付きローディング状態フック
 */
export const useDebouncedLoading = (delay: number = 200) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const startLoading = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      setIsLoading(true);
      setError(null);
    }, delay);
  }, [delay]);

  const stopLoading = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    setIsLoading(false);
  }, []);

  const reset = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    setIsLoading(false);
    setError(null);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return {
    isLoading,
    error,
    startLoading,
    stopLoading,
    setError,
    reset
  };
};