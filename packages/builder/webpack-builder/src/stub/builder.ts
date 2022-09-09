import type * as playwright from '@modern-js/e2e/playwright';
import _ from '@modern-js/utils/lodash';
import assert from 'assert';
import { PathLike } from 'fs';
import { DirectoryJSON, Volume } from 'memfs/lib/volume';
import { webpackBuild } from '../core/build';
import { addDefaultPlugins, createPrimaryBuilder } from '../core/createBuilder';
import { Hooks } from '../core/createHook';
import {
  filenameToGlobExpr,
  globContentJSON,
  matchLoader,
  mergeBuilderOptions,
  STUB_BUILDER_PLUGIN_BUILTIN,
} from '../shared';
import type {
  BuilderOptions,
  BuilderPlugin,
  Context,
  PluginStore,
} from '../types';
import { createStubContext } from './context';

export interface OptionsPluginsItem {
  builtin?: boolean | 'default' | 'minimal';
  additional?: BuilderPlugin[];
}

export interface StubBuilderOptions extends BuilderOptions {
  context?: Context;
  /**
   * Setup builtin plugins and add custom plugins.
   * Automatically add builtin plugins by `process.env.STUB_BUILDER_PLUGIN_BUILTIN`.
   */
  plugins?: OptionsPluginsItem | OptionsPluginsItem[keyof OptionsPluginsItem];
  /** Whether to run webpack build. By default it will be `false` and skip webpack building. */
  webpack?: boolean | 'in-memory';
}

export type HookApi = {
  [key in keyof Hooks]: Parameters<Parameters<Hooks[key]['tap']>[0]>;
};

export interface ServeDestOptions {
  hangOn?: playwright.TestType<any, any> | boolean;
}

export async function applyPluginOptions(
  pluginStore: PluginStore,
  options?: StubBuilderOptions['plugins'],
) {
  const opt: Required<OptionsPluginsItem> = {
    builtin: STUB_BUILDER_PLUGIN_BUILTIN ?? false,
    additional: [],
    ...(typeof options === 'object' ? options : {}),
  };
  // normalize options
  if (typeof options === 'string' || typeof options === 'boolean') {
    opt.builtin = options;
  } else if (Array.isArray(options)) {
    opt.additional = options;
  }
  // apply plugins
  if (opt.builtin === true || opt.builtin === 'minimal') {
    // TODO: load minimal plugins
  } else if (opt.builtin === 'default') {
    await addDefaultPlugins(pluginStore);
  }
  pluginStore.addPlugins(opt.additional);
}

/**
 * Create stub builder for testing.
 * Some behaviors will be different to common `createBuilder`.
 */
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
  applyPluginOptions(pluginStore, options?.plugins);
  if (Array.isArray(options?.plugins)) {
    pluginStore.addPlugins(options!.plugins);
  }

  // replace outputFileSystem of Webpack.
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

  /**
   * Run build and caching args of all hooks.
   * It will run actual build only first time,
   * and always return cached result until {@link reset}.
   */
  const build = _.memoize(async () => {
    const executeBuild = options?.webpack ? webpackBuild : undefined;
    await buildImpl(executeBuild);
    return { resolvedHooks: { ...resolvedHooks } };
  });

  /**
   * Unwrap args of hook.
   *
   * The `unwrap` means it will try to run {@link build} and run some asserts before return.
   */
  const unwrapHook = async <T extends keyof HookApi>(
    hook: T,
  ): Promise<HookApi[T]> => (await build()).resolvedHooks[hook];

  /** Unwrap webpack configs. */
  const unwrapWebpackConfigs = async () => {
    const [{ webpackConfigs }] = await unwrapHook('onBeforeBuildHook');
    return webpackConfigs;
  };

  /** Unwrap webpack config, it will ensure there's only one config object. */
  const unwrapWebpackConfig = async () => {
    const webpackConfigs = await unwrapWebpackConfigs();
    assert(webpackConfigs.length === 1);
    return webpackConfigs[0];
  };

  /** Unwrap webpack compiler instance. */
  const unwrapWebpackCompiler = async () => {
    const [{ compiler }] = await unwrapHook('onAfterCreateCompilerHooks');
    return compiler;
  };

  /** Unwrap outputFileSystem of webpack and ensure it is {@link Volume}. */
  const unwrapOutputVolume = async () => {
    await build();
    assert(memfsVolume);
    return memfsVolume;
  };

  /** Serialize content of output files into JSON object. */
  const unwrapOutputJSON = async (
    paths: PathLike | PathLike[] = context.distPath,
    isRelative = false,
    maxSize = 4096,
  ): Promise<DirectoryJSON> => {
    await build();
    if (memfsVolume) {
      return memfsVolume.toJSON(paths, undefined, isRelative);
    } else {
      const _paths = _(paths)
        .castArray()
        .map(filenameToGlobExpr)
        .map(String)
        .value();
      return globContentJSON(_paths, { absolute: !isRelative, maxSize });
    }
  };

  /** Read output file content. */
  const readOutputFile = async (
    filename: string,
  ): Promise<string | undefined> => {
    const compiler = await unwrapWebpackCompiler();
    return new Promise((resolve, reject) => {
      compiler.outputFileSystem.readFile(filename, (err, data) =>
        err ? reject(err) : resolve(data?.toString('utf-8')),
      );
    });
  };

  /** Unwrap output file content, will ensure it is not empty. */
  const unwrapOutputFile = async (filename: string) => {
    await build();
    const content = await readOutputFile(filename);
    assert(content);
    return content;
  };

  /**
   * Run build and serve on `distPath`.
   * If `hangOn` is true, it will block running and let you debug the server.
   * Set `hangOn` to a {@link playwright.TestType} to automatically unset timeout of test.
   *
   * @example
   * test('should work', async () => {
   *   const builder = createStubBuilder();
   *   const { baseurl } = builder.buildAndServe({ hangOn: test });
   *   page.goto(`${baseurl}/index.html`);
   * });
   */
  const buildAndServe = async (options?: ServeDestOptions) => {
    const [{ runStaticServer }] = await Promise.all([
      import('@modern-js/e2e'),
      build(),
    ]);
    const { port } = await runStaticServer(context.distPath, {
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

  /** Match webpack plugin by constructor name. */
  const matchWebpackPlugin = async (pluginName: string) => {
    const config = await unwrapWebpackConfig();
    const result = config.plugins?.filter(
      item => item.constructor.name === pluginName,
    );
    if (Array.isArray(result)) {
      assert(result.length <= 1);
      return result[0] || null;
    } else {
      return result || null;
    }
  };

  /** Check if a file handled by specific loader. */
  const matchWebpackLoader = async (loader: string, testFile: string) =>
    matchLoader({ config: await unwrapWebpackConfig(), loader, testFile });

  /** Reset builder. @see {@link build} */
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
    unwrapOutputJSON,
    unwrapOutputFile,
    readOutputFile,
    buildAndServe,
    matchWebpackPlugin,
    matchWebpackLoader,
    reset,
  };
}
