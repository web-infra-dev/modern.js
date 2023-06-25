/**
 * 修改 exports.* 配置
 * 将 export.'.': './src/index.ts' 转换为 export.'.': './dist/index.js'
 * 当作为 demo 项目调试的时候使用: pnpm debug-mode
 * 关闭调试模式：pnpm debug-mode off
 */
const path = require('path');
const { fs } = require('@modern-js/utils');
const detectIndent = require('detect-indent');

const ON = 'on';
const OFF = 'off';
const operation = process.argv[2] === OFF ? OFF : ON;

const appDir = path.join(__dirname, '..');
const pkgPath = path.join(appDir, './package.json');
const tempPkgPath = path.join(appDir, 'temp-package.json');

console.debug('operation is', operation);

if (operation === ON) {
  if (!fs.pathExistsSync(tempPkgPath)) {
    fs.copyFileSync(pkgPath, tempPkgPath);
  }

  const pkgJson = require(pkgPath);
  const originalExports = {
    '.': './src/index.ts',
    './defineConfig': './src/config/defineConfig.ts',
  };
  const debugExports = {
    '.': './dist/index.js',
    './defineConfig': './dist/config/defineConfig.js',
  };

  if (operation === ON) {
    pkgJson.exports = debugExports;
  } else {
    pkgJson.exports = originalExports;
  }

  const output = fs.readFileSync(pkgPath, 'utf-8');
  const indent = detectIndent(output);
  fs.writeJSONSync(pkgPath, pkgJson, { spaces: indent.amount });
} else if (operation === OFF && fs.pathExistsSync(tempPkgPath)) {
  fs.copyFileSync(tempPkgPath, pkgPath);
  fs.removeSync(tempPkgPath);
}
