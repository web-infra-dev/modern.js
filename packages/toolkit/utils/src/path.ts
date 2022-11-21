import path from 'path';
import os from 'os';
import fs from 'fs';
import { nanoid, upath, lodash as _ } from './compiled';

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

/**
 * Compile path string to RegExp.
 * @note Only support posix path.
 */
export function compilePathMatcherRegExp(
  match: string | RegExp,
  flags?: string,
) {
  if (typeof match !== 'string') {
    return match;
  }
  const normalized = normalizeToPosixPath(match);
  const escaped = _.escapeRegExp(normalized);
  return new RegExp(`${escaped}(?=\\W|$)`, flags);
}

/** @internal @see {@link upwardPaths} */
export const _joinPathParts = (
  _part: unknown,
  i: number,
  parts: _.List<string>,
) =>
  _(parts)
    .filter(part => !['/', '\\'].includes(part))
    .tap(parts => parts.unshift(''))
    .slice(0, i + 2)
    .join('/');

export function upwardPaths(start: string): string[] {
  return _(start)
    .split(/[/\\]/)
    .filter(Boolean)
    .map(_joinPathParts)
    .reverse()
    .push('/')
    .value();
}

export function getRealTemporaryDirectory() {
  let ret: string | null = null;
  try {
    ret = os.tmpdir();
    ret = fs.realpathSync(ret);
  } catch {}
  return ret;
}

export function splitPathString(str: string) {
  return str.split(/[\\/]/);
}
