import { matchRoutes, type RouteObject } from '@modern-js/runtime-utils/router';
import { addBasename, normalizeBasename } from '../location';
import { ApplicationsDiscoveryError } from './errors';
import type { ApplicationRef, RemoteRoute } from './types';

export function normalizeRoutePattern(route: string): string {
  const trimmed = route.trim();
  if (!trimmed || trimmed === '/') return '';
  return trimmed.replace(/^\/+/, '');
}

export function normalizeExposePath(expose: string): string {
  const trimmed = expose.trim();
  if (!trimmed || trimmed === '.') return '.';
  return trimmed.startsWith('./')
    ? trimmed
    : `./${trimmed.replace(/^\/+/, '')}`;
}

export function composeRemoteId(moduleName: string, expose: string): string {
  const normalized = normalizeExposePath(expose);
  if (normalized === '.') return moduleName;
  return `${moduleName}/${normalized.slice(2)}`;
}

export function isUrlLike(value: string): boolean {
  return (
    /^https?:\/\//i.test(value) ||
    value.startsWith('//') ||
    value.startsWith('/')
  );
}

export function deriveMountId(
  parentMountId: string | undefined,
  matchedBasename: string,
  moduleName: string,
  expose: string,
): string {
  const parent = parentMountId || 'root';
  const base = normalizeBasename(matchedBasename);
  const normalizedExpose = normalizeExposePath(expose);
  return `${parent}::${base}::${moduleName}::${normalizedExpose}`;
}

export function validateRemoteRoutes(
  rawRoutes: unknown,
  consumer: ApplicationRef | null,
  mountId: string,
  target?: string,
): RemoteRoute[] {
  if (!Array.isArray(rawRoutes)) {
    throw new ApplicationsDiscoveryError(
      'Application discovery load() must return a routes array.',
      { code: 'INVALID_RESULT', consumer, mountId, target },
    );
  }
  const validated: RemoteRoute[] = [];
  const moduleVersions = new Map<string, string>();
  const seenRoutes = new Set<string>();

  for (const item of rawRoutes) {
    if (!item || typeof item !== 'object') {
      throw new ApplicationsDiscoveryError(
        'Each discovered RemoteRoute must be an object.',
        { code: 'INVALID_ROUTE', consumer, mountId, target },
      );
    }
    const candidate = item as Record<string, unknown>;
    if (typeof candidate.route !== 'string' || !candidate.route.trim()) {
      throw new ApplicationsDiscoveryError(
        'Discovered RemoteRoute requires a non-empty route string.',
        { code: 'INVALID_ROUTE', consumer, mountId, target },
      );
    }
    if (
      typeof candidate.moduleName !== 'string' ||
      !candidate.moduleName.trim()
    ) {
      throw new ApplicationsDiscoveryError(
        `Discovered route "${candidate.route}" requires a non-empty moduleName.`,
        { code: 'INVALID_ROUTE', consumer, mountId, target },
      );
    }
    if (typeof candidate.expose !== 'string' || !candidate.expose.trim()) {
      throw new ApplicationsDiscoveryError(
        `Discovered route "${candidate.route}" requires a non-empty expose.`,
        { code: 'INVALID_ROUTE', consumer, mountId, target },
      );
    }
    if (
      typeof candidate.versionOrUrl !== 'string' ||
      !candidate.versionOrUrl.trim()
    ) {
      throw new ApplicationsDiscoveryError(
        `Discovered route "${candidate.route}" requires a non-empty versionOrUrl.`,
        { code: 'INVALID_ROUTE', consumer, mountId, target },
      );
    }
    if (typeof candidate.discoverChildren !== 'boolean') {
      throw new ApplicationsDiscoveryError(
        `Discovered route "${candidate.route}" for module "${candidate.moduleName}" must explicitly declare boolean discoverChildren.`,
        { code: 'MISSING_DISCOVER_CHILDREN', consumer, mountId, target },
      );
    }
    if (
      candidate.props !== undefined &&
      (candidate.props === null ||
        typeof candidate.props !== 'object' ||
        Array.isArray(candidate.props))
    ) {
      throw new ApplicationsDiscoveryError(
        `Discovered route "${candidate.route}" props must be a plain object.`,
        { code: 'INVALID_ROUTE', consumer, mountId, target },
      );
    }

    const normalizedPattern = normalizeRoutePattern(candidate.route);
    if (seenRoutes.has(normalizedPattern)) {
      throw new ApplicationsDiscoveryError(
        `Duplicate discovered route pattern "${candidate.route}" in mount "${mountId}".`,
        { code: 'INVALID_ROUTE', consumer, mountId, target },
      );
    }
    seenRoutes.add(normalizedPattern);

    const moduleName = candidate.moduleName.trim();
    const versionOrUrl = candidate.versionOrUrl.trim();
    const existingVersion = moduleVersions.get(moduleName);
    if (existingVersion && existingVersion !== versionOrUrl) {
      throw new ApplicationsDiscoveryError(
        `Module "${moduleName}" has conflicting versions ("${existingVersion}" vs "${versionOrUrl}") within the same consumer.`,
        { code: 'MODULE_CONFLICT', consumer, mountId, target },
      );
    }
    moduleVersions.set(moduleName, versionOrUrl);

    validated.push({
      route: candidate.route.trim(),
      moduleName,
      expose: normalizeExposePath(candidate.expose),
      versionOrUrl,
      discoverChildren: candidate.discoverChildren,
      ...(candidate.props
        ? { props: { ...(candidate.props as Record<string, unknown>) } }
        : {}),
    });
  }

  return validated;
}

export interface DynamicRouteMatch {
  route: RemoteRoute;
  matchedBasename: string;
}

/**
 * Match target pathname against candidate routes using React Router's real
 * route matching semantics (never prefix `startsWith`).
 */
export function matchDynamicRoute(
  routes: readonly RemoteRoute[],
  pathname: string,
  basename: string,
): DynamicRouteMatch | undefined {
  if (!routes.length) return undefined;
  const normalizedBase = normalizeBasename(basename);
  const routeObjects: RouteObject[] = routes.map((item, index) => ({
    id: `dyn-${index}`,
    path: normalizeRoutePattern(item.route) || '/',
  }));
  const matches = matchRoutes(
    routeObjects,
    { pathname },
    normalizedBase === '/' ? undefined : normalizedBase,
  );
  if (!matches?.length) return undefined;
  const leaf = matches[matches.length - 1];
  const index = Number(leaf.route.id?.replace(/^dyn-/, ''));
  const route = routes[index];
  if (!route) return undefined;
  const matchedBasename = normalizeBasename(
    addBasename(leaf.pathnameBase || '/', normalizedBase),
  );
  return { route, matchedBasename };
}
