import path from 'path';
import type { ServerOptions } from '@modern-js/server-core';
import {
  NESTED_ROUTE_SPEC_FILE,
  ROUTE_MANIFEST_FILE,
  ROUTE_SPEC_FILE,
  fs,
} from '@modern-js/utils';

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

export function warmupRouteBundle(
  serverConf: ServerOptions['server'],
  distDir: string,
) {
  const { ssr: ssrConf } = serverConf;

  // only prepare Links when enable preload
  if (typeof ssrConf === 'object' && ssrConf.preload) {
    const nestedRoutesSpec = path.join(distDir, NESTED_ROUTE_SPEC_FILE);
    const routesJsonPath = path.join(distDir, ROUTE_SPEC_FILE);
    const routeManifestPath = path.join(distDir, ROUTE_MANIFEST_FILE);

    fs.existsSync(nestedRoutesSpec) && import(nestedRoutesSpec);

    fs.existsSync(routesJsonPath) && import(routesJsonPath);

    fs.existsSync(routeManifestPath) && import(routeManifestPath);
  }
}
