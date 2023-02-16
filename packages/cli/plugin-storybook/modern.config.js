const { universalBuildConfig } = require('@scripts/build');

module.exports = {
  buildConfig: [
    ...universalBuildConfig,
    {
      input: [],
      dts: false,
      copy: {
        patterns: [
          {
            from: './template',
            context: __dirname,
            to: './js/template',
          },
        ],
      },
    },
  ],
};
