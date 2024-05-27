/* eslint-disable max-lines */
import * as path from 'path';
import { fs, normalizeToPosixPath } from '@modern-js/utils';
import type { NestedRouteForCli } from '@modern-js/types';
import { getPathWithoutExt, hasAction, replaceWithAlias } from './utils';
import { JS_EXTENSIONS, NESTED_ROUTE } from './constants';

const conventionNames = Object.values(NESTED_ROUTE);

const replaceDynamicPath = (routePath: string) => {
  return routePath.replace(/\[(.*?)\]/g, ':$1');
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

export const optimizeRoute = (
  routeTree: NestedRouteForCli,
): NestedRouteForCli[] => {
  if (!routeTree.children || routeTree.children.length === 0) {
    return [routeTree];
  }

  const { children } = routeTree;
  if (
    !routeTree._component &&
    !routeTree.error &&
    !routeTree.loading &&
    !routeTree.config &&
    !routeTree.clientData
  ) {
    const newRoutes = children.map(child => {
      const routePath = `${routeTree.path ? routeTree.path : ''}${
        child.path ? `/${child.path}` : ''
      }`;

      const newRoute: NestedRouteForCli = {
        ...child,
        path: routePath.replace(/\/\//g, '/'),
      };

      // the index is removed when the route path exists
      if (routePath.length > 0) {
        delete newRoute.index;
      } else {
        delete newRoute.path;
      }
      return newRoute;
    });
    return Array.from(new Set(newRoutes)).flatMap(optimizeRoute);
  } else {
    const optimizedChildren = routeTree.children.flatMap(optimizeRoute);
    return [{ ...routeTree, children: optimizedChildren }];
  }
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
): Promise<NestedRouteForCli | NestedRouteForCli[] | null> => {
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
  let pageConfigFile = '';
  let pageClientData = '';
  let pageData = '';
  let pageAction = '';
  let splatLoaderFile = '';
  let splatRoute = null;
  let splatConfigFile = '';
  let splatClientData = '';
  let splatData = '';
  let splatAction = '';

  const items = await fs.readdir(dirname);

  for (const item of items) {
    const itemPath = path.join(dirname, item);
    const itemPathWithAlias = getPathWithoutExt(
      replaceWithAlias(alias.basename, itemPath, alias.name),
    );
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
      if (childRoute && !Array.isArray(childRoute)) {
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
        route.loader = itemPathWithAlias;
      }
    }

    if (itemWithoutExt === NESTED_ROUTE.LAYOUT_CLIENT_LOADER) {
      route.clientData = itemPathWithAlias;
    }

    if (itemWithoutExt === NESTED_ROUTE.LAYOUT_DATA_FILE) {
      route.data = itemPathWithAlias;
      if (await hasAction(itemPath)) {
        route.action = itemPathWithAlias;
      }
    }

    if (itemWithoutExt === NESTED_ROUTE.LAYOUT_CONFIG_FILE) {
      if (!route.config) {
        route.config = itemPathWithAlias;
      }
    }

    if (itemWithoutExt === NESTED_ROUTE.LAYOUT_FILE) {
      route._component = itemPathWithAlias;
    }

    if (itemWithoutExt === NESTED_ROUTE.PAGE_LOADER_FILE) {
      pageLoaderFile = itemPathWithAlias;
    }

    if (itemWithoutExt === NESTED_ROUTE.PAGE_CLIENT_LOADER) {
      pageClientData = itemPathWithAlias;
    }

    if (itemWithoutExt === NESTED_ROUTE.PAGE_DATA_FILE) {
      pageData = itemPathWithAlias;
      if (await hasAction(itemPath)) {
        pageAction = itemPathWithAlias;
      }
    }

    if (itemWithoutExt === NESTED_ROUTE.PAGE_CONFIG_FILE) {
      pageConfigFile = itemPathWithAlias;
    }

    if (itemWithoutExt === NESTED_ROUTE.PAGE_FILE) {
      pageRoute = createIndexRoute(
        {
          _component: itemPathWithAlias,
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
      if (pageData) {
        pageRoute.data = pageData;
      }
      if (pageClientData) {
        pageRoute.clientData = pageClientData;
      }
      if (pageAction) {
        pageRoute.action = pageAction;
      }
      route.children?.push(pageRoute);
    }

    if (itemWithoutExt === NESTED_ROUTE.SPLATE_LOADER_FILE) {
      splatLoaderFile = itemPathWithAlias;
    }

    if (itemWithoutExt === NESTED_ROUTE.SPLATE_CLIENT_DATA) {
      splatClientData = itemPathWithAlias;
    }

    if (itemWithoutExt === NESTED_ROUTE.SPLATE_CONFIG_FILE) {
      if (!route.config) {
        splatConfigFile = replaceWithAlias(
          alias.basename,
          itemPath,
          alias.name,
        );
      }
    }

    if (itemWithoutExt === NESTED_ROUTE.SPLATE_DATA_FILE) {
      splatData = itemPathWithAlias;
      if (await hasAction(itemPath)) {
        splatAction = itemPathWithAlias;
      }
    }

    if (itemWithoutExt === NESTED_ROUTE.SPLATE_FILE) {
      splatRoute = createRoute(
        {
          _component: itemPathWithAlias,
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
      if (splatClientData) {
        splatRoute.clientData = splatClientData;
      }
      if (splatData) {
        splatRoute.data = splatData;
      }
      if (splatConfigFile) {
        splatRoute.config = splatConfigFile;
      }
      if (splatAction) {
        splatRoute.action = splatAction;
      }
      route.children?.push(splatRoute);
    }

    if (itemWithoutExt === NESTED_ROUTE.LOADING_FILE) {
      route.loading = itemPathWithAlias;
    }

    if (itemWithoutExt === NESTED_ROUTE.ERROR_FILE) {
      route.error = itemPathWithAlias;
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

  // eslint-disable-next-line no-multi-assign
  const childRoutes = (finalRoute.children = finalRoute.children?.filter(
    childRoute => childRoute,
  ));

  if (
    childRoutes &&
    childRoutes.length === 0 &&
    !finalRoute.index &&
    !finalRoute._component
  ) {
    return null;
  }

  /**
   * Make sure access /user, which renders the user/$.tsx component
   * - routes
   *  - user
   *    - $.tsx
   *  - layout.tsx
   */
  if (childRoutes && childRoutes.length === 1 && !finalRoute._component) {
    const childRoute = childRoutes[0];
    if (childRoute.path === '*') {
      const path = `${finalRoute.path || ''}/${childRoute.path || ''}`;
      finalRoute = {
        ...childRoute,
        path,
      };
    }
  }

  if (isRoot && !finalRoute._component) {
    throw new Error(
      'The root layout component is required, make sure the routes/layout.tsx file exists.',
    );
  }

  return finalRoute;
};
