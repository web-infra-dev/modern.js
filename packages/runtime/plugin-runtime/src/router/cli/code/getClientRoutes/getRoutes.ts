import path from 'path';
import { fs } from '@modern-js/utils';
import type {
  Entrypoint,
  NestedRouteForCli,
  PageRoute,
} from '@modern-js/types';
import { makeLegalIdentifier } from '../makeLegalIdentifier';
import {
  FILE_SYSTEM_ROUTES_COMPONENTS_DIR,
  FILE_SYSTEM_ROUTES_DYNAMIC_REGEXP,
  FILE_SYSTEM_ROUTES_INDEX,
  FILE_SYSTEM_ROUTES_LAYOUT,
} from '../../constants';
import { replaceWithAlias } from '../utils';
import { debug, findLayout, shouldSkip, getRouteWeight } from './utils';

const compName = (srcDirectory: string, filePath: string) => {
  const legalCompName = makeLegalIdentifier(
    path.relative(srcDirectory, filePath),
  );
  return `Comp_${legalCompName}`;
};

const layoutNameAbbr = (filePath: string) => {
  const prefix = 'L_';
  const dirName = path.dirname(filePath).split('/').pop() || '';
  return `${prefix}${makeLegalIdentifier(dirName)}`;
};

const parents: PageRoute[] = [];

/* eslint-disable no-param-reassign */
const recursiveReadDir = ({
  dir,
  routes,
  basePath = '/',
  srcDirectory,
  srcAlias,
}: {
  dir: string;
  routes: PageRoute[];
  basePath: string;
  srcDirectory: string;
  srcAlias: string;
}) => {
  let hasDynamicRoute = false;
  let resetParent = false;
  let parent = parents[parents.length - 1];

  const layout = findLayout(dir);

  if (layout) {
    if (basePath === '/') {
      throw new Error(`should use _app instead of _layout in ${dir}`);
    } else {
      const alias = replaceWithAlias(srcDirectory, layout, srcAlias);
      const componentName = compName(srcDirectory, layout);
      const route: PageRoute = {
        path: `${basePath.substring(0, basePath.length - 1)}`,
        children: [],
        _component: alias,
        component: componentName,
        parent,
        type: 'page',
      };
      parent = route;
      resetParent = true;
      routes.push(route);
      parents.push(route);
      routes = route.children as PageRoute[];
    }
  }

  for (const relative of fs.readdirSync(dir)) {
    const filePath = path.join(dir, relative);

    if (!shouldSkip(filePath)) {
      const filename = path.basename(filePath, path.extname(filePath));
      const alias = replaceWithAlias(srcDirectory, filePath, srcAlias);
      const componentName = compName(srcDirectory, filePath);
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

      const route: PageRoute = {
        path: `${basePath}${
          dynamicRouteMatched
            ? `:${dynamicRouteMatched[1].replace(/\$$/, '?')}${
                dynamicRouteMatched[2]
              }`
            : filename
        }`,
        _component: alias,
        component: componentName,
        parent,
        type: 'page',
      };

      if (fs.statSync(filePath).isDirectory()) {
        recursiveReadDir({
          dir: filePath,
          routes,
          basePath: `${route.path}/`,
          srcDirectory,
          srcAlias,
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
      }

      routes.push(route);
    }
  }

  if (resetParent) {
    parents.pop();
  }
};
/* eslint-enable  no-param-reassign */

const normalizeNestedRoutes = (
  nested: PageRoute[],
  internalComponentsDir: string,
  internalDirectory: string,
  internalDirAlias: string,
): PageRoute[] => {
  const flat = (routes: PageRoute[]): PageRoute[] =>
    routes.reduce<PageRoute[]>(
      (memo, route) =>
        memo.concat(
          Array.isArray(route.children) ? flat(route.children) : [route],
        ),
      [],
    );

  const generate = (route: PageRoute) => {
    const codes = [];

    let lastComponent = route.component;

    const imports = [
      `import React from 'react';`,
      `import ${lastComponent} from '${route._component}'`,
    ];

    // eslint-disable-next-line no-param-reassign, no-cond-assign
    while ((route = route.parent!)) {
      const layoutComponent = route.component;
      const layoutComponentAbbr = layoutNameAbbr(route._component);
      imports.push(`import ${layoutComponent} from '${route._component}';`);

      const currentComponent = `${layoutComponentAbbr}_${lastComponent}`;
      codes.push(
        `const ${currentComponent} = props => <${layoutComponent} Component={${lastComponent}} {...props} />;`,
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
      _component: replaceWithAlias(internalDirectory, file, internalDirAlias),
    };
  };

  const normalized = flat(nested).map(route =>
    route.parent
      ? { ...route, ...generate(route), parent: undefined }
      : { ...route, parent: undefined },
  );

  return normalized;
};

export const getClientRoutes = ({
  entrypoint,
  srcDirectory,
  srcAlias,
  internalDirectory,
  internalDirAlias,
}: {
  entrypoint: Entrypoint;
  srcDirectory: string;
  srcAlias: string;
  internalDirectory: string;
  internalDirAlias: string;
}): (NestedRouteForCli | PageRoute)[] => {
  const { entryName, pageRoutesEntry } = entrypoint;
  if (!pageRoutesEntry) {
    return [];
  }
  if (!fs.existsSync(pageRoutesEntry)) {
    throw new Error(
      `generate file system routes error, ${pageRoutesEntry} directory not found.`,
    );
  }

  if (
    !(
      fs.existsSync(pageRoutesEntry) &&
      fs.statSync(pageRoutesEntry).isDirectory()
    )
  ) {
    throw new Error(
      `generate file system routes error, ${pageRoutesEntry} should be directory.`,
    );
  }

  let routes: PageRoute[] = [];

  recursiveReadDir({
    dir: pageRoutesEntry,
    routes,
    basePath: '/',
    srcDirectory,
    srcAlias,
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
    internalDirAlias,
  );

  parents.length = 0;

  // FIXME: support more situations
  routes.sort((a, b) => {
    const delta = getRouteWeight(a.path!) - getRouteWeight(b.path!);

    if (delta === 0) {
      return a.path!.length - b.path!.length;
    }

    return delta;
  });

  debug(`fileSystem routes: %o`, routes);

  return routes;
};
