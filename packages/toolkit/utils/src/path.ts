import path from 'path';
import { upath } from './compiled';

export const isRelativePath = (test: string): boolean =>
  /^\.\.?($|[\\/])/.test(test);

export const normalizeOutputPath = (s: string) => s.replace(/\\/g, '\\\\');
export const normalizeToPosixPath = (p: string | undefined) =>
  upath.normalizeSafe(path.normalize(p || ''));
