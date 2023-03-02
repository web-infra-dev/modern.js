import type {
  ChainedConfig,
  SharedToolsConfig,
  ToolsLessConfig,
  ToolsSassConfig,
} from '@modern-js/builder-shared';
import type { Options as HTMLPluginOptions } from '@rspack/plugin-html';
import type { PostCSSLoaderOptions, PostCSSPlugin } from '../thirdParty';
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

export type ToolsRspackConfig = ChainedConfig<
  RspackConfig,
  ModifyRspackConfigUtils
>;

export interface ToolsConfig extends SharedToolsConfig {
  htmlPlugin?: false | ToolsHtmlPluginConfig;
  postcss?: ToolsPostCSSLoaderConfig;
  rspack?: ToolsRspackConfig;
  less?: ToolsLessConfig;
  sass?: ToolsSassConfig;
}

export type NormalizedToolsConfig = ToolsConfig;
