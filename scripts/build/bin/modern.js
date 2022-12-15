#!/usr/bin/env node --conditions=jsnext:source -r btsm

const path = require('path');

const kProjectRoot = path.resolve(__dirname, '../../..');

const kModuleToolsCliPath = path.resolve(
  kProjectRoot,
  'packages/solutions/module-tools/src/index.ts',
);

process.env.NODE_ENV = 'production';
process.env.CORE_INIT_OPTION_FILE = path.resolve(
  __dirname,
  '../src/cli_core_init.js',
);

const { cli } = require(`${kProjectRoot}/packages/cli/core/src/index.ts`);

cli.run({
  forceAutoLoadPlugins: true,
  internalPlugins: {
    cli: {
      '@modern-js/module-tools': {
        path: kModuleToolsCliPath,
        // 强制加载这个组件，跳过 loadPlugins 里面 filter 的检测逻辑
        forced: true,
      },
    },
  },
});
