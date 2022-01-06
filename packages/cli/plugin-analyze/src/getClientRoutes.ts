import path from 'path';
import {
  fs,
  createDebugger,
  findExists,
  INTERNAL_DIR_ALAIS,
  INTERNAL_SRC_ALIAS,
  normalizeToPosixPath,
} from '@modern-js/utils';
import { makeLegalIdentifier } from '@rollup/pluginutils';
import type { Entrypoint, Route } from '@modern-js/types';
import {
  FILE_SYSTEM_ROUTES_COMPONENTS_DIR,
  FILE_SYSTEM_ROUTES_DYNAMIC_REGEXP,
  FILE_SYSTEM_ROUTES_GLOBAL_LAYOUT,
  FILE_SYSTEM_ROUTES_IGNORED_REGEX,
  FILE_SYSTEM_ROUTES_INDEX,
  FILE_SYSTEM_ROUTES_LAYOUT,
  JS_EXTENSIONS,
} from './constants';

export type { Route };

const debug = createDebugger('get-client-routes');

export interface Identifier {
  name: string;
  path: string;
}

const findLayout = (dir: string) =>
  findExists(
    JS_EXTENSIONS.map(ext =>
      path.resolve(dir, `${FILE_SYSTEM_ROUTES_LAYOUT}${ext}`),
    ),
  );

const shouldSkip = (file: string): boolean => {
  // should not skip directory.
  if (fs.statSync(file).isDirectory()) {
    return false;
  }

  const ext = path.extname(file);

  if (
    FILE_SYSTEM_ROUTES_IGNORED_REGEX.test(file) ||
    !JS_EXTENSIONS.includes(ext) ||
    FILE_SYSTEM_ROUTES_GLOBAL_LAYOUT === path.basename(file, ext)
  ) {
    return true;
  }

  return false;
};

const replaceWithAlias = (base: string, filePath: string, alias: string) =>
  normalizeToPosixPath(path.join(alias, path.relative(base, filePath)));

const parents: Route[] = [];

/* eslint-disable max-statements, no-param-reassign */
const recursiveReadDir = ({
  dir,
  routes,
  basePath = '/',
  srcDirectory,
}: {
  dir: string;
  routes: Route[];
  basePath: string;
  srcDirectory: string;
}) => {
  let hasDynamicRoute = false;
  let resetParent = false;
  let parent = parents[parents.length - 1];

  const layout = findLayout(dir);

  if (layout) {
    if (basePath === '/') {
      throw new Error(`should use _app instead of _layout in ${dir}`);
    } else {
      const alias = replaceWithAlias(srcDirectory, layout, INTERNAL_SRC_ALIAS);
      const route: Route = {
        path: `${basePath.substring(0, basePath.length - 1)}`,
        exact: false,
        routes: [],
        _component: alias,
        component: makeLegalIdentifier(alias),
        parent,
      };
      parent = route;
      resetParent = true;
      routes.push(route);
      parents.push(route);
      routes = route.routes as Route[];
    }
  }

  for (const relative of fs.readdirSync(dir)) {
    const filePath = path.join(dir, relative);

    if (!shouldSkip(filePath)) {
      const filename = path.basename(filePath, path.extname(filePath));
      const alias = replaceWithAlias(
        srcDirectory,
        filePath,
        INTERNAL_SRC_ALIAS,
      );

      const dynamicRouteMatched =
        FILE_SYSTEM_ROUTES_DYNAMIC_REGEXP.exec(filename);

      if (dynamicRouteMatched) {
        if (hasDynamicRoute) {
          throw new Error(
            `Can't set two dynamic route in one directory: ${dir}`,
          );
        } else {
          hasDynamicRoute = true;
        }
      }

      const route: Route = {
        path: `${basePath}${
          dynamicRouteMatched
            ? `:${dynamicRouteMatched[1]}${dynamicRouteMatched[2]}`
            : filename
        }`,
        _component: alias,
        component: makeLegalIdentifier(alias),
        exact: true,
        parent,
      };

      if (fs.statSync(filePath).isDirectory()) {
        recursiveReadDir({
          dir: filePath,
          routes,
          basePath: `${route.path}/`,
          srcDirectory,
        });
        continue;
      }

      if (filename === FILE_SYSTEM_ROUTES_LAYOUT) {
        continue;
      }

      if (filename === FILE_SYSTEM_ROUTES_INDEX) {
        route.path =
          basePath === '/'
            ? basePath
            : `${basePath.substring(0, basePath.length - 1)}`;
      }

      if (filename === '404' && basePath === '/') {
        route.path = '*';
        route.exact = false;
      }

      routes.push(route);
    }

    if (resetParent) {
      parents.pop();
    }
  }
};
/* eslint-enable max-statements, no-param-reassign */

