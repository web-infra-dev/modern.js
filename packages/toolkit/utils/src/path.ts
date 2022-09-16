import path from 'path';
import os from 'os';
import fs from 'fs';
import { nanoid, upath } from './compiled';

export const isPathString = (test: string): boolean =>
  path.posix.basename(test) !== test || path.win32.basename(test) !== test;

export const isRelativePath = (test: string): boolean =>
  /^\.\.?($|[\\/])/.test(test);

export const normalizeOutputPath = (s: string) => s.replace(/\\/g, '\\\\');
export const normalizeToPosixPath = (p: string | undefined) =>
  upath
    .normalizeSafe(path.normalize(p || ''))
    .replace(/^([a-zA-Z]+):/, (_, m: string) => `/${m.toLowerCase()}`);

export const getTemplatePath = (prefix?: string) => {
  const tmpRoot = fs.realpathSync(os.tmpdir());
  const parts = [tmpRoot];
  prefix && parts.push(prefix);
  parts.push(nanoid());
  return path.resolve(...parts);
};
