import type { ServerOptions } from '@modern-js/server-core';

export function transformToRegExp(input: string | RegExp): RegExp {
  if (typeof input === 'string') {
    return new RegExp(input);
  }
  return input;
}

export function shouldFlushServerHeader(
  serverConf: ServerOptions['server'],
  userAgent?: string,
  disablePreload?: boolean,
) {
  const { ssr: ssrConf } = serverConf || {};

  if (disablePreload) {
    return false;
  }

  if (typeof ssrConf === 'object' && ssrConf.preload) {
    // ssr.preload: 'object'
    if (typeof ssrConf.preload === 'object') {
      const { userAgentFilter } = ssrConf.preload;
      if (userAgentFilter && userAgent) {
        return !transformToRegExp(userAgentFilter).test(userAgent);
      }
      return true;
    }
    // ssr.preload: true;
    return true;
  }

  // ssr: false or ssr: true
  return false;
}
