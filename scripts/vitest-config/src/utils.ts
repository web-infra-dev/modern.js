import assert from 'assert';
import path from 'path';
import {
  applyMatcherReplacement,
  createDefaultPathMatchers,
  PathMatcher,
} from './pathSerializer';
import { isPathString, normalizeToPosixPath } from './path';

export const debug: typeof console.log = (...args) => {
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
    workspace = path.join(__dirname, '../../..'),
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
    pathMatchers,
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
