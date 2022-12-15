const path = require('path');

const kProjectRoot = path.resolve(__dirname);
const kModuleToolsCliPath = path.resolve(
  kProjectRoot,
  'packages/solutions/module-tools/dist/cli.js',
);

const { cli: PluginModuleTools } = require(kModuleToolsCliPath);

module.exports = {
  plugins: [PluginModuleTools()],
};
