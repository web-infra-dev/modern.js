import path from 'path';
import {
  findMonorepoRoot,
  getMonorepoPackages,
  isModernjsMonorepo,
} from '@modern-js/utils';
import type { NormalizedConfig } from '@modern-js/core';
import { memoize } from './memoize';

const shouldIncludePackage = (
  p: {
    name: string;
    path: string;
  },
  include: (string | RegExp)[],
) => include.some(i => (i instanceof RegExp ? i.test(p.name) : p.name === i));

export const getSourceIncludes = memoize<(string | RegExp)[]>(
  (appDirectory: string, config: NormalizedConfig) => {
    const { source } = config;

    const include = (source as any)?.includeConfig || [];

    const root = findMonorepoRoot(appDirectory);

    if (!root) {
      return include;
    }

    const packages = getMonorepoPackages(root);

    const modernjsMonorepo = isModernjsMonorepo(root);

    const paths = packages
      .filter(
        p =>
          (modernjsMonorepo &&
            p.path.startsWith(path.join(root, 'features'))) ||
          shouldIncludePackage(p, include),
      )
      .map(p => p.path);

    return [...paths, ...include];
  },
);
