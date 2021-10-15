import path from 'path';
import { ModernRoute } from '@modern-js/server';
import { ROUTE_SPEC_FILE, fs } from '@modern-js/utils';
import { SSGConfig, SsgRoute } from '../types';
import { MODE } from '@/manifest-op';

export function formatOutput(base: string, filename: string) {
  const file = path.extname(filename) ? filename : `${filename}/index.html`;
  const dirname = path.dirname(base);
  return path.join(dirname, file);
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

      // this should never happend
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
  const prefix = `${base}/${entryName}`;
  return prefix.endsWith('/') ? prefix.slice(0, -1) : prefix;
}

// if no output, return default path for aggred-route(relative),
// or thorw error for control-route
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

export const getSSGRenderLevel = (key: boolean | string) => {
  const level = typeof key === 'boolean' ? MODE.LOOSE : MODE[key.toUpperCase()];
  // currently only MODE.STRICT and MODE.LOOSE are supported
  if (!level || level > 2 || level < 1) {
    throw new Error(
      `[SSG Render Fail] SSG 不支持当前 Mode，useSSG: ${key.toString()}, Level: ${level}`,
    );
  }

  return level;
};

export const parsedSSGConfig = (ssg: SSGConfig) => {
  const useSSG = Boolean(ssg);
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  const userHook = typeof ssg === 'function' ? ssg : () => {};
  return { useSSG, userHook };
};

export const replaceWithAlias = (
  base: string,
  filePath: string,
  alias: string,
) => path.join(alias, path.relative(base, filePath));
