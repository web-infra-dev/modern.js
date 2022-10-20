import os from 'os';
import assert from 'assert';
import { fs, isPathString, normalizeToPosixPath } from '@modern-js/utils';
import _ from '@modern-js/utils/lodash';

export interface PathMatcher<T extends string | RegExp = string | RegExp> {
  match: T;
  mark: string | ((substring: string, ...args: any[]) => string);
}

export interface SnapshotSerializerOptions {
  replace: PathMatcher[];
}

export const debug: typeof console.log = (...args) => {
  // eslint-disable-next-line no-console
  process.env.DEBUG_MODERNJS_VITEST && console.log(...args);
};

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
    .split(/[/\\]/)
    .filter(Boolean)
    .map(joinPathParts)
    .reverse()
    .push('/')
    .value();
}

export function compilePathMatcherRegExp(match: string | RegExp) {
  if (typeof match === 'string') {
    const escaped = _.escapeRegExp(match);
    return new RegExp(`^${escaped}(?=/)|^${escaped}$`);
  }
  return match;
}

export const matchUpwardPathsAsUnknown = (p: string) =>
  _(upwardPaths(normalizeToPosixPath(p)))
    .map(match => ({ match, mark: 'unknown' }))
    .slice(1, -1)
    .value();

export function applyMatcherReplacement(matchers: PathMatcher[], str: string) {
  return matchers.reduce((ret, matcher) => {
    const regex = compilePathMatcherRegExp(matcher.match);
    const replacer = (substring: string, ...args: any[]): string => {
      const ret =
        typeof matcher.mark === 'string'
          ? matcher.mark
          : matcher.mark(substring, ...args);
      return `<${_.snakeCase(ret).toUpperCase()}>`;
    };
    return ret.replace(regex, replacer);
  }, str);
}

export const createDefaultPathMatchers = (root: string) => {
  const ret: PathMatcher[] = [
    {
      match: /(?<=\/)(\.pnpm\/.+?\/node_modules)(?=\/)/,
      mark: 'pnpmInner',
    },
    { match: os.homedir(), mark: 'home' },
  ];
  try {
    ret.push({ match: fs.realpathSync(os.tmpdir()), mark: 'temp' });
  } catch {}
  ret.push({ match: os.tmpdir(), mark: 'temp' });
  ret.push(...matchUpwardPathsAsUnknown(root));
  return ret;
};

export function createSnapshotSerializer(options: SnapshotSerializerOptions) {
  const rootMatcher = _.find(options.replace, {
    mark: 'root',
  }) as PathMatcher<string>;
  assert(rootMatcher, 'root matcher is required');
  const pathMatchers: PathMatcher[] = [
    ...options.replace,
    ...createDefaultPathMatchers(rootMatcher.match),
  ];

  pathMatchers
    .filter(matcher => typeof matcher.match === 'string')
    .forEach(
      matcher =>
        (matcher.match = normalizeToPosixPath(matcher.match as string)),
    );

  return {
    // match path-format string
    test: (val: unknown) => typeof val === 'string' && isPathString(val),
    print: (val: unknown) => {
      const normalized = normalizeToPosixPath(val as string);
      const replaced = applyMatcherReplacement(
        pathMatchers,
        normalized,
      ).replace(/"/g, '\\"');
      debug(`Vitest snapshot serializer: ${val} -> ${replaced}`);
      return `"${replaced}"`;
    },
  };
}
