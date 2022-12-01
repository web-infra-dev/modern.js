import type { ChainedConfig } from '@modern-js/builder-shared';
import type { DevServerOptions } from '@modern-js/types';
import type { Options as HTMLPluginOptions } from '@rspack/plugin-html';

export type ToolsDevServerConfig = ChainedConfig<DevServerOptions>;

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
}

export type NormalizedToolsConfig = ToolsConfig;
