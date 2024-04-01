const { bundleConfig } = require('@scripts/build');

module.exports = {
  buildConfig: {
    ...bundleConfig,
    autoExternal: {
      dependencies: true,
      peerDependencies: false,
    },
  },
};
