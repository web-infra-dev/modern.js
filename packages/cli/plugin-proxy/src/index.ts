import {
  createPlugin,
  useAppContext,
  useResolvedConfigContext,
} from '@modern-js/core';
import { PLUGIN_SCHEMAS } from '@modern-js/utils';
import { createProxyRule } from './utils/createProxyRule';
import WhistleProxy from './utils/whistleProxy';
import './types';

let proxyServer: WhistleProxy;
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
  { name: '@modern-js/plugin-proxy' },
) as any;
