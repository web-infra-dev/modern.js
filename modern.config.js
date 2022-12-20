const path = require('path');

const kProjectRoot = path.resolve(__dirname);
const kModuleToolsCliPath = path.resolve(
  kProjectRoot,
  'packages/solutions/monorepo-tools/dist/js/node/index.js',
);

const PluginMonorepoTools = require(kModuleToolsCliPath).default;

module.exports = {
  plugins: [PluginMonorepoTools()],
};
