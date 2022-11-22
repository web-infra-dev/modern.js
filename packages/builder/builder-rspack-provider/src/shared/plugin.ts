import { BuilderPlugin } from '../types';
import { awaitableGetter } from '@modern-js/builder-shared';

export const applyMinimalPlugins = () =>
  awaitableGetter<BuilderPlugin>([
    import('../plugins/entry').then(m => m.PluginEntry()),
    import('../plugins/target').then(m => m.PluginTarget()),
    import('../plugins/define').then(m => m.PluginDefine()),
  ]);

export const applyDefaultPlugins = () =>
  awaitableGetter<BuilderPlugin>([
    ...applyMinimalPlugins().promises,
    import('../plugins/progress').then(m => m.PluginProgress()),
  ]);
