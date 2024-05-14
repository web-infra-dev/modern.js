import path from 'path';
import { Buffer } from 'buffer';
import {
  findManifest,
  parseManifest,
  type AppContext,
  type DoctorManifestOverview,
  type ClientFunctions,
  type ServerFunctions,
  extractSettledOperations,
  replacer,
  reviver,
  DevtoolsContext,
  StoragePresetWithIdent,
} from '@modern-js/devtools-kit/node';
import type { RsbuildPlugin } from '@modern-js/uni-builder';
import _ from '@modern-js/utils/lodash';
import { BirpcOptions, createBirpc } from 'birpc';
import * as flatted from 'flatted';
import type { JsonValue } from 'type-fest';
import { subscribe } from 'valtio';
import { RawData } from 'ws';
import { fs, nanoid } from '@modern-js/utils';
import { CliPluginAPI, DevtoolsConfig, InjectedHooks } from '../types';
import { requireModule } from '../utils/module';
import { SocketServer } from '../utils/socket';
import { $resolvers, $state } from '../state';

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

  if ('resolve' in $resolvers.context) {
    $resolvers.context.resolve(ctx);
  }
  $state.context = ctx;
  subscribe($state, ops => {
    clientConn.applyStateOperations.asEvent(ops);
  });

  const validateSafeToOpen = (filename: string) => {
    const { appDirectory } = api.useAppContext();
    const resolved = path.resolve(appDirectory, filename);
    for (const preset of ctx.storagePresets) {
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
      extractSettledOperations($state).then(ops => {
        clientConn.applyStateOperations.asEvent(ops);
      });
      return $state;
    },
    async createTemporaryStoragePreset() {
      const appCtx = api.useAppContext();
      const basename = `${ctx.def.name.shortName}.runtime.json`;
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
      const appCtx = api.useAppContext();
      const filename = path.resolve(appCtx.appDirectory, target.filename);
      const config: DevtoolsConfig = {};
      if (await fs.pathExists(filename)) {
        Object.assign(config, await fs.readJSON(filename));
      }
      config.storagePresets ||= [];
      const diff = _.pick(preset, ['cookie', 'localStorage', 'sessionStorage']);
      const matched = _.find(config.storagePresets, { id: target.id });
      if (matched) {
        _.merge(matched, diff);
      } else {
        config.storagePresets.push(preset);
      }
      await fs.outputJSON(filename, config, { spaces: 2 });
    },
    async open(filename) {
      const name = path.resolve(api.useAppContext().appDirectory, filename);
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
  };

  const clientConn = createBirpc<ClientFunctions, ServerFunctions>(
    serverFunctions,
    clientRpcOptions,
  );

  const hooks: InjectedHooks = {
    prepare() {
      const frameworkContext = {
        ...api.useAppContext(),
        builder: null,
        serverInternalPlugins: null,
      };
      $resolvers.framework.context.resolve(frameworkContext);
      $resolvers.framework.config.resolved.resolve(api.useConfigContext());
      $resolvers.framework.config.transformed.resolve(
        api.useResolvedConfigContext(),
      );
      getDoctorOverview(frameworkContext)
        .then(doctor => $resolvers.doctor.resolve(doctor))
        .catch(() => $resolvers.doctor.resolve(undefined));
    },
    modifyFileSystemRoutes({ entrypoint, routes }) {
      $state.fileSystemRoutes[entrypoint.entryName] = _.cloneDeep(routes);
      return { entrypoint, routes };
    },
  };

  const builderPlugin: RsbuildPlugin = {
    name: 'builder-plugin-devtools',
    setup(api) {
      $resolvers.builder.context.resolve(api.context);
      resolveDependencies(api.context.rootPath).then(deps => {
        $state.dependencies = deps;
      });

      api.modifyBundlerChain(() => {
        $resolvers.builder.config.resolved.resolve(
          _.cloneDeep(api.getRsbuildConfig()),
        );
        $resolvers.builder.config.transformed.resolve(
          _.cloneDeep(api.getNormalizedConfig()),
        );
      });

      const expectBundlerNum = _.castArray(api.context.targets).length;
      const bundlerConfigs: JsonValue[] = [];
      const handleBundlerConfig = (config: JsonValue) => {
        bundlerConfigs.push(config);
        if (bundlerConfigs.length >= expectBundlerNum) {
          $state.bundler.configs.resolved = _.cloneDeep(bundlerConfigs) as any;
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
        $resolvers.bundler.configs.transformed.resolve(
          _.cloneDeep(bundlerConfigs),
        );
      });

      let buildStartedAt = NaN;
      api.onAfterCreateCompiler(() => {
        buildStartedAt = Date.now();
      });
      api.onDevCompileDone(() => {
        $resolvers.performance.resolve({
          compileDuration: Date.now() - buildStartedAt,
        });
      });
      api.onAfterBuild(() => {
        $resolvers.performance.resolve({
          compileDuration: Date.now() - buildStartedAt,
        });
      });
    },
  };

  return { client: clientConn, hooks, builderPlugin };
};
