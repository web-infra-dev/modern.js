import { WebSocketServer } from 'ws';
import type { ServerPlugin } from '@modern-js/server-core';

const pluginDevTools = (): ServerPlugin => ({
  name: '@modern-js/plugin-devtools',
  setup(_api) {
    const wss = new WebSocketServer({
      path: '/_modern_js/devtools/rpc',
      noServer: true,
    });
    wss.on('connection', ws => {
      ws.on('message', data => ws.send(data.toString()));
    });
    return {
      afterServerInit({ app, server }) {
        if (!app) return { server };

        app.on('upgrade', (req, sock, head) => {
          if (!wss.shouldHandle(req)) return;
          wss.handleUpgrade(req, sock, head, conn => {
            wss.emit('connection', conn, req);
          });
        });

        return { app, server };
      },
    };
  },
});

export default pluginDevTools;
