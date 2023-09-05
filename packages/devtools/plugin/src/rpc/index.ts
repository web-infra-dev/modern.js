import { URL } from 'url';
import path from 'path';
import _ from '@modern-js/utils/lodash';
import type {
  BuilderConfig,
  BundlerConfig,
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
import { requireModule } from '../utils/module';

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
        resolved: createDeferPromise<BundlerConfig[]>(),
        transformed: createDeferPromise<BundlerConfig[]>(),
      },
    },
    compileTimeCost: createDeferPromise<number>(),
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
    async getDependencies() {
      const ctx = await deferred.builder.context.promise;
      const accepted = ['react', '@modern-js/app-tools'];
      const ret: Record<string, string> = {};
      for (const dep of accepted) {
        const filename = path.resolve(
          ctx.rootPath,
          'node_modules',
          dep,
          'package.json',
        );
        ret[dep] = require(filename).version;
      }
      const webpackMeta = requireModule([
        ctx.rootPath,
        '@modern-js/app-tools',
        '@modern-js/builder-webpack-provider',
        'webpack/package.json',
      ]);
      ret.webpack = webpackMeta.version;
      try {
        const rspackMeta = requireModule([
          ctx.rootPath,
          '@modern-js/builder-rspack-provider',
          '@rspack/core/package.json',
        ]);
        ret['@rspack/core'] = rspackMeta.version;
      } catch {}
      return ret;
    },
    async getCompileTimeCost() {
      return deferred.compileTimeCost.promise;
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
      _fileSystemRoutesMap[entrypoint.entryName] = _.cloneDeep(routes);

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

      let buildStartedAt = NaN;
      api.onAfterCreateCompiler(() => {
        buildStartedAt = Date.now();
      });
      api.onDevCompileDone(() => {
        deferred.compileTimeCost.resolve(Date.now() - buildStartedAt);
      });
      api.onAfterBuild(() => {
        deferred.compileTimeCost.resolve(Date.now() - buildStartedAt);
      });
    },
  };

  return { client: clientConn, hooks, builderPlugin, url };
};
