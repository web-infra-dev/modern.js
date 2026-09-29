import type React from 'react';
import { useRef } from 'react';
import type { ModuleFederationInstance } from '../utils/remote-types.js';
import { MFContext, type MFContextType } from './MFContext.js';

interface MFProviderProps {
  children: React.ReactNode;
}

/**
 * Provider component for global Module Federation caching.
 *
 * Wraps your application to share the MF instance cache
 * across all <RemoteComponentContainer> components. This prevents:
 * - React Hook conflicts ("Invalid hook call") when reusing the same remote
 * - Duplicate MF instance creation
 *
 * Usage:
 * ```tsx
 * <MFProvider>
 *   <App />
 * </MFProvider>
 * ```
 */
export function MFProvider({ children }: MFProviderProps) {
  const mfInstanceRef = useRef<ModuleFederationInstance | null>(null);
  const lastRemoteNameRef = useRef<string>('');

  const contextValue: MFContextType = {
    mfInstanceRef,
    lastRemoteNameRef,
  };

  return (
    <MFContext.Provider value={contextValue}>{children}</MFContext.Provider>
  );
}
