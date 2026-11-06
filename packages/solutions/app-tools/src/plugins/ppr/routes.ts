import type { AppToolsNormalizedConfig } from '../../types';

interface NestedRouteSpec {
  path?: string;
  index?: boolean;
  children?: NestedRouteSpec[];
}

export function getSSRModeOfEntry(
  config: AppToolsNormalizedConfig,
  entryName: string,
) {
  const ssr = config.server?.ssrByEntries?.[entryName] ?? config.server?.ssr;
  return ssr && typeof ssr === 'object' ? ssr.mode : undefined;
}

function isDynamicSegment(segment: string) {
  return (
    segment.startsWith(':') || segment.includes('*') || segment.endsWith('?')
  );
}

function joinPath(...parts: (string | undefined)[]) {
  const joined = parts
    .filter(Boolean)
    .join('/')
    .replace(/\/{2,}/g, '/');
  const withLeading = joined.startsWith('/') ? joined : `/${joined}`;
  return withLeading.length > 1 ? withLeading.replace(/\/$/, '') : withLeading;
}

/**
 * Pathnames of the pages an entry renders without route params: index routes
 * and leaf routes whose path has no dynamic segment.
 */
export function getStaticPaths(
  entryUrlPath: string,
  routes: NestedRouteSpec[],
): string[] {
  const paths = new Set<string>();

  const visit = (route: NestedRouteSpec, parentPath: string) => {
    const segments = (route.path || '').split('/').filter(Boolean);
    if (segments.some(isDynamicSegment)) {
      return;
    }
    const routePath = joinPath(parentPath, route.path);
    if (route.index || !route.children?.length) {
      paths.add(routePath);
    }
    route.children?.forEach(child => visit(child, routePath));
  };

  routes.forEach(route => visit(route, entryUrlPath));
  return Array.from(paths);
}
