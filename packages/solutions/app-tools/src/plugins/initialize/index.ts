import {
  ensureAbsolutePath,
  getPort,
  isDev,
  isDevCommand,
} from '@modern-js/utils';
import {
  checkIsLegacyConfig,
  createDefaultConfig,
  createLegacyDefaultConfig,
  transformNormalizedConfig,
} from '../../config';
import type { AppToolsPlugin } from '../../new';
import type { AppToolsNormalizedConfig, AppUserConfig } from '../../types';

export default ({
  bundler,
}: {
  bundler: 'rspack' | 'webpack';
}): AppToolsPlugin => ({
  name: '@modern-js/plugin-initialize',

  post: [
    '@modern-js/plugin-ssr',
    '@modern-js/plugin-document',
    '@modern-js/plugin-state',
    '@modern-js/plugin-router',
    '@modern-js/plugin-router-v5',
    '@modern-js/plugin-polyfill',
  ],

  setup(api) {
    api.config(() => {
      const appContext = api.getAppContext();
      const userConfig = api.getNormalizedConfig();

      // set bundlerType to appContext
      api.updateAppContext({
        ...appContext,
        bundlerType: bundler,
      });

      return (checkIsLegacyConfig(userConfig)
        ? createLegacyDefaultConfig(appContext)
        : createDefaultConfig(
            appContext,
          )) as unknown as AppUserConfig<'shared'>;
    });

    api.modifyResolvedConfig(async resolved => {
      const appContext = api.getAppContext();
      const userConfig = api.getConfig();
      const port = await getServerPort(resolved);

      api.updateAppContext({
        port,
        distDirectory: ensureAbsolutePath(
          appContext.distDirectory!,
          resolved.output.distPath?.root || 'dist',
        ),
      });

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

      return resolved;
    });
  },
});

function stabilizeConfig<C extends Record<string, any>>(
  resolve: any,
  config: C,
  keys: Array<keyof C | 'plugins'>,
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
