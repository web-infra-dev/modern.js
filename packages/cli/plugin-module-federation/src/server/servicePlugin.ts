import type { ServerPlugin } from '@modern-js/server-runtime';
import type { BridgeServices } from '@module-federation/bridge-react/service-node';
import { createBridgeServiceIngressMiddleware } from './service';
export default (options: {
  services: BridgeServices;
  origin?: string;
}): ServerPlugin => ({
  name: '@modern-js/module-federation/service',
  setup(api) {
    api.onPrepare(() => {
      api.getServerContext().middlewares.push({
        name: 'mf-service-ingress',
        handler: createBridgeServiceIngressMiddleware(options.services, {
          origin: options.origin,
        }),
      });
    });
  },
});
