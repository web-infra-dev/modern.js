import fs from 'fs';
import path from 'path';
import {
  JS_EXTENSIONS,
  fs as fse,
  normalizeToPosixPath,
} from '@modern-js/utils';
import { parse } from 'es-module-lexer';
import type { Loader } from 'esbuild';
import { transform } from 'esbuild';
import { ACTION_EXPORT_NAME, LOADER_EXPORT_NAME } from '../constants';

export const walkDirectory = (dir: string): string[] =>
  fs.readdirSync(dir).reduce<string[]>((previous, filename) => {
    const filePath = path.join(dir, filename);
    if (fs.statSync(filePath).isDirectory()) {
      return [...previous, ...walkDirectory(filePath)];
    } else {
      return [...previous, filePath];
    }
  }, []);

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

  return parse(content);
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

export const getServerCombinedModuleFile = (
  internalDirectory: string,
  entryName: string,
) => {
  return path.join(internalDirectory, entryName, 'server-loader-combined.js');
};

export const getPathWithoutExt = (filename: string) => {
  const extname = path.extname(filename);
  return extname ? filename.slice(0, -extname.length) : filename;
};
