import { AsyncLocalStorage } from 'node:async_hooks';
import type { ServerPlugin, ServerContext } from '@modern-js/server-core';
import type {
  SSRApplication,
  SSRCoordinatorEvent,
  SSRResourceApplicationOptions,
  SSRRequestCoordinatorOptions,
  SSRApplicationOptions,
} from '@modern-js/server-core/node';
import type { GlobalModuleInfo } from '@module-federation/sdk';
import {
  createSSRUpdateAdapter,
  type SSRRemoteReplacement,
  type SSRUpdateOptions,
  type SSRUpdateReceipt,
} from './ssrUpdate';
import type { RemoteCheckOptions } from './remoteUpdate';
import { createSSRUpdateOwner } from './ssrUpdateOwner';
import { anyAbortSignal } from '../ssr-runtime/devManifestWait';
import { createMFSSRLogger } from './ssrLogger';

const key = Symbol.for('modern-js.mf.ssr.update-manager');
type Registry = {
  applications: Map<string, SSRUpdateManager>;
  context: AsyncLocalStorage<SSRUpdateManager>;
};
function registry(): Registry {
  return ((globalThis as any)[key] ||= {
    applications: new Map(),
    context: new AsyncLocalStorage(),
  });
}
export interface SSRUpdateManager {
  name: string;
  shouldUpdateRemote(
    remote: SSRRemoteReplacement | GlobalModuleInfo,
    options?: RemoteCheckOptions,
  ): Promise<boolean>;
  updateRemotes(
    remotes: SSRRemoteReplacement[] | GlobalModuleInfo,
    options: SSRUpdateOptions & { defer: 'after-response' },
  ): SSRUpdateReceipt;
  updateRemotes(
    remotes: SSRRemoteReplacement[] | GlobalModuleInfo,
    options?: SSRUpdateOptions & { defer?: undefined },
  ): Promise<any>;
  status(): unknown;
  refresh(invalidate: () => void | Promise<void>): Promise<number>;
  close(): Promise<void>;
}
export interface SSRUpdateParticipant {
  invalidate(remotes: SSRRemoteReplacement[]): void | Promise<void>;
  prepare?(): void | Promise<void>;
  dispose?(): void | Promise<void>;
}
export interface SSRUpdateServerPluginOptions extends Omit<
  Parameters<typeof createSSRUpdateAdapter>[0],
  'entries'
> {
  entries?: string[];
  application?: Partial<SSRRequestCoordinatorOptions> &
    Pick<SSRApplicationOptions, 'resolveScope'>;
  beforeRequest?: (request: Request) => Promise<void | Response>;
  transformTemplates?: (
    templates: Record<string, string>,
  ) => Record<string, string>;
  onAvailabilityChange?: (available: boolean) => void;
  onReady?: (
    manager: SSRUpdateManager,
    context: any,
  ) => void | (() => void | Promise<void>);
}

