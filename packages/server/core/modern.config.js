const { universalBuildConfig } = require('@scripts/build');

universalBuildConfig[0].esbuildOptions = options => {
  options.supported = {
    ...options.supported,
    'dynamic-import': true,
  };
  return options;
};

universalBuildConfig[1].esbuildOptions = options => {
  options.supported = {
    ...options.supported,
    'dynamic-import': true,
  };
  return options;
};

module.exports = {
  buildConfig: universalBuildConfig,
};
