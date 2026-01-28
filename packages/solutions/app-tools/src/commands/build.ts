import path from 'node:path';
import type { CLIPluginAPI } from '@modern-js/plugin';
import { fs, type Alias, logger } from '@modern-js/utils';
import type { ConfigChain } from '@rsbuild/core';
import type { AppTools } from '../types';
import { loadServerPlugins } from '../utils/loadPlugins';
import { setupTsRuntime } from '../utils/register';
import { generateRoutes } from '../utils/routes';
import type { BuildOptions } from '../utils/types';

async function copyEnvFiles(
  appDirectory: string,
  distDirectory: string,
): Promise<void> {
  try {
    const files = await fs.readdir(appDirectory);

    const envFileRegex = /^\.env(\.[a-zA-Z0-9_-]+)*$/;
    const envFiles = files.filter(file => envFileRegex.test(file));

    if (envFiles.length === 0) {
      logger.debug('No .env files found to copy');
      return;
    }

    const copyPromises = envFiles.map(async envFile => {
      const sourcePath = path.resolve(appDirectory, envFile);
      const targetPath = path.resolve(distDirectory, envFile);

      try {
        const stat = await fs.stat(sourcePath);
        if (stat.isDirectory()) {
          return;
        }

        await fs.copy(sourcePath, targetPath);
      } catch (error) {
        logger.warn(`Failed to copy ${envFile}:`, error);
      }
    });

    await Promise.all(copyPromises);
  } catch (error) {
    logger.warn('Failed to copy .env files:', error);
  }
}

export const build = async (
  api: CLIPluginAPI<AppTools>,
  options?: BuildOptions,
) => {
  if (options?.analyze) {
    // Builder will read this env var to enable bundle analyzer
    process.env.BUNDLE_ANALYZE = 'true';
  }

  const resolvedConfig = api.getNormalizedConfig();
  const appContext = api.getAppContext();
  const hooks = api.getHooks();

  const combinedAlias = ([] as unknown[])
    .concat(resolvedConfig?.resolve?.alias ?? [])
    .concat(resolvedConfig?.source?.alias ?? []) as ConfigChain<Alias>;

  // we need load server plugin to appContext for ssg & deploy commands.
  await loadServerPlugins(api, appContext.appDirectory, appContext.metaName);

  // Register Node.js module hooks for ESM TypeScript support
  if (appContext.moduleType && appContext.moduleType === 'module') {
    const { registerModuleHooks } = await import('../esm/register-esm.mjs');
    await registerModuleHooks({
      appDir: appContext.appDirectory,
      distDir: appContext.distDirectory,
      alias: {},
    });
  }

  // Setup ts-node and tsconfig-paths for TypeScript runtime support
  await setupTsRuntime(
    appContext.appDirectory,
    appContext.distDirectory,
    combinedAlias,
  );

  const { apiOnly } = appContext;

  if (apiOnly) {
    await hooks.onBeforeBuild.call({
      environments: {},
      // "null" bundlerConfigs
      bundlerConfigs: undefined,
      isFirstCompile: false,
      isWatch: false,
    });

    await generateRoutes(appContext);

    await hooks.onAfterBuild.call({
      environments: {},
      // "null" stats
      stats: undefined,
      isFirstCompile: false,
      isWatch: false,
    });

    return;
  }

  logger.info('Starting production build...');
  if (!appContext.builder) {
    throw new Error(
      'Expect the Builder to have been initialized, But the appContext.builder received `undefined`',
    );
  }
  await appContext.builder.onAfterBuild(async () => {
    return copyEnvFiles(appContext.appDirectory, appContext.distDirectory);
  });
  await appContext.builder.build({
    watch: options?.watch,
  });
};
