import type { ChainedConfig, FileFilterUtil } from '../utils';
import type { DevServerOptions } from '@modern-js/types';
import type {
  AutoprefixerOptions,
  SassLoaderOptions,
  LessLoaderOptions,
} from '../thirdParty';

/** html-rspack-plugin is compatible with html-webpack-plugin */
export type { Options as HTMLPluginOptions } from 'html-webpack-plugin';

export type ToolsDevServerConfig = ChainedConfig<DevServerOptions>;

export type ToolsAutoprefixerConfig = ChainedConfig<AutoprefixerOptions>;

export type ToolsSassConfig = ChainedConfig<
  SassLoaderOptions,
  { addExcludes: FileFilterUtil }
>;

export type ToolsLessConfig = ChainedConfig<
  LessLoaderOptions,
  { addExcludes: FileFilterUtil }
>;

export interface SharedToolsConfig {
  /**
   * Modify the config of [autoprefixer](https://github.com/postcss/autoprefixer)
   */
  autoprefixer?: ToolsAutoprefixerConfig;

  /**
   * Modify the options of DevServer.
   */
  devServer?: ToolsDevServerConfig;
}
