#!/usr/bin/env node

const path = require('path');

const kProjectRoot = path.resolve(__dirname, '..');

const kModuleToolsCliPath = path.resolve(
  kProjectRoot,
  'node_modules/@modern-js/module-tools-npm/dist/index.js',
);

process.env.NODE_ENV = 'production';
process.env.CORE_INIT_OPTION_FILE = path.resolve(
  __dirname,
  '../src/cli_core_init.js',
);

const { cli } = require(
  `${kProjectRoot}/node_modules/@modern-js/core-npm/dist/index.js`,
);

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
