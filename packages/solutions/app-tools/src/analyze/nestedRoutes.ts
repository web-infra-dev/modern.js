import * as path from 'path';
import { fs, normalizeToPosixPath } from '@modern-js/utils';
import type { NestedRouteForCli } from '@modern-js/types';
import { JS_EXTENSIONS, NESTED_ROUTE } from './constants';
import { replaceWithAlias } from './utils';

const conventionNames = Object.values(NESTED_ROUTE);

const replaceDynamicPath = (routePath: string) => {
  return routePath.replace(/\[(.*?)\]/g, ':$1');
};

const getPathWithoutExt = (filename: string) => {
  const extname = path.extname(filename);
  return filename.slice(0, -extname.length);
};

export const getRouteId = (
  componentPath: string,
  routesDir: string,
  entryName: string,
  isMainEntry: boolean,
) => {
  const relativePath = normalizeToPosixPath(
    path.relative(routesDir, componentPath),
  );
  const pathWithoutExt = getPathWithoutExt(relativePath);
  let id = ``;
  if (isMainEntry) {
    id = pathWithoutExt;
  } else {
    id = `${entryName}_${pathWithoutExt}`;
  }

  return id.replace(/\[(.*?)\]/g, '($1)');
};

const createIndexRoute = (
  routeInfo: Omit<NestedRouteForCli, 'type'>,
  rootDir: string,
  filename: string,
  entryName: string,
  isMainEntry: boolean,
): NestedRouteForCli => {
  return createRoute(
    {
      ...routeInfo,
      index: true,
      children: undefined,
    },
    rootDir,
    filename,
    entryName,
    isMainEntry,
  );
};

const createRoute = (
  routeInfo: Omit<NestedRouteForCli, 'type'>,
  rootDir: string,
  filename: string,
  entryName: string,
  isMainEntry: boolean,
): NestedRouteForCli => {
  const id = getRouteId(filename, rootDir, entryName, isMainEntry);
  return {
    ...routeInfo,
    id,
    type: 'nested',
  };
};

// eslint-disable-next-line complexity
export const walk = async (
  dirname: string,
  rootDir: string,
  alias: {
    name: string;
    basename: string;
  },
  entryName: string,
  isMainEntry: boolean,
): Promise<NestedRouteForCli | null> => {
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

  const route: Partial<NestedRouteForCli> = {
    path: routePath?.replace(/\$$/, '?'),
    children: [],
    isRoot,
  };

  let pageLoaderFile = '';
  let pageRoute = null;
  let splatLoaderFile = '';
  let splatRoute = null;
  let pageConfigFile = '';

  const items = await fs.readdir(dirname);

  for (const item of items) {
    const itemPath = path.join(dirname, item);
    const extname = path.extname(item);
    const itemWithoutExt = item.slice(0, -extname.length);

    const isDirectory = (await fs.stat(itemPath)).isDirectory();

    if (isDirectory) {
      const childRoute = await walk(
        itemPath,
        rootDir,
        alias,
        entryName,
        isMainEntry,
      );
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

    if (itemWithoutExt === NESTED_ROUTE.LAYOUT_CONFIG_FILE) {
      if (!route.config) {
        route.config = itemPath;
      }
    }

    if (itemWithoutExt === NESTED_ROUTE.LAYOUT_FILE) {
      route._component = replaceWithAlias(alias.basename, itemPath, alias.name);
    }

    if (itemWithoutExt === NESTED_ROUTE.PAGE_LOADER_FILE) {
      pageLoaderFile = itemPath;
    }

    if (itemWithoutExt === NESTED_ROUTE.PAGE_CONFIG_FILE) {
      pageConfigFile = itemPath;
    }

    if (itemWithoutExt === NESTED_ROUTE.PAGE_FILE) {
      pageRoute = createIndexRoute(
        {
          _component: replaceWithAlias(alias.basename, itemPath, alias.name),
        } as NestedRouteForCli,
        rootDir,
        itemPath,
        entryName,
        isMainEntry,
      );

      if (pageLoaderFile) {
        pageRoute.loader = pageLoaderFile;
      }
      if (pageConfigFile) {
        pageRoute.config = pageConfigFile;
      }
      route.children?.push(pageRoute);
    }

    if (itemWithoutExt === NESTED_ROUTE.SPLATE_LOADER_FILE) {
      splatLoaderFile = itemPath;
    }

    if (itemWithoutExt === NESTED_ROUTE.SPLATE_FILE) {
      splatRoute = createRoute(
        {
          _component: replaceWithAlias(alias.basename, itemPath, alias.name),
          path: '*',
        },
        rootDir,
        itemPath,
        entryName,
        isMainEntry,
      );

      if (splatLoaderFile) {
        splatRoute.loader = splatLoaderFile;
      }
      route.children?.push(splatRoute);
    }

    if (itemWithoutExt === NESTED_ROUTE.LOADING_FILE) {
      route.loading = replaceWithAlias(alias.basename, itemPath, alias.name);
    }

    if (itemWithoutExt === NESTED_ROUTE.ERROR_FILE) {
      route.error = replaceWithAlias(alias.basename, itemPath, alias.name);
    }
  }

  let finalRoute = createRoute(
    route,
    rootDir,
    path.join(dirname, `${NESTED_ROUTE.LAYOUT_FILE}.ts`),
    entryName,
    isMainEntry,
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

  /**
   * Make sure access /user, which renders the user/$.tsx component
   * - routes
   *  - user
   *    - $.tsx
   *  - layout.tsx
   */
  if (
    finalRoute.children &&
    finalRoute.children.length === 1 &&
    !finalRoute._component
  ) {
    const childRoute = finalRoute.children[0];
    if (childRoute.path === '*') {
      const path = `${finalRoute.path || ''}/${childRoute.path || ''}`;
      finalRoute = {
        ...childRoute,
        path,
      };
    }
  }

  return finalRoute;
};
