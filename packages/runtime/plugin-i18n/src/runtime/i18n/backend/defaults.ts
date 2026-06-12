export const DEFAULT_I18NEXT_BACKEND_OPTIONS = {
  loadPath: '/locales/{{lng}}/{{ns}}.json',
  addPath: '/locales/{{lng}}/{{ns}}.json',
};

function convertPath(path: string | undefined): string | undefined {
  return path;
}

export function convertBackendOptions<
  T extends { loadPath?: string; addPath?: string },
>(options: T): T {
  if (!options) {
    return options;
  }
  const converted = { ...options };
  if (converted.loadPath) {
    converted.loadPath = convertPath(converted.loadPath);
  }
  if (converted.addPath) {
    converted.addPath = convertPath(converted.addPath);
  }
  return converted;
}
