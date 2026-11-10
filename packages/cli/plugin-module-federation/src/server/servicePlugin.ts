import type { ServerPlugin } from '@modern-js/server-runtime';
import type { BridgeServices } from '@module-federation/bridge-react/service-node';
import { createBridgeServiceIngressMiddleware } from './service';
import { registerServiceConfig } from './serviceConfig';
export default (options: {
  name: string;
  services: BridgeServices;
  origin?: string;
}): ServerPlugin => ({
  name: '@modern-js/module-federation/service',
  setup(api) {
    api.onPrepare(() => {
      registerServiceConfig(options.name, options.services);
      api.getServerContext().middlewares.push({
        name: 'mf-service-ingress',
        handler: createBridgeServiceIngressMiddleware(options.services, {
          origin: options.origin,
        }),
      });
    });
  },
});
