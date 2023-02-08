export const plugins = {
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
  splitChunks: () =>
    import('./splitChunks').then(m => m.builderPluginSplitChunks()),
  bundleAnalyzer: () =>
    import('./bundleAnalyzer').then(m => m.builderPluginBundleAnalyzer()),
};
