import path from 'path';
import type { ServerNormalizedConfig } from '../types';

/**
 * Normalize publicDir configuration to an array of strings
 * @param publicDir - publicDir configuration (string | string[] | undefined)
 * @returns Array of publicDir paths, or empty array if not configured
 */
export function normalizePublicDir(publicDir?: string | string[]): string[] {
  if (!publicDir) {
    return [];
  }
  return Array.isArray(publicDir) ? publicDir : [publicDir];
}

/**
 * Normalize a single publicDir path by removing leading './' and trailing '/'
 * @param dir - Directory path to normalize
 * @returns Normalized directory path
 */
export function normalizePublicDirPath(dir: string): string {
  return dir.replace(/^\.\//, '').replace(/\/$/, '');
}

/**
 * Get route prefixes from publicDir configuration
 * Files from publicDir are copied to dist/{dir}/, so the route prefix is /{dir}
 * @param publicDir - publicDir configuration (string | string[] | undefined)
 * @returns Array of route prefixes (e.g., ['/locales'])
 */
export function getPublicDirRoutePrefixes(
  publicDir?: string | string[],
): string[] {
  const dirs = normalizePublicDir(publicDir);
  return dirs.map(dir => {
    const normalized = normalizePublicDirPath(dir);
    return `/${normalized}`;
  });
}

/**
 * Get regex patterns from publicDir configuration for static file matching
 * Files from publicDir are copied to dist/{dir}/, so the pattern is {dir}/
 * @param publicDir - publicDir configuration (string | string[] | undefined)
 * @returns Array of patterns (e.g., ['locales/'])
 */
export function getPublicDirPatterns(publicDir?: string | string[]): string[] {
  const dirs = normalizePublicDir(publicDir);
  return dirs.map(dir => {
    const normalized = normalizePublicDirPath(dir);
    return `${normalized}/`;
  });
}

/**
 * Resolve publicDir paths to absolute paths
 * @param publicDir - publicDir configuration (string | string[] | undefined)
 * @param appDirectory - Application root directory
 * @returns Array of absolute paths
 */
export function resolvePublicDirPaths(
  publicDir?: string | string[],
  appDirectory?: string,
): string[] {
  const dirs = normalizePublicDir(publicDir);
  if (!appDirectory) {
    return dirs;
  }
  return dirs.map(dir => path.resolve(appDirectory, dir));
}

/**
 * Get publicDir configuration from server config
 * @param serverConfig - Server normalized config
 * @returns publicDir configuration or undefined
 */
export function getPublicDirConfig(
  serverConfig?: ServerNormalizedConfig,
): string | string[] | undefined {
  return serverConfig?.publicDir;
}
