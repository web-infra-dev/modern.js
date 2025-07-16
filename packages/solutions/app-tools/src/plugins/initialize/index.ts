import {
  ensureAbsolutePath,
  getPort,
  isDev,
  isDevCommand,
} from '@modern-js/utils';
import { createDefaultConfig } from '../../config';
import type {
  AppTools,
  AppToolsNormalizedConfig,
  AppUserConfig,
  CliPluginFuture,
} from '../../types';

export default (): CliPluginFuture<AppTools> => ({
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

      return createDefaultConfig(appContext) as unknown as AppUserConfig;
    });

    api.modifyResolvedConfig(async resolved => {
      let appContext = api.getAppContext();
      const userConfig = api.getConfig();
      const port = await getServerPort(resolved);

      appContext = {
        ...appContext,
        port,
        distDirectory: ensureAbsolutePath(
          appContext.appDirectory,
          resolved.output.distPath?.root || 'dist',
        ),
      };

      api.updateAppContext(appContext);

      const normalizedConfig = resolved;

      resolved._raw = userConfig;
      resolved.server = {
        ...(normalizedConfig.server || {}),
        port,
      };
      stabilizeConfig(
        resolved,
        normalizedConfig as AppToolsNormalizedConfig & { plugins: any },
        [
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
        ],
      );

      return resolved;
    });
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
