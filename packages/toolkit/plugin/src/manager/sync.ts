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

export type Progress2Thread<P extends Hook> = P extends Workflow<
  infer I,
  infer O
>
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
    ? Progress2Thread<PS[K]>
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

export type ClearDraftProgress<I extends Record<string, any>> = {
  [K in keyof I]: I[K] extends Hook ? I[K] : never;
};

export type PluginFromManager<M extends Manager<any, any>> = M extends Manager<
  infer EP,
  infer PR
>
  ? Plugin<Partial<HooksToThreads<PR & ClearDraftProgress<EP>>>>
  : never;
export type InitOptions = {
  container?: Container;
};
export type Manager<
  EP extends Record<string, any>,
  PR extends HooksMap | void = void,
> = {
  createPlugin: (
    setup: SetupFn<Partial<HooksToThreads<PR & ClearDraftProgress<EP>>>>,
    options?: PluginOptions,
  ) => Plugin<Partial<HooksToThreads<PR & ClearDraftProgress<EP>>>>;
  isPlugin: (
    input: Record<string, unknown>,
  ) => input is Plugin<Partial<HooksToThreads<PR & ClearDraftProgress<EP>>>>;
  usePlugin: (
    ...input: Plugins<Partial<HooksToThreads<PR & ClearDraftProgress<EP>>>>
  ) => Manager<EP, PR>;
  init: (options?: InitOptions) => HooksToRunners<PR & ClearDraftProgress<EP>>;
  run: <O>(cb: () => O, options?: InitOptions) => O;
  registe: (newShape: Partial<EP>) => void;
  clear: () => void;
  clone: () => Manager<EP, PR>;
  useRunner: () => HooksToRunners<PR & ClearDraftProgress<EP>>;
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
  EP extends Record<string, any> = {},
  PR extends HooksMap | void = void,
>(
  hooks?: PR,
): Manager<EP, PR> => {
  let index = 0;
  const createPlugin: Manager<EP, PR>['createPlugin'] = (
    setup,
    options = {},
  ) => ({
    ...DEFAULT_OPTIONS,
    name: `No.${index++} plugin`,
    ...options,
    SYNC_PLUGIN_SYMBOL,
    setup,
  });

  const isPlugin: Manager<EP, PR>['isPlugin'] = (
    input,
  ): input is Plugin<Partial<HooksToThreads<PR & ClearDraftProgress<EP>>>> =>
    hasOwnProperty(input, SYNC_PLUGIN_SYMBOL) &&
    input[SYNC_PLUGIN_SYMBOL] === SYNC_PLUGIN_SYMBOL;

  const registe: Manager<EP, PR>['registe'] = extraHooks => {
    // eslint-disable-next-line no-param-reassign
    hooks = {
      ...extraHooks,
      ...hooks,
    } as any;
  };

  const clone = () => {
    let plugins: IndexPlugins<
      Partial<HooksToThreads<PR & ClearDraftProgress<EP>>>
    > = [];

    const usePlugin: Manager<EP, PR>['usePlugin'] = (...input) => {
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
        registe,
        useRunner,
        clone,
      };
    };

    const clear = () => {
      plugins = [];
    };

    const currentContainer = createContainer();

    const init: Manager<EP, PR>['init'] = options => {
      const container = options?.container || currentContainer;

      const sortedPlugins = sortPlugins(plugins);

      checkPlugins(sortedPlugins);

      const hooksList = sortedPlugins.map(plugin =>
        runWithContainer(() => plugin.setup(), container),
      );

      return generateRunner<EP, PR>(hooksList, container, hooks);
    };

    const run: Manager<EP, PR>['run'] = (cb, options) => {
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
      registe,
      useRunner,
      clone,
    };
  };

  return clone();
};

export const generateRunner = <
  // eslint-disable-next-line @typescript-eslint/ban-types
  EP extends Record<string, any> = {},
  PR extends HooksMap | void = void,
>(
  hooksList: (void | Partial<HooksToThreads<PR & ClearDraftProgress<EP>>>)[],
  container: Container,
  processes?: PR,
): HooksToRunners<PR & ClearDraftProgress<EP>> => {
  const runner = {};
  const cloneShape = closeHooksMap(processes);

  if (processes) {
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

export const closeHooksMap = <PR extends HooksMap | void>(record: PR): PR => {
  if (!record) {
    return record;
  }

  const result: PR = {} as any;

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
