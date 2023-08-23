import { URL } from 'url';
import _ from '@modern-js/utils/lodash';
import type {
  ClientFunctions,
  FileSystemRoutes,
  ServerFunctions,
} from '@modern-js/devtools-kit';
import { createBirpc, BirpcOptions } from '@modern-js/devtools-kit/birpc';
import createDeferPromise, { DeferredPromise } from 'p-defer';
import { RawData } from 'ws';
import { getPort } from '@modern-js/utils';
import type { BuilderContext, BuilderPlugin } from '@modern-js/builder-shared';
import { CliPluginAPI, BuilderPluginAPI, InjectedHooks } from '../types';
import { SocketServer } from '../utils/socket';

export interface SetupClientConnectionOptions {
  api: CliPluginAPI;
}

export const setupClientConnection = async (
  options: SetupClientConnectionOptions,
) => {
  const { api } = options;

  // generate url.
  const port = await getPort(8782);
  const server = new SocketServer({ port });
  const url = new URL(`ws://localhost:${port}`);
  const _fileSystemRoutesMap: Record<string, FileSystemRoutes> = {};

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
    builderContext: createDeferPromise<BuilderContext>(),
    builderConfig: createDeferPromise<Record<string, unknown>>(),
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
    async getBuilderContext() {
      const ctx = await deferred.builderContext.promise;
      return ctx;
    },
    async getBuilderConfig() {
      return deferred.builderConfig.promise;
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

  const hooks: InjectedHooks = {
    prepare() {
      deferred.prepare.resolve();
    },
    modifyFileSystemRoutes({ entrypoint, routes }) {
      // update remote records.
      // clientConn.updateFileSystemRoutes({ entrypoint, routes });
      // update local records.
      _fileSystemRoutesMap[entrypoint.entryName] = routes;

      return { entrypoint, routes };
    },
  };

  const builderPlugin: BuilderPlugin<BuilderPluginAPI> = {
    name: 'builder-plugin-devtools',
    setup(api) {
      deferred.builderContext.resolve(api.context);
      api.modifyBundlerChain(() => {
        deferred.builderConfig.resolve(api.getBuilderConfig());
      });
    },
  };

  return { client: clientConn, hooks, builderPlugin, url };
};
