import _ from '@modern-js/utils/lodash';
import {
  ClientDefinition,
  type BuilderConfig,
  type BundlerConfig,
  type ClientFunctions,
  type FileSystemRoutes,
  type NormalizedBuilderConfig,
  type ServerFunctions,
} from '@modern-js/devtools-kit/node';
import type { JsonValue, PartialDeep } from 'type-fest';
import { createBirpc, BirpcOptions } from 'birpc';
import * as flatted from 'flatted';
import createDeferPromise from 'p-defer';
import { RawData } from 'ws';
import type { RsbuildContext, RsbuildPlugin } from '@modern-js/uni-builder';
import { CliPluginAPI, InjectedHooks } from '../types';
import { SocketServer } from '../utils/socket';
import { requireModule } from '../utils/module';

export interface SetupClientConnectionOptions {
  api: CliPluginAPI;
  server: SocketServer;
}

export const setupClientConnection = async (
  options: SetupClientConnectionOptions,
) => {
  const { api, server } = options;
  let def: PartialDeep<ClientDefinition> = {};
  const setDefinition = (definition: PartialDeep<ClientDefinition>) => {
    def = definition;
  };

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
      context: createDeferPromise<RsbuildContext>(),
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
      const ret: Record<string, string> = {};

      const resolveExprs = {
        react: [ctx.rootPath, 'react/package.json'],
        '@modern-js/app-tools': [
          ctx.rootPath,
          '@modern-js/app-tools/package.json',
        ],
        '@edenx/app-tools': [ctx.rootPath, '@edenx/app-tools/package.json'],
        webpack: [
          ctx.rootPath,
          '@modern-js/app-tools',
          '@modern-js/uni-builder',
          '@rsbuild/webpack',
          'webpack/package.json',
        ],
        '@rspack/core': [
          ctx.rootPath,
          '@modern-js/uni-builder',
          '@rsbuild/core',
          '@rspack/core/package.json',
        ],
      };

      for (const [name, expr] of Object.entries(resolveExprs)) {
        try {
          ret[name] = requireModule(expr).version;
        } catch {}
      }
      return ret;
    },
    async getCompileTimeCost() {
      return deferred.compileTimeCost.promise;
    },
    async getClientDefinition() {
      const ret = new ClientDefinition();
      Object.assign(ret.name, def.name);
      Object.assign(ret.packages, def.packages);
      Object.assign(ret.assets, def.assets);
      Object.assign(ret.announcement, def.announcement);
      return ret;
    },
    echo(content) {
      return content;
    },
  };
  const clientRpcOptions: BirpcOptions<ClientFunctions> = {
    post: data =>
      onceConnection.then(() => server.clients.forEach(ws => ws.send(data))),
    on: cb => (handleMessage = cb),
    serialize: v => flatted.stringify([v]),
    deserialize: v => flatted.parse(v.toString())[0],
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

  const builderPlugin: RsbuildPlugin = {
    name: 'builder-plugin-devtools',
    setup(api) {
      deferred.builder.context.resolve(_.cloneDeep(api.context));
      api.modifyBundlerChain(() => {
        deferred.builder.config.resolved.resolve(
          _.cloneDeep(api.getRsbuildConfig()),
        );
        deferred.builder.config.transformed.resolve(
          _.cloneDeep(api.getNormalizedConfig()),
        );
      });

      const expectBundlerNum = _.castArray(api.context.targets).length;
      const bundlerConfigs: JsonValue[] = [];
      const handleBundlerConfig = (config: JsonValue) => {
        bundlerConfigs.push(config);
        if (bundlerConfigs.length >= expectBundlerNum) {
          deferred.bundler.config.resolved.resolve(
            _.cloneDeep(bundlerConfigs) as any,
          );
        }
      };
      if (api.context.bundlerType === 'webpack') {
        api.modifyWebpackConfig(config => {
          handleBundlerConfig(config as JsonValue);
        });
      } else {
        api.modifyRspackConfig(config => {
          handleBundlerConfig(config as JsonValue);
        });
      }

      api.onBeforeCreateCompiler(({ bundlerConfigs }) => {
        deferred.bundler.config.transformed.resolve(
          _.cloneDeep(bundlerConfigs),
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

  return { client: clientConn, hooks, builderPlugin, setDefinition };
};
