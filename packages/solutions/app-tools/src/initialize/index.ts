import { ensureAbsolutePath, getPort, isDev } from '@modern-js/utils';
import { legacySchema, schema } from '../schema';
import { getCommand } from '../utils/commands';
import { transformNormalizedConfig } from '../config/initial/transformNormalizedConfig';
import {
  checkIsLegacyConfig,
  createDefaultConfig,
  createLegacyDefaultConfig,
} from '../config';
import {
  CliPlugin,
  AppTools,
  IAppContext,
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
        const port = await getDevServerPort(appContext, resolved);
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
              port: port || normalizedConfig.server?.port,
            },
            bff: normalizedConfig.bff || {},
            dev: normalizedConfig.dev || {},
            html: normalizedConfig.html || {},
            output: normalizedConfig.output || {},
            security: normalizedConfig.security || {},
            tools: normalizedConfig.tools || {},
            testing: normalizedConfig.testing || {},
            plugins: normalizedConfig.plugins || [],
            runtime: normalizedConfig.runtime || {},
            runtimeByEntries: normalizedConfig.runtimeByEntries || {},
            deploy: normalizedConfig.deploy || {},
            performance: normalizedConfig.performance || {},
            experiments: normalizedConfig.experiments || {},
          },
        };
      },
    };
  },
});

async function getDevServerPort(
  appContext: IAppContext,
  resolved: AppToolsNormalizedConfig,
) {
  const command = getCommand();
  if (isDev() && command === 'dev') {
    return (appContext.port ?? 0) > 0
      ? appContext.port
      : await getPort(resolved.server.port || 8080);
  }
  return resolved.server.port;
}
