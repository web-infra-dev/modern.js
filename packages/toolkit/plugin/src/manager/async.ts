import { runWithContainer, createContainer } from 'farrow-pipeline';
import {
  ProgressRecord,
  Progresses2Threads,
  Progresses2Runners,
  PluginOptions,
  ClearDraftProgress,
  InitOptions,
  generateRunner,
  hasOwnProperty,
  DEFAULT_OPTIONS,
} from './sync';
import { useRunner } from './runner';

// eslint-disable-next-line @typescript-eslint/no-invalid-void-type
export type AsyncInitializer<O> = () => void | O | Promise<O | void>;

const ASYNC_PLUGIN_SYMBOL = 'ASYNC_PLUGIN_SYMBOL';

export type AsyncPlugin<O> = {
  initializer: AsyncInitializer<O>;
  ASYNC_PLUGIN_SYMBOL: typeof ASYNC_PLUGIN_SYMBOL;
} & Required<PluginOptions>;

export type IndexAsyncPlugin<O> = AsyncPlugin<O> & {
  index: number;
};

export type AsyncPlugins<O> = AsyncPlugin<O>[];
export type AsyncIndexPlugins<O> = IndexAsyncPlugin<O>[];

export type AsyncPluginFromAsyncManager<M extends AsyncManager<any, any>> =
  M extends AsyncManager<infer EP, infer PR>
    ? AsyncPlugin<Partial<Progresses2Threads<PR & ClearDraftProgress<EP>>>>
    : never;

export type PluginFromAsyncManager<M extends AsyncManager<any, any>> =
  M extends AsyncManager<infer EP, infer PR>
    ? AsyncPlugin<Partial<Progresses2Threads<PR & ClearDraftProgress<EP>>>>
    : never;

export type AsyncManager<
  EP extends Record<string, any>,
  // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
  PR extends ProgressRecord | void = void,
> = {
  createPlugin: (
    initializer: AsyncInitializer<
      Partial<Progresses2Threads<PR & ClearDraftProgress<EP>>>
    >,
    options?: PluginOptions,
  ) => AsyncPlugin<Partial<Progresses2Threads<PR & ClearDraftProgress<EP>>>>;
  isPlugin: (
    input: Record<string, unknown>,
  ) => input is AsyncPlugin<
    Partial<Progresses2Threads<PR & ClearDraftProgress<EP>>>
  >;
  usePlugin: (
    ...input: AsyncPlugins<
      Partial<Progresses2Threads<PR & ClearDraftProgress<EP>>>
    >
  ) => AsyncManager<EP, PR>;
  init: (
    options?: InitOptions,
  ) => Promise<Progresses2Runners<PR & ClearDraftProgress<EP>>>;
  run: <O>(cb: () => O, options?: InitOptions) => O;
  registe: (newShape: Partial<EP>) => void;
  clone: () => AsyncManager<EP, PR>;
  clear: () => void;
  useRunner: () => Progresses2Runners<PR & ClearDraftProgress<EP>>;
};

export const createAsyncManager = <
  // eslint-disable-next-line @typescript-eslint/ban-types
  EP extends Record<string, any> = {},
  // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
  PR extends ProgressRecord | void = void,
>(
  processes?: PR,
): AsyncManager<EP, PR> => {
  let index = 0;
  const createPlugin: AsyncManager<EP, PR>['createPlugin'] = (
    initializer,
    options = {},
  ) => ({
    ...DEFAULT_OPTIONS,
    name: `No.${index++} plugin`,
    ...options,
    ASYNC_PLUGIN_SYMBOL,
    initializer,
  });

  const isPlugin: AsyncManager<EP, PR>['isPlugin'] = (
    input,
  ): input is AsyncPlugin<
    Partial<Progresses2Threads<PR & ClearDraftProgress<EP>>>
  > =>
    hasOwnProperty(input, ASYNC_PLUGIN_SYMBOL) &&
    input[ASYNC_PLUGIN_SYMBOL] === ASYNC_PLUGIN_SYMBOL;

  const registe: AsyncManager<EP, PR>['registe'] = extraProcesses => {
    // eslint-disable-next-line no-param-reassign
    processes = {
      ...extraProcesses,
      ...processes,
    } as any;
  };

  const clone = () => {
    let plugins: AsyncIndexPlugins<
      Partial<Progresses2Threads<PR & ClearDraftProgress<EP>>>
    > = [];

    const usePlugin: AsyncManager<EP, PR>['usePlugin'] = (...input) => {
      for (const plugin of input) {
        if (isPlugin(plugin)) {
          if (!includeAsyncPlugin(plugins, plugin)) {
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

      return manager;
    };

    const clear = () => {
      plugins = [];
    };

    const currentContainer = createContainer();

    const init: AsyncManager<EP, PR>['init'] = async options => {
      const container = options?.container || currentContainer;

      const sortedPlugins = sortAsyncPlugins(plugins);

      checkAsyncPlugins(sortedPlugins);

      const hooksList = await Promise.all(
        sortedPlugins.map(plugin =>
          runWithContainer(() => plugin.initializer(), container),
        ),
      );

      return generateRunner<EP, PR>(hooksList, container, processes);
    };

    const run: AsyncManager<EP, PR>['run'] = (cb, options) => {
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
      registe,
      useRunner,
    };

    return manager;
  };

  return clone();
};

const includeAsyncPlugin = <O>(
  plugins: AsyncPlugins<O>,
  input: AsyncPlugin<O>,
): boolean => {
  for (const plugin of plugins) {
    if (plugin.name === input.name) {
      return true;
    }
  }

  return false;
};

const sortAsyncPlugins = <O>(
  input: AsyncIndexPlugins<O>,
): AsyncIndexPlugins<O> => {
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

const checkAsyncPlugins = <O>(plugins: AsyncIndexPlugins<O>) => {
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
