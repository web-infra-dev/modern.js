import {
  findManifest,
  parseManifest,
  ServerExportedState,
  type AppContext,
  type DoctorManifestOverview,
  type ClientFunctions,
  type ServerFunctions,
} from '@modern-js/devtools-kit/node';
import type { RsbuildPlugin } from '@modern-js/uni-builder';
import _ from '@modern-js/utils/lodash';
import { BirpcOptions, createBirpc } from 'birpc';
import * as flatted from 'flatted';
import type { JsonValue } from 'type-fest';
import { proxy } from 'valtio';
import { RawData } from 'ws';
import { DevtoolsContext } from '../options';
import { CliPluginAPI, InjectedHooks } from '../types';
import { requireModule } from '../utils/module';
import { SocketServer } from '../utils/socket';

export interface SetupClientConnectionOptions {
  api: CliPluginAPI;
  server: SocketServer;
  ctx: DevtoolsContext;
}

const resolveDependencies = async (rootPath: string) => {
  const ret: Record<string, string> = {};

  const resolveExprs = {
    react: [rootPath, 'react/package.json'],
    '@modern-js/app-tools': [rootPath, '@modern-js/app-tools/package.json'],
    '@edenx/app-tools': [rootPath, '@edenx/app-tools/package.json'],
    webpack: [
      rootPath,
      '@modern-js/app-tools',
      '@modern-js/uni-builder',
      '@rsbuild/webpack',
      'webpack/package.json',
    ],
    '@rspack/core': [
      rootPath,
      '@modern-js/uni-builder',
      '@rsbuild/core',
      '@rspack/core/package.json',
    ],
    '@rsdoctor/rspack-plugin': [
      rootPath,
      '@rsdoctor/rspack-plugin/package.json',
    ],
    '@rsdoctor/webpack-plugin': [
      rootPath,
      '@rsdoctor/webpack-plugin/package.json',
    ],
    '@web-doctor/webpack-plugin': [
      rootPath,
      '@web-doctor/webpack-plugin/package.json',
    ],
    '@web-doctor/rspack-plugin': [
      rootPath,
      '@web-doctor/rspack-plugin/package.json',
    ],
    '@web-doctor/webpack-plugin(builder)': [
      rootPath,
      '@edenx/builder-plugin-web-doctor',
      '@web-doctor/webpack-plugin/package.json',
    ],
    '@web-doctor/rspack-plugin(builder)': [
      rootPath,
      '@edenx/builder-plugin-web-doctor',
      '@web-doctor/rspack-plugin/package.json',
    ],
    '@rsdoctor/core': [rootPath, '@rsdoctor/core/package.json'],
  };

  for (const [name, expr] of Object.entries(resolveExprs)) {
    try {
      ret[name] = requireModule(expr).version;
    } catch {}
  }
  return ret;
};

const getDoctorOverview = async (
  ctx: AppContext,
): Promise<DoctorManifestOverview> => {
  const manifestPath = await findManifest(ctx.distDirectory);
  const json = await parseManifest(require(manifestPath));
  return {
    numModules: json.data.moduleGraph.modules.length,
    numChunks: json.data.chunkGraph.chunks.length,
    numPackages: json.data.packageGraph.packages.length,
    summary: json.data.summary,
    errors: json.data.errors,
  };
};

export const setupClientConnection = async (
  options: SetupClientConnectionOptions,
) => {
  const { api, server, ctx } = options;

  // register events.
  let handleMessage: null | ((data: RawData, isBinary: boolean) => void) = null;
  const onceConnection = new Promise<void>(resolve => {
    server.on('connection', ws => {
      resolve();
      ws.on('message', (data, isBinary) => handleMessage?.(data, isBinary));
    });
  });

  const state = proxy(new ServerExportedState());
  state.definition = ctx.def;
  state.devtoolsConfig = { storagePresets: ctx.storagePresets };

  // setup rpc instance (server <-> client).
  const serverFunctions: ServerFunctions = {
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
      state.framework.context = { ...api.useAppContext() };
      delete (state.framework.context as any).builder;
      delete (state.framework.context as any).serverInternalPlugins;
      state.framework.config.resolved = api.useConfigContext();
      state.framework.config.transformed = api.useResolvedConfigContext();
      getDoctorOverview(state.framework.context).then(doctor => {
        state.doctor = doctor;
      });
    },
    modifyFileSystemRoutes({ entrypoint, routes }) {
      state.fileSystemRoutes[entrypoint.entryName] = _.cloneDeep(routes);
      return { entrypoint, routes };
    },
  };

  const builderPlugin: RsbuildPlugin = {
    name: 'builder-plugin-devtools',
    setup(api) {
      state.builder.context = api.context;
      resolveDependencies(api.context.rootPath).then(deps => {
        state.dependencies = deps;
      });

      api.modifyBundlerChain(() => {
        state.builder.config.resolved = _.cloneDeep(api.getRsbuildConfig());
        state.builder.config.transformed = _.cloneDeep(
          api.getNormalizedConfig(),
        );
      });

      const expectBundlerNum = _.castArray(api.context.targets).length;
      const bundlerConfigs: JsonValue[] = [];
      const handleBundlerConfig = (config: JsonValue) => {
        bundlerConfigs.push(config);
        if (bundlerConfigs.length >= expectBundlerNum) {
          state.bundler.configs.resolved = _.cloneDeep(bundlerConfigs) as any;
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
        state.bundler.configs.transformed = _.cloneDeep(bundlerConfigs);
      });

      let buildStartedAt = NaN;
      api.onAfterCreateCompiler(() => {
        buildStartedAt = Date.now();
      });
      api.onDevCompileDone(() => {
        state.compileDuration = Date.now() - buildStartedAt;
      });
      api.onAfterBuild(() => {
        state.compileDuration = Date.now() - buildStartedAt;
      });
    },
  };

  return { client: clientConn, hooks, builderPlugin };
};
