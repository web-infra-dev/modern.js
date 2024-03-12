import type Path from 'path';

export async function getPathModule() {
  let path: typeof Path;
  try {
    path = await import('path');
  } catch (_) {
    // @ts-expect-error
    path = await import('path-browserify');
  }

  return path;
}

export async function ensureAbsolutePath(base: string, filePath: string) {
  const path = await getPathModule();

  return path.isAbsolute(filePath) ? filePath : path.resolve(base, filePath);
}
