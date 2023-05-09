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
