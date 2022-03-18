import { isObject } from '@modern-js/utils';
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
  CommonAPI,
  ToRunners,
  ToThreads,
  InitOptions,
  PluginOptions,
} from './types';

/** setup function of sync plugin */
export type Setup<Hooks, API = Record<string, never>> = (
  api: API,
) => Partial<ToThreads<Hooks>> | void;

const SYNC_PLUGIN_SYMBOL = 'SYNC_PLUGIN_SYMBOL';

export type Plugin<Hooks, API> = {
  SYNC_PLUGIN_SYMBOL: typeof SYNC_PLUGIN_SYMBOL;
} & Required<PluginOptions<Hooks, Setup<Hooks, API>>>;

export type PluginFromManager<M extends Manager<any, any>> = M extends Manager<
  infer Hooks,
  infer API
>
  ? Plugin<Hooks, API>
  : never;

export type Manager<Hooks, API> = {
  createPlugin: (
    setup?: Setup<Hooks, API>,
    options?: PluginOptions<Hooks, Setup<Hooks, API>>,
  ) => Plugin<Hooks, API>;

  isPlugin: (input: unknown) => input is Plugin<Hooks, API>;

  usePlugin: (
    ...plugins:
      | Plugin<Hooks, API>[]
      | Array<() => PluginOptions<Hooks, Setup<Hooks, API>>>
  ) => Manager<Hooks, API>;

  init: (options?: InitOptions) => ToRunners<Hooks>;

  run: <O>(cb: () => O, options?: InitOptions) => O;

  registerHook: (hewHooks: Partial<Hooks>) => void;

  clear: () => void;

  clone: () => Manager<Hooks, API>;

  useRunner: () => ToRunners<Hooks>;
};

export const DEFAULT_OPTIONS = {
  name: 'untitled',
  pre: [],
  post: [],
  rivals: [],
  required: [],
  usePlugins: [],
  registerHook: {},
};

export const createManager = <
  Hooks,
  API extends Record<string, any> = Record<string, never>,
>(
  hooks?: Partial<Hooks>,
  api?: API,
): Manager<Hooks, API> => {
  let index = 0;
  let currentHooks = { ...hooks } as Hooks;

  const registerHook: Manager<Hooks, API>['registerHook'] = extraHooks => {
    currentHooks = {
      ...extraHooks,
      ...currentHooks,
    };
  };

  const isPlugin: Manager<Hooks, API>['isPlugin'] = (
    input,
  ): input is Plugin<Hooks, API> =>
    isObject(input) &&
    hasOwnProperty(input, SYNC_PLUGIN_SYMBOL) &&
    input[SYNC_PLUGIN_SYMBOL] === SYNC_PLUGIN_SYMBOL;

  const pluginAPI = {
    ...api,
    useHookRunners: useRunner,
  } as API & CommonAPI<Hooks>;

  const clone = () => {
    let plugins: Plugin<Hooks, API>[] = [];

    const addPlugin = (plugin: Plugin<Hooks, API>) => {
      if (!includePlugin(plugins, plugin)) {
        plugins.push({ ...plugin });
      }
    };

    const usePlugin: Manager<Hooks, API>['usePlugin'] = (...input) => {
      for (const plugin of input) {
        if (isPlugin(plugin)) {
          addPlugin(plugin);
        } else if (typeof plugin === 'function') {
          const options = plugin();
          addPlugin(createPlugin(options.setup, options));
        } else {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-expect-error
          console.warn(`Unknown plugin: ${plugin.name}`);
        }
      }

      return manager;
    };

    const createPlugin: Manager<Hooks, API>['createPlugin'] = (
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      setup = () => {},
      options = {},
    ) => {
      if (options.usePlugins?.length) {
        options.usePlugins.forEach(plugin => {
          usePlugin(createPlugin(plugin.setup, plugin));
        });
      }

      if (options.registerHook) {
        registerHook(options.registerHook);
      }

      return {
        ...DEFAULT_OPTIONS,
        name: `No.${index++} plugin`,
        ...options,
        SYNC_PLUGIN_SYMBOL,
        setup,
      };
    };

    const clear = () => {
      plugins = [];
    };

    const currentContainer = createContainer();

    const init: Manager<Hooks, API>['init'] = options => {
      const container = options?.container || currentContainer;
      const sortedPlugins = sortPlugins(plugins);

      checkPlugins(sortedPlugins);

      const hooksList = sortedPlugins.map(plugin =>
        runWithContainer(() => plugin.setup(pluginAPI), container),
      );

      return generateRunner<Hooks>(hooksList, container, currentHooks);
    };

    const run: Manager<Hooks, API>['run'] = (cb, options) => {
      const container = options?.container || currentContainer;

      return runWithContainer(cb, container);
    };

    const manager = {
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

    return manager;
  };

  return clone();
};

export const generateRunner = <Hooks extends Record<string, any>>(
  hooksList: (void | Partial<ToThreads<Hooks>>)[],
  container: Container,
  hooksMap?: Hooks,
): ToRunners<Hooks> => {
  const runner = {};
  const cloneShape = closeHooksMap(hooksMap);

  if (hooksMap) {
    for (const key in cloneShape) {
      for (const hooks of hooksList) {
        if (!hooks) {
          continue;
        }
        if (hooks[key]) {
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

export const closeHooksMap = <Hooks>(record: Hooks): Hooks => {
  if (!record) {
    return record;
  }

  const result: Hooks = {} as any;

  for (const key in record) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    result[key] = cloneHook(record[key]);
  }

  return result;
};

const includePlugin = <Hooks, API>(
  plugins: Plugin<Hooks, API>[],
  input: Plugin<Hooks, API>,
): boolean => {
  for (const plugin of plugins) {
    if (plugin.name === input.name) {
      return true;
    }
  }

  return false;
};

const sortPlugins = <Hooks, API>(
  input: Plugin<Hooks, API>[],
): Plugin<Hooks, API>[] => {
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

const checkPlugins = <Hooks, API>(plugins: Plugin<Hooks, API>[]) => {
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
