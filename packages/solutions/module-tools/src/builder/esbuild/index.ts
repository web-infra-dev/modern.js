import {
  BuildResult,
  BuildOptions,
  BuildContext,
  context,
  build,
  OnLoadArgs,
  ImportKind,
  formatMessages,
  Format,
} from 'esbuild';
import * as tapable from 'tapable';
import { FSWatcher, chalk, logger, fs, lodash } from '@modern-js/utils';
import {
  BaseBuildConfig,
  BuilderHooks,
  Chunk,
  ICompiler,
  LoadResult,
  ModuleTools,
  PluginAPI,
  Context,
  HookList,
} from '../../types';
import { getInternalList } from '../feature';
import { cssExtensions } from '../../constants/build';
import { adapterPlugin } from './adapter';
import { TransformContext } from './transform';
import { SourcemapContext } from './sourcemap';
import { createRenderChunkHook, createTransformHook } from './hook';
import { createResolver } from './resolve';

export class EsbuildCompiler implements ICompiler {
  instance?: BuildContext;

  result?: BuildResult;

  hookList?: HookList;

  reBuildCount: number;

  buildOptions: BuildOptions;

  context: Context;

  config: BaseBuildConfig;

  hooks: BuilderHooks;

  api: PluginAPI<ModuleTools>;

  outputChunk: Map<string, Chunk> = new Map();

  watchedFiles: Set<string> = new Set();

  css_resolve: (id: string, dir: string) => string;

  node_resolve: (id: string, dir: string, kind: ImportKind) => string;

  watcher?: FSWatcher;

  virtualModule: Map<string, string> = new Map();

  private transformContextMap: Map<string, TransformContext> = new Map();

  private sourcemapContextMap: Map<string, SourcemapContext> = new Map();

  constructor(context: Context) {
    const { api, config, root } = context;
    this.reBuildCount = 0;
    this.context = context;
    this.api = api;
    this.config = config;
    this.buildOptions = this.convertConfigToEsbuild(config);
    this.hooks = Object.freeze({
      load: new tapable.AsyncSeriesBailHook<
        [OnLoadArgs],
        LoadResult | undefined | void
      >(['loadArgs']),
      transform: createTransformHook(this),
      renderChunk: createRenderChunkHook(this),
    });
    const resolveOptions = {
      root,
      platform: config.platform,
      alias: config.alias,
      tsconfig: config.tsconfig,
      mainFields: config.resolve.mainFields,
    };
    this.css_resolve = createResolver({
      ...resolveOptions,
      resolveType: 'css',
      extensions: cssExtensions,
      preferRelative: true,
    });
    this.node_resolve = createResolver({
      ...resolveOptions,
      resolveType: 'js',
      extensions: config.resolve.jsExtensions,
    });
  }

  async init() {
    const internal = await getInternalList(this.context);
    const user = this.config.hooks;
    this.hookList = [...user, ...internal];
    await Promise.all(this.hookList.map(item => item.apply(this)));
  }

  addWatchFile(id: string): void {
    if (!this.watchedFiles.has(id)) {
      this.watcher?.add?.(id);
      this.watchedFiles.add(id);
    }
  }

