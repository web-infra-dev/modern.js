import type { ImportKind, Loader, BuildOptions } from 'esbuild';
import type { MinifyOptions as TerserMinifyOptions } from 'terser';
import type { Resolve, ResolveNormalized } from './resolve';
import type { LogLevel, ILogger } from '../logger';
import type { LibuildPlugin } from '../builder';
import type { Style } from './style';
import type { Asset, AssetNormalized } from './asset';

export * from './resolve';
export * from './config-loader';
export * from './style';
export * from './asset';

type Minify = 'esbuild' | 'terser' | false | TerserMinifyOptions;

export type Format = 'esm' | 'cjs' | 'umd' | 'iife';

type Input =
  | {
      [name: string]: string;
    }
  | string[];

type SourceMap = boolean | 'inline' | 'external';

type Globals = Record<any, any>;

type Define = Record<string, string>;

type External = (string | RegExp)[];

type Platform = 'node' | 'browser';

export type SideEffects = RegExp[] | boolean | ((id: string, external: boolean) => boolean);

/**
 * @experimental
 */
export type Redirect = {
  alias?: boolean;
  style?: boolean;
  asset?: boolean;
};

export interface UserConfig {
  /**
   * @default true
   */
  autoExternal?:
    | boolean
    | {
        dependencies?: boolean;
        peerDependencies?: boolean;
      };
  /**
   * @default true
   */
  bundle?: boolean;
  /**
   * Input to the bundling algorithm.
   *
   * Only valid when bundle is 'true'
   * @default { index: './src/index.ts '}
   */
  input?: Input;
  /**
   * The directory for source.
   *
   * Only valid when bundle is 'false', it will transform all files in sourceDir
   * @default 'src'
   */
  sourceDir?: string;
  /**
   * The directory for output
   * @default 'dist'
   */
  outdir?: string;
  /**
   * @see https://esbuild.github.io/api/#outbase
   * @default 'src'
   */
  outbase?: string;
  /**
   * Options for esbuild, it may disable some of the functions of libuild
   * @experimental
   */
  esbuildOptions?: (options: BuildOptions) => BuildOptions;
  /**
   * @see https://esbuild.github.io/api/#entry-names
   */
  entryNames?: string;
  /**
   * @see https://esbuild.github.io/api/#chunk-names
   */
  chunkNames?: string;
  /**
   * Module format
   * @default 'esm'
   */
  format?: Format;
  /**
   * Code splitting
   * @default false
   */
  splitting?: boolean;
  /**
   * Clean output directory before build
   * @default false
   */
  clean?: boolean;
  /**
   * Minify JS
   * @default false
   */
  minify?: Minify;
  /**
   * When file changed builder will rebuild under watch mode.
   * @default false
   */
  watch?: boolean;
  /**
   * The level of the console log
   * @default 'info'
   */
  logLevel?: LogLevel;
  /**
   * Options for enhanced-resolve
   */
  resolve?: Resolve;
  /**
   * Plugins for libuild
   */
  plugins?: LibuildPlugin[];
  /**
   * Compile target
   * @see https://esbuild.github.io/api/#target
   * @default 'es2015'
   */
  target?: string;
  /**
   * The mode of sourcemap
   * @default false
   */
  sourceMap?: SourceMap;
  /**
   * Global variables, only used in umd format
   * @default {}
   */
  globals?: Globals;
  /**
   * Exclude it from your build
   * Default Excluded your dependencies and peerDependencies
   */
  external?: External;
  /**
   * @see https://esbuild.github.io/api/#define
   */
  define?: Define;
  /**
   * @see https://esbuild.github.io/api/#platform
   * @default 'node'
   */
  platform?: Platform;
  /**
   * Emit esbuild metafile
   * @see https://esbuild.github.io/api/#metafile
   * @default false
   */
  metafile?: boolean;
  /**
   * Options for style
   */
  style?: Style;
  /**
   * Options for asset
   */
  asset?: Asset;
  /**
   * @see https://esbuild.github.io/api/#loader
   */
  loader?: Record<string, Loader>;
  /**
   * @see https://esbuild.github.io/api/#inject
   */
  inject?: string[];
  /**
   * @see https://esbuild.github.io/api/#jsx
   * @default 'automatic'
   */
  jsx?: 'automatic' | 'preserve' | 'transform';
  /**
   * Module sideEffects, it will invalidate the sideEffects field in package.json
   */
  sideEffects?: SideEffects;
  /**
   * Redirect id when bundle is false
   */
  redirect?: Redirect;
  /**
   * Cache for transform hooks, accelerate incremental build
   * @default true
   */
  transformCache?: boolean;
}

export interface CLIConfig extends UserConfig {
  /**
   * project root dir
   */
  root?: string;
  /**
   * The path of config file, default by `libuild.config.ts`.
   */
  configFile?: string;
}

export interface BuildConfig extends Required<Omit<CLIConfig, 'sideEffects' | 'chunkNames'>> {
  chunkNames?: string;
  sideEffects?: SideEffects;
  logger: ILogger;
  resolve: ResolveNormalized;
  asset: AssetNormalized;
  css_resolve: (id: string, dir: string) => string;
  node_resolve: (id: string, dir: string, kind?: ImportKind) => string;
}
