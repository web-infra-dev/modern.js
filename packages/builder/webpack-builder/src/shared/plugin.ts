import { BuilderPlugin } from '../types';

interface AwaitablePluginGroup extends PromiseLike<BuilderPlugin[]> {
  promises: Promise<BuilderPlugin>[];
}

/**
 * Make plugin loaders Awaitable.
 * @see {@link tests/shared/plugin.test.ts}
 */
export const awaitablePlugins = (
  promises: Promise<BuilderPlugin>[],
): AwaitablePluginGroup => {
  const then: PromiseLike<BuilderPlugin[]>['then'] = (...args) =>
    Promise.all(promises).then(...args);
  return { then, promises };
};

export const applyMinimalPlugins = () =>
  awaitablePlugins([
    import('../plugins/basic').then(m => m.PluginBasic()),
    import('../plugins/entry').then(m => m.PluginEntry()),
    import('../plugins/cache').then(m => m.PluginCache()),
    import('../plugins/target').then(m => m.PluginTarget()),
    import('../plugins/output').then(m => m.PluginOutput()),
    import('../plugins/devtool').then(m => m.PluginDevtool()),
    import('../plugins/resolve').then(m => m.PluginResolve()),
  ]);

export const applyBasicPlugins = () =>
  awaitablePlugins([
    ...applyMinimalPlugins().promises,
    import('../plugins/copy').then(m => m.PluginCopy()),
    import('../plugins/html').then(m => m.PluginHtml()),
    import('../plugins/image').then(m => m.PluginImage()),
    import('../plugins/define').then(m => m.PluginDefine()),
    import('../plugins/tsLoader').then(m => m.PluginTsLoader()),
    import('../plugins/babel').then(m => m.PluginBabel()),
    import('../plugins/css').then(m => m.PluginCss()),
    import('../plugins/sass').then(m => m.PluginSass()),
    import('../plugins/less').then(m => m.PluginLess()),
    import('../plugins/react').then(m => m.PluginReact()),
  ]);

export const applyDefaultPlugins = () =>
  awaitablePlugins([
    ...applyMinimalPlugins().promises,
    import('../plugins/fileSize').then(m => m.PluginFileSize()),
    import('../plugins/cleanOutput').then(m => m.PluginCleanOutput()),
    import('../plugins/hmr').then(m => m.PluginHMR()),
    import('../plugins/svg').then(m => m.PluginSvg()),
    import('../plugins/pug').then(m => m.PluginPug()),
    import('../plugins/copy').then(m => m.PluginCopy()),
    import('../plugins/font').then(m => m.PluginFont()),
    import('../plugins/html').then(m => m.PluginHtml()),
    import('../plugins/image').then(m => m.PluginImage()),
    import('../plugins/media').then(m => m.PluginMedia()),
    import('../plugins/moment').then(m => m.PluginMoment()),
    import('../plugins/define').then(m => m.PluginDefine()),
    import('../plugins/progress').then(m => m.PluginProgress()),
    import('../plugins/minimize').then(m => m.PluginMinimize()),
    import('../plugins/manifest').then(m => m.PluginManifest()),
    import('../plugins/moduleScopes').then(m => m.PluginModuleScopes()),
    import('../plugins/tsLoader').then(m => m.PluginTsLoader()),
    import('../plugins/babel').then(m => m.PluginBabel()),
    import('../plugins/tsChecker').then(m => m.PluginTsChecker()),
    import('../plugins/css').then(m => m.PluginCss()),
    import('../plugins/sass').then(m => m.PluginSass()),
    import('../plugins/less').then(m => m.PluginLess()),
    import('../plugins/rem').then(m => m.PluginRem()),
    import('../plugins/react').then(m => m.PluginReact()),
    import('../plugins/bundleAnalyzer').then(m => m.PluginBundleAnalyzer()),
    import('../plugins/toml').then(m => m.PluginToml()),
    import('../plugins/yaml').then(m => m.PluginYaml()),
    import('../plugins/splitChunks').then(m => m.PluginSplitChunks()),
    import('../plugins/inspector').then(m => m.PluginInspector()),
    import('../plugins/sri').then(m => m.PluginSRI()),
    import('../plugins/startUrl').then(m => m.PluginStartUrl()),
    import('../plugins/inlineChunk').then(m => m.PluginInlineChunk()),
    import('../plugins/assetsRetry').then(m => m.PluginAssetsRetry()),
    import('../plugins/externals').then(m => m.PluginExternals()),
    import('../plugins/fallback').then(m => m.PluginFallback()), // fallback should be the last plugin
  ]);
