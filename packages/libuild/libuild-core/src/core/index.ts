import * as tapable from 'tapable';
import { FSWatcher } from 'chokidar';

import { LibuildError, warpErrors, LibuildFailure } from '../error';
import {
  CLIConfig,
  BuildConfig,
  ILibuilder,
  LibuildPlugin,
  ResolveArgs,
  LoadArgs,
  ResolveResult,
  LoadResult,
  Chunk,
  LibuildManifest,
  Callback,
  BuilderResolveResult,
  BuilderResolveOptions,
  ILibuilderStage,
  ILibuilderHooks,
  IBuilderBase,
  LibuildErrorParams,
} from '../types';
import { normalizeConfig } from '../config/normalize';
import { getInternalPlugin } from '../plugins/getInternalPlugin';
import { validateUserConfig, loadConfig } from '../config';
import { ErrorCode } from '../constants/error';
import { createTransformHook, createProcessAssetHook } from './utils';
import { TransformContext } from './transform';
import { SourcemapContext } from './sourcemap';
import { EsbuildBuilder } from '../bundler';
import { loadEnv } from '../utils';

export class Libuilder implements ILibuilder {
  compilation!: IBuilderBase;

  version!: string;

  watchedFiles: Set<string> = new Set();

  // @ts-ignore
  hooks: ILibuilderHooks;

  STAGE: ILibuilderStage = {
    /**
     * Execute Before Internal Plugin
     */
    PRE_INTERNAL: -255,
    /**
     * Execute After Internal Plugin
     */
    POST_INTERNAL: 255,
  };

  userConfig!: CLIConfig;

  config!: BuildConfig;

  plugins: LibuildPlugin[] = [];

  outputChunk: Map<string, Chunk> = new Map();

  virtualModule: Map<string, string> = new Map();

  name?: string;

  private errors: LibuildError[] = [];

  private watcher?: FSWatcher;

  static async run(config: CLIConfig = {}, name?: string): Promise<Libuilder | Libuilder[]> {
    loadEnv();
    const userConfig = await loadConfig(config);
    if (Array.isArray(userConfig)) {
      return Promise.all(
        userConfig.map(async (c) => {
          validateUserConfig(c);
          const compiler = await Libuilder.create(c);
          await compiler.build();
          return compiler;
        })
      );
    }
    validateUserConfig(userConfig);
    const compiler = await Libuilder.create(userConfig, name);
    await compiler.build();
    return compiler;
  }

  static async create(config: CLIConfig = {}, name?: string): Promise<Libuilder> {
    const builder = new Libuilder();

    builder.name = name;
    builder.version = require('../../package.json').version;

    try {
      await builder.init(config);
      await builder.hooks.initialize.promise();
    } catch (e: unknown) {
      builder.report(e);
      throw builder.getErrors();
    }

    return builder;
  }

  async init(config: CLIConfig) {
    this.userConfig = config;
    this.config = await normalizeConfig(config);
    this.hooks = Object.freeze({
      initialize: new tapable.AsyncSeriesHook<[], void>(),
      startCompilation: new tapable.AsyncSeriesHook<[]>([]),
      resolve: new tapable.AsyncSeriesBailHook<[ResolveArgs], ResolveResult | undefined>(['resolveArgs']),
      load: new tapable.AsyncSeriesBailHook<[LoadArgs], LoadResult | undefined | void>(['loadArgs']),
      transform: createTransformHook(this),
      processAsset: createProcessAssetHook(this),
      processAssets: new tapable.AsyncSeriesHook<[Map<string, Chunk>, LibuildManifest]>(['chunks', 'manifest']),
      endCompilation: new tapable.AsyncSeriesHook<[LibuildFailure]>(['errors']),
      watchChange: new tapable.SyncHook<[string[]]>(['id']),
      done: new tapable.AsyncSeriesHook<[]>([]),
      shutdown: new tapable.AsyncSeriesHook<[]>(),
    });
    // load plugins
    const userPlugin = this.config.plugins;
    const internalPlugin = await getInternalPlugin(this.config);
    this.plugins = [...userPlugin, ...internalPlugin];
    for (const plugin of this.plugins) {
      plugin.apply(this);
    }
    if (this.config.format === 'umd' && this.plugins.every((plugin) => plugin.name !== 'libuild:swc-umd')) {
      throw new Error('@modern-js/libuild-plugin-swc is required for umd format. Please install it`');
    }
  }

  async build() {
    this.compilation = new EsbuildBuilder(this);
    await this.compilation.build();
    const result = this.getErrors();

    /**
     * first build end
     *   - in watch mode, only print error
     *   - in normal mode
     *     - has error, will throw to outside,
     *     - otherwise print error
     */
    if (result.errors.length > 0 && !this.config.watch) {
      throw result;
    } else {
      this.printErrors();
    }
  }

  async close(callback?: Callback) {
    await this.hooks.shutdown.promise();
    this.compilation?.close(callback);
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

  addWatchFile(id: string): void {
    if (!this.watchedFiles.has(id)) {
      this.watcher?.add?.(id);
      this.watchedFiles.add(id);
    }
  }

  resolve(source: string, opt: BuilderResolveOptions): Promise<BuilderResolveResult> {
    throw new LibuildError(ErrorCode.RESOLVE_OUT_OF_PLUGIN, 'resolve is not allowed to called out of plugin');
  }

  async loadSvgr(path: string) {}

  private transformContextMap = new Map<string, TransformContext>();

  getTransformContext(path: string): TransformContext {
    if (this.transformContextMap.has(path)) {
      return this.transformContextMap.get(path)!;
    }
    const context: TransformContext = new TransformContext(true, !!this.config.sourceMap);
    this.transformContextMap.set(path, context);
    return context;
  }

  private sourcemapContextMap = new Map<string, SourcemapContext>();

  getSourcemapContext(path: string): SourcemapContext {
    if (this.sourcemapContextMap.has(path)) {
      return this.sourcemapContextMap.get(path)!;
    }
    const context: SourcemapContext = new SourcemapContext(!!this.config.sourceMap);
    this.sourcemapContextMap.set(path, context);
    return context;
  }

  report(err: any) {
    if (Array.isArray(err)) {
      this.errors.push(...err.map((item) => LibuildError.from(item)));
    } else {
      this.errors.push(LibuildError.from(err));
    }
  }

  throw(message: string, opts?: LibuildErrorParams) {
    throw new LibuildError(ErrorCode.PLUGIN_INTERNAL_ERROR, message, opts);
  }

  printErrors() {
    if (this.config.logLevel === 'silent') {
      return;
    }

    const data = this.getErrors();
    const formatted = data.toString();

    if (formatted.length > 0) {
      if (data.errors.length === 0) {
        this.config.logger.warn(formatted);
      } else {
        this.config.logger.error(formatted);
      }
    }
  }

  getErrors(): LibuildFailure {
    const data = this.errors.slice();

    return warpErrors(data, this.config?.logLevel);
  }

  clearErrors() {
    this.errors.length = 0;
  }

  removeError(...errors: LibuildError[]): void {
    for (const err of errors) {
      const index = this.errors.findIndex((item) => item === err);

      if (index > -1) {
        this.errors.splice(index, 1);
      }
    }
  }
}