const normalizeNestedRoutes = (
  nested: Route[],
  internalComponentsDir: string,
  internalDirectory: string,
) => {
  const flat = (routes: Route[]): Route[] =>
    routes.reduce<Route[]>(
      (memo, route) =>
        memo.concat(Array.isArray(route.routes) ? flat(route.routes) : [route]),
      [],
    );

  const generate = (route: Route) => {
    const codes = [];

    let lastComponent = `Comp_${route.component}`;

    const imports = [
      `import React from 'react';`,
      `import ${lastComponent} from '${route._component}'`,
    ];

    // eslint-disable-next-line no-param-reassign, no-cond-assign
    while ((route = route.parent!)) {
      imports.push(`import ${route.component} from '${route._component}';`);

      const currentComponent = `${lastComponent}_${route.component}`;

      codes.push(
        `const ${currentComponent} = props => <${route.component} Component={${lastComponent}} {...props} />;`,
      );

      lastComponent = currentComponent;
    }

    const file = path.resolve(internalComponentsDir, `${lastComponent}.jsx`);

    fs.outputFileSync(
      file,
      `${imports.join('\n')}\n${codes.join(
        '\n',
      )}\nexport default ${lastComponent}`,
    );

    return {
      component: lastComponent,
      _component: replaceWithAlias(internalDirectory, file, INTERNAL_DIR_ALAIS),
    };
  };

  const normalized = flat(nested).map(route =>
    route.parent
      ? { ...route, ...generate(route), parent: undefined }
      : { ...route, parent: undefined },
  );

  return normalized;
};

const getRouteWeight = (route: string) =>
  route === '*' ? 999 : route.split(':').length - 1;

export const getClientRoutes = ({
  entrypoint,
  srcDirectory,
  internalDirectory,
}: {
  entrypoint: Entrypoint;
  srcDirectory: string;
  internalDirectory: string;
}) => {
  const { entry, entryName } = entrypoint;

  if (!fs.existsSync(entry)) {
    throw new Error(
      `generate file system routes error, ${entry} direcotry not found.`,
    );
  }

  if (!(fs.existsSync(entry) && fs.statSync(entry).isDirectory())) {
    throw new Error(
      `generate file system routes error, ${entry} should be directory.`,
    );
  }

  let routes: Route[] = [];

  recursiveReadDir({
    dir: entry,
    routes,
    basePath: '/',
    srcDirectory,
  });

  const internalComponentsDir = path.resolve(
    internalDirectory,
    `${entryName}/${FILE_SYSTEM_ROUTES_COMPONENTS_DIR}`,
  );

  fs.emptyDirSync(internalComponentsDir);

  routes = normalizeNestedRoutes(
    routes,
    internalComponentsDir,
    internalDirectory,
  );

  parents.length = 0;

  // FIXME: support more situations
  routes.sort((a, b) => {
    const delta = getRouteWeight(a.path) - getRouteWeight(b.path);

    if (delta === 0) {
      return a.path.length - b.path.length;
    }

    return delta;
  });

  debug(`fileSystem routes: %o`, routes);

  return routes;
};
