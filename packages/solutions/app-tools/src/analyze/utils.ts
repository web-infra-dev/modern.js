import fs from 'fs';
import path from 'path';
import { normalizeToPosixPath } from '@modern-js/utils';
import type { Entrypoint } from '@modern-js/types';
import type { ImportStatement } from '@modern-js/core';
import { FILE_SYSTEM_ROUTES_FILE_NAME } from './constants';

export const walkDirectory = (dir: string): string[] =>
  fs.readdirSync(dir).reduce<string[]>((previous, filename) => {
    const filePath = path.join(dir, filename);
    if (fs.statSync(filePath).isDirectory()) {
      return [...previous, ...walkDirectory(filePath)];
    } else {
      return [...previous, filePath];
    }
  }, []);

export const getDefaultImports = ({
  entrypoint,
  srcDirectory,
  internalSrcAlias,
  internalDirAlias,
}: {
  entrypoint: Entrypoint;
  srcDirectory: string;
  internalSrcAlias: string;
  internalDirAlias: string;
}): ImportStatement[] => {
  const { entryName, fileSystemRoutes, customBootstrap, entry } = entrypoint;
  const imports = [
    {
      specifiers: [{ local: 'React' }],
      value: 'react',
    },
    {
      specifiers: [{ imported: 'createApp' }, { imported: 'bootstrap' }],
      value: '@modern-js/runtime',
    },
    customBootstrap && {
      specifiers: [{ local: 'customBootstrap' }],
      value: normalizeToPosixPath(
        customBootstrap.replace(srcDirectory, internalSrcAlias),
      ),
    },
  ].filter(Boolean) as ImportStatement[];

  if (fileSystemRoutes) {
    const route: ImportStatement = {
      specifiers: [{ imported: 'routes' }],
      value: normalizeToPosixPath(
        `${internalDirAlias}/${entryName}/${FILE_SYSTEM_ROUTES_FILE_NAME}`,
      ),
    };
    if (fileSystemRoutes.globalApp) {
      imports.push({
        specifiers: [{ local: 'App' }],
        value: normalizeToPosixPath(
          fileSystemRoutes.globalApp.replace(srcDirectory, internalSrcAlias),
        ),
      });
    } else {
      route.initialize = 'const App = false;';
    }

    imports.push(route);
  } else {
    imports.push({
      specifiers: [{ local: 'App' }],
      value: normalizeToPosixPath(
        entry.replace(srcDirectory, internalSrcAlias),
      ),
    });
  }

  return imports;
};

export const isRouteComponentFile = (filePath: string) => {
  if (/\.(d|test|spec|e2e)\.(js|jsx|ts|tsx)$/.test(filePath)) {
    return false;
  }

  if (['.js', '.jsx', '.ts', '.tsx'].includes(path.extname(filePath))) {
    return true;
  }

  return false;
};
