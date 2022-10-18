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
    import('../plugins/entry').then(m => m.PluginEntry()),
    import('../plugins/output').then(m => m.PluginOutput()),
  ]);

export const applyDefaultPlugins = () => awaitablePlugins([
  ...applyMinimalPlugins().promises,
]);
