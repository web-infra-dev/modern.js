import type { ChainedConfig } from '@modern-js/builder-shared';
import type { DevServerOptions } from '@modern-js/types';

export type ToolsDevServerConfig = ChainedConfig<DevServerOptions>;

// TODO: add more configs
export interface ToolsConfig {
  /**
   * Modify the options of DevServer.
   */
  devServer?: ToolsDevServerConfig;
}

export type NormalizedToolsConfig = ToolsConfig;
