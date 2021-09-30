import { isProd, isDev, isTest } from './is';

/**
 * Generate cache identifier from some packages and config files.
 */
export function getCacheIdentifier(
  packages: {
    name: string;
    version: string;
  }[],
  _files?: string[],
) {
  /* eslint-disable no-nested-ternary */
  let cacheIdentifier = isProd()
    ? 'production'
    : isDev()
    ? 'development'
    : isTest()
    ? 'test'
    : '';
  /* eslint-enable no-nested-ternary */

  for (const { name, version } of packages) {
    cacheIdentifier += `:${name}@${version}`;
  }

  // TODO: config file hash

  return cacheIdentifier;
}
