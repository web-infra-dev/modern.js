import type { ChainedConfig } from '../utils';
import type { DevServerOptions } from '@modern-js/types';

/** html-rspack-plugin is compatible with html-webpack-plugin */
export type { Options as HTMLPluginOptions } from 'html-webpack-plugin';

export type ToolsDevServerConfig = ChainedConfig<DevServerOptions>;

export interface SharedToolsConfig {
  /**
   * Modify the options of DevServer.
   */
  devServer?: ToolsDevServerConfig;
}
