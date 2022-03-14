// eslint-disable-next-line eslint-comments/disable-enable-pair
/* eslint-disable max-lines */
import {
  Middleware,
  Pipeline,
  isPipeline,
  createPipeline,
  AsyncPipeline,
  MaybeAsync,
  runWithContainer,
  createContainer,
  Container,
} from 'farrow-pipeline';
import {
  Waterfall,
  Brook,
  isWaterfall,
  createWaterfall,
  AsyncWaterfall,
  AsyncBrook,
  isAsyncWaterfall,
  createAsyncWaterfall,
} from '../waterfall';
import {
  Worker,
  Workflow,
  isWorkflow,
  createWorkflow,
  AsyncWorker,
  AsyncWorkflow,
  isAsyncWorkflow,
  createAsyncWorkflow,
  ParallelWorkflow,
  isParallelWorkflow,
  createParallelWorkflow,
} from '../workflow';
import { RunnerContext, useRunner } from './runner';

export type SetupFn<O> = () => O | void;

const SYNC_PLUGIN_SYMBOL = 'SYNC_PLUGIN_SYMBOL';

export type Plugin<O> = {
  setup: SetupFn<O>;
  SYNC_PLUGIN_SYMBOL: typeof SYNC_PLUGIN_SYMBOL;
} & Required<PluginOptions>;

export type IndexPlugin<O> = Plugin<O> & {
  index: number;
};

export type Plugins<O> = Plugin<O>[];
export type IndexPlugins<O> = IndexPlugin<O>[];

export type PluginOptions = {
  name?: string;
  pre?: string[];
  post?: string[];
  rivals?: string[];
  required?: string[];
};

export type Hook =
  | Waterfall<any>
  | AsyncWaterfall<any>
  | Workflow<any, any>
  | AsyncWorkflow<any, any>
  | ParallelWorkflow<any>
  | Pipeline<any, any>
  | AsyncPipeline<any, any>;

export type HookToThread<P extends Hook> = P extends Workflow<infer I, infer O>
  ? Worker<I, O>
  : P extends AsyncWorkflow<infer I, infer O>
  ? AsyncWorker<I, O>
  : P extends ParallelWorkflow<infer I, infer O>
  ? AsyncWorker<I, O>
  : P extends Waterfall<infer I>
  ? Brook<I>
  : P extends AsyncWaterfall<infer I>
  ? AsyncBrook<I>
  : P extends Pipeline<infer I, infer O>
  ? Middleware<I, O>
  : P extends AsyncPipeline<infer I, infer O>
  ? Middleware<I, MaybeAsync<O>>
  : never;

export type HooksMap = Record<string, Hook>;

export type HooksToThreads<PS extends HooksMap | void> = {
  [K in keyof PS]: PS[K] extends Hook
    ? HookToThread<PS[K]>
    : PS[K] extends void
    ? void
    : never;
};

export type RunnerFromProgress<P extends Hook> = P extends Waterfall<infer I>
  ? Waterfall<I>['run']
  : P extends AsyncWaterfall<infer I>
  ? AsyncWaterfall<I>['run']
  : P extends Workflow<infer I, infer O>
  ? Workflow<I, O>['run']
  : P extends AsyncWorkflow<infer I, infer O>
  ? AsyncWorkflow<I, O>['run']
  : P extends ParallelWorkflow<infer I, infer O>
  ? ParallelWorkflow<I, O>['run']
  : P extends Pipeline<infer I, infer O>
  ? Pipeline<I, O>['run']
  : P extends AsyncPipeline<infer I, infer O>
  ? AsyncPipeline<I, O>['run']
  : never;

export type HooksToRunners<PS extends HooksMap | void> = {
  [K in keyof PS]: PS[K] extends Hook
    ? RunnerFromProgress<PS[K]>
    : PS[K] extends void
    ? void
    : never;
};

export type PluginFromManager<M extends Manager<any, any>> = M extends Manager<
  infer ExtraHooks,
  infer InitialHooks
>
  ? Plugin<Partial<HooksToThreads<InitialHooks & ExtraHooks>>>
  : never;

