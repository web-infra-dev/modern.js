import type {
  UserConfig as UserConfig_,
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

export type Format = 'esm' | 'cjs' | 'umd' | 'iife';

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

export type Input = Required<LibuildUserConfig>['input'];

export type DTSOptions = {
  distPath: string;
  tsconfigPath: string;
  only: boolean;
};
export type DTS = false | Partial<DTSOptions>;

export type SvgrOptions = {
  include: string | RegExp | (string | RegExp)[];
  exclude: string | RegExp | (string | RegExp)[];
};

export interface Asset {
  path?: LibuildAsset['outdir'];
  limit?: LibuildAsset['limit'];
  publicPath?: LibuildAsset['publicPath'];
  svgr?: boolean | SvgrOptions;
}
export type SourceMap = Required<LibuildUserConfig>['sourceMap'];
export type AutoExternal =
  | boolean
  | {
      dependencies?: boolean;
      peerDependencies?: boolean;
    };
export type JSX = 'automatic' | 'transform';

export type AliasOption =
  | Record<string, string>
  | ((aliases: Record<string, string>) => Record<string, string> | void);

export type BaseBuildConfig = Omit<Required<PartialBaseBuildConfig>, 'dts'> & {
  dts: false | DTSOptions;
};

export type PartialBaseBuildConfig = {
  buildType?: 'bundleless' | 'bundle';
  format?: Format;
  target?: Target;
  dts?: DTS;
  sourceMap?: SourceMap;
  sourceDir?: string;
  copy?: CopyConfig;
  asset?: Asset;
  jsx?: JSX;
  outdir?: string;
  alias?: AliasOption;
  input?: Input;
  platform?: LibuildUserConfig['platform'];
  splitting?: LibuildUserConfig['splitting'];
  minify?: LibuildUserConfig['minify'];
  externals?: LibuildUserConfig['external'];
  autoExternal?: AutoExternal;
  entryNames?: LibuildUserConfig['entryNames'];
  umdGlobals?: LibuildUserConfig['globals'];
  umdModuleName?: ((chunkName: string) => string) | string | undefined;
  define?: LibuildUserConfig['define'];
};

export type BuildConfig = BaseBuildConfig | BaseBuildConfig[];
export type PartialBuildConfig =
  | PartialBaseBuildConfig
  | PartialBaseBuildConfig[];

export type BuildPreset =
  | keyof typeof presetList
  | ((options: {
      preset: typeof BuildInPreset;
    }) => PartialBuildConfig | Promise<PartialBuildConfig>);

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
}

export interface StorybookDevConfig {
  name?: string;
}
export interface Dev {
  storybook: StorybookDevConfig;
}

export interface UserConfig {
  designSystem?: Record<string, any>;

  buildConfig?: PartialBuildConfig;

  buildPreset?: BuildPreset;

  dev?: DeepPartial<Dev>;

  tools?: Partial<ToolsConfig>;

  plugins?: NewPluginConfig<ModuleToolsHooks>;

  testing?: Pick<UserConfig_, 'testing'>;
}

export type Config =
  | UserConfig
  | Promise<UserConfig>
  | ((env: any) => UserConfig | Promise<UserConfig>);
