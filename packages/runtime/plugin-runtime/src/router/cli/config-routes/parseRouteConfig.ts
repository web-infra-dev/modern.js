import path from 'node:path';
import type { AppToolsContext } from '@modern-js/app-tools';
import type { Entrypoint, NestedRouteForCli } from '@modern-js/types';
import { fs, getMeta, logger } from '@modern-js/utils';

/**
 * Type definitions for config-based routing
 */

// Export type alias for backward compatibility
export type RouteConfig = NestedRouteForCli;

export type RouteFunction = {
  // form 1: (component, path?, children?)
  (component: string, path?: string, children?: RouteConfig[]): RouteConfig;
  // form 2: (component, children?)
  (component: string, children?: RouteConfig[]): RouteConfig;
};

export type LayoutFunction = {
  (component: string, path?: string, children?: RouteConfig[]): RouteConfig;
  (component: string, children?: RouteConfig[]): RouteConfig;
};

export type PageFunction = (component: string, path?: string) => RouteConfig;

export type WildcardFunction = (
  component: string,
  path?: string,
) => RouteConfig;

export interface RouteFunctions {
  route: RouteFunction;
  layout: LayoutFunction;
  page: PageFunction;
  $: WildcardFunction;
}

export type DefineRoutesFunction = (
  routesCallback: (
    routeFunctions: RouteFunctions,
    fileRoutes: RouteConfig[],
  ) => RouteConfig[],
) => (
  routeFunctions: RouteFunctions,
  fileRoutes: RouteConfig[],
) => RouteConfig[];

/**
 * Factory to create route functions with base path
 */
function createRouteFunctions(basePath: string): RouteFunctions {
  const resolveComponentPath = (component: string): string => {
    if (!component) return component;

    if (path.isAbsolute(component)) {
      return component;
    }

    if (
      component.startsWith('./') ||
      component.startsWith('../') ||
      !component.startsWith('@')
    ) {
      return path.resolve(basePath, component);
    }

    return component;
  };

  const createNestedRoute = (
    component: string,
    routePath?: string,
    children: NestedRouteForCli[] = [],
    routeType?: 'page' | 'layout',
    wildcard = false,
  ): NestedRouteForCli => {
    // Disallow alias paths like '@alias/...'
    if (typeof component === 'string' && component.startsWith('@')) {
      throw new Error(
        'component path must be absolute or relative; alias is not allowed',
      );
    }

    // Validate path parameter
    if (routePath !== undefined && typeof routePath !== 'string') {
      throw new Error('Route path must be a string');
    }

    const resolvedComponent = resolveComponentPath(component);

    // For page/wildcard routes, verify component existence when resolvable to a local file path
    if (routeType === 'page' || wildcard) {
      if (!component || component.trim() === '') {
        throw new Error('page route must specify a non-empty component path');
      }
      if (!fs.pathExistsSync(resolvedComponent)) {
        throw new Error(`page component not found: ${resolvedComponent}`);
      }
    }

    // Handle wildcard routes
    if (wildcard) {
      return {
        path: routePath || '*',
        component: resolvedComponent,
        routeType: 'page',
        origin: 'config',
        type: 'nested',
        children: children.length > 0 ? children : undefined,
      };
    }

    // Must specify a type
    if (!routeType) {
      throw new Error('createRouteConfig must specify route type');
    }

    return {
      path: routePath,
      component: resolvedComponent,
      routeType,
      origin: 'config',
      type: 'nested',
      children: children.length > 0 ? children : undefined,
    };
  };

  return {
    route: (
      component: string,
      pathOrChildren?: string | NestedRouteForCli[],
      maybeChildren?: NestedRouteForCli[],
    ) => {
      const path = Array.isArray(pathOrChildren) ? undefined : pathOrChildren;
      const children = Array.isArray(pathOrChildren)
        ? pathOrChildren
        : (maybeChildren ?? []);

      // Auto-detect type: layout when children exist, page otherwise
      const routeType = children.length > 0 ? 'layout' : 'page';
      return createNestedRoute(component, path, children, routeType);
    },

    layout: (
      component: string,
      pathOrChildren?: string | NestedRouteForCli[],
      maybeChildren?: NestedRouteForCli[],
    ) => {
      const path = Array.isArray(pathOrChildren) ? undefined : pathOrChildren;
      const children = Array.isArray(pathOrChildren)
        ? pathOrChildren
        : (maybeChildren ?? []);

      if (children.length === 0) {
        throw new Error('layout route must have children');
      }
      return createNestedRoute(component, path, children, 'layout');
    },

    page: (component: string, path?: string) => {
      return createNestedRoute(component, path, [], 'page');
    },

    $: (component: string, path?: string) => {
      return createNestedRoute(component, path, [], undefined, true);
    },
  };
}

