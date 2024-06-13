import { ServerPlugin, NodeServer } from '../../../types';

export const injectNodeSeverPlugin = ({
  nodeServer,
}: {
  nodeServer: NodeServer;
}): ServerPlugin => ({
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
