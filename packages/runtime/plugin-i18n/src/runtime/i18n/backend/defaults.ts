export const DEFAULT_I18NEXT_BACKEND_OPTIONS = {
  loadPath: '/locales/{{lng}}/{{ns}}.json',
  addPath: '/locales/{{lng}}/{{ns}}.json',
};

function convertPath(path: string | undefined): string | undefined {
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

export function convertBackendOptions<T extends InternalBackendPathOptions>(
  options: T,
): T {
  if (!options) {
    return options;
  }
  const converted = { ...options };
  delete converted.serverLoadPath;
  delete converted.serverAddPath;
  delete converted.serverLoadPaths;
  delete converted.serverAddPaths;
  delete converted._detectedLoadPath;
  delete converted._detectedAddPath;
  if (converted.loadPath) {
    converted.loadPath = convertPath(converted.loadPath);
  }
  if (converted.addPath) {
    converted.addPath = convertPath(converted.addPath);
  }
  return converted;
}
