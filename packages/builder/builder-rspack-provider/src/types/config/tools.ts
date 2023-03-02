import type {
  ChainedConfig,
  FileFilterUtil,
  SharedToolsConfig,
} from '@modern-js/builder-shared';
import type { Options as HTMLPluginOptions } from '@rspack/plugin-html';
import type {
  PostCSSLoaderOptions,
  PostCSSPlugin,
  LessLoaderOptions,
  SassLoaderOptions,
} from '../thirdParty';
import type { RspackConfig } from '../rspack';
import type { ModifyRspackConfigUtils } from '../hooks';

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

export interface ToolsConfig extends SharedToolsConfig {
  htmlPlugin?: false | ToolsHtmlPluginConfig;
  postcss?: ToolsPostCSSLoaderConfig;
  rspack?: ToolsRspackConfig;
  less?: ToolsLessConfig;
  sass?: ToolsSassConfig;
}

export type NormalizedToolsConfig = ToolsConfig;
