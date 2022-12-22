import type { ChainedConfig } from '../utils';
import type { DevServerOptions } from '@modern-js/types';

export type ToolsDevServerConfig = ChainedConfig<DevServerOptions>;

export interface SharedToolsConfig {
  /**
   * Modify the options of DevServer.
   */
  devServer?: ToolsDevServerConfig;
}