export type InitOptions = {
  container?: Container;
};

export type Manager<
  ExtraHooks extends Record<string, any>,
  InitialHooks extends HooksMap | void = void,
> = {
  createPlugin: (
    setup: SetupFn<Partial<HooksToThreads<InitialHooks & ExtraHooks>>>,
    options?: PluginOptions,
  ) => Plugin<Partial<HooksToThreads<InitialHooks & ExtraHooks>>>;

  isPlugin: (
    input: Record<string, unknown>,
  ) => input is Plugin<Partial<HooksToThreads<InitialHooks & ExtraHooks>>>;

  usePlugin: (
    ...input: Plugins<Partial<HooksToThreads<InitialHooks & ExtraHooks>>>
  ) => Manager<ExtraHooks, InitialHooks>;

  init: (options?: InitOptions) => HooksToRunners<InitialHooks & ExtraHooks>;

  run: <O>(cb: () => O, options?: InitOptions) => O;

  registerHook: (hewHooks: Partial<ExtraHooks>) => void;

  clear: () => void;

  clone: () => Manager<ExtraHooks, InitialHooks>;

  useRunner: () => HooksToRunners<InitialHooks & ExtraHooks>;
};

export const DEFAULT_OPTIONS: Required<PluginOptions> = {
  name: 'untitled',
  pre: [],
  post: [],
  rivals: [],
  required: [],
};

export const createManager = <
  // eslint-disable-next-line @typescript-eslint/ban-types
  ExtraHooks extends Record<string, any> = {},
  // eslint-disable-next-line @typescript-eslint/ban-types
  InitialHooks extends HooksMap = {},
>(
  hooks: InitialHooks,
): Manager<ExtraHooks, InitialHooks> => {
  let index = 0;
  const createPlugin: Manager<ExtraHooks, InitialHooks>['createPlugin'] = (
    setup,
    options = {},
  ) => ({
    ...DEFAULT_OPTIONS,
    name: `No.${index++} plugin`,
    ...options,
    SYNC_PLUGIN_SYMBOL,
    setup,
  });

  const isPlugin: Manager<ExtraHooks, InitialHooks>['isPlugin'] = (
    input,
  ): input is Plugin<Partial<HooksToThreads<InitialHooks & ExtraHooks>>> =>
    hasOwnProperty(input, SYNC_PLUGIN_SYMBOL) &&
    input[SYNC_PLUGIN_SYMBOL] === SYNC_PLUGIN_SYMBOL;

  const registerHook: Manager<
    ExtraHooks,
    InitialHooks
  >['registerHook'] = extraHooks => {
    // eslint-disable-next-line no-param-reassign
    hooks = {
      ...extraHooks,
      ...hooks,
    };
  };

  const clone = () => {
    let plugins: IndexPlugins<
      Partial<HooksToThreads<InitialHooks & ExtraHooks>>
    > = [];

    const usePlugin: Manager<ExtraHooks, InitialHooks>['usePlugin'] = (
      ...input
    ) => {
      for (const plugin of input) {
        if (isPlugin(plugin)) {
          if (!includePlugin(plugins, plugin)) {
            plugins.push({
              ...plugin,
              index: plugins.length,
            });
          }
        } else {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-expect-error
          console.warn(`Unknown plugin: ${plugin.name}`);
        }
      }

      return {
        createPlugin,
        isPlugin,
        usePlugin,
        init,
        run,
        clear,
        registerHook,
        useRunner,
        clone,
      };
    };

    const clear = () => {
      plugins = [];
    };

    const currentContainer = createContainer();

    const init: Manager<ExtraHooks, InitialHooks>['init'] = options => {
      const container = options?.container || currentContainer;

      const sortedPlugins = sortPlugins(plugins);

      checkPlugins(sortedPlugins);

      const hooksList = sortedPlugins.map(plugin =>
        runWithContainer(() => plugin.setup(), container),
      );

      return generateRunner<ExtraHooks, InitialHooks>(
        hooksList,
        container,
        hooks,
      );
    };

    const run: Manager<ExtraHooks, InitialHooks>['run'] = (cb, options) => {
      const container = options?.container || currentContainer;

      return runWithContainer(cb, container);
    };

    return {
      createPlugin,
      isPlugin,
      usePlugin,
      init,
      clear,
      run,
      registerHook,
      useRunner,
      clone,
    };
  };

  return clone();
};

