import chalk from 'chalk';
import logger from 'consola';
import { formatPath } from '../utils';
import type { PackageJSON } from '..';

/**
 * Using "workspace:*" rather than "workspace:^a.b.c" in "devDependencies".
 *
 * @example correct
 * {
 *   "devDependencies": {
 *     "foo": "workspace:*"
 *   }
 * }
 *
 * @example incorrect
 * {
 *   "devDependencies": {
 *     "foo": "workspace:^1.0.0"
 *   }
 * }
 */
export function lintWorkspaceProtocol(packageJSONs: PackageJSON[]) {
  let failed = false;

  packageJSONs.forEach(({ path, content }) => {
    const { devDependencies } = content;
    if (devDependencies) {
      const incorrectKeys: string[] = [];

      for (const key in devDependencies) {
        const value = devDependencies[key];

        if (value.startsWith('workspace') && value !== 'workspace:*') {
          incorrectKeys.push(key);
        }
      }

      if (incorrectKeys.length) {
        failed = true;
        const name = chalk.yellow('Lint "devDependencies" failed.');
        logger.error(`${name}  ${formatPath(path)}
The following dependencies should using "workspace:*" rather than "workspace:^a.b.c":
 - ${incorrectKeys.join('\n - ')}`);
      }
    }
  });

  return failed;
}
