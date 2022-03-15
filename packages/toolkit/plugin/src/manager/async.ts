import { runWithContainer, createContainer } from 'farrow-pipeline';
import { generateRunner, hasOwnProperty, DEFAULT_OPTIONS } from './sync';
import { useRunner } from './runner';
import type {
  ToRunners,
  ToThreads,
  CommonAPI,
  InitOptions,
  PluginOptions,
} from './types';

export type AsyncSetup<Hooks, API = never> = (
  api: API & CommonAPI<Hooks>,
) =>
  | Partial<ToThreads<Hooks>>
  | Promise<Partial<ToThreads<Hooks>> | void>
  | void;

const ASYNC_PLUGIN_SYMBOL = 'ASYNC_PLUGIN_SYMBOL';

export type AsyncPlugin<Hooks, API> = {
  setup: AsyncSetup<Hooks, API>;
  ASYNC_PLUGIN_SYMBOL: typeof ASYNC_PLUGIN_SYMBOL;
} & Required<PluginOptions>;

export type AsyncPlugins<Hooks, API> = AsyncPlugin<Hooks, API>[];

export type PluginFromAsyncManager<M extends AsyncManager<any, any>> =
  M extends AsyncManager<infer Hooks, infer API>
    ? AsyncPlugin<Hooks, API>
    : never;

export type AsyncManager<Hooks, API> = {
  createPlugin: (
    setup: AsyncSetup<Hooks, API>,
    options?: PluginOptions,
  ) => AsyncPlugin<Hooks, API>;

  isPlugin: (
    input: Record<string, unknown>,
  ) => input is AsyncPlugin<Hooks, API>;

  usePlugin: (...input: AsyncPlugins<Hooks, API>) => AsyncManager<Hooks, API>;

  init: (options?: InitOptions) => Promise<ToRunners<Hooks>>;

  run: <O>(cb: () => O, options?: InitOptions) => O;

  registerHook: (newHooks: Partial<Hooks>) => void;

  clone: () => AsyncManager<Hooks, API>;

  clear: () => void;

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

  const createPlugin: AsyncManager<Hooks, API>['createPlugin'] = (
    setup,
    options = {},
  ) => ({
    ...DEFAULT_OPTIONS,
    name: `No.${index++} plugin`,
    ...options,
    ASYNC_PLUGIN_SYMBOL,
    setup,
  });

  const isPlugin: AsyncManager<Hooks, API>['isPlugin'] = (
    input,
  ): input is AsyncPlugin<Hooks, API> =>
    hasOwnProperty(input, ASYNC_PLUGIN_SYMBOL) &&
    input[ASYNC_PLUGIN_SYMBOL] === ASYNC_PLUGIN_SYMBOL;

  const registerHook: AsyncManager<Hooks, API>['registerHook'] = extraHooks => {
    currentHooks = {
      ...extraHooks,
      ...currentHooks,
    };
  };

  const pluginAPI = {
    ...api,
    registerHook,
  } as API & CommonAPI<Hooks>;

  const clone = () => {
    let plugins: AsyncPlugins<Hooks, API> = [];

    const usePlugin: AsyncManager<Hooks, API>['usePlugin'] = (...input) => {
      for (const plugin of input) {
        if (isPlugin(plugin)) {
          if (!includeAsyncPlugin(plugins, plugin)) {
            plugins.push({ ...plugin });
          }
        } else {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-expect-error
          console.warn(`Unknown plugin: ${plugin.name}`);
        }
      }

      return manager;
    };

    const clear = () => {
      plugins = [];
    };

    const currentContainer = createContainer();

    const init: AsyncManager<Hooks, API>['init'] = async options => {
      const container = options?.container || currentContainer;

      const sortedPlugins = sortAsyncPlugins(plugins);

      checkAsyncPlugins(sortedPlugins);

      const hooksList = await Promise.all(
        sortedPlugins.map(plugin =>
          runWithContainer(() => plugin.setup(pluginAPI), container),
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
  plugins: AsyncPlugins<Hooks, API>,
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
  input: AsyncPlugins<Hooks, API>,
): AsyncPlugins<Hooks, API> => {
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

const checkAsyncPlugins = <Hooks, API>(plugins: AsyncPlugins<Hooks, API>) => {
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
