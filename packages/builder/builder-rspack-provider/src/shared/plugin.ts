import { BuilderPlugin } from '../types';
import { awaitableGetter } from '@modern-js/builder-shared';

export const applyMinimalPlugins = () =>
  awaitableGetter<BuilderPlugin>([
    import('../plugins/basic').then(m => m.PluginBasic()),
    import('../plugins/entry').then(m => m.PluginEntry()),
    // todo: module import error when target is esX
    // import('../plugins/target').then(m => m.PluginTarget()),
    import('../plugins/output').then(m => m.PluginOutput()),
    import('../plugins/resolve').then(m => m.PluginResolve()),
    import('../plugins/define').then(m => m.PluginDefine()),
  ]);

export const applyDefaultPlugins = () =>
  awaitableGetter<BuilderPlugin>([
    ...applyMinimalPlugins().promises,
    import('../plugins/progress').then(m => m.PluginProgress()),
  ]);
