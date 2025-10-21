import path from 'node:path';
import type { NestedRouteForCli } from '@modern-js/types';
import { fs, logger, normalizeToPosixPath } from '@modern-js/utils';
import { getRouteId } from '../code/nestedRoutes';
import { getPathWithoutExt, replaceWithAlias } from '../code/utils';

/**
 * Process config-based routes: generate route id, normalize paths and discover related files.
 * Data structure is unified to NestedRouteForCli, only metadata needs to be enriched.
 */
export async function processConfigRoutes(
  configRoutes: NestedRouteForCli[],
  entryName: string,
  isMainEntry: boolean,
  configRoutesDir: string,
  alias?: {
    name: string;
    basename: string;
  },
): Promise<NestedRouteForCli[]> {
  return Promise.all(
    configRoutes.map(configRoute =>
      processConfigRoute(
        configRoute,
        entryName,
        isMainEntry,
        configRoutesDir,
        alias,
      ),
    ),
  );
}

/**
 * Normalize and enrich a single route produced by config-based routing.
 * Applies metadata and resolves component paths; recurses into children.
 *
 * What it does:
 * - Generates id (via getRouteId) when missing
 * - Sets type 'nested' and origin 'config'; defaults empty path to ''
 * - Resolves absolute component path, applies alias, stores in `_component`
 * - Recursively processes children (works with mixed config/convention routes)
 * - For page routes: sets `index=true` and removes `path` when path is '' or '/'
 * - Discovers related files (.data.ts, .data.client.ts, .error.tsx, .loading.tsx, .config.ts, .action.ts)
 *   and attaches normalized paths to the route
 *
 * For non-config routes (origin !== 'config'): returns route untouched except children are processed.
 */
async function processConfigRoute(
  configRoute: NestedRouteForCli,
  entryName: string,
  isMainEntry: boolean,
  configRoutesDir: string,
  alias?: {
    name: string;
    basename: string;
  },
): Promise<NestedRouteForCli> {
  if (configRoute.origin !== 'config') {
    if (configRoute.children && configRoute.children.length > 0) {
      const processedChildren = (await Promise.all(
        configRoute.children.map(child =>
          processConfigRoute(
            child,
            entryName,
            isMainEntry,
            configRoutesDir,
            alias,
          ),
        ),
      )) as NestedRouteForCli[];

      // Return new route object with processed children for convention routes
      return {
        ...configRoute,
        children: processedChildren,
      };
    }
    return configRoute;
  }

  // Process config routes
  const componentPath = configRoute.component;
  const absoluteComponentPath = componentPath
    ? path.isAbsolute(componentPath)
      ? componentPath
      : path.resolve(configRoutesDir, componentPath)
    : undefined;

  const routeId =
    configRoute.id ||
    getRouteId(componentPath!, configRoutesDir, entryName, isMainEntry);

  const processedRoute: NestedRouteForCli = {
    ...configRoute,
    id: routeId,
    path: configRoute.path ?? '',
    type: 'nested',
    origin: 'config',
  };

  if (absoluteComponentPath) {
    // Use alias path like file-system routes do
    const componentPathWithAlias = alias
      ? getPathWithoutExt(
          replaceWithAlias(alias.basename, absoluteComponentPath, alias.name),
        )
      : getPathWithoutExt(absoluteComponentPath);

    processedRoute._component = componentPathWithAlias;
  }

  // Process children recursively (handles mixed config and convention routes)
  if (configRoute.children && configRoute.children.length > 0) {
    const processedChildren = (await Promise.all(
      configRoute.children.map(child =>
        processConfigRoute(
          child,
          entryName,
          isMainEntry,
          configRoutesDir,
          alias,
        ),
      ),
    )) as NestedRouteForCli[];

    processedRoute.children = processedChildren;
  }

  // Handle index for page routes
  if (
    configRoute.routeType === 'page' ||
    (!configRoute.routeType && !configRoute.children)
  ) {
    // Treat normalized empty path (e.g. '/', '///') as index route
    const rawPath = configRoute.path;
    const isIndexPath =
      rawPath === '' ||
      rawPath === '/' ||
      (typeof rawPath === 'string' && rawPath.replace(/^\/+/, '') === '');
    if (isIndexPath) {
      processedRoute.index = true;
      delete processedRoute.path;
    }
  }

  // Discover related files (config routes only)
  if (absoluteComponentPath) {
    await discoverRelatedFiles(processedRoute, absoluteComponentPath, alias);
  }

  return processedRoute;
}

/**
 * Discover related files for a config-based route (data, error, loading, etc.).
 * Only config-based routes need file discovery; convention routes already have this info during walk.
 */
async function discoverRelatedFiles(
  nestedRoute: NestedRouteForCli,
  componentPath: string,
  alias?: {
    name: string;
    basename: string;
  },
): Promise<void> {
  // Only config-based routes need file discovery
  if (nestedRoute.origin !== 'config') {
    return;
  }

  const componentDir = path.dirname(componentPath);
  const componentName = path.basename(
    componentPath,
    path.extname(componentPath),
  );

  // Possible related file names
  const relatedFiles = {
    data: `${componentName}.data.ts`,
    clientData: `${componentName}.data.client.ts`,
    error: `${componentName}.error.tsx`,
    loading: `${componentName}.loading.tsx`,
    config: `${componentName}.config.ts`,
  };

  // Check file existence asynchronously
  await Promise.all(
    Object.entries(relatedFiles).map(async ([key, filename]) => {
      const filePath = path.resolve(componentDir, filename);
      try {
        if (
          await fs.promises
            .stat(filePath)
            .then(stat => stat.isFile())
            .catch(() => false)
        ) {
          const aliasedPath = alias
            ? replaceWithAlias(alias.basename, filePath, alias.name)
            : filePath;
          (nestedRoute as any)[key] = normalizeToPosixPath(aliasedPath);
        }
      } catch (e) {
        // Ignore
      }
    }),
  );
}

/**
 * Remove all `component` fields from a routes tree
 * @param generatedRoutes - generated routes array
 * @returns routes with `component` field removed
 */
export function normalizeRoutes(
  generatedRoutes: NestedRouteForCli[],
): NestedRouteForCli[] {
  return generatedRoutes.map(route => normalizeRoute(route));
}

/**
 * Recursively remove `component` field from a single route and its children
 * @param route - route to process
 * @returns processed route with `component` removed
 */
function normalizeRoute(route: NestedRouteForCli): NestedRouteForCli {
  // Use destructuring to create a new object without the component field
  const { component, ...rest } = route as any;

  // Recursively process children
  const processedRoute = {
    ...rest,
    ...(route.children && route.children.length > 0
      ? {
          children: route.children.map(child => normalizeRoute(child)),
        }
      : {}),
  };

  return processedRoute as NestedRouteForCli;
}
