import { BuilderPlugin } from '../types';
import { awaitableGetter } from '@modern-js/builder-shared';

export const applyMinimalPlugins = () =>
  awaitableGetter<BuilderPlugin>([
    import('../plugins/basic').then(m => m.PluginBasic()),
    import('../plugins/entry').then(m => m.PluginEntry()),
    // todo: module import error when target is esX
    // import('../plugins/target').then(m => m.PluginTarget()),
    import('../plugins/output').then(m => m.PluginOutput()),
    // todo: need rspack solve performance problem
    // import('../plugins/devtool').then(m => m.PluginDevtool()),
    import('../plugins/resolve').then(m => m.PluginResolve()),
    import('../plugins/html').then(m => m.PluginHtml()),
    import('../plugins/define').then(m => m.PluginDefine()),
    import('../plugins/css').then(m => m.PluginCss()),
    import('../plugins/less').then(m => m.PluginLess()),
  ]);

export const applyDefaultPlugins = () =>
  awaitableGetter<BuilderPlugin>([
    ...applyMinimalPlugins().promises,
    import('../plugins/hmr').then(m => m.PluginHMR()),
    import('../plugins/progress').then(m => m.PluginProgress()),
    import('../plugins/react').then(m => m.PluginReact()),
    import('../plugins/externals').then(m => m.PluginExternals()),
  ]);
