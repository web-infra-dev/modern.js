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
  LibuildErrorInstance,
} from '../types';
import { normalizeConfig } from '../utils/normalizeConfig';
import { getInternalPlugin } from '../plugins/getInternalPlugin';
import { ErrorCode } from '../constants/error';
import { EsbuildBuilder } from '../bundler';
import { createTransformHook, createProcessAssetHook } from './utils';
import { TransformContext } from './transform';
import { SourcemapContext } from './sourcemap';

export class Libuilder implements ILibuilder {
  static async run(
    config: CLIConfig = {},
    name?: string,
  ): Promise<Libuilder | Libuilder[]> {
    const compiler = await Libuilder.create(config, name);
    await compiler.build();
    return compiler;
  }

  static async create(
    config: CLIConfig = {},
    name?: string,
  ): Promise<Libuilder> {
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

  compilation!: IBuilderBase;

  version!: string;

  watchedFiles: Set<string> = new Set();

  // @ts-expect-error
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

  private transformContextMap: Map<string, TransformContext> = new Map();

  private sourcemapContextMap: Map<string, SourcemapContext> = new Map();

  async init(config: CLIConfig) {
    this.userConfig = config;
    this.config = await normalizeConfig(config);
    this.hooks = Object.freeze({
      initialize: new tapable.AsyncSeriesHook<[], void>(),
      startCompilation: new tapable.AsyncSeriesHook<[]>([]),
      resolve: new tapable.AsyncSeriesBailHook<
        [ResolveArgs],
        ResolveResult | undefined
      >(['resolveArgs']),
      load: new tapable.AsyncSeriesBailHook<
        [LoadArgs],
        LoadResult | undefined | void
      >(['loadArgs']),
      transform: createTransformHook(this),
      processAsset: createProcessAssetHook(this),
      processAssets: new tapable.AsyncSeriesHook<
        [Map<string, Chunk>, LibuildManifest]
      >(['chunks', 'manifest']),
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

  resolve(
    _source: string,
    _opt?: BuilderResolveOptions,
  ): Promise<BuilderResolveResult> {
    throw new LibuildError(
      ErrorCode.RESOLVE_OUT_OF_PLUGIN,
      'resolve is not allowed to called out of plugin',
    );
  }

  async loadSvgr(_path: string) {}

  getTransformContext(path: string): TransformContext {
    if (this.transformContextMap.has(path)) {
      return this.transformContextMap.get(path)!;
    }
    const context: TransformContext = new TransformContext(
      true,
      Boolean(this.config.sourceMap),
    );
    this.transformContextMap.set(path, context);
    return context;
  }

  getSourcemapContext(path: string): SourcemapContext {
    if (this.sourcemapContextMap.has(path)) {
      return this.sourcemapContextMap.get(path)!;
    }
    const context: SourcemapContext = new SourcemapContext(
      Boolean(this.config.sourceMap),
    );
    this.sourcemapContextMap.set(path, context);
    return context;
  }

  report(err: any) {
    if (Array.isArray(err)) {
      this.errors.push(...err.map(item => LibuildError.from(item)));
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

  removeError(...errors: LibuildErrorInstance[]): void {
    for (const err of errors) {
      const index = this.errors.findIndex(item => item === err);

      if (index > -1) {
        this.errors.splice(index, 1);
      }
    }
  }
}
