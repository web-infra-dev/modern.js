import os from 'os';
import assert from 'assert';
import path from 'path';
import { fs, normalizeToPosixPath } from '@modern-js/utils';
import _ from '@modern-js/utils/lodash';

export interface PathMatcher {
  match: string;
  mark: string;
}

export interface SnapshotSerializerOptions {
  replace: PathMatcher[];
}

/** @see {@link upwardPaths} */
export const joinPathParts = (
  _part: unknown,
  i: number,
  parts: _.List<string>,
) =>
  _(parts)
    .filter(part => part !== '/')
    .tap(parts => parts.unshift(''))
    .slice(0, i + 2)
    .join('/');

export function applyPathReplacer(val: string, mark: string, path: string) {
  return _.replace(val, path, mark);
}

export function upwardPaths(start: string): string[] {
  return _(start)
    .split('/')
    .filter(Boolean)
    .map(joinPathParts)
    .reverse()
    .push('/')
    .value();
}

export function compilePathMatcherSource(match: string | RegExp): string {
  if (typeof match === 'string') {
    const escaped = _.escapeRegExp(match);
    return `^${escaped}(?=/)|^${escaped}$`;
  }
  return match.source;
}

export function createSnapshotSerializer(options: SnapshotSerializerOptions) {
  const rootMatcher = _.find(options.replace, { mark: 'root' });
  assert(rootMatcher, 'root matcher is required');
  const pathMatchers: PathMatcher[] = [
    ...options.replace,
    { match: os.homedir(), mark: 'home' },
    { match: os.tmpdir(), mark: 'temp' },
    { match: fs.realpathSync(os.tmpdir()), mark: 'readTmp' },
    ..._(upwardPaths(rootMatcher.match))
      .map(match => ({ match, mark: 'unknown' }))
      .slice(1)
      .value(),
  ];

  const compiledMatchers = _(pathMatchers)
    .map('match')
    .map(compilePathMatcherSource)
    .value();
  const replacements: Record<string, string> = _(pathMatchers)
    .uniqBy('match')
    .map(({ match, mark }) => [
      normalizeToPosixPath(match),
      `<${_.upperCase(_.snakeCase(mark))}>`,
    ])
    .fromPairs()
    .value();

  const testing = new RegExp(compiledMatchers.join('|'));

  return {
    // match path-format string
    test: (val: unknown) =>
      typeof val === 'string' && val !== path.basename(val),
    print: (val: unknown) =>
      `"${(val as string)
        // normalize path to posix format
        .replace(/(?:[a-zA-Z]:)?\\/g, '/')
        // apply replacements
        .replace(testing, p => replacements[p])
        // escape string value just like vitest
        .replace(/"/g, '\\"')}"`,
  };
}
