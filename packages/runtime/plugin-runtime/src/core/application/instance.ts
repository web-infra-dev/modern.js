import { disposeAfterError } from './cleanup';
import type React from 'react';
import {
  getInitialContext,
  type TInternalRuntimeContext,
} from '../context/runtime';
import type { ApplicationDefinition } from './definition';
import type { RuntimePlugin } from '../plugin';

export interface ApplicationEnvironment {
  isBrowser: boolean;
  output: 'document' | 'fragment';
  initialUrl: string;
  context?: Partial<TInternalRuntimeContext>;
  plugins?: RuntimePlugin[];
  /** A precomposed root supplied by the low-level render(element) API. */
  root?: React.ComponentType<any>;
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

/** Context ownership and one preparation path, independent of optional capabilities. */
export function createApplicationInstance(
  definition: ApplicationDefinition,
  environment: ApplicationEnvironment,
): RuntimeApplicationInstance {
  return new ApplicationInstance(definition, environment);
}

class ApplicationInstance implements RuntimeApplicationInstance {
  declare private environment?: ApplicationEnvironment;
  readonly context: TInternalRuntimeContext;
  declare private internalRuntime?: ReturnType<
    ApplicationDefinition['createRuntime']
  >;
  declare private prepared?: Promise<PreparationResult>;

  constructor(
    public definition: ApplicationDefinition,
    environment: ApplicationEnvironment,
  ) {
    this.environment = environment;
    const context = (this.context = Object.assign(
      getInitialContext(environment.isBrowser),
      { ssr: !environment.isBrowser },
      environment.context,
    ));
    context.routeManifest ??= definition.getRouteManifest?.() || {
      routeAssets: {},
    };
    context.application = {
      definition,
      output: environment.output,
      initialUrl: environment.initialUrl,
    };
    this.prepare = this.prepare.bind(this);
    this.dispose = this.dispose.bind(this);
  }

  get runtime() {
    if (!this.internalRuntime) {
      this.assertActive();
      this.internalRuntime = this.definition.createRuntime(
        this.context,
        this.environment!.plugins,
      );
      this.context._internalContext = this.internalRuntime;
    }
    return this.internalRuntime;
  }
  get Root() {
    const Root = this.context.application?.Root;
    if (!Root) throw new Error('Application must be prepared before rendering');
    return Root;
  }
  private assertActive() {
    if (!this.environment || this.internalRuntime?.disposed)
      throw new Error('Application instance has been disposed');
  }
  private async initialize() {
    const runtime = this.runtime;
    await runtime.ready;
    this.assertActive();
    const result = await runtime.hooks.onBeforeRender.callWithResult(
      this.context,
    );
    this.assertActive();
    if (!result.interrupted) {
      this.context.application!.Root =
        this.environment!.root ||
        runtime.hooks.wrapRoot.call(this.definition.App!);
    }
    return result;
  }
  prepare() {
    if (!this.prepared) {
      let work: Promise<PreparationResult>;
      try {
        const initialize = () => this.initialize();
        work = (
          this.runtime.hooks.wrapPreparation?.call(initialize) || initialize
        )();
      } catch (error) {
        work = Promise.reject(error);
      }
      this.prepared = work.catch(error =>
        disposeAfterError(error, this.dispose),
      );
    }
    return this.prepared;
  }
  dispose() {
    this.environment = undefined;
    this.internalRuntime?.dispose();
  }
}
