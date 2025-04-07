import type { Server as NodeServer } from 'node:http';
import type { Http2SecureServer } from 'node:http2';
import type { ServerPluginLegacy } from '../../../types';
export const injectNodeSeverPlugin = ({
  nodeServer,
}: {
  nodeServer: NodeServer | Http2SecureServer;
}): ServerPluginLegacy => ({
  name: '@modern-js/plugin-inject-node-server',

  setup(api) {
    const appContext = api.useAppContext();

    api.setAppContext({
      ...appContext,
      nodeServer,
    });

    return {};
  },
});
