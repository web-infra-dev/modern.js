import { createSSRUpdateServerPlugin } from './ssrUpdate';
import {
  startDevRemoteUpdates,
  type DevRemoteUpdatesOptions,
} from './devRemoteUpdates';
import { logger } from '@modern-js/utils';
import { SSR_READY_EVENT } from '../ssr-runtime/devUpdateEvent';

/** Development subscriptions and request fallback share the production update owner. */
export default function updatePlugin(
  options: Parameters<typeof createSSRUpdateServerPlugin>[0] & {
    canPrepareSSRResources?: (stats: unknown) => boolean;
    devBuild?: DevRemoteUpdatesOptions['build'];
  },
): ReturnType<typeof createSSRUpdateServerPlugin> {
  let watcher: ReturnType<typeof startDevRemoteUpdates> | undefined;
  const plugin = createSSRUpdateServerPlugin({
    ...options,
    onAvailabilityChange: ready => options.devBuild?.setReady?.(ready),
    beforeRequest: async () => {
      await watcher?.check();
    },
    onReady(manager, context) {
      if (!context.dev) return;
      watcher = startDevRemoteUpdates({
        consumer: options.name,
        build: options.devBuild,
        remotes: (options.remotes || []).filter(
          remote => 'entry' in remote && typeof remote.entry === 'string',
        ),
        shouldUpdateRemote: (remote, input) =>
          manager.shouldUpdateRemote(remote, input),
        updateRemotes: (remotes, input) =>
          manager.updateRemotes(remotes, input),
        onApplied: (_remotes, { reload }) => {
          if (reload || !context.dev!.send) context.dev!.reload();
          else context.dev!.send(SSR_READY_EVENT, { name: options.name });
        },
        onError: error =>
          logger.error(
            `[MF] update failed: ${error instanceof Error ? error.message : String(error)}`,
          ),
      });
      return () => watcher!.close();
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
