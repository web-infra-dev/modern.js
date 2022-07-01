import path, { isAbsolute } from 'path';
import {
  findMonorepoRoot,
  getMonorepoPackages,
  isModernjsMonorepo,
} from '@modern-js/utils';
import type { NormalizedConfig } from '@modern-js/core';

const shouldIncludePackage = (
  p: {
    name: string;
    path: string;
  },
  include: (string | RegExp)[],
) => include.some(i => (i instanceof RegExp ? i.test(p.name) : p.name === i));

// webpack include only allow absolute path or RegExp
const formatInclude = (include: string | RegExp) => {
  if (typeof include === 'string') {
    if (isAbsolute(include)) {
      return include;
    }
    return new RegExp(include);
  }
  return include;
};

export const getSourceIncludes = (
  appDirectory: string,
  config: NormalizedConfig,
) => {
  const { source } = config;

  const include = (source?.include || []).map(formatInclude);

  const root = findMonorepoRoot(appDirectory);

  if (!root) {
    return include;
  }

  const packages = getMonorepoPackages(root);
  const modernjsMonorepo = isModernjsMonorepo(root);

  const paths = packages
    .filter(
      p =>
        (modernjsMonorepo && p.path.startsWith(path.join(root, 'features'))) ||
        shouldIncludePackage(p, include),
    )
    .map(p => p.path);

  return [...paths, ...include];
};
