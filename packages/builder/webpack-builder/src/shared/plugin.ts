import { BuilderPlugin } from '../types';

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

export type BuiltinPluginExport = typeof builtinPluginExports;
export type BuiltinPluginName = keyof BuiltinPluginExport;

export const loadBuiltinPlugin = async (plugin: BuiltinPluginName) => {
  const exportName = builtinPluginExports[plugin];
  const module = await import(`../plugins/${plugin}`);
  return module[exportName] as () => BuilderPlugin;
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
