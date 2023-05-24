import type { ArrayOrNot, ChainedConfig, FileFilterUtil } from '../utils';
import type {
  DevServerOptions,
  BabelTransformOptions,
  BabelConfigUtils,
} from '@modern-js/types';
import type {
  AutoprefixerOptions,
  SassLoaderOptions,
  LessLoaderOptions,
  PugOptions,
  ForkTSCheckerOptions,
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

export type ToolsBabelConfig = ChainedConfig<
  BabelTransformOptions,
  BabelConfigUtils
>;

export type ToolsPugConfig = true | ChainedConfig<PugOptions>;

export type ToolsTSCheckerConfig = ChainedConfig<ForkTSCheckerOptions>;

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

  /**
   * Modify the options of [babel-loader](https://github.com/babel/babel-loader)
   *
   * When `tools.babel`'s type is Function，the default babel config will be passed in as the first parameter, the config object can be modified directly, or a value can be returned as the final result.
   *
   * When `tools.babel`'s type is `Object`, the config will be shallow merged with default config by `Object.assign`.
   *
   * Note that `Object.assign` is a shallow copy and will completely overwrite the built-in `presets` or `plugins` array, please use it with caution.
   */
  babel?: ToolsBabelConfig;

  /**
   * Configure the [Pug](https://pugjs.org/) template engine.
   */
  pug?: ToolsPugConfig;
  /**
   * Modify the options of [fork-ts-checker-webpack-plugin](https://github.com/TypeStrong/fork-ts-checker-webpack-plugin).
   */
  tsChecker?: ToolsTSCheckerConfig;
}
