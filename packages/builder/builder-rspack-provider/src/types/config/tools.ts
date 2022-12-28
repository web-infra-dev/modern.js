import type {
  ChainedConfig,
  SharedToolsConfig,
  FileFilterUtil,
} from '@modern-js/builder-shared';
import type { Options as HTMLPluginOptions } from '@rspack/plugin-html';
import type {
  AutoprefixerOptions,
  PostCSSLoaderOptions,
  PostCSSPlugin,
  LessLoaderOptions,
  SassLoaderOptions,
} from '../thirdParty';
import type { RspackConfig } from '../rspack';
import type { ModifyRspackConfigUtils } from '../hooks';

export type ToolsAutoprefixerConfig = ChainedConfig<AutoprefixerOptions>;

export type ToolsPostCSSLoaderConfig = ChainedConfig<
  PostCSSLoaderOptions,
  {
    addPlugins: (plugins: PostCSSPlugin | PostCSSPlugin[]) => void;
  }
>;

type ToolsHtmlPluginConfig = ChainedConfig<
  HTMLPluginOptions,
  {
    entryName: string;
    entryValue: string | string[];
  }
>;

export type ToolsLessConfig = ChainedConfig<
  LessLoaderOptions,
  { addExcludes: FileFilterUtil }
>;

export type ToolsRspackConfig = ChainedConfig<
  RspackConfig,
  ModifyRspackConfigUtils
>;

export type ToolsSassConfig = ChainedConfig<
  SassLoaderOptions,
  { addExcludes: FileFilterUtil }
>;

// TODO: add more configs
export interface ToolsConfig extends SharedToolsConfig {
  htmlPlugin?: false | ToolsHtmlPluginConfig;
  autoprefixer?: ToolsAutoprefixerConfig;
  postcss?: ToolsPostCSSLoaderConfig;
  rspack?: ToolsRspackConfig;
  less?: ToolsLessConfig;
  sass?: ToolsSassConfig;
}

export type NormalizedToolsConfig = ToolsConfig;
