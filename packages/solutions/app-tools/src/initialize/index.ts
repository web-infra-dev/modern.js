import {
  ensureAbsolutePath,
  getPort,
  isDev,
  isDevCommand,
} from '@modern-js/utils';
import { legacySchema, schema } from '../schema';
import {
  checkIsLegacyConfig,
  createDefaultConfig,
  createLegacyDefaultConfig,
  transformNormalizedConfig,
} from '../config';
import type {
  CliPlugin,
  AppTools,
  AppToolsNormalizedConfig,
  AppUserConfig,
  AppNormalizedConfig,
} from '../types';

export default ({
  bundler,
}: {
  bundler: 'rspack' | 'webpack';
}): CliPlugin<AppTools> => ({
  name: '@modern-js/plugin-initialize',

  setup(api) {
    const config = () => {
      const appContext = api.useAppContext();
      const userConfig = api.useConfigContext();

      return checkIsLegacyConfig(userConfig)
        ? (createLegacyDefaultConfig(appContext) as unknown as AppUserConfig)
        : createDefaultConfig(appContext, bundler);
    };

    const validateSchema = () => {
      const userConfig = api.useConfigContext();
      const schemas = checkIsLegacyConfig(userConfig) ? legacySchema : schema;
      return schemas.generate();
    };

    return {
      config,
      validateSchema,
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
        resolved.autoLoadPlugins = normalizedConfig.autoLoadPlugins || false;
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
          (resolved as AppNormalizedConfig<'webpack'>).security =
            (normalizedConfig as AppNormalizedConfig<'webpack'>).security || {};
          (resolved as AppNormalizedConfig<'webpack'>).experiments = (
            normalizedConfig as AppNormalizedConfig<'webpack'>
          ).experiments;
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
  const prodPort = config.server.port || 8080;

  if (isDev() && isDevCommand()) {
    return getPort(config.dev.port || prodPort);
  }

  return prodPort;
}
