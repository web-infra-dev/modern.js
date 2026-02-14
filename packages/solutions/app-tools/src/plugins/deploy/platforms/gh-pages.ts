import path from 'path';
import type { ServerRoute } from '@modern-js/types';
import { fs } from '@modern-js/utils';
import { logger } from '@modern-js/utils';
import type { CreatePreset } from './platform';

async function reorganizeHtmlFiles(
  routes: ServerRoute[],
  baseDir: string,
  baseUrl = '/',
) {
  if (!routes || !Array.isArray(routes)) {
    logger.error('Invalid server routes');
    return;
  }

  await fs.ensureDir(baseDir);

  const baseUrlRegexp = new RegExp(`^${baseUrl}\\/?`);

  const collectedEntryPaths = new Set<string>();

  const copyPromises = routes.map(async route => {
    const { urlPath, entryPath } = route;

    if (!entryPath) {
      logger.warn(`Route ${urlPath} does not specify entryPath, skipping`);
      return;
    }

    if (collectedEntryPaths.has(entryPath)) {
      return;
    }

    collectedEntryPaths.add(entryPath);

    const sourceHtmlPath = path.join(baseDir, entryPath);

    if (!(await fs.pathExists(sourceHtmlPath))) {
      logger.error(`Source HTML file does not exist: ${sourceHtmlPath}`);
      return;
    }

    const targetDir = urlPath.replace(baseUrlRegexp, '');

    await fs.ensureDir(path.dirname(targetDir));

    const targetHtmlPath = path.join(baseDir, targetDir, 'index.html');

    try {
      await fs.move(sourceHtmlPath, targetHtmlPath);
    } catch (error: any) {
      logger.error(`Failed to copy HTML file: ${error.message}`);
    }
  });

  await Promise.all(copyPromises);
}

export const createGhPagesPreset: CreatePreset = ({
  appContext,
  modernConfig,
}) => {
  const { serverRoutes, appDirectory, distDirectory } = appContext;

  const {
    server: { baseUrl },
  } = modernConfig;
  const outputDirectory = path.join(appDirectory, '.output');

  return {
    name: 'gh-pages',
    async prepare() {
      await fs.remove(outputDirectory);
    },
    async writeOutput() {
      await fs.copy(distDirectory, outputDirectory);
    },
    async end() {
      await reorganizeHtmlFiles(
        serverRoutes,
        outputDirectory,
        Array.isArray(baseUrl) ? baseUrl[0] : baseUrl,
      );
    },
  };
};
