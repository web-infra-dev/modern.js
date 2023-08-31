import { URL } from 'url';
import _ from '@modern-js/utils/lodash';
import type {
  BuilderConfig,
  ClientFunctions,
  FileSystemRoutes,
  NormalizedBuilderConfig,
  ServerFunctions,
} from '@modern-js/devtools-kit';
import type { JsonValue } from 'type-fest';
import { createBirpc, BirpcOptions } from 'birpc';
import createDeferPromise from 'p-defer';
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
    builder: {
      context: createDeferPromise<BuilderContext>(),
      config: {
        resolved: createDeferPromise<BuilderConfig>(),
        transformed: createDeferPromise<NormalizedBuilderConfig>(),
      },
    },
    bundler: {
      config: {
        resolved: createDeferPromise<JsonValue[]>(),
        transformed: createDeferPromise<JsonValue[]>(),
      },
    },
  } as const;

  // setup rpc instance (server <-> client).
  const serverFunctions: ServerFunctions = {
    async getFrameworkConfig() {
      await deferred.prepare.promise;
      return api.useConfigContext();
    },
    async getTransformedFrameworkConfig() {
      await deferred.prepare.promise;
      return api.useResolvedConfigContext();
    },
    async getBuilderConfig() {
      return deferred.builder.config.resolved.promise;
    },
    async getTransformedBuilderConfig() {
      return deferred.builder.config.transformed.promise;
    },
    async getBundlerConfigs() {
      return deferred.bundler.config.resolved.promise;
    },
    async getTransformedBundlerConfigs() {
      return deferred.bundler.config.transformed.promise;
    },
    async getAppContext() {
      await deferred.prepare.promise;
      const ctx = { ...api.useAppContext() };
      return _.omit(ctx, ['builder', 'serverInternalPlugins']);
    },
    async getFileSystemRoutes(entryName) {
      return _fileSystemRoutesMap[entryName] ?? [];
    },
    async getBuilderContext() {
      const ctx = await deferred.builder.context.promise;
      return ctx;
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
      deferred.builder.context.resolve(_.cloneDeep(api.context));
      api.modifyBundlerChain(() => {
        deferred.builder.config.resolved.resolve(
          _.cloneDeep(api.getBuilderConfig()),
        );
        deferred.builder.config.transformed.resolve(
          _.cloneDeep(api.getNormalizedConfig()),
        );
      });

      const modifyBundlerConfig =
        'modifyWebpackConfig' in api
          ? api.modifyWebpackConfig
          : api.modifyRspackConfig;
      const expectBundlerNum = _.castArray(api.context.target).length;
      const bundlerConfigs: JsonValue[] = [];
      modifyBundlerConfig(config => {
        bundlerConfigs.push(config as any);
        if (bundlerConfigs.length >= expectBundlerNum) {
          deferred.bundler.config.resolved.resolve(
            _.cloneDeep(bundlerConfigs) as any,
          );
        }
      });

      api.onBeforeCreateCompiler(({ bundlerConfigs }) => {
        deferred.bundler.config.transformed.resolve(
          _.cloneDeep(bundlerConfigs) as any,
        );
      });
    },
  };

  return { client: clientConn, hooks, builderPlugin, url };
};
