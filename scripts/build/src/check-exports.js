/**
 * Make sure `exports` and `publishConfig.exports` to be consistent.
 */
const { join } = require('path');
const fs = require('fs-extra');
const logger = require('signale');

function isEqualArray(arr1, arr2) {
  if (arr1.length !== arr2.length) {
    return false;
  }
  return arr1.every(key => arr2.includes(key));
}

function checkExports() {
  const cwd = process.cwd();
  const pkgPath = join(cwd, 'package.json');

  if (fs.existsSync(pkgPath)) {
    const pkgJson = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));

    if (pkgJson.exports && pkgJson.publishConfig?.exports) {
      const keys1 = Object.keys(pkgJson.exports);
      const keys2 = Object.keys(pkgJson.publishConfig.exports);

      if (!isEqualArray(keys1, keys2)) {
        logger.warn(`
   The exports field of ${pkgPath} is incorrect,
   Please check if some fields are missing in "exports" or "publishConfig.exports".
`);
        // eslint-disable-next-line no-process-exit
        process.exit(1);
      }
    }
  }
}

module.exports = {
  checkExports,
};
