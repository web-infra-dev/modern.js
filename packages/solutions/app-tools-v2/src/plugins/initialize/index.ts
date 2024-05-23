import {
  ensureAbsolutePath,
  getPort,
  isDev,
  isDevCommand,
} from '@modern-js/utils';
import type {
  CliPlugin,
  AppTools,
  AppToolsNormalizedConfig,
  AppUserConfig,
} from '../../types';
import {
  checkIsLegacyConfig,
  createDefaultConfig,
  createLegacyDefaultConfig,
  transformNormalizedConfig,
} from '../../config';

export default ({
  bundler,
}: {
  bundler: 'rspack' | 'webpack';
}): CliPlugin<AppTools<'shared'>> => ({
  name: '@modern-js/plugin-initialize',

  post: [],

  setup(api) {
    const config = () => {
      const appContext = api.useAppContext();
      const userConfig = api.useConfigContext();

      // set bundlerType to appContext
      api.setAppContext({
        ...appContext,
        bundlerType: bundler,
      });

      return (checkIsLegacyConfig(userConfig)
        ? createLegacyDefaultConfig(appContext)
        : createDefaultConfig(
            appContext,
          )) as unknown as AppUserConfig<'shared'>;
    };

    return {
      config,
      async resolvedConfig({ resolved }) {
        let appContext = api.useAppContext();
        const userConfig = api.useConfigContext();
        const port = await getServerPort(resolved);

        appContext = {
          ...appContext,
          port,
          distDirectory: ensureAbsolutePath(
            appContext.distDirectory,
            resolved.output.distPath?.root || 'dist',
          ),
        };

        api.setAppContext(appContext);

        const normalizedConfig = checkIsLegacyConfig(resolved)
          ? transformNormalizedConfig(resolved as any)
          : resolved;

        resolved._raw = userConfig;
        resolved.server = {
          ...(normalizedConfig.server || {}),
          port,
        };
        resolved.autoLoadPlugins = normalizedConfig.autoLoadPlugins ?? false;
        stabilizeConfig(resolved, normalizedConfig, [
          'source',
          'bff',
          'dev',
          'html',
          'output',
          'tools',
          'testing',
          'plugins',
          'builderPlugins',
          'runtime',
          'runtimeByEntries',
          'deploy',
          'performance',
        ]);

        if (bundler === 'webpack') {
          resolved.security = normalizedConfig.security || {};
          resolved.experiments = normalizedConfig.experiments;
        }

        return { resolved };
      },
    };
  },
});

function stabilizeConfig<C extends Record<string, any>>(
  resolve: any,
  config: C,
  keys: Array<keyof C>,
) {
  keys.forEach(key => {
    resolve[key] = config[key] || {};
  });
}

async function getServerPort(config: AppToolsNormalizedConfig) {
  const prodPort = Number(process.env.PORT) || config.server.port || 8080;

  if (isDev() && isDevCommand()) {
    return getPort(Number(process.env.PORT) || config.dev.port || prodPort);
  }

  return prodPort;
}
