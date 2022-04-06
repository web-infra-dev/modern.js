import { PLUGIN_SCHEMAS } from '@modern-js/utils';
import type { CliPlugin } from '@modern-js/core';
import { createProxyRule } from './utils/createProxyRule';
import WhistleProxy from './utils/whistleProxy';

export default (): CliPlugin => {
  let proxyServer: WhistleProxy;

  return {
    name: '@modern-js/plugin-proxy',

    setup: api => ({
      validateSchema() {
        return PLUGIN_SCHEMAS['@modern-js/plugin-proxy'];
      },

      async afterDev() {
        const { dev } = api.useResolvedConfigContext();
        const { internalDirectory } = api.useAppContext();

        if (!dev?.proxy) {
          return;
        }

        const rule = createProxyRule(internalDirectory, dev.proxy);
        proxyServer = new WhistleProxy({ port: 8899, rule });
        await proxyServer.start();
      },

      beforeExit() {
        // terminate whistle proxy
        proxyServer?.close();
      },
    }),
  };
};
