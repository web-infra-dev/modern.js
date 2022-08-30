import _ from '@modern-js/utils/lodash';
import assert from 'assert';
import { createPrimaryBuilder } from '../core/createBuilder';
import { Hooks } from '../core/createHook';
import type { BuilderOptions, BuilderPlugin, Context } from '../types';
import { matchLoader, mergeBuilderOptions } from '../shared';
import { createStubContext } from './context';
import { createFsFromVolume } from 'memfs';
import { webpackBuild } from '../core/build';
import type * as webpack from 'webpack';
import { Volume } from 'memfs/lib/volume';

export interface StubBuilderOptions extends BuilderOptions {
  context?: Context;
  webpack?: false | Volume;
  plugins?: BuilderPlugin[];
}

export type HookApi = {
  [key in keyof Hooks]: Parameters<Parameters<Hooks[key]['tap']>[0]>;
};

export function createStubBuilder(options?: StubBuilderOptions) {
  const {
    context: customContext,
    webpack: enableWebpack = false,
    plugins: customPlugins,
    ..._builderOptions
  } = options || {};
  // init primary builder.
  const builderOptions = mergeBuilderOptions(
    _builderOptions,
  ) as Required<StubBuilderOptions>;
  const context = createStubContext(builderOptions);
  customContext && _.merge(context, customContext);
  const {
    pluginStore,
    publicContext,
    build: buildImpl,
  } = createPrimaryBuilder(builderOptions, context);
  customPlugins && pluginStore.addPlugins(customPlugins);

  // tap on each hook and cache the args.
  const resolvedHooks: Record<string, any> = {};
  _.each(context.hooks, ({ tap }, name) => {
    tap((...args) => {
      resolvedHooks[name] = args;
    });
  });

  const _executeBuild = async (configs: webpack.Configuration[]) => {
    if (typeof enableWebpack === 'object') {
      await webpackBuild(configs, async compiler => {
        const vol = enableWebpack;
        const mfs = createFsFromVolume(vol);
        compiler.inputFileSystem = mfs;
        compiler.outputFileSystem = mfs;
      });
    }
  };

  const build = _.memoize(async () => {
    await buildImpl(_executeBuild);
    return { context, resolvedHooks };
  });

  // unwrap utils
  const unwrapHook = async <T extends keyof HookApi>(
    hook: T,
  ): Promise<HookApi[T]> => (await build()).resolvedHooks[hook];

  const unwrapWebpackConfigs = async () => {
    const [{ webpackConfigs }] = await unwrapHook('onBeforeBuildHook');
    return webpackConfigs;
  };

  const unwrapWebpackConfig = async () => {
    const webpackConfigs = await unwrapWebpackConfigs();
    assert(webpackConfigs.length === 1);
    return webpackConfigs[0];
  };

  const matchWebpackPlugin = async (pluginName: string) => {
    const config = await unwrapWebpackConfig();
    return config.plugins?.some(item => item.constructor.name === pluginName);
  };

  const matchWebpackLoader = async (filter: {
    loader: string;
    testFile: string;
  }) => matchLoader({ config: await unwrapWebpackConfig(), ...filter });

  const reset = () => {
    build.cache.clear!();
  };

  return {
    ...pluginStore,
    build,
    hooks: context.hooks,
    context,
    publicContext,
    unwrapHook,
    unwrapWebpackConfigs,
    unwrapWebpackConfig,
    matchWebpackPlugin,
    matchWebpackLoader,
    reset,
  };
}
