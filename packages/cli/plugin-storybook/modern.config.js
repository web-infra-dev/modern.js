const { universalBuildConfig } = require('@modern-js/build-config');

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
