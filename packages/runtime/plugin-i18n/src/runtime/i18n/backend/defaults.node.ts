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
