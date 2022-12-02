import type { ChainedConfig } from '@modern-js/builder-shared';
import type { DevServerOptions } from '@modern-js/types';
import type { Options as HTMLPluginOptions } from '@rspack/plugin-html';
import type {
  AutoprefixerOptions,
  PostCSSLoaderOptions,
  PostCSSPlugin,
} from '../thirdParty';

export type ToolsDevServerConfig = ChainedConfig<DevServerOptions>;
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

// TODO: add more configs
export interface ToolsConfig {
  /**
   * Modify the options of DevServer.
   */
  devServer?: ToolsDevServerConfig;
  htmlPlugin?: false | ToolsHtmlPluginConfig;
  autoprefixer?: ToolsAutoprefixerConfig;
  postcss?: ToolsPostCSSLoaderConfig;
}

export type NormalizedToolsConfig = ToolsConfig;
