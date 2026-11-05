import { disposeAfterError, disposeResources } from './cleanup';
import type React from 'react';
import {
  getInitialContext,
  type TInternalRuntimeContext,
} from '../context/runtime';
import {
  instanceRoutes,
  type ApplicationDefinition,
  type InstanceRouteDecorator,
} from './definition';

export interface ApplicationEnvironment {
  isBrowser: boolean;
  output: 'document' | 'fragment';
  initialUrl: string;
  basename?: string;
  memory?: boolean;
  getDataUrl?: (url: URL) => URL;
  context?: Partial<TInternalRuntimeContext>;
  signal?: AbortSignal;
  onError?: (error: unknown) => void;
  /** A precomposed root supplied by the low-level render(element) API. */
  root?: React.ComponentType<any>;
  /** Decorate the current instance's route nodes for its platform adapter. */
  decorateRoute?: InstanceRouteDecorator;
}

/** The same owner and preparation sequence for pages, fragments and requests. */
export function createApplicationInstance(
  definition: ApplicationDefinition,
  environment: ApplicationEnvironment,
) {
  const context = Object.assign(
    getInitialContext(environment.isBrowser),
    { ssr: !environment.isBrowser },
    environment.context,
  );
  context.routeManifest ??= definition.getRouteManifest?.() || {
    routeAssets: {},
  };
  context.application = {
    output: environment.output,
    selected: definition.selected,
    enableRsc: definition.enableRsc,
    isRscClient: definition.isRscClient,
    entryPath:
      environment.output === 'fragment' ? '' : definition.basename || '',
    config: {
      routes:
        definition.routes &&
        instanceRoutes(definition, environment.decorateRoute),
      globalApp: definition.globalApp,
    },
    initialUrl: environment.initialUrl,
    basename: environment.basename,
    memory: environment.memory,
    serverLoaders: definition.serverLoaders,
    getDataUrl: environment.getDataUrl,
    loadRouteChunk: definition.loadRouteChunk,
  };
  let runtime: ReturnType<ApplicationDefinition['createRuntime']> | undefined;
  const getRuntime = () => {
    if (!runtime) {
      runtime = definition.createRuntime(context);
      context._internalContext = runtime;
    }
    return runtime;
  };
  let disposed = false;
  let cancelPreparation: ((reason: unknown) => void) | undefined;
  let preparation:
    Promise<{ value: unknown; interrupted: boolean }> | undefined;
  let Root: React.ComponentType<any> | undefined;
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    cancelPreparation?.(
      environment.signal?.reason ||
        new Error('Application instance has been disposed'),
    );
    environment.signal?.removeEventListener('abort', onAbort);
    const router = context.application?.router;
    if (context.application) {
      context.application.router = undefined;
      context.application.routes = undefined;
    }
    disposeResources(
      () => router?.dispose(),
      () => runtime?.dispose(),
    );
  };
  const assertActive = () => {
    environment.signal?.throwIfAborted();
    if (disposed) throw new Error('Application instance has been disposed');
  };
  const onAbort = () => {
    try {
      dispose();
    } catch (error) {
      (environment.onError || console.error)(error);
    }
  };
  environment.signal?.addEventListener('abort', onAbort, { once: true });
  if (environment.signal?.aborted) onAbort();
  return {
    definition,
    context,
    get runtime() {
      return getRuntime();
    },
    get Root() {
      if (!Root)
        throw new Error('Application must be prepared before rendering');
      return Root;
    },
    prepare() {
      if (preparation) return preparation;
      const cancelled = new Promise<never>((_, reject) => {
        cancelPreparation = reject;
      });
      const work = (async () => {
        assertActive();
        const runtime = getRuntime();
        await runtime.ready;
        assertActive();
        const result =
          await runtime.hooks.onBeforeRender.callWithResult(context);
        assertActive();
        if (!result.interrupted) {
          Root =
            environment.root || runtime.hooks.wrapRoot.call(definition.App!);
          context.application!.Root = Root;
        }
        return result;
      })();
      preparation = Promise.race([work, cancelled])
        .catch(error => disposeAfterError(error, dispose))
        .finally(() => {
          cancelPreparation = undefined;
        });
      return preparation;
    },
    dispose,
  };
}
export type RuntimeApplicationInstance = ReturnType<
  typeof createApplicationInstance
>;
