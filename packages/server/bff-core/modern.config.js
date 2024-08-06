const { nodeBuildConfig } = require('@scripts/build');

nodeBuildConfig[0].esbuildOptions = options => {
  options.supported = {
    ...options.supported,
    'dynamic-import': true,
  };
  return options;
};

nodeBuildConfig[1].esbuildOptions = options => {
  options.supported = {
    ...options.supported,
    'dynamic-import': true,
  };
  return options;
};

module.exports = {
  buildConfig: nodeBuildConfig,
};
