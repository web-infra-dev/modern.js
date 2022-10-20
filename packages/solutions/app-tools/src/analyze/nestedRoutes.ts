import * as path from 'path';
import { fs, normalizeToPosixPath } from '@modern-js/utils';
import type { NestedRoute } from '@modern-js/types';
import { JS_EXTENSIONS } from './constants';
import { replaceWithAlias } from './utils';

const LAYOUT_FILE = 'layout';
const PAGE_FILE = 'page';
const LOADING_FILE = 'loading';
const ERROR_FILE = 'error';

const conventionNames = [LAYOUT_FILE, PAGE_FILE, LOADING_FILE, ERROR_FILE];

const getPathWithoutExt = (filename: string) => {
  const extname = path.extname(filename);
  return filename.slice(0, -extname.length);
};

const getRouteId = (componentPath: string, routesDir: string) => {
  const relativePath = normalizeToPosixPath(
    path.relative(routesDir, componentPath),
  );
  const id = getPathWithoutExt(relativePath);
  return id;
};

const replaceDynamicPath = (routePath: string) => {
  return routePath.replace(/\[(.*?)\]/, ':$1');
};

const createIndexRoute = (
  routeInfo: Omit<NestedRoute, 'type'>,
  rootDir: string,
  filename: string,
): NestedRoute => {
  return createRoute(
    {
      ...routeInfo,
      index: true,
      children: undefined,
    },
    rootDir,
    filename,
  );
};

const createRoute = (
  routeInfo: Omit<NestedRoute, 'type'>,
  rootDir: string,
  filename: string,
): NestedRoute => {
  const id = getRouteId(filename, rootDir);
  return {
    ...routeInfo,
    id,
    type: 'nested',
  };
};

export const walk = async (
  dirname: string,
  rootDir: string,
  alias: {
    name: string;
    basename: string;
  },
): Promise<NestedRoute | null> => {
  if (!(await fs.pathExists(dirname))) {
    return null;
  }
  const isDirectory = (await fs.stat(dirname)).isDirectory();
  if (!isDirectory) {
    return null;
  }

  const relativeDir = path.relative(rootDir, dirname);
  const pathSegments = relativeDir.split(path.sep);
  const lastSegment = pathSegments[pathSegments.length - 1];
  const isRoot = lastSegment === '';
  const isPathlessLayout = lastSegment.startsWith('__');
  const isWithoutLayoutPath = lastSegment.includes('.');
  let routePath = isRoot || isPathlessLayout ? '/' : `${lastSegment}`;
  if (isWithoutLayoutPath) {
    routePath = lastSegment.split('.').join('/');
  }
  routePath = replaceDynamicPath(routePath);

  const route: Partial<NestedRoute> = {
    path: routePath,
    children: [],
  };

  const items = await fs.readdir(dirname);
  for (const item of items) {
    const itemPath = path.join(dirname, item);
    const extname = path.extname(item);
    const itemWithoutExt = item.slice(0, -extname.length);

    const isDirectory = (await fs.stat(itemPath)).isDirectory();

    if (isDirectory) {
      const childRoute = await walk(itemPath, rootDir, alias);
      if (childRoute) {
        route.children?.push(childRoute);
      }
    }

    if (
      extname &&
      (!JS_EXTENSIONS.includes(extname) ||
        !conventionNames.includes(itemWithoutExt))
    ) {
      continue;
    }

    if (itemWithoutExt === LAYOUT_FILE) {
      route._component = replaceWithAlias(alias.basename, itemPath, alias.name);
    }

    if (itemWithoutExt === PAGE_FILE) {
      const childRoute = createIndexRoute(
        {
          _component: replaceWithAlias(alias.basename, itemPath, alias.name),
        } as NestedRoute,
        rootDir,
        itemPath,
      );
      route.children?.push(childRoute);
    }

    if (itemWithoutExt === LOADING_FILE) {
      route.loading = replaceWithAlias(alias.basename, itemPath, alias.name);
    }

    if (itemWithoutExt === ERROR_FILE) {
      route.error = replaceWithAlias(alias.basename, itemPath, alias.name);
    }
  }

  const finalRoute = createRoute(
    route,
    rootDir,
    path.join(dirname, `${LAYOUT_FILE}.ts`),
  );

  /**
   * when the url is /, the __auth/layout.tsx component should not be rendered
   * - routes
   *  - __auth
   *    - layout.tsx
   *  - layout.tsx
   */
  if (isPathlessLayout) {
    delete finalRoute.path;
  }

  return finalRoute;
};
