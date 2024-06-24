import path from 'node:path';
import { PluginAPI, ResolvedConfigContext } from '@modern-js/core';
import { DEFAULT_DEV_HOST, SERVER_DIR, getMeta } from '@modern-js/utils';
import { createDevServer } from '@modern-js/server';
import { applyPlugins } from '@modern-js/prod-server';
import { loadServerPlugins } from '../utils/loadPlugins';
import { registerCompiler } from '../utils/register';
import { printInstructions } from '../utils/printInstructions';
import { setServer } from '../utils/createServer';
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

  const meta = getMeta(metaName);
  const serverConfigPath = path.resolve(
    appDirectory,
    SERVER_DIR,
    `${meta}.server`,
  );

  await hookRunners.beforeDev();

  if (!appContext.builder && !apiOnly) {
    throw new Error(
      'Expect the Builder to have been initialized, But the appContext.builder received `undefined`',
    );
  }

  await generateRoutes(appContext);

  const pluginInstances = await loadServerPlugins(api, appDirectory, metaName);

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
    serverConfigPath,
    routes: serverRoutes,
    pwd: appDirectory,
    config: normalizedConfig as any,
    serverConfigFile,
    plugins: pluginInstances,
    ...devServerOptions,
  };

  if (apiOnly) {
    const app = await createDevServer(serverOptions as any, applyPlugins);

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
      applyPlugins,
    });
    // TODO: set correct server
    setServer(server as any);
  }
};
