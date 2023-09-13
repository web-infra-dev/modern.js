const { nodeBuildConfig } = require('@scripts/build');

module.exports = {
  buildConfig: nodeBuildConfig.map(config => {
    return { ...config, disableSwcTransform: true, externalHelpers: false };
  }),
};
