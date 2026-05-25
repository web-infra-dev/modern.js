import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';

export type RuntimeEvent = {
  id: string;
  type: string;
  source?: string;
  status?: string;
  message: string;
  timestamp: string;
  details?: unknown;
};

export type ActionDescriptor = {
  id: string;
  label: string;
  kind: 'navigation' | 'click' | 'input' | 'retry' | 'custom';
  enabled: boolean;
  reason?: string | null;
  payloadSchema?: unknown;
};

export type DemoSnapshot = {
  caseId: string;
  page: Record<string, unknown>;
  route: Record<string, unknown>;
  loaders?: Record<string, unknown>[];
  components?: Record<string, unknown>[];
  build?: Record<string, unknown>;
  shared?: Record<string, unknown>;
  garfish?: Record<string, unknown>;
  dependencySources?: Record<string, unknown>[];
  proxy?: Record<string, unknown>;
  actions: ActionDescriptor[];
  errors: Record<string, unknown>[];
};

export type DemoRuntime = {
  getSnapshot: () => DemoSnapshot;
  getEvents: (filter?: Partial<RuntimeEvent>) => RuntimeEvent[];
  waitForEvent: (
    filter?: Partial<RuntimeEvent>,
    options?: { timeout?: number },
  ) => Promise<RuntimeEvent>;
  subscribeEvents: (
    filter: Partial<RuntimeEvent> | undefined,
    listener: (event: RuntimeEvent) => void,
  ) => () => void;
  getActions: (filter?: Partial<ActionDescriptor>) => ActionDescriptor[];
  runAction: (actionId: string, payload?: unknown) => Promise<unknown>;
};

type RuntimeHandlerContext = {
  snapshot: DemoSnapshot;
  emit: (event: Omit<RuntimeEvent, 'id' | 'timestamp'>) => RuntimeEvent;
  setSnapshot: (patch: Partial<DemoSnapshot>) => DemoSnapshot;
};

export type RuntimeHandlers = Record<
  string,
  (
    context: RuntimeHandlerContext,
    payload?: unknown,
  ) => Partial<DemoSnapshot> | void
>;

declare global {
  interface Window {
    __AGENT_RUNTIME__?: DemoRuntime;
  }
}

const now = () => new Date().toISOString();
const eventId = (type: string) =>
  `${type}-${Math.random().toString(36).slice(2, 10)}`;

const matchFilter = <T extends object>(
  item: T,
  filter: Partial<T> = {},
) =>
  Object.entries(filter).every(([key, value]) => {
    if (value === undefined || value === null) {
      return true;
    }
    return (item as Record<string, unknown>)[key] === value;
  });

const mergeSnapshot = (
  snapshot: DemoSnapshot,
  patch: Partial<DemoSnapshot>,
): DemoSnapshot => ({
  ...snapshot,
  ...patch,
  page: { ...snapshot.page, ...patch.page },
  route: { ...snapshot.route, ...patch.route },
  build: { ...(snapshot.build ?? {}), ...(patch.build ?? {}) },
  shared: { ...(snapshot.shared ?? {}), ...(patch.shared ?? {}) },
  garfish: { ...(snapshot.garfish ?? {}), ...(patch.garfish ?? {}) },
  proxy: { ...(snapshot.proxy ?? {}), ...(patch.proxy ?? {}) },
});

export const createDemoRuntime = (
  initialSnapshot: DemoSnapshot,
  initialEvents: RuntimeEvent[],
  handlers: RuntimeHandlers,
  onChange: (snapshot: DemoSnapshot, events: RuntimeEvent[]) => void,
): DemoRuntime => {
  let snapshot = initialSnapshot;
  let events = [...initialEvents];
  const listeners = new Set<{
    filter?: Partial<RuntimeEvent>;
    listener: (event: RuntimeEvent) => void;
  }>();

  const emit = (event: Omit<RuntimeEvent, 'id' | 'timestamp'>) => {
    const next = {
      id: eventId(event.type),
      timestamp: now(),
      ...event,
    };
    events = [...events, next];
    for (const entry of listeners) {
      if (matchFilter(next, entry.filter)) {
        entry.listener(next);
      }
    }
    onChange(snapshot, events);
    return next;
  };

  const setSnapshot = (patch: Partial<DemoSnapshot>) => {
    snapshot = mergeSnapshot(snapshot, patch);
    onChange(snapshot, events);
    return snapshot;
  };

  return {
    getSnapshot: () => snapshot,
    getEvents: (filter) => events.filter(event => matchFilter(event, filter)),
    waitForEvent: (filter, options = {}) => {
      const matched = events.find(event => matchFilter(event, filter));
      if (matched) {
        return Promise.resolve(matched);
      }
      const timeout = options.timeout ?? 5000;
      return new Promise((resolve, reject) => {
        const timer = globalThis.setTimeout(() => {
          unsubscribe();
          reject(new Error(`Timed out waiting for ${JSON.stringify(filter)}`));
        }, timeout);
        const unsubscribe = ((): (() => void) => {
          const entry = {
            filter,
            listener: (event: RuntimeEvent) => {
              globalThis.clearTimeout(timer);
              unsubscribe();
              resolve(event);
            },
          };
          listeners.add(entry);
          return () => listeners.delete(entry);
        })();
      });
    },
    subscribeEvents: (filter, listener) => {
      const entry = { filter, listener };
      listeners.add(entry);
      return () => listeners.delete(entry);
    },
    getActions: (filter) =>
      snapshot.actions.filter(action => matchFilter(action, filter)),
    runAction: async (actionId, payload) => {
      const action = snapshot.actions.find(item => item.id === actionId);
      if (!action) {
        throw new Error(`Unknown action: ${actionId}`);
      }
      if (!action.enabled) {
        throw new Error(action.reason || `Action is disabled: ${actionId}`);
      }
      emit({
        type: 'action.start',
        source: 'consumer',
        status: 'pending',
        message: action.label,
        details: { actionId, payload },
      });
      const patch = handlers[actionId]?.({ snapshot, emit, setSnapshot }, payload);
      if (patch) {
        setSnapshot(patch);
      }
      emit({
        type: 'action.success',
        source: 'consumer',
        status: 'success',
        message: action.label,
        details: { actionId },
      });
      return { actionId, snapshot };
    },
  };
};

