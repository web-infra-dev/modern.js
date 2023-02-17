import fs, { PathLike } from 'fs';
import { GlobbyOptions, upath } from '@modern-js/utils';
import _ from '@modern-js/utils/lodash';

export interface GlobContentJSONOptions extends GlobbyOptions {
  maxSize?: number;
}

export const globContentJSON = async (
  paths: PathLike | PathLike[],
  options?: GlobContentJSONOptions,
) => {
  const { globby, fs } = await import('@modern-js/utils');
  const _paths = _.castArray(paths).map(filenameToGlobExpr);
  const files = await globby(_paths, options);
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

const filenameToGlobExpr = (file: PathLike) => {
  let _file = upath.normalizeSafe(file.toString());
  fs.statSync(file).isDirectory() && (_file += '/**/*');
  return _file;
};
