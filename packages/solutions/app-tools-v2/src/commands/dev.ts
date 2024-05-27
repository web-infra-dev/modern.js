import { PluginAPI, ResolvedConfigContext } from '@modern-js/core';
import { DEFAULT_DEV_HOST } from '@modern-js/utils';
import { createDevServer } from '@modern-js/server';
import { initProdMiddlewares } from '@modern-js/prod-server';
import { registerCompiler } from '../utils/compiler';
import { printInstructions } from '../utils/instruction';
import { setServer, getServerInternalPlugins } from '../utils/server';
import { generateRoutes } from '../utils/routes';
import { DevOptions } from '../utils/types';
import { buildServerConfig } from '../utils/config';
import type { AppTools } from '../types';

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

  await registerCompiler(
    appContext.appDirectory,
    appContext.distDirectory,
    normalizedConfig?.source?.alias,
  );

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

  const serverOptions = {
    metaName,
    dev: {
      port,
      https: normalizedConfig.dev.https,
      host: normalizedConfig.dev.host,
      ...normalizedConfig.tools?.devServer,
    },
    appContext: {
      appDirectory,
      apiDirectory: appContext.apiDirectory,
      lambdaDirectory: appContext.lambdaDirectory,
      sharedDirectory: appContext.sharedDirectory,
    },
    routes: serverRoutes,
    pwd: appDirectory,
    config: normalizedConfig as any,
    serverConfigFile,
    internalPlugins: serverInternalPlugins,
    ...devServerOptions,
  };

  if (apiOnly) {
    const app = await createDevServer(
      serverOptions as any,
      initProdMiddlewares,
    );

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
      initProdMiddlewares,
    });
    // TODO: set correct server
    setServer(server as any);
  }
};
