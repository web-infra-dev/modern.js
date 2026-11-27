import { useSyncExternalStore } from 'react';
import {
  getEntryMcpState,
  subscribeEntryMcpState,
  standaloneState,
} from './entry-state';
export type { EntryMcpState } from './entry-state';

/** Reuse the connection injected into an existing application entry. */
export function useEntryMcpApp() {
  return useSyncExternalStore(
    subscribeEntryMcpState,
    getEntryMcpState,
    () => standaloneState,
  );
}
