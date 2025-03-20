import path from 'node:path';
import type { CLIPluginAPI } from '@modern-js/plugin-v2';
import { applyPlugins } from '@modern-js/prod-server';
import { type ApplyPlugins, createDevServer } from '@modern-js/server';
import {
  DEFAULT_DEV_HOST,
  SERVER_DIR,
  getMeta,
  logger,
} from '@modern-js/utils';
import type { AppNormalizedConfig, AppTools } from '../types';
import { buildServerConfig } from '../utils/config';
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
  api: CLIPluginAPI<AppTools<'shared'>>,
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

  if (appContext.moduleType && appContext.moduleType === 'module') {
    const { registerEsm } = await import('../esm/register-esm.mjs');
    await registerEsm({
      appDir: appContext.appDirectory,
      distDir: appContext.distDirectory,
      alias: normalizedConfig.source?.alias,
    });
  }

  await registerCompiler(
    appContext.appDirectory,
    appContext.distDirectory,
    normalizedConfig?.source?.alias,
  );

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

  await hooks.onBeforeDev.call();

  if (!appContext.builder && !apiOnly) {
    throw new Error(
      'Expect the Builder to have been initialized, But the appContext.builder received `undefined`',
    );
  }

  await generateRoutes(appContext);

  const pluginInstances = await loadServerPlugins(api, appDirectory, metaName);

  const toolsDevServerConfig = normalizedConfig.tools?.devServer;

  const serverOptions = {
    metaName,
    dev: {
      // [`normalizedConfig.tools.devServer`](https://modernjs.dev/en/configure/app/tools/dev-server.html) already deprecated, we should using `normalizedConfig.dev` instead firstly.
      // Oterwise, the `normalizedConfig.dev` can't be apply correctly.
      ...toolsDevServerConfig,
      devMiddleware: {
        writeToDisk: normalizedConfig.dev.writeToDisk,
      },
      port,
      host: normalizedConfig.dev.host ?? (toolsDevServerConfig as any)?.host,
      https: normalizedConfig.dev.https ?? (toolsDevServerConfig as any)?.https,
      hot: normalizedConfig.dev.hmr ?? (toolsDevServerConfig as any)?.hot,
      setupMiddlewares:
        normalizedConfig.dev.setupMiddlewares ??
        (toolsDevServerConfig as any)?.setupMiddlewares,
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
    serverConfigFile,
    plugins: pluginInstances,
    ...devServerOptions,
  } as any;

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
          normalizedConfig as AppNormalizedConfig<'shared'>,
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
