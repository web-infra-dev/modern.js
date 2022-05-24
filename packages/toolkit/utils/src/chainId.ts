export const CHAIN_ID = {
  /** Predefined rules */
  RULE: {
    /** Rule for .mjs */
    MJS: 'mjs',
    /** Rule for predefined loaders */
    LOADERS: 'loaders',
  },
  /** Predefined rule groups */
  ONE_OF: {
    JS: 'js',
    TS: 'ts',
    CSS: 'css',
    LESS: 'less',
    SASS: 'sass',
    YAML: 'yml',
    TOML: 'toml',
    FALLBACK: 'fallback',
    MARKDOWN: 'markdown',
    BFF_CLIENT: 'bff-client',
    CSS_MODULES: 'css-modules',
    LESS_MODULES: 'less-modules',
    SASS_MODULES: 'sass-modules',
    SVG: 'svg',
    SVG_URL: 'svg-url',
    SVG_INLINE: 'svg-inline',
    ASSETS: 'assets',
    ASSETS_URL: 'assets-url',
    ASSETS_INLINE: 'assets-inline',
  },
  /** Predefined loaders */
  USE: {
    /** ts-loader */
    TS: 'ts',
    /** css-loader */
    CSS: 'css',
    /** url-loader */
    URL: 'url',
    /** file-loader */
    FILE: 'file',
    /** @svgr/webpack */
    SVGR: 'svgr',
    /** yaml-loader */
    YAML: 'yaml',
    /** toml-loader */
    TOML: 'toml',
    /** html-loader */
    HTML: 'html',
    /** babel-loader */
    BABEL: 'babel',
    /** style-loader */
    STYLE: 'style-loader',
    /** postcss-loader */
    POSTCSS: 'postcss',
    /** markdown-loader */
    MARKDOWN: 'markdown',
    /** css-modules-typescript-loader */
    CSS_MODULES_TS: 'css-modules-typescript',
    /** mini-css-extract-plugin.loader */
    MINI_CSS_EXTRACT: 'mini-css-extract',
  },
  /** Predefined plugins */
  PLUGIN: {
    /** HotModuleReplacementPlugin */
    HMR: 'hmr',
    /** CopyWebpackPlugin */
    COPY: 'copy',
    /** HtmlWebpackPlugin */
    HTML: 'html',
    /** DefinePlugin */
    DEFINE: 'define',
    /** IgnorePlugin */
    IGNORE: 'ignore',
    /** BannerPlugin */
    BANNER: 'banner',
    /** Webpackbar */
    PROGRESS: 'progress',
    /** AppIconPlugin */
    APP_ICON: 'app-icon',
    /** LoadableWebpackPlugin */
    LOADABLE: 'loadable',
    /** WebpackManifestPlugin */
    MANIFEST: 'webpack-manifest',
    /** ForkTsCheckerWebpackPlugin */
    TS_CHECKER: 'ts-checker',
    /** InlineChunkHtmlPlugin */
    INLINE_HTML: 'inline-html',
    /** WebpackBundleAnalyzer */
    BUNDLE_ANALYZER: 'bundle-analyze',
    /** BottomTemplatePlugin */
    BOTTOM_TEMPLATE: 'bottom-template',
    /** MiniCssExtractPlugin */
    MINI_CSS_EXTRACT: 'mini-css-extract',
    /** ReactFastRefreshPlugin */
    REACT_FAST_REFRESH: 'react-fast-refresh',
    /** ProvidePlugin for node polyfill */
    NODE_POLYFILL_PROVIDE: 'node-polyfill-provide',
  },
  /** Predefined minimizers */
  MINIMIZER: {
    /** TerserWebpackPlugin */
    JS: 'js',
    /** CssMinimizerWebpackPlugin */
    CSS: 'css',
    /** ESBuildPlugin */
    ESBUILD: 'js-css',
  },
  /** Predefined resolve plugins */
  RESOLVE_PLUGIN: {
    /** ModuleScopePlugin */
    MODULE_SCOPE: 'module-scope',
    /** TsConfigPathsPlugin */
    TS_CONFIG_PATHS: 'ts-config-paths',
  },
} as const;

export type ChainIdentifier = typeof CHAIN_ID;
