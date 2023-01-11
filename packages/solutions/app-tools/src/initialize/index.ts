import { ensureAbsolutePath, getPort, isDev } from '@modern-js/utils';
import { legacySchema, schema } from '../schema';
import { isDevCommand } from '../utils/commands';
import { transformNormalizedConfig } from '../config/initial/transformNormalizedConfig';
import {
  checkIsLegacyConfig,
  createDefaultConfig,
  createLegacyDefaultConfig,
} from '../config';
import {
  CliPlugin,
  AppTools,
  AppToolsNormalizedConfig,
  AppUserConfig,
} from '../types';

export default (): CliPlugin<AppTools> => ({
  name: '@modern-js/plugin-initialize',

  setup(api) {
    const config = () => {
      const appContext = api.useAppContext();
      const userConfig = api.useConfigContext();

      return checkIsLegacyConfig(userConfig)
        ? (createLegacyDefaultConfig(appContext) as unknown as AppUserConfig)
        : createDefaultConfig(appContext);
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

        return {
          resolved: {
            // FIXME: the userConfig mayby legacy userConfig
            _raw: userConfig,
            source: normalizedConfig.source || {},
            server: {
              ...(normalizedConfig.server || {}),
              port,
            },
            bff: normalizedConfig.bff || {},
            dev: normalizedConfig.dev || {},
            html: normalizedConfig.html || {},
            output: normalizedConfig.output || {},
            security: normalizedConfig.security || {},
            tools: normalizedConfig.tools || {},
            testing: normalizedConfig.testing || {},
            plugins: normalizedConfig.plugins || [],
            builderPlugins: normalizedConfig.builderPlugins || [],
            runtime: normalizedConfig.runtime || {},
            runtimeByEntries: normalizedConfig.runtimeByEntries || {},
            deploy: normalizedConfig.deploy || {},
            performance: normalizedConfig.performance || {},
            experiments: normalizedConfig.experiments || {},
            autoLoadPlugins: normalizedConfig.autoLoadPlugins || false,
          },
        };
      },
    };
  },
});

async function getServerPort(config: AppToolsNormalizedConfig) {
  const prodPort = config.server.port || 8080;

  if (isDev() && isDevCommand()) {
    return getPort(config.dev.port || prodPort);
  }

  return prodPort;
}
