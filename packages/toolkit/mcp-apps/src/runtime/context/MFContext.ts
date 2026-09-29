import { createContext, useContext } from 'react';
import type { ModuleFederationInstance } from '../utils/remote-types.js';

/**
 * Global Module Federation caching context.
 *
 * Manages the shared MF instance across multiple containers,
 * preventing React Hook conflicts ("Invalid hook call") when loading the same remote.
 */
export interface MFContextType {
  /** Cached MF instance (reused per remote name) */
  mfInstanceRef: { current: ModuleFederationInstance | null };
  /** Last remote name loaded (to detect remote changes) */
  lastRemoteNameRef: { current: string };
}

export const MFContext = createContext<MFContextType | null>(null);

/**
 * Hook to access MF caching utilities.
 * Must be used within a <MFProvider>.
 */
export function useMFContext(): MFContextType {
  const context = useContext(MFContext);
  if (!context) {
    throw new Error('useMFContext must be used within a <MFProvider>');
  }
  return context;
}
