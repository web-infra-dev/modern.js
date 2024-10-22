const path = require('path');
const { universalBuildConfig } = require('@scripts/build');

const commonConfig = {
  esbuildOptions: options => ({
    ...options,
    supported: {
      ...options.supported,
      'dynamic-import': true,
    },
  }),
  copy: {
    patterns: [
      {
        from: '**/*.mjs',
        context: path.join(__dirname, './src'),
        to: '',
      },
    ],
  },
  input: ['src', '!**/*.mjs'],
};

for (let i = 0; i < 3; i++) {
  universalBuildConfig[i] = {
    ...universalBuildConfig[i],
    ...commonConfig,
  };
}

module.exports = {
  buildConfig: universalBuildConfig,
};
