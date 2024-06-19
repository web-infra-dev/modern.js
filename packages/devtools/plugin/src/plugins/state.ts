import {
  findManifest,
  parseManifest,
  ServerState,
  type AppContext,
  type DoctorManifestOverview,
} from '@modern-js/devtools-kit/node';
import _ from '@modern-js/utils/lodash';
import type { JsonValue } from 'type-fest';
import { proxy } from 'valtio';
import { Plugin } from '../types';
import { requireModule } from '../utils/module';

declare global {
  interface DevtoolsPluginVars {
    state: ServerState;
  }
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

export const pluginState: Plugin = {
  async setup(api) {
    api.vars.state = proxy<ServerState>({
      framework: { config: {} },
      builder: { config: {} },
      bundler: { configs: {} },
      context: api.context,
      dependencies: {},
      fileSystemRoutes: {},
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
  },
};
