export const plugins = {
  cleanOutput: () => import('./cleanOutput').then(m => m.PluginCleanOutput()),
  startUrl: () => import('./startUrl').then(m => m.PluginStartUrl()),
  fileSize: () => import('./fileSize').then(m => m.PluginFileSize()),
};
