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

type PreparationResult = { value: unknown; interrupted: boolean };

export interface RuntimeApplicationInstance {
  definition: ApplicationDefinition;
  context: TInternalRuntimeContext;
  readonly runtime: ReturnType<ApplicationDefinition['createRuntime']>;
  readonly Root: React.ComponentType<any>;
  prepare: () => Promise<PreparationResult>;
  dispose: () => void;
}

/** Shared accessors keep owners compact while their lifecycle closures stay bound. */
class ApplicationInstance implements RuntimeApplicationInstance {
  constructor(
    public definition: ApplicationDefinition,
    public context: TInternalRuntimeContext,
    private readonly readRuntime: () => ReturnType<
      ApplicationDefinition['createRuntime']
    >,
    private readonly readRoot: () => React.ComponentType<any>,
    public prepare: () => Promise<PreparationResult>,
    public dispose: () => void,
  ) {}

  get runtime() {
    return this.readRuntime();
  }

  get Root() {
    return this.readRoot();
  }
}

/** The same owner and preparation sequence for pages, fragments and requests. */
export function createApplicationInstance(
  definition: ApplicationDefinition,
  environment: ApplicationEnvironment,
): RuntimeApplicationInstance {
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
  let preparation: Promise<PreparationResult> | undefined;
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
  const prepare = () => {
    if (preparation) return preparation;
    const cancelled = new Promise<never>((_, reject) => {
      cancelPreparation = reject;
    });
    const work = (async () => {
      assertActive();
      const runtime = getRuntime();
      await runtime.ready;
      assertActive();
      const result = await runtime.hooks.onBeforeRender.callWithResult(context);
      assertActive();
      if (!result.interrupted) {
        Root = environment.root || runtime.hooks.wrapRoot.call(definition.App!);
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
  };
  return new ApplicationInstance(
    definition,
    context,
    getRuntime,
    () => {
      if (!Root)
        throw new Error('Application must be prepared before rendering');
      return Root;
    },
    prepare,
    dispose,
  );
}
