import { generateRunner, DEFAULT_OPTIONS } from './sync';
import {
  checkPlugins,
  isObject,
  hasOwnProperty,
  sortPlugins,
  includePlugin,
} from './shared';
import type { ToRunners, ToThreads, CommonAPI, PluginOptions } from './types';

/** Setup function of async plugin. */
export type AsyncSetup<Hooks, API = Record<string, never>> = (
  api: API & CommonAPI<Hooks>,
) =>
  | Partial<ToThreads<Hooks>>
  | Promise<Partial<ToThreads<Hooks>> | void>
  | void;

const ASYNC_PLUGIN_SYMBOL = 'ASYNC_PLUGIN_SYMBOL';

export type AsyncPlugin<Hooks, API> = {
  ASYNC_PLUGIN_SYMBOL: typeof ASYNC_PLUGIN_SYMBOL;
} & Required<PluginOptions<Hooks, AsyncSetup<Hooks, API>>>;

export type AsyncManager<Hooks, API> = {
  /**
   * Create a sync plugin.
   * @param setup the setup function.
   * @param options optional plugin options.
   */
  createPlugin: (
    setup?: AsyncSetup<Hooks, API>,
    options?: PluginOptions<Hooks, AsyncSetup<Hooks, API>>,
  ) => AsyncPlugin<Hooks, API>;

  /**
   * Determine if a value is a async plugin.
   * @param input
   */
  isPlugin: (input: unknown) => input is AsyncPlugin<Hooks, API>;

  /**
   * Register new plugins to current manager.
   * @param plugins one or more plugin.
   */
  usePlugin: (
    ...plugins: Array<
      | AsyncPlugin<Hooks, API>
      | PluginOptions<Hooks, AsyncSetup<Hooks, API>>
      | (() => PluginOptions<Hooks, AsyncSetup<Hooks, API>>)
    >
  ) => AsyncManager<Hooks, API>;

  /**
   * Init manager, it will call the setup function of all registered plugins.
   */
  init: () => Promise<ToRunners<Hooks>>;

  /**
   * Run callback function.
   * @param callback
   */
  run: <O>(cb: () => O) => O;

  /**
   * Register new hooks.
   * @param newHooks
   */
  registerHook: (newHooks: Partial<Hooks>) => void;

  /**
   * Return a cloned manager.
   * @param overrideAPI override the default plugin API.
   */
  clone: (
    overrideAPI?: Partial<API & CommonAPI<Hooks>>,
  ) => AsyncManager<Hooks, API>;

  /**
   * Clear all registered plugins.
   */
  clear: () => void;

  /**
   * Get all runner functions of the hooks.
   */
  useRunner: () => ToRunners<Hooks>;
};

export const createAsyncManager = <
  Hooks extends Record<string, any>,
  API extends Record<string, any> = Record<string, never>,
>(
  hooks?: Partial<Hooks>,
  api?: API,
): AsyncManager<Hooks, API> => {
  let index = 0;
  let runners: ToRunners<Hooks>;
  let currentHooks = { ...hooks } as Hooks;

  const useRunner = () => runners;

  const registerHook: AsyncManager<Hooks, API>['registerHook'] = extraHooks => {
    currentHooks = {
      ...extraHooks,
      ...currentHooks,
    };
  };

  const isPlugin: AsyncManager<Hooks, API>['isPlugin'] = (
    input,
  ): input is AsyncPlugin<Hooks, API> =>
    isObject(input) &&
    hasOwnProperty(input, ASYNC_PLUGIN_SYMBOL) &&
    input[ASYNC_PLUGIN_SYMBOL] === ASYNC_PLUGIN_SYMBOL;

  type PluginAPI = API & CommonAPI<Hooks>;

  const pluginAPI = {
    ...api,
    useHookRunners: useRunner,
  } as PluginAPI;

  const clone = (overrideAPI?: Partial<PluginAPI>) => {
    let plugins: AsyncPlugin<Hooks, API>[] = [];

    const addPlugin = (plugin: AsyncPlugin<Hooks, API>) => {
      if (!includePlugin(plugins, plugin)) {
        plugins.push({ ...plugin });
      }
    };

    const usePlugin: AsyncManager<Hooks, API>['usePlugin'] = (...input) => {
      for (const plugin of input) {
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
      }

      return manager;
    };

    const createPlugin: AsyncManager<Hooks, API>['createPlugin'] = (
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
        ASYNC_PLUGIN_SYMBOL,
        setup,
      };
    };

    const clear = () => {
      plugins = [];
    };

    const init: AsyncManager<Hooks, API>['init'] = async () => {
      const sortedPlugins = sortPlugins(plugins);
      const mergedPluginAPI = {
        ...pluginAPI,
        ...overrideAPI,
      };

      checkPlugins(sortedPlugins);

      const hooksList = await Promise.all(
        sortedPlugins.map(plugin => plugin.setup(mergedPluginAPI)),
      );

      runners = generateRunner<Hooks>(hooksList, currentHooks);
      return runners;
    };

    const run: AsyncManager<Hooks, API>['run'] = cb => cb();

    const manager = {
      createPlugin,
      isPlugin,
      usePlugin,
      init,
      run,
      clear,
      clone,
      registerHook,
      useRunner,
    };

    return manager;
  };

  return clone();
};
