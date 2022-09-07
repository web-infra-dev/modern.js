export { createBuilder } from './core/createBuilder';
export { mergeBuilderConfig } from './shared/utils';

export type {
  // Plugin Types
  BuilderPlugin,
  BuilderContext,
  BuilderOptions,
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
