const path = require('path');

const kModuleToolsCliPath = path.resolve(
  __dirname,
  '../../../packages/solutions/module-tools/src/index.ts',
);

module.exports = {
  options: {
    plugins: {
      '@modern-js/module-tools': {
        cli: kModuleToolsCliPath,
        // 是否需要强制加载这个组件，跳过 loadPlugins 里面 filter 的检测逻辑
        forced: true,
      },
    },
  },
};
