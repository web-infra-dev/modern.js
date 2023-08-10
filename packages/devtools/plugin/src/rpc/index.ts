import { URL } from 'url';
import type { ClientFunctions, ServerFunctions } from '@modern-js/devtools-kit';
import { createBirpc, BirpcOptions } from 'birpc';
import createDeferPromise, { DeferredPromise } from 'p-defer';
import { RawData } from 'ws';
import { ToThreads } from '@modern-js/server-core';
import getPort from 'get-port';
import { CliPluginAPI } from '../types';
import { SocketServer } from '../utils/socket';
import { Hooks } from '../cli';

export interface SetupClientConnectionOptions {
  api: CliPluginAPI;
}

export const setupClientConnection = async (
  options: SetupClientConnectionOptions,
) => {
  const { api } = options;

  // generate url.
  const port = await getPort();
  const server = new SocketServer({ port });
  const url = new URL(`ws://localhost:${port}`);

  // register events.
  let handleMessage: null | ((data: RawData, isBinary: boolean) => void) = null;
  server.on('connection', ws => {
    ws.on('message', (data, isBinary) => handleMessage?.(data, isBinary));
  });

  // define deferred promises.
  const deferred = {
    prepare: createDeferPromise<void>(),
  } satisfies Record<string, DeferredPromise<any>>;

  // setup rpc instance (server <-> client).
  const serverFunctions: ServerFunctions = {
    async getServerRoutes() {
      await deferred.prepare.promise;
      const ctx = api.useAppContext();
      return [...ctx.serverRoutes];
    },
    async getFrameworkConfig() {
      await deferred.prepare.promise;
      const config = api.useResolvedConfigContext();
      return config;
    },
    echo(content) {
      return content;
    },
  };
  const clientRpcOptions: BirpcOptions<ClientFunctions> = {
    post: data => server.clients.forEach(ws => ws.send(data)),
    on: cb => (handleMessage = cb),
    serialize: v => JSON.stringify(v),
    deserialize: v => JSON.parse(v.toString()),
  };

  const clientConn = createBirpc<ClientFunctions, ServerFunctions>(
    serverFunctions,
    clientRpcOptions,
  );

  const hooks = {
    prepare() {
      deferred.prepare.resolve();
    },
  } satisfies Partial<ToThreads<Hooks>>;

  return { client: clientConn, hooks, url };
};
