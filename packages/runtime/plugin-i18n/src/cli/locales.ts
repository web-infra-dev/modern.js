import fs from 'fs';
import path from 'path';
import {
  getPublicDirRoutePrefixes,
  normalizePublicDir,
  normalizePublicDirPath,
} from '@modern-js/server-core';
import type { BackendOptions } from '../shared/type';

interface NormalizedConfigForLocales {
  server?: {
    publicDir?: string | string[];
  };
}

export interface DetectedLocalesDirectory {
  loadPath: string;
  addPath: string;
  serverLoadPath: string;
  serverAddPath: string;
  serverLoadPaths?: string[];
  serverAddPaths?: string[];
}

const LOCALES_RESOURCE_PATTERN = '{{lng}}/{{ns}}.json';

function hasJsonFiles(dirPath: string): boolean {
  try {
    if (!fs.existsSync(dirPath) || !fs.statSync(dirPath).isDirectory()) {
      return false;
    }
    const entries = fs.readdirSync(dirPath);
    for (const entry of entries) {
      const entryPath = path.join(dirPath, entry);
      const stat = fs.statSync(entryPath);
      if (stat.isFile() && entry.endsWith('.json')) {
        return true;
      }
      if (stat.isDirectory() && hasJsonFiles(entryPath)) {
        return true;
      }
    }
    return false;
  } catch {
    return false;
  }
}

function toPosixPath(filePath: string): string {
  return filePath.split(path.sep).join(path.posix.sep);
}

function getPublicDirOutputPath(publicDir: string): string {
  return normalizePublicDirPath(publicDir);
}

function buildDetectedLocalesDirectory(
  clientBasePath: string,
  serverBasePath: string,
  serverBasePathCandidates: string[] = [serverBasePath],
): DetectedLocalesDirectory {
  const normalizedClientBasePath = clientBasePath.startsWith('/')
    ? clientBasePath
    : `/${clientBasePath}`;
  const normalizedServerBasePath = toPosixPath(serverBasePath).replace(
    /\/$/,
    '',
  );
  const normalizedServerBasePathCandidates = Array.from(
    new Set(
      serverBasePathCandidates.map(candidate =>
        toPosixPath(candidate).replace(/\/$/, ''),
      ),
    ),
  );
  const serverLoadPaths = normalizedServerBasePathCandidates.map(
    candidate => `${candidate}/${LOCALES_RESOURCE_PATTERN}`,
  );
  const serverAddPaths = normalizedServerBasePathCandidates.map(
    candidate => `${candidate}/${LOCALES_RESOURCE_PATTERN}`,
  );

  return {
    loadPath: `${normalizedClientBasePath}/${LOCALES_RESOURCE_PATTERN}`,
    addPath: `${normalizedClientBasePath}/${LOCALES_RESOURCE_PATTERN}`,
    serverLoadPath: `${normalizedServerBasePath}/${LOCALES_RESOURCE_PATTERN}`,
    serverAddPath: `${normalizedServerBasePath}/${LOCALES_RESOURCE_PATTERN}`,
    serverLoadPaths,
    serverAddPaths,
  };
}

export function detectLocalesDirectory(
  appDirectory: string,
  normalizedConfig?: NormalizedConfigForLocales,
): DetectedLocalesDirectory | undefined {
  const publicDirs = normalizePublicDir(normalizedConfig?.server?.publicDir);
  const publicDirPrefixes = getPublicDirRoutePrefixes(
    normalizedConfig?.server?.publicDir,
  );

  for (let index = 0; index < publicDirs.length; index++) {
    const publicDir = publicDirs[index];
    if (path.isAbsolute(publicDir)) {
      continue;
    }

    const publicDirPath = path.join(appDirectory, publicDir);
    const publicDirPrefix =
      publicDirPrefixes[index] || `/${normalizePublicDirPath(publicDir)}`;
    const publicDirOutputPath = getPublicDirOutputPath(publicDir);

    if (
      path.basename(normalizePublicDirPath(publicDir)) === 'locales' &&
      hasJsonFiles(publicDirPath)
    ) {
      return buildDetectedLocalesDirectory(
        publicDirPrefix,
        `./${publicDirOutputPath}`,
      );
    }

    const localesPath = path.join(publicDirPath, 'locales');
    if (hasJsonFiles(localesPath)) {
      return buildDetectedLocalesDirectory(
        `${publicDirPrefix}/locales`,
        `./${publicDirOutputPath}/locales`,
      );
    }
  }

  const configPublicPath = path.join(
    appDirectory,
    'config',
    'public',
    'locales',
  );
  if (hasJsonFiles(configPublicPath)) {
    return buildDetectedLocalesDirectory('/locales', './public/locales', [
      './config/public/locales',
      './public/locales',
    ]);
  }

  const rootLocalesPath = path.join(appDirectory, 'locales');
  if (hasJsonFiles(rootLocalesPath)) {
    return buildDetectedLocalesDirectory('/locales', './locales');
  }

  return undefined;
}

export function applyDetectedBackendPaths(
  backendOptions: BackendOptions,
  detectedLocales: DetectedLocalesDirectory | undefined,
): BackendOptions {
  if (!detectedLocales) {
    return backendOptions;
  }

  const backendWithDetectedPaths: BackendOptions & {
    _detectedLoadPath: string;
    _detectedAddPath: string;
  } = {
    ...backendOptions,
    enabled: true,
    loadPath: backendOptions.loadPath ?? detectedLocales.loadPath,
    addPath: backendOptions.addPath ?? detectedLocales.addPath,
    serverLoadPath:
      backendOptions.serverLoadPath ?? detectedLocales.serverLoadPath,
    serverLoadPaths:
      backendOptions.serverLoadPath || backendOptions.serverLoadPaths
        ? backendOptions.serverLoadPaths
        : detectedLocales.serverLoadPaths,
    serverAddPath:
      backendOptions.serverAddPath ?? detectedLocales.serverAddPath,
    serverAddPaths:
      backendOptions.serverAddPath || backendOptions.serverAddPaths
        ? backendOptions.serverAddPaths
        : detectedLocales.serverAddPaths,
    _detectedLoadPath: detectedLocales.loadPath,
    _detectedAddPath: detectedLocales.addPath,
  };

  return backendWithDetectedPaths;
}
