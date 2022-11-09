import type {
  UserConfig as UserConfig_,
  ToolsConfig as ToolsConfig_,
  NewPluginConfig,
} from '@modern-js/core';
import type {
  UserConfig as LibuildUserConfig,
  Asset as LibuildAsset,
} from '@modern-js/libuild';
import { ModuleToolsHooks } from '..';
import type { DeepPartial } from '../utils';
import { BuildInPreset, presetList } from '../../constants/build-presets';
import type { CopyConfig } from '../copy';
import type { LessConfig, SassConfig, PostCSSConfig } from './style';

export * from './style';

export type BuildType = 'bundleless' | 'bundle';

export type BundlelessFormat = 'esm' | 'cjs';
export type BundleFormat = 'esm' | 'cjs' | 'umd' | 'iife';
export type Format = BundlelessFormat | BundleFormat;

export type Target =
  | 'es5'
  | 'es6'
  | 'es2015'
  | 'es2016'
  | 'es2017'
  | 'es2018'
  | 'es2019'
  | 'es2020'
  // The default target is esnext which means that by default, assume all of the latest JavaScript and CSS features are supported.
  | 'esnext';

export type Entry = Required<LibuildUserConfig>['input'];
export type DTSOptions = {
  distPath: string;
  tsconfigPath: string;
  only: boolean;
};
export type DTS = false | DTSOptions;
export interface Asset {
  path: LibuildAsset['outdir'];
  rebase: LibuildAsset['rebase'];
  name: LibuildAsset['name'];
  limit: LibuildAsset['limit'];
  publicPath: LibuildAsset['publicPath'];
}
export type SourceMap = Required<LibuildUserConfig>['sourceMap'];
export type SkipDeps =
  | boolean
  | {
      dependencies?: boolean;
      devDependencies?: boolean;
      peerDependencies?: boolean;
    };
export type JSX = Exclude<Required<LibuildUserConfig>['jsx'], 'preserve'>;

export interface BaseCommonBuildConfig {
  target: Target;
  dts: DTS;
  sourceMap: SourceMap;
  copy: CopyConfig;
  asset?: Asset;
  jsx: JSX;
  path: string;
}
export interface PartialBaseCommonBuildConfig {
  target?: Target;
  dts?: false | Partial<DTSOptions>;
  sourceMap?: SourceMap;
  copy?: CopyConfig;
  asset?: Partial<Asset>;
  jsx?: JSX;
  path?: string;
}

export type BundleOptions = {
  entry: Entry;
  platform: LibuildUserConfig['platform'];
  splitting: LibuildUserConfig['splitting'];
  minify: LibuildUserConfig['minify'];
  externals: LibuildUserConfig['external'];
  skipDeps: SkipDeps;
  entryNames: LibuildUserConfig['entryNames'];
  globals: LibuildUserConfig['globals'];
  metafile: LibuildUserConfig['metafile'];
  umdModuleName: ((chunkName: string) => string) | string | undefined;
};
export interface BaseBundleBuildConfig extends BaseCommonBuildConfig {
  buildType: 'bundle';
  format: BundleFormat;
  bundleOptions: BundleOptions;
}
export interface PartialBaseBundleBuildConfig
  extends PartialBaseCommonBuildConfig {
  buildType?: 'bundle';
  format?: BundleFormat;
  bundleOptions?: DeepPartial<BundleOptions>;
}

export type Assets = { path: string };
export type StyleCompileMode = 'with-source-code' | 'only-compiled-code';
export type BundlelessOptions = {
  sourceDir: string;
  styleCompileMode: StyleCompileMode;
};
export interface BaseBundlelessBuildConfig extends BaseCommonBuildConfig {
  buildType: 'bundleless';
  format: BundlelessFormat;
  bundlelessOptions: BundlelessOptions;
}
export interface PartialBaseBundlelessBuildConfig
  extends PartialBaseCommonBuildConfig {
  buildType?: 'bundleless';
  format?: BundlelessFormat;
  bundlelessOptions?: DeepPartial<BundlelessOptions>;
}

export type BaseBuildConfig = BaseBundleBuildConfig | BaseBundlelessBuildConfig;
export type PartialBaseBuildConfig =
  | PartialBaseBundleBuildConfig
  | PartialBaseBundlelessBuildConfig;

export type BuildConfig = BaseBuildConfig | BaseBuildConfig[];
export type PartialBuildConfig =
  | PartialBaseBuildConfig
  | PartialBaseBuildConfig[];

export type BuildPreset =
  | keyof typeof presetList
  | ((options: {
      preset: typeof BuildInPreset;
    }) => PartialBuildConfig | Promise<PartialBuildConfig>);

export type AliasOption =
  | Record<string, string>
  | ((aliases: Record<string, string>) => Record<string, string> | void);
export interface SourceConfig {
  envVars: string[];
  globalVars: Record<string, string>;
  alias: AliasOption;
  /**
   * The configuration of `source.designSystem` is provided by `tailwindcss` plugin.
   * Please use `yarn new` or `pnpm new` to enable the corresponding capability.
   * @requires `tailwindcss` plugin
   */
  designSystem: Record<string, any>;
}

export interface ToolsConfig {
  less?: LessConfig;
  sass?: SassConfig;
  postcss?: PostCSSConfig;
  /**
   * The configuration of `tools.tailwindcss` is provided by `tailwindcss` plugin.
   * Please use `yarn new` or `pnpm new` to enable the corresponding capability.
   * @requires `tailwindcss` plugin
   */
  tailwindcss?:
    | Record<string, any>
    | ((options: Record<string, any>) => Record<string, any> | void);
  jest?: Pick<Required<ToolsConfig_>, 'jest'>;
}

export interface StorybookDevConfig {
  name?: string;
}
export interface Dev {
  storybook: StorybookDevConfig;
}

export interface ResolvedConfig {
  source: SourceConfig;

  buildConfig?: BuildConfig;

  buildPreset?: BuildPreset;

  dev: Dev;

  tools?: ToolsConfig;

  plugins: NewPluginConfig<ModuleToolsHooks>;

  testing?: Pick<UserConfig_, 'testing'>;
}

export interface UserConfig {
  source?: Partial<SourceConfig>;

  buildConfig?: PartialBuildConfig;

  buildPreset?: BuildPreset;

  dev?: DeepPartial<Dev>;

  tools?: DeepPartial<ToolsConfig>;

  plugins?: NewPluginConfig<ModuleToolsHooks>;

  testing?: Pick<UserConfig_, 'testing'>;
}

export type Config =
  | UserConfig
  | Promise<UserConfig>
  | ((env: any) => UserConfig | Promise<UserConfig>);