/** One service-lifetime manager, independent of evaluated application bundles. */
export function createSSRUpdateServerPlugin(
  options: SSRUpdateServerPluginOptions,
): ServerPlugin {
  return {
    name: '@modern-js/module-federation/ssr-update-owner',
    setup(api) {
      api.onPrepare(() => {
        const context = api.getServerContext() as ServerContext;
        const participants: SSRUpdateParticipant[] =
          (context.ssrUpdateParticipants ||= []);
        let closed = false;
        let closing: Promise<void> | undefined;
        const refreshes = new Set<Promise<number>>();
        let cleanup: void | (() => void | Promise<void>);
        let manager: SSRUpdateManager | undefined;
        api.updateServerContext({ ssrUpdateParticipants: participants });
        const lifetime = new AbortController();
        const owner = createSSRUpdateOwner(options.name);
        api.updateServerContext({ ssrUpdateOwnerId: owner.id });
        const logMode = options.mode ?? (context.dev ? 'dev' : 'prod');
        const ssrLog = createMFSSRLogger({
          app: options.name,
          mode: logMode,
          logger: options.logger,
        });
        const adapter = createSSRUpdateAdapter({
          ...options,
          owner,
          mode: logMode,
          maxPendingUpdates: options.application?.maxPendingUpdates,
          entries: options.entries || [
            ...new Set<string>(
              context.routes
                .filter((route: any) => route.isSSR)
                .map((route: any) => route.entryName || 'main'),
            ),
          ],
          invalidate: async remotes => {
            await options.invalidate?.(remotes);
            for (const participant of participants)
              await participant.invalidate(remotes);
          },
        });
        const withSignal = (input: RemoteCheckOptions = {}) => ({
          ...input,
          signal: input.signal
            ? anyAbortSignal([input.signal, lifetime.signal])
            : lifetime.signal,
        });
        const run = <T>(operation: () => T): T =>
          adapter.run(() =>
            manager ? registry().context.run(manager, operation) : operation(),
          );
        const onCoordinatorEvent = (event: SSRCoordinatorEvent) => {
          ssrLog.coordinatorEvent(event);
          if (options.application?.onEvent) {
            try {
              options.application.onEvent(event);
            } catch {
              // Isolate user observer errors from internal coordination logging.
            }
          }
        };
        const resourceOptions: SSRResourceApplicationOptions & {
          run: typeof run;
        } = {
          maxPendingRequests: 100,
          requestTimeoutMs: 30_000,
          drainTimeoutMs: 30_000,
          ...options.application,
          onEvent: onCoordinatorEvent,
          onInitialError: context.dev
            ? error =>
                ssrLog.updateFailed({
                  mode: 'dev',
                  stage: 'init',
                  phase: 'unavailable',
                  error,
                })
            : undefined,
          onAvailabilityChange: options.onAvailabilityChange,
          beforeRequest: options.beforeRequest,
          reloadEntry: entry => adapter.reload(entry),
          dispose: (_resources, entries) => adapter.dispose(entries),
          validate: async resources => {
            adapter.prepareResources(resources);
            if (context.dev && options.transformTemplates)
              resources.templates = options.transformTemplates(
                resources.templates,
              );
            for (const participant of participants)
              await participant.prepare?.();
          },
          onReady(application: SSRApplication) {
            manager = {
              name: options.name,
              shouldUpdateRemote: (remote, input) =>
                adapter.shouldUpdateRemote(
                  application,
                  remote,
                  withSignal(input),
                ),
              updateRemotes: ((
                remotes: SSRRemoteReplacement[] | GlobalModuleInfo,
                input?: SSRUpdateOptions,
              ) => {
                if (closed) {
                  const error = new Error('SSR update manager is closed');
                  if (input?.defer) throw error;
                  return Promise.reject(error);
                }
                return adapter.updateRemotes(application, remotes, {
                  ...input,
                  ...withSignal(input),
                });
              }) as SSRUpdateManager['updateRemotes'],
              status: () => adapter.status(application),
              refresh: invalidate => {
                if (closed)
                  return Promise.reject(
                    new Error('SSR update manager is closed'),
                  );
                const operation = application.update(async () => {
                  await invalidate();
                  for (const participant of participants)
                    await participant.invalidate([]);
                });
                refreshes.add(operation);
                void operation.then(
                  () => refreshes.delete(operation),
                  () => refreshes.delete(operation),
                );
                return operation;
              },
              close() {
                if (closing) return closing;
                closed = true;
                ssrLog.dispose();
                lifetime.abort(new Error('SSR update manager is closed'));
                closing = (async () => {
                  const errors: unknown[] = [];
                  // Stop notifications and let already-entered publications finish
                  // before releasing the state they can still recreate.
                  try {
                    await cleanup?.();
                  } catch (error) {
                    errors.push(error);
                  }
                  await adapter.whenIdle(application);
                  await Promise.allSettled([...refreshes]);
                  // Do not release handlers or provider runtimes on drain timeout.
                  await (
                    application as SSRApplication & { close(): Promise<void> }
                  ).close();
                  for (const participant of participants) {
                    try {
                      await participant.dispose?.();
                    } catch (error) {
                      errors.push(error);
                    }
                  }
                  try {
                    await adapter.dispose(undefined, {
                      preserveRemotes: false,
                    });
                  } catch (error) {
                    errors.push(error);
                  }
                  registry().applications.delete(owner.id);
                  if (errors.length)
                    throw new AggregateError(
                      errors,
                      'SSR update manager cleanup failed',
                    );
                })().catch(error => {
                  closing = undefined;
                  throw error;
                });
                return closing;
              },
            };
            registry().applications.set(owner.id, manager);
            context.ssrUpdateManager = manager;
            api.updateServerContext({ ssrUpdateManager: manager });
            cleanup = options.onReady?.(manager, api.getServerContext());
          },
          run,
        };
        context.ssrApplication = resourceOptions;
        context.onServerClose ||= [];
        context.onServerClose.push(() => manager?.close());
        api.updateServerContext({
          ssrApplication: resourceOptions,
          onServerClose: context.onServerClose,
        });
      });
    },
  };
}
