import type {
  UserConfig as UserConfig_,
  ToolsConfig as ToolsConfig_,
  NewPluginConfig,
} from '@modern-js/core';
import type { UserConfig as LibuildUserConfig } from '@modern-js/libuild';
import { ModuleToolsHooks } from '..';
import type { DeepPartial } from '../utils';

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
export type DTS =
  | boolean
  | {
      distPath: string;
      tsconfigPath: string;
    };
export type SourceMap = Required<LibuildUserConfig>['sourceMap'];
export type Copy = { from: string; to?: string }[];
export interface BaseCommonBuildConfig {
  target: Target;
  entry: Entry;
  dts: DTS;
  sourceMap: SourceMap;
  copy: Copy;
}

export type BundleFormat = 'esm' | 'cjs' | 'umd' | 'iife';
export type BundleOptions = {
  platform: LibuildUserConfig['platform'];
  splitting: LibuildUserConfig['splitting'];
  minify: LibuildUserConfig['minify'];
  externals: LibuildUserConfig['external'];
  skipDeps:
    | boolean
    | {
        dependencies?: boolean;
        peerDependencies?: boolean;
      };
  assets: LibuildUserConfig['asset'];
  terserOptions: any;
};
export interface BaseBundleBuildConfig extends BaseCommonBuildConfig {
  buildType: 'bundle';
  format: BundleFormat;
  bundleOptions: BundleOptions;
}

export type BundlelessFormat = 'esm' | 'cjs';
export type Style = {
  compileMode:
    | 'all'
    | 'only-compiled-code'
    | /* may be will be deprecated */ 'only-source-code'
    | false;
  path: string;
};
export type Assets = { path: string };
export type BundlelessOptions = {
  style: Style;
  assets: Assets;
};
export interface BaseBundlelessBuildConfig extends BaseCommonBuildConfig {
  buildType: 'bundleless';
  format: BundlelessFormat;
  bundlelessOptions: BundlelessOptions;
}

export type BaseBuildConfig = BaseBundleBuildConfig | BaseBundlelessBuildConfig;
export type PartialBaseBuildConfig =
  | DeepPartial<BaseBundleBuildConfig>
  | DeepPartial<BaseBundlelessBuildConfig>;

export type BuildConfig = BaseBuildConfig | BaseBuildConfig[];
export type PartialBuildConfig =
  | PartialBaseBuildConfig
  | PartialBaseBuildConfig[];

export type BuildPreset =
  | string
  | ((options: { preset: Record<string, string> }) => PartialBuildConfig);

export interface SourceConfig {
  envVars: Array<string>;
  globalVars: Record<string, string>;
  alias:
    | Record<string, string>
    | ((aliases: Record<string, string>) => Record<string, unknown>);
  /**
   * The configuration of `source.designSystem` is provided by `tailwindcss` plugin.
   * Please use `yarn new` or `pnpm new` to enable the corresponding capability.
   * @requires `tailwindcss` plugin
   */
  designSystem: Record<string, any>;
}

export type ToolsConfig = Pick<
  ToolsConfig_,
  'babel' | 'jest' | 'less' | 'sass' | 'tailwindcss' | 'postcss'
>;

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
  source?: DeepPartial<SourceConfig>;

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
