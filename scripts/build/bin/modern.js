#!/usr/bin/env node --conditions=jsnext:source -r btsm

const path = require('path');
const fs = require('fs');

const kProjectRoot = path.resolve(__dirname, '../../..');

process.env.CORE_INIT_OPTION_FILE = path.resolve(
  __dirname,
  '../src/cli_core_init.js',
);

function getLastModifiedRecursive(candidate) {
  // 检测路径不存在，并且为 node_modules 下目录跳过
  if (/node_modules/.test(candidate) || !fs.existsSync(candidate)) {
    return 0;
  }
  const stats = fs.statSync(candidate);
  let candidateTimes = [stats.mtimeMs, stats.ctimeMs, stats.birthtimeMs];
  if (stats.isDirectory()) {
    const files = fs.readdirSync(candidate);
    candidateTimes = candidateTimes.concat(
      files.map(f => getLastModifiedRecursive(path.join(candidate, f))),
    );
  }
  return Math.max.apply(null, candidateTimes);
}

const distDir = path.join(process.cwd(), 'dist');
const pkgLastModifyTime = getLastModifiedRecursive(process.cwd());
const distLastModifyTime = getLastModifiedRecursive(distDir);

if (
  pkgLastModifyTime > distLastModifyTime ||
  process.env.DISABLE_IGNORE_BUILD
) {
  require(`${kProjectRoot}/packages/cli/core/src/cli.ts`);
} else {
  // eslint-disable-next-line no-console
  console.log(
    `The build directory has not been modified and does not need to be rebuilt`,
  );
  // IGNORE 如果目录源码的修改时间小于等于 dist 的时间跳过重新构建节省时间
}
