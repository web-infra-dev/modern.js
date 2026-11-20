import path from 'path';
import type { ServerUserConfig } from '@modern-js/app-tools';
import type { ServerRoute as ModernRoute } from '@modern-js/types';
import {
  fs,
  ROUTE_SPEC_FILE,
  SERVER_BUNDLE_DIRECTORY,
  getSSGEntryOptions,
  isEmpty,
} from '@modern-js/utils';
import type {
  AgreedRoute,
  EntryPoint,
  SSGConfig,
  SSGMultiEntryOptions,
  SsgRoute,
} from '../types';

export function formatOutput(filename: string) {
  const outputPath = path.extname(filename)
    ? filename
    : `${filename}/index.html`;
  return outputPath;
}

export function formatPath(str: string) {
  let addr = str;
  if (!addr || typeof addr !== 'string') {
    return addr;
  }
  if (addr.startsWith('.')) {
    addr = addr.slice(1);
  }
  if (!addr.startsWith('/')) {
    addr = `/${addr}`;
  }
  if (addr.endsWith('/') && addr !== '/') {
    addr = addr.slice(0, addr.length - 1);
  }

  return addr;
}

export function isDynamicUrl(url: string): boolean {
  return url.includes(':') || url.endsWith('*');
}

export function getUrlPrefix(route: SsgRoute, baseUrl: string | string[]) {
  let base = '';
  if (Array.isArray(baseUrl)) {
    const filters = baseUrl.filter(url => route.urlPath.includes(url));
    if (filters.length > 1) {
      const matched = filters.sort((a, b) => a.length - b.length)[0];

      // this should never happened
      if (!matched) {
        throw new Error('');
      }
      base = matched;
    }
  } else {
    base = baseUrl;
  }

  base = base === '/' ? '' : base;
  const entryName = route.entryName === 'main' ? '' : route.entryName;
  const prefix = `${base}/${entryName as string}`;
  return prefix.endsWith('/') ? prefix.slice(0, -1) : prefix;
}

// if no output, return default path for aggred-route(relative),
// or throw error for control-route
export function getOutput(route: SsgRoute, base: string, agreed?: boolean) {
  const { output } = route;
  if (output) {
    return output;
  }

  if (agreed) {
    const urlWithoutBase = route.urlPath.replace(base, '');
    return urlWithoutBase.startsWith('/')
      ? urlWithoutBase.slice(1)
      : urlWithoutBase;
  }

  throw new Error(
    `routing must provide output when calling createPage(), check ${route.urlPath}`,
  );
}

export const readJSONSpec = (dir: string) => {
  const routeJSONPath = path.join(dir, ROUTE_SPEC_FILE);
  const routeJSON: {
    routes: ModernRoute[];
  } = require(routeJSONPath);
  const { routes } = routeJSON;
  return routes;
};

export const writeJSONSpec = (dir: string, routes: ModernRoute[]) => {
  const routeJSONPath = path.join(dir, ROUTE_SPEC_FILE);
  fs.writeJSONSync(routeJSONPath, { routes }, { spaces: 2 });
};

export const replaceWithAlias = (
  base: string,
  filePath: string,
  alias: string,
) => path.posix.join(alias, path.posix.relative(base, filePath));

export const standardOptions = (
  ssgOptions: SSGConfig,
  entrypoints: EntryPoint[],
  routes: ModernRoute[],
  server: ServerUserConfig,
  ssgByEntries?: SSGMultiEntryOptions,
) => {
  if (ssgOptions === false && (!ssgByEntries || isEmpty(ssgByEntries))) {
    return false;
  }

  const result: SSGMultiEntryOptions = {};
  for (const [name, configured] of Object.entries(ssgByEntries ?? {})) {
    if (typeof configured !== 'function') {
      result[name] = configured;
    }
  }

  for (const { entryName } of entrypoints) {
    const configured = getSSGEntryOptions(entryName, ssgOptions, ssgByEntries);
    if (typeof configured !== 'function') {
      if (configured !== undefined) {
        result[entryName] = configured;
      }
      continue;
    }

    const baseUrl = server?.baseUrl;
    if (Array.isArray(baseUrl)) {
      const routesForEntry = routes.filter(
        route => route.entryName === entryName,
      );
      for (const prefix of baseUrl) {
        for (const route of routesForEntry) {
          if (
            typeof route.urlPath === 'string' &&
            route.urlPath.startsWith(prefix)
          ) {
            result[route.urlPath] = configured(entryName, { baseUrl: prefix });
          }
        }
      }
    } else {
      result[entryName] = configured(entryName, { baseUrl });
    }
  }
  return result;
};

export const openRouteSSR = (routes: ModernRoute[], entries: string[] = []) =>
  routes.map(ssgRoute => ({
    ...ssgRoute,
    isSSR: entries.includes(ssgRoute.entryName!),
    bundle: `${SERVER_BUNDLE_DIRECTORY}/${ssgRoute.entryName as string}.js`,
  }));

// TODO: 过滤带有 server loader 的路由
export const flattenRoutes = (routes: AgreedRoute[]): AgreedRoute[] => {
  const parents: AgreedRoute[] = [];
  const newRoutes: AgreedRoute[] = [];

  const traverseRoute = (route: AgreedRoute) => {
    const parent = parents[parents.length - 1];
    let path = parent
      ? `${parent.path}/${route.path || ''}`.replace(/\/+/g, '/')
      : route.path || ''; // If the route is an index route, the route has no path property
    path = path.replace(/\/$/, '');

    // If the route path is / and is not the root route, it should not be used as an ssg route
    if (route._component && (path !== '/' || (path === '/' && !parent))) {
      newRoutes.push({
        ...route,
        path,
      });
    }
    if (route.children) {
      parents.push({
        ...route,
        path,
      });
      route.children.forEach(traverseRoute);
      parents.pop();
    }
  };
  routes.forEach(traverseRoute);
  return newRoutes;
};

export function selectRoutesForSSG(routes: AgreedRoute[]): AgreedRoute[] {
  const routesByPath = new Map<string, AgreedRoute>();
  const isPage = (route: AgreedRoute) =>
    route.routeType === 'page' || route.index === true;

  for (const route of routes) {
    const pathname = route.path || '/';
    const selected = routesByPath.get(pathname);
    // An index page takes precedence over its layout. Preserve the first page
    // so a later pathless sibling cannot replace the page matched by the router.
    if (!selected || (!isPage(selected) && isPage(route))) {
      routesByPath.set(pathname, route);
    }
  }

  return [...routesByPath.values()];
}

export function chunkArray<T>(arr: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}
