import path from 'node:path';
import type { CLIPluginAPI } from '@modern-js/plugin';
import {
  fs,
  type Alias,
  isPathInside,
  logger,
  resolveInsideOrFallback,
} from '@modern-js/utils';
import type { ConfigChain } from '@rsbuild/core';
import type { AppTools } from '../types';
import { loadServerPlugins } from '../utils/loadPlugins';
import { setupTsRuntime } from '../utils/register';
import { generateRoutes } from '../utils/routes';
import type { BuildOptions } from '../utils/types';

function getSafeDistTarget(
  distDirectory: string,
  envDir: string | undefined,
  envFile: string,
): string {
  if (!envDir) {
    return path.resolve(distDirectory, envFile);
  }

  const resolvedTargetPath = path.resolve(distDirectory, envDir, envFile);
  if (!isPathInside(distDirectory, resolvedTargetPath)) {
    logger.warn(
      `The env directory ${envDir} is outside dist directory, fallback to dist root`,
    );
    return path.resolve(distDirectory, envFile);
  }

  return resolvedTargetPath;
}

async function copyEnvFiles(
  appDirectory: string,
  distDirectory: string,
  envDir?: string,
): Promise<void> {
  try {
    const envDirectory = resolveInsideOrFallback(
      appDirectory,
      envDir,
      appDirectory,
    );
    if (
      envDir &&
      !isPathInside(appDirectory, path.resolve(appDirectory, envDir))
    ) {
      logger.warn(
        `The env directory ${envDir} is outside project root, fallback to project root`,
      );
    }

    if (!(await fs.pathExists(envDirectory))) {
      logger.debug(`Env directory does not exist: ${envDirectory}`);
      return;
    }

    const envDirectoryStat = await fs.stat(envDirectory);
    if (!envDirectoryStat.isDirectory()) {
      logger.debug(`Env path is not a directory: ${envDirectory}`);
      return;
    }

    const files = await fs.readdir(envDirectory);

    const envFileRegex = /^\.env(\.[a-zA-Z0-9_-]+)*$/;
    const envFiles = files.filter(file => envFileRegex.test(file));

    if (envFiles.length === 0) {
      logger.debug('No .env files found to copy');
      return;
    }

    const copyPromises = envFiles.map(async envFile => {
      const sourcePath = path.resolve(envDirectory, envFile);
      const targetPath = getSafeDistTarget(distDirectory, envDir, envFile);

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
    return copyEnvFiles(
      appContext.appDirectory,
      appContext.distDirectory,
      options?.envDir,
    );
  });
  await appContext.builder.build({
    watch: options?.watch,
  });
};
