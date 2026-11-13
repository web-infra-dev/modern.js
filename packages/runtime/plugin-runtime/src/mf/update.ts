export interface RemoteUpdateTarget {
  name: string;
  entry: string;
  type?: string;
  entryGlobalName?: string;
  client?: { entry: string; type?: string; entryGlobalName?: string };
  /** Fresh manifest or provider module information supplied by the caller. */
  moduleInfo?: Record<string, unknown>;
}
export interface RemoteUpdateOptions {
  signal?: AbortSignal;
  revalidate?: boolean;
  /** Select a service explicitly when several applications share a process. */
  application?: string;
  defer?: 'after-response';
}
export interface RemoteUpdateReceipt {
  operationId: string;
  revision: number;
  phase: 'scheduled' | 'pending' | 'applied';
}
export interface RemoteUpdateResult {
  operationId: string;
  changed: boolean;
  generation?: number;
  mode?: 'entries' | 'application';
  entries?: string[];
  reasons?: string[];
}
function manager(application?: string): any {
  const protocol = (globalThis as any)[
    Symbol.for('modern-js.mf.ssr.update-manager')
  ];
  const matches = application
    ? [...(protocol?.applications.values() || [])].filter(
        (manager: any) => manager.name === application,
      )
    : [];
  const current = protocol?.context.getStore();
  if (matches.length > 1 && current?.name !== application)
    throw new Error(
      `Multiple SSR applications are named '${application}'; call this API inside the owning request context or use unique application names`,
    );
  const selected = application
    ? current?.name === application
      ? current
      : matches[0]
    : current ||
      (protocol?.applications.size === 1
        ? protocol.applications.values().next().value
        : undefined);
  if (!selected)
    throw new Error(
      protocol?.applications.size > 1
        ? 'Multiple SSR applications are active; select an application outside its request context'
        : 'No Modern SSR update manager is available',
    );
  return selected;
}
/** Check candidate deployment data without mutating the active runtime. */
export async function shouldUpdateRemote(
  remote: RemoteUpdateTarget,
  options: Omit<RemoteUpdateOptions, 'defer'> = {},
): Promise<boolean> {
  return manager(options.application).shouldUpdateRemote(remote, options);
}
export function updateRemotes(
  remotes: RemoteUpdateTarget[],
  options: RemoteUpdateOptions & { defer: 'after-response' },
): RemoteUpdateReceipt;
export function updateRemotes(
  remotes: RemoteUpdateTarget[],
  options?: RemoteUpdateOptions & { defer?: undefined },
): Promise<RemoteUpdateResult>;
export function updateRemotes(
  remotes: RemoteUpdateTarget[],
  options: RemoteUpdateOptions = {},
): Promise<RemoteUpdateResult> | RemoteUpdateReceipt {
  try {
    return manager(options.application).updateRemotes(remotes, options);
  } catch (error) {
    if (options.defer) throw error;
    return Promise.reject(error);
  }
}
