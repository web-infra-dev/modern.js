import path from 'node:path';
import type { CLIPluginAPI } from '@modern-js/plugin';
import { applyPlugins } from '@modern-js/prod-server';
import {
  type ApplyPlugins,
  type ModernDevServerOptions,
  createDevServer,
} from '@modern-js/server';
import {
  type Alias,
  DEFAULT_DEV_HOST,
  SERVER_DIR,
  getMeta,
  logger,
} from '@modern-js/utils';
import type { ConfigChain } from '@rsbuild/core';
import type { AppNormalizedConfig, AppTools } from '../types';
import { setServer } from '../utils/createServer';
import { loadServerPlugins } from '../utils/loadPlugins';
import { printInstructions } from '../utils/printInstructions';
import { registerCompiler } from '../utils/register';
import { generateRoutes } from '../utils/routes';
import type { DevOptions } from '../utils/types';

interface ExtraServerOptions {
  applyPlugins?: ApplyPlugins;
}

export const dev = async (
  api: CLIPluginAPI<AppTools>,
  options: DevOptions,
  devServerOptions?: ExtraServerOptions,
) => {
  if (options.analyze) {
    // Builder will read this env var to enable bundle analyzer
    process.env.BUNDLE_ANALYZE = 'true';
  }
  const normalizedConfig = api.getNormalizedConfig();
  const appContext = api.getAppContext();
  const hooks = api.getHooks();

  const combinedAlias = ([] as unknown[])
    .concat(normalizedConfig?.resolve?.alias ?? [])
    .concat(normalizedConfig?.source?.alias ?? []) as ConfigChain<Alias>;

  if (appContext.moduleType && appContext.moduleType === 'module') {
    const { registerEsm } = await import('../esm/register-esm.mjs');
    await registerEsm({
      appDir: appContext.appDirectory,
      distDir: appContext.distDirectory,
      alias: {},
    });
  }

  await registerCompiler(
    appContext.appDirectory,
    appContext.distDirectory,
    combinedAlias,
  );

  const { appDirectory, port, apiOnly, metaName, serverRoutes } = appContext;

  const meta = getMeta(metaName);
  const serverConfigPath = path.resolve(
    appDirectory,
    SERVER_DIR,
    `${meta}.server`,
  );

  await hooks.onBeforeDev.call();

  if (!appContext.builder && !apiOnly) {
    throw new Error(
      'Expect the Builder to have been initialized, But the appContext.builder received `undefined`',
    );
  }

  await generateRoutes(appContext);

  const pluginInstances = await loadServerPlugins(api, appDirectory, metaName);

  const serverOptions: ModernDevServerOptions = {
    metaName,
    dev: {
      https: normalizedConfig.dev.https,
      setupMiddlewares: normalizedConfig.dev.setupMiddlewares,
    },
    appContext: {
      appDirectory,
      internalDirectory: appContext.internalDirectory,
      apiDirectory: appContext.apiDirectory,
      lambdaDirectory: appContext.lambdaDirectory,
      sharedDirectory: appContext.sharedDirectory,
      bffRuntimeFramework: appContext.bffRuntimeFramework,
    },
    serverConfigPath,
    routes: serverRoutes,
    pwd: appDirectory,
    config: normalizedConfig as any,
    plugins: pluginInstances,
    ...devServerOptions,
  };

  const host = normalizedConfig.dev?.host || DEFAULT_DEV_HOST;

  if (apiOnly) {
    const { server } = await createDevServer(
      {
        ...serverOptions,
        runCompile: false,
      },
      devServerOptions?.applyPlugins || applyPlugins,
    );

    server.listen(
      {
        port,
        host,
      },
      () => {
        printInstructions(
          hooks,
          appContext,
          normalizedConfig as AppNormalizedConfig,
        );
      },
    );
    setServer(server);
  } else {
    const { server, afterListen } = await createDevServer(
      {
        ...serverOptions,
        builder: appContext.builder,
      },
      devServerOptions?.applyPlugins || applyPlugins,
    );

    server.listen(
      {
        port,
        host,
      },
      async (err?: Error) => {
        if (err) {
          logger.error('Occur error %s, when start dev server', err);
        }

        logger.debug('listen dev server done');

        await afterListen();
      },
    );

    setServer(server);
  }
};
