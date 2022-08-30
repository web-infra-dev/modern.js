export { createBuilder } from './core/createBuilder';
export { mergeBuilderConfig } from './core/mergeConfig';

export type {
  // Plugin Types
  BuilderPlugin,
  BuilderContext,
  BuilderPluginAPI,

  // Config Types
  DevConfig,
  HtmlConfig,
  OutputConfig,
  SourceConfig,
  BuilderConfig,
  SecurityConfig,
  PerformanceConfig,
  ExperimentsConfig,

  // Third Party Types
  WebpackChain,
  WebpackConfig,
  CSSLoaderOptions,
  CssExtractOptions,
  LessLoaderOptions,
  SassLoaderOptions,
  HTMLPluginOptions,
  StyleLoaderOptions,
  AutoprefixerOptions,
  TerserPluginOptions,
  PostCSSLoaderOptions,
} from './types';
