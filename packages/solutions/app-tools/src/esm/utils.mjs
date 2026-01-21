import { createRequire } from 'module';
import path from 'path';
import { getAliasConfig } from '@modern-js/utils';
import { createMatchPath as oCreateMatchPath } from '@modern-js/utils/tsconfig-paths';

const require = createRequire(import.meta.url);
export function createMatchPath({ alias, appDir, tsconfigPath }) {
  const aliasConfig = getAliasConfig(alias, {
    appDirectory: appDir,
    tsconfigPath,
  });

  const { paths = {}, absoluteBaseUrl = './' } = aliasConfig;

  const tsPaths = Object.keys(paths).reduce((o, key) => {
    let tsPath = paths[key];
    // Do some special handling for Modern.js's internal alias, we can drop it in the next version
    if (
      typeof tsPath === 'string' &&
      key.startsWith('@') &&
      tsPath.startsWith('@')
    ) {
      try {
        tsPath = require.resolve(tsPath, {
          paths: [appDir],
        });
      } catch {}
    }

    if (typeof tsPath === 'string' && path.isAbsolute(tsPath)) {
      tsPath = path.relative(absoluteBaseUrl, tsPath);
    }
    if (typeof tsPath === 'string') {
      tsPath = [tsPath];
    }
    return {
      ...o,
      [`${key}`]: tsPath,
    };
  }, {});

  return oCreateMatchPath(absoluteBaseUrl, tsPaths);
}