  convertConfigToEsbuild(config: BaseBuildConfig): BuildOptions {
    const {
      input,
      buildType,
      define,
      target,
      sourceMap,
      platform,
      splitting,
      outDir,
      sourceDir,
      minify,
      jsx,
      esbuildOptions,
      format,
      asset,
      tsconfig,
      banner,
      footer,
    } = config;

    const bundle = buildType === 'bundle';
    const entryNames = bundle ? '[name]' : '[dir]/[name]';
    const absWorkingDir = this.context.root;
    let esbuildFormat: Format = format === 'umd' ? 'esm' : format;
    if (bundle && format === 'cjs' && splitting) {
      esbuildFormat = 'esm';
    }
    const esbuildTarget = target === 'es5' ? undefined : target;
    const jsExtensions = ['.jsx', '.tsx', '.js', '.ts', '.json'];

    const buildOptions: BuildOptions = {
      banner: lodash.pick(banner, ['js', 'css']),
      footer: lodash.pick(footer, ['js', 'css']),
      entryPoints: input,
      metafile: true,
      define,
      bundle: buildType === 'bundle',
      format: esbuildFormat,
      target: esbuildTarget,
      sourcemap: sourceMap ? 'external' : false,
      resolveExtensions: jsExtensions,
      splitting,
      charset: 'utf8',
      logLimit: 5,
      absWorkingDir,
      platform,
      tsconfig: fs.existsSync(tsconfig) ? tsconfig : undefined,
      write: false,
      logLevel: 'silent',
      outdir: outDir,
      outbase: sourceDir,
      entryNames,
      plugins: [adapterPlugin(this)],
      minify: minify === 'esbuild',
      jsx,
      supported: {
        'dynamic-import': buildType === 'bundle' || format !== 'cjs',
      },
      assetNames: `${asset.path}/[name].[hash]`,
    };
    return esbuildOptions(buildOptions);
  }

  getTransformContext(path: string): TransformContext {
    if (this.transformContextMap.has(path)) {
      return this.transformContextMap.get(path)!;
    }
    const context: TransformContext = new TransformContext(
      Boolean(this.context.config.sourceMap),
    );
    this.transformContextMap.set(path, context);
    return context;
  }

  getSourcemapContext(path: string): SourcemapContext {
    if (this.sourcemapContextMap.has(path)) {
      return this.sourcemapContextMap.get(path)!;
    }
    const context: SourcemapContext = new SourcemapContext(
      Boolean(this.context.config.sourceMap),
    );
    this.sourcemapContextMap.set(path, context);
    return context;
  }

  emitAsset(name: string, chunk: string | Chunk) {
    if (typeof chunk === 'string') {
      this.outputChunk.set(name, {
        type: 'asset',
        contents: chunk,
        fileName: name,
      });
    } else {
      this.outputChunk.set(name, chunk);
    }
  }

  async close() {
    try {
      await this.instance?.cancel();
      await this.instance?.dispose();
    } catch (err) {}
  }

  async build() {
    const {
      buildOptions,
      context: { watch },
    } = this;
    try {
      if (watch) {
        this.instance = await context(buildOptions);
        this.result = await this.instance.rebuild();
      } else {
        this.result = await build(buildOptions);
      }
      if (this.result.warnings.length) {
        const warnings = this.result.warnings.filter(warning => {
          // filter all warnings that are related to "require"
          if (
            warning.text.includes(
              `This call to "require" will not be bundled because`,
            ) ||
            warning.text.includes(
              `Indirect calls to "require" will not be bundled`,
            ) ||
            warning.text.includes(
              `Converting "require" to "esm" is currently not supported`,
            )
          ) {
            return false;
          }

          return true;
        });

        const messages = await formatMessages(warnings, {
          kind: 'warning',
        });

        messages.forEach(m => {
          logger.warn(m);
        });
      }
    } catch (error: any) {
      if (watch) {
        this.instance?.cancel();
        logger.error(error);
      } else {
        throw error;
      }
    }
  }

  async reBuild(type: 'link' | 'change') {
    const { instance } = this;
    try {
      const start = Date.now();
      if (type === 'link') {
        await this.build();
      } else {
        this.result = await instance?.rebuild();
      }
      logger.info(
        chalk.green`Rebuild Successfully in ${Date.now() - start}ms`,
        chalk.yellow`Rebuild Count: ${++this.reBuildCount}`,
      );
    } catch (error: any) {
      logger.error(error);
    }
  }
}

export const createCompiler = async (context: Context) => {
  const compiler = new EsbuildCompiler(context);
  await compiler.init();
  return compiler;
};
