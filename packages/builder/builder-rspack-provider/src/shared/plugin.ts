import { BuilderPlugin } from '../types';
import { awaitableGetter, Plugins } from '@modern-js/builder-shared';

export const applyMinimalPlugins = (plugins: Plugins) =>
  awaitableGetter<BuilderPlugin>([
    import('../plugins/basic').then(m => m.builderPluginBasic()),
    plugins.entry(),
    plugins.cache(),
    plugins.target(),
    import('../plugins/output').then(m => m.builderPluginOutput()),
    plugins.devtool(),
    import('../plugins/resolve').then(m => m.builderPluginResolve()),
    plugins.fileSize(),
    // should before the html plugin
    plugins.cleanOutput(),
    import('../plugins/font').then(m => m.builderPluginFont()),
    import('../plugins/image').then(m => m.builderPluginImage()),
    import('../plugins/media').then(m => m.builderPluginMedia()),
    import('../plugins/svg').then(m => m.builderPluginSvg()),
    import('../plugins/html').then(m => m.builderPluginHtml()),
    import('../plugins/define').then(m => m.builderPluginDefine()),
    import('../plugins/css').then(m => m.builderPluginCss()),
    import('../plugins/less').then(m => m.builderPluginLess()),
    import('../plugins/sass').then(m => m.builderPluginSass()),
  ]);

export const applyDefaultPlugins = (plugins: Plugins) =>
  awaitableGetter<BuilderPlugin>([
    ...applyMinimalPlugins(plugins).promises,
    import('../plugins/minimize').then(m => m.builderPluginMinimize()),
    import('../plugins/rem').then(m => m.builderPluginRem()),
    import('../plugins/hmr').then(m => m.builderPluginHMR()),
    import('../plugins/progress').then(m => m.builderPluginProgress()),
    import('../plugins/react').then(m => m.builderPluginReact()),
    import('../plugins/externals').then(m => m.builderPluginExternals()),
    plugins.toml(),
    plugins.yaml(),
    plugins.splitChunks(),
    plugins.startUrl(),
    plugins.bundleAnalyzer(),
  ]);
