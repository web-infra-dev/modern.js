import type { ServerPlugin } from '@modern-js/server-runtime';
import type { BridgeServices } from '@module-federation/bridge-react/service-node';
import { createBridgeServiceIngressMiddleware } from './service';
import { registerServiceConfig } from './serviceConfig';
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
      registerServiceConfig(options.name, options.services);
      if (options.runtimePluginsFile)
        api.getServerContext().middlewares.unshift({
          name: 'mf-service-private-runtime',
          order: 'pre',
          handler: denyServiceRuntimePluginAccess,
        });
      api.getServerContext().middlewares.push({
        name: 'mf-service-ingress',
        handler: createBridgeServiceIngressMiddleware(options.services, {
          origin: options.origin,
          name: options.name,
          remotes: options.remotes,
          plugins: createServiceRuntimePluginLoader(
            api.getServerContext().distDirectory!,
            options.runtimePluginsFile,
            options.waitForRuntimePlugins,
          ),
        }),
      });
    });
  },
});
