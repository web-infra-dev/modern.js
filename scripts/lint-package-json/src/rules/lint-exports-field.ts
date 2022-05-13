import chalk from 'chalk';
import logger from 'consola';
import { formatPath, isArrayEqual } from '../utils';
import type { PackageJSON } from '..';

/**
 * Make sure "exports" and "publishConfig.exports" contains same keys.
 *
 * @example correct
 * {
 *   "exports": {
 *     "foo": "./src/foo.ts"
 *   },
 *   "publishConfig": {
 *     "foo": "./dist/foo.js"
 *   }
 * }
 *
 * @example incorrect
 * {
 *   "exports": {
 *     "foo": "./src/foo.ts",
 *     "bar": "./src/bar.ts"
 *   },
 *   "publishConfig": {
 *     "foo": "./dist/foo.js"
 *   }
 * }
 */
export function lintExportsField(packageJSONs: PackageJSON[]) {
  let failed = false;

  packageJSONs.forEach(({ path, content }) => {
    if (content.exports && content.publishConfig?.exports) {
      const keys1 = Object.keys(content.exports);
      const keys2 = Object.keys(content.publishConfig.exports);

      if (!isArrayEqual(keys1, keys2)) {
        failed = true;

        const name = chalk.yellow('Lint "exports" failed.');
        logger.error(`${name}  ${formatPath(path)}
Please check the "exports" and "publishConfig.exports" fields to see if some key is missing.`);
      }
    }
  });

  return failed;
}
