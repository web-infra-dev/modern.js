import fs from 'fs';
import path from 'path';
import {
  isReact18,
  normalizeToPosixPath,
  fs as fse,
  getCommand,
  JS_EXTENSIONS,
} from '@modern-js/utils';
import type { Entrypoint } from '@modern-js/types';
import type { Loader } from 'esbuild';
import { transform } from 'esbuild';
import { parse } from 'es-module-lexer';
import type { ImportStatement } from '../../types';
import {
  ACTION_EXPORT_NAME,
  FILE_SYSTEM_ROUTES_FILE_NAME,
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
  appDirectory,
  internalSrcAlias,
  internalDirAlias,
  runtimeConfigFile,
  customRuntimeConfig,
}: {
  entrypoint: Entrypoint;
  srcDirectory: string;
  appDirectory: string;
  internalSrcAlias: string;
  internalDirAlias: string;
  runtimeConfigFile: string | false;
  customRuntimeConfig: string | false;
}): ImportStatement[] => {
  const { entryName, fileSystemRoutes, customBootstrap, entry } = entrypoint;
  const imports = [
    {
      specifiers: [{ local: 'React' }],
      value: 'react',
    },
    {
      specifiers: [{ local: 'ReactDOM' }],
      value: isReact18(path.join(appDirectory))
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

  if (customRuntimeConfig) {
    imports.push({
      specifiers: [{ local: 'runtimeConfig' }],
      value: path.join(internalSrcAlias, runtimeConfigFile || ''),
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
) => {
  if (filePath.includes(base)) {
    return normalizeToPosixPath(
      path.join(alias, path.relative(base, filePath)),
    );
  } else {
    return filePath;
  }
};

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

export const hasLoader = async (filename: string, source?: string) => {
  let content = source;
  if (!source) {
    content = (await fse.readFile(filename, 'utf-8')).toString();
  }
  if (content) {
    const [, moduleExports] = await parseModule({
      source: content.toString(),
      filename,
    });
    return moduleExports.some(e => e.n === LOADER_EXPORT_NAME);
  }
  return false;
};

export const hasAction = async (filename: string, source?: string) => {
  let content = source;
  if (!source) {
    content = (await fse.readFile(filename, 'utf-8')).toString();
  }
  if (content) {
    const [, moduleExports] = await parseModule({
      source: content.toString(),
      filename,
    });
    return moduleExports.some(e => e.n === ACTION_EXPORT_NAME);
  }
  return false;
};

export const getServerLoadersFile = (
  internalDirectory: string,
  entryName: string,
) => {
  return path.join(internalDirectory, entryName, 'route-server-loaders.js');
};

export const getServerCombinedModueFile = (
  internalDirectory: string,
  entryName: string,
) => {
  return path.join(internalDirectory, entryName, 'server-loader-combined.js');
};

export const checkIsBuildCommands = () => {
  const buildCommands = [
    'dev',
    'start',
    'build',
    'inspect',
    'deploy',
    'dev-worker',
  ];
  const command = getCommand();

  return buildCommands.includes(command);
};

export const isSubDirOrEqual = (parent: string, child: string): boolean => {
  if (parent === child) {
    return true;
  }
  const relative = path.relative(parent, child);
  const isSubdir =
    relative && !relative.startsWith('..') && !path.isAbsolute(relative);
  return Boolean(isSubdir);
};
