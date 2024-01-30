import { PluginAPI, ResolvedConfigContext } from '@modern-js/core';
import { DEFAULT_DEV_HOST } from '@modern-js/utils';
import { createDevServer, ModernDevServerOptions } from '@modern-js/server';
import { createServer, ProdServerOptions } from '@modern-js/prod-server-new';
import { printInstructions } from '../utils/printInstructions';
import { setServer, injectDataLoaderPlugin } from '../utils/createServer';
import { generateRoutes } from '../utils/routes';
import { DevOptions } from '../utils/types';
import { buildServerConfig } from '../utils/config';
import type { AppTools } from '../types';
import { getServerInternalPlugins } from '../utils/getServerInternalPlugins';

export interface ExtraServerOptions {
  useSSRWorker?: boolean;
}

export const dev = async (
  api: PluginAPI<AppTools<'shared'>>,
  options: DevOptions,
  devServerOptions: ExtraServerOptions = {},
) => {
  if (options.analyze) {
    // Builder will read this env var to enable bundle analyzer
    process.env.BUNDLE_ANALYZE = 'true';
  }
  let normalizedConfig = api.useResolvedConfigContext();
  const appContext = api.useAppContext();
  const hookRunners = api.useHookRunners();

  normalizedConfig = { ...normalizedConfig, cliOptions: options };
  ResolvedConfigContext.set(normalizedConfig);

  const {
    appDirectory,
    distDirectory,
    port,
    apiOnly,
    serverConfigFile,
    metaName,
    serverRoutes,
  } = appContext;

  await buildServerConfig({
    appDirectory,
    distDirectory,
    configFile: serverConfigFile,
    watch: true,
  });

  await hookRunners.beforeDev();

  if (!appContext.builder && !apiOnly) {
    throw new Error(
      'Expect the Builder to have been initialized, But the appContext.builder received `undefined`',
    );
  }

  await generateRoutes(appContext);
  const serverInternalPlugins = await getServerInternalPlugins(api);

  const serverOptions: ModernDevServerOptions<ProdServerOptions> = {
    metaName,
    dev: {
      port,
      https: normalizedConfig.dev.https,
      host: normalizedConfig.dev.host,
      ...normalizedConfig.tools?.devServer,
    },
    appContext: {
      apiDirectory: appContext.apiDirectory,
      lambdaDirectory: appContext.lambdaDirectory,
      sharedDirectory: appContext.sharedDirectory,
    },
    routes: serverRoutes,
    pwd: appDirectory,
    config: normalizedConfig as any,
    serverConfigFile,
    internalPlugins: injectDataLoaderPlugin(serverInternalPlugins),
    ...devServerOptions,
  };

  if (apiOnly) {
    const app = await createDevServer(serverOptions, createServer);

    const host = normalizedConfig.dev?.host || DEFAULT_DEV_HOST;

    app.listen(
      {
        port,
        host,
      },
      () => {
        printInstructions(hookRunners, appContext, normalizedConfig);
      },
    );
  } else {
    const { server } = await appContext.builder!.startDevServer({
      serverOptions,
      createProdServer: createServer,
    });
    // TODO: set correct server
    setServer(server as any);
  }
};