export const useDemoRuntime = (
  initialSnapshot: DemoSnapshot,
  initialEvents: RuntimeEvent[],
  handlers: RuntimeHandlers = {},
) => {
  const [snapshot, setSnapshotState] = useState(initialSnapshot);
  const [events, setEvents] = useState(initialEvents);
  const runtime = useMemo(
    () =>
      createDemoRuntime(initialSnapshot, initialEvents, handlers, (next, all) => {
        setSnapshotState(next);
        setEvents([...all]);
      }),
    [],
  );

  useEffect(() => {
    window.__AGENT_RUNTIME__ = runtime;
    return () => {
      if (window.__AGENT_RUNTIME__ === runtime) {
        delete window.__AGENT_RUNTIME__;
      }
    };
  }, [runtime]);

  return { snapshot, events, runtime };
};

const card: CSSProperties = {
  border: '1px solid #d8dee4',
  borderRadius: 8,
  padding: 16,
  background: '#fff',
};

export function AgentRuntimePanel({
  title,
  description,
  snapshot,
  events,
  runtime,
  remoteSlot,
}: {
  title: string;
  description: string;
  snapshot: DemoSnapshot;
  events: RuntimeEvent[];
  runtime: DemoRuntime;
  remoteSlot: ReactNode;
}) {
  const [lastResult, setLastResult] = useState('No action has run yet.');

  const run = async (actionId: string) => {
    try {
      const result = await runtime.runAction(actionId);
      setLastResult(JSON.stringify(result, null, 2));
    } catch (error) {
      setLastResult(error instanceof Error ? error.message : String(error));
    }
  };

  return (
    <main
      style={{
        minHeight: '100vh',
        padding: 24,
        background: '#f6f8fa',
        color: '#24292f',
        fontFamily:
          'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <header style={{ marginBottom: 20 }}>
        <h1 style={{ margin: '0 0 8px', fontSize: 28 }}>{title}</h1>
        <p style={{ margin: 0, maxWidth: 820, color: '#57606a' }}>
          {description}
        </p>
      </header>

      <section
        style={{
          display: 'grid',
          gap: 16,
          gridTemplateColumns: 'minmax(280px, 0.85fr) minmax(360px, 1.15fr)',
          alignItems: 'start',
        }}
      >
        <div style={{ display: 'grid', gap: 16 }}>
          <div style={card}>
            <h2 style={{ marginTop: 0, fontSize: 18 }}>Remote Provider</h2>
            {remoteSlot}
          </div>
          <div style={card}>
            <h2 style={{ marginTop: 0, fontSize: 18 }}>Actions</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {snapshot.actions.map(action => (
                <button
                  key={action.id}
                  type="button"
                  disabled={!action.enabled}
                  onClick={() => run(action.id)}
                  style={{
                    padding: '8px 10px',
                    border: '1px solid #8c959f',
                    borderRadius: 6,
                    background: action.enabled ? '#f6f8fa' : '#eaeef2',
                    cursor: action.enabled ? 'pointer' : 'not-allowed',
                  }}
                >
                  {action.label}
                </button>
              ))}
            </div>
            <pre data-testid="agent-action-result">{lastResult}</pre>
          </div>
        </div>

        <div style={{ display: 'grid', gap: 16 }}>
          <div style={card}>
            <h2 style={{ marginTop: 0, fontSize: 18 }}>Snapshot</h2>
            <pre
              data-testid="agent-snapshot"
              style={{ overflow: 'auto', maxHeight: 420 }}
            >
              {JSON.stringify(snapshot, null, 2)}
            </pre>
          </div>
          <div style={card}>
            <h2 style={{ marginTop: 0, fontSize: 18 }}>Events</h2>
            <pre
              data-testid="agent-events"
              style={{ overflow: 'auto', maxHeight: 260 }}
            >
              {JSON.stringify(events, null, 2)}
            </pre>
          </div>
        </div>
      </section>
    </main>
  );
}
