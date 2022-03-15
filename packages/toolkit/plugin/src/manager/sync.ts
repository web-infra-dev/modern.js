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

export type Setup<Hooks, API = never> = (
  api: API,
) => Partial<ToThreads<Hooks>> | void;

const SYNC_PLUGIN_SYMBOL = 'SYNC_PLUGIN_SYMBOL';

export type Plugin<Hooks, API> = {
  setup: Setup<Hooks, API>;
  SYNC_PLUGIN_SYMBOL: typeof SYNC_PLUGIN_SYMBOL;
} & Required<PluginOptions<Hooks, Setup<Hooks, API>>>;

export type Plugins<Hooks, API> = Plugin<Hooks, API>[];

export type PluginFromManager<M extends Manager<any, any>> = M extends Manager<
  infer Hooks,
  infer API
>
  ? Plugin<Hooks, API>
  : never;

export type Manager<Hooks, API> = {
  createPlugin: (
    setup: Setup<Hooks, API>,
    options?: PluginOptions<Hooks, Setup<Hooks, API>>,
  ) => Plugin<Hooks, API>;

  isPlugin: (input: Record<string, unknown>) => input is Plugin<Hooks, API>;

  usePlugin: (...input: Plugins<Hooks, API>) => Manager<Hooks, API>;

  init: (options: InitOptions) => ToRunners<Hooks>;

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
  regiserHook: {},
};

export const createManager = <
  Hooks,
  API extends Record<string, any> = Record<string, never>,
>(
  hooks?: Hooks,
  api?: API,
): Manager<Hooks, API> => {
  let index = 0;
  let currentHooks = { ...hooks } as Hooks;

  const createPlugin: Manager<Hooks, API>['createPlugin'] = (
    setup,
    options = {},
  ) => ({
    ...DEFAULT_OPTIONS,
    name: `No.${index++} plugin`,
    ...options,
    SYNC_PLUGIN_SYMBOL,
    setup,
  });

  const isPlugin: Manager<Hooks, API>['isPlugin'] = (
    input,
  ): input is Plugin<Hooks, API> =>
    hasOwnProperty(input, SYNC_PLUGIN_SYMBOL) &&
    input[SYNC_PLUGIN_SYMBOL] === SYNC_PLUGIN_SYMBOL;

  const registerHook: Manager<Hooks, API>['registerHook'] = extraHooks => {
    currentHooks = {
      ...extraHooks,
      ...currentHooks,
    };
  };

  const pluginAPI = {
    ...api,
    useHookRunners: useRunner,
  } as API & CommonAPI<Hooks>;

  const clone = () => {
    let plugins: Plugins<Hooks, API> = [];

    const usePlugin: Manager<Hooks, API>['usePlugin'] = (...input) => {
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
  plugins: Plugins<Hooks, API>,
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
  input: Plugins<Hooks, API>,
): Plugins<Hooks, API> => {
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

const checkPlugins = <Hooks, API>(plugins: Plugins<Hooks, API>) => {
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
