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

export interface ExtraServerOptions {
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

  api.modifyResolvedConfig(config => {
    return { ...config, cliOptions: options };
  });

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
      internalDirectory: appContext.internalDirectory,
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
