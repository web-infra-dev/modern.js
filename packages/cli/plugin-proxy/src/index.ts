import {
  createPlugin,
  useAppContext,
  useResolvedConfigContext,
} from '@modern-js/core';
import { PLUGIN_SCHEMAS } from '@modern-js/utils';
import { createProxyRule } from './utils/createProxyRule';
import WhistleProxy from './utils/whistleProxy';

export default createPlugin(
  () => ({
    validateSchema() {
      return PLUGIN_SCHEMAS['@modern-js/plugin-proxy'];
    },
    async afterDev() {
      /* eslint-disable react-hooks/rules-of-hooks */
      const { dev } = useResolvedConfigContext();
      const { internalDirectory } = useAppContext();
      /* eslint-enable react-hooks/rules-of-hooks */

      if (!(dev as any).proxy) {
        return;
      }

      const rule = createProxyRule(internalDirectory, (dev as any).proxy);
      const proxyServer = new WhistleProxy({ port: 8899, rule });
      await proxyServer.start();

      // TODO
      // should exit proxy server before process exit
      // api.on('process-exit', () => {
      //   proxyServer.close();
      // });
    },
  }),
  { name: '@modern-js/plugin-proxy' },
) as any;

export type ProxyOptions = string | Record<string, string>;

declare module '@modern-js/core' {
  export interface DevConfig {
    dev: {
      proxy?: ProxyOptions;
    };
  }
}
