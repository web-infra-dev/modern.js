import path from 'path';
import { fs as fse, normalizeToPosixPath } from '@modern-js/utils';
import { transform } from 'esbuild';
import type { Loader } from 'esbuild';
import { parse } from 'es-module-lexer';
import { ACTION_EXPORT_NAME, JS_EXTENSIONS } from './constants';

export const getPathWithoutExt = (filename: string) => {
  const extname = path.extname(filename);
  return filename.slice(0, -extname.length);
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
