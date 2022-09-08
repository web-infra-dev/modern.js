import _ from '@modern-js/utils/lodash';
import assert from 'assert';
import { webpackBuild } from '../core/build';
import { createPrimaryBuilder } from '../core/createBuilder';
import { Hooks } from '../core/createHook';
import { matchLoader, mergeBuilderOptions } from '../shared';
import type { BuilderOptions, BuilderPlugin, Context } from '../types';
import { createStubContext } from './context';
import { Volume, DirectoryJSON } from 'memfs/lib/volume';
import { PathLike } from 'fs';
import type * as playwright from '@modern-js/e2e/playwright';

export interface StubBuilderOptions extends BuilderOptions {
  context?: Context;
  plugins?: BuilderPlugin[];
  webpack?: boolean | 'in-memory';
}

export type HookApi = {
  [key in keyof Hooks]: Parameters<Parameters<Hooks[key]['tap']>[0]>;
};

export interface ServeDestOptions {
  hangOn?: playwright.TestType<any, any> | boolean;
}

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

  const unwrapOutputVolumeJSON = async (
    paths?: PathLike | PathLike[],
    json?: Record<any, any>,
    isRelative?: boolean,
  ): Promise<DirectoryJSON> => {
    const vol = await unwrapOutputVolume();
    return vol.toJSON(paths, json, isRelative);
  };

  const unwrapOutputFile = async (filename: string) => {
    const compiler = await unwrapWebpackCompiler();
    return new Promise((resolve, reject) => {
      compiler.outputFileSystem.readFile(filename, (err, data) =>
        err ? reject(err) : resolve(data),
      );
    });
  };

  const buildAndServe = async (options?: ServeDestOptions) => {
    const { runStaticServer } = await import('@modern-js/e2e');
    const { port } = await runStaticServer(process.cwd(), {
      volume: memfsVolume,
    });
    if (options?.hangOn) {
      // eslint-disable-next-line no-console
      console.log(
        `Successfully build, and hang on running server: http://localhost:${port}`,
      );
      typeof options.hangOn !== 'boolean' && options.hangOn.setTimeout(0);
      await new Promise(() => null);
    }
    return {
      baseurl: `http://localhost:${port}`,
      volume: memfsVolume,
      port,
    };
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
    unwrapOutputVolumeJSON,
    unwrapOutputFile,
    buildAndServe,
    matchWebpackPlugin,
    matchWebpackLoader,
    reset,
  };
}
