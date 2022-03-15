import {
  Container,
  isPipeline,
  createPipeline,
  runWithContainer,
  createContainer,
} from 'farrow-pipeline';
import {
  isWaterfall,
  createWaterfall,
  isAsyncWaterfall,
  createAsyncWaterfall,
} from '../waterfall';
import {
  isWorkflow,
  createWorkflow,
  isAsyncWorkflow,
  createAsyncWorkflow,
  isParallelWorkflow,
  createParallelWorkflow,
} from '../workflow';
import { RunnerContext, useRunner } from './runner';
import type {
  Hook,
  HooksMap,
  InitOptions,
  PluginOptions,
  ToRunners,
  ToThreads,
} from './types';

export type Setup<O> = () => O | void;

const SYNC_PLUGIN_SYMBOL = 'SYNC_PLUGIN_SYMBOL';

export type Plugin<O> = {
  setup: Setup<O>;
  SYNC_PLUGIN_SYMBOL: typeof SYNC_PLUGIN_SYMBOL;
} & Required<PluginOptions>;

export type Plugins<O> = Plugin<O>[];

export type PluginFromManager<M extends Manager<any, any>> = M extends Manager<
  infer ExtraHooks,
  infer BaseHooks
>
  ? Plugin<Partial<ToThreads<BaseHooks & ExtraHooks>>>
  : never;

export type Manager<
  ExtraHooks extends Record<string, any>,
  BaseHooks extends HooksMap | void = void,
> = {
  createPlugin: (
    setup: Setup<Partial<ToThreads<BaseHooks & ExtraHooks>>>,
    options?: PluginOptions,
  ) => Plugin<Partial<ToThreads<BaseHooks & ExtraHooks>>>;

  isPlugin: (
    input: Record<string, unknown>,
  ) => input is Plugin<Partial<ToThreads<BaseHooks & ExtraHooks>>>;

  usePlugin: (
    ...input: Plugins<Partial<ToThreads<BaseHooks & ExtraHooks>>>
  ) => Manager<ExtraHooks, BaseHooks>;

  init: (options?: InitOptions) => ToRunners<BaseHooks & ExtraHooks>;

  run: <O>(cb: () => O, options?: InitOptions) => O;

  registerHook: (hewHooks: Partial<ExtraHooks>) => void;

  clear: () => void;

  clone: () => Manager<ExtraHooks, BaseHooks>;

  useRunner: () => ToRunners<BaseHooks & ExtraHooks>;
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
  BaseHooks extends HooksMap = {},
>(
  hooks: BaseHooks,
): Manager<ExtraHooks, BaseHooks> => {
  let index = 0;
  const createPlugin: Manager<ExtraHooks, BaseHooks>['createPlugin'] = (
    setup,
    options = {},
  ) => ({
    ...DEFAULT_OPTIONS,
    name: `No.${index++} plugin`,
    ...options,
    SYNC_PLUGIN_SYMBOL,
    setup,
  });

  const isPlugin: Manager<ExtraHooks, BaseHooks>['isPlugin'] = (
    input,
  ): input is Plugin<Partial<ToThreads<BaseHooks & ExtraHooks>>> =>
    hasOwnProperty(input, SYNC_PLUGIN_SYMBOL) &&
    input[SYNC_PLUGIN_SYMBOL] === SYNC_PLUGIN_SYMBOL;

  const registerHook: Manager<
    ExtraHooks,
    BaseHooks
  >['registerHook'] = extraHooks => {
    // eslint-disable-next-line no-param-reassign
    hooks = {
      ...extraHooks,
      ...hooks,
    };
  };

  const clone = () => {
    let plugins: Plugins<Partial<ToThreads<BaseHooks & ExtraHooks>>> = [];

    const usePlugin: Manager<ExtraHooks, BaseHooks>['usePlugin'] = (
      ...input
    ) => {
      for (const plugin of input) {
        if (isPlugin(plugin)) {
          if (!includePlugin(plugins, plugin)) {
            plugins.push({ ...plugin });
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

    const init: Manager<ExtraHooks, BaseHooks>['init'] = options => {
      const container = options?.container || currentContainer;

      const sortedPlugins = sortPlugins(plugins);

      checkPlugins(sortedPlugins);

      const hooksList = sortedPlugins.map(plugin =>
        runWithContainer(() => plugin.setup(), container),
      );

      return generateRunner<ExtraHooks, BaseHooks>(hooksList, container, hooks);
    };

    const run: Manager<ExtraHooks, BaseHooks>['run'] = (cb, options) => {
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
  BaseHooks extends HooksMap | void = void,
>(
  hooksList: (void | Partial<ToThreads<BaseHooks & ExtraHooks>>)[],
  container: Container,
  hooksMap?: BaseHooks,
): ToRunners<BaseHooks & ExtraHooks> => {
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

export const closeHooksMap = <BaseHooks extends HooksMap | void>(
  record: BaseHooks,
): BaseHooks => {
  if (!record) {
    return record;
  }

  const result: BaseHooks = {} as any;

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

const sortPlugins = <O>(input: Plugins<O>): Plugins<O> => {
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
