import {
  MEDIA_EXTENSIONS,
  FONT_EXTENSIONS,
  IMAGE_EXTENSIONS,
  Plugins,
} from '@modern-js/builder-shared';

export const plugins: Plugins = {
  html: () => import('./html').then(m => m.builderPluginHtml()),
  cleanOutput: () =>
    import('./cleanOutput').then(m => m.builderPluginCleanOutput()),
  startUrl: () => import('./startUrl').then(m => m.builderPluginStartUrl()),
  fileSize: () => import('./fileSize').then(m => m.builderPluginFileSize()),
  devtool: () => import('./devtool').then(m => m.builderPluginDevtool()),
  target: () => import('./target').then(m => m.builderPluginTarget()),
  entry: () => import('./entry').then(m => m.builderPluginEntry()),
  cache: () => import('./cache').then(m => m.builderPluginCache()),
  yaml: () => import('./yaml').then(m => m.builderPluginYaml()),
  toml: () => import('./toml').then(m => m.builderPluginToml()),
  svg: () => import('./svg').then(m => m.builderPluginSvg()),
  splitChunks: () =>
    import('./splitChunks').then(m => m.builderPluginSplitChunks()),
  inlineChunk: () =>
    import('./inlineChunk').then(m => m.builderPluginInlineChunk()),
  bundleAnalyzer: () =>
    import('./bundleAnalyzer').then(m => m.builderPluginBundleAnalyzer()),
  font: () =>
    import('./asset').then(m => m.builderAssetPlugin('font', FONT_EXTENSIONS)),
  image: () =>
    import('./asset').then(m =>
      m.builderAssetPlugin('image', IMAGE_EXTENSIONS),
    ),
  media: () =>
    import('./asset').then(m =>
      m.builderAssetPlugin('media', MEDIA_EXTENSIONS),
    ),
  assetsRetry: () =>
    import('./assetsRetry').then(m => m.builderPluginAssetsRetry()),
  antd: () => import('./antd').then(m => m.builderPluginAntd()),
  arco: () => import('./arco').then(m => m.builderPluginArco()),
  tsChecker: () => import('./tsChecker').then(m => m.builderPluginTsChecker()),
  checkSyntax: () =>
    import('./checkSyntax').then(m => m.builderPluginCheckSyntax()),
  rem: () => import('./rem').then(m => m.builderPluginRem()),
  wasm: () => import('./wasm').then(m => m.builderPluginWasm()),
  moment: () => import('./moment').then(m => m.builderPluginMoment()),
  externals: () => import('./externals').then(m => m.builderPluginExternals()),
  sourceBuild: () =>
    import('./sourceBuild').then(m => m.builderPluginSourceBuild()),
};
