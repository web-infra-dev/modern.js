import type { CliPlugin } from '@modern-js/core';
import { createProxyRule } from './utils/createProxyRule';
import WhistleProxy from './utils/whistleProxy';

export const proxyPlugin = (): CliPlugin => {
  let proxyServer: WhistleProxy;

  return {
    name: '@modern-js/plugin-proxy',

    setup: api => ({
      validateSchema() {
        return [
          {
            target: 'dev.proxy',
            schema: { typeof: ['string', 'object'] },
          },
        ];
      },

      async afterDev() {
        const { dev } = api.useResolvedConfigContext() as any;
        const { internalDirectory } = api.useAppContext();

        if (!dev?.proxy) {
          return;
        }

        const rule = createProxyRule(internalDirectory, dev.proxy);
        if (!proxyServer) {
          proxyServer = new WhistleProxy({ port: 8899, rule });
          await proxyServer.start();
        }
      },

      beforeExit() {
        // terminate whistle proxy
        proxyServer?.close();
      },
    }),
  };
};

export default proxyPlugin;
