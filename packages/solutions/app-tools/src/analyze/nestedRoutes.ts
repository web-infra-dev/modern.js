import * as path from 'path';
import { fs, getRouteId } from '@modern-js/utils';
import type { NestedRoute } from '@modern-js/types';
import { JS_EXTENSIONS, NESTED_ROUTE } from './constants';
import { replaceWithAlias } from './utils';

const conventionNames = Object.values(NESTED_ROUTE);

const replaceDynamicPath = (routePath: string) => {
  return routePath.replace(/\[(.*?)\]/g, ':$1');
};

const createIndexRoute = (
  routeInfo: Omit<NestedRoute, 'type'>,
  rootDir: string,
  filename: string,
  entryName: string,
): NestedRoute => {
  return createRoute(
    {
      ...routeInfo,
      index: true,
      children: undefined,
    },
    rootDir,
    filename,
    entryName,
  );
};

const createRoute = (
  routeInfo: Omit<NestedRoute, 'type'>,
  rootDir: string,
  filename: string,
  entryName: string,
): NestedRoute => {
  const id = getRouteId(filename, rootDir, entryName);
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
  entryName: string,
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
    isRoot,
  };

  let pageLoaderFile = '';
  let pageRoute = null;

  const items = await fs.readdir(dirname);

  for (const item of items) {
    const itemPath = path.join(dirname, item);
    const extname = path.extname(item);
    const itemWithoutExt = item.slice(0, -extname.length);

    const isDirectory = (await fs.stat(itemPath)).isDirectory();

    if (isDirectory) {
      const childRoute = await walk(itemPath, rootDir, alias, entryName);
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

    if (itemWithoutExt === NESTED_ROUTE.LAYOUT_LOADER_FILE) {
      if (!route.loader) {
        route.loader = itemPath;
      }
    }

    if (itemWithoutExt === NESTED_ROUTE.LAYOUT_FILE) {
      route._component = replaceWithAlias(alias.basename, itemPath, alias.name);
    }

    if (itemWithoutExt === NESTED_ROUTE.PAGE_LOADER_FILE) {
      pageLoaderFile = itemPath;
    }

    if (itemWithoutExt === NESTED_ROUTE.PAGE_FILE) {
      pageRoute = createIndexRoute(
        {
          _component: replaceWithAlias(alias.basename, itemPath, alias.name),
        } as NestedRoute,
        rootDir,
        itemPath,
        entryName,
      );

      if (pageLoaderFile) {
        pageRoute.loader = pageLoaderFile;
      }
      route.children?.push(pageRoute);
    }

    if (itemWithoutExt === NESTED_ROUTE.SPLATE_FILE) {
      const splatRoute = createRoute(
        {
          _component: replaceWithAlias(alias.basename, itemPath, alias.name),
          path: '*',
        },
        rootDir,
        itemPath,
        entryName,
      );
      route.children?.push(splatRoute);
    }

    if (itemWithoutExt === NESTED_ROUTE.LOADING_FILE) {
      route.loading = replaceWithAlias(alias.basename, itemPath, alias.name);
    }

    if (itemWithoutExt === NESTED_ROUTE.ERROR_FILE) {
      route.error = replaceWithAlias(alias.basename, itemPath, alias.name);
    }
  }

  const finalRoute = createRoute(
    route,
    rootDir,
    path.join(dirname, `${NESTED_ROUTE.LAYOUT_FILE}.ts`),
    entryName,
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

  route.children = route.children?.filter(childRoute => childRoute);

  if (route.children && route.children.length === 0 && !route.index) {
    return null;
  }

  return finalRoute;
};
