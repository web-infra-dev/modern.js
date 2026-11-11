import {
  getServiceUrl,
  type Manifest,
  type Stats,
} from '@module-federation/sdk';
import type { BridgeServiceCacheOptions } from '@module-federation/bridge-react/service-node';

export interface ServiceProviderOptions {
  /** Public HTTP origin. Development defaults to the actual Modern dev server. */
  origin?: string;
  /** Relative HTTP paths, keyed by expose (for example './App'). */
  paths?: Record<string, string>;
  /** Completed-render caching is disabled unless explicitly configured. */
  cache?: BridgeServiceCacheOptions;
}

export const SERVICE_PROVIDER_PATH = '_modern/mf/service/';

function exposePath(expose: { path?: string; name: string }): string {
  return expose.path ?? (expose.name === '.' ? '.' : `./${expose.name}`);
}

export function serviceProviderPath(expose: string): string {
  if (expose === '.' || expose === './') return `${SERVICE_PROVIDER_PATH}@root`;
  return `${SERVICE_PROVIDER_PATH}${encodeURIComponent(expose.replace(/^\.\//, ''))}`;
}

/** Every prefix is served. The first prefix is the canonical published URL. */
export function serviceProviderBasePaths(
  baseUrl?: string | string[],
): string[] {
  const values = Array.isArray(baseUrl) ? baseUrl : [baseUrl || '/'];
  if (!values.length) return ['/'];
  return [
    ...new Set(
      values.map(value => {
        if (!value.startsWith('/') || value.startsWith('//'))
          throw Error(
            'Service provider server.baseUrl must be an absolute URL path.',
          );
        const path = value.replace(/^\/+|\/+$/g, '');
        if (path) getServiceUrl('http://localhost/', path);
        return path ? `/${path}/` : '/';
      }),
    ),
  ];
}

export function serviceProviderOrigin(origin?: string): string {
  if (!origin)
    throw Error(
      'Service App requires moduleFederation.serviceProvider.origin in production.',
    );
  const url = new URL(origin);
  if (!['http:', 'https:'].includes(url.protocol) || url.origin !== origin)
    throw Error(
      'Service provider origin must be an HTTP or HTTPS origin without a path or credentials.',
    );
  return url.origin;
}

/** Called after Core detects isService, before the user's additionalData hook. */
export function addServiceProviderMetadata(
  stats: Stats,
  options: ServiceProviderOptions | undefined,
  baseUrl?: string | string[],
  developmentOrigin?: string,
): Stats {
  const services = stats.exposes.filter(expose => expose.isService);
  if (!services.length) return stats;
  const origin = serviceProviderOrigin(options?.origin || developmentOrigin);
  const paths = serviceProviderBasePaths(baseUrl);
  stats.metaData.serviceBaseUrl = `${origin}${paths[0]}`;
  const configuredPaths = options?.paths || {};
  for (const key of Object.keys(configuredPaths)) {
    if (!services.some(expose => exposePath(expose) === key))
      throw Error(
        `Service provider path '${key}' does not name an isService expose.`,
      );
  }
  const seen = new Set<string>();
  for (const expose of services) {
    const key = exposePath(expose);
    const servicePath = configuredPaths[key] ?? serviceProviderPath(key);
    getServiceUrl(stats.metaData.serviceBaseUrl, servicePath);
    if (seen.has(servicePath))
      throw Error(`Duplicate Service provider path '${servicePath}'.`);
    seen.add(servicePath);
    expose.servicePath = servicePath;
  }
  return stats;
}

/** Routes use the emitted metadata, including deliberate additionalData edits. */
export function serviceProviderRoutes(manifest: Manifest, basePaths: string[]) {
  const baseUrl = manifest.metaData.serviceBaseUrl;
  const services = manifest.exposes.filter(expose => 'servicePath' in expose);
  if (!services.length) return [];
  for (const expose of services) getServiceUrl(baseUrl, expose.servicePath!);
  const publishedBase = new URL(baseUrl!);
  const prefixes = [
    ...new Set(
      [publishedBase.pathname, ...basePaths].map(prefix =>
        prefix.endsWith('/') ? prefix : `${prefix}/`,
      ),
    ),
  ];
  const routes = services.flatMap(expose => {
    const key = exposePath(expose);
    return prefixes.map(prefix => ({
      path: new URL(
        getServiceUrl(`${publishedBase.origin}${prefix}`, expose.servicePath!),
      ).pathname,
      module:
        key === '.'
          ? manifest.name
          : `${manifest.name}/${key.replace(/^\.\//, '')}`,
    }));
  });
  const paths = new Set<string>();
  for (const route of routes) {
    if (paths.has(route.path))
      throw Error(`Duplicate Service provider route '${route.path}'.`);
    paths.add(route.path);
  }
  return routes;
}
