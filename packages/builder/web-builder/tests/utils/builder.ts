import assert from 'assert';
import _ from '@modern-js/utils/lodash';
import { mergeBuilderOptions } from '../../src/core/createBuilder';
import { createPublicContext } from '../../src/core/createContext';
import { Hooks } from '../../src/core/createHook';
import { createPluginStore } from '../../src/core/createPluginStore';
import { initConfigs } from '../../src/core/initConfigs';
import { catchErrorStack } from '../../src/shared';
import type {
  BuilderContext,
  BuilderOptions,
  BuilderPlugin,
  Context,
  PluginStore,
  webpack,
} from '../../src/types';
import { createStubContext } from './context';

const HOOK_UNRESOLVED =
  'Unwrapping hook was not resolved before the build was over.';

export interface StubBuilderOptions extends BuilderOptions {
  context?: Context;
  plugins?: BuilderPlugin[];
}

export type HookApi = {
  [key in keyof Hooks]: Parameters<Parameters<Hooks[key]['tap']>[0]>;
};

export interface StubBuilder extends PluginStore {
  build: () => Promise<{
    context: Context;
    webpackConfigs: webpack.Configuration[];
  }>;
  hooks: Hooks;
  context: Readonly<BuilderContext>;
  unwrapHook: <T extends keyof HookApi>(hook: T) => Promise<HookApi[T]>;
  unwrapWebpackConfigs: () => Promise<webpack.Configuration[]>;
  unwrapWebpackConfig: () => Promise<webpack.Configuration>;
}

export function createStubBuilder(options?: StubBuilderOptions): StubBuilder {
  const builderOptions = mergeBuilderOptions(
    options,
  ) as Required<StubBuilderOptions>;
  const context = createStubContext(builderOptions);
  options?.context && _.merge(context, options.context);
  const publicContext = createPublicContext(context);
  const pluginStore = createPluginStore();
  options?.plugins && pluginStore.addPlugins(options.plugins);

  const build = _.memoize(async () => {
    const { webpackConfigs } = await initConfigs({
      context,
      pluginStore,
      builderOptions,
    });
    await context.hooks.onBeforeBuildHook.call({ webpackConfigs });
    await context.hooks.onAfterBuildHook.call();
    build.cache.clear!();
    hookRejectTasks.forEach(task => task());
    hookRejectTasks.length = 0;
    return { context, webpackConfigs };
  });

  const hookRejectTasks: (() => void)[] = [];
  const unwrapHook = async <T extends keyof HookApi>(
    hook: T,
  ): Promise<HookApi[T]> => {
    build();
    const trace = catchErrorStack(HOOK_UNRESOLVED, 1);
    return new Promise((resolve, reject) => {
      hookRejectTasks.push(() => reject(trace));
      context.hooks[hook].tap((...args: HookApi[T]) => {
        resolve(args);
      });
    });
  };

  const unwrapWebpackConfigs = async () => {
    const [{ webpackConfigs }] = await unwrapHook('onBeforeBuildHook');
    return webpackConfigs;
  };

  const unwrapWebpackConfig = async () => {
    const webpackConfigs = await unwrapWebpackConfigs();
    assert(webpackConfigs.length === 1);
    return webpackConfigs[0];
  };

  return {
    ...pluginStore,
    build,
    hooks: context.hooks,
    context: publicContext,
    unwrapHook,
    unwrapWebpackConfigs,
    unwrapWebpackConfig,
  };
}