export interface ConfigRouteFile {
  entryName: string;
  filePath: string;
  routes: NestedRouteForCli[];
  isMainEntry: boolean;
}

export async function findConfigRoutesFile(
  entrypoint: Entrypoint,
  appContext: AppToolsContext,
): Promise<string | null> {
  const { absoluteEntryDir } = entrypoint;
  if (!absoluteEntryDir) {
    return null;
  }

  const { metaName } = appContext;
  const meta = getMeta(metaName);

  const possibleNames = [
    `${meta}.routes.ts`,
    `${meta}.routes.mts`,
    `${meta}.routes.tsx`,
    `${meta}.routes.js`,
    `${meta}.routes.mjs`,
    `${meta}.routes.jsx`,
  ];

  for (const filename of possibleNames) {
    const filePath = path.resolve(absoluteEntryDir, filename);

    if (await fs.pathExists(filePath)) {
      const stats = await fs.stat(filePath);
      if (stats.isFile()) {
        logger.debug(`Found config routes file: ${filePath}`);
        return filePath;
      }
    }
  }

  return null;
}

export async function parseConfigRoutesFile(
  filePath: string,
  entrypoint: Entrypoint,
  fileRoutes?: NestedRouteForCli[],
): Promise<ConfigRouteFile> {
  const { loadTypeScriptFile } = await import('@modern-js/plugin/run');
  const configModule = await loadTypeScriptFile(filePath);

  if (!configModule.default || typeof configModule.default !== 'function') {
    throw new Error(
      `Config routes file must export a default function. Found: ${typeof configModule.default}`,
    );
  }

  const routeFunctions = createRouteFunctions(entrypoint.absoluteEntryDir!);

  let routesConfig: NestedRouteForCli[];

  if (!fileRoutes) {
    throw new Error(
      `Routes function expects file routes parameter, but none provided`,
    );
  }
  routesConfig = configModule.default(routeFunctions, fileRoutes);

  if (!Array.isArray(routesConfig)) {
    throw new Error(
      `Config routes function must return an array of routes. Received: ${typeof routesConfig}`,
    );
  }

  return {
    entryName: entrypoint.entryName,
    filePath,
    routes: routesConfig,
    isMainEntry: entrypoint.isMainEntry || false,
  };
}

export async function discoverAndParseConfigRoutes(
  entrypoint: Entrypoint,
  appContext: AppToolsContext,
  fileRoutes?: NestedRouteForCli[],
): Promise<ConfigRouteFile | null> {
  const configFilePath = await findConfigRoutesFile(entrypoint, appContext);

  if (!configFilePath) {
    logger.debug(
      `No config routes file found for entry: ${entrypoint.entryName}`,
    );
    return null;
  }

  const configRouteFile = await parseConfigRoutesFile(
    configFilePath,
    entrypoint,
    fileRoutes,
  );

  logger.debug(`Successfully loaded config routes from: ${configFilePath}`);
  logger.debug(
    `Found ${configRouteFile.routes.length} route(s) for entry: ${entrypoint.entryName}`,
  );

  return configRouteFile;
}
