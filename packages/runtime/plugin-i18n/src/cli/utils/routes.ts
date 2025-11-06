import path from 'path';
import type { ServerRoute } from '@modern-js/types';
import { fs } from '@modern-js/utils';
import type { BackendOptions } from '../../shared/type';
import { extractRelativeDirectoryPath } from './config';

/**
 * Walk directory recursively and return all file paths
 */
export function walkDirectory(dir: string): string[] {
  if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
    return [];
  }

  const files: string[] = [];
  try {
    const entries = fs.readdirSync(dir);
    for (const entry of entries) {
      const filePath = path.join(dir, entry);
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        files.push(...walkDirectory(filePath));
      } else {
        files.push(filePath);
      }
    }
  } catch {
    // Ignore errors when reading directory
  }
  return files;
}

/**
 * Get possible directory paths for a URL prefix
 */
export function getPossibleDirectoryPaths(
  urlPrefix: string,
  appDirectory: string,
  backend: BackendOptions | undefined,
): string[] {
  const possiblePaths: string[] = [];
  const dirName = urlPrefix.slice(1); // Remove leading '/'
  possiblePaths.push(path.join(appDirectory, dirName));

  if (backend) {
    if (backend.loadPath && !backend.loadPath.startsWith('/')) {
      const relativePath = extractRelativeDirectoryPath(
        backend.loadPath,
        appDirectory,
      );
      if (relativePath && !possiblePaths.includes(relativePath)) {
        possiblePaths.unshift(relativePath);
      }
    }

    if (backend.backendOptionsByEntry) {
      for (const entryConfig of Object.values(backend.backendOptionsByEntry)) {
        if (entryConfig.loadPath && !entryConfig.loadPath.startsWith('/')) {
          const relativePath = extractRelativeDirectoryPath(
            entryConfig.loadPath,
            appDirectory,
          );
          if (relativePath && !possiblePaths.includes(relativePath)) {
            possiblePaths.unshift(relativePath);
          }
        }
      }
    }
  }

  return possiblePaths;
}

/**
 * Collect locale routes from backend directories
 */
export function collectLocaleRoutes(
  urlPrefixes: string[],
  appDirectory: string,
  backend: BackendOptions | undefined,
): ServerRoute[] {
  const localeRoutes: ServerRoute[] = [];

  for (const urlPrefix of urlPrefixes) {
    const possiblePaths = getPossibleDirectoryPaths(
      urlPrefix,
      appDirectory,
      backend,
    );
    for (const dirPath of possiblePaths) {
      if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
        const files = walkDirectory(dirPath);
        for (const filePath of files) {
          // Convert file system path to URL path
          const relativePath = path.relative(dirPath, filePath);
          const urlPath = path.posix.join(urlPrefix, relativePath);
          const normalizedUrlPath = urlPath.replace(/\\/g, '/');

          // entryPath should be relative to appDirectory for static file serving
          const entryPath = path.posix
            .relative(appDirectory, filePath)
            .replace(/\\/g, '/');

          localeRoutes.push({
            urlPath: normalizedUrlPath,
            isSPA: true,
            isSSR: false,
            entryPath,
          });
        }
        // Only process the first existing directory
        break;
      }
    }
  }

  return localeRoutes;
}
