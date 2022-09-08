import assert from 'assert';
import _ from '@modern-js/utils/lodash';
import { mergeBuilderOptions } from '../../src/shared';
import { createPublicContext } from '../../src/core/createContext';
import { Hooks } from '../../src/core/createHook';
import { createPluginStore } from '../../src/core/createPluginStore';
import { initConfigs } from '../../src/core/initConfigs';
import type {
  BuilderContext,
  BuilderOptions,
  BuilderPlugin,
  Context,
  PluginStore,
  webpack,
} from '../../src/types';
import { createStubContext } from './context';

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
  reset: () => void;
}

export function createStubBuilder(options?: StubBuilderOptions): StubBuilder {
  // setPathSerializer();

  const builderOptions = mergeBuilderOptions(
    options,
  ) as Required<StubBuilderOptions>;
  const context = createStubContext(builderOptions);
  options?.context && _.merge(context, options.context);
  const publicContext = createPublicContext(context);
  const pluginStore = createPluginStore();
  options?.plugins && pluginStore.addPlugins(options.plugins);

  const resolvedHooks: Record<string, any> = {};
  _.each(context.hooks, ({ tap }, name) => {
    tap((...args) => {
      resolvedHooks[name] = args;
    });
  });

  const build = _.memoize(async () => {
    const { webpackConfigs } = await initConfigs({
      context,
      pluginStore,
      builderOptions,
    });
    await context.hooks.onBeforeBuildHook.call({ webpackConfigs });
    await context.hooks.onAfterBuildHook.call({});
    return { context, webpackConfigs, resolvedHooks };
  });

  const unwrapHook: StubBuilder['unwrapHook'] = async hook =>
    (await build()).resolvedHooks[hook];

  const unwrapWebpackConfigs = async () => {
    const { webpackConfigs } = await build();
    return webpackConfigs;
  };

  const unwrapWebpackConfig = async () => {
    const webpackConfigs = await unwrapWebpackConfigs();
    assert(webpackConfigs.length === 1);
    return webpackConfigs[0];
  };

  const reset = () => {
    build.cache.clear!();
  };

  return {
    ...pluginStore,
    build,
    hooks: context.hooks,
    context: publicContext,
    unwrapHook,
    unwrapWebpackConfigs,
    unwrapWebpackConfig,
    reset,
  };
}
