import type { Server as NodeServer } from 'node:http';
import type { ServerPluginLegacy } from '../../../types';
export const injectNodeSeverPlugin = ({
  nodeServer,
}: {
  nodeServer: NodeServer;
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
