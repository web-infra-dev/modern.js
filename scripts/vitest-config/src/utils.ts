import assert from 'assert';
import {
  applyMatcherReplacement,
  createDefaultPathMatchers,
  isPathString,
  normalizeToPosixPath,
  PathMatcher,
  findMonorepoRoot,
} from '@modern-js/utils';

export const debug: typeof console.log = (...args) => {
  // eslint-disable-next-line no-console
  process.env.DEBUG_MODERNJS_VITEST && console.log(...args);
};

export interface SnapshotSerializerOptions {
  cwd?: string;
  workspace?: string;
  replace?: PathMatcher[];
}

export function createSnapshotSerializer(options?: SnapshotSerializerOptions) {
  const {
    cwd = process.cwd(),
    workspace = findMonorepoRoot(cwd),
    replace: customMatchers = [],
  } = options || {};
  assert(cwd, 'cwd is required');
  assert(workspace, 'workspace is required');
  const pathMatchers: PathMatcher[] = [
    { mark: 'root', match: cwd },
    { mark: 'workspace', match: workspace },
    ...customMatchers,
    ...createDefaultPathMatchers(workspace),
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
