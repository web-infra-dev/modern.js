import assert from 'assert';
import {
  applyMatcherReplacement,
  createDefaultPathMatchers,
  isPathString,
  normalizeToPosixPath,
} from '@modern-js/utils';
import _ from '@modern-js/utils/lodash';

export interface PathMatcher<T extends string | RegExp = string | RegExp> {
  match: T;
  mark: string | ((substring: string, ...args: any[]) => string);
}

export const debug: typeof console.log = (...args) => {
  // eslint-disable-next-line no-console
  process.env.DEBUG_MODERNJS_VITEST && console.log(...args);
};

export interface SnapshotSerializerOptions {
  replace: PathMatcher[];
}

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
