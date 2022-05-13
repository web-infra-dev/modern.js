import logger from 'consola';
import { formatPath, isArrayEqual } from '../utils';
import type { PackageJSON } from '..';

export function lintExportsField(packageJSONs: PackageJSON[]) {
  let failed = false;

  packageJSONs.forEach(({ path, content }) => {
    if (content.exports && content.publishConfig?.exports) {
      const keys1 = Object.keys(content.exports);
      const keys2 = Object.keys(content.publishConfig.exports);

      if (!isArrayEqual(keys1, keys2)) {
        failed = true;
        logger.error(`
The "exports" field of ${formatPath(path)} is incorrect,
Please check if some fields are missing in "exports" or "publishConfig.exports".`);
      }
    }
  });

  return failed;
}
