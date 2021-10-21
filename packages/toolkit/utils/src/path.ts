import path from 'path';
import upath from 'upath';

export const isRelativePath = (test: string): boolean =>
  /^\.\.?($|[\\/])/.test(test);

export const join = (...paths: string[]) =>
  upath.normalizeSafe(path.join(...paths));

export const resolve = (...paths: string[]) =>
  upath.normalizeSafe(path.resolve(...paths));

export const relative = (from: string, to: string) =>
  upath.normalizeSafe(path.relative(from, to));

export const basename = (p: string, ext?: string) =>
  upath.normalizeSafe(path.basename(p, ext));

export const dirname = (p: string) => upath.normalizeSafe(path.dirname(p));

export const extname = (p: string) => path.extname(p);

export const isAbsolute = (p: string) => path.isAbsolute(p);

export const normalize = (p: string) => upath.normalizeSafe(path.normalize(p));

export const { sep, win32, posix } = path;
