import type { ArrayOrNot, ChainedConfig, FileFilterUtil } from '../utils';
import type { DevServerOptions } from '@modern-js/types';
import type {
  AutoprefixerOptions,
  SassLoaderOptions,
  LessLoaderOptions,
} from '../thirdParty';
import { BundlerChain } from '../bundlerConfig';
import { ModifyChainUtils } from '../hooks';

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

export type ToolsBundlerChainConfig = ArrayOrNot<
  (chain: BundlerChain, utils: ModifyChainUtils) => void
>;

export interface SharedToolsConfig {
  /**
   * Configure bundler config base on [webpack-chain](https://github.com/neutrinojs/webpack-chain)
   */
  bundlerChain?: ToolsBundlerChainConfig;
  /**
   * Modify the config of [autoprefixer](https://github.com/postcss/autoprefixer)
   */
  autoprefixer?: ToolsAutoprefixerConfig;

  /**
   * Modify the options of DevServer.
   */
  devServer?: ToolsDevServerConfig;
}
