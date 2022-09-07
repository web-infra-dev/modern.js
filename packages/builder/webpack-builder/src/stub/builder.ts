import _ from '@modern-js/utils/lodash';
import assert from 'assert';
import { webpackBuild } from '../core/build';
import { createPrimaryBuilder } from '../core/createBuilder';
import { Hooks } from '../core/createHook';
import { matchLoader, mergeBuilderOptions } from '../shared';
import type { BuilderOptions, BuilderPlugin, Context } from '../types';
import { createStubContext } from './context';
import type { Volume } from 'memfs/lib/volume';

export interface StubBuilderOptions extends BuilderOptions {
  context?: Context;
  plugins?: BuilderPlugin[];
  webpack?: boolean | 'in-memory';
}

export type HookApi = {
  [key in keyof Hooks]: Parameters<Parameters<Hooks[key]['tap']>[0]>;
};

export function createStubBuilder(options?: StubBuilderOptions) {
  // init primary builder.
  const builderOptions = mergeBuilderOptions(
    options,
  ) as Required<StubBuilderOptions>;
  const context = createStubContext(builderOptions);
  options?.context && _.merge(context, options.context);
  const {
    pluginStore,
    publicContext,
    build: buildImpl,
  } = createPrimaryBuilder(builderOptions, context);
  options?.plugins && pluginStore.addPlugins(options.plugins);

  let memfsVolume: Volume | undefined;
  context.hooks.onAfterCreateCompilerHooks.tap(async ({ compiler }) => {
    if (options?.webpack === 'in-memory') {
      const { createFsFromVolume, Volume } = await import('memfs');
      const vol = new Volume();
      const ofs = createFsFromVolume(vol);
      memfsVolume = vol;
      compiler.outputFileSystem = ofs;
    }
  });

  // tap on each hook and cache the args.
  const resolvedHooks: Record<string, any> = {};
  _.each(context.hooks, ({ tap }, name) => {
    tap((...args) => {
      resolvedHooks[name] = args;
    });
  });

  const build = _.memoize(async () => {
    const executeBuild = options?.webpack ? webpackBuild : undefined;
    await buildImpl(executeBuild);
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

  const unwrapWebpackCompiler = async () => {
    const [{ compiler }] = await unwrapHook('onAfterCreateCompilerHooks');
    return compiler;
  };

  const unwrapOutputVolume = async () => {
    await build();
    assert(memfsVolume);
    return memfsVolume;
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
    unwrapWebpackCompiler,
    unwrapOutputVolume,
    matchWebpackPlugin,
    matchWebpackLoader,
    reset,
  };
}
