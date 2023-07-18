const { universalBuildConfig } = require('@scripts/build');

module.exports = {
  buildConfig: universalBuildConfig.map((item, index) => {
    if (index === 0) {
      item.copy = {
        patterns: [
          {
            from: './compiled',
            context: __dirname,
            to: '../compiled',
          },
        ],
      };
    }
    return item;
  }),
};
