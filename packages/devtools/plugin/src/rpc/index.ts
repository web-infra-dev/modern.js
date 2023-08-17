import { URL } from 'url';
import _ from '@modern-js/utils/lodash';
import type { ClientFunctions, ServerFunctions } from '@modern-js/devtools-kit';
import { createBirpc, BirpcOptions } from 'birpc';
import createDeferPromise, { DeferredPromise } from 'p-defer';
import { RawData } from 'ws';
import { ToThreads } from '@modern-js/server-core';
import getPort from 'get-port';
import {
  RouteLegacy,
  NestedRouteForCli,
  PageRoute,
} from '@modern-js/types/cli';
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
  const _fileSystemRoutesMap: Record<
    string,
    RouteLegacy[] | (NestedRouteForCli | PageRoute)[]
  > = {};

  // register events.
  let handleMessage: null | ((data: RawData, isBinary: boolean) => void) = null;
  const onceConnection = new Promise<void>(resolve => {
    server.on('connection', ws => {
      resolve();
      ws.on('message', (data, isBinary) => handleMessage?.(data, isBinary));
    });
  });

  /**
   * Define deferred promises.
   * NOTICE: Each promise can only be resolved for once.
   */
  const deferred = {
    prepare: createDeferPromise<void>(),
  } satisfies Record<string, DeferredPromise<any>>;

  // setup rpc instance (server <-> client).
  const serverFunctions: ServerFunctions = {
    async getAppContext() {
      await deferred.prepare.promise;
      const ctx = { ...api.useAppContext() };
      return _.omit(ctx, ['builder', 'plugins', 'serverInternalPlugins']);
    },
    async getFrameworkConfig() {
      await deferred.prepare.promise;
      const config = api.useResolvedConfigContext();
      return config;
    },
    async getFileSystemRoutes(entryName) {
      return _fileSystemRoutesMap[entryName] ?? [];
    },
    echo(content) {
      return content;
    },
  };
  const clientRpcOptions: BirpcOptions<ClientFunctions> = {
    post: data =>
      onceConnection.then(() => server.clients.forEach(ws => ws.send(data))),
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
    modifyFileSystemRoutes({ entrypoint, routes }) {
      // update remote records.
      clientConn.updateFileSystemRoutes({ entrypoint, routes });
      // update local records.
      _fileSystemRoutesMap[entrypoint.entryName] = routes;

      return { entrypoint, routes };
    },
  } satisfies Partial<ToThreads<Hooks>>;

  return { client: clientConn, hooks, url };
};
