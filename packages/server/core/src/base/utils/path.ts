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
