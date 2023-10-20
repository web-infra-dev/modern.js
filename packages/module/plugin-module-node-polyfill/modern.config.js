const { tscLikeBuildConfig } = require('@scripts/build');

module.exports = {
  buildConfig: tscLikeBuildConfig.map(config => {
    return {
      ...config,
      input: ['src', '!src/globals.js'],
      copy: {
        patterns: [
          {
            from: 'globals.js',
          },
        ],
      },
    };
  }),
};
