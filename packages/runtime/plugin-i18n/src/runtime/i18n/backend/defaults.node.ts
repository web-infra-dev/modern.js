import fs from 'fs';

export const DEFAULT_I18NEXT_BACKEND_OPTIONS = {
  loadPath: './locales/{{lng}}/{{ns}}.json',
  addPath: './locales/{{lng}}/{{ns}}.json',
};

function convertPath(path: string | undefined): string | undefined {
  if (!path) {
    return path;
  }
  // If it's an absolute path (starts with /), convert to relative path
  if (path.startsWith('/')) {
    return `.${path}`;
  }
  return path;
}

interface InternalBackendPathOptions {
  loadPath?: string;
  addPath?: string;
  serverLoadPath?: string;
  serverAddPath?: string;
  serverLoadPaths?: string[];
  serverAddPaths?: string[];
  _detectedLoadPath?: string;
  _detectedAddPath?: string;
}

function shouldUseServerPath(
  currentPath: string | undefined,
  detectedPath: string | undefined,
): boolean {
  return !detectedPath || currentPath === detectedPath;
}

function getResourceBasePath(resourcePath: string): string {
  const markerIndex = resourcePath.indexOf('{{lng}}');
  if (markerIndex < 0) {
    return resourcePath;
  }
  return resourcePath.slice(0, markerIndex).replace(/[\\/]+$/, '');
}

function pathExists(resourcePath: string): boolean {
  try {
    return fs.existsSync(getResourceBasePath(resourcePath));
  } catch {
    return false;
  }
}

function getServerPath(
  pathCandidates: string[] | undefined,
  fallbackPath: string | undefined,
): string | undefined {
  const candidates = Array.from(
    new Set([...(pathCandidates || []), fallbackPath].filter(Boolean)),
  ) as string[];

  return candidates.find(pathExists) || candidates[0];
}

export function convertBackendOptions<T extends InternalBackendPathOptions>(
  options: T,
): T {
  if (!options) {
    return options;
  }
  const converted = { ...options };
  if (
    (converted.serverLoadPath || converted.serverLoadPaths) &&
    shouldUseServerPath(converted.loadPath, converted._detectedLoadPath)
  ) {
    converted.loadPath = getServerPath(
      converted.serverLoadPaths,
      converted.serverLoadPath,
    );
  } else if (converted.loadPath) {
    converted.loadPath = convertPath(converted.loadPath);
  }
  if (
    (converted.serverAddPath || converted.serverAddPaths) &&
    shouldUseServerPath(converted.addPath, converted._detectedAddPath)
  ) {
    converted.addPath = getServerPath(
      converted.serverAddPaths,
      converted.serverAddPath,
    );
  } else if (converted.addPath) {
    converted.addPath = convertPath(converted.addPath);
  }
  delete converted.serverLoadPath;
  delete converted.serverAddPath;
  delete converted.serverLoadPaths;
  delete converted.serverAddPaths;
  delete converted._detectedLoadPath;
  delete converted._detectedAddPath;
  return converted;
}
