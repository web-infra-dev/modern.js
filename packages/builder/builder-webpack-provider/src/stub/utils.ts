import type { GlobbyOptions } from '@modern-js/utils';
import fs, { PathLike } from 'fs';

export interface GlobContentJSONOptions extends GlobbyOptions {
  maxSize?: number;
}

export const globContentJSON = async (
  paths: string | string[],
  options?: GlobContentJSONOptions,
) => {
  const { globby, fs } = await import('@modern-js/utils');
  const files = await globby(paths, options);
  let totalSize = 0;
  const maxSize = 1024 * (options?.maxSize ?? 4096);
  const ret: Record<string, string> = {};
  for await (const file of files) {
    const { size } = await fs.stat(file);
    totalSize += size;
    if (maxSize && totalSize > maxSize) {
      throw new Error('too large');
    }
    ret[file] = await fs.readFile(file, 'utf-8');
  }
  return ret;
};

export const filenameToGlobExpr = (file: PathLike) =>
  fs.statSync(file).isDirectory() ? `${file}/**/*` : file;
