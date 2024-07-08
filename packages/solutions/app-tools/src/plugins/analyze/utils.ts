import fs from 'fs';
import path from 'path';
import {
  normalizeToPosixPath,
  getCommand,
  JS_EXTENSIONS,
} from '@modern-js/utils';
import type { Loader } from 'esbuild';
import { transform } from 'esbuild';
import { parse } from 'es-module-lexer';

export const walkDirectory = (dir: string): string[] =>
  fs.readdirSync(dir).reduce<string[]>((previous, filename) => {
    const filePath = path.join(dir, filename);
    if (fs.statSync(filePath).isDirectory()) {
      return [...previous, ...walkDirectory(filePath)];
    } else {
      return [...previous, filePath];
    }
  }, []);

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