export const generateRunner = <
  // eslint-disable-next-line @typescript-eslint/ban-types
  ExtraHooks extends Record<string, any> = {},
  InitialHooks extends HooksMap | void = void,
>(
  hooksList: (void | Partial<HooksToThreads<InitialHooks & ExtraHooks>>)[],
  container: Container,
  hooksMap?: InitialHooks,
): HooksToRunners<InitialHooks & ExtraHooks> => {
  const runner = {};
  const cloneShape = closeHooksMap(hooksMap);

  if (hooksMap) {
    for (const key in cloneShape) {
      for (const hooks of hooksList) {
        if (!hooks) {
          continue;
        }
        if (hooks[key]) {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-expect-error
          cloneShape[key].use(hooks[key]);
        }
      }
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      runner[key] = (input: any, options: any) =>
        (cloneShape[key] as any).run(input, {
          container,
          ...options,
        });
    }
  }

  container.write(RunnerContext, runner);
  return runner as any;
};

export const cloneHook = (hook: Hook): Hook => {
  if (isWaterfall(hook)) {
    return createWaterfall();
  }

  if (isAsyncWaterfall(hook)) {
    return createAsyncWaterfall();
  }

  if (isWorkflow(hook)) {
    return createWorkflow();
  }

  if (isAsyncWorkflow(hook)) {
    return createAsyncWorkflow();
  }

  if (isParallelWorkflow(hook)) {
    return createParallelWorkflow();
  }

  if (isPipeline(hook)) {
    return createPipeline();
  }

  // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
  throw new Error(`Unknown hook: ${hook}`);
};

export const closeHooksMap = <InitialHooks extends HooksMap | void>(
  record: InitialHooks,
): InitialHooks => {
  if (!record) {
    return record;
  }

  const result: InitialHooks = {} as any;

  for (const key in record) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    result[key] = cloneHook(record[key]);
  }

  return result;
};

const includePlugin = <O>(plugins: Plugins<O>, input: Plugin<O>): boolean => {
  for (const plugin of plugins) {
    if (plugin.name === input.name) {
      return true;
    }
  }

  return false;
};

const sortPlugins = <O>(input: IndexPlugins<O>): IndexPlugins<O> => {
  let plugins = input.slice();

  for (let i = 0; i < plugins.length; i++) {
    const plugin = plugins[i];

    for (const pre of plugin.pre) {
      for (let j = i + 1; j < plugins.length; j++) {
        if (plugins[j].name === pre) {
          plugins = [
            ...plugins.slice(0, i),
            plugins[j],
            ...plugins.slice(i, j),
            ...plugins.slice(j + 1, plugins.length),
          ];
        }
      }
    }

    for (const post of plugin.post) {
      for (let j = 0; j < i; j++) {
        if (plugins[j].name === post) {
          plugins = [
            ...plugins.slice(0, j),
            ...plugins.slice(j + 1, i + 1),
            plugins[j],
            ...plugins.slice(i + 1, plugins.length),
          ];
        }
      }
    }
  }

  return plugins;
};

const checkPlugins = <O>(plugins: Plugins<O>) => {
  for (const origin of plugins) {
    for (const rival of origin.rivals) {
      for (const plugin of plugins) {
        if (rival === plugin.name) {
          throw new Error(`${origin.name} has rival ${plugin.name}`);
        }
      }
    }

    for (const required of origin.required) {
      if (!plugins.some(plugin => plugin.name === required)) {
        throw new Error(
          `The plugin: ${required} is required when plugin: ${origin.name} is exist.`,
        );
      }
    }
  }
};

export const hasOwnProperty = <
  X extends Record<string, unknown>,
  Y extends PropertyKey,
>(
  obj: X,
  prop: Y,
): obj is X & Record<Y, unknown> => obj.hasOwnProperty(prop);
