'use client';

import { useState, useEffect } from 'react';
import { useMediaQuery, useTheme, Breakpoint } from '@mui/material';

/**
 * Hydration-safe useMediaQuery hook that prevents server/client mismatch
 * 
 * @param query - Media query string or function that returns media query
 * @param options - Options for the media query
 * @returns boolean indicating if the media query matches
 */
export function useClientSafeMediaQuery(
  query: string | ((theme: any) => string),
  options?: {
    defaultMatches?: boolean;
    matchMedia?: typeof window.matchMedia;
    ssrMatchMedia?: (query: string) => { matches: boolean };
    noSsr?: boolean;
  }
): boolean {
  const theme = useTheme();
  const [isClient, setIsClient] = useState(false);
  
  // Get the actual media query string
  const mediaQuery = typeof query === 'function' ? query(theme) : query;
  
  // Use Material-UI's useMediaQuery with noSsr option to prevent hydration issues
  const matches = useMediaQuery(mediaQuery, {
    defaultMatches: options?.defaultMatches ?? false,
    noSsr: true,
    ...options
  });

  // Set client state after hydration
  useEffect(() => {
    setIsClient(true);
  }, []);

  // During SSR or before hydration, return the default value
  if (!isClient) {
    return options?.defaultMatches ?? false;
  }

  return matches;
}

/**
 * Convenience hook for common breakpoint queries
 */
export function useClientSafeBreakpoint(breakpoint: Breakpoint, direction: 'up' | 'down' | 'only' = 'down') {
  const theme = useTheme();
  
  const query = direction === 'up' 
    ? theme.breakpoints.up(breakpoint)
    : direction === 'down'
    ? theme.breakpoints.down(breakpoint) 
    : theme.breakpoints.only(breakpoint);

  return useClientSafeMediaQuery(query);
}

/**
 * Common responsive hooks
 */
export const useIsMobile = () => useClientSafeBreakpoint('md', 'down');
export const useIsTablet = () => useClientSafeBreakpoint('lg', 'down');
export const useIsDesktop = () => useClientSafeBreakpoint('lg', 'up');