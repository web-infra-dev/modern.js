import { BuilderPlugin } from '../types';
import { awaitableGetter, Plugins } from '@modern-js/builder-shared';

export const applyMinimalPlugins = (plugins: Plugins) =>
  awaitableGetter<BuilderPlugin>([
    import('../plugins/basic').then(m => m.builderPluginBasic()),
    plugins.entry?.(),
    plugins.cache?.(),
    plugins.target?.(),
    import('../plugins/output').then(m => m.builderPluginOutput()),
    plugins.devtool(),
    import('../plugins/resolve').then(m => m.builderPluginResolve()),
  ]);

export const applyBasicPlugins = (plugins: Plugins) =>
  awaitableGetter<BuilderPlugin>([
    ...applyMinimalPlugins(plugins).promises,
    import('../plugins/copy').then(m => m.builderPluginCopy()),
    plugins.html(),
    plugins.image(),
    import('../plugins/define').then(m => m.builderPluginDefine()),
    import('../plugins/tsLoader').then(m => m.builderPluginTsLoader()),
    import('../plugins/babel').then(m => m.builderPluginBabel()),
    import('../plugins/css').then(m => m.builderPluginCss()),
    import('../plugins/sass').then(m => m.builderPluginSass()),
    import('../plugins/less').then(m => m.builderPluginLess()),
    import('../plugins/react').then(m => m.builderPluginReact()),
  ]);

export const applyDefaultPlugins = (plugins: Plugins) =>
  awaitableGetter<BuilderPlugin>([
    ...applyMinimalPlugins(plugins).promises,
    plugins.fileSize?.(),
    plugins.cleanOutput?.(),
    import('../plugins/hmr').then(m => m.builderPluginHMR()),
    plugins.antd(),
    plugins.arco(),
    plugins.svg(),
    import('../plugins/pug').then(m => m.builderPluginPug()),
    plugins.checkSyntax(),
    import('../plugins/copy').then(m => m.builderPluginCopy()),
    plugins.font(),
    plugins.image(),
    plugins.media(),
    plugins.html(),
    plugins.wasm(),
    plugins.moment(),
    import('../plugins/define').then(m => m.builderPluginDefine()),
    import('../plugins/progress').then(m => m.builderPluginProgress()),
    import('../plugins/minimize').then(m => m.builderPluginMinimize()),
    import('../plugins/manifest').then(m => m.builderPluginManifest()),
    import('../plugins/moduleScopes').then(m => m.builderPluginModuleScopes()),
    import('../plugins/tsLoader').then(m => m.builderPluginTsLoader()),
    import('../plugins/babel').then(m => m.builderPluginBabel()),
    plugins.tsChecker(),
    import('../plugins/css').then(m => m.builderPluginCss()),
    import('../plugins/sass').then(m => m.builderPluginSass()),
    import('../plugins/less').then(m => m.builderPluginLess()),
    plugins.rem(),
    import('../plugins/react').then(m => m.builderPluginReact()),
    plugins.bundleAnalyzer(),
    plugins.toml(),
    plugins.yaml(),
    plugins.splitChunks(),
    import('../plugins/inspector').then(m => m.builderPluginInspector()),
    import('../plugins/sri').then(m => m.builderPluginSRI()),
    plugins.startUrl?.(),
    plugins.inlineChunk(),
    plugins.assetsRetry(),
    plugins.externals(),
    plugins.sourceBuild(),
    import('../plugins/performance').then(m => m.builderPluginPerformance()),
    import('../plugins/lazyCompilation').then(m =>
      m.builderPluginLazyCompilation(),
    ),
    import('../plugins/fallback').then(m => m.builderPluginFallback()), // fallback should be the last plugin
  ]);
