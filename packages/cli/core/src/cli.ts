// 这个文件跟 bin/modern-js.js 基本一样
// 在开发阶段，因为 package.json 的 exports['./bin']['jsnext:source'] 配置
// 了这个文件，所以需要保留, 后续如果找到更好的方式之后会移除这个文件

import path from 'path';
import { cli } from '.';

const { version } = require('../package.json');

// XXX: 通过这个方式去掉了 package.json 里面对于 @modern-js/module-tools 的 devDependencies 依赖
// 然后可以正常的执行 modern build
const kModuleToolsCliPath = path.resolve(__dirname, '../../../solutions/module-tools/src/index.ts');

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

cli.run(process.argv.slice(2), {
  plugins: {
    '@modern-js/module-tools': {
      cli: kModuleToolsCliPath,
      // 是否需要强制加载这个组件，跳过 loadPlugins 里面 filter 的检测逻辑
      forced: true,
    },
  }
});
