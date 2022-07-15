import { dirname, isAbsolute, sep, posix } from 'path';
import { globby, findMonorepoRoot, isModernjsMonorepo } from '@modern-js/utils';
import type { NormalizedConfig } from '@modern-js/core';

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

  const modernjsMonorepo = isModernjsMonorepo(root);

  if (modernjsMonorepo) {
    const paths = globby
      .sync(posix.join(root, 'features', '**', 'package.json'), {
        ignore: ['**/node_modules/**/*'],
      })
      .map(pathname => dirname(pathname) + sep);

    return [...paths, ...include];
  }

  return include;
};
