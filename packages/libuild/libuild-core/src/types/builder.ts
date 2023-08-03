import type { Metafile, OnResolveArgs, OnLoadArgs, OnResolveResult, OnLoadResult, BuildOptions, Loader } from 'esbuild';
import { AsyncSeriesBailHook, AsyncSeriesHook, AsyncSeriesWaterfallHook, SyncHook } from 'tapable';
import { ImportKind } from 'esbuild';
import { CLIConfig, BuildConfig } from './config';
import { Callback } from './callback';
import { LibuildErrorInstance, LibuildErrorParams } from './error';
import { LibuildFailure } from '../error';

export interface ILibuilderHooks {
  /**
   * Asynchronous initialization. Executed after normalized `buildConfig` and `plugins`.
   */
  initialize: AsyncSeriesHook<[], void>;
  /**
   * Equal to esbuild#onResolve and rollup#resolveId
   */
  resolve: AsyncSeriesBailHook<[ResolveArgs], ResolveResult | undefined>;
  /**
   * Equal to esbuild#onLoad and rollup#load
   */
  load: AsyncSeriesBailHook<[LoadArgs], LoadResult | undefined | void>;
  /**
   *
   */
  transform: AsyncSeriesWaterfallHook<Source>;
  /**
   * Modify the chunk
   */
  processAsset: AsyncSeriesWaterfallHook<[Chunk]>;
  /**
   * After esbuild onStart, also called by watchChange
   */
  startCompilation: AsyncSeriesHook<[]>;
  /**
   * After esbuild onEnd, also called by watchChange
   */
  endCompilation: AsyncSeriesHook<[LibuildFailure]>;
  /**
   * Post processing for assets
   */
  processAssets: AsyncSeriesHook<[Map<string, Chunk>, LibuildManifest]>;
  /**
   * Watch related hook
   */
  watchChange: SyncHook<[string[]]>; // we make this sync to compatible with rollup watchChange
  /**
   * Before close
   */
  shutdown: AsyncSeriesHook<[]>;
}

export declare interface ILibuilderStage {
  /**
   * Execute Before Internal Plugin
   */
  PRE_INTERNAL: number;
  /**
   * Execute After Internal Plugin
   */
  POST_INTERNAL: number;
}

export interface BuilderResolveResult {
  path: string;
  suffix?: string;
  external?: boolean;
  sideEffects?: boolean;
}

export interface BuilderResolveOptions {
  kind?: ImportKind;
  importer?: string;
  resolveDir?: string;
  skipSideEffects?: boolean;
}

type LoadSvgrResult = {
  contents: string;
  loader: Loader;
};

export interface IBuilderBase {
  build(): Promise<void>;
  reBuild(type: 'link' | 'change'): Promise<void>;
  close(callack?: Callback): void;
}

export interface ILibuilder {
  name?: string;
  version: string;
  compilation: IBuilderBase;
  hooks: ILibuilderHooks;
  STAGE: ILibuilderStage;
  userConfig: CLIConfig;
  config: BuildConfig;
  plugins: LibuildPlugin[];
  outputChunk: Map<string, Chunk>;
  virtualModule: Map<string, string>;
  init(config: CLIConfig): Promise<void>;
  build(): Promise<void>;
  close(callBack?: Callback): Promise<void>;
  emitAsset(name: string, chunk: AssetChunk): void;
  emitAsset(name: string, chunk: JsChunk): void;
  emitAsset(name: string, chunk: string): void;
  watchedFiles: Set<string>;
  addWatchFile(id: string): void;
  resolve(source: string, options?: BuilderResolveOptions): Promise<BuilderResolveResult>;
  loadSvgr(path: string): Promise<LoadSvgrResult | void>;
  getTransformContext(path: string): ITransformContext;
  getSourcemapContext(path: string): ISourcemapContext;
  report(error: any): void;
  throw(message: string, option: LibuildErrorParams): void;
  printErrors(): void;
  getErrors(): LibuildFailure;
  clearErrors(): void;
  removeError(...errors: LibuildErrorInstance[]): void;
}

export interface ITransformContext extends ISourcemapContext {
  addTransformResult(pluginId: number, result: CacheValue): void;
  getValidCache(pluginId: number, code: string): undefined | CacheValue;
}

export interface CacheValue extends Source {
  originCode: string;
}

export interface ISourcemapContext {
  addSourceMap(pluginId: number, map?: SourceMap): void;
  getInlineSourceMap(): string;
  getSourceMap(): SourceMap | undefined;
  getSourceMapChain(): SourceMap[];
  genPluginId(id: string): number;
}

export interface SourceMap {
  mappings: string;
  names: string[];
  sources: (string | null)[];
  version: number;
  sourcesContent?: (string | null)[];
}

export type ExtraContext = Record<string, any>;

/**
 * Only merge additional fields from U to T.
 */
export type SafeMerge<T, U> = T & {
  [K in keyof U as Exclude<K, keyof T>]: U[K];
};

export interface LibuildPlugin<T extends ExtraContext = ExtraContext> {
  name: string;
  apply(compiler: SafeMerge<ILibuilder, T>): void;
}

export type ResolveArgs = Pick<OnResolveArgs, 'importer' | 'path' | 'resolveDir' | 'kind'>;
export type ResolveResult = Pick<OnResolveResult, 'path' | 'external' | 'namespace' | 'sideEffects' | 'suffix'>;

export type LoadArgs = Pick<OnLoadArgs, 'path'> & Pick<OnResolveResult, 'pluginData'>;
export type LoadResult = Pick<OnLoadResult, 'contents' | 'loader' | 'resolveDir'> & {
  map?: SourceMap;
};

export type AssetChunk = {
  type: 'asset';
  contents: string | Buffer;
  /**
   * absolute file path
   */
  fileName: string;
  originalFileName?: string;
  entryPoint?: string;
};

export type JsChunk = {
  type: 'chunk';
  contents: string;
  /**
   * absolute file path
   */
  fileName: string;
  originalFileName?: string;
  map?: SourceMap;
  entryPoint?: string;
  modules?: Record<string, any>;
  isEntry: boolean;
};

export type Chunk = AssetChunk | JsChunk;

export type Source = {
  code: string;
  map?: SourceMap;
  path: string;
  loader?: string;
  /**
   * Whether enable cache.
   * @default true
   */
  cache?: boolean;
};

export const enum ChunkType {
  chunk = 'chunk',
  asset = 'asset',
}

export type LibuildManifest = {
  metafile: Metafile;
  config: BuildOptions;
};
