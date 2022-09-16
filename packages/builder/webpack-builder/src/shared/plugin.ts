export const builtinPluginExports = {
  hmr: 'PluginHMR',
  svg: 'PluginSvg',
  pug: 'PluginPug',
  copy: 'PluginCopy',
  font: 'PluginFont',
  html: 'PluginHtml',
  basic: 'PluginBasic',
  cache: 'PluginCache',
  entry: 'PluginEntry',
  image: 'PluginImage',
  media: 'PluginMedia',
  target: 'PluginTarget',
  output: 'PluginOutput',
  moment: 'PluginMoment',
  define: 'PluginDefine',
  devtool: 'PluginDevtool',
  resolve: 'PluginResolve',
  fallback: 'PluginFallback',
  progress: 'PluginProgress',
  minimize: 'PluginMinimize',
  manifest: 'PluginManifest',
  fileSize: 'PluginFileSize',
  cleanOutput: 'PluginCleanOutput',
  moduleScopes: 'PluginModuleScopes',
  babel: 'PluginBabel',
  tsLoader: 'PluginTsLoader',
  tsChecker: 'PluginTsChecker',
  css: 'PluginCss',
  sass: 'PluginSass',
  less: 'PluginLess',
  react: 'PluginReact',
  bundleAnalyzer: 'PluginBundleAnalyzer',
  toml: 'PluginToml',
  yaml: 'PluginYaml',
  splitChunks: 'PluginSplitChunks',
  inspector: 'PluginInspector',
  sri: 'PluginSRI',
  startUrl: 'PluginStartUrl',
  inlineChunk: 'PluginInlineChunk',
  assetsRetry: 'PluginAssetsRetry',
} as const;

export type BuiltinPluginTypes = {
  hmr: typeof import('../plugins/hmr').PluginHMR;
  svg: typeof import('../plugins/svg').PluginSvg;
  pug: typeof import('../plugins/pug').PluginPug;
  copy: typeof import('../plugins/copy').PluginCopy;
  font: typeof import('../plugins/font').PluginFont;
  html: typeof import('../plugins/html').PluginHtml;
  basic: typeof import('../plugins/basic').PluginBasic;
  cache: typeof import('../plugins/cache').PluginCache;
  entry: typeof import('../plugins/entry').PluginEntry;
  image: typeof import('../plugins/image').PluginImage;
  media: typeof import('../plugins/media').PluginMedia;
  target: typeof import('../plugins/target').PluginTarget;
  output: typeof import('../plugins/output').PluginOutput;
  moment: typeof import('../plugins/moment').PluginMoment;
  define: typeof import('../plugins/define').PluginDefine;
  devtool: typeof import('../plugins/devtool').PluginDevtool;
  resolve: typeof import('../plugins/resolve').PluginResolve;
  fallback: typeof import('../plugins/fallback').PluginFallback;
  progress: typeof import('../plugins/progress').PluginProgress;
  minimize: typeof import('../plugins/minimize').PluginMinimize;
  manifest: typeof import('../plugins/manifest').PluginManifest;
  fileSize: typeof import('../plugins/fileSize').PluginFileSize;
  cleanOutput: typeof import('../plugins/cleanOutput').PluginCleanOutput;
  moduleScopes: typeof import('../plugins/moduleScopes').PluginModuleScopes;
  babel: typeof import('../plugins/babel').PluginBabel;
  tsLoader: typeof import('../plugins/tsLoader').PluginTsLoader;
  tsChecker: typeof import('../plugins/tsChecker').PluginTsChecker;
  css: typeof import('../plugins/css').PluginCss;
  sass: typeof import('../plugins/sass').PluginSass;
  less: typeof import('../plugins/less').PluginLess;
  react: typeof import('../plugins/react').PluginReact;
  bundleAnalyzer: typeof import('../plugins/bundleAnalyzer').PluginBundleAnalyzer;
  toml: typeof import('../plugins/toml').PluginToml;
  yaml: typeof import('../plugins/yaml').PluginYaml;
  splitChunks: typeof import('../plugins/splitChunks').PluginSplitChunks;
  inspector: typeof import('../plugins/inspector').PluginInspector;
  sri: typeof import('../plugins/sri').PluginSRI;
  startUrl: typeof import('../plugins/startUrl').PluginStartUrl;
  inlineChunk: typeof import('../plugins/inlineChunk').PluginInlineChunk;
  assetsRetry: typeof import('../plugins/assetsRetry').PluginAssetsRetry;
};

export type BuiltinPluginName = keyof BuiltinPluginTypes;

export const loadBuiltinPlugin = async <T extends BuiltinPluginName>(
  plugin: T,
) => {
  const exportName = builtinPluginExports[plugin];
  const module = await import(`../plugins/${plugin}`);
  return module[exportName] as BuiltinPluginTypes[T];
};

export const loadBuiltinPlugins = (plugins: readonly BuiltinPluginName[]) =>
  plugins.map(loadBuiltinPlugin);

export const applyBuiltinPlugins = async (
  plugins: readonly BuiltinPluginName[],
) => {
  const pluginInitializers = await Promise.all(loadBuiltinPlugins(plugins));
  return pluginInitializers.map(fn => fn());
};

export const presetMinimal = [
  'basic',
  'entry',
  'cache',
  'target',
  'output',
  'devtool',
  'resolve',
] as const;

export const applyMinimalPlugins = () => applyBuiltinPlugins(presetMinimal);

export const presetBasic = [
  ...presetMinimal,
  'copy',
  'html',
  'image',
  'define',
  'tsLoader',
  'babel',
  'css',
  'sass',
  'less',
  'react',
] as const;

export const applyBasicPlugins = () => applyBuiltinPlugins(presetBasic);

export const presetDefault = [
  ...presetMinimal,
  // fileSize plugin will read the previous dist files.
  // So we should register fileSize plugin before cleanOutput plugin.
  // And cleanOutput plugin should be registered before other plugins.
  'fileSize',
  'cleanOutput',

  // Plugins that provide basic features
  'hmr',
  'svg',
  'pug',
  'copy',
  'font',
  'html',
  'image',
  'media',
  'moment',
  'define',
  'progress',
  'minimize',
  'manifest',
  'moduleScopes',
  'tsLoader',
  'babel',
  'tsChecker',
  'css',
  'sass',
  'less',
  'react',
  'bundleAnalyzer',
  'toml',
  'yaml',
  'splitChunks',
  'inspector',
  'sri',
  'startUrl',
  'inlineChunk',
  'assetsRetry',

  // fallback should be the last plugin
  'fallback',
] as const;

export const applyDefaultPlugins = () => applyBuiltinPlugins(presetDefault);
