import {
  MEDIA_EXTENSIONS,
  FONT_EXTENSIONS,
  IMAGE_EXTENSIONS,
} from '@modern-js/builder-shared';

export const plugins = {
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
};
