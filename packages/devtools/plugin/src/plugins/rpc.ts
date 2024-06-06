import { Buffer } from 'buffer';
import path from 'path';
import {
  DevtoolsContext,
  ExportedServerState,
  findManifest,
  parseManifest,
  replacer,
  reviver,
  StoragePresetWithIdent,
  type AppContext,
  type ClientFunctions,
  type DoctorManifestOverview,
  type ServerFunctions,
} from '@modern-js/devtools-kit/node';
import { fs, nanoid } from '@modern-js/utils';
import _ from '@modern-js/utils/lodash';
import { BirpcOptions, createBirpc } from 'birpc';
import * as flatted from 'flatted';
import type { JsonValue } from 'type-fest';
import { subscribe } from 'valtio';
import { RawData } from 'ws';
import { CliPluginAPI, DevtoolsConfig, Plugin } from '../types';
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

export const pluginRpc: Plugin = {
  async setup(api) {
    const httpServer = api.vars.http;
    if (!httpServer) return;

    const server = new SocketServer({ server: httpServer, path: '/rpc' });
    let handleMessage: null | ((data: RawData, isBinary: boolean) => void) =
      null;
    const onceConnection = new Promise<void>(resolve => {
      server.on('connection', ws => {
        resolve();
        ws.on('message', (data, isBinary) => handleMessage?.(data, isBinary));
      });
    });

    // initialize the state.
    api.frameworkHooks.hook(
      'modifyFileSystemRoutes',
      ({ entrypoint, routes }) => {
        api.vars.state.fileSystemRoutes[entrypoint.entryName] =
          _.cloneDeep(routes);
      },
    );

    // initialize the state by builder context.
    const builderApi = await api.setupBuilder();
    api.vars.state.builder.context = builderApi.context;
    resolveDependencies(builderApi.context.rootPath).then(deps => {
      api.vars.state.dependencies = deps;
    });

    api.builderHooks.hook('modifyBundlerChain', () => {
      api.vars.state.builder.config = {
        resolved: _.cloneDeep(builderApi.getRsbuildConfig()),
        transformed: _.cloneDeep(builderApi.getNormalizedConfig()),
      };
    });

    const expectBundlerNum = _.castArray(builderApi.context.targets).length;
    const bundlerConfigs: JsonValue[] = [];
    const handleBundlerConfig = (config: any) => {
      bundlerConfigs.push(config);
      if (bundlerConfigs.length >= expectBundlerNum) {
        api.vars.state.bundler.configs.resolved = _.cloneDeep(
          bundlerConfigs,
        ) as any;
      }
    };
    if (builderApi.context.bundlerType === 'webpack') {
      api.builderHooks.hook('modifyWebpackConfig', handleBundlerConfig);
    } else {
      api.builderHooks.hook('modifyRspackConfig', handleBundlerConfig);
    }

    api.builderHooks.hook('onBeforeCreateCompiler', ({ bundlerConfigs }) => {
      api.vars.state.bundler.configs.transformed = _.cloneDeep(bundlerConfigs);
    });

    let buildStartedAt = NaN;
    api.builderHooks.hook('onAfterCreateCompiler', () => {
      buildStartedAt = Date.now();
    });
    api.builderHooks.hook('onDevCompileDone', () => {
      api.vars.state.performance = {
        compileDuration: Date.now() - buildStartedAt,
      };
    });
    api.builderHooks.hook('onAfterBuild', () => {
      api.vars.state.performance = {
        compileDuration: Date.now() - buildStartedAt,
      };
    });

    api.hooks.hook('settleState', async () => {
      try {
        api.vars.state.doctor = await getDoctorOverview(frameworkContext);
      } catch (err) {}
    });

    // initialize the state by framework context.
    const frameworkApi = await api.setupFramework();
    const frameworkContext = {
      ...frameworkApi.useAppContext(),
      builder: null,
      serverInternalPlugins: null,
    };
    api.vars.state.framework = {
      context: frameworkContext,
      config: {
        resolved: frameworkApi.useConfigContext(),
        transformed: frameworkApi.useResolvedConfigContext(),
      },
    };

    const validateSafeToOpen = (filename: string) => {
      const { appDirectory } = frameworkApi.useAppContext();
      const resolved = path.resolve(appDirectory, filename);
      for (const preset of api.context.storagePresets) {
        if (path.resolve(appDirectory, preset.filename) === resolved) {
          return true;
        }
      }
      return false;
    };

    // setup rpc instance (server <-> client).
    const serverFunctions: ServerFunctions = {
      echo(content) {
        return content;
      },
      async pullExportedState() {
        try {
          return api.vars.state as ExportedServerState;
        } catch (e) {
          console.error(e);
          throw e;
        }
      },
      async createTemporaryStoragePreset() {
        const appCtx = frameworkApi.useAppContext();
        const basename = `${api.context.def.name.shortName}.runtime.json`;
        const filename = path.resolve(appCtx.appDirectory, basename);
        const id = nanoid();
        const name = `New Preset ${id.slice(0, 6)}`;
        const config: DevtoolsConfig = {};
        if (await fs.pathExists(filename)) {
          Object.assign(config, await fs.readJSON(filename));
        }
        const newPreset: StoragePresetWithIdent = {
          name,
          id,
          cookie: {},
          localStorage: {},
          sessionStorage: {},
        };
        config.storagePresets ||= [];
        config.storagePresets.push(newPreset);
        await fs.outputJSON(filename, config, { spaces: 2 });
        return newPreset;
      },
      async pasteStoragePreset(target) {
        const { default: clipboardy } = await import('clipboardy');
        const raw = clipboardy.readSync();
        const HEAD = `data:application/json;base64,`;
        if (!raw.startsWith(HEAD)) {
          throw new Error('Failed to parse data URL');
        }
        const encoded = raw.slice(HEAD.length);
        const preset: StoragePresetWithIdent = JSON.parse(
          Buffer.from(encoded, 'base64').toString('utf-8'),
        );
        if (typeof preset !== 'object' || preset === null) {
          throw new Error('Failed to parse data URL');
        }
        if (typeof preset.name !== 'string') {
          throw new Error('Failed to parse data URL');
        }
        const appCtx = frameworkApi.useAppContext();
        const filename = path.resolve(appCtx.appDirectory, target.filename);
        const config: DevtoolsConfig = {};
        if (await fs.pathExists(filename)) {
          Object.assign(config, await fs.readJSON(filename));
        }
        config.storagePresets ||= [];
        const diff = _.pick(preset, [
          'cookie',
          'localStorage',
          'sessionStorage',
        ]);
        const matched = _.find(config.storagePresets, { id: target.id });
        if (matched) {
          _.merge(matched, diff);
        } else {
          config.storagePresets.push(preset);
        }
        await fs.outputJSON(filename, config, { spaces: 2 });
      },
      async open(filename) {
        const name = path.resolve(
          frameworkApi.useAppContext().appDirectory,
          filename,
        );
        const validated = validateSafeToOpen(name);
        if (!validated) {
          throw new Error('Failed to validate the file.');
        }
        const { default: open } = await import('open');
        await open(name);
      },
    };
    const clientRpcOptions: BirpcOptions<ClientFunctions> = {
      post: data =>
        onceConnection.then(() => server.clients.forEach(ws => ws.send(data))),
      on: cb => (handleMessage = cb),
      serialize: v => flatted.stringify([v], replacer),
      deserialize: v => {
        const msg = flatted.parse(v.toString(), reviver)[0];
        return msg;
      },
      onError(error, functionName, args) {
        const stringifiedArgs = args.map(arg => JSON.stringify(arg)).join(', ');
        console.error(
          new Error(
            `DevTools failed to execute RPC function: ${functionName}(${stringifiedArgs})`,
          ),
        );
        console.error(error);
      },
    };

    const clientConn = createBirpc<ClientFunctions, ServerFunctions>(
      serverFunctions,
      clientRpcOptions,
    );

    // sync state operations to remote.
    subscribe(api.vars.state, ops => {
      clientConn.applyStateOperations.asEvent(ops);
    });
  },
};
