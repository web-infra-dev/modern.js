import type {
  BuildContext,
  BuildOptions,
  OnLoadArgs,
  OnLoadResult,
  BuildResult,
  ImportKind,
} from 'esbuild';
import type { AsyncSeriesBailHook, AsyncSeriesWaterfallHook } from 'tapable';
import type { FSWatcher } from '@modern-js/utils';
import type { BaseBuildConfig } from './config';
import type { ModuleTools, PluginAPI } from '.';

export interface SourceMap {
  mappings: string;
  names: string[];
  sources: (string | null)[];
  version: number;
  sourcesContent?: (string | null)[];
}

export type LoadResult = Pick<
  OnLoadResult,
  'contents' | 'loader' | 'resolveDir'
> & {
  map?: SourceMap;
};

export interface BuilderHooks {
  /**
   * Equal to esbuild#onLoad
   */
  load: AsyncSeriesBailHook<[OnLoadArgs], LoadResult | undefined | void>;
  /**
   * Transform code after it is loaded.
   */
  transform: AsyncSeriesWaterfallHook<Source>;
  /**
   * Modify the chunk
   */
  renderChunk: AsyncSeriesWaterfallHook<[Chunk]>;
}

export type Context = {
  config: BaseBuildConfig;
  watch: boolean;
  root: string;
  api: PluginAPI<ModuleTools>;
};

export interface ICompiler {
  reBuild: (type: 'link' | 'change', config: BaseBuildConfig) => Promise<void>;
  css_resolve: (id: string, dir: string) => string;
  node_resolve: (id: string, dir: string, kind: ImportKind) => string | false;
  init: () => Promise<void>;

  watcher?: FSWatcher;

  instance?: BuildContext;

  result?: BuildResult;

  reBuildCount: number;

  buildOptions: BuildOptions;

  context: Context;

  config: BaseBuildConfig;

  hooks: BuilderHooks;

  api: PluginAPI<ModuleTools>;

  outputChunk: Map<string, Chunk>;
  virtualModule: Map<string, string>;
  build: (() => Promise<void>) & (() => Promise<void>);
  emitAsset: ((name: string, chunk: AssetChunk) => void) &
    ((name: string, chunk: JsChunk) => void) &
    ((name: string, chunk: string) => void);
  watchedFiles: Set<string>;
  addWatchFile: (id: string) => void;
  getTransformContext: (path: string) => ITransformContext;
  getSourcemapContext: (path: string) => ISourcemapContext;
  close: () => Promise<void>;
}

export interface ISourcemapContext {
  addSourceMap: (pluginId: number, map?: SourceMap) => void;
  getInlineSourceMap: () => string;
  getSourceMap: () => SourceMap | undefined;
  getSourceMapChain: () => SourceMap[];
  genPluginId: (id: string) => number;
}

export interface ITransformContext extends ISourcemapContext {
  addTransformResult: (pluginId: number, result: CacheValue) => void;
  getValidCache: (pluginId: number, code: string) => undefined | CacheValue;
}

export type Source = {
  code: string;
  map?: SourceMap;
  path: string;
  loader?: string;
};

export interface CacheValue extends Source {
  originCode: string;
}

export type AssetChunk = {
  type: 'asset';
  contents: string | Buffer;
  entryPoint?: string;
  /**
   * absolute file path
   */
  fileName: string;
  originalFileName?: string;
};

export type JsChunk = {
  type: 'chunk';
  contents: string;
  entryPoint?: string;
  /**
   * absolute file path
   */
  fileName: string;
  map?: SourceMap;
  modules?: Record<string, any>;
  originalFileName?: string;
};

export type Chunk = AssetChunk | JsChunk;

export const enum ChunkType {
  chunk = 'chunk',
  asset = 'asset',
}
