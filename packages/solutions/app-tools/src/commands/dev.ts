import { PluginAPI, ResolvedConfigContext } from '@modern-js/core';
import type { webpack } from '@modern-js/builder-webpack-provider';
import { createFileWatcher } from '../utils/createFileWatcher';
import { printInstructions } from '../utils/printInstructions';
import { createServer, injectDataLoaderPlugin } from '../utils/createServer';
import { generateRoutes } from '../utils/routes';
import { DevOptions } from '../utils/types';
import { getSpecifiedEntries } from '../utils/getSpecifiedEntries';
import { buildServerConfig } from '../utils/config';
import type { AppTools } from '../types';

export const dev = async (api: PluginAPI<AppTools>, options: DevOptions) => {
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
    entrypoints,
    serverConfigFile,
    serverInternalPlugins,
  } = appContext;
  const checkedEntries = await getSpecifiedEntries(
    options.entry || false,
    entrypoints,
  );

  api.setAppContext({
    ...appContext,
    checkedEntries,
  });
  appContext.checkedEntries = checkedEntries;

  await buildServerConfig({
    appDirectory,
    distDirectory,
    configFile: serverConfigFile,
    options: {
      esbuildOptions: {
        watch: true,
      },
    },
  });

  await hookRunners.beforeDev();

  let compiler: webpack.Compiler | webpack.MultiCompiler | undefined;

  if (!appContext.builder) {
    throw new Error(
      'Expect the Builder to have been initialized, But the appContext.builder received `undefined`',
    );
  }

  if (!apiOnly) {
    compiler = await appContext.builder.createCompiler();
  }

  await generateRoutes(appContext);

  const serverOptions = {
    dev: {
      port,
      https: normalizedConfig.dev.https,
      ...normalizedConfig.tools?.devServer,
    },
    compiler: compiler || null,
    pwd: appDirectory,
    config: normalizedConfig,
    serverConfigFile,
    internalPlugins: injectDataLoaderPlugin(serverInternalPlugins),
  };

  if (apiOnly) {
    const app = await createServer(serverOptions);
    app.listen(port, async (err: Error) => {
      if (err) {
        throw err;
      }
      printInstructions(hookRunners, appContext, normalizedConfig);
    });
  } else {
    await appContext.builder.startDevServer({
      compiler,
      printURLs: false,
      serverOptions,
    });
  }

  await createFileWatcher(
    appContext,
    normalizedConfig.source.configDir,
    hookRunners,
  );
};
