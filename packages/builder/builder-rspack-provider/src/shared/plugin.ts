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

export const applyDefaultPlugins = () => awaitablePlugins([]);
