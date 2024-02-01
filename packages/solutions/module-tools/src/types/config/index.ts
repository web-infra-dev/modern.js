import type { BuildOptions } from 'esbuild';
import type { CreateFilter } from '@rollup/pluginutils';
import type { MinifyOptions as TerserMinifyOptions } from 'terser';
import type { TestConfig } from '@modern-js/types';
import type { Config } from '../../../compiled/@svgr/core';
import { internalPreset, presetList } from '../../constants/preset';
import { ICompiler } from '../esbuild';
import type { ImportItem } from './transform-import';
import type { CopyConfig } from './copy';
import type { Dev } from './dev';
import type { Style, StyleConfig } from './style';

export * from './style';

export * from './dev';

export * from './copy';

export type HookList = {
  name: string;
  apply: (compiler: ICompiler) => void;
}[];

export type EsbuildOptions = (options: BuildOptions) => BuildOptions;

export type BuildType = 'bundleless' | 'bundle';

export type Target =
  | 'es5'
  | 'es6'
  | 'es2015'
  | 'es2016'
  | 'es2017'
  | 'es2018'
  | 'es2019'
  | 'es2020'
  | 'es2021'
  | 'es2022'
  // The default target is esnext which means that by default, assume all of the latest JavaScript and CSS features are supported.
  | 'esnext';

export type Minify = 'esbuild' | 'terser' | false | TerserMinifyOptions;

export type Format = 'esm' | 'cjs' | 'umd' | 'iife';

export type Input =
  | {
      [name: string]: string;
    }
  | string[];

export type Globals = Record<any, any>;

export type Define = Record<string, string>;

export type Externals = (string | RegExp)[];

export type Platform = 'node' | 'browser';

export type SideEffects =
  | RegExp[]
  | boolean
  | ((id: string, external: boolean) => boolean);

/**
 * @experimental
 */
export type Redirect = {
  alias?: boolean;
  style?: boolean;
  asset?: boolean;
  autoExtension?: boolean;
};

export type DTSOptions = {
  abortOnError: boolean;
  distPath: string;
  /**
   * Build one or more projects and their dependencies, if out of date
   * The same as 'tsc --build'
   * @default false
   */
  enableTscBuild: boolean;
  only: boolean;
  /**
   * @deprecated
   * use buildConfig.tsconfig instead.
   */
  tsconfigPath?: string;
  /**
   * Only for rollup-plugin-dts, see more in https://github.com/Swatinem/rollup-plugin-dts#what-to-expect.
   * We hope you use external to prevent them(like @types) which come from node_modules from be bundled.
   * However, some types from outside that we don't re-export are also checked by plugin.
   * And a third-party package is uncontrollable, it may cause errors.
   * You can overridden by setting it false to excluded all packages from node_modules.
   * @default true
   */
  respectExternal: boolean;
};

export type DTS = false | Partial<DTSOptions>;

export interface SvgrOptions extends Config {
  include?: Parameters<CreateFilter>[0];
  exclude?: Parameters<CreateFilter>[1];
}

export interface Asset {
  path?: string;
  limit?: number;
  publicPath?: string | ((filePath: string) => string);
  svgr?: boolean | SvgrOptions;
}

export type AutoExternal =
  | boolean
  | {
      dependencies?: boolean;
      peerDependencies?: boolean;
    };

export type JSX = 'automatic' | 'transform' | 'preserve';

export type ExternalHelpers = boolean;

export type BannerAndFooter = {
  js?: string;
  css?: string;
  dts?: string;
};

export type AliasOption =
  | Record<string, string>
  | ((aliases: Record<string, string>) => Record<string, string> | void);

export type Resolve = {
  mainFields?: string[];
  jsExtensions?: string[];
};

export type BaseBuildConfig = Omit<
  Required<PartialBaseBuildConfig>,
  'dts' | 'style' | 'alias' | 'sideEffects' | 'asset' | 'resolve'
> & {
  sideEffects?: SideEffects;
  dts: false | DTSOptions;
  style: Style;
  alias: Record<string, string>;
  asset: Required<Asset>;
  resolve: Required<Resolve>;
};

export type PartialBaseBuildConfig = {
  shims?: boolean;
  autoExtension?: boolean;
  resolve?: Resolve;
  footer?: BannerAndFooter;
  banner?: BannerAndFooter;
  buildType?: 'bundleless' | 'bundle';
  format?: Format;
  target?: Target;
  dts?: DTS;
  sourceMap?: boolean | 'inline' | 'external';
  sourceDir?: string;
  copy?: CopyConfig;
  asset?: Asset;
  jsx?: JSX;
  outDir?: string;
  alias?: AliasOption;
  hooks?: HookList;
  input?: Input;
  tsconfig?: string;
  metafile?: boolean;
  platform?: Platform;
  splitting?: boolean;
  minify?: Minify;
  externals?: Externals;
  autoExternal?: AutoExternal;
  umdGlobals?: Globals;
  umdModuleName?: ((chunkName: string) => string) | string | undefined;
  define?: Define;
  style?: StyleConfig;
  redirect?: Redirect;
  sideEffects?: SideEffects;
  esbuildOptions?: EsbuildOptions;
  /**
   * @internal
   * cache transform result or not
   */
  transformCache?: boolean;
  // The following is related to swc-transform
  externalHelpers?: ExternalHelpers;
  transformImport?: ImportItem[];
  transformLodash?: boolean;
  /**
   * @deprecated
   * @internal
   */
  disableSwcTransform?: boolean;
  /**
   * @deprecated
   */
  sourceType?: 'commonjs' | 'module';
};

export type BuildConfig = BaseBuildConfig | BaseBuildConfig[];
export type PartialBuildConfig =
  | PartialBaseBuildConfig
  | PartialBaseBuildConfig[];

export type BuildPreset =
  | keyof typeof presetList
  | ((options: {
      preset: typeof internalPreset;
      extendPreset: (
        extendPresetName: keyof typeof internalPreset,
        extendBuildConfig: PartialBaseBuildConfig,
      ) => PartialBaseBuildConfig[];
    }) => PartialBaseBuildConfig[] | Promise<PartialBaseBuildConfig[]>);

export interface RuntimeUserConfig {
  [name: string]: any;
}

export interface ModuleExtraConfig {
  /**
   * @deprecated designSystem is no longer required.
   * If you are using Tailwind CSS, you can now use the `theme` option of Tailwind CSS, they are the same.
   */
  designSystem?: Record<string, any>;

  buildConfig?: PartialBuildConfig;

  buildPreset?: BuildPreset;

  dev?: Dev;

  testing?: TestConfig;

  runtime?: RuntimeUserConfig;
}
