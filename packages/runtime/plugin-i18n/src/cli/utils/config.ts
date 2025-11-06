import { existsSync, statSync } from 'fs';
import { join, resolve } from 'path';
import type { BackendOptions, BaseBackendOptions } from '../../shared/type';
import { getEntryConfig, removeEntryConfigKey } from '../../shared/utils';

function getEnabled(backendObj: BaseBackendOptions): boolean {
  return backendObj.enabled !== undefined ? backendObj.enabled : true;
}

function removeEnabledProperty<T extends BaseBackendOptions>(
  config: T,
): Omit<T, 'enabled'> {
  const { enabled: _, ...rest } = config;
  return rest;
}

export function extractResourcePathPrefix(
  loadPath: string | undefined,
): string {
  if (!loadPath) {
    return '/locales';
  }

  const beforeTemplateMatch = loadPath.match(/^([^\{]+)/);
  if (!beforeTemplateMatch) {
    return extractFirstDirectory(loadPath);
  }

  let prefix = beforeTemplateMatch[1];
  prefix = prefix.replace(/\/$/, '').replace(/\.[^./]+$/, '');
  return extractFirstDirectory(prefix);
}

function extractFirstDirectory(path: string): string {
  const firstDirMatch = path.match(/^(\/[^/]+)/);
  if (firstDirMatch) {
    return firstDirMatch[1];
  }
  return path.startsWith('/') ? path : `/${path}`;
}

export function getBackendEnabled(
  entryName: string,
  backend: BackendOptions | undefined,
): boolean {
  if (backend === undefined) {
    return true;
  }

  const entryConfig = getEntryConfig(
    entryName,
    backend,
    'backendOptionsByEntry',
  );
  const configToUse = entryConfig || backend;
  return getEnabled(configToUse);
}

export function getBackendOptionsForEntry(
  entryName: string,
  backend: BackendOptions | undefined,
  appDirectory?: string,
): BaseBackendOptions | undefined {
  if (backend === undefined) {
    // If appDirectory is not provided, cannot check directory existence, return undefined
    if (!appDirectory) {
      return undefined;
    }
    // Check if locales directory exists to determine if backend should be enabled
    const directoryExists = checkBackendDirectoryExistsForEntry(
      entryName,
      undefined,
      appDirectory,
    );
    if (!directoryExists) {
      return undefined;
    }
    return { enabled: true };
  }

  const entryConfig = getEntryConfig(
    entryName,
    backend,
    'backendOptionsByEntry',
  );
  const mergedConfig = entryConfig ? { ...backend, ...entryConfig } : backend;
  const finalConfig = removeEntryConfigKey(
    mergedConfig,
    'backendOptionsByEntry',
  ) as BaseBackendOptions;

  if (appDirectory) {
    const directoryExists = checkBackendDirectoryExistsForEntry(
      entryName,
      backend,
      appDirectory,
    );
    if (!directoryExists) {
      return undefined;
    }
  }

  if (!getEnabled(finalConfig)) {
    return undefined;
  }

  return removeEnabledProperty(finalConfig);
}

export function getBackendResourcePathPrefixForEntry(
  entryName: string,
  backend: BackendOptions | undefined,
): string {
  if (!backend) {
    return '/locales';
  }

  const entryConfig = getEntryConfig(
    entryName,
    backend,
    'backendOptionsByEntry',
  );
  const configToUse = entryConfig || backend;
  return extractResourcePathPrefix(configToUse.loadPath);
}

export function checkBackendDirectoryExistsForEntry(
  entryName: string,
  backend: BackendOptions | undefined,
  appDirectory?: string,
): boolean {
  if (!appDirectory) {
    return true;
  }

  const checkDirectoryExists = createDirectoryChecker(appDirectory, backend);
  const prefix = getBackendResourcePathPrefixForEntry(entryName, backend);
  return checkDirectoryExists(prefix);
}

export function createDirectoryChecker(
  appDirectory: string | undefined,
  backend: BackendOptions | undefined,
): (urlPrefix: string) => boolean {
  return (urlPrefix: string): boolean => {
    if (!appDirectory) {
      return false;
    }

    const possiblePaths = collectPossibleDirectoryPaths(
      urlPrefix,
      appDirectory,
      backend,
    );

    return possiblePaths.some(path => {
      try {
        const resolvedPath = resolve(path);
        if (existsSync(resolvedPath)) {
          const stat = statSync(resolvedPath);
          return stat.isDirectory();
        }
        return false;
      } catch {
        return false;
      }
    });
  };
}

function collectPossibleDirectoryPaths(
  urlPrefix: string,
  appDirectory: string,
  backend: BackendOptions | undefined,
): string[] {
  const possiblePaths: string[] = [];
  const dirName = urlPrefix.slice(1);
  possiblePaths.push(join(appDirectory, dirName));

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

export function extractRelativeDirectoryPath(
  loadPath: string,
  appDirectory: string,
): string | null {
  const firstDir = loadPath.split('/')[0].replace(/^\.\/?/, '');
  if (!firstDir) {
    return null;
  }
  return join(appDirectory, firstDir);
}

export function getAllBackendResourcePathPrefixes(
  backend: BackendOptions | undefined,
  appDirectory?: string,
): string[] {
  const checkDirectoryExists = appDirectory
    ? createDirectoryChecker(appDirectory, backend)
    : undefined;

  if (!backend) {
    const defaultPrefix = '/locales';
    if (!checkDirectoryExists || checkDirectoryExists(defaultPrefix)) {
      return [defaultPrefix];
    }
    return [];
  }

  const prefixes = new Set<string>();
  const globalPrefix = extractResourcePathPrefix(backend.loadPath);
  if (!checkDirectoryExists || checkDirectoryExists(globalPrefix)) {
    prefixes.add(globalPrefix);
  }

  if (backend.backendOptionsByEntry) {
    for (const entryConfig of Object.values(backend.backendOptionsByEntry)) {
      const entryPrefix = extractResourcePathPrefix(entryConfig.loadPath);
      if (!checkDirectoryExists || checkDirectoryExists(entryPrefix)) {
        prefixes.add(entryPrefix);
      }
    }
  }

  return Array.from(prefixes);
}
