import type { ClientFunctions, ServerFunctions } from '@modern-js/devtools-kit';
import getPort from 'get-port';
import { createBirpc, BirpcOptions } from 'birpc';
import { RawData } from 'ws';
import { CliPluginAPI } from '../types';
import { SocketServer } from '../utils/socket';

export const setupClientConnection = async (api: CliPluginAPI) => {
  const ctx = api.useAppContext();

  // setup socket server.
  const port = await getPort();
  const wss = new SocketServer({ port });
  const url = `ws://localhost:${port}`;

  // register events.
  let handleMessage: null | ((data: RawData, isBinary: boolean) => void) = null;
  wss.on('connection', ws => {
    ws.on('message', (data, isBinary) => handleMessage?.(data, isBinary));
  });

  // setup rpc instance (server <-> client).
  const serverFunctions: ServerFunctions = {
    getServerRoutes() {
      return [{ entryPath: 'foo', urlPath: 'bar' }, ...ctx.serverRoutes];
    },
    echo(content) {
      return content;
    },
  };
  const clientRpcOptions: BirpcOptions<ClientFunctions> = {
    post: data => wss.clients.forEach(ws => ws.send(data)),
    on: cb => (handleMessage = cb),
    serialize: v => JSON.stringify(v),
    deserialize: v => JSON.parse(v.toString()),
  };

  const clientConn = createBirpc<ClientFunctions, ServerFunctions>(
    serverFunctions,
    clientRpcOptions,
  );

  return { client: clientConn, url };
};
