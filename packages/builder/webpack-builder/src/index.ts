export { createBuilder } from './core/createBuilder';
export { mergeBuilderConfig } from './shared/utils';

export type {
  // Plugin Types
  BuilderPlugin,
  BuilderContext,
  BuilderPluginAPI,

  // Config Types
  Config,
  BuilderConfig,
  DevConfig,
  HtmlConfig,
  OutputConfig,
  SourceConfig,
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
