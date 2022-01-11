// 这个文件跟 bin/modern-js.js 基本一样
// 在开发阶段，因为 package.json 的 exports['./bin']['jsnext:source'] 配置
// 了这个文件，所以需要保留, 后续如果找到更好的方式之后会移除这个文件

import { cli } from '.';

const { version } = require('../package.json');

process.env.MODERN_JS_VERSION = version;
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV =
    // eslint-disable-next-line no-nested-ternary
    ['build', 'start', 'deploy'].includes(process.argv[2])
      ? 'production'
      : process.argv[2] === 'test'
      ? 'test'
      : 'development';
}

cli.run(process.argv.slice(2));
