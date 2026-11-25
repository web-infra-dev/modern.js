import type { App } from '@modelcontextprotocol/ext-apps';
import type { ViewState } from './state';

export interface EntryMcpState {
  status: 'standalone' | 'connecting' | 'connected' | 'error' | 'closed';
  app?: App;
  result?: ViewState['result'];
  resultCount: number;
  error?: string;
}
interface EntryStore {
  state: EntryMcpState;
  listeners: Set<() => void>;
}
const key = Symbol.for('modern.mcp-apps.entry');
export const standaloneState: EntryMcpState = {
  status: 'standalone',
  resultCount: 0,
};
function store(): EntryStore {
  if (typeof window === 'undefined')
    return { state: standaloneState, listeners: new Set() };
  const scope = window as unknown as Record<symbol, EntryStore | undefined>;
  return (scope[key] ??= {
    state: {
      status: window.parent === window ? 'standalone' : 'connecting',
      resultCount: 0,
    },
    listeners: new Set(),
  });
}
export function getEntryMcpState(): EntryMcpState {
  return store().state;
}
export function updateEntryMcpState(update: Partial<EntryMcpState>) {
  const current = store();
  current.state = { ...current.state, ...update };
  for (const listener of current.listeners) listener();
}
export function subscribeEntryMcpState(listener: () => void) {
  const current = store();
  current.listeners.add(listener);
  return () => {
    current.listeners.delete(listener);
  };
}
