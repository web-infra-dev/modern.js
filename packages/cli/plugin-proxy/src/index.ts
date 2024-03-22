import type { CliPlugin } from '@modern-js/core';
import { logger } from '@modern-js/utils';
import { createProxyRule } from './utils/createProxyRule';
import WhistleProxy from './utils/whistleProxy';

export const proxyPlugin = (): CliPlugin => {
  let proxyServer: WhistleProxy;

  return {
    name: '@modern-js/plugin-proxy',

    setup: api => ({
      async afterDev() {
        const { dev } = api.useResolvedConfigContext() as any;
        const { internalDirectory } = api.useAppContext();

        if (!dev?.proxy) {
          return;
        }

        const rule = createProxyRule(internalDirectory, dev.proxy);
        if (!proxyServer) {
          proxyServer = new WhistleProxy({ port: 8899, rule });
          logger.warn(
            '[Deprecated] @modern-js/plugin-proxy is no longer maintained. Please consider migrating to other proxy tools, such as whistle.',
          );
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
