import path from 'path';
import {
  ROUTE_SPEC_FILE,
  fs,
  isSingleEntry,
  SERVER_BUNDLE_DIRECTORY,
} from '@modern-js/utils';
import { ServerRoute as ModernRoute } from '@modern-js/types';
import {
  SsgRoute,
  SSGConfig,
  EntryPoint,
  SSGMultiEntryOptions,
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
  return url.includes(':');
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
) => {
  if (ssgOptions === false) {
    return false;
  }

  if (ssgOptions === true) {
    return entrypoints.reduce((opt, entry) => {
      opt[entry.entryName] = ssgOptions;
      return opt;
    }, {} as SSGMultiEntryOptions);
  } else if (typeof ssgOptions === 'object') {
    const isSingle = isSingleEntry(entrypoints);

    if (isSingle && typeof (ssgOptions as any).main === 'undefined') {
      return { main: ssgOptions } as SSGMultiEntryOptions;
    } else {
      return ssgOptions as SSGMultiEntryOptions;
    }
  } else if (typeof ssgOptions === 'function') {
    const intermediateOptions: SSGMultiEntryOptions = {};
    for (const entrypoint of entrypoints) {
      const { entryName } = entrypoint;
      // Todo may be async function
      intermediateOptions[entryName] = ssgOptions(entryName);
    }
    return intermediateOptions;
  }

  return false;
};

export const openRouteSSR = (routes: ModernRoute[], entries: string[] = []) =>
  routes.map(ssgRoute => ({
    ...ssgRoute,
    isSSR: entries.includes(ssgRoute.entryName!),
    bundle: `${SERVER_BUNDLE_DIRECTORY}/${ssgRoute.entryName as string}.js`,
  }));
