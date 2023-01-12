import fs from 'fs';
import path from 'path';
import { isReact18, normalizeToPosixPath, fs as fse } from '@modern-js/utils';
import type { Entrypoint } from '@modern-js/types';
import type { Loader } from 'esbuild';
import { transform } from 'esbuild';
import { parse } from 'es-module-lexer';
import type { ImportStatement } from '../types';
import {
  FILE_SYSTEM_ROUTES_FILE_NAME,
  JS_EXTENSIONS,
  LOADER_EXPORT_NAME,
} from './constants';

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
  internalDirectory,
}: {
  entrypoint: Entrypoint;
  srcDirectory: string;
  internalSrcAlias: string;
  internalDirAlias: string;
  internalDirectory: string;
}): ImportStatement[] => {
  const { entryName, fileSystemRoutes, customBootstrap, entry } = entrypoint;
  const imports = [
    {
      specifiers: [{ local: 'React' }],
      value: 'react',
    },
    {
      specifiers: [{ local: 'ReactDOM' }],
      value: isReact18(path.join(internalDirectory, '../../'))
        ? 'react-dom/client'
        : 'react-dom',
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
        `${internalDirAlias}/${entryName}/${FILE_SYSTEM_ROUTES_FILE_NAME.replace(
          '.js',
          '',
        )}`,
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

export const isPageComponentFile = (filePath: string) => {
  if (/\.(d|test|spec|e2e)\.(js|jsx|ts|tsx)$/.test(filePath)) {
    return false;
  }

  if (['.js', '.jsx', '.ts', '.tsx'].includes(path.extname(filePath))) {
    return true;
  }

  return false;
};

export const replaceWithAlias = (
  base: string,
  filePath: string,
  alias: string,
) => normalizeToPosixPath(path.join(alias, path.relative(base, filePath)));

export const parseModule = async ({
  source,
  filename,
}: {
  source: string;
  filename: string;
}) => {
  let content = source;

  if (JS_EXTENSIONS.some(ext => filename.endsWith(ext))) {
    const result = await transform(content, {
      loader: path.extname(filename).slice(1) as Loader,
      format: 'esm',
    });
    content = result.code;
  }

  // eslint-disable-next-line @typescript-eslint/await-thenable
  return await parse(content);
};

export const hasLoader = async (filename: string) => {
  const source = await fse.readFile(filename);
  const [, moduleExports] = await parseModule({
    source: source.toString(),
    filename,
  });
  return moduleExports.some(e => e.n === LOADER_EXPORT_NAME);
};

export const getServerLoadersFile = (
  internalDirectory: string,
  entryName: string,
) => {
  return path.join(internalDirectory, entryName, 'route-server-loaders.js');
};
