import { runWithContainer, createContainer } from 'farrow-pipeline';
import {
  isObject,
  generateRunner,
  hasOwnProperty,
  DEFAULT_OPTIONS,
} from './sync';
import { useRunner } from './runner';
import type {
  ToRunners,
  ToThreads,
  CommonAPI,
  InitOptions,
  PluginOptions,
} from './types';

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

export type PluginFromAsyncManager<M extends AsyncManager<any, any>> =
  M extends AsyncManager<infer Hooks, infer API>
    ? AsyncPlugin<Hooks, API>
    : never;

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
   * @param options passing a custom container.
   */
  init: (options?: InitOptions) => Promise<ToRunners<Hooks>>;

  /**
   * Run callback function with current container.
   * @param callback
   * @param options passing a custom container.
   */
  run: <O>(cb: () => O, options?: InitOptions) => O;

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
  let currentHooks = { ...hooks } as Hooks;

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
      if (!includeAsyncPlugin(plugins, plugin)) {
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
        // plain plugin options
        else if (plugin.setup) {
          addPlugin(createPlugin(plugin.setup, plugin));
        }
        // unknown plugin
        else {
          console.warn(`Unknown plugin: ${plugin.name || ''}`);
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

    const currentContainer = createContainer();

    const init: AsyncManager<Hooks, API>['init'] = async options => {
      const container = options?.container || currentContainer;
      const sortedPlugins = sortAsyncPlugins(plugins);
      const mergedPluginAPI = {
        ...pluginAPI,
        ...overrideAPI,
      };

      checkAsyncPlugins(sortedPlugins);

      const hooksList = await Promise.all(
        sortedPlugins.map(plugin =>
          runWithContainer(() => plugin.setup(mergedPluginAPI), container),
        ),
      );

      return generateRunner<Hooks>(hooksList, container, currentHooks);
    };

    const run: AsyncManager<Hooks, API>['run'] = (cb, options) => {
      const container = options?.container || currentContainer;

      return runWithContainer(cb, container);
    };

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

const includeAsyncPlugin = <Hooks, API>(
  plugins: AsyncPlugin<Hooks, API>[],
  input: AsyncPlugin<Hooks, API>,
): boolean => {
  for (const plugin of plugins) {
    if (plugin.name === input.name) {
      return true;
    }
  }

  return false;
};

const sortAsyncPlugins = <Hooks, API>(
  input: AsyncPlugin<Hooks, API>[],
): AsyncPlugin<Hooks, API>[] => {
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

const checkAsyncPlugins = <Hooks, API>(plugins: AsyncPlugin<Hooks, API>[]) => {
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
