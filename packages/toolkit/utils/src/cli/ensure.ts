import path from 'path';

/**
 * ensure absolute file path.
 * @param base - Base path to resolve relative from.
 * @param filePath - Absolute or relative file path.
 * @returns Resolved absolute file path.
 */
export const ensureAbsolutePath = (base: string, filePath: string): string =>
  path.isAbsolute(filePath) ? filePath : path.resolve(base, filePath);

export const ensureArray = <T>(params: T | T[]): T[] => {
  if (Array.isArray(params)) {
    return params;
  }
  return [params];
};

export const isPathInside = (parent: string, child: string): boolean => {
  const relativePath = path.relative(parent, child);

  return (
    relativePath === '' ||
    (!relativePath.startsWith('..') && !path.isAbsolute(relativePath))
  );
};

export const resolveInsideOrFallback = (
  base: string,
  target: string | undefined,
  fallback?: string,
): string => {
  if (!target) {
    return fallback ?? base;
  }

  const resolvedTarget = path.resolve(base, target);
  if (!isPathInside(base, resolvedTarget)) {
    return fallback ?? base;
  }

  return resolvedTarget;
};
