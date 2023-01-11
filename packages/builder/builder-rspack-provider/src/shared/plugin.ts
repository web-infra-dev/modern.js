import { BuilderPlugin } from '../types';
import { awaitableGetter, Plugins } from '@modern-js/builder-shared';

export const applyMinimalPlugins = (plugins: Plugins) =>
  awaitableGetter<BuilderPlugin>([
    import('../plugins/basic').then(m => m.PluginBasic()),
    plugins.entry(),
    plugins.cache(),
    plugins.target(),
    import('../plugins/output').then(m => m.PluginOutput()),
    plugins.devtool(),
    import('../plugins/resolve').then(m => m.PluginResolve()),
    plugins.fileSize(),
    // should before the html plugin
    plugins.cleanOutput(),
    // import('../plugins/font').then(m => m.PluginFont()),
    import('../plugins/image').then(m => m.PluginImage()),
    // import('../plugins/media').then(m => m.PluginMedia()),
    import('../plugins/html').then(m => m.PluginHtml()),
    import('../plugins/define').then(m => m.PluginDefine()),
    import('../plugins/css').then(m => m.PluginCss()),
    import('../plugins/less').then(m => m.PluginLess()),
    import('../plugins/sass').then(m => m.PluginSass()),
  ]);

export const applyDefaultPlugins = (plugins: Plugins) =>
  awaitableGetter<BuilderPlugin>([
    ...applyMinimalPlugins(plugins).promises,
    import('../plugins/hmr').then(m => m.PluginHMR()),
    import('../plugins/progress').then(m => m.PluginProgress()),
    import('../plugins/react').then(m => m.PluginReact()),
    import('../plugins/externals').then(m => m.PluginExternals()),
    plugins.toml(),
    plugins.yaml(),
    plugins.startUrl(),
  ]);
