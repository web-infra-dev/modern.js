#!/usr/bin/env node --conditions=jsnext:source -r btsm

const path = require('path');
const fs = require('fs');

const kProjectRoot = path.resolve(__dirname, '../../..');

process.env.CORE_INIT_OPTION_FILE = path.resolve(
  __dirname,
  '../src/cli_core_init.js',
);

const distDir = path.join(process.cwd(), 'dist');
if (!fs.existsSync(distDir)) {
  require(`${kProjectRoot}/packages/cli/core/src/cli.ts`);
} else {
  // eslint-disable-next-line no-console
  console.log('The build directory `dist` already existed, skip this build');
  // IGNORE 非常简单的一个缓存策略，只要文件夹存在就不会再次执行
}
