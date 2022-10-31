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
    import('../plugins/css').then(m => m.PluginCss()),
    import('../plugins/define').then(m => m.PluginDefine()),
    import('../plugins/entry').then(m => m.PluginEntry()),
    import('../plugins/output').then(m => m.PluginOutput()),
    import('../plugins/less').then(m => m.PluginLess()),
    import('../plugins/sass').then(m => m.PluginSass()),

    // these plugins must depend on minimal plugins
    import('../plugins/html').then(m => m.PluginHtml()),
    import('../plugins/rem').then(m => m.PluginRem()),
  ]);

export const applyDefaultPlugins = () =>
  awaitablePlugins([...applyMinimalPlugins().promises]);
