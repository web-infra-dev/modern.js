const { universalBuildConfig } = require('@scripts/build');

module.exports = {
  buildConfig: universalBuildConfig.map(item => {
    return item;
  }),
};
