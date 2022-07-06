import { isPipeline, createPipeline } from '../farrow-pipeline';
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
import {
  checkPlugins,
  hasOwnProperty,
  includePlugin,
  isObject,
  sortPlugins,
} from './shared';
import type {
  Hook,
  CommonAPI,
  ToRunners,
  ToThreads,
  PluginOptions,
} from './types';

/** Setup function of sync plugin. */
export type Setup<Hooks, API = Record<string, never>> = (
  api: API,
) => Partial<ToThreads<Hooks>> | void;

const SYNC_PLUGIN_SYMBOL = 'SYNC_PLUGIN_SYMBOL';

export type Plugin<Hooks, API> = {
  SYNC_PLUGIN_SYMBOL: typeof SYNC_PLUGIN_SYMBOL;
} & Required<PluginOptions<Hooks, Setup<Hooks, API>>>;

export type Manager<Hooks, API> = {
  /**
   * Create a sync plugin.
   * @param setup the setup function.
   * @param options optional plugin options.
   */
  createPlugin: (
    setup?: Setup<Hooks, API>,
    options?: PluginOptions<Hooks, Setup<Hooks, API>>,
  ) => Plugin<Hooks, API>;

  /**
   * Determine if a value is a sync plugin.
   * @param input
   */
  isPlugin: (input: unknown) => input is Plugin<Hooks, API>;

  /**
   * Register new plugins to current manager.
   * @param plugins one or more plugin.
   */
  usePlugin: (
    ...plugins: Array<
      | Plugin<Hooks, API>
      | PluginOptions<Hooks, Setup<Hooks, API>>
      | (() => PluginOptions<Hooks, Setup<Hooks, API>>)
    >
  ) => Manager<Hooks, API>;

  /**
   * Init manager, it will call the setup function of all registered plugins.
   */
  init: () => ToRunners<Hooks>;

  /**
   * Run callback function.
   * @param callback
   */
  run: <O>(cb: () => O) => O;

  /**
   * Register new hooks.
   * @param newHooks
   */
  registerHook: (hewHooks: Partial<Hooks>) => void;

  /**
   * Clear all registered plugins.
   */
  clear: () => void;

  /**
   * Return a cloned manager.
   * @param overrideAPI override the default plugin API.
   */
  clone: (overrideAPI?: Partial<API & CommonAPI<Hooks>>) => Manager<Hooks, API>;

  /**
   * Get all runner functions of the hooks.
   */
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
  let runners: ToRunners<Hooks>;
  let currentHooks = { ...hooks } as Hooks;

  const useRunner = () => runners;

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

  type PluginAPI = API & CommonAPI<Hooks>;

  const pluginAPI = {
    ...api,
    useHookRunners: useRunner,
  } as PluginAPI;

  const clone = (overrideAPI?: Partial<PluginAPI>) => {
    let plugins: Plugin<Hooks, API>[] = [];

    const addPlugin = (plugin: Plugin<Hooks, API>) => {
      if (!includePlugin(plugins, plugin)) {
        plugins.push({ ...plugin });
      }
    };

    const usePlugin: Manager<Hooks, API>['usePlugin'] = (...input) => {
      input.forEach(plugin => {
        // already created by createPlugin
        if (isPlugin(plugin)) {
          addPlugin(plugin);
        }
        // using function to return plugin options
        else if (typeof plugin === 'function') {
          const options = plugin();
          addPlugin(createPlugin(options.setup, options));
        }
        // plain plugin object
        else if (isObject(plugin)) {
          addPlugin(createPlugin(plugin.setup, plugin));
        }
        // unknown plugin
        else {
          console.warn(`Unknown plugin: ${JSON.stringify(plugin)}`);
        }
      });

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

    const init: Manager<Hooks, API>['init'] = () => {
      const sortedPlugins = sortPlugins(plugins);
      const mergedPluginAPI = {
        ...pluginAPI,
        ...overrideAPI,
      };

      checkPlugins(sortedPlugins);

      const hooksList = sortedPlugins.map(plugin =>
        plugin.setup(mergedPluginAPI),
      );

      runners = generateRunner<Hooks>(hooksList, currentHooks);
      return runners;
    };

    const run: Manager<Hooks, API>['run'] = cb => cb();

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
  hooksMap?: Hooks,
): ToRunners<Hooks> => {
  const runner = {};
  const cloneShape = cloneHooksMap(hooksMap);

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
          ...options,
        });
    }
  }

  return runner as ToRunners<Hooks>;
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

  throw new Error(`Unknown hook: ${hook}`);
};

export const cloneHooksMap = <Hooks>(record: Hooks): Hooks => {
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
