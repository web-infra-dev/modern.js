export const plugins = {
  cleanOutput: () => import('./cleanOutput').then(m => m.PluginCleanOutput()),
  startUrl: () => import('./startUrl').then(m => m.PluginStartUrl()),
  fileSize: () => import('./fileSize').then(m => m.PluginFileSize()),
  devtool: () => import('./devtool').then(m => m.PluginDevtool()),
  target: () => import('./target').then(m => m.PluginTarget()),
  entry: () => import('./entry').then(m => m.PluginEntry()),
};
