import type { Server as NodeServer } from 'node:http';
import type { Http2SecureServer } from 'node:http2';
import type { ServerPlugin } from '../../../types';
export const injectNodeSeverPlugin = ({
  nodeServer,
}: {
  nodeServer: NodeServer | Http2SecureServer;
}): ServerPlugin => ({
  name: '@modern-js/plugin-inject-node-server',

  setup(api) {
    api.updateServerContext({
      nodeServer,
    });
  },
});
