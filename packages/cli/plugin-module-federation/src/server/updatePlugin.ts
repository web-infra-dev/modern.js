import { createSSRUpdateServerPlugin } from './ssrUpdate';
import { startDevRemoteUpdates } from './devRemoteUpdates';
import { logger } from '@modern-js/utils';

/** The production plugin binds APIs only. Automatic checks belong exclusively to dev. */
export default function updatePlugin(
  options: Parameters<typeof createSSRUpdateServerPlugin>[0] & {
    canPrepareSSRResources?: (stats: unknown) => boolean;
  },
) {
  const plugin = createSSRUpdateServerPlugin({
    ...options,
    onReady(manager, context) {
      if (!context.dev) return;
      const watcher = startDevRemoteUpdates({
        remotes: (options.remotes || []).filter(
          remote => 'entry' in remote && typeof remote.entry === 'string',
        ),
        shouldUpdateRemote: (remote, input) =>
          manager.shouldUpdateRemote(remote, input),
        updateRemotes: remotes => manager.updateRemotes(remotes),
        onReload: () => context.dev!.reload(),
        onError: error =>
          logger.error(
            error instanceof Error ? error : new Error(String(error)),
          ),
      });
      return () => watcher.close();
    },
  });
  return {
    ...plugin,
    setup(api: Parameters<NonNullable<typeof plugin.setup>>[0]) {
      api.onPrepare(() => {
        if (api.getServerContext().dev && options.canPrepareSSRResources)
          api.updateServerContext({
            canPrepareSSRResources: options.canPrepareSSRResources,
          });
      });
      plugin.setup!(api);
    },
  };
}
