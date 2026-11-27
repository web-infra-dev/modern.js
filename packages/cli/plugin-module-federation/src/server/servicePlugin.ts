import type { ServerPlugin } from '@modern-js/server-runtime';
import type { BridgeServices } from '@module-federation/bridge-react/service-node';
import { createBridgeServiceIngressMiddleware } from './service';
import {
  registerServiceConfig,
  unregisterServiceConfig,
} from './serviceConfig';
import type { ServiceRemote } from '../serviceRemotes';
import {
  createServiceRuntimePluginLoader,
  denyServiceRuntimePluginAccess,
} from './serviceRuntimePlugins';
export default (options: {
  name: string;
  services: BridgeServices;
  remotes: ServiceRemote[];
  origin?: string;
  runtimePluginsFile?: string;
  waitForRuntimePlugins?: () => Promise<void>;
}): ServerPlugin => ({
  name: '@modern-js/module-federation/service',
  setup(api) {
    api.onPrepare(() => {
      const ownerId = (api.getServerContext() as any).ssrUpdateOwnerId;
      registerServiceConfig(ownerId || options.name, options.services);
      if (options.runtimePluginsFile)
        api.getServerContext().middlewares.unshift({
          name: 'mf-service-private-runtime',
          order: 'pre',
          handler: denyServiceRuntimePluginAccess,
        });
      const context = api.getServerContext();
      const loadPlugins = createServiceRuntimePluginLoader(
        context.distDirectory!,
        options.runtimePluginsFile,
        options.waitForRuntimePlugins,
      );
      let plugins: ReturnType<NonNullable<typeof loadPlugins>> | undefined;
      const preparePlugins =
        loadPlugins &&
        (() => {
          if (!(api.getServerContext() as any).ssrUpdateManager)
            return loadPlugins();
          return (plugins ||= loadPlugins());
        });
      const ingress = createBridgeServiceIngressMiddleware(options.services, {
        origin: options.origin,
        name: options.name,
        ownerId,
        remotes: options.remotes,
        plugins: preparePlugins,
      });
      const participants = (context as any).ssrUpdateParticipants || [];
      api.updateServerContext({ ssrUpdateParticipants: participants });
      participants.push({
        dispose: async () => {
          await ingress.dispose();
          if (ownerId) unregisterServiceConfig(ownerId);
        },
        async invalidate() {
          await ingress.dispose();
          plugins = undefined;
        },
        prepare: async () => {
          await preparePlugins?.();
        },
      });
      context.middlewares.push({
        name: 'mf-service-ingress',
        handler: ingress,
      });
    });
  },
});
